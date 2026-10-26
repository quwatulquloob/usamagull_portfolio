/**
 * D1 data-access layer. All queries are parameterized (.bind) to prevent
 * SQL injection, and all row -> client shape mapping happens here.
 */
import type {
  AdminUserRow,
  Award,
  AwardRow,
  Certification,
  CertificationRow,
  Env,
  Logo,
  LogoRow,
  Project,
  ProjectRow,
  ResumeInfo,
  Service,
  ServiceRow,
  SettingRow,
  ShowcaseVideo,
  ShowcaseVideoRow,
  SiteContact,
  SiteProfile,
  SiteSettings,
} from './types';
import {
  PROJECT_CATEGORY_LABELS,
  SETTINGS_KEYS,
  VALID_PROJECT_CATEGORIES,
  VALID_THEMES,
} from './constants';
import { SEED_AWARDS, SEED_LOGOS, SEED_PROJECTS, SEED_SERVICES } from './seed-data';

type ProjectCategoryKey = (typeof VALID_PROJECT_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Defaults — seeded into D1 on first run, also used as hard fallbacks if the
// database is unreachable so the public site degrades gracefully.
// ---------------------------------------------------------------------------

export const DEFAULT_PROFILE: SiteProfile = {
  name: 'Usama Gul',
  firstName: 'Usama',
  lastName: 'Gul',
  title: 'AI Engineer',
  tagline: 'Building scalable AI systems that actually ship.',
  photo: '/assets/profile.png',
  heroVideoUrl: 'https://www.youtube.com/watch?v=UBaeXPFcrYw',
  yearsExp: 4,
  systemsDelivered: 15,
  happyClients: 10,
  avgRating: 4.9,
  techStack: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'LLMs', 'LangGraph', 'OpenCV'],
};

export const DEFAULT_CONTACT: SiteContact = {
  email: 'rajausamagull123@gmail.com',
  whatsapp: '+92 312 0979064',
  whatsappRaw: '923120979064',
  linkedin: 'https://www.linkedin.com/in/usama-gul-3a0188250/',
  github: 'https://github.com',
  upwork: 'https://www.upwork.com/freelancers/~01440869ef56e8e97a',
  twitter: 'https://www.upwork.com/freelancers/~01440869ef56e8e97a',
  kaggle: 'https://kaggle.com',
};

export const DEFAULT_PROFILE_JSON = JSON.stringify(DEFAULT_PROFILE);
export const DEFAULT_CONTACT_JSON = JSON.stringify(DEFAULT_CONTACT);

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** Read all site settings, falling back to defaults for missing keys. */
export async function getSettings(db: D1Database): Promise<SiteSettings> {
  const { results } = await db
    .prepare('SELECT key, value FROM site_settings')
    .all<SettingRow>();
  const map = new Map((results ?? []).map((r) => [r.key, r.value]));
  const profile = parseJsonSetting(map.get('profile'), DEFAULT_PROFILE);
  const contact = parseJsonSetting(map.get('contact'), DEFAULT_CONTACT);
  const themeRaw = map.get('theme');
  const theme = VALID_THEMES.includes(themeRaw as never) ? (themeRaw as SiteSettings['theme']) : 'charcoal-orange';
  const resume = parseResumeSetting(map.get('resume'));
  return { theme, profile: { ...DEFAULT_PROFILE, ...profile }, contact: { ...DEFAULT_CONTACT, ...contact }, resume };
}

