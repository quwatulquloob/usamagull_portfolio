/* Contact form: native constraints + server validation, with explicit delivery states. */
(() => {
    function init() {
        const form = document.getElementById('contactForm');
        const button = document.getElementById('submitBtn');
        const status = document.getElementById('formStatus');
        const service = document.getElementById('serviceSelect');
        if (!form || !button || !status) return;
        const param = new URLSearchParams(location.search).get('service');
        if (param && service) {
            const option = [...service.options].find(option => option.value && (option.value === param || param.startsWith(option.value)));
            if (option) service.value = option.value;
        }
        function show(message, type) {
            status.className = `form-status ${type}`;
            status.setAttribute('role', type === 'error' ? 'alert' : 'status');
            status.textContent = message;
            status.hidden = false;
            status.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
        }
        let busy = false;
        form.addEventListener('submit', async event => {
            event.preventDefault();
            if (busy || !form.reportValidity()) return;
            const values = Object.fromEntries(new FormData(form));
            for (const key of ['name', 'email', 'message', 'service', 'website']) values[key] = String(values[key] || '').trim();
            if (values.name.length < 2 || values.message.length < 20) return show('Enter your name and at least 20 characters about your project.', 'error');
            busy = true; button.disabled = true; form.setAttribute('aria-busy', 'true');
            const original = button.innerHTML;
            button.querySelector('span').textContent = 'Sending...';
            status.hidden = true;
            try {
                const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
                const data = await response.json();
                if (!response.ok || !data.ok) throw new Error(data.error || 'Your inquiry could not be sent. Please try again or email me directly.');
                show(data.acknowledgmentSent ? 'Your inquiry has been received. A confirmation email has been sent to you.' : 'Your inquiry has been received. A confirmation email is unavailable right now.', 'success');
                form.reset();
            } catch (error) {
                show(error instanceof TypeError ? 'Connection problem. Please try again or email me directly.' : error.message, 'error');
            } finally {
                busy = false; button.disabled = false; button.innerHTML = original; form.removeAttribute('aria-busy');
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
