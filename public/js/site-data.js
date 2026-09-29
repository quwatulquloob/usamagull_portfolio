/* ============================================
   USAMA GUL — SITE DATA LAYER (D1-backed)
   Consumes the SSR-injected `window.__SITE_DATA__`
   bootstrap (rendered from Cloudflare D1 by the
   Worker), with a fetch fallback for edge caches.
   ============================================ */

const FALLBACK_DATA = {
    theme: 'charcoal-orange',
    profile: {
        name: 'Usama Gul',
        firstName: 'Usama',
        lastName: 'Gul',
        title: 'AI / ML Engineer',
        tagline: 'Building production-scale AI that actually ships.',
        photo: '/assets/profile.png',
        yearsExp: 4,
        systemsDelivered: 15,
        happyClients: 10,
        avgRating: 4.9,
        techStack: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'LLMs', 'LangGraph', 'OpenCV']
    },
    contact: {
        email: 'rajausamagull123@gmail.com',
        whatsapp: '+92 312 0979064',
        whatsappRaw: '923120979064',
        linkedin: 'https://linkedin.com',
        github: 'https://github.com',
        twitter: 'https://twitter.com',
        kaggle: 'https://kaggle.com'
    },
    services: [],
    projects: [],
    awards: [],
    resume: null
};

let cachedData = null;

/** Get the D1-rendered site data (bootstrap injected by the Worker). */
function getSiteData() {
    if (cachedData) return cachedData;
    if (window.__SITE_DATA__ && window.__SITE_DATA__.profile) {
        cachedData = window.__SITE_DATA__;
        return cachedData;
    }
    // Fallback: fetch from the public API (e.g. page served by a stale edge cache).
    return cachedData || FALLBACK_DATA;
}

/** Apply the D1-selected theme to <html> and <body>. */
function applyTheme(themeName) {
    const validThemes = ['charcoal-orange', 'midnight-blue', 'slate-purple', 'emerald-dark'];
    const selectedTheme = validThemes.includes(themeName) ? themeName : 'charcoal-orange';
    document.documentElement.setAttribute('data-theme', selectedTheme);
    document.body.setAttribute('data-theme', selectedTheme);
}