/** Persist a subset of settings; returns the full settings object after save. */
export async function saveSettings(db: D1Database, patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const statements: D1PreparedStatement[] = [];
  if (patch.profile !== undefined) {
    statements.push(
      db.prepare(
        'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(?)) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ).bind('profile', JSON.stringify(patch.profile), new Date().toISOString()),
    );
  }
  if (patch.contact !== undefined) {
    statements.push(
      db.prepare(
        'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(?)) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ).bind('contact', JSON.stringify(patch.contact), new Date().toISOString()),
    );
  }
  if (patch.resume !== undefined) {
    statements.push(
      db.prepare(
        'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(?)) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ).bind('resume', JSON.stringify(patch.resume), new Date().toISOString()),
    );
  }
  if (patch.theme !== undefined) {
    statements.push(
      db.prepare(
        'INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime(?)) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
      ).bind('theme', patch.theme, new Date().toISOString()),
    );
  }
  if (statements.length > 0) await db.batch(statements);
  return getSettings(db);
}

/**
 * Seed defaults only where no row exists yet (never overwrites admin edits).
 * Populates settings plus the default services/projects/awards catalog so a
 * fresh database renders a complete site on first load.
 */
export async function seedSettings(db: D1Database): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').bind('profile', DEFAULT_PROFILE_JSON),
    db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').bind('contact', DEFAULT_CONTACT_JSON),
    db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').bind('theme', 'charcoal-orange'),
  ];
  for (const [i, s] of SEED_SERVICES.entries()) {
    statements.push(
      db.prepare(
        'INSERT OR IGNORE INTO services (id, title, category, description, deliverables, tags, price, price_suffix, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
      ).bind(s.id, s.title, s.category, s.description, JSON.stringify(s.deliverables), JSON.stringify(s.tags), s.price, s.price_suffix, i),
    );
  }
  for (const [i, p] of SEED_PROJECTS.entries()) {
    statements.push(
      db.prepare(
        'INSERT OR IGNORE INTO projects (id, title, category, category_label, description, full_details, client, stack, impact, duration, image, gradient, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)',
      ).bind(p.id, p.title, p.category, PROJECT_CATEGORY_LABELS[p.category as ProjectCategoryKey] ?? p.category, p.description, p.full_details, p.client, p.stack, p.impact, p.duration, p.gradient, i),
    );
  }
  for (const [i, a] of SEED_AWARDS.entries()) {
    statements.push(
      db.prepare(
        'INSERT OR IGNORE INTO awards (id, title, year, issuer, status_pill, description, why_it_matters, tags, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ).bind(a.id, a.title, a.year, a.issuer, a.status_pill, a.description, a.why_it_matters, JSON.stringify(a.tags), i),
    );
  }
  for (const [i, l] of SEED_LOGOS.entries()) {
    statements.push(
      db.prepare(
        'INSERT OR IGNORE INTO logos (id, name, image_url, sort_order) VALUES (?, ?, ?, ?)',
      ).bind(l.id, l.name, l.image_url, i),
    );
  }
  await db.batch(statements);
}

function parseJsonSetting<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

/** Parse the stored resume row; absence, corruption, or wrong type -> null. */
function parseResumeSetting(raw: string | undefined): ResumeInfo | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ResumeInfo> | null;
    if (parsed && typeof parsed === 'object' && typeof parsed.filename === 'string' && typeof parsed.data === 'string' && parsed.data.startsWith('data:application/pdf')) {
      return parsed as ResumeInfo;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    deliverables: safeParseArray(row.deliverables),
    tags: safeParseArray(row.tags),
    price: row.price,
    priceSuffix: row.price_suffix,
    featured: row.featured === 1,
  };
}

export async function listServices(db: D1Database): Promise<Service[]> {
  const { results } = await db
    .prepare('SELECT * FROM services ORDER BY sort_order ASC, created_at ASC')
    .all<ServiceRow>();
  return (results ?? []).map(mapService);
}

export interface ServiceInput {
  title: string;
  category: string;
  description: string;
  deliverables: string[];
  tags: string[];
  price: number;
  priceSuffix: string;
  featured: boolean;
}

export interface LogoInput {
  name: string;
  imageUrl: string;
}

export async function createService(db: D1Database, input: ServiceInput): Promise<Service> {
  const id = await uniqueSlug(db, 'services', slugify(input.title));
  await db
    .prepare(
      'INSERT INTO services (id, title, category, description, deliverables, tags, price, price_suffix, featured, sort_order) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM services))',
    )
    .bind(
      id,
      input.title,
      input.category,
      input.description,
      JSON.stringify(input.deliverables),
      JSON.stringify(input.tags),
      input.price,
      input.priceSuffix,
      input.featured ? 1 : 0,
    )
    .run();
  const row = await db.prepare('SELECT * FROM services WHERE id = ?').bind(id).first<ServiceRow>();
  if (!row) throw new Error('insert_failed');
  return mapService(row);
}

export async function updateService(db: D1Database, id: string, input: ServiceInput): Promise<Service | null> {
  const res = await db
    .prepare(
      'UPDATE services SET title = ?, category = ?, description = ?, deliverables = ?, tags = ?, ' +
      'price = ?, price_suffix = ?, featured = ?, updated_at = datetime(?) WHERE id = ?',
    )
    .bind(
      input.title,
      input.category,
      input.description,
      JSON.stringify(input.deliverables),
      JSON.stringify(input.tags),
      input.price,
      input.priceSuffix,
      input.featured ? 1 : 0,
      new Date().toISOString(),
      id,
    )
    .run();
  if (!res.meta.changes) return null;
  const row = await db.prepare('SELECT * FROM services WHERE id = ?').bind(id).first<ServiceRow>();
  return row ? mapService(row) : null;
}

export async function deleteService(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM services WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryLabel: row.category_label || PROJECT_CATEGORY_LABELS[row.category] || row.category,
    description: row.description,
    fullDetails: row.full_details,
    client: row.client,
    stack: row.stack,
    impact: row.impact,
    duration: row.duration,
    projectUrl: row.project_url,
    image: row.image,
    gradient: row.gradient,
  };
}

