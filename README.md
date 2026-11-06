# MusicMap

A music discovery web: start with an artist, follow related artists, listen along, and keep a personal collection.

Built with Next.js App Router, React, TypeScript, Last.fm, Spotify OAuth, and SQLite.

## Run locally

Use **Node.js 24** (minimum 22.13; the database uses the built-in `node:sqlite` module).

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
| `MUSICMAP_DB_PATH` | Optional SQLite file path; defaults to `data/musicmap.sqlite` |

In your Spotify application's settings, register this **exact** redirect URI:

```text
http://127.0.0.1:3000/api/auth/callback/spotify
```

Spotify requires explicit loopback IP addresses for HTTP development callbacks; `localhost` callbacks are no longer allowed. See [Spotify redirect URI requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri). Development-mode apps may require the listener to be allowlisted and are subject to Spotify's account and quota restrictions.

The schema is created automatically on the first account/library operation. Secrets, database files, and SQLite sidecar files under `data/` are excluded from Git. Do not use `NEXT_PUBLIC_` variables for credentials.

## Demo walkthrough

1. Click **Start discovering**. Guests can explore immediately.
2. Pick a starting point or search for any artist. Search supports arrow keys, Enter, and Escape.
3. Click a leaf: the web gathers inward, the selected artist becomes the center, and a new neighborhood unfolds.
4. Listen using the adjacent Spotify artist player. The separate top-song list comes from Last.fm; each song opens Spotify search.
5. Use the arrows to revisit exact neighborhoods, or copy an artist link.
6. Connect Spotify to create an account. Save an artist or song with the plus button; click the checkmark to remove it.
7. Open **Your collection** on the home page. The board previews three saved artists and three songs; the sidebar opens larger lists. Suggestions are explicitly editorial starting points, not claimed personalized predictions.

Saving affects the **MusicMap account library**, not the user's Spotify follows, saved tracks, or playlists.

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

Spotify OAuth establishes a stable provider account ID. The JWT callback upserts the profile in SQLite; provider access and refresh tokens stay in the encrypted HTTP-only session cookie and are never copied into the browser-visible session.

Library endpoints derive ownership from the signed session. Prepared statements, foreign keys, a composite unique key, validation, and same-origin mutation checks protect the collection. Duplicate saves are idempotent; one user cannot read or delete another user's entries.

SQLite uses WAL mode and an index on user and save time. It is suitable for local demos or a single Node server with a persistent disk. **Ephemeral/serverless deployment needs durable storage or a database migration**; multiple instances also need shared caching/rate limiting. No cloud database or deployment is configured by this change.

### API boundaries

Last.fm provides related artists and top-song rankings. Spotify supplies catalog identity, artwork, optional personal starting points, and the built-in artist player. Guests use server-side app credentials for catalog lookups.

Spotify's [February 2026 development-mode changes](https://developer.spotify.com/documentation/web-api/references/changes/february-2026) removed the artist top-tracks endpoint. MusicMap uses the official artist embed instead. Embed playback, previews, and availability are controlled by Spotify and may depend on the listener, browser, region, and account.

No API keys are required for the small curated demo. Without live credentials or during an outage, supported starting points still have explicitly labeled editorial connections. Artist artwork falls back to initials.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:integration
```

Core tests cover LRU recency, TTL, coalescing, failure retries, cyclic graph neighborhoods, library validation, trusted embeds, persistence, deduplication, and account isolation.

The integration test starts the **production build** on port 3107 with a temporary SQLite database, synthetic test sessions, disabled external API credentials, and an isolated test secret. It verifies authenticated saves/removals, ownership, CSRF rejection, token privacy, guest routes, and outage fallbacks. It does not sign into a real Spotify account. Run it after building, while no development server is changing the same `.next` directory.

The dependency overrides pin patched PostCSS and minimatch versions within the existing Next.js 15 / ESLint setup. Recheck them when upgrading the framework.

## Source map

- `src/components/node-map/`: exploration state, history, graph, and animations
- `src/lib/music.ts`: Last.fm/Spotify orchestration and server caches
- `src/lib/cache.ts`, `src/lib/graph.ts`: LRU and client neighborhood model
- `src/lib/auth.ts`, `src/lib/db.ts`: identity and persistence
- `src/app/api/library/`: authenticated library API
- `src/components/LibraryProvider.tsx`: shared account collection state
- `src/components/MusicBoard.tsx`: personal home dashboard
