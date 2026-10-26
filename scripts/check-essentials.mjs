import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const base = process.env.PORTFOLIO_BASE_URL || 'http://127.0.0.1:8787';
const pages = ['/', '/about', '/services', '/portfolio', '/awards', '/contact'];
const documents = new Map();
const titles = new Set(), descriptions = new Set();
for (const route of pages) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text(); documents.set(route, html);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One H1: ' + route);
    const title = html.match(/<title>([^<]+)<\/title>/)[1];
    const description = html.match(/<meta name="description"\s+content="([^"]+)"/)[1];
    assert(!titles.has(title), 'Unique title'); titles.add(title);
    assert(!descriptions.has(description), 'Unique description'); descriptions.add(description);
    assert(html.includes('href="https://resume.usamagul.workers.dev' + route + '"'), 'Canonical URL: ' + route);
    for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) assert(html.includes('"' + tag + '"'), tag);
    const person = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(person['@type'], 'Person'); assert.equal(person.name, 'Usama Gul');
    assert(person.sameAs.every(link => !['https://github.com', 'https://kaggle.com'].includes(link)));
    assert(html.includes('class="skip-link"')); assert(html.includes('id="main-content"'));
    assert(!/Usefull links|Technical Contact|Start an Engagement|Credentials &amp; Achievements/.test(html));
    assert(!/__(?:RESUME_HREF|REVIEW_LINK_\w+|PORTFOLIO_PROJECTS|GITHUB_LINK|KAGGLE_LINK)__/.test(html));
    console.log('PASS server-rendered page, metadata, and labels:', route);
}
const home = documents.get('/');
assert.deepEqual([...home.matchAll(/<span class="counter"[^>]*>(.*?)<\/span>/g)].map(m => m[1]), ['15+', '10+', '4+', '4.9/5']);
assert.equal((home.match(/class="selected-card"/g) || []).length, 3);
assert(home.includes('Data Engineering & Feature Stores')); assert(home.includes('ETL workflows'));
assert(!/Download Resume/i.test(home)); assert(home.includes('https://calendar.app.google/ruxHQrLvg9ja2MWk6'));
assert(home.includes('Mar 2022 - Nov 2024')); assert(home.includes('Dec 2024 - Present'));
assert(!/class="author-avatar">UW/.test(home));
const original = execFileSync('git', ['show', 'HEAD:templates/index.html'], { encoding: 'utf8' });
const quotes = text => [...text.matchAll(/<p class="testimonial-text">(.*?)<\/p>/gs)].map(m => m[1].replace(/\s+/g, ' ').trim());
assert.deepEqual(quotes(home), quotes(original), 'Client quotes must stay unchanged');
const portfolio = documents.get('/portfolio');
const data = JSON.parse(portfolio.match(/window\.__SITE_DATA__ = (.*?)<\/script>/s)[1]);
assert.equal((portfolio.match(/class="portfolio-card card-visible"/g) || []).length, data.projects.length);
assert(data.projects.every(project => project.caseStudy && project.caseStudy.problem && project.caseStudy.solution && project.caseStudy.result));
assert(data.projects.find(project => /acne/i.test(project.title)).caseStudy.result.includes('[TODO: add measurable Acne Detection outcome]'));
assert(data.projects.every(project => project.stack));
// Every internal navigation/footer link must resolve to a real page and anchor.
for (const [route, html] of documents) {
    const regions = [html.match(/<header\b.*?<\/header>/s)?.[0], html.match(/<footer\b.*?<\/footer>/s)?.[0]].filter(Boolean);
    for (const region of regions) for (const match of region.matchAll(/href="([^"]+)"/g)) {
        const href = match[1]; if (!href.startsWith('/') && !href.startsWith('#')) continue;
        const url = new URL(href, base + route);
        const target = documents.get(url.pathname);
        if (target) { if (url.hash) assert(target.includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"')); }
        else assert.equal((await fetch(url)).status, 200, 'Working navigation link: ' + href);
    }
}
for (const asset of ['/robots.txt', '/sitemap.xml', '/favicon.svg']) {
    const response = await fetch(base + asset); assert.equal(response.status, 200, asset);

}
for (const route of ['/resume', '/assets/Usama_Gul_AIML_Engineer.pdf']) assert.equal((await fetch(base + route)).status, 404, 'Resume downloads are disabled');
const compiled = require('esbuild').buildSync({ entryPoints: ['src/routes/public-api.ts'], bundle: true, platform: 'node', format: 'cjs', loader: { '.html': 'text' }, write: false });
const mod = { exports: {} }; new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(require, mod, mod.exports);
const submit = mod.exports.handleContactSubmit;
let writes = 0;
const env = { DB: { prepare: () => ({ bind: () => ({ run: async () => { writes++; return { success: true }; } }) }) } };
const valid = { name: 'Test Person', email: 'test@example.com', service: 'computer-vision', message: 'This is a local automated validation test.', website: '' };
const request = value => new Request(base + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
assert.equal((await submit(request({ ...valid, website: 'spam.example' }), env)).status, 200); assert.equal(writes, 0, 'Honeypot must not persist or email');
for (const invalid of [{ ...valid, email: 'bad' }, { ...valid, service: '' }, { ...valid, message: 'short' }, { ...valid, name: 'X' }]) assert.equal((await submit(request(invalid), env)).status, 400);
assert.equal(writes, 0);
const success = await submit(request(valid), env); assert.equal(success.status, 200); assert.equal(writes, 1);
const failedEnv = { DB: { prepare: () => { throw new Error('Simulated local persistence failure'); } } };
assert.equal((await submit(request(valid), failedEnv)).status, 503, 'No false success on delivery failure');
const urlencoded = new Request(base + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(valid) });
const nativeResponse = await submit(urlencoded, env); assert.equal(nativeResponse.status, 200); assert(nativeResponse.headers.get('Content-Type').includes('text/html'));
const placeholders = new Set([...documents.values()].flatMap(html => [...html.matchAll(/\[TODO:[^\]]+\]/g)].map(match => match[0])));
console.log('PASS no-JavaScript counters/projects, unchanged testimonials, real links and disabled resume downloads, honeypot, validation, honest delivery states, and native form submission.');
console.log('Current TODOs:', [...placeholders].sort().join('\n'));
