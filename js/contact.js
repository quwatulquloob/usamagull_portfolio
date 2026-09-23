/* ============================================
   CONTACT PAGE — Formspree Integration
   - URL Query Parameter pre-selection
   - Real form submission via Formspree
   ============================================ */

(function () {
    'use strict';

    // ⚠️ REPLACE THIS with your real Formspree form ID
    // Go to https://formspree.io → Create form → Copy the ID
    var FORMSPREE_ID = 'mvkgrzvj';

    function initContact() {
        // ─── PRE-SELECT SERVICE FROM URL QUERY ───
        var urlParams = new URLSearchParams(window.location.search);
        var serviceParam = urlParams.get('service');
        var projectTypeSelect = document.getElementById('projectType');

        if (serviceParam && projectTypeSelect) {
            var paramMap = {
                'agentic-ai': 'Agentic AI & LLMs',
                'computer-vision': 'Computer Vision',
                'voice-ai': 'Voice AI Assistants',
                'mlops-deployment': 'MLOps & Deployment'
            };
            var targetValue = paramMap[serviceParam];
            if (targetValue) {
                for (var i = 0; i < projectTypeSelect.options.length; i++) {
                    if (projectTypeSelect.options[i].value === targetValue) {
                        projectTypeSelect.options[i].selected = true;
                        break;
                    }
                }
            }
        }

        // ─── FORM SUBMISSION VIA FORMSPREE ───
        var contactForm = document.getElementById('contactForm');
        var submitBtn = document.getElementById('submitBtn');
        var formStatus = document.getElementById('formStatus');

        if (!contactForm || !submitBtn || !formStatus) return;

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();

            var name = (document.getElementById('userName') || {}).value || '';
            var email = (document.getElementById('userEmail') || {}).value || '';
            var projectType = (document.getElementById('projectType') || {}).value || '';
            var budget = (document.getElementById('projectBudget') || {}).value || '';
            var message = (document.getElementById('userMessage') || {}).value || '';

            if (!name.trim() || !email.trim() || !projectType || !budget || !message.trim()) {
                showStatus('Please fill in all required fields.', 'error');
                return;
            }

            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email.trim())) {
                showStatus('Please provide a valid email address.', 'error');
                return;
            }

            // Button loading state
            var originalBtnHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Sending Message...</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin-icon"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"/></svg>';

            // Send to Formspree
            fetch('https://formspree.io/f/' + FORMSPREE_ID, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    projectType: projectType,
                    budget: budget,
                    message: message.trim()
                })
            })
            .then(function (response) {
                if (response.ok) {
                    showStatus(
                        'Thank you, <strong>' + escapeHtml(name.trim()) + '</strong>! Your inquiry regarding <strong>' + escapeHtml(projectType) + '</strong> has been sent successfully. Usama will respond to <strong>' + escapeHtml(email.trim()) + '</strong> within 24 hours.',
                        'success'
                    );
                    contactForm.reset();
                } else {
                    showStatus('Something went wrong. Please try again or email directly.', 'error');
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            })
            .catch(function () {
                showStatus('Network error. Please check your connection and try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            });
        });

        function showStatus(msg, type) {
            if (!formStatus) return;
            formStatus.className = 'form-status ' + type;
            formStatus.innerHTML = msg;
            formStatus.style.display = 'block';
            formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function escapeHtml(text) {
            var div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContact);
    } else {
        initContact();
    }
})();
