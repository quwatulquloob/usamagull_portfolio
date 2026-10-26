/**
 * Template loading + SSR data injection.
 *
 * Templates are the original marketing pages, lightly adapted. At request
 * time the Worker loads the template, queries D1, and injects a bootstrap
 * script (`window.__SITE_DATA__`) plus the active theme attribute so pages
 * render with the live database content immediately (no flash of defaults).
 */
import { html } from './http';
import { optimizedImage, preparePublicData, projectCaseStudy, seoMarkup } from './public-content';
import { REVIEW_URLS } from './public-config';
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
    return `<img src="${escapeHtml(data.profile.photo)}" alt="Usama Gul — AI/ML Engineer" class="hero-photo" id="heroVideoPlaceholder" width="${data.profile.photoWidth || 768}" height="${data.profile.photoHeight || 883}" fetchpriority="high">`;
  }

  const poster = optimizedImage(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
  return `<button class="hero-video-preview" type="button" aria-label="Play introduction video" data-video-id="${videoId}">
    <img class="hero-video-thumbnail" src="${poster?.src || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}" alt="" width="${poster?.width || 480}" height="${poster?.height || 360}" loading="eager" fetchpriority="high">
    <span class="hero-video-preview-play" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7z"></path></svg></span>
    <span class="hero-video-preview-label">Watch introduction</span>
  </button>`;
}


