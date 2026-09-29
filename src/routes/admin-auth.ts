/**
 * Admin authentication routes (all under /api/admin/auth/*).
 *
 * Uses three env secrets:
 *  - ADMIN_USERNAME      : admin username (set by `npm run seed`)
 *  - ADMIN_PASSWORD_HASH : PBKDF2-SHA256 hash of the admin password
 *                          (`pbkdf2$<iter>$<salt_b64>$<hash_b64>`, set by
 *                          `npm run seed` — the plaintext never persists)
 *  - SESSION_SECRET      : HMAC-SHA256 key for signing session cookies
 *
 * A signed HttpOnly session cookie is issued on successful login and
 * validated on every protected route. Login attempts are rate-limited
 * per IP to blunt credential stuffing.
 */
import { asString, json, readJsonBody } from '../lib/http';
import {
  clearSessionCookie,
  createSessionToken,
  getSessionToken,
  safeEqual,
  sessionCookie,
  verifyPassword,
  verifySessionToken,
} from '../lib/auth';
import type { Env } from '../lib/types';

/** Simple in-isolate login rate limiter: max 10 failures per 10 min per IP. */
const loginFailures = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const attempts = (loginFailures.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  loginFailures.set(ip, attempts);
  return attempts.length >= RATE_LIMIT_MAX;
}

function recordFailure(ip: string): void {
  const attempts = loginFailures.get(ip) ?? [];
  attempts.push(Date.now());
  loginFailures.set(ip, attempts);
}

function clientIp(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/** POST /api/admin/auth/login */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  const ip = clientIp(request);
  if (isRateLimited(ip)) {
    return json({ ok: false, error: 'Too many failed attempts. Try again in a few minutes.' }, 429);
  }

  const body = await readJsonBody(request);
  if (!body) return json({ ok: false, error: 'Invalid request body.' }, 400);

  const username = asString(body.username);
  const password = asString(body.password);
  if (!username || !password) {
    return json({ ok: false, error: 'Username and password are required.' }, 400);
  }

  const userOk = safeEqual(username, env.ADMIN_USERNAME || 'admin');
  const passOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH || '');
  if (!userOk || !passOk) {
    recordFailure(ip);
    return json({ ok: false, error: 'Invalid username or password.' }, 401);
  }

  loginFailures.delete(ip);
  const token = await createSessionToken(username, env.SESSION_SECRET);
  return json(
    { ok: true, username },
    200,
    { 'Set-Cookie': sessionCookie(token) },
  );
}

/** POST /api/admin/auth/logout */
export function handleLogout(): Response {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

/** GET /api/admin/auth/session — used by the panel to detect live sessions. */
export async function handleSession(request: Request, env: Env): Promise<Response> {
  const token = getSessionToken(request);
  if (!token) return json({ ok: true, authenticated: false }, 200);
  const payload = await verifySessionToken(token, env.SESSION_SECRET);
  if (!payload) return json({ ok: true, authenticated: false }, 200);
  return json({ ok: true, authenticated: true, username: payload.username }, 200);
}
