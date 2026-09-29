/**
 * Admin CRUD API — every route here requires a valid admin session cookie.
 *
 *   GET    /api/admin/content                -> { settings, services, projects, awards }
 *   PUT    /api/admin/settings               -> { theme?, profile?, contact?, resume? }
 *   GET   /POST   /PUT /DELETE /api/admin/services[/:id]
 *   GET   /POST   /PUT /DELETE /api/admin/projects[/:id]
 *   GET   /POST   /PUT /DELETE /api/admin/awards[/:id]
 *
 * All writes use parameterized D1 statements. On success the response
 * includes the fresh row(s) so the admin UI updates without a refetch.
 */
import { asNumber, asString, asStringArray, json, readJsonBody } from '../lib/http';
import {
  createAward,
  createLogo,
  createProject,
  createService,
  deleteAward,
  deleteLogo,
  deleteProject,
  deleteService,
  getSettings,
  listAwards,
  listLogos,
  listProjects,
  listServices,
  saveSettings,
  updateAward,
  updateLogo,
  updateProject,
  updateService,
  type AwardInput,
  type ProjectInput,
  type ServiceInput,
} from '../lib/db';
import { MIN_PASSWORD_LENGTH, VALID_THEMES } from '../lib/constants';
import { hashPassword, verifyPassword } from '../lib/auth';
import type { Env, SiteContact, SiteProfile, SiteSettings } from '../lib/types';


function unauthorized(): Response {
  return json({ ok: false, error: 'Unauthorized' }, 401);
}

function invalid(message: string): Response {
  return json({ ok: false, error: message }, 400);
}

function notFound(): Response {
  return json({ ok: false, error: 'Not found' }, 404);
}

/**
 * Validate an optional logo image value from a profile patch.
 * Accepts image data URIs (cap ~200KB) or absolute/relative URLs;
 * empty/undefined clears the logo back to the default monogram.
 * Returns `{ logo }` on success or an error message string.
 */
function parseLogoInput(value: unknown): { logo: string | null } | string {
  const logo = typeof value === 'string' ? value.trim() : '';
  if (!logo) return { logo: null };
  if (logo.startsWith('data:image/')) {
    // Guard against unbounded inline images (D1 row limit is ~1MB per statement).
    if (logo.length > 300_000) {
      return 'Logo is too large. Please use an image under ~200KB.';
    }
    return { logo };
  }
  if (/^(https?:\/\/|\/)/.test(logo)) return { logo };
  return 'Logo must be an image data URI or a URL.';
}

// ---------------------------------------------------------------------------
// Content bundle + settings
// ---------------------------------------------------------------------------

/** GET /api/admin/content */
export async function handleGetContent(env: Env): Promise<Response> {
  const [settings, services, projects, awards, logos] = await Promise.all([
    getSettings(env.DB),
    listServices(env.DB),
    listProjects(env.DB),
    listAwards(env.DB),
    listLogos(env.DB),
  ]);
  return json({ ok: true, settings, services, projects, awards, logos });
}

