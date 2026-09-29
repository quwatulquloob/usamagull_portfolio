/**
 * Public (unauthenticated) API routes.
 *
 *   GET  /api/site-data  -> full content bundle (theme, profile, contact,
 *                           services, projects, awards) for client hydration
 *   POST /api/contact    -> contact form intake (logged for retrieval)
 */
import { asString, errorPage, json, readJsonBody } from '../lib/http';
import { getSettings, listAwards, listLogos, listProjects, listServices } from '../lib/db';
import { buildSiteData } from '../lib/templates';
import type { Env } from '../lib/types';

/** GET /api/site-data */
export async function handleSiteData(env: Env): Promise<Response> {
  const [settings, services, projects, awards, logos] = await Promise.all([
    getSettings(env.DB),
    listServices(env.DB),
    listProjects(env.DB),
    listAwards(env.DB),
    listLogos(env.DB),
  ]);
  return json(
    { ok: true, ...buildSiteData(settings, services, projects, awards, logos) },
    200,
    // Short edge cache with revalidation; admin edits appear within 60s.
    { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
  );
}

/**
 * GET /resume — serve the admin-uploaded resume PDF as a download.
 * Decodes the base64 data URI stored in site_settings and streams it with
 * `Content-Disposition: attachment` so browsers save the original filename.
 */
export async function handleResumeDownload(env: Env): Promise<Response> {
  const resume = (await getSettings(env.DB)).resume;
  if (!resume || !resume.data) {
    return errorPage(404, 'Resume not available', 'A resume has not been uploaded yet. Please check back soon.');
  }

  // Decode the `data:application/pdf;base64,…` payload.
  const commaIdx = resume.data.indexOf(',');
  const base64 = commaIdx >= 0 ? resume.data.slice(commaIdx + 1) : '';
  let bytes: Uint8Array;
  try {
    const bin = atob(base64);
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  } catch {
    return errorPage(404, 'Resume not available', 'The stored resume file appears to be corrupted. Please contact the site owner.');
  }

  // Header values must be latin-1 safe; strip CR/LF to prevent header injection.
  const safeName = (resume.filename || 'resume.pdf').replace(/[^\x20-\x7E]/g, '').replace(/["\\/\r\n]/g, '').trim() || 'resume.pdf';
  const encodedName = encodeURIComponent(safeName);
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'no-store',
    },
  });
}

/** POST /api/contact */
export async function handleContactSubmit(request: Request, env: Env): Promise<Response> {
  const body = await readJsonBody(request);
  if (!body) return json({ ok: false, error: 'Invalid request body.' }, 400);

  const name = asString(body.name);
  const email = asString(body.email);
  const message = asString(body.message);
  const service = asString(body.service);
  const budget = asString(body.budget);

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email, and message are required.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Enter a valid email address.' }, 400);
  }

  // Persist the inquiry so it can be retrieved later. A dedicated table keeps
  // this feature useful without expanding the admin UI scope.
  try {
    await env.DB.prepare(
      'INSERT INTO contact_messages (name, email, service, budget, message) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(name, email, service, budget, message)
      .run();
  } catch {
    // Table may not exist in older databases — still accept the submission.
  }

  // Send email notification via Resend (only when secrets are configured).
  if (env.RESEND_API_KEY && env.NOTIFY_EMAIL) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(env.RESEND_API_KEY);
      const serviceRow = service ? `<tr><td style="padding:8px 0;color:#999;">Service</td><td style="padding:8px 0;">${service}</td></tr>` : '';
      const budgetRow  = budget  ? `<tr><td style="padding:8px 0;color:#999;">Budget</td><td style="padding:8px 0;">${budget}</td></tr>` : '';
      await resend.emails.send({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: env.NOTIFY_EMAIL,
        replyTo: email,
        subject: `New contact from ${name}${service ? ` — ${service}` : ''}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f0f0f;color:#e5e5e5;border-radius:12px;"><h2 style="color:#a78bfa;margin-top:0;">New Portfolio Inquiry</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:8px 0;color:#999;width:110px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr><tr><td style="padding:8px 0;color:#999;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#a78bfa;">${email}</a></td></tr>${serviceRow}${budgetRow}</table><hr style="border:none;border-top:1px solid #333;margin:16px 0;"/><h3 style="color:#999;font-size:14px;margin-bottom:8px;">MESSAGE</h3><p style="background:#1a1a1a;padding:16px;border-radius:8px;line-height:1.6;white-space:pre-wrap;">${message}</p><p style="color:#555;font-size:12px;margin-top:24px;">Sent from your portfolio contact form</p></div>`,
      });
    } catch (err) {
      // Email failure must never break the user-facing response.
      console.error('Resend email failed:', err);
    }
  }

  return json({ ok: true, message: 'Thanks! Your inquiry has been received.' });
}
