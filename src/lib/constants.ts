/** Site-wide constants shared by the Worker and seed script. */

export const SITE_NAME = 'Usama Gul';
export const COOKIE_NAME = 'ug_admin_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Password policy for the admin account. */
export const MIN_PASSWORD_LENGTH = 8;

/** Settings keys stored in the site_settings table. */
export const SETTINGS_KEYS = ['theme', 'profile', 'contact', 'resume'] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export const VALID_THEMES = ['charcoal-orange', 'midnight-blue', 'slate-purple', 'emerald-dark'] as const;
export type ThemeName = (typeof VALID_THEMES)[number];

export const VALID_PROJECT_CATEGORIES = ['agentic', 'vision', 'platforms'] as const;
export type ProjectCategory = (typeof VALID_PROJECT_CATEGORIES)[number];

/** theme -> label shown in the admin dashboard overview tile. */
export const THEME_LABELS: Record<ThemeName, string> = {
  'charcoal-orange': 'Charcoal Orange',
  'midnight-blue': 'Midnight Blue',
  'slate-purple': 'Slate Purple',
  'emerald-dark': 'Emerald Dark',
};

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  agentic: 'Agentic AI & LLMs',
  vision: 'Computer Vision & Real-Time AI',
  platforms: 'ML Platforms & Data Products',
};

/** Public routes that read from the templates directory. */
export const PUBLIC_ROUTES = [
  '',
  'about',
  'services',
  'portfolio',
  'awards',
  'contact',
] as const;
