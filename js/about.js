/* ==========================================================================
   ABOUT PAGE — INTERACTION SCRIPT (SENIOR UI/UX STANDARDS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Staggered reveal for competency cards
    const competencyCards = document.querySelectorAll('.competency-card');
    competencyCards.forEach((card, idx) => {
        card.style.setProperty('--delay', `${idx * 0.08}s`);
    });
});
