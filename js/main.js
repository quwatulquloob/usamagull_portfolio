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
            navLinks.classList.toggle('mobile-open');
            document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
        });

        // Close menu on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('mobile-open');
                document.body.style.overflow = '';
            });
        });
    }


    // ─── SPOTLIGHT CARD HOVER EFFECT (LINEAR / RAYCAST FEEL) ───
    const interactiveCards = document.querySelectorAll('.spotlight-card, .stat-card, .service-card, .project-card, .service-detail-card, .award-card, .direct-contact-card');
    
    interactiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });


    // ─── SCROLL REVEAL ANIMATIONS ───
    const revealElements = document.querySelectorAll('.reveal-up');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (!entry.target.classList.contains('stat-card')) {
                    revealObserver.unobserve(entry.target);
                }
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ─── TELEMETRY COUNTER ANIMATIONS ───
    const counters = document.querySelectorAll('.counter');
    let countersAnimated = false;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                countersAnimated = true;
                counters.forEach(counter => animateCounter(counter));
                counterObserver.disconnect();
            }
        });
    }, { threshold: 0.25 });

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        counterObserver.observe(statsSection);
    }

    function animateCounter(counter) {
        const target = parseFloat(counter.dataset.target);
        if (isNaN(target)) return;
        const suffix = counter.dataset.suffix || '';
        const isDecimal = counter.dataset.decimal === 'true';
        const duration = 1800;
        const startTime = performance.now();

        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const currentValue = easedProgress * target;

            if (isDecimal) {
                counter.textContent = currentValue.toFixed(1) + suffix;
            } else {
                counter.textContent = Math.floor(currentValue) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }


    // ─── TESTIMONIALS SLIDER ───
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

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
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
            autoPlayInterval = setInterval(nextSlide, 6000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

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
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

});