export async function listProjects(db: D1Database): Promise<Project[]> {
  const { results } = await db
    .prepare('SELECT * FROM projects ORDER BY sort_order ASC, created_at ASC')
    .all<ProjectRow>();
  return (results ?? []).map(mapProject);
}

export interface ProjectInput {
  title: string;
  category: string;
  description: string;
  fullDetails: string;
  client: string;
  stack: string;
  impact: string;
  duration: string;
  projectUrl: string;
  image: string | null;
  gradient: string;
}

export async function createProject(db: D1Database, input: ProjectInput): Promise<Project> {
  const category = normalizeCategory(input.category);
  const id = await uniqueSlug(db, 'projects', slugify(input.title));
  await db
    .prepare(
      'INSERT INTO projects (id, title, category, category_label, description, full_details, client, stack, impact, duration, project_url, image, gradient, sort_order) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects))',
    )
    .bind(
      id,
      input.title,
      category,
      PROJECT_CATEGORY_LABELS[category],
      input.description,
      input.fullDetails,
      input.client,
      input.stack,
      input.impact,
      input.duration,
      input.projectUrl,
      input.image,
      input.gradient,
    )
    .run();
  const row = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<ProjectRow>();
  if (!row) throw new Error('insert_failed');
  return mapProject(row);
}

export async function updateProject(db: D1Database, id: string, input: ProjectInput): Promise<Project | null> {
  const category = normalizeCategory(input.category);
  const res = await db
    .prepare(
      'UPDATE projects SET title = ?, category = ?, category_label = ?, description = ?, full_details = ?, ' +
      'client = ?, stack = ?, impact = ?, duration = ?, project_url = ?, image = ?, gradient = ?, updated_at = datetime(?) WHERE id = ?',
    )
    .bind(
      input.title,
      category,
      PROJECT_CATEGORY_LABELS[category],
      input.description,
      input.fullDetails,
      input.client,
      input.stack,
      input.impact,
      input.duration,
      input.projectUrl,
      input.image,
      input.gradient,
      new Date().toISOString(),
      id,
    )
    .run();
  if (!res.meta.changes) return null;
  const row = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<ProjectRow>();
  return row ? mapProject(row) : null;
}

export async function deleteProject(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

export function mapAward(row: AwardRow): Award {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    issuer: row.issuer,
    statusPill: row.status_pill,
    description: row.description,
    whyItMatters: row.why_it_matters,
    tags: safeParseArray(row.tags),
  };
}

export async function listAwards(db: D1Database): Promise<Award[]> {
  const { results } = await db
    .prepare('SELECT * FROM awards ORDER BY sort_order ASC, created_at ASC')
    .all<AwardRow>();
  return (results ?? []).map(mapAward);
}

export interface AwardInput {
  title: string;
  year: string;
  issuer: string;
  statusPill: string;
  description: string;
  whyItMatters: string;
  tags: string[];
}

