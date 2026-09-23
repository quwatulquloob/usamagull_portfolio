/* ============================================
   ABOUT PAGE — Interactive Animations
   - Animated Skill Progress Bars & Number Counters
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const skillCards = document.querySelectorAll('.skill-card');
    let skillsTriggered = false;

    const skillsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !skillsTriggered) {
                skillsTriggered = true;
                animateSkillBars();
                skillsObserver.disconnect();
            }
        });
    }, {
        threshold: 0.2
    });

    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        skillsObserver.observe(skillsSection);
    }

    function animateSkillBars() {
        skillCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animated');

                // Animate the percent text number
                const percentEl = card.querySelector('.skill-percent');
                const fillEl = card.querySelector('.skill-fill');
                if (percentEl && fillEl) {
                    const target = parseInt(fillEl.getAttribute('data-progress'), 10) || 90;
                    animateValue(percentEl, 0, target, 1400);
                }
            }, index * 100);
        });
    }

    function animateValue(element, start, end, duration) {
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeProgress);

            element.textContent = `${current}%`;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = `${end}%`;
            }
        }

        requestAnimationFrame(step);
    }
});
