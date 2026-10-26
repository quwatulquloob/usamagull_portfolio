/* ==========================================================================
   USAMA GUL — PORTFOLIO JAVASCRIPT (SENIOR UI/UX & SOFTWARE ENGINEER)
   Interactions: Spotlight tracking, Toast feedback, Counters, Slider,
   Smooth scrolling, Navbar effects, Dynamic clipboard utilities.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ─── NAVBAR SCROLL EFFECT ───
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (navbar) {
            if (currentScroll > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        lastScroll = currentScroll;
    }, { passive: true });


    // ─── MOBILE NAVIGATION ───
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', String(navToggle.classList.contains('active')));
            navLinks.classList.toggle('mobile-open');
            document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
        });

        navToggle.addEventListener('keydown', event => {
            if (!navLinks.classList.contains('mobile-open')) return;
            if (event.key === 'Escape') { navToggle.click(); return; }
            if (event.key === 'Tab') {
                event.preventDefault();
                const links = [...navLinks.querySelectorAll('a[href]')];
                (event.shiftKey ? links.at(-1) : links[0])?.focus();
            }
        });
        navLinks.addEventListener('keydown', event => {
            const links = [...navLinks.querySelectorAll('a[href]')];
            if (event.key === 'Escape') { navToggle.click(); navToggle.focus(); }
            if (event.key === 'Tab' && event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); navToggle.focus(); }
            if (event.key === 'Tab' && !event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); navToggle.focus(); }
        });
        // Close menu on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('mobile-open');
                document.body.style.overflow = '';
            });
        });
    }


    // ─── SCROLL REVEAL ANIMATIONS ───
    // html.js gates the hidden pre-reveal state so content is never lost
    // when JS fails to load.
    document.documentElement.classList.add('js');
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-right');

    const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Reveal when entering the viewport, or when the element has
            // already been scrolled past (fast jumps land it above the fold).
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                entry.target.classList.add('visible');
                if (!entry.target.classList.contains('stat-card')) {
                    revealObserver?.unobserve(entry.target);
                }
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    }) : null;

    revealElements.forEach(el => revealObserver ? revealObserver.observe(el) : el.classList.add('visible'));

    // Safety net: IntersectionObserver never fires for elements that jump from
    // below the viewport to above it in a single scroll (anchor links, instant
    // jumps), so reveal anything already scrolled past on every scroll frame.
    let revealScrollScheduled = false;
    const revealPassedElements = () => {
        revealElements.forEach(el => {
            if (!el.classList.contains('visible') && el.getBoundingClientRect().bottom < 0) {
                el.classList.add('visible');
                if (!el.classList.contains('stat-card')) {
                    revealObserver?.unobserve(el);
                }
            }
        });
    };
    window.addEventListener('scroll', () => {
        if (revealScrollScheduled) return;
        revealScrollScheduled = true;
        requestAnimationFrame(() => {
            revealScrollScheduled = false;
            revealPassedElements();
        });
    }, { passive: true });


    // ─── TELEMETRY COUNTER ANIMATIONS ───
    const counters = document.querySelectorAll('.counter');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function finishCounter(counter) {
        const value = Number(counter.dataset.target);
        if (!Number.isFinite(value)) return;
        counter.textContent = (counter.dataset.decimal === 'true' ? value.toFixed(1) : String(value)) + (counter.dataset.suffix || '');
    }
    function animateCounter(counter) {
        if (counter.dataset.animated === 'true') return;
        counter.dataset.animated = 'true';
        if (reducedMotion.matches) { finishCounter(counter); return; }
        const target = Number(counter.dataset.target);
        if (!Number.isFinite(target)) return;
        const start = performance.now();
        const update = now => {
            if (reducedMotion.matches) { finishCounter(counter); return; }
            const progress = Math.min((now - start) / 1100, 1);
            const value = target * (1 - Math.pow(1 - progress, 3));
            counter.textContent = (counter.dataset.decimal === 'true' ? value.toFixed(1) : String(Math.floor(value))) + (counter.dataset.suffix || '');
            if (progress < 1) requestAnimationFrame(update); else finishCounter(counter);
        };
        requestAnimationFrame(update);
    }
    const statsSection = document.getElementById('stats');
    if (statsSection && !reducedMotion.matches && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            counters.forEach(animateCounter);
            observer.disconnect();
        }, { threshold: 0.2 });
        observer.observe(statsSection);
    } else counters.forEach(finishCounter);

    // Testimonials: preserve quotes; keep inactive slides out of keyboard navigation.
    const track = document.getElementById('testimonialsTrack');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsContainer = document.getElementById('sliderDots');

    if (track && prevBtn && nextBtn && dotsContainer) {
        const cards = track.querySelectorAll('.testimonial-card');
        const dots = dotsContainer.querySelectorAll('.dot');
        let currentSlide = 0;
        let autoPlayInterval;
        const totalSlides = cards.length;

        function goToSlide(index) {
            currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;
            cards.forEach((card, i) => { card.inert = i !== currentSlide; card.setAttribute('aria-hidden', String(i !== currentSlide)); });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
                dot.setAttribute('aria-pressed', String(i === currentSlide));
            });
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoPlay();
        });

        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoPlay();
        });

        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                goToSlide(i);
                resetAutoPlay();
            });
        });

        function startAutoPlay() {
            clearInterval(autoPlayInterval);
            if (!reducedMotion.matches) autoPlayInterval = setInterval(nextSlide, 6000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        goToSlide(0);
        startAutoPlay();

        track.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        track.addEventListener('mouseleave', startAutoPlay);

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        track.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            clearInterval(autoPlayInterval);
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) nextSlide();
                else prevSlide();
            }

            startAutoPlay();
        }, { passive: true });
    }


    // ─── TOAST NOTIFICATION UTILITY ───
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 350);
        }, 3000);
    };


    // ─── INSTANT COPY TO CLIPBOARD HELPER ───
    document.querySelectorAll('[data-copy]').forEach(el => {
        el.addEventListener('click', (e) => {
            const textToCopy = el.getAttribute('data-copy');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    window.showToast(`Copied to clipboard: ${textToCopy}`);
                }).catch(() => {
                    window.showToast(`Selected: ${textToCopy}`);
                });
            }
        });
    });


    // ─── SMOOTH SCROLL FOR ANCHOR LINKS ───
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                if (this.classList.contains('skip-link')) target.focus({ preventScroll: true });
                target.scrollIntoView({
                    behavior: reducedMotion.matches ? 'instant' : 'smooth',
                    block: 'start'
                });
            }
        });
    });


    // ─── LOGOS MARQUEE RENDERING ───
    function renderLogosMarquee() {
        const logosTrack = document.getElementById('logosMarqueeTrack');
        if (!logosTrack) return;

        const logos = window.__SITE_DATA__?.logos || [];
        if (!logos.length) {
            logosTrack.parentElement.style.display = 'none';
            return;
        }

        // Create two sets of logos for seamless looping
        const renderLogo = (logo) => `
            <div class="logo-item">
                <img src="${window.SiteData.escapeHtml(logo.imageUrl)}" alt="${window.SiteData.escapeHtml(logo.name)}" width="120" height="60" loading="lazy" decoding="async">
            </div>
        `;

        const logosHTML = logos.map(renderLogo).join('');
        logosTrack.innerHTML = `
            <div class="marquee-content">
                ${logosHTML}
            </div>
            <div class="marquee-content" aria-hidden="true">
                ${logosHTML}
            </div>
        `;
    }

    // Render logos on page load
    renderLogosMarquee();

});
