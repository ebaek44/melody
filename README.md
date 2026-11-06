# musicweb.

A music discovery web: start with an artist, follow related artists, listen along, and keep a personal collection.

Built with Next.js App Router, React, TypeScript, Last.fm, Spotify OAuth, and hosted Postgres.

## Run locally

Use **Node.js 24** (minimum 22.13). Accounts use Postgres through the `pg` driver; the application does not write a database file to the deployment filesystem.

```sh
npm ci
cp .env.example .env.local
# Fill in .env.local; preserve it if you already have one.
npm run dev -- --hostname 127.0.0.1
```

Open **http://127.0.0.1:3000**. Use that address consistently for sign-in.

Configure these server-only environment variables:

| Variable | Purpose |
| --- | --- |
| `NEXTAUTH_URL` | `http://127.0.0.1:3000` locally; your HTTPS origin in production |
| `NEXTAUTH_SECRET` | A random secret, e.g. generated with `openssl rand -base64 32` |
| `SPOTIFY_CLIENT_ID` | Spotify application client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify application secret |
| `LASTFM_API_KEY` | Last.fm API key for artist search, similarity, and top songs |
| `DATABASE_URL` | Required Postgres connection string for accounts and saved libraries; use the provider’s pooled URL on Vercel |

In your Spotify application's settings, register this **exact** redirect URI:

```text
http://127.0.0.1:3000/api/auth/callback/spotify
```

Spotify requires explicit loopback IP addresses for HTTP development callbacks; `localhost` callbacks are no longer allowed. See [Spotify redirect URI requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri). Development-mode apps may require the listener to be allowlisted and are subject to Spotify's account and quota restrictions.

The schema is created automatically on the first account/library operation. `npm run db:setup` (or `npm run db:check`) verifies the connection and initializes it explicitly. The setup is idempotent, uses the `musicmap` Postgres schema, and serializes concurrent first-use setup with a transaction advisory lock. No database connection is needed at build time.

Secrets and development data under `data/` are excluded from Git. Do not use `NEXT_PUBLIC_` variables for credentials. `POSTGRES_URL` is also accepted for older Vercel integrations; `DATABASE_URL` takes precedence. There is no SQLite fallback.

### Deploy the database with Vercel

