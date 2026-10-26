import manifestJson from './image-manifest.json';
import type { Project, SiteData } from './types';
import { ACNE_MEASURED_OUTCOME, SITE_ORIGIN, SKILLS, SOCIAL_PREVIEW_IMAGE } from './public-config';

type ImageInfo = { src: string; width: number; height: number };
const manifest: Record<string, ImageInfo> = manifestJson;
const imageCache = new Map<string, ImageInfo | undefined>();
export function optimizedImage(source: string | null | undefined): ImageInfo | undefined {
  if (!source) return undefined;
  if (imageCache.has(source)) return imageCache.get(source);
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619) >>> 0;
  const image = manifest[`${source.length}-${hash.toString(16).padStart(8, '0')}`];
  if (imageCache.size >= 32) imageCache.clear();
  imageCache.set(source, image);
  return image;
}
export function verifiedProfileUrl(value: string | undefined): string {
  try {
    const url = new URL(value || '');
    if (!['https:', 'http:'].includes(url.protocol) || url.pathname === '/') return '';
    return url.href;
  } catch { return ''; }
}
export function projectCaseStudy(project: Project) {
  const title = project.title.toLowerCase();
  let problem = `[TODO: add problem for ${project.title}]`;
  if (/roof/.test(title)) problem = 'Roof measurement and report preparation from satellite images.';
  else if (/cybhi/.test(title)) problem = 'Guided school incident reporting and student support.';
  else if (/prism|retail/.test(title)) problem = 'Sales forecasting, customer segmentation, and inventory planning.';
  else if (/brainiatic|voice assistant/.test(title)) problem = 'Voice interaction grounded in website and document knowledge.';
  else if (/acne/.test(title)) problem = 'Acne detection within a mobile application.';
  else if (/hololens|flutter/.test(title)) problem = 'Integrating AI inference into mobile and mixed reality applications.';
  else if (/metastasis/.test(title)) problem = 'Detecting bone metastasis in X-ray images.';
  return {
    problem,
    solution: project.description || `[TODO: add solution for ${project.title}]`,
    result: /acne/.test(title)
      ? ACNE_MEASURED_OUTCOME || '[TODO: add measurable Acne Detection outcome]'
      : project.impact || `[TODO: add result for ${project.title}]`,
  };
}
/** Public responses use compressed copies. Original admin uploads remain intact. */
export function preparePublicData(data: SiteData): SiteData {
  const photo = optimizedImage(data.profile.photo);
  return {
    ...data,
    resume: null,
    profile: { ...data.profile, ...(photo ? { photo: photo.src, photoWidth: photo.width, photoHeight: photo.height } : {}) },
    contact: { ...data.contact, github: verifiedProfileUrl(data.contact.github), linkedin: verifiedProfileUrl(data.contact.linkedin), upwork: verifiedProfileUrl(data.contact.upwork), kaggle: verifiedProfileUrl(data.contact.kaggle) },
    projects: data.projects.map(project => {
      const image = optimizedImage(project.image);
      return { ...project, ...(image ? { image: image.src, imageWidth: image.width, imageHeight: image.height } : {}), caseStudy: projectCaseStudy(project) };
    }),
    certifications: (data.certifications || []).map(c => {
      const image = optimizedImage(c.imageUrl);
      return { ...c, ...(image ? { imageUrl: image.src } : {}) };
    }),
  };
}
function escape(value: string): string {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
}
export function seoMarkup(route: string, title: string, description: string, data: SiteData): string {
  const canonical = SITE_ORIGIN + (route === '/' ? '/' : route);
  const photo = data.profile.photo.startsWith('/') ? SITE_ORIGIN + data.profile.photo : '';
  const image = SOCIAL_PREVIEW_IMAGE || photo;
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', '@id': SITE_ORIGIN + '/#person',
    name: data.profile.name, jobTitle: data.profile.title, url: SITE_ORIGIN + '/',
    ...(photo ? { image: photo } : {}), knowsAbout: SKILLS,
    sameAs: [data.contact.linkedin, data.contact.github, data.contact.upwork].filter(Boolean),
  };
  return `<link rel="canonical" href="${escape(canonical)}">
    <meta property="og:type" content="website"><meta property="og:site_name" content="Usama Gul">
    <meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}">
    <meta property="og:url" content="${escape(canonical)}">
    <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}">
    <meta name="twitter:description" content="${escape(description)}">
    ${image ? `<meta property="og:image" content="${escape(image)}"><meta property="og:image:alt" content="${escape(data.profile.name)} - AI Engineer"><meta name="twitter:image" content="${escape(image)}"><meta name="twitter:image:alt" content="${escape(data.profile.name)} - AI Engineer">` : ''}
    ${SOCIAL_PREVIEW_IMAGE ? '' : '<!-- [TODO: add social preview image URL]; using the existing profile image. -->'}
    <script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`;
}
