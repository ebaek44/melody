# musicweb. handoff

Read the parent `PROJECT_GUIDE.md` and this project's `README.md` before work. This is the active portfolio cleanup project; the other projects remain queued.

- Preserve the existing emerald, off-white, dotted-canvas design unless the user requests a different direction. The user explicitly requires the name **musicweb.**, lowercase with the period. The remaining visual choices are ready for feedback, not an explicitly approved final design.
- `/` is the introduction and personal collection board. `/discover` is the guest-accessible music web. `/home` redirects to `/discover`.
- Use Node 24 (minimum 22.13). Accounts and libraries use hosted Postgres via `pg`; `DATABASE_URL` (or legacy `POSTGRES_URL`) must be configured. No SQLite fallback or Vercel filesystem writes are allowed.
- Run `npm run dev -- --hostname 127.0.0.1` and preview `http://127.0.0.1:3000`. Local OAuth uses that exact origin; avoid switching between it and localhost during sign-in.
- `.env.local` contains existing credentials. Never print or commit their values. `.env.example` documents the required names.
- Keep Last.fm/Spotify requests server-side. Never expose provider access or refresh tokens in the client session. Derive library ownership from the signed session, never a client-supplied user ID.
- Guest discovery, canonical Spotify embeds, saved artists/songs, and responsive graph navigation are core behavior. Do not replace working interactions with decorative controls or invented personalization.
- Use weighted adjacency neighborhoods and bounded LRU caches; an MST does not fit this exploration flow. Preserve exact snapshots for history and prevent stale requests from replacing the current selection.
- Keep fallbacks visibly labeled as curated. Last.fm song rankings and Spotify embed ordering may differ.
- Validate with `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and then `npm run test:integration`. The integration test uses an isolated Postgres wire endpoint, fresh application processes, synthetic accounts, and port 3107; it does not complete real Spotify OAuth.
- Stop the dev server before building or running production integration tests: both servers use `.next`. Restart the preview afterward. Use `npm run format` for consistent formatting.
- Vercel uses the hosted Postgres pool with `attachDatabasePool`; keep queries asynchronous and parameterized. Schema setup is idempotent and serialized across cold starts. Use `npm run db:check` to verify credentials without printing them. The local Postgres helper and embedded SQL tests never replace the hosted production database. Discovery caches remain per process.
- Hosted Neon database `neon-gray-fence` is connected to the melody Vercel project for Production and Preview; the schema and a rolled-back write/read probe were verified. Do not create another database. Remaining work is publishing the local Postgres/branding changes after push authorization and verifying deployed Spotify sign-in plus save/reload. The specifically authorized Vercel project is accessible; the old general-dashboard access rejection no longer blocks this project.