1. In the Vercel project, open **Storage** and add **Neon Postgres**, or connect an existing Postgres database. The [Neon integration](https://vercel.com/marketplace/neon/neon) can supply `DATABASE_URL` to the selected project environments.
2. Connect the database to **Production**. Use a separate database/branch for **Preview** deployments so previews do not edit production collections.
3. Verify `DATABASE_URL`, `NEXTAUTH_SECRET`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `LASTFM_API_KEY` in the project environment settings. Set `NEXTAUTH_URL` to the actual production HTTPS origin.
4. Register `https://YOUR-DOMAIN/api/auth/callback/spotify` in Spotify's app settings. Match the deployed domain exactly.
5. Deploy the updated code after the variables are configured. The first sign-in creates the profile and schema; no manual SQL copy/paste or local file upload is needed.
6. Sign in, save an artist and a song, reload, then check again after a redeployment. The saved collection should remain in the hosted database.

This repository contains the Postgres implementation; it cannot create a hosted database or populate Vercel environment variables without access to those accounts. Run `npm run db:check` with the real connection string configured privately to verify the hosted connection. Never paste credentials into chat or commit them.

### Optional local Postgres for development

If you do not want development to use the hosted database, run `npm run db:local` in another terminal. This starts a PGlite Postgres engine bound to `127.0.0.1:5433`, with development data under ignored `data/postgres/`. Set this only in your local `.env.local`:

```text
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/postgres?sslmode=disable
```

Then run `npm run db:setup` and `npm run dev -- --hostname 127.0.0.1`. The application uses the same Postgres driver and schema locally and on Vercel. PGlite is a development/test dependency and is not deployed as the production database.

## Demo walkthrough

1. Click **Start discovering**. Guests can explore immediately.
2. Pick a starting point or search for any artist. Search supports arrow keys, Enter, and Escape.
3. Click a leaf: the web gathers inward, the selected artist becomes the center, and a new neighborhood unfolds.
4. Listen using the adjacent Spotify artist player. The separate top-song list comes from Last.fm; each song opens Spotify search.
5. Use the arrows to revisit exact neighborhoods, or copy an artist link.
6. Connect Spotify to create an account. Save an artist or song with the plus button; click the checkmark to remove it.
7. Open **Your collection** on the home page. The board previews three saved artists and three songs; the sidebar opens larger lists. Suggestions are explicitly editorial starting points, not claimed personalized predictions.

Saving affects the **musicweb account library**, not the user's Spotify follows, saved tracks, or playlists.

## How it works

### Weighted artist graph

Last.fm similarity results become directed adjacency lists: a center artist plus up to six unique neighbors, carrying the provider's similarity weights. Only the current neighborhood is rendered. SVG edges and responsive radial coordinates avoid a continuous force simulation.

An MST is intentionally unnecessary: the goal is to explore related neighbors, not connect every known artist with a minimum total edge cost. A spanning tree would discard useful relationships and cycles. Graph snapshots preserve the exact center and leaves for back/forward navigation.

### Caching and request efficiency

- Server LRU caches are bounded Maps: promotion and eviction are O(1).
- Artist neighborhoods: 150 entries, one-hour TTL.
- Spotify metadata: 500 entries, six-hour TTL; incomplete fallback metadata expires after one minute.
- Artist search: 100 entries, ten-minute TTL.
- Client graph snapshots: 80 entries, fifteen-minute TTL.
- Identical in-flight neighborhood and app-token requests are coalesced.
- Related-artist metadata is enriched three requests at a time.
- App credentials are cached for fifty minutes. API requests time out rather than leaving the interface stuck.
- Failed discovery requests are not kept in the long-lived cache. Known artists get an explicitly labeled, thirty-second curated fallback; unknown artists get a retryable error.
- Client requests are canceled/superseded during navigation so late responses cannot overwrite the selected artist.

These caches are per process, not distributed. Restarting the server clears them.

### Accounts and persistence

Spotify OAuth establishes a stable provider account ID. The JWT callback awaits an upsert of the profile in Postgres; provider access and refresh tokens stay in the encrypted HTTP-only session cookie and are never copied into the browser-visible session.

Library endpoints derive ownership from the signed session. Prepared statements, foreign keys, a composite unique key, validation, and same-origin mutation checks protect the collection. Duplicate saves are idempotent; one user cannot read or delete another user's entries.

Postgres stores the collection outside Vercel functions, so records survive cold starts and redeployments. The runtime uses a module-global pool capped at three connections, a five-second idle timeout, bounded connection/query timeouts, and Vercel's `attachDatabasePool` lifecycle hook. Use a provider-pooled connection string, keep the function and database in nearby regions, and retain the provider's TLS configuration (hosted connections enforce certificate verification). See [Vercel connection pooling guidance](https://vercel.com/kb/guide/connection-pooling-with-functions).

Schema setup and SQL calls are asynchronous, including the OAuth profile write. Queries are parameterized, saved items retain a composite unique key, and user/date lookups are indexed. Failed schema initialization is retryable. The schema setup is additive; future schema changes should use explicit migrations. Discovery caches remain per process, so scaled deployments may benefit from shared caching/rate limiting later.

### API boundaries

Last.fm provides related artists and top-song rankings. Spotify supplies catalog identity, artwork, optional personal starting points, and the built-in artist player. Guests use server-side app credentials for catalog lookups.

Spotify's [February 2026 development-mode changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) removed the artist top-tracks endpoint. musicweb uses the official artist embed instead. Embed playback, previews, and availability are controlled by Spotify and may depend on the listener, browser, region, and account.

No API keys are required for the small curated demo. Without live credentials or during an outage, supported starting points still have explicitly labeled editorial connections. Artist artwork falls back to initials.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
```

Core tests cover LRU recency, TTL, coalescing, failure retries, cyclic graph neighborhoods, library validation, trusted embeds, Postgres configuration/TLS, actual SQL execution, persistence across connection pools, deduplication, and account isolation.

The integration test starts an isolated PostgreSQL SQL engine with a TCP endpoint, then runs the **production build** on port 3107 against it through the real `pg` driver. It uses synthetic test sessions, disabled external music API credentials, and an isolated test secret. It verifies authenticated saves/removals, ownership, CSRF rejection, token privacy, guest routes, outage fallbacks, and persistence after the application process is stopped and restarted. It also verifies that missing database configuration returns HTTP 503 while guest exploration still loads.

Tests never use your hosted database or provider accounts, and do not complete real Spotify OAuth. They verify the production code path locally; a live Vercel/Neon deployment still needs its own connection and OAuth smoke test. Run integration tests after building, while no development server is changing the same `.next` directory.

The dependency overrides pin patched PostCSS and minimatch versions within the existing Next.js 15 / ESLint setup. Recheck them when upgrading the framework.

## Source map

- `src/components/node-map/`: exploration state, history, graph, and animations
- `src/lib/music.ts`: Last.fm/Spotify orchestration and server caches
- `src/lib/cache.ts`, `src/lib/graph.ts`: LRU and client neighborhood model
- `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/database/`: identity, hosted Postgres, and schema setup
- `src/app/api/library/`: authenticated library API
- `src/components/LibraryProvider.tsx`: shared account collection state
- `src/components/MusicBoard.tsx`: personal home dashboard