/** PUT /api/admin/settings */
export async function handleUpdateSettings(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');

  const patch: Partial<SiteSettings> = {};    if (typeof body.theme === 'string') {
      if (!(VALID_THEMES as readonly string[]).includes(body.theme)) {
        return invalid('Unknown theme.');
      }
      patch.theme = body.theme as SiteSettings['theme'];
      // theme value validated against VALID_THEMES above
    }

  if (body.profile && typeof body.profile === 'object') {
    const p = body.profile as Record<string, unknown>;
    const name = asString(p.name);
    if (!name) return invalid('Profile name is required.');
    const parts = name.split(/\s+/);
    const parsedLogo = parseLogoInput(p.logo);
    if (typeof parsedLogo === 'string') return invalid(parsedLogo);
    patch.profile = {
      name,
      firstName: parts[0] ?? name,
      lastName: parts.slice(1).join(' ') || name,
      title: asString(p.title),
      tagline: asString(p.tagline),
      photo: asString(p.photo, '/assets/profile.png') || '/assets/profile.png',
      logo: parsedLogo.logo,
      yearsExp: Math.max(0, Math.round(asNumber(p.yearsExp, 0))),
      systemsDelivered: Math.max(0, Math.round(asNumber(p.systemsDelivered, 0))),
      happyClients: Math.max(0, Math.round(asNumber(p.happyClients, 0))),
      avgRating: Math.min(5, Math.max(0, asNumber(p.avgRating, 0))),
      techStack: asStringArray(p.techStack),
    };
  }

  if (body.contact && typeof body.contact === 'object') {
    const c = body.contact as Record<string, unknown>;
    const email = asString(c.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalid('A valid email is required.');
    const whatsapp = asString(c.whatsapp);
    patch.contact = {
      email,
      whatsapp,
      whatsappRaw: whatsapp.replace(/[^0-9]/g, ''),
      linkedin: asString(c.linkedin),
      github: asString(c.github),
      twitter: asString(c.twitter),
      kaggle: asString(c.kaggle),
    };
  }

  if (body.resume === null) {
    // Explicit clear: store null so the resume is removed (GET /resume -> 404).
    patch.resume = null;
  } else if (body.resume !== undefined) {
    if (typeof body.resume !== 'object') return invalid('Invalid resume payload.');
    const r = body.resume as Record<string, unknown>;
    const filename = asString(r.filename);
    const data = typeof r.data === 'string' ? r.data.trim() : '';
    if (!filename) return invalid('Resume filename is required.');
    if (!data.startsWith('data:application/pdf;base64,')) {
      return invalid('Resume must be a PDF (data:application/pdf;base64,…).');
    }
    // Guard against unbounded inline PDFs (D1 row limit is ~1MB per statement).
    if (data.length > 700_000) {
      return invalid('Resume is too large. Please use a PDF under ~500KB.');
    }
    patch.resume = {
      filename: filename.replace(/[\r\n"\\/]/g, '').slice(0, 120) || 'resume.pdf',
      data,
      updatedAt: new Date().toISOString(),
    };
  }

  if (patch.theme === undefined && patch.profile === undefined && patch.contact === undefined && patch.resume === undefined) {
    return invalid('Nothing to update.');
  }

  const settings = await saveSettings(env.DB, patch);
  return json({ ok: true, settings });
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

function parseServiceInput(body: Record<string, unknown>): ServiceInput | string {
  const title = asString(body.title);
  if (!title) return 'Service title is required.';
  const price = Math.max(0, Math.round(asNumber(body.price, 0)));
  return {
    title,
    category: asString(body.category, 'Engineering') || 'Engineering',
    description: asString(body.description),
    deliverables: asStringArray(body.deliverables),
    tags: asStringArray(body.tags),
    price,
    priceSuffix: asString(body.priceSuffix, '/ project') || '/ project',
    featured: body.featured === true,
  };
}

/** GET /api/admin/services */
export async function handleListServices(env: Env): Promise<Response> {
  return json({ ok: true, services: await listServices(env.DB) });
}

/** POST /api/admin/services */
export async function handleCreateService(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseServiceInput(body);
  if (typeof input === 'string') return invalid(input);
  const service = await createService(env.DB, input);
  return json({ ok: true, service }, 201);
}

/** PUT /api/admin/services/:id */
export async function handleUpdateService(request: Request, env: Env, id: string): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseServiceInput(body);
  if (typeof input === 'string') return invalid(input);
  const service = await updateService(env.DB, id, input);
  if (!service) return notFound();
  return json({ ok: true, service });
}

/** DELETE /api/admin/services/:id */
export async function handleDeleteService(env: Env, id: string): Promise<Response> {
  const deleted = await deleteService(env.DB, id);
  if (!deleted) return notFound();
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function parseProjectInput(body: Record<string, unknown>): ProjectInput | string {
  const title = asString(body.title);
  if (!title) return 'Project title is required.';
  let image: string | null = asString(body.image) || null;
  if (image && !/^(data:image\/|https?:\/\/|\/)/.test(image)) {
    return 'Image must be a data URI, an absolute path, or a URL.';
  }
  if (image && image.startsWith('data:')) {
    // Guard against unbounded inline images (D1 row limit is ~1MB per statement).
    if (image.length > 700_000) return 'Image is too large. Use an image under ~500KB or a URL instead.';
  }
  return {
    title,
    category: asString(body.category, 'agentic'),
    description: asString(body.description),
    fullDetails: asString(body.fullDetails),
    client: asString(body.client),
    stack: asString(body.stack),
    impact: asString(body.impact),
    duration: asString(body.duration, ''),
    image,
    gradient: asString(body.gradient, 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'),
  };
}

/** GET /api/admin/projects */
export async function handleListProjects(env: Env): Promise<Response> {
  return json({ ok: true, projects: await listProjects(env.DB) });
}

/** POST /api/admin/projects */
export async function handleCreateProject(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseProjectInput(body);
  if (typeof input === 'string') return invalid(input);
  const project = await createProject(env.DB, input);
  return json({ ok: true, project }, 201);
}

/** PUT /api/admin/projects/:id */
export async function handleUpdateProject(request: Request, env: Env, id: string): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseProjectInput(body);
  if (typeof input === 'string') return invalid(input);
  const project = await updateProject(env.DB, id, input);
  if (!project) return notFound();
  return json({ ok: true, project });
}

/** DELETE /api/admin/projects/:id */
export async function handleDeleteProject(env: Env, id: string): Promise<Response> {
  const deleted = await deleteProject(env.DB, id);
  if (!deleted) return notFound();
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Awards
// ---------------------------------------------------------------------------

function parseAwardInput(body: Record<string, unknown>): AwardInput | string {
  const title = asString(body.title);
  if (!title) return 'Award title is required.';
  return {
    title,
    year: asString(body.year),
    issuer: asString(body.issuer),
    statusPill: asString(body.statusPill, 'Achievement') || 'Achievement',
    description: asString(body.description),
    whyItMatters: asString(body.whyItMatters),
    tags: asStringArray(body.tags),
  };
}

/** GET /api/admin/awards */
export async function handleListAwards(env: Env): Promise<Response> {
  return json({ ok: true, awards: await listAwards(env.DB) });
}

/** POST /api/admin/awards */
export async function handleCreateAward(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseAwardInput(body);
  if (typeof input === 'string') return invalid(input);
  const award = await createAward(env.DB, input);
  return json({ ok: true, award }, 201);
}

/** PUT /api/admin/awards/:id */
export async function handleUpdateAward(request: Request, env: Env, id: string): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseAwardInput(body);
  if (typeof input === 'string') return invalid(input);
  const award = await updateAward(env.DB, id, input);
  if (!award) return notFound();
  return json({ ok: true, award });
}

/** DELETE /api/admin/awards/:id */
export async function handleDeleteAward(env: Env, id: string): Promise<Response> {
  const deleted = await deleteAward(env.DB, id);
  if (!deleted) return notFound();
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Logos
// ---------------------------------------------------------------------------

function parseMarqueeLogoInput(body: Record<string, unknown>): LogoInput | string {
  const name = asString(body.name);
  if (!name) return 'Logo name is required.';
  const imageUrl = asString(body.imageUrl);
  if (!imageUrl) return 'Logo image URL is required.';
  if (!/^(data:image\/|https?:\/\/|\/)/.test(imageUrl)) {
    return 'Image must be a data URI, an absolute path, or a URL.';
  }
  if (imageUrl.startsWith('data:')) {
    // Guard against unbounded inline images (D1 row limit is ~1MB per statement).
    if (imageUrl.length > 700_000) return 'Image is too large. Use an image under ~500KB or a URL instead.';
  }
  return {
    name,
    imageUrl,
  };
}

/** GET /api/admin/logos */
export async function handleListLogos(env: Env): Promise<Response> {
  return json({ ok: true, logos: await listLogos(env.DB) });
}

/** POST /api/admin/logos */
export async function handleCreateLogo(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseMarqueeLogoInput(body);
  if (typeof input === 'string') return invalid(input);
  const logo = await createLogo(env.DB, input);
  return json({ ok: true, logo }, 201);
}

/** PUT /api/admin/logos/:id */
export async function handleUpdateLogo(request: Request, env: Env, id: string): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');
  const input = parseMarqueeLogoInput(body);
  if (typeof input === 'string') return invalid(input);
  const logo = await updateLogo(env.DB, id, input);
  if (!logo) return notFound();
  return json({ ok: true, logo });
}

/** DELETE /api/admin/logos/:id */
export async function handleDeleteLogo(env: Env, id: string): Promise<Response> {
  const deleted = await deleteLogo(env.DB, id);
  if (!deleted) return notFound();
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Credentials change (from the admin panel's Security tab)
// ---------------------------------------------------------------------------

/** PUT /api/admin/credentials { currentPassword, username?, newPassword? } */
export async function handleUpdateCredentials(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return invalid('Invalid request body.');

  const currentPassword = asString(body.currentPassword);
  if (!(await verifyPassword(currentPassword, env.ADMIN_PASSWORD_HASH || ''))) {
    return json({ ok: false, error: 'Current password is incorrect.' }, 403);
  }

  const newUsername = asString(body.username);
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!newUsername && !newPassword) return invalid('Nothing to update.');
  if (newUsername && newUsername.length < 3) return invalid('Username must be at least 3 characters.');
  if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
    return invalid(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }

  // Credentials are stored as PBKDF2-hashed Worker secrets, so this endpoint
  // verifies ownership and returns the exact commands the operator must run
  // to persist the change. The panel shows them inline.
  const commands = [
    newUsername ? `npx wrangler secret put ADMIN_USERNAME   # then enter: ${newUsername}` : null,
    newPassword
      ? `npm run seed   # choose “no” to random generation and enter your new password\n# (local dev: rerun seed without the production prompt to refresh .dev.vars)`
      : null,
  ].filter(Boolean) as string[];

  return json({
    ok: true,
    note: 'Admin credentials are stored as encrypted Worker secrets. Run these commands to apply the change:',
    commands,
  });
}
