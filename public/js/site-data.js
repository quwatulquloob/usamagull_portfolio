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
        tagline: 'Building scalable AI systems that actually ship.',
        photo: '/assets/profile.png',
        heroVideoUrl: '',
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
        upwork: 'https://www.upwork.com/freelancers/~01440869ef56e8e97a',
        twitter: 'https://www.upwork.com/freelancers/~01440869ef56e8e97a',
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
    renderHeroVideo(data.profile.heroVideoUrl);

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
    if (servicesGrid && data.services) {
        if (data.services.length === 0) {
            servicesGrid.innerHTML = '<p class="services-empty">New service packages are coming soon. Please get in touch to discuss your project.</p>';
        } else {
            servicesGrid.innerHTML = data.services.map((svc, i) => `
                <div class="service-detail-card reveal-up visible" style="--delay: ${i * 0.1}s">
                    <div class="service-card-header">
                        <span class="service-badge-cat ${i % 2 === 1 ? 'blue-cat' : ''}">${escapeHtml(svc.category)}</span>
                        <div class="service-package-price">
                            <span class="service-price-label">${Number(svc.price) > 0 ? 'Starting at' : 'Pricing'}</span>
                            <strong>${Number(svc.price) > 0 ? `$${Number(svc.price).toLocaleString('en-US')}` : 'Custom quote'}</strong>
                            ${Number(svc.price) > 0 && svc.priceSuffix ? `<span class="service-price-suffix">${escapeHtml(svc.priceSuffix)}</span>` : ''}
                        </div>
                    </div>
                    <div class="service-card-body">
                        <h2 class="service-card-title">${escapeHtml(svc.title)}</h2>
                        <p class="service-card-description">${escapeHtml(svc.description)}</p>
                        ${(svc.deliverables || []).length ? `
                        <div class="service-deliverables">
                            <h4 class="deliverables-heading">What’s included</h4>
                            <ul class="deliverables-list">
                                ${(svc.deliverables || []).map(d => `
                                    <li>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                        ${escapeHtml(d)}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>` : ''}
                        <div class="service-card-footer">
                            ${(svc.tags || []).length ? `<div class="tech-stack-mini">
                                ${(svc.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                            </div>` : ''}
                            <a href="/contact?service=${encodeURIComponent(svc.id || svc.title)}" class="btn ${i % 2 === 0 ? 'btn-primary' : 'btn-outline'}">
                                <span>Discuss This Service</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ── Dynamic Portfolio Rendering (portfolio page) ──
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (portfolioGrid && data.projects && data.projects.length) {
        portfolioGrid.innerHTML = data.projects.map((proj, i) => `
            <div class="portfolio-card reveal-up visible card-visible" data-category="${escapeHtml(proj.category)}" data-index="${i}">
                <div class="portfolio-thumb" style="--thumb-gradient: ${proj.gradient || 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'}">
                    <div class="portfolio-thumb-inner">
                        ${proj.image ? `<img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}">` : `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
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
                    ${/^https?:\/\//i.test(proj.projectUrl || '') ? `<a class="lb-project-link" href="${escapeHtml(proj.projectUrl)}" target="_blank" rel="noopener noreferrer">Open project ↗</a>` : ''}
                </div>
                <div class="lightbox-data" hidden>
                    <h3>${escapeHtml(proj.title)}</h3>
                    <span class="lb-cat">${escapeHtml(proj.categoryLabel || proj.category)}</span>
                    <div class="lb-details">
                        <p>${escapeHtml(proj.fullDetails || proj.description)}</p>
                        ${/^https?:\/\//i.test(proj.projectUrl || '') ? `<a class="lb-project-link" href="${escapeHtml(proj.projectUrl)}" target="_blank" rel="noopener noreferrer">View live project / GitHub</a>` : ''}
                        <div class="lb-meta">
                            <div class="lb-meta-item"><strong>Client:</strong> ${escapeHtml(proj.client || 'Enterprise')}</div>
                            <div class="lb-meta-item"><strong>Stack:</strong> ${escapeHtml(proj.stack || 'Python, AI')}</div>
                            <div class="lb-meta-item"><strong>Impact:</strong> ${escapeHtml(proj.impact || 'Live Deployment')}</div>
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

    // ── Dynamic Certifications Rendering (achievements page) ──
    const certificationsSection = document.getElementById('certifications');
    const certificationsGrid = document.getElementById('certificationsGrid');
    if (certificationsSection && certificationsGrid) {
        const certifications = data.certifications || [];
        certificationsSection.hidden = certifications.length === 0;
        certificationsGrid.innerHTML = certifications.map(certification => {
            const imageUrl = safeCertificationImageUrl(certification.imageUrl);
            const credentialUrl = safeCredentialUrl(certification.credentialUrl);
            return `
                <article class="certification-card">
                    ${imageUrl
                        ? `<button class="certification-image-button" type="button" aria-label="View ${escapeHtml(certification.title)} certificate"><img class="certification-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(certification.title)} certificate" loading="lazy"></button>`
                        : '<div class="certification-image-placeholder" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg></div>'}
                    <div class="certification-card-body">
                        ${certification.issuer ? `<p class="certification-issuer">${escapeHtml(certification.issuer)}</p>` : ''}
                        <h3 class="certification-title">${escapeHtml(certification.title)}</h3>
                        ${certification.issueDate ? `<p class="certification-date">Issued ${escapeHtml(certification.issueDate)}</p>` : ''}
                        ${credentialUrl ? `<a class="certification-link" href="${escapeHtml(credentialUrl)}" target="_blank" rel="noopener noreferrer">View credential <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg></a>` : ''}
                    </div>
                </article>
            `;
        }).join('');
        certificationsGrid.querySelectorAll('.certification-image-button').forEach(button => {
            button.addEventListener('click', () => openCertificateViewer(button));
        });
    }

    // ── Dynamic Video Showcase Rendering (home page) ──
    renderVideoShowcase(data);
}

function safeCertificationImageUrl(value) {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    return /^(data:image\/|https?:\/\/|\/)/.test(url) ? url : '';
}

function safeCredentialUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch {
        return '';
    }
}

function openCertificateViewer(button) {
    const dialog = document.getElementById('certificateViewer');
    const image = document.getElementById('certificateViewerImage');
    const title = document.getElementById('certificateViewerTitle');
    const thumbnail = button.querySelector('.certification-image');
    if (!dialog || !image || !title || !thumbnail || typeof dialog.showModal !== 'function') return;

    image.src = thumbnail.src;
    image.alt = thumbnail.alt;
    title.textContent = thumbnail.alt.replace(/\s+certificate$/i, '');
    dialog.showModal();
    document.getElementById('certificateViewerClose')?.focus();
}

function setupCertificateViewer() {
    const dialog = document.getElementById('certificateViewer');
    const closeButton = document.getElementById('certificateViewerClose');
    const image = document.getElementById('certificateViewerImage');
    if (!dialog || !closeButton || !image) return;

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
        image.removeAttribute('src');
        image.alt = '';
    });
}

function renderHeroVideo(rawUrl) {
    const wrapper = document.getElementById('heroVideoWrapper');
    const placeholder = document.getElementById('heroVideoPlaceholder');
    if (!wrapper || !rawUrl) return;

    const videoId = heroYouTubeVideoId(rawUrl);
    if (!videoId) return;

    const existingPreview = wrapper.querySelector('.hero-video-preview');
    if (existingPreview && existingPreview.dataset.videoId === videoId) {
        wrapper.dataset.videoId = videoId;
        if (existingPreview.dataset.clickHandlerAttached !== 'true') {
            existingPreview.addEventListener('click', openHeroVideoDialog);
            existingPreview.dataset.clickHandlerAttached = 'true';
        }
        const thumbnail = existingPreview.querySelector('.hero-video-thumbnail');
        thumbnail?.addEventListener('error', () => {
            thumbnail.src = '/assets/profile.png';
        }, { once: true });
        return;
    }

    const preview = document.createElement('button');
    preview.className = 'hero-video-preview';
    preview.type = 'button';
    preview.setAttribute('aria-label', 'Play introduction video');
    preview.dataset.videoId = videoId;

    const thumbnail = document.createElement('img');
    thumbnail.className = 'hero-video-thumbnail';
    thumbnail.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    thumbnail.alt = '';
    thumbnail.loading = 'eager';
    thumbnail.addEventListener('error', () => {
        thumbnail.src = '/assets/profile.png';
    }, { once: true });

    const playIcon = document.createElement('span');
    playIcon.className = 'hero-video-preview-play';
    playIcon.setAttribute('aria-hidden', 'true');
    playIcon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 12 7-12 7z"></path></svg>';

    const previewLabel = document.createElement('span');
    previewLabel.className = 'hero-video-preview-label';
    previewLabel.textContent = 'Watch introduction';

    preview.append(thumbnail, playIcon, previewLabel);
    if (placeholder) {
        wrapper.replaceChild(preview, placeholder);
    } else {
        wrapper.replaceChildren(preview);
    }
    wrapper.dataset.videoId = videoId;

    preview.addEventListener('click', openHeroVideoDialog);
}

function openHeroVideoDialog() {
    const dialog = document.getElementById('heroVideoDialog');
    const playerContainer = document.getElementById('heroVideoDialogPlayer');
    const videoId = document.getElementById('heroVideoWrapper')?.dataset.videoId;
    if (!dialog || !playerContainer || !videoId || typeof dialog.showModal !== 'function') return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    iframe.title = 'Homepage introduction video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    playerContainer.replaceChildren(iframe);
    dialog.showModal();
    document.getElementById('heroVideoDialogClose')?.focus();
}

function closeHeroVideoDialog() {
    const dialog = document.getElementById('heroVideoDialog');
    const playerContainer = document.getElementById('heroVideoDialogPlayer');
    if (!dialog || !playerContainer) return;
    if (dialog.open) dialog.close();
    playerContainer.replaceChildren();
    document.getElementById('heroVideoWrapper')?.querySelector('.hero-video-preview')?.focus();
}

function setupHeroVideoDialog() {
    const dialog = document.getElementById('heroVideoDialog');
    const closeButton = document.getElementById('heroVideoDialogClose');
    if (!dialog || !closeButton) return;

    closeButton.addEventListener('click', closeHeroVideoDialog);
    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) closeHeroVideoDialog();
    });
    dialog.addEventListener('close', () => {
        document.getElementById('heroVideoDialogPlayer')?.replaceChildren();
    });
}

