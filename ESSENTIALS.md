# Essential portfolio improvements

The stack remains a TypeScript Cloudflare Worker, D1, HTML templates, vanilla JavaScript, and CSS. No runtime dependency was added. Original project media and database content were preserved.

## Changelog by file

| File | Change |
| --- | --- |
| `templates/index.html` | Visible final stat fallbacks, audience sentence, two primary CTAs,  concise skills/experience, descriptive service links, Upwork badges and review-link placeholders. Client quote wording is unchanged. |
| `templates/about.html` | Skip link, accessible headings,  consistent footer labels, image dimensions. Existing career content and dates retained. |
| `templates/services.html` | Consistent navigation/footer and heading levels; resume navigation. |
| `templates/portfolio.html` | Server-rendered project grid, project-section heading, keyboard-accessible details dialog, shared navigation/footer fixes. |
| `templates/awards.html` | Shared navigation/footer, skip link, headings, consistent navigation. |
| `templates/contact.html` | Contact buttons; required project type; input limits; honeypot; live status; native form fallback; shared navigation/footer fixes. |
| `src/lib/templates.ts` | Server-rendered project Problem/Solution/Result and tech tags; image metadata; final D1 counter values;  SEO; social/review placeholders. |
| `src/lib/public-content.ts` | Public-only WebP mapping, verified-format profile links, resume-backed project summaries, per-page SEO and Person JSON-LD. Admin originals stay unchanged. |
| `src/lib/public-config.ts` | Existing origin, booking URL, resume path, skills, and editable review/preview/outcome TODOs. |
| `src/lib/types.ts` | Optional image dimensions and public case-study fields. No database schema change. |
| `src/lib/image-manifest.json` | Source-image fingerprints map to compressed WebP copies with dimensions. |
| `src/routes/public-api.ts` | Compressed public API images; honeypot and length/type validation; native HTML submission response; no false success when persistence and notification both fail. |
| `public/js/main.js` | Once-only counters, reduced-motion behavior, skip-link focus, mobile menu keyboard behavior, inactive-review focus handling, logo dimensions/lazy loading. |
| `public/js/site-data.js` | Retains server-rendered cards; real counter values during hydration; accessible dynamic image/service markup; no invented project metadata fallbacks. |
| `public/js/contact.js` | Native constraints, duplicate-submit protection, busy state, success/error announcements, network failure handling. |
| `public/js/portfolio.js` | Details-dialog focus, Escape/Tab behavior, full-size image dimensions, and consistent card filtering layout. |
| `public/css/refresh.css` | Styles for added content, compact tags/facts, visible focus/skip link, neutral badges, mobile  and honeypot. Current design retained. |
| `public/assets/optimized/*.webp` | Compressed copies of the existing profile, poster, and project images. |
| `public/assets/Usama_Gul_AIML_Engineer.pdf` | Removed at the owner's request; public resume downloads and the `/resume` endpoint are disabled. |
| `public/robots.txt`, `public/sitemap.xml` | Actual public URLs; API/admin paths excluded from crawling. Existing UG favicon retained. |
| `scripts/optimize-images.py` | Optional local optimization tool using Pillow; no Worker/Python runtime dependency. Rerun after changing uploaded images to refresh the manifest and redeploy. |
| `scripts/check-essentials.mjs` | Rendering, quotes, links, SEO, PDF, and mocked contact API checks. |
| `scripts/check-layout.cjs` | Chrome checks at 360/768/1440, image dimensions, headings, keyboard access, video, no-JS, motion, counters, and mocked contact UI. |
| `package.json` | Non-deploying production build and repeatable check commands. |

## Remaining placeholders

1. `[TODO: add GitHub URL]` - set the real profile in Admin > Contact settings.
2. `[TODO: add Kaggle URL]` - the existing Kaggle icon had only a generic homepage URL; set a real profile in Admin > Contact settings.
3. `[TODO: add Upwork review URL for HoloLens 2]` - fill `REVIEW_URLS.hololens` in `src/lib/public-config.ts`.
4. `[TODO: add Upwork review URL for ONNX Runtime]` - fill `REVIEW_URLS.onnx`.
5. `[TODO: add Upwork review URL for OpenCV]` - fill `REVIEW_URLS.opencv`.
6. `[TODO: add measurable Acne Detection outcome]` - fill `ACNE_MEASURED_OUTCOME` with a verified result.
7. `[TODO: add social preview image URL]` - fill `SOCIAL_PREVIEW_IMAGE`. The current real profile image is used until then, so sharing tags already have a working image.

The existing Google booking URL, LinkedIn, Upwork profile, role dates, and confirmed counters were reused, so no dummy links or replacement facts were introduced. Future projects with missing problem/description/stack/result fields display field-specific TODOs instead of invented content.

## Validation

Start the local Worker with `npm run dev`, then run:

```sh
npm run typecheck
npm run build
npm run check:essentials
npm run check:layout
```

`build` uses Wrangler's production dry run and does not publish. Layout checks require local Chrome/Edge; use `PORTFOLIO_CHROME_PATH` if it is installed elsewhere. `PORTFOLIO_BASE_URL` can select another local preview URL. The check scripts use dependencies already installed with Wrangler.

Contact API tests use a fake database, and browser submission tests mock fetch; no test emails are sent. Real email notification and acknowledgment delivery still use the existing Resend configuration described in README.md.

## Resume download removal

All public navbar, mobile-menu, and hero resume links were removed. The bundled public PDF and `/resume` download endpoint were removed. Private admin resume storage is retained. Checks assert that both former public download URLs return 404.
