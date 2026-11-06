# MusicMap handoff

Read the parent `PROJECT_GUIDE.md` and this project's `README.md` before work. This is the active portfolio cleanup project; the other projects remain queued.

- Preserve the existing emerald, off-white, dotted-canvas design unless the user requests a different direction. The current implementation is ready for user visual feedback, not an explicitly approved final design.
- `/` is the introduction and personal collection board. `/discover` is the guest-accessible music web. `/home` redirects to `/discover`.
- Use Node 24 (minimum 22.13). SQLite is built into Node; no external database service is configured.
- Run `npm run dev -- --hostname 127.0.0.1` and preview `http://127.0.0.1:3000`. Local OAuth uses that exact origin; avoid switching between it and localhost during sign-in.
- `.env.local` contains existing credentials. Never print or commit their values. `.env.example` documents the required names.
- Keep Last.fm/Spotify requests server-side. Never expose provider access or refresh tokens in the client session. Derive library ownership from the signed session, never a client-supplied user ID.
- Guest discovery, canonical Spotify embeds, saved artists/songs, and responsive graph navigation are core behavior. Do not replace working interactions with decorative controls or invented personalization.
- Use weighted adjacency neighborhoods and bounded LRU caches; an MST does not fit this exploration flow. Preserve exact snapshots for history and prevent stale requests from replacing the current selection.
- Keep fallbacks visibly labeled as curated. Last.fm song rankings and Spotify embed ordering may differ.
- Validate with `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and then `npm run test:integration`. The integration test uses a temporary database, synthetic accounts, and port 3107; it does not complete real Spotify OAuth.
- Stop the dev server before building or running production integration tests: both servers use `.next`. Restart the preview afterward. Use `npm run format` for consistent formatting.
- SQLite requires a persistent disk for deployment. The current setup is local/single-server; do not claim serverless durability or a shared distributed cache.
- Current remaining verification: the user's own Spotify sign-in and a real-account save/reload flow. The OAuth handoff reached Spotify's login page, and automated callback/library tests passed.