/** Project facts come from saved data and the supplied resume; unknowns stay explicit. */
function renderProjectFacts(project: Project): string {
  const facts = project.caseStudy || projectCaseStudy(project);
  const tags = project.stack.split(/[,;|]/).map(tag => tag.trim()).filter(Boolean);
  return `<dl class="project-facts"><div><dt>Problem</dt><dd>${escapeHtml(facts.problem)}</dd></div><div><dt>Solution</dt><dd>${escapeHtml(facts.solution)}</dd></div><div><dt>Result</dt><dd>${escapeHtml(facts.result)}</dd></div></dl>
    <ul class="project-tech-tags" aria-label="Technology stack">${(tags.length ? tags : [`[TODO: add tech stack for ${project.title}]`]).map(tag => `<li class="stack-chip">${escapeHtml(tag)}</li>`).join('')}</ul>`;
}
function projectImage(project: Project, featured: boolean): string {
  if (!project.image || !/^(data:image\/|https?:\/\/|\/(?!\/))/i.test(project.image)) return `<span class="project-monogram" aria-hidden="true">AI</span>`;
  return `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project preview" width="${project.imageWidth || 800}" height="${project.imageHeight || 450}" loading="lazy" decoding="async">`;
}
function renderSelectedWork(data: SiteData): string {
  const projects = data.projects.slice(0, 3);
  if (!projects.length) return '';
  return `<section class="selected-work" id="selected-work" aria-labelledby="selected-work-title"><div class="container">
    <div class="work-heading"><div><p class="eyebrow">SELECTED WORK</p><h2 id="selected-work-title">A few things I've built.</h2></div><a href="/portfolio" class="work-all">Explore all projects &nearr;</a></div>
    <div class="selected-grid">${projects.map(project => `<a class="selected-card" href="/portfolio#project-${encodeURIComponent(project.id)}" aria-label="Explore ${escapeHtml(project.title)} in the portfolio">
      <div class="selected-image">${projectImage(project, true)}<span class="work-arrow" aria-hidden="true">&nearr;</span></div>
      <div class="selected-body"><p class="eyebrow">${escapeHtml(project.categoryLabel || project.category)}</p><h3>${escapeHtml(project.title)}</h3>${renderProjectFacts(project)}<span class="selected-detail">Explore project &nearr;</span></div></a>`).join('')}</div></div></section>`;
}
function renderPortfolioProjects(data: SiteData): string {
  return data.projects.map((project, index) => `<article class="portfolio-card card-visible" id="project-${escapeHtml(project.id)}" data-category="${escapeHtml(project.category)}" data-index="${index}">
    <div class="portfolio-thumb"><div class="portfolio-thumb-inner">${projectImage(project, false)}</div><div class="portfolio-card-overlay"><button type="button" class="portfolio-view-btn" aria-label="Details about ${escapeHtml(project.title)}">View details</button></div></div>
    <div class="portfolio-card-body"><span class="portfolio-card-cat">${escapeHtml(project.categoryLabel || project.category)}</span><h3 class="portfolio-card-title">${escapeHtml(project.title)}</h3>${renderProjectFacts(project)}
      ${/^https?:\/\//i.test(project.projectUrl) ? `<a href="${escapeHtml(project.projectUrl)}" class="lb-project-link" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(project.title)} &nearr;</a>` : ''}</div>
    <div class="lightbox-data" hidden><h2>${escapeHtml(project.title)}</h2><span class="lb-cat">${escapeHtml(project.categoryLabel)}</span><div class="lb-details"><p>${escapeHtml(project.fullDetails || project.description)}</p>${renderProjectFacts(project)}
      ${/^https?:\/\//i.test(project.projectUrl) ? `<a href="${escapeHtml(project.projectUrl)}" target="_blank" rel="noopener noreferrer">Open ${escapeHtml(project.title)}</a>` : ''}</div></div>
  </article>`).join('') || '<p>Projects will appear here when added to the portfolio.</p>';
}
function renderContactButtons(data: SiteData): string {
  return `<div class="contact-social-buttons"><a class="btn btn-outline" href="mailto:${escapeHtml(data.contact.email)}">Email me</a>` +
    (['linkedin', 'github', 'upwork'] as const).map(key => {
      const label = { linkedin: 'LinkedIn', github: 'GitHub', upwork: 'Upwork' }[key];
      return data.contact[key] ? `<a class="btn btn-outline" href="${escapeHtml(data.contact[key])}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<span class="link-todo">[TODO: add ${label} URL]</span>`;
    }).join('') + '</div>';
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
  // Admin metadata carries only availability and filename, never the PDF.
  // Public responses remove this metadata in preparePublicData.
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
  if (route !== '/admin') data = preparePublicData(data);
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
    out = out.replace('__HERO_VIDEO_PREVIEW__', () => renderHeroVideoPreview(data))
      .replace('__SELECTED_WORK__', () => renderSelectedWork(data));
  }

  if (route !== '/admin') {
    out = out.replace(/<img\b[^>]*class="story-photo"[^>]*>/, () =>
      `<img src="${escapeHtml(data.profile.photo)}" alt="${escapeHtml(data.profile.name)} - AI Engineer" class="story-photo" width="${data.profile.photoWidth || 768}" height="${data.profile.photoHeight || 883}" loading="lazy" decoding="async">`);
    out = out.replace('__PORTFOLIO_PROJECTS__', () => renderPortfolioProjects(data))
      .replace('__CONTACT_BUTTONS__', () => renderContactButtons(data))
      .replaceAll('__GITHUB_LINK__', data.contact.github
        ? `<a href="${escapeHtml(data.contact.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>`
        : '<span class="link-todo">[TODO: add GitHub URL]</span>');
    out = out.replaceAll('__KAGGLE_LINK__', data.contact.kaggle
      ? `<a href="${escapeHtml(data.contact.kaggle)}" target="_blank" rel="noopener noreferrer">Kaggle</a>`
      : '<span class="link-todo">[TODO: add Kaggle URL]</span>');
    const stats = [data.profile.systemsDelivered, data.profile.happyClients, data.profile.yearsExp, data.profile.avgRating];
    let statIndex = 0;
    out = out.replace(/<span class="counter"([^>]*)>[^<]*<\/span>/g, (whole, attrs: string) => {
      const value = stats[statIndex++];
      if (!Number.isFinite(value)) return whole;
      const suffix = attrs.match(/data-suffix="([^"]*)"/)?.[1] || '';
      const decimal = attrs.includes('data-decimal="true"');
      return `<span class="counter"${attrs.replace(/data-target="[^"]*"/, `data-target="${value}"`)}>${decimal ? value.toFixed(1) : value}${suffix}</span>`;
    });
    for (const [key, label] of [['hololens', 'HoloLens 2'], ['onnx', 'ONNX Runtime'], ['opencv', 'OpenCV']]) {
      const review = REVIEW_URLS[key];
      out = out.replace(`__REVIEW_LINK_${key.toUpperCase()}__`, review
        ? `<a class="review-link" href="${escapeHtml(review)}" target="_blank" rel="noopener noreferrer">Read the ${label} review on Upwork</a>`
        : `<span class="review-link link-todo">[TODO: add Upwork review URL for ${label}]</span>`);
    }
    const title = out.match(/<title>([^<]*)<\/title>/)?.[1] || data.profile.name;
    const description = out.match(/<meta name="description"\s+content="([^"]*)"/)?.[1] || data.profile.tagline;
    out = out.replace('</head>', seoMarkup(route, title, description, data) + '\n</head>');
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