/** Escape text before injecting into innerHTML-built cards. */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/** Hydrate public pages with live D1 data. */
function hydratePage() {
    const data = getSiteData();
    applyTheme(data.theme);

    // Profile basics
    document.querySelectorAll('[data-bind="profile.name"]').forEach(el => el.textContent = data.profile.name);
    document.querySelectorAll('[data-bind="profile.title"]').forEach(el => el.textContent = data.profile.title);
    document.querySelectorAll('[data-bind="profile.tagline"]').forEach(el => el.textContent = data.profile.tagline);

    // Hero name / title / tagline
    const heroName = document.querySelector('.hero-name');
    if (heroName && data.profile.firstName) {
        heroName.innerHTML = `<span class="name-line">${escapeHtml(data.profile.firstName)}</span> <span class="name-line accent">${escapeHtml(data.profile.lastName)}</span>`;
    }
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && data.profile.title) heroTitle.textContent = data.profile.title;
    const heroTagline = document.querySelector('.hero-tagline');
    if (heroTagline && data.profile.tagline) heroTagline.textContent = data.profile.tagline;

    // Stat counters
    const statCards = document.querySelectorAll('.stat-card .counter');
    if (statCards.length >= 4) {
        if (data.profile.systemsDelivered) statCards[0].dataset.target = data.profile.systemsDelivered;
        if (data.profile.yearsExp) statCards[2].dataset.target = data.profile.yearsExp;
        if (data.profile.avgRating) statCards[3].dataset.target = data.profile.avgRating;
    }

    // Profile photo
    if (data.profile.photo) {
        document.querySelectorAll('#profilePhoto, .hero-photo, .story-photo').forEach(img => {
            img.src = data.profile.photo;
        });
    }

    // Resume download button — revealed only when a resume is uploaded.
    const resumeBtn = document.getElementById('downloadResumeBtn');
    if (resumeBtn && data.resume && data.resume.filename) {
        resumeBtn.hidden = false;
    }

    // Brand logo — replaces the "UG" monogram in navbars when uploaded.
    if (data.profile && data.profile.logo) {
        document.querySelectorAll('.logo-mark').forEach(el => {
            if (!el.querySelector('img')) {
                el.classList.add('has-logo');
                el.innerHTML = `<img src="${escapeHtml(data.profile.logo)}" alt="${escapeHtml(data.profile.name || 'Logo')} logo">`;
            }
        });
    }

    // Contact details
    document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = `mailto:${data.contact.email}`;
        if (el.querySelector('span')) {
            el.querySelector('span').textContent = data.contact.email;
        } else if (el.textContent.includes('@')) {
            el.textContent = data.contact.email;
        }
    });

    document.querySelectorAll('[data-bind="contact.whatsapp"]').forEach(el => {
        el.textContent = data.contact.whatsapp;
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        const raw = (data.contact.whatsappRaw || data.contact.whatsapp).replace(/[^0-9]/g, '');
        el.href = `https://wa.me/${raw}`;
    });

    // Social links
    if (data.contact.linkedin) {
        document.querySelectorAll('a[aria-label="LinkedIn"], a[aria-label="LinkedIn Profile"]').forEach(a => a.href = data.contact.linkedin);
    }
    if (data.contact.github) {
        document.querySelectorAll('a[aria-label="GitHub"], a[aria-label="GitHub Profile"]').forEach(a => a.href = data.contact.github);
    }

    // ── Dynamic Services Rendering (services page) ──
    const servicesGrid = document.querySelector('.services-detail-section .services-list');
    if (servicesGrid && data.services && data.services.length) {
        servicesGrid.innerHTML = data.services.map((svc, i) => `
            <div class="service-detail-card reveal-up visible" style="--delay: ${i * 0.1}s">
                <div class="service-card-header">
                    <div class="service-header-left">
                        <div class="service-badge-cat ${i % 2 === 1 ? 'blue-cat' : ''}">${escapeHtml(svc.category)}</div>
                        <div class="service-icon-box ${i % 2 === 1 ? 'icon-blue' : ''}">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                        </div>
                    </div>
                </div>
                <div class="service-card-body">
                    <h2 class="service-card-title">${escapeHtml(svc.title)}</h2>
                    <p class="service-card-description">${escapeHtml(svc.description)}</p>
                    <div class="service-deliverables">
                        <h4 class="deliverables-heading">Key Capabilities &amp; Deliverables:</h4>
                        <ul class="deliverables-list">
                            ${(svc.deliverables || []).map(d => `
                                <li>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    ${escapeHtml(d)}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="service-card-footer">
                        <div class="tech-stack-mini">
                            ${(svc.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                        </div>
                        <a href="/contact?service=${encodeURIComponent(svc.id || svc.title)}" class="btn ${i % 2 === 0 ? 'btn-primary' : 'btn-outline'}">
                            <span>Inquire About This Service</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ── Dynamic Portfolio Rendering (portfolio page) ──
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (portfolioGrid && data.projects && data.projects.length) {
        portfolioGrid.innerHTML = data.projects.map((proj, i) => `
            <div class="portfolio-card reveal-up visible card-visible" data-category="${escapeHtml(proj.category)}" data-index="${i}">
                <div class="portfolio-thumb" style="--thumb-gradient: ${proj.gradient || 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'}">
                    <div class="portfolio-thumb-inner">
                        ${proj.image ? `<img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}" style="width: 100%; height: 100%; object-fit: cover;">` : `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
                    </div>
                    <div class="portfolio-card-overlay">
                        <button class="portfolio-view-btn" aria-label="View project details">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                            <span>View Details</span>
                        </button>
                    </div>
                </div>
                <div class="portfolio-card-body">
                    <span class="portfolio-card-cat">${escapeHtml(proj.categoryLabel || proj.category)}</span>
                    <h3 class="portfolio-card-title">${escapeHtml(proj.title)}</h3>
                    <p class="portfolio-card-desc">${escapeHtml(proj.description)}</p>
                </div>
                <div class="lightbox-data" hidden>
                    <h3>${escapeHtml(proj.title)}</h3>
                    <span class="lb-cat">${escapeHtml(proj.categoryLabel || proj.category)}</span>
                    <div class="lb-details">
                        <p>${escapeHtml(proj.fullDetails || proj.description)}</p>
                        <div class="lb-meta">
                            <div class="lb-meta-item"><strong>Client:</strong> ${escapeHtml(proj.client || 'Enterprise')}</div>
                            <div class="lb-meta-item"><strong>Stack:</strong> ${escapeHtml(proj.stack || 'Python, AI')}</div>
                            <div class="lb-meta-item"><strong>Impact:</strong> ${escapeHtml(proj.impact || 'Production Deployed')}</div>
                            <div class="lb-meta-item"><strong>Duration:</strong> ${escapeHtml(proj.duration || '3 months')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-attach card click listeners if portfolio.js is present
        if (window.initPortfolioListeners) {
            window.initPortfolioListeners();
        }
    }

    // ── Dynamic Awards Rendering (awards page) ──
    const awardsList = document.querySelector('.awards-section .awards-list');
    if (awardsList && data.awards && data.awards.length) {
        awardsList.innerHTML = data.awards.map((aw, i) => `
            <div class="award-card reveal-up visible" style="--delay: ${i * 0.1}s">
                <div class="award-layout">
                    <div class="award-visual">
                        <div class="award-trophy-badge ${i % 2 === 1 ? 'icon-blue' : ''}">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        </div>
                        <span class="award-year-tag ${i % 2 === 1 ? 'blue-tag' : ''}">${escapeHtml(aw.year)}</span>
                    </div>
                    <div class="award-main">
                        <div class="award-header-row">
                            <div>
                                <span class="award-issuer">${escapeHtml(aw.issuer)}</span>
                                <h2 class="award-title">${escapeHtml(aw.title)}</h2>
                            </div>
                            <span class="award-status-pill ${i % 2 === 1 ? 'blue-pill' : ''}">${escapeHtml(aw.statusPill || 'Achievement')}</span>
                        </div>
                        <p class="award-description">${escapeHtml(aw.description)}</p>
                        <div class="award-highlight-box ${i % 2 === 1 ? 'blue-highlight' : ''}">
                            <div class="highlight-label">Why It Matters:</div>
                            <p class="highlight-text">${escapeHtml(aw.whyItMatters)}</p>
                        </div>
                        <div class="award-tags">
                            ${(aw.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    hydratePage();

    // If the SSR bootstrap was missing (stale cache), hydrate from the API.
    if (!window.__SITE_DATA__) {
        fetch('/api/site-data')
            .then(r => (r.ok ? r.json() : null))
            .then(payload => {
                if (payload && payload.profile) {
                    cachedData = payload;
                    hydratePage();
                }
            })
            .catch(() => { /* fall back to built-in defaults silently */ });
    }
});

// Expose globally (admin panel + portfolio scripts rely on this)
window.SiteData = {
    get: getSiteData,
    applyTheme: applyTheme,
    hydrate: hydratePage,
    escapeHtml: escapeHtml,
    fallback: FALLBACK_DATA
};
