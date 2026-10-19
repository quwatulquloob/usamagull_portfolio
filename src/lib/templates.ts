/**
 * Template loading + SSR data injection.
 *
 * Templates are the original marketing pages, lightly adapted. At request
 * time the Worker loads the template, queries D1, and injects a bootstrap
 * script (`window.__SITE_DATA__`) plus the active theme attribute so pages
 * render with the live database content immediately (no flash of defaults).
 */
import { html } from './http';
import { SITE_NAME, THEME_LABELS } from './constants';
import type { Award, Certification, Logo, Project, ResumeInfo, Service, ShowcaseVideo, SiteData, SiteSettings } from './types';

// Bundled at build time by Wrangler's ESBuild.
import indexTpl from '../../templates/index.html';
import aboutTpl from '../../templates/about.html';
import servicesTpl from '../../templates/services.html';
import portfolioTpl from '../../templates/portfolio.html';
import awardsTpl from '../../templates/awards.html';
import contactTpl from '../../templates/contact.html';
import adminTpl from '../../templates/admin-dashboard.html';

const TEMPLATES: Record<string, string> = {
  '/': indexTpl,
  '/about': aboutTpl,
  '/services': servicesTpl,
  '/portfolio': portfolioTpl,
  '/awards': awardsTpl,
  '/contact': contactTpl,
  '/admin': adminTpl,
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getHeroYouTubeVideoId(rawUrl: string): string | null {
  const value = rawUrl.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    try {
      url = new URL(`https://${value}`);
    } catch {
      return null;
    }
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = url.pathname.replace(/^\/|\/$/g, '');
  } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/);
      id = match ? match[1] : null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

function renderHeroVideoPreview(data: SiteData): string {
  const videoId = getHeroYouTubeVideoId(data.profile.heroVideoUrl);
  if (!videoId) {
    return `<img src="${escapeHtml(data.profile.photo)}" alt="Usama Gul — AI/ML Engineer" class="hero-photo" id="heroVideoPlaceholder">`;
  }

  return `<button class="hero-video-preview" type="button" aria-label="Play introduction video" data-video-id="${videoId}">
    <img class="hero-video-thumbnail" src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="" loading="eager">
    <span class="hero-video-preview-play" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7z"></path></svg></span>
    <span class="hero-video-preview-label">Watch introduction</span>
  </button>`;
}

/**
 * Assemble the bootstrap JSON blob. Kept in one place so the public site,
 * the admin panel, and the seed data all speak the same shape.
 */
export function buildSiteData(
  settings: SiteSettings,
  services: Service[],
  projects: Project[],
  awards: Award[],
  logos: Logo[],
  showcaseVideos: ShowcaseVideo[] = [],
  certifications: Certification[] = [],
): SiteData {
  // Bootstrap carries only resume availability + filename (never the PDF
  // payload) so the homepage button can hide when no resume is uploaded.
  const resumeMeta = settings.resume
    ? { filename: settings.resume.filename, updatedAt: settings.resume.updatedAt }
    : null;
  return {
    theme: settings.theme,
    profile: settings.profile,
    contact: settings.contact,
    services,
    projects,
    awards,
    certifications,
    logos,
    showcaseVideos,
    resume: resumeMeta,
  };
}

/**
 * Render a template with injected D1 data.
 * Returns null when no template exists for the route.
 */
export function renderTemplate(route: string, data: SiteData): Response | null {
  const tpl = TEMPLATES[route];
  if (!tpl) return null;

  // The template's `<script>__SITE_DATA_PLACEHOLDER__</script>` tag provides
  // the wrapper — inject only the assignment, with `<` escaped so the JSON
  // can never close the script block early.
  const bootstrap = `window.__SITE_DATA__ = ${JSON.stringify(data).replace(/</g, '\\u003c')}`;
  const theme = THEME_LABELS[data.theme] ? data.theme : 'charcoal-orange';

  // Function replacers: JSON containing `$` patterns must not trigger
  // String.replace's special `$&`-style substitution semantics.
  let out = tpl
    .replace('__SITE_DATA_PLACEHOLDER__', () => bootstrap)
    .replace('__THEME_ATTR__', () => escapeHtml(theme));
  if (route === '/') {
    out = out.replace('__HERO_VIDEO_PREVIEW__', () => renderHeroVideoPreview(data));
  }

  return html(out, 200, { 'Cache-Control': 'no-store' });
}

/** 404 page (no DB access required). */
export function notFoundPage(): Response {
  return html(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 — Page Not Found | ${SITE_NAME}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #0a0a0f; color: #e8e8ee; font-family: system-ui, -apple-system, sans-serif;
    padding: 24px; text-align: center;
  }
  .code { font-size: 5.5rem; font-weight: 800; color: #ff6b35; letter-spacing: -0.03em; }
  h1 { font-size: 1.5rem; margin: 12px 0 8px; }
  p { color: #9a9aa8; line-height: 1.6; margin-bottom: 28px; }
  a.btn {
    display: inline-block; background: #ff6b35; color: #0a0a0f; text-decoration: none;
    padding: 12px 26px; border-radius: 10px; font-weight: 700;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="code">404</div>
    <h1>Page not found</h1>
    <p>The page you requested doesn't exist on this site.</p>
    <a class="btn" href="/">Back to homepage</a>
  </div>
</body>
</html>`, 404, { 'Cache-Control': 'no-store' });
}
//

// Updated
