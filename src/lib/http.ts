/**
 * HTTP helpers shared by the API and page renderers.
 */
import { SITE_NAME } from './constants';

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

export function html(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...headers,
    },
  });
}

/**
 * Parse a JSON request body defensively.
 * Returns null when the body is missing, malformed, or not an object.
 */
export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/** Coerce unknown JSON values into trimmed strings. */
export function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback;
}

/** Coerce unknown JSON values into finite numbers. */
export function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Coerce unknown JSON values into string arrays. */
export function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).map((s) => s.trim()).filter(Boolean);
}

/**
 * Fallback error page shown whenever an unexpected error escapes route
 * handling (e.g. D1 unavailable). Plain HTML, no DB access needed.
 */
export function errorPage(status: number, title: string, message: string): Response {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${status} — ${title} | ${SITE_NAME}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #0a0a0f; color: #e8e8ee; font-family: system-ui, -apple-system, sans-serif;
    padding: 24px; text-align: center;
  }
  .card { max-width: 520px; }
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
    <div class="code">${status}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="btn" href="/">Back to homepage</a>
  </div>
</body>
</html>`;
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
