/* ============================================
   PORTFOLIO INTERACTION SCRIPT
   - Category Filter Tabs with smooth transitions
   - Project Details Lightbox Modal
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── FILTER TABS LOGIC ───
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.portfolio-card');

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filterValue = tab.getAttribute('data-filter');

            // Update active state on tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Filter cards with staggered transition
            let visibleCount = 0;
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const matches = filterValue === 'all' || category === filterValue;

                if (matches) {
                    card.classList.remove('card-hidden');
                    card.classList.add('card-visible');
                    card.style.display = 'block';
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

    function openLightbox(card) {
        const thumb = card.querySelector('.portfolio-thumb');
        const data = card.querySelector('.lightbox-data');

        if (!data || !lightboxModal) return;

        // Clone visual background gradient and icon from thumbnail
        const bgGradient = thumb.style.getPropertyValue('--thumb-gradient') || 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)';
        const innerIcon = thumb.querySelector('.portfolio-thumb-inner') ? thumb.querySelector('.portfolio-thumb-inner').innerHTML : '';

        lightboxImage.style.background = bgGradient;
        lightboxImage.style.display = 'flex';
        lightboxImage.style.alignItems = 'center';
        lightboxImage.style.justifyContent = 'center';
        lightboxImage.innerHTML = `<div style="transform: scale(1.6); opacity: 0.85;">${innerIcon}</div>`;

        // Inject content
        lightboxContent.innerHTML = data.innerHTML;

        // Display modal
        lightboxModal.classList.add('open');
        lightboxModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('open');
        lightboxModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Attach click listeners to cards
    window.initPortfolioListeners = function() {
        const cards = document.querySelectorAll('.portfolio-card');
        cards.forEach(card => {
            card.onclick = () => openLightbox(card);
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

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.classList.contains('open')) {
            closeLightbox();
        }
    });
});
