/**
 * Shared types: Worker Env bindings and D1 row shapes.
 */
import type * as K from './constants';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Admin username (Worker secret, set by `npm run seed`). */
  ADMIN_USERNAME: string;
  /** Admin password stored as a `pbkdf2$iter$salt$hash` string
   *  (Worker secret, hashed by `npm run seed` before storage). */
  ADMIN_PASSWORD_HASH: string;
  /** HMAC-SHA256 secret for signing admin session cookies. */
  SESSION_SECRET: string;
  /** Resend API key for sending email notifications (optional). */
  RESEND_API_KEY?: string;
  /** Verified sender address for contact form emails (optional). */
  CONTACT_FROM_EMAIL?: string;
  /** Email address to receive contact form notifications (optional). */
  NOTIFY_EMAIL?: string;
}

/** Shape of rows in the admin_users table. */
export interface AdminUserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

/** Shape of rows in the site_settings table. */
export interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

/** Shape of rows in the services table. */
export interface ServiceRow {
  id: string;
  title: string;
  category: string;
  description: string;
  deliverables: string; // JSON array
  tags: string;         // JSON array
  price: number;
  price_suffix: string;
  sort_order: number;
  featured: number; // 0/1
  created_at: string;
  updated_at: string;
}

/** Shape of rows in the projects table. */
export interface ProjectRow {
  id: string;
  title: string;
  category: K.ProjectCategory;
  category_label: string;
  description: string;
  full_details: string;
  client: string;
  stack: string;
  impact: string;
  duration: string;
  project_url: string;
  image: string | null;
  gradient: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Shape of rows in the awards table. */
export interface AwardRow {
  id: string;
  title: string;
  year: string;
  issuer: string;
  status_pill: string;
  description: string;
  why_it_matters: string;
  tags: string; // JSON array
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Shape of rows in the certifications table. */
export interface CertificationRow {
  id: string;
  title: string;
  issuer: string;
  issue_date: string;
  credential_url: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Shape of rows in the logos table. */
export interface LogoRow {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Shape of rows in the showcase_videos table. */
export interface ShowcaseVideoRow {
  id: string;
  title: string;
  youtube_url: string;
  description: string;
  category: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ---- Client-facing (JSON) shapes -------------------------------------------

/** Uploaded resume, stored in site_settings as a base64 data URI. */
export interface ResumeInfo {
  /** Original filename, used for the Content-Disposition download name. */
  filename: string;
  /** `data:application/pdf;base64,…` payload. */
  data: string;
  /** ISO timestamp of the last upload. */
  updatedAt?: string;
}

/** theme + profile + contact + resume, as consumed by the frontends. */
export interface SiteSettings {
  theme: K.ThemeName;
  profile: SiteProfile;
  contact: SiteContact;
  /** Present only when a resume has been uploaded; null otherwise. */
  resume?: ResumeInfo | null;
}

export interface SiteProfile {
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  tagline: string;
  photo: string;
  photoWidth?: number;
  photoHeight?: number;
  heroVideoUrl: string;
  /** Brand logo (data URI). Null/absent -> the default "UG" monogram shows. */
  logo?: string | null;
  yearsExp: number;
  systemsDelivered: number;
  happyClients: number;
  avgRating: number;
  techStack: string[];
}

export interface SiteContact {
  email: string;
  whatsapp: string;
  whatsappRaw: string;
  linkedin: string;
  github: string;
  upwork: string;
  twitter?: string;
  kaggle: string;
}

export interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  deliverables: string[];
  tags: string[];
  price: number;
  priceSuffix: string;
  featured: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: K.ProjectCategory;
  categoryLabel: string;
  description: string;
  fullDetails: string;
  client: string;
  stack: string;
  impact: string;
  duration: string;
  projectUrl: string;
  image: string | null;
  gradient: string;
  imageWidth?: number;
  imageHeight?: number;
  caseStudy?: { problem: string; solution: string; result: string };
}

export interface Award {
  id: string;
  title: string;
  year: string;
  issuer: string;
  statusPill: string;
  description: string;
  whyItMatters: string;
  tags: string[];
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl: string;
  imageUrl: string;
}

export interface Logo {
  id: string;
  name: string;
  imageUrl: string;
}

export interface ShowcaseVideo {
  id: string;
  title: string;
  youtube_url: string;
  description: string;
  category: string;
  sort_order: number;
}

/** Aggregate payload injected into every page and served at /api/site-data. */
export interface SiteData {
  theme: K.ThemeName;
  profile: SiteProfile;
  contact: SiteContact;
  services: Service[];
  projects: Project[];
  awards: Award[];
  certifications: Certification[];
  logos: Logo[];
  showcaseVideos: ShowcaseVideo[];
  /** Resume availability + original filename (never the PDF payload). */
  resume: { filename: string; updatedAt?: string } | null;
}
