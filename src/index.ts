/**
 * Worker entry point — single Worker, single domain.
 *
 * Routing map:
 *   /api/site-data          GET   public JSON bundle (D1)
 *   /resume                 GET   admin-uploaded resume PDF (download)
 *   /api/contact            POST  contact form intake
 *   /api/admin/auth/*       POST  login / logout, GET session
 *   /api/admin/*            *     session-guarded CRUD (D1)
 *   /admin                  GET   admin panel (redirects to / when unauthenticated)
 *   /, /about, /services…   GET   public pages (SSR-injected D1 data)
 *   /assets/* /css/* /js/*       static assets (Workers Static Assets binding)
 */
import { errorPage, html, json } from './lib/http';
import { notFoundPage, renderTemplate } from './lib/templates';
import { buildSiteData } from './lib/templates';
import { getSettings, listAwards, listCertifications, listLogos, listProjects, listServices, listShowcaseVideos, seedSettings } from './lib/db';
import { getSessionToken, verifySessionToken } from './lib/auth';
import type { Env, SiteData } from './lib/types';
import { PUBLIC_ROUTES } from './lib/constants';
import {
  handleLogin,
  handleLogout,
  handleSession,
} from './routes/admin-auth';
import {
  handleCreateAward,
  handleCreateCertification,
  handleCreateLogo,
  handleCreateProject,
  handleCreateService,
  handleCreateShowcaseVideo,
  handleDeleteAward,
  handleDeleteCertification,
  handleDeleteLogo,
  handleDeleteProject,
  handleDeleteService,
  handleDeleteShowcaseVideo,
  handleGetContent,
  handleListAwards,
  handleListCertifications,
  handleListLogos,
  handleListProjects,
  handleListServices,
  handleListShowcaseVideos,
  handleUpdateAward,
  handleUpdateCertification,
  handleUpdateCredentials,
  handleUpdateLogo,
  handleUpdateProject,
  handleReorderProjects,
  handleUpdateService,
  handleUpdateSettings,
  handleUpdateShowcaseVideo,
} from './routes/admin-api';
import { handleContactSubmit, handleResumeDownload, handleSiteData } from './routes/public-api';

/** Load the full site bundle from D1, tolerating a missing/failed database. */
async function loadSiteData(env: Env): Promise<SiteData | null> {
  try {
    const [settings, services, projects, awards, logos, showcaseVideos, certifications] = await Promise.all([
      getSettings(env.DB),
      listServices(env.DB),
      listProjects(env.DB),
      listAwards(env.DB),
      listLogos(env.DB),
      listShowcaseVideos(env.DB),
      listCertifications(env.DB),
    ]);
    return buildSiteData(settings, services, projects, awards, logos, showcaseVideos, certifications);
  } catch (err) {
    console.error('D1 loadSiteData failed:', err);
    return null;
  }
}

/** One-time D1 bootstrap: seed default settings if not yet present. */
async function ensureSeeded(env: Env): Promise<void> {
  await seedSettings(env.DB);
}

