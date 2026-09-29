-- ============================================================
-- Cloudflare D1 schema — Usama Gul portfolio (single-source DB)
-- Apply with: npx wrangler d1 execute <DB_NAME> --file=./schema.sql
--             add --local for the dev database, --remote for production.
-- Idempotent: safe to re-run (IF NOT EXISTS everywhere).
--
-- NOTE: admin authentication does NOT live in this database.
-- Admin credentials and the session secret are encrypted Cloudflare
-- Worker secrets managed by scripts/seed.mjs (npm run seed).
-- ============================================================

-- ------------------------------------------------------------
-- Site settings (theme, profile, contact, socials)
-- Rows are (key, value) pairs; JSON values stored as TEXT.
-- key = 'theme' | 'profile' | 'contact'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
    key              TEXT    PRIMARY KEY,
    value            TEXT    NOT NULL,           -- JSON or plain string
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Services (admin CRUD -> /services page + homepage cards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
    id               TEXT    PRIMARY KEY,        -- slug, e.g. 'agentic-ai'
    title            TEXT    NOT NULL,
    category         TEXT    NOT NULL DEFAULT 'Engineering',
    description      TEXT    NOT NULL DEFAULT '',
    deliverables     TEXT    NOT NULL DEFAULT '[]',  -- JSON array of strings
    tags             TEXT    NOT NULL DEFAULT '[]',  -- JSON array of strings
    price            INTEGER NOT NULL DEFAULT 0,     -- starting price in USD
    price_suffix     TEXT    NOT NULL DEFAULT '/ project',
    sort_order       INTEGER NOT NULL DEFAULT 0,
    featured         INTEGER NOT NULL DEFAULT 0,     -- 1 = show on homepage
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Portfolio projects (admin CRUD -> /portfolio + homepage)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id               TEXT    PRIMARY KEY,        -- slug, e.g. 'proj-1'
    title            TEXT    NOT NULL,
    category         TEXT    NOT NULL DEFAULT 'agentic',      -- agentic | vision | platforms
    category_label   TEXT    NOT NULL DEFAULT '',
    description      TEXT    NOT NULL DEFAULT '',
    full_details     TEXT    NOT NULL DEFAULT '',
    client           TEXT    NOT NULL DEFAULT '',
    stack            TEXT    NOT NULL DEFAULT '',
    impact           TEXT    NOT NULL DEFAULT '',
    duration         TEXT    NOT NULL DEFAULT '',
    image            TEXT,                        -- absolute path (/assets/...) or data: URI; NULL = gradient
    gradient         TEXT    NOT NULL DEFAULT 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)',
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Awards & honors (admin CRUD -> /awards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS awards (
    id               TEXT    PRIMARY KEY,        -- slug, e.g. 'cybhi-2025'
    title            TEXT    NOT NULL,
    year             TEXT    NOT NULL DEFAULT '',
    issuer           TEXT    NOT NULL DEFAULT '',
    status_pill      TEXT    NOT NULL DEFAULT 'Achievement',
    description      TEXT    NOT NULL DEFAULT '',
    why_it_matters   TEXT    NOT NULL DEFAULT '',
    tags             TEXT    NOT NULL DEFAULT '[]',  -- JSON array of strings
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    email            TEXT    NOT NULL,
    service          TEXT    NOT NULL DEFAULT '',
    budget           TEXT    NOT NULL DEFAULT '',
    message          TEXT    NOT NULL,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- Logos for homepage marquee (admin CRUD -> animated showcase)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logos (
    id               TEXT    PRIMARY KEY,        -- slug, e.g. 'python-logo'
    name            TEXT    NOT NULL,           -- display name, e.g. 'Python'
    image_url       TEXT    NOT NULL,          -- /assets/ path or data: URI
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_services_sort  ON services (sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_sort  ON projects (sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_cat   ON projects (category);
CREATE INDEX IF NOT EXISTS idx_awards_sort    ON awards (sort_order);
CREATE INDEX IF NOT EXISTS idx_logos_sort     ON logos (sort_order);
