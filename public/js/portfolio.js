/* ============================================
   PORTFOLIO INTERACTION SCRIPT
   - Category Filter Tabs with smooth transitions
   - Project Details Lightbox Modal
   - Full-screen Image Zoom Viewer
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── FILTER TABS LOGIC ───
    const filterTabs = document.querySelectorAll('.filter-tab');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filterValue = tab.getAttribute('data-filter');

            // Update active state on tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Filter cards with staggered transition
            let visibleCount = 0;
            document.querySelectorAll('.portfolio-card').forEach(card => {
                const category = card.getAttribute('data-category');
                const matches = filterValue === 'all' || category === filterValue;

                if (matches) {
                    card.classList.remove('card-hidden');
                    card.classList.add('card-visible');
                    card.style.display = 'flex';
                    card.style.transitionDelay = `${visibleCount * 0.06}s`;
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, 20);
                    visibleCount++;
                } else {
                    card.classList.remove('card-visible', 'visible');
                    card.classList.add('card-hidden');
                    card.style.transitionDelay = '0s';
                    setTimeout(() => {
                        if (card.classList.contains('card-hidden')) {
                            card.style.display = 'none';
                        }
                    }, 400);
                }
            });
        });
    });

    // ─── LIGHTBOX MODAL LOGIC ───
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxBackdrop = document.getElementById('lightboxBackdrop');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxContent = document.getElementById('lightboxContent');

    // ─── FULL-SCREEN IMAGE ZOOM VIEWER ───
    function createZoomViewer() {
        if (document.getElementById('imgZoomViewer')) return;
        const viewer = document.createElement('div');
        viewer.id = 'imgZoomViewer';
        viewer.setAttribute('aria-hidden', 'true');
        viewer.innerHTML = `
            <div class="zoom-backdrop"></div>
            <div class="zoom-content">
                <button class="zoom-close" aria-label="Close image viewer">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <img class="zoom-img" alt="" width="800" height="450">
                <div class="zoom-caption"></div>
            </div>`;
        document.body.appendChild(viewer);

        const closeZoom = () => {
            viewer.classList.remove('open');
            viewer.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        };
        viewer.querySelector('.zoom-backdrop').addEventListener('click', closeZoom);
        viewer.querySelector('.zoom-close').addEventListener('click', (e) => { e.stopPropagation(); closeZoom(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && viewer.classList.contains('open')) closeZoom(); });
    }

    function openZoom(src, alt) {
        if (!src) return;
        createZoomViewer();
        const viewer = document.getElementById('imgZoomViewer');
        const img = viewer.querySelector('.zoom-img');
        const caption = viewer.querySelector('.zoom-caption');
        img.onload = () => { img.width = img.naturalWidth; img.height = img.naturalHeight; };
        img.src = src;
        if (img.complete && img.naturalWidth) { img.width = img.naturalWidth; img.height = img.naturalHeight; }
        img.alt = alt || '';
        if (caption) caption.textContent = alt || '';
        viewer.classList.add('open');
        viewer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    let lightboxOpener = null;
    function openLightbox(card) {
        lightboxOpener = document.activeElement;
        const thumb = card.querySelector('.portfolio-thumb');
        const data = card.querySelector('.lightbox-data');

        if (!data || !lightboxModal) return;

        // If the card has a real image, show it as a proper cover in the lightbox header.
        // Otherwise fall back to the scaled SVG placeholder icon.
        const realImg = thumb.querySelector('.portfolio-thumb-inner img');
        if (realImg) {
            lightboxImage.style.display = '';
            lightboxImage.style.alignItems = '';
            lightboxImage.style.justifyContent = '';
            lightboxImage.style.cursor = 'zoom-in';
            lightboxImage.tabIndex = 0;
            lightboxImage.setAttribute('role', 'button');
            lightboxImage.setAttribute('aria-label', 'View full-size project image');
            lightboxImage.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); lightboxImage.click(); } };
            lightboxImage.innerHTML = `
                <img src="${realImg.src}" alt="${realImg.alt}" width="${realImg.width || 800}" height="${realImg.height || 450}" class="lb-zoomable" title="Click to view full size">
                <div class="lb-zoom-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                    <span>Click image to enlarge</span>
                </div>`;
            lightboxImage.onclick = (e) => {
                e.stopPropagation();
                openZoom(realImg.src, realImg.alt);
            };
        } else {
            lightboxImage.onclick = null;
            lightboxImage.removeAttribute('tabindex'); lightboxImage.removeAttribute('role'); lightboxImage.removeAttribute('aria-label'); lightboxImage.onkeydown = null;
            lightboxImage.style.cursor = 'default';
            const innerIcon = thumb.querySelector('.portfolio-thumb-inner') ? thumb.querySelector('.portfolio-thumb-inner').innerHTML : '';
            lightboxImage.style.display = 'flex';
            lightboxImage.style.alignItems = 'center';
            lightboxImage.style.justifyContent = 'center';
            lightboxImage.innerHTML = `<div style="transform: scale(1.6); opacity: 0.85;">${innerIcon}</div>`;
        }

        // Inject content
        lightboxContent.innerHTML = data.innerHTML;

        // Display modal
        lightboxModal.classList.add('open');
        lightboxModal.setAttribute('aria-hidden', 'false');
        lightboxClose?.focus();
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('open');
        lightboxModal.setAttribute('aria-hidden', 'true');
        lightboxOpener?.focus();
        document.body.style.overflow = '';
    }

    // Attach click listeners to cards
    window.initPortfolioListeners = function() {
        createZoomViewer();
        const cards = document.querySelectorAll('.portfolio-card');
        cards.forEach(card => {
            // Whole card click opens lightbox
            card.onclick = (e) => {
                if (e.target.closest('a')) return;
                openLightbox(card);
            };

            // Direct click on the image thumbnail opens full-screen zoom view directly
            const thumbImg = card.querySelector('.portfolio-thumb-inner img');
            if (thumbImg) {
                thumbImg.onclick = (e) => {
                    e.stopPropagation();
                    openZoom(thumbImg.src, thumbImg.alt);
                };
            }
        });
    };

    window.initPortfolioListeners();

    if (lightboxClose) {
        lightboxClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeLightbox();
        });
    }

    if (lightboxBackdrop) {
        lightboxBackdrop.addEventListener('click', closeLightbox);
    }

    lightboxModal?.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const elements = [...lightboxModal.querySelectorAll('button, a[href], [tabindex="0"]')].filter(el => el.getClientRects().length);
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('open')) {
            closeLightbox();
        }
    });
});
