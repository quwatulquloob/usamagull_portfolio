# Usama Gul — Portfolio on Cloudflare Workers + D1

Single Cloudflare Worker serving the public portfolio site, the admin panel, and
a JSON API — all on one domain, with all dynamic content persisted in Cloudflare D1.

```
┌────────────────────────────────────────────────────────────┐
│                  Cloudflare Worker (edge)                  │
│                                                            │
│  / , /about, /services …   ← pages (D1 data injected SSR)  │
│  /admin                    ← admin panel (session-guarded) │
│  /api/site-data            ← public JSON bundle            │
│  /api/admin/*              ← CRUD API (signed-cookie auth) │
│  /assets/* /css/* /js/*    ← static assets binding         │
│                                                            │
│   ┌──────────────┐   ┌──────────────────────────────┐      │
│   │ D1 (SQLite)  │   │ Secrets: ADMIN_USERNAME,     │      │
│   │ content DB   │   │ ADMIN_PASSWORD, SESSION_SECRET│     │
│   └──────────────┘   └──────────────────────────────┘      │
└────────────────────────────────────────────────────────────┘
```

## One-time setup

```bash
# 1. Install dependencies
npm install

# 2. Log in to Cloudflare (opens a browser)
npx wrangler login

# 3. Create the D1 database, then paste the printed database_id
#    into wrangler.jsonc  →  d1_databases[0].database_id
npx wrangler d1 create usama-portfolio-db

# 4. Create the admin account + session secret
#    The password is PBKDF2-hashed BEFORE being stored as an encrypted Worker
#    secret — the plaintext is never persisted anywhere. Shows the password
#    once at the end; save it in your password manager.
npm run seed

# 5. Apply the schema
npm run db:init:local     # local dev database
npm run db:init:remote    # production database

# 6. Test locally (D1 is emulated locally; no internet needed)
npm run dev               # → http://localhost:8787

# 7. Deploy to production
npm run deploy
```

## Day-to-day

| Task | Command |
| --- | --- |
| Develop locally | `npm run dev` |
| Deploy | `npm run deploy` |
| Change admin password | `npm run seed` (enter your new password when prompted) |
| Inspect production data | `npx wrangler d1 execute usama-portfolio-db --remote --command "SELECT * FROM services"` |
| Full JSON backup | sign into `/admin` → Download Data Backup |

## Architecture

- `src/index.ts` — Worker entry: routing, auth middleware, error pages
- `src/lib/` — auth (PBKDF2 + HMAC cookies), D1 layer, templates, HTTP helpers
- `src/routes/` — public API + session-guarded admin CRUD API
- `templates/` — page HTML, bundled at build time; the Worker injects
  `window.__SITE_DATA__` (D1 content) and the active theme server-side
- `public/` — static assets (css/js/images) via the Workers asset binding
- `schema.sql` — D1 tables: `site_settings`, `services`, `projects`, `awards`, `contact_messages`

## Security notes

- Admin credentials never live in the database or the client bundle — only a
  PBKDF2-SHA256 hash (100k iterations) is stored, as an encrypted Worker secret
  set by `npm run seed`. The plaintext password is never persisted anywhere.
- Login verification derives the same PBKDF2 hash via Web Crypto and compares
  in constant time.
- Sessions are HMAC-SHA256-signed, HttpOnly, Secure, SameSite=Lax cookies (7-day TTL).
- Login attempts are rate-limited (10 failures / 10 min / IP).
- All D1 access uses parameterized queries; all user content is HTML-escaped
  both server-side and client-side.