export async function createAward(db: D1Database, input: AwardInput): Promise<Award> {
  const id = await uniqueSlug(db, 'awards', slugify(input.title));
  await db
    .prepare(
      'INSERT INTO awards (id, title, year, issuer, status_pill, description, why_it_matters, tags, sort_order) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM awards))',
    )
    .bind(
      id,
      input.title,
      input.year,
      input.issuer,
      input.statusPill,
      input.description,
      input.whyItMatters,
      JSON.stringify(input.tags),
    )
    .run();
  const row = await db.prepare('SELECT * FROM awards WHERE id = ?').bind(id).first<AwardRow>();
  if (!row) throw new Error('insert_failed');
  return mapAward(row);
}

export async function updateAward(db: D1Database, id: string, input: AwardInput): Promise<Award | null> {
  const res = await db
    .prepare(
      'UPDATE awards SET title = ?, year = ?, issuer = ?, status_pill = ?, description = ?, why_it_matters = ?, ' +
      'tags = ?, updated_at = datetime(?) WHERE id = ?',
    )
    .bind(
      input.title,
      input.year,
      input.issuer,
      input.statusPill,
      input.description,
      input.whyItMatters,
      JSON.stringify(input.tags),
      new Date().toISOString(),
      id,
    )
    .run();
  if (!res.meta.changes) return null;
  const row = await db.prepare('SELECT * FROM awards WHERE id = ?').bind(id).first<AwardRow>();
  return row ? mapAward(row) : null;
}

