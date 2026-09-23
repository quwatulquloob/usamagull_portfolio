/* Contact form — validates, then posts to Formspree.
   Field ids match contact.html (name, email, serviceSelect, budget, message). */
(function () {
    'use strict';
    var FORMSPREE_ID = 'mvkgrzvj';

    function init() {
        var form = document.getElementById('contactForm');
        var btn = document.getElementById('submitBtn');
        var status = document.getElementById('formStatus');
        var service = document.getElementById('serviceSelect');
        if (!form || !btn || !status) return;

        // Pre-select service from ?service=… (ids like "mlops-deployment" also match "mlops")
        var param = new URLSearchParams(location.search).get('service');
        if (param && service) {
            var match = Array.prototype.find.call(service.options, function (o) {
                return o.value === param || param.indexOf(o.value) === 0;
            });
            if (match) service.value = match.value;
        }

        function show(text, type) {
            status.className = 'form-status ' + type;
            status.textContent = text;
            status.hidden = false;
            status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var v = function (id) { return (document.getElementById(id).value || '').trim(); };
            var name = v('name'), email = v('email'), message = v('message');
            if (!name || !email || !message) return show('Fill in your name, email and project details.', 'error');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return show('Enter a valid email address.', 'error');

            var label = btn.innerHTML;
            btn.disabled = true;
            btn.querySelector('span').textContent = 'Sending…';

            fetch('https://formspree.io/f/' + FORMSPREE_ID, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    name: name, email: email, message: message,
                    service: service.options[service.selectedIndex].text,
                    budget: document.getElementById('budget').value
                })
            }).then(function (r) {
                if (!r.ok) throw new Error('bad status');
                show('Thanks, ' + name + '. Your inquiry is in and I\u2019ll reply to ' + email + ' within 24 hours.', 'success');
                form.reset();
            }).catch(function () {
                show('Your message didn\u2019t send. Check your connection and try again, or email me directly.', 'error');
            }).then(function () { btn.disabled = false; btn.innerHTML = label; });
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