/** Validate the admin session cookie; returns the username or null. */
async function getAdminUser(request: Request, env: Env): Promise<string | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  const payload = await verifySessionToken(token, env.SESSION_SECRET);
  return payload ? payload.username : null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = request.method.toUpperCase();

    try {
      // ---------------------------------------------------------------------
      // Static assets: let the platform serve them with its optimized pipeline.
      // (configured below via run_worker_first + assets binding)
      // ---------------------------------------------------------------------
      // NOTE: with assets binding + run_worker_first, matching asset requests
      // never reach fetch(); everything below is dynamic-only traffic.

      // ---------------------------------------------------------------------
      // Public API
      // ---------------------------------------------------------------------
      if (path === '/api/site-data' && method === 'GET') {
        return await handleSiteData(env);
      }
      if (path === '/resume' && method === 'GET') {
        return await handleResumeDownload(env);
      }
      if (path === '/api/contact' && method === 'POST') {
        return await handleContactSubmit(request, env);
      }

      // ---------------------------------------------------------------------
      // Admin auth API
      // ---------------------------------------------------------------------
      if (path === '/api/admin/auth/login' && method === 'POST') {
        return await handleLogin(request, env);
      }
      if (path === '/api/admin/auth/logout' && method === 'POST') {
        return await handleLogout();
      }
      if (path === '/api/admin/auth/session' && method === 'GET') {
        return await handleSession(request, env);
      }

      // ---------------------------------------------------------------------
      // Admin CRUD API — all guarded by the session cookie
      // ---------------------------------------------------------------------
      if (path.startsWith('/api/admin/') && !path.startsWith('/api/admin/auth/')) {
        const user = await getAdminUser(request, env);
        if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);

        if (path === '/api/admin/content' && method === 'GET') {
          return await handleGetContent(env);
        }
        if (path === '/api/admin/settings' && method === 'PUT') {
          return await handleUpdateSettings(request, env);
        }
        if (path === '/api/admin/credentials' && method === 'PUT') {
          return await handleUpdateCredentials(request, env);
        }

        if (path === '/api/admin/projects/reorder' && method === 'PUT') {
          return await handleReorderProjects(request, env);
        }

        // /api/admin/{services|projects|awards|certifications|logos|videos}[/:id]
        const m = path.match(/^\/api\/admin\/(services|projects|awards|certifications|logos|videos)(?:\/([^/]+))?$/);
        if (m) {
          const [, resource, id] = m;
          const handlers = {
            services: {
              list: handleListServices,
              create: handleCreateService,
              update: handleUpdateService,
              remove: handleDeleteService,
            },
            projects: {
              list: handleListProjects,
              create: handleCreateProject,
              update: handleUpdateProject,
              remove: handleDeleteProject,
            },
            awards: {
              list: handleListAwards,
              create: handleCreateAward,
              update: handleUpdateAward,
              remove: handleDeleteAward,
            },
            certifications: {
              list: handleListCertifications,
              create: handleCreateCertification,
              update: handleUpdateCertification,
              remove: handleDeleteCertification,
            },
            logos: {
              list: handleListLogos,
              create: handleCreateLogo,
              update: handleUpdateLogo,
              remove: handleDeleteLogo,
            },
            videos: {
              list: handleListShowcaseVideos,
              create: handleCreateShowcaseVideo,
              update: handleUpdateShowcaseVideo,
              remove: handleDeleteShowcaseVideo,
            },
          } as const;
          const h = handlers[resource as keyof typeof handlers];
          if (method === 'GET' && !id) return await h.list(env);
          if (method === 'POST' && !id) return await h.create(request, env);
          if (method === 'PUT' && id) return await h.update(request, env, id);
          if (method === 'DELETE' && id) return await h.remove(env, id);
          return json({ ok: false, error: 'Method not allowed' }, 405);
        }

        return json({ ok: false, error: 'Not found' }, 404);
      }

      // ---------------------------------------------------------------------
      // Admin panel page (GET /admin)
      // ---------------------------------------------------------------------
      if (path === '/admin' || path === '/admin/login') {
        const user = await getAdminUser(request, env);
        if (user && path === '/admin/login') {
          return Response.redirect(url.origin + '/admin', 302);
        }
        await ensureSeeded(env);
        const data = await loadSiteData(env);
        if (!data) return errorPage(503, 'Database unavailable', 'The content database could not be reached. Please try again shortly.');
        return renderTemplate('/admin', data) ?? notFoundPage();
      }

      // ---------------------------------------------------------------------
      // Public pages (SSR + D1)
      // ---------------------------------------------------------------------
      const route = path === '/' ? '' : path.slice(1);
      if ((PUBLIC_ROUTES as readonly string[]).includes(route)) {
        await ensureSeeded(env);
        const data = await loadSiteData(env);
        if (!data) {
          return errorPage(503, 'Temporarily unavailable', 'The content database could not be reached. Please try again shortly.');
        }
        return renderTemplate(route === '' ? '/' : `/${route}`, data) ?? notFoundPage();
      }

      return notFoundPage();
    } catch (err) {
      console.error('Unhandled worker error:', err);
      return errorPage(500, 'Something went wrong', 'An unexpected error occurred. Please try again.');
    }
  },
} satisfies ExportedHandler<Env>;
// Force rebuild