export async function deleteAward(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM awards WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

export function mapCertification(row: CertificationRow): Certification {
  return {
    id: row.id,
    title: row.title,
    issuer: row.issuer,
    issueDate: row.issue_date,
    credentialUrl: row.credential_url,
    imageUrl: row.image_url,
  };
}

export async function listCertifications(db: D1Database): Promise<Certification[]> {
  const { results } = await db
    .prepare('SELECT * FROM certifications ORDER BY sort_order ASC, created_at ASC')
    .all<CertificationRow>();
  return (results ?? []).map(mapCertification);
}

export interface CertificationInput {
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
  imageUrl: string;
}

export async function createCertification(db: D1Database, input: CertificationInput): Promise<Certification> {
  const id = await uniqueSlug(db, 'certifications', slugify(input.title));
  await db
    .prepare(
      'INSERT INTO certifications (id, title, issuer, issue_date, credential_url, image_url, sort_order) ' +
      'VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM certifications))',
    )
    .bind(id, input.title, input.issuer, input.issueDate, input.credentialUrl, input.imageUrl)
    .run();
  const row = await db.prepare('SELECT * FROM certifications WHERE id = ?').bind(id).first<CertificationRow>();
  if (!row) throw new Error('insert_failed');
  return mapCertification(row);
}

export async function updateCertification(db: D1Database, id: string, input: CertificationInput): Promise<Certification | null> {
  const res = await db
    .prepare(
      'UPDATE certifications SET title = ?, issuer = ?, issue_date = ?, credential_url = ?, image_url = ?, updated_at = datetime(?) WHERE id = ?',
    )
    .bind(input.title, input.issuer, input.issueDate, input.credentialUrl, input.imageUrl, new Date().toISOString(), id)
    .run();
  if (!res.meta.changes) return null;
  const row = await db.prepare('SELECT * FROM certifications WHERE id = ?').bind(id).first<CertificationRow>();
  return row ? mapCertification(row) : null;
}

export async function deleteCertification(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM certifications WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Logos
// ---------------------------------------------------------------------------

export function mapLogo(row: LogoRow): Logo {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_url,
  };
}

export async function listLogos(db: D1Database): Promise<Logo[]> {
  const { results } = await db
    .prepare('SELECT * FROM logos ORDER BY sort_order ASC, created_at ASC')
    .all<LogoRow>();
  return (results ?? []).map(mapLogo);
}

export interface LogoInput {
  name: string;
  imageUrl: string;
}

export async function createLogo(db: D1Database, input: LogoInput): Promise<Logo> {
  const id = await uniqueSlug(db, 'logos', slugify(input.name));
  await db
    .prepare(
      'INSERT INTO logos (id, name, image_url, sort_order) ' +
      'VALUES (?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM logos))',
    )
    .bind(
      id,
      input.name,
      input.imageUrl,
    )
    .run();
  const row = await db.prepare('SELECT * FROM logos WHERE id = ?').bind(id).first<LogoRow>();
  if (!row) throw new Error('insert_failed');
  return mapLogo(row);
}

export async function updateLogo(db: D1Database, id: string, input: LogoInput): Promise<Logo | null> {
  const res = await db
    .prepare(
      'UPDATE logos SET name = ?, image_url = ?, updated_at = ? WHERE id = ?',
    )
    .bind(
      input.name,
      input.imageUrl,
      new Date().toISOString(),
      id,
    )
    .run();
  if (!res.meta.changes) return null;
  const row = await db.prepare('SELECT * FROM logos WHERE id = ?').bind(id).first<LogoRow>();
  return row ? mapLogo(row) : null;
}

export async function deleteLogo(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM logos WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Showcase Videos
// ---------------------------------------------------------------------------

export function mapShowcaseVideo(row: ShowcaseVideoRow): ShowcaseVideo {
  return {
    id: row.id,
    title: row.title,
    youtube_url: row.youtube_url,
    description: row.description,
    category: row.category,
    sort_order: row.sort_order,
  };
}

export async function listShowcaseVideos(db: D1Database): Promise<ShowcaseVideo[]> {
  const { results } = await db
    .prepare('SELECT * FROM showcase_videos ORDER BY sort_order ASC, created_at ASC')
    .all<ShowcaseVideoRow>();
  return (results ?? []).map(mapShowcaseVideo);
}

export interface ShowcaseVideoInput {
  title: string;
  youtubeUrl: string;   // internal camelCase — maps to youtube_url column
  description: string;
  category: string;
  sortOrder?: number;
}

export async function createShowcaseVideo(db: D1Database, input: ShowcaseVideoInput): Promise<ShowcaseVideo> {
  const id = await uniqueSlug(db, 'showcase_videos', slugify(input.title));
  const sortOrder = typeof input.sortOrder === 'number' ? input.sortOrder
    : (await db.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM showcase_videos').first<{ next: number }>())?.next ?? 1;
  await db
    .prepare(
      'INSERT INTO showcase_videos (id, title, youtube_url, description, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(id, input.title, input.youtubeUrl, input.description ?? '', input.category ?? '', sortOrder)
    .run();
  const row = await db.prepare('SELECT * FROM showcase_videos WHERE id = ?').bind(id).first<ShowcaseVideoRow>();
  if (!row) throw new Error('insert_failed');
  return mapShowcaseVideo(row);
}

export async function updateShowcaseVideo(db: D1Database, id: string, input: ShowcaseVideoInput): Promise<ShowcaseVideo | null> {
  const res = await db
    .prepare(
      'UPDATE showcase_videos SET title = ?, youtube_url = ?, description = ?, category = ?, updated_at = datetime(?) WHERE id = ?',
    )
    .bind(
      input.title,
      input.youtubeUrl,
      input.description ?? '',
      input.category ?? '',
      new Date().toISOString(),
      id,
    )
    .run();
  if (!res.meta.changes) return null;
  const row = await db.prepare('SELECT * FROM showcase_videos WHERE id = ?').bind(id).first<ShowcaseVideoRow>();
  return row ? mapShowcaseVideo(row) : null;
}

export async function deleteShowcaseVideo(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare('DELETE FROM showcase_videos WHERE id = ?').bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}
// ---------------------------------------------------------------------------

function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'item';
}

async function uniqueSlug(db: D1Database, table: 'services' | 'projects' | 'awards' | 'certifications' | 'logos' | 'showcase_videos', base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  for (;;) {
    const row = await db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).bind(candidate).first();
    if (!row) return candidate;
    candidate = `${base}-${++n}`;
  }
}

function normalizeCategory(input: string): ProjectCategory2 {
  return (VALID_PROJECT_CATEGORIES as readonly string[]).includes(input)
    ? (input as ProjectCategory2)
    : 'agentic';
}

type ProjectCategory2 = (typeof VALID_PROJECT_CATEGORIES)[number];

export { SETTINGS_KEYS };
