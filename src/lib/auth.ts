/**
 * Security helpers: PBKDF2 password hashing and HMAC-SHA256 signed
 * session cookies, both built on the Workers-compatible Web Crypto API.
 */
import { COOKIE_NAME, SESSION_TTL_SECONDS } from './constants';

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH_BITS = 256;

function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Derive a PBKDF2-SHA256 hash string of the form
 * `pbkdf2$<iterations>$<salt_b64>$<hash_b64>`.
 */
export async function hashPassword(
  password: string,
  salt?: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<string> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes as BufferSource, iterations, hash: 'SHA-256' },
    keyMaterial,
    PBKDF2_HASH_BITS,
  );
  return `pbkdf2$${iterations}$${b64encode(saltBytes.buffer as ArrayBuffer)}$${b64encode(bits)}`;
}

/** Constant-time comparison of two strings (length-safe). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still burn equivalent time on both branches.
    let diff = a.length ^ b.length;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Verify a plaintext password against a stored pbkdf2$... hash string. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = Number(parts[1]);
  const salt = b64decode(parts[2]);
  const expected = parts[3];
  const computed = await hashPassword(password, salt, iterations);
  return safeEqual(computed.split('$')[3], expected);
}

// ---------------------------------------------------------------------------
// Signed session cookies (HMAC-SHA256)
// ---------------------------------------------------------------------------

export interface SessionPayload {
  username: string;
  iat: number; // issued at (unix seconds)
  exp: number; // expiry (unix seconds)
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/** Produce a signed session token: `<payload_b64url>.<hmac_b64url>`. */
export async function createSessionToken(username: string, secret: string): Promise<string> {
  const payload: SessionPayload = {
    username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const sigB64 = b64encode(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${body}.${sigB64}`;
}

/** Validate a token's signature + expiry; returns the payload or null. */
export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1).replace(/-/g, '+').replace(/_/g, '/');
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64decode(sigB64) as BufferSource,
      new TextEncoder().encode(body),
    );
    if (!valid) return null;
    const json = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as SessionPayload;
    if (typeof payload.username !== 'string') return null;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Build the Set-Cookie header value for a fresh admin session. */
export function sessionCookie(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ].join('; ');
}

/** Set-Cookie value that expires the session cookie. */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Extract the session token from a request's Cookie header, if any. */
export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  for (const pair of cookie.split(';')) {
    const [name, ...rest] = pair.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=');
  }
  return null;
}
