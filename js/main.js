/* ============================================
   USAMA GUL — PORTFOLIO JAVASCRIPT
   Navigation, Scroll Animations, Counters,
   Testimonials Slider, Smooth Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── NAVBAR SCROLL EFFECT ───
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
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


    // ─── SCROLL REVEAL ANIMATIONS ───
    const revealElements = document.querySelectorAll('.reveal-up');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Don't unobserve stat cards yet — they need counter animation
                if (!entry.target.classList.contains('stat-card')) {
                    revealObserver.unobserve(entry.target);
                }
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ─── ANIMATED COUNTERS ───
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
    }, { threshold: 0.3 });

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        counterObserver.observe(statsSection);
    }

    function animateCounter(counter) {
        const target = parseFloat(counter.dataset.target);
        const suffix = counter.dataset.suffix || '';
        const isDecimal = counter.dataset.decimal === 'true';
        const duration = 2000;
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

        // Auto-play
        function startAutoPlay() {
            autoPlayInterval = setInterval(nextSlide, 5000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        startAutoPlay();

        // Pause on hover
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


    // ─── SMOOTH SCROLL FOR ANCHOR LINKS ───
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });


    // ─── STAT BAR ANIMATION ON SCROLL ───
    const statCards = document.querySelectorAll('.stat-card');
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                barObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    statCards.forEach(card => barObserver.observe(card));


    // ─── ACTIVE NAV LINK HIGHLIGHT ───
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNavLink() {
        const scrollPos = window.scrollY + 200;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}` || 
                        (id === 'hero' && link.getAttribute('href') === 'index.html')) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', updateActiveNavLink, { passive: true });


    // ─── PRELOADER / INITIAL ANIMATION SEQUENCE ───
    // Small delay to ensure smooth initial load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    window.addEventListener('load', () => {
        document.body.style.opacity = '1';
    });

});