function heroYouTubeVideoId(rawUrl) {
    const value = String(rawUrl).trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;

    let url;
    try {
        url = new URL(value);
    } catch {
        try {
            url = new URL(`https://${value}`);
        } catch {
            return null;
        }
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') {
        id = url.pathname.replace(/^\/|\/$/g, '');
    } else if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
        if (url.pathname === '/watch') {
            id = url.searchParams.get('v');
        } else {
            const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})\/?$/);
            id = match ? match[1] : null;
        }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/**
 * Convert a raw YouTube URL or video ID into a standard embed src.
 * Handles: full URLs (watch?v=, youtu.be/), playlist links, and raw 11-char IDs.
 */
function youtubeEmbedUrl(raw) {
    if (!raw) return null;
    // Already an embed URL
    if (raw.includes('youtube.com/embed/')) return raw;
    // youtu.be/<id>
    const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // youtube.com/shorts/<id>
    const shortsMatch = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    // youtube.com/watch?v=<id>
    const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    // Raw 11-char video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(raw.trim())) return `https://www.youtube.com/embed/${raw.trim()}`;
    return null;
}

/** Extract the 11-char YouTube video ID from a URL or raw ID. */
function youtubeVideoId(raw) {
    const embedUrl = youtubeEmbedUrl(raw);
    if (!embedUrl) return null;
    const m = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

/** Render video cards into #videoShowcaseGrid on the home page with expand/collapse support. */
function renderVideoShowcase(data) {
    const grid = document.getElementById('videoShowcaseGrid');
    if (!grid) return;

    const videos = (data && data.showcaseVideos) ? data.showcaseVideos : [];
    const emptyEl = document.getElementById('videoShowcaseEmpty');
    const ctaEl = document.getElementById('videoShowcaseCta');
    const toggleBtn = document.getElementById('btnToggleMoreVideos');
    const toggleText = document.getElementById('toggleVideosText');
    const toggleIcon = document.getElementById('toggleVideosIcon');

    if (!videos.length) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (ctaEl) ctaEl.style.display = 'none';
        return;
    }

    // Hide empty state
    if (emptyEl) emptyEl.style.display = 'none';

    // Remove existing video cards to prevent duplicate appending on multiple hydrations
    grid.querySelectorAll('.video-card').forEach(c => c.remove());
    grid.classList.remove('is-expanded');

    const INITIAL_LIMIT = 3;
    let isExpanded = false;

    const heroVideoId = youtubeVideoId(data && data.profile ? data.profile.heroVideoUrl : '');
    const validVideos = videos.filter(v => {
        if (!youtubeEmbedUrl(v.youtube_url)) return false;
        const isHeroVideo = heroVideoId && youtubeVideoId(v.youtube_url) === heroVideoId;
        const isIntroVideo = /\bintro(?:duction)?\b/i.test(v.title || '');
        return !isHeroVideo && !isIntroVideo;
    });

    if (!validVideos.length) {
        if (emptyEl) emptyEl.style.display = 'flex';
        if (ctaEl) ctaEl.style.display = 'none';
        return;
    }

    const cardsHtml = validVideos.map((v, i) => {
        const embedSrc = youtubeEmbedUrl(v.youtube_url);
        const isHidden = i >= INITIAL_LIMIT;

        return `
            <div class="video-card reveal-right ${isHidden ? 'video-card-hidden' : ''}" style="--delay: ${(i % INITIAL_LIMIT) * 0.1}s;">
                <div class="video-embed">
                    <iframe
                        src="${escapeHtml(embedSrc)}"
                        title="${escapeHtml(v.title)}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        loading="lazy"
                    ></iframe>
                </div>
                <div class="video-card-body">
                    ${v.category ? `<span class="video-category-badge">${escapeHtml(v.category)}</span>` : ''}
                    <h3 class="video-card-title">${escapeHtml(v.title)}</h3>
                    ${v.description ? `<p class="video-card-desc">${escapeHtml(v.description)}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Insert cards before the empty-state element
    grid.insertAdjacentHTML('afterbegin', cardsHtml);

    // Setup CTA expand/collapse button
    if (ctaEl && toggleBtn) {
        if (validVideos.length > INITIAL_LIMIT) {
            ctaEl.style.display = 'flex';
            toggleBtn.onclick = () => {
                isExpanded = !isExpanded;
                grid.classList.toggle('is-expanded', isExpanded);
                grid.querySelectorAll('.video-card-hidden').forEach(card => {
                    card.classList.toggle('video-card-revealed', isExpanded);
                });

                if (toggleText) {
                    toggleText.textContent = isExpanded ? 'Show fewer videos' : 'See all videos';
                }
                if (toggleIcon) {
                    toggleIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
                }
                if (!isExpanded) {
                    const sec = document.getElementById('video-showcase');
                    if (sec) {
                        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            };
        } else {
            ctaEl.style.display = 'none';
        }
    }
}


// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    hydratePage();
    setupHeroVideoDialog();
    setupCertificateViewer();

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
