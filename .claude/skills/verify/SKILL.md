---
name: verify
description: Build, launch and drive this repo's web app to verify changes end-to-end (auth bypass, local PostgreSQL without Docker, Playwright recipe).
---

# Verify changes in the running web app

## Build & launch

```bash
pnpm install --frozen-lockfile
pnpm db:generate                 # required before anything imports @repo/db
pnpm --filter web dev            # web app on http://localhost:3001
```

## Database without Docker (remote/CI containers)

`pnpm db:up` needs Docker, which is unavailable in remote sessions. PostgreSQL 16
is installed locally — run it as `nobody` on port 5434 (matches DATABASE_URL in
`apps/web/.env.local.example`):

```bash
mkdir -p /tmp/pgqa && chown nobody /tmp/pgqa
su -s /bin/bash nobody -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pgqa/data -U postgres --auth=trust -E UTF8 > /tmp/pgqa/initdb.log 2>&1 && /usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgqa/data -o '-p 5434 -k /tmp/pgqa' -l /tmp/pgqa/pg.log start"
psql -h localhost -p 5434 -U postgres -c "ALTER USER postgres PASSWORD 'postgres'; " 
psql -h localhost -p 5434 -U postgres -c "CREATE DATABASE music_theory_dev;"
cp -n .env.example .env; cp -n apps/web/.env.local.example apps/web/.env.local
pnpm db:migrate:dev
```

## Auth bypass (email OTP not available offline)

Auth.js uses database sessions (Prisma adapter). Insert a user + session row and
set the session cookie directly:

```bash
psql -h localhost -p 5434 -U postgres -d music_theory_dev -c \
  "INSERT INTO users (id, email, role, updated_at) VALUES ('qa-user-1', 'qa@example.com', 'admin', NOW());
   INSERT INTO sessions (id, session_token, user_id, expires) VALUES ('qa-sess-1', 'qa-session-token-123', 'qa-user-1', NOW() + interval '7 days');"
```

Cookie: `authjs.session-token=qa-session-token-123` (admin role unlocks all pages).

## Driving with Playwright

Chromium executable: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
(the bare `/opt/pw-browsers/chromium` path is a directory, not the binary).
Install `playwright` in the scratchpad dir, add the cookie via
`context.addCookies`, then drive.

Flows worth driving on `/progressions`:
- Select tonic/mode (first two `<select>`s), read chord chips per progression card
  (`span.font-mono` inside the card).
- Suggestion buttons are `button.group.flex.flex-col`; the roman numeral is the
  `span.font-mono` inside (chord labels vary with the richness profile, e.g. "Am7"
  not "Am" — match on the roman, not the chord).
- Clicking a suggestion appends to the sequence (`.cursor-grab` chips); matched
  progression chips get `.bg-primary.text-primary-foreground`.
- "Tonal krydder" toggle is the `<label>` with that text.

## Gotchas

- `/progressions` 307-redirects to `/login` without the session cookie.
- The saved-progressions API needs the DB; without it the page still renders
  (fetch errors are caught).
