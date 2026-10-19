/* ============================================
   ADMIN PANEL ENGINE — D1-backed API client
   Real session auth (HttpOnly signed cookie),
   live CRUD against /api/admin/* endpoints,
   loading states, and error boundaries.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── ELEMENTS ───
    const loginView = document.getElementById('loginView');
    const dashboardLayout = document.getElementById('dashboardLayout');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminToast = document.getElementById('adminToast');

    // ─── UTILITIES ───
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    window.showToast = function (message, type = 'success') {
        if (!adminToast) return;
        adminToast.textContent = message;
        adminToast.classList.add('show');
        if (type === 'error') adminToast.classList.add('error');
        else adminToast.classList.remove('error');
        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => {
            adminToast.classList.remove('show');
        }, 3200);
    };

    /** API fetch wrapper with 401 handling and friendly errors. */
    async function api(path, options = {}) {
        const opts = { credentials: 'same-origin', headers: {}, ...options };
        if (opts.body && typeof opts.body === 'object') {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(opts.body);
        }
        let res;
        try {
            res = await fetch(path, opts);
        } catch (e) {
            throw new Error('Network error — is the Worker running?');
        }
        if (res.status === 401) {
            showLogin();
            throw new Error('Your session expired. Please sign in again.');
        }
        let payload = null;
        try { payload = await res.json(); } catch { /* non-JSON error page */ }
        if (!res.ok || (payload && payload.ok === false)) {
            throw new Error((payload && payload.error) || `Request failed (${res.status}).`);
        }
        return payload;
    }

    // ─── AUTH STATE ───
    function showLogin() {
        if (loginView) loginView.style.display = 'flex';
        if (dashboardLayout) dashboardLayout.style.display = 'none';
    }

    function showDashboard() {
        if (loginView) loginView.style.display = 'none';
        if (dashboardLayout) dashboardLayout.style.display = 'flex';
    }

    async function checkAuth() {
        try {
            const session = await api('/api/admin/auth/session');
            if (session.authenticated) {
                showDashboard();
                await loadAllPanels();
            } else {
                showLogin();
            }
        } catch (e) {
            showLogin();
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.classList.remove('show');
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            const original = loginSubmitBtn.innerHTML;
            loginSubmitBtn.disabled = true;
            loginSubmitBtn.innerHTML = '<span>Signing in…</span>';
            try {
                await api('/api/admin/auth/login', {
                    method: 'POST',
                    body: { username, password },
                });
                showToast('Welcome back! Admin session active.');
                loginForm.reset();
                showDashboard();
                await loadAllPanels();
            } catch (err) {
                loginError.textContent = err.message;
                loginError.classList.add('show');
            } finally {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.innerHTML = original;
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try { await api('/api/admin/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
            showLogin();
            showToast('Logged out successfully.');
        });
    }

    // ─── TAB NAVIGATION ───
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const panels = document.querySelectorAll('.admin-panel');
    const pageTitle = document.getElementById('pageTitle');

    window.switchTab = function (targetPanelId) {
        panels.forEach(p => p.classList.remove('active'));
        navItems.forEach(n => n.classList.remove('active'));
        const targetPanel = document.getElementById(targetPanelId);
        const matchingBtn = document.querySelector(`.sidebar-nav .nav-item[data-target="${targetPanelId}"]`);
        if (targetPanel) targetPanel.classList.add('active');
        if (matchingBtn) {
            matchingBtn.classList.add('active');
            if (pageTitle) pageTitle.textContent = matchingBtn.querySelector('span').textContent;
        }
    };

    navItems.forEach(btn => {
        btn.addEventListener('click', () => window.switchTab(btn.getAttribute('data-target')));
    });

    // ─── GLOBAL STATE ───
    let state = {
        theme: 'charcoal-orange',
        profile: null,
        contact: null,
        services: [],
        projects: [],
        awards: [],
        certifications: [],
        logos: [],
        showcaseVideos: [],
        resume: null
    };

    function setLoadingPanels() {
        ['servicesAdminList', 'projectsAdminList', 'awardsAdminList', 'certificationsAdminList', 'logosAdminList', 'videosAdminList'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 24px;">Loading…</p>';
        });
    }

    // ─── LOAD & REFRESH ALL PANELS ───
    async function loadAllPanels() {
        setLoadingPanels();
        try {
            const content = await api('/api/admin/content');
            state.theme = content.settings.theme;
            state.profile = content.settings.profile;
            state.contact = content.settings.contact;
            state.resume = content.settings.resume || null;
            state.services = content.services || [];
            state.projects = content.projects || [];
            state.awards = content.awards || [];
            state.certifications = content.certifications || [];
            state.logos = content.logos || [];
            state.showcaseVideos = content.showcaseVideos || [];

            document.getElementById('statServicesCount').textContent = state.services.length;
            document.getElementById('statProjectsCount').textContent = state.projects.length;
            document.getElementById('statAwardsCount').textContent = state.awards.length + state.certifications.length;
            const themeMap = {
                'charcoal-orange': 'Charcoal Orange',
                'midnight-blue': 'Midnight Blue',
                'slate-purple': 'Slate Purple',
                'emerald-dark': 'Emerald Dark'
            };
            document.getElementById('statActiveTheme').textContent = themeMap[state.theme] || 'Charcoal Orange';

            renderThemes(state.theme);
            renderProfile(state.profile);
            renderResumeStatus();
            renderServices(state.services);
            renderProjects(state.projects);
            renderAwards(state.awards);
            renderCertifications(state.certifications);
            renderLogos(state.logos);
            renderVideos(state.showcaseVideos);
            renderContact(state.contact);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    // ─── THEME SWITCHER ───
    function renderThemes(currentTheme) {
        document.querySelectorAll('.theme-card').forEach(card => {
            const name = card.getAttribute('data-theme-name');
            card.classList.toggle('active', name === currentTheme);
            card.onclick = async () => {
                if (name === state.theme) return;
                card.style.opacity = '0.6';
                try {
                    const res = await api('/api/admin/settings', { method: 'PUT', body: { theme: name } });
                    state.theme = res.settings.theme;
                    window.SiteData.applyTheme(state.theme);
                    renderThemes(state.theme);
                    document.getElementById('statActiveTheme').textContent = card.querySelector('.theme-name').textContent;
                    showToast(`Theme switched to ${name}! Live site updated.`);
                } catch (err) {
                    showToast(err.message, 'error');
                } finally {
                    card.style.opacity = '';
                }
            };
        });
    }

    // ─── PROFILE & PHOTO MANAGER ───
    let currentPhoto = null; // data URI or /assets path
    let currentLogo = null;  // data URI/URL, or null for the default monogram

    function renderProfile(profile) {
        if (!profile) return;
        document.getElementById('profName').value = profile.name || '';
        document.getElementById('profTitle').value = profile.title || '';
        document.getElementById('profTagline').value = profile.tagline || '';
        document.getElementById('heroVideoUrl').value = profile.heroVideoUrl || '';
        document.getElementById('profSystems').value = profile.systemsDelivered ?? 0;
        document.getElementById('profClients').value = profile.happyClients ?? 0;
        document.getElementById('profYears').value = profile.yearsExp ?? 0;
        document.getElementById('profRating').value = profile.avgRating ?? 5;

        const preview = document.getElementById('adminPhotoPreview');
        if (preview && profile.photo) {
            preview.src = profile.photo;
            currentPhoto = profile.photo;
        }

        currentLogo = profile.logo || null;
        renderLogoPreview();
    }

    // ─── BRAND LOGO MANAGER (add / replace / remove) ───
    const MAX_LOGO_BYTES = 200 * 1024; // ~200KB (base64 inflates ~4/3; server cap is 300k chars)
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('adminLogoPreview');
    const logoStatus = document.getElementById('logoStatus');
    const logoUploadLabel = document.getElementById('logoUploadBtnLabel');
    const removeLogoBtn = document.getElementById('removeLogoBtn');

    function renderLogoPreview() {
        if (logoPreview) {
            if (currentLogo) {
                logoPreview.classList.add('has-logo');
                logoPreview.innerHTML = `<img src="${escapeHtml(currentLogo)}" alt="Brand logo">`;
            } else {
                logoPreview.classList.remove('has-logo');
                logoPreview.textContent = 'UG';
            }
        }
        if (logoStatus) {
            if (currentLogo) {
                logoStatus.textContent = 'Custom logo is live — it replaces the “UG” monogram on every page.';
                logoStatus.classList.add('has-resume');
            } else {
                logoStatus.textContent = 'Using the default “UG” monogram.';
                logoStatus.classList.remove('has-resume');
            }
        }
        if (logoUploadLabel) logoUploadLabel.textContent = currentLogo ? 'Replace Logo' : 'Add Logo';
        if (removeLogoBtn) removeLogoBtn.style.display = currentLogo ? '' : 'none';
    }

    if (logoInput) {
        logoInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            logoInput.value = '';
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Please choose an image file (PNG, JPG, SVG…).', 'error');
                return;
            }
            if (file.size > MAX_LOGO_BYTES) {
                showToast('Logo is too large — please use an image under 200KB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                currentLogo = event.target.result;
                renderLogoPreview();
                showToast('Logo selected! Click "Save Profile Changes" to apply.');
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeLogoBtn) {
        removeLogoBtn.addEventListener('click', () => {
            currentLogo = null;
            renderLogoPreview();
            showToast('Logo removed — click "Save Profile Changes" to restore the monogram.');
        });
    }

    const photoInput = document.getElementById('profilePhotoInput');
    const photoPreview = document.getElementById('adminPhotoPreview');
    const resetPhotoBtn = document.getElementById('resetPhotoBtn');

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 450 * 1024) {
                showToast('Photo is too large — please use an image under 450KB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                currentPhoto = event.target.result;
                photoPreview.src = currentPhoto;
                showToast('Photo selected! Click "Save Profile Changes" to apply.');
            };
            reader.readAsDataURL(file);
        });
    }

    if (resetPhotoBtn) {
        resetPhotoBtn.addEventListener('click', () => {
            currentPhoto = '/assets/profile.png';
            photoPreview.src = currentPhoto;
            showToast('Reset to default executive headshot.');
        });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const profile = {
                ...state.profile,
                name: document.getElementById('profName').value.trim(),
                title: document.getElementById('profTitle').value.trim(),
                tagline: document.getElementById('profTagline').value.trim(),
                heroVideoUrl: document.getElementById('heroVideoUrl').value.trim(),
                systemsDelivered: parseInt(document.getElementById('profSystems').value, 10) || 0,
                happyClients: parseInt(document.getElementById('profClients').value, 10) || 0,
                yearsExp: parseInt(document.getElementById('profYears').value, 10) || 0,
                avgRating: parseFloat(document.getElementById('profRating').value) || 4.9,
            };
            const parts = profile.name.split(/\s+/);
            profile.firstName = parts[0] || 'Usama';
            profile.lastName = parts.slice(1).join(' ') || profile.firstName;
            if (currentPhoto) profile.photo = currentPhoto;
            profile.logo = currentLogo || null;

            try {
                const res = await api('/api/admin/settings', { method: 'PUT', body: { profile } });
                state.profile = res.settings.profile;
                showToast('Profile, headshot & hero video saved — live site updated!');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // ─── RESUME MANAGER (PDF upload, replaces previous) ───
    const MAX_RESUME_BYTES = 500 * 1024; // ~500KB (base64 inflates ~4/3; server cap is 700k chars)
    const resumeInput = document.getElementById('resumeInput');
    const resumeStatus = document.getElementById('resumeStatus');
    const resumeUploadLabel = document.getElementById('resumeUploadBtnLabel');

    function renderResumeStatus() {
        if (!resumeStatus) return;
        if (state.resume && state.resume.filename) {
            const when = state.resume.updatedAt ? new Date(state.resume.updatedAt).toLocaleDateString() : '';
            resumeStatus.innerHTML = `✅ <strong>${escapeHtml(state.resume.filename)}</strong> is live — visitors can download it from the homepage.` +
                (when ? ` <span style="opacity:0.7">(uploaded ${escapeHtml(when)})</span>` : '');
            resumeStatus.classList.add('has-resume');
            if (resumeUploadLabel) resumeUploadLabel.textContent = 'Replace Resume (PDF)';
        } else {
            resumeStatus.textContent = 'No resume uploaded yet.';
            resumeStatus.classList.remove('has-resume');
            if (resumeUploadLabel) resumeUploadLabel.textContent = 'Upload Resume (PDF)';
        }
    }

    if (resumeInput) {
        resumeInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            resumeInput.value = '';
            if (!file) return;

            const isPdf = file.type === 'application/pdf' || (/\.pdf$/i.test(file.name) && (!file.type || file.type === 'application/octet-stream'));
            if (!isPdf) {
                showToast('Please choose a PDF file (.pdf).', 'error');
                return;
            }
            if (file.size > MAX_RESUME_BYTES) {
                showToast('Resume is too large — please use a PDF under 500KB.', 'error');
                return;
            }
            if (state.resume && state.resume.filename &&
                !window.confirm(`Replace the current resume “${state.resume.filename}” with “${file.name}”?`)) {
                return;
            }

            const dataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.onerror = () => reject(new Error('Could not read the selected file.'));
                reader.readAsDataURL(file);
            });

            try {
                if (resumeUploadLabel) resumeUploadLabel.textContent = 'Uploading…';
                const res = await api('/api/admin/settings', {
                    method: 'PUT',
                    body: { resume: { filename: file.name, data: dataUri } }
                });
                state.resume = res.settings.resume || null;
                renderResumeStatus();
                showToast('Resume uploaded — the homepage “Download Resume” button is live!');
            } catch (err) {
                renderResumeStatus();
                showToast(err.message, 'error');
            }
        });
    }

    // ─── SERVICES MANAGER ───
    const servicesListContainer = document.getElementById('servicesAdminList');
    const addNewServiceBtn = document.getElementById('addNewServiceBtn');

    function renderServices(services) {
        if (!servicesListContainer) return;
        servicesListContainer.innerHTML = '';

        if (!services.length) {
            servicesListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No services added yet.</p>';
            return;
        }

        services.forEach((service, index) => {
            const card = document.createElement('div');
            card.className = 'admin-item-card';
            card.innerHTML = `
                <div class="admin-item-left">
                    <div class="admin-item-thumb" style="color: var(--accent-orange);">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                    </div>
                    <div class="admin-item-meta">
                        <h4>${escapeHtml(service.title)}</h4>
                        <p>${escapeHtml(service.description)}</p>
                        <span style="font-size: 0.75rem; color: var(--text-tertiary);">${escapeHtml(service.category)} | ${service.price > 0 ? `$${Number(service.price).toLocaleString('en-US')}${service.priceSuffix ? ` ${escapeHtml(service.priceSuffix)}` : ''}` : 'Custom quote'}</span>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon btn-edit-service" data-id="${escapeHtml(service.id)}" title="Edit service">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-service" data-id="${escapeHtml(service.id)}" title="Delete service">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            servicesListContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-service').forEach(btn => {
            btn.onclick = () => openServiceModal(btn.dataset.id);
        });

        document.querySelectorAll('.btn-del-service').forEach(btn => {
            btn.onclick = async () => {
                const svc = state.services.find(s => s.id === btn.dataset.id);
                if (!confirm(`Are you sure you want to remove "${svc ? svc.title : 'this service'}"? This permanently deletes it from the database.`)) return;
                btn.disabled = true;
                try {
                    await api(`/api/admin/services/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
                    state.services = state.services.filter(s => s.id !== btn.dataset.id);
                    renderServices(state.services);
                    document.getElementById('statServicesCount').textContent = state.services.length;
                    showToast('Service removed.');
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    if (addNewServiceBtn) {
        addNewServiceBtn.onclick = () => openServiceModal(null);
    }

    function openServiceModal(id) {
        const isEdit = id !== null;
        const item = isEdit ? state.services.find(s => s.id === id) : null;
        if (isEdit && !item) { showToast('Service not found.', 'error'); return; }

        const modalBody = `
            <form id="serviceModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Service Title</label>
                    <input type="text" id="svcTitle" class="form-input" value="${escapeHtml(item ? item.title : '')}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <input type="text" id="svcCat" class="form-input" value="${escapeHtml(item ? item.category : 'Engineering')}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Service Description</label>
                    <textarea id="svcDesc" class="form-input" rows="3" required>${escapeHtml(item ? item.description : '')}</textarea>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label" for="svcPrice">Starting price (USD)</label>
                        <input type="number" id="svcPrice" class="form-input" min="0" step="1" value="${escapeHtml(item ? item.price : 0)}">
                        <small>Set to 0 to display “Custom quote”.</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="svcPriceSuffix">Price unit</label>
                        <input type="text" id="svcPriceSuffix" class="form-input" value="${escapeHtml(item ? item.priceSuffix : '/ project')}" placeholder="/ project">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Deliverables (one per line)</label>
                    <textarea id="svcDeliverables" class="form-input" rows="4">${escapeHtml((item && item.deliverables || []).join('\n'))}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Tags (comma separated)</label>
                    <input type="text" id="svcTags" class="form-input" value="${escapeHtml((item && item.tags || []).join(', '))}" placeholder="Python, AI, FastAPI">
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Add to Service Catalog'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Service' : 'Add New Service', modalBody);

        document.getElementById('serviceModalForm').onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                title: document.getElementById('svcTitle').value.trim(),
                category: document.getElementById('svcCat').value.trim(),
                price: Math.max(0, parseInt(document.getElementById('svcPrice').value, 10) || 0),
                priceSuffix: document.getElementById('svcPriceSuffix').value.trim(),
                description: document.getElementById('svcDesc').value.trim(),
                deliverables: document.getElementById('svcDeliverables').value.split('\n').map(s => s.trim()).filter(Boolean),
                tags: document.getElementById('svcTags').value.split(',').map(s => s.trim()).filter(Boolean),
                featured: true
            };
            try {
                if (isEdit) {
                    const res = await api(`/api/admin/services/${encodeURIComponent(id)}`, { method: 'PUT', body });
                    state.services = state.services.map(s => (s.id === id ? res.service : s));
                    showToast('Service updated!');
                } else {
                    const res = await api('/api/admin/services', { method: 'POST', body });
                    state.services.push(res.service);
                    showToast('New service added!');
                }
                renderServices(state.services);
                document.getElementById('statServicesCount').textContent = state.services.length;
                closeModal();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── PORTFOLIO PROJECTS MANAGER ───
    const projectsListContainer = document.getElementById('projectsAdminList');
    const addNewProjectBtn = document.getElementById('addNewProjectBtn');

    let projectOrderSaving = false;
    let draggedProject = null;

    async function saveProjectOrder(ids) {
        if (projectOrderSaving || ids.every((id, index) => state.projects[index].id === id)) return;
        projectOrderSaving = true;
        projectsListContainer.inert = true;
        projectsListContainer.setAttribute('aria-busy', 'true');
        if (addNewProjectBtn) addNewProjectBtn.disabled = true;
        try {
            await api('/api/admin/projects/reorder', { method: 'PUT', body: { ids } });
            const byId = new Map(state.projects.map(project => [project.id, project]));
            state.projects = ids.map(id => byId.get(id));
            showToast('Project order saved. The website now uses this order.');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            projectOrderSaving = false;
            projectsListContainer.inert = false;
            projectsListContainer.removeAttribute('aria-busy');
            if (addNewProjectBtn) addNewProjectBtn.disabled = false;
            renderProjects(state.projects);
        }
    }

    if (projectsListContainer) {
        projectsListContainer.addEventListener('dragover', event => {
            if (!draggedProject || projectOrderSaving) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            const target = event.target.closest('.admin-item-card');
            if (!target || target === draggedProject) return;
            const rect = target.getBoundingClientRect();
            projectsListContainer.insertBefore(draggedProject, event.clientY < rect.top + rect.height / 2 ? target : target.nextSibling);
        });
        projectsListContainer.addEventListener('drop', event => {
            if (!draggedProject || projectOrderSaving) return;
            event.preventDefault();
            draggedProject.classList.remove('project-dragging');
            draggedProject = null;
            saveProjectOrder(Array.from(projectsListContainer.children, card => card.dataset.projectId));
        });
    }

    function renderProjects(projects) {
        if (!projectsListContainer) return;
        projectsListContainer.innerHTML = '';

        if (!projects.length) {
            projectsListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No projects added yet.</p>';
            return;
        }

        projects.forEach((proj, index) => {
            const card = document.createElement('div');
            card.className = 'admin-item-card';
            card.dataset.projectId = proj.id;
            const thumbDisplay = proj.image
                ? `<img src="${escapeHtml(proj.image)}" alt="${escapeHtml(proj.title)}">`
                : `<div style="width: 100%; height: 100%; background: ${proj.gradient || 'var(--gradient-accent)'};"></div>`;
            card.innerHTML = `
                <div class="admin-item-left">
                    <button type="button" class="btn-icon project-drag-handle" draggable="true" aria-label="Drag to reorder ${escapeHtml(proj.title)}" title="Drag up or down to reorder">&#8942;&#8942;</button>
                    <div class="admin-item-thumb">${thumbDisplay}</div>
                    <div class="admin-item-meta">
                        <h4>${escapeHtml(proj.title)}</h4>
                        <p>${escapeHtml(proj.description)}</p>
                        <span style="font-size: 0.75rem; color: var(--accent-blue); text-transform: uppercase; font-weight: 600;">${escapeHtml(proj.categoryLabel || proj.category)}</span>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button type="button" class="btn-icon project-move-up" aria-label="Move ${escapeHtml(proj.title)} up" title="Move up" ${index === 0 ? 'disabled' : ''}>&uarr;</button>
                    <button type="button" class="btn-icon project-move-down" aria-label="Move ${escapeHtml(proj.title)} down" title="Move down" ${index === projects.length - 1 ? 'disabled' : ''}>&darr;</button>
                    <button class="btn-icon btn-edit-project" data-id="${escapeHtml(proj.id)}" title="Edit project & thumbnail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-project" data-id="${escapeHtml(proj.id)}" title="Delete project">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            const handle = card.querySelector('.project-drag-handle');
            handle.addEventListener('dragstart', event => {
                if (projectOrderSaving) { event.preventDefault(); return; }
                draggedProject = card;
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', proj.id);
                event.dataTransfer.setDragImage(card, 30, 20);
                card.classList.add('project-dragging');
            });
            handle.addEventListener('dragend', () => {
                card.classList.remove('project-dragging');
                if (draggedProject) {
                    draggedProject = null;
                    renderProjects(state.projects);
                }
            });
            [-1, 1].forEach(direction => {
                card.querySelector(direction < 0 ? '.project-move-up' : '.project-move-down').onclick = () => {
                    const ids = state.projects.map(project => project.id);
                    const destination = index + direction;
                    if (destination < 0 || destination >= ids.length) return;
                    [ids[index], ids[destination]] = [ids[destination], ids[index]];
                    saveProjectOrder(ids);
                };
            });
            projectsListContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-project').forEach(btn => {
            btn.onclick = () => openProjectModal(btn.dataset.id);
        });

        document.querySelectorAll('.btn-del-project').forEach(btn => {
            btn.onclick = async () => {
                const proj = state.projects.find(p => p.id === btn.dataset.id);
                if (!confirm(`Are you sure you want to remove "${proj ? proj.title : 'this project'}"? This permanently deletes it from the database.`)) return;
                btn.disabled = true;
                try {
                    await api(`/api/admin/projects/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
                    state.projects = state.projects.filter(p => p.id !== btn.dataset.id);
                    renderProjects(state.projects);
                    document.getElementById('statProjectsCount').textContent = state.projects.length;
                    showToast('Project removed.');
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    if (addNewProjectBtn) {
        addNewProjectBtn.onclick = () => openProjectModal(null);
    }

    function openProjectModal(id) {
        const isEdit = id !== null;
        const item = isEdit ? state.projects.find(p => p.id === id) : null;
        if (isEdit && !item) { showToast('Project not found.', 'error'); return; }

        let tempImage = item ? item.image : null;

        const modalBody = `
            <form id="projectModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Project Title</label>
                    <input type="text" id="projTitle" class="form-input" value="${escapeHtml(item ? item.title : '')}" required>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Filter Category</label>
                        <select id="projCat" class="form-input" required>
                            <option value="agentic" ${item && item.category === 'agentic' ? 'selected' : ''}>Agentic AI &amp; LLM Systems</option>
                            <option value="vision" ${item && item.category === 'vision' ? 'selected' : ''}>Computer Vision &amp; Real-Time AI</option>
                            <option value="platforms" ${item && item.category === 'platforms' ? 'selected' : ''}>ML Platforms &amp; Data Products</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client / Context</label>
                        <input type="text" id="projClient" class="form-input" value="${escapeHtml(item ? item.client : '')}" placeholder="e.g. FinTech Client (NDA)">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Short Description (1-2 sentences)</label>
                    <input type="text" id="projDesc" class="form-input" value="${escapeHtml(item ? item.description : '')}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Full Case Study Details (Expanded Lightbox View)</label>
                    <textarea id="projFullDetails" class="form-input" rows="4" required>${escapeHtml(item ? (item.fullDetails || item.description) : '')}</textarea>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Tech Stack</label>
                        <input type="text" id="projStack" class="form-input" value="${escapeHtml(item ? item.stack : '')}" placeholder="Python, PyTorch, FastAPI">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Measurable Impact</label>
                        <input type="text" id="projImpact" class="form-input" value="${escapeHtml(item ? item.impact : '')}" placeholder="e.g. 60% faster, 98% accuracy">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Duration</label>
                    <input type="text" id="projDuration" class="form-input" value="${escapeHtml(item ? item.duration : '3 months')}" placeholder="e.g. 3 months">
                </div>
                <div class="form-group">
                    <label for="projUrl" class="form-label">Live Project / GitHub URL (optional)</label>
                    <input type="url" id="projUrl" class="form-input" value="${escapeHtml(item ? (item.projectUrl || '') : '')}" placeholder="https://github.com/username/project" aria-describedby="projUrlHelp">
                    <p id="projUrlHelp" class="form-hint">Add the full https:// link to your live project or GitHub repository.</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Project Thumbnail Image (under 450KB)</label>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div id="projThumbPreview" style="width: 80px; height: 60px; border-radius: 10px; overflow: hidden; background: ${item ? item.gradient : 'var(--gradient-accent)'}; border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center;">
                            ${tempImage ? `<img src="${escapeHtml(tempImage)}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 0.7rem; color: #fff;">Gradient</span>'}
                        </div>
                        <div>
                            <label for="projImgInput" class="btn btn-outline btn-sm upload-btn-label">
                                <span>Upload Custom Image</span>
                            </label>
                            <input type="file" id="projImgInput" accept="image/*" style="display: none;">
                            <button type="button" class="btn-text" id="resetProjImgBtn">Use Default Gradient</button>
                        </div>
                    </div>
                </div>

                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Project' : 'Create Project'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Portfolio Project' : 'Add New Portfolio Project', modalBody);

        const projImgInput = document.getElementById('projImgInput');
        const projThumbPreview = document.getElementById('projThumbPreview');
        const resetProjImgBtn = document.getElementById('resetProjImgBtn');

        if (projImgInput) {
            projImgInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 450 * 1024) {
                    showToast('Image is too large — please use an image under 450KB.', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    tempImage = event.target.result;
                    projThumbPreview.innerHTML = `<img src="${tempImage}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            };
        }

        if (resetProjImgBtn) {
            resetProjImgBtn.onclick = () => {
                tempImage = null;
                projThumbPreview.innerHTML = '<span style="font-size: 0.7rem; color: #fff;">Gradient</span>';
                projThumbPreview.style.background = item ? item.gradient : 'var(--gradient-accent)';
            };
        }

        document.getElementById('projectModalForm').onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                title: document.getElementById('projTitle').value.trim(),
                category: document.getElementById('projCat').value,
                description: document.getElementById('projDesc').value.trim(),
                fullDetails: document.getElementById('projFullDetails').value.trim(),
                client: document.getElementById('projClient').value.trim(),
                stack: document.getElementById('projStack').value.trim(),
                impact: document.getElementById('projImpact').value.trim(),
                duration: document.getElementById('projDuration').value.trim(),
                projectUrl: document.getElementById('projUrl').value.trim(),
                image: tempImage,
                gradient: item ? item.gradient : 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'
            };
            try {
                if (isEdit) {
                    const res = await api(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'PUT', body });
                    state.projects = state.projects.map(p => (p.id === id ? res.project : p));
                    showToast('Project updated!');
                } else {
                    const res = await api('/api/admin/projects', { method: 'POST', body });
                    state.projects.push(res.project);
                    showToast('New project added!');
                }
                renderProjects(state.projects);
                document.getElementById('statProjectsCount').textContent = state.projects.length;
                closeModal();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── AWARDS & HONORS MANAGER ───
    const awardsListContainer = document.getElementById('awardsAdminList');
    const addNewAwardBtn = document.getElementById('addNewAwardBtn');

    function renderAwards(awards) {
        if (!awardsListContainer) return;
        awardsListContainer.innerHTML = '';

        if (!awards.length) {
            awardsListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No awards added yet.</p>';
            return;
        }

        awards.forEach((award) => {
            const card = document.createElement('div');
            card.className = 'admin-item-card';
            card.innerHTML = `
                <div class="admin-item-left">
                    <div class="admin-item-thumb" style="color: #f59e0b;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    </div>
                    <div class="admin-item-meta">
                        <h4>${escapeHtml(award.title)} (${escapeHtml(award.year)})</h4>
                        <p>${escapeHtml(award.issuer)}</p>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon btn-edit-award" data-id="${escapeHtml(award.id)}" title="Edit award">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-award" data-id="${escapeHtml(award.id)}" title="Delete award">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            awardsListContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-award').forEach(btn => {
            btn.onclick = () => openAwardModal(btn.dataset.id);
        });

        document.querySelectorAll('.btn-del-award').forEach(btn => {
            btn.onclick = async () => {
                const aw = state.awards.find(a => a.id === btn.dataset.id);
                if (!confirm(`Are you sure you want to remove "${aw ? aw.title : 'this award'}"? This permanently deletes it from the database.`)) return;
                btn.disabled = true;
                try {
                    await api(`/api/admin/awards/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
                    state.awards = state.awards.filter(a => a.id !== btn.dataset.id);
                    renderAwards(state.awards);
                    document.getElementById('statAwardsCount').textContent = state.awards.length + state.certifications.length;
                    showToast('Award removed.');
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    if (addNewAwardBtn) {
        addNewAwardBtn.onclick = () => openAwardModal(null);
    }

    function openAwardModal(id) {
        const isEdit = id !== null;
        const item = isEdit ? state.awards.find(a => a.id === id) : null;
        if (isEdit && !item) { showToast('Award not found.', 'error'); return; }

        const modalBody = `
            <form id="awardModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Award / Achievement Title</label>
                    <input type="text" id="awTitle" class="form-input" value="${escapeHtml(item ? item.title : '')}" required>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Year / Date</label>
                        <input type="text" id="awYear" class="form-input" value="${escapeHtml(item ? item.year : new Date().getFullYear().toString())}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Issuing Body / Organization</label>
                        <input type="text" id="awIssuer" class="form-input" value="${escapeHtml(item ? item.issuer : '')}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Status Pill Label</label>
                    <input type="text" id="awPill" class="form-input" value="${escapeHtml(item ? item.statusPill : 'Achievement')}" placeholder="Achievement / Public Sector Impact">
                </div>
                <div class="form-group">
                    <label class="form-label">Detailed Description</label>
                    <textarea id="awDesc" class="form-input" rows="3" required>${escapeHtml(item ? item.description : '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Why It Matters (Callout highlight)</label>
                    <textarea id="awWhy" class="form-input" rows="3" required>${escapeHtml(item ? item.whyItMatters : '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Tags (comma separated)</label>
                    <input type="text" id="awTags" class="form-input" value="${escapeHtml((item && item.tags || []).join(', '))}" placeholder="AI, Engineering">
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Award'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Achievement' : 'Add New Achievement', modalBody);

        document.getElementById('awardModalForm').onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                title: document.getElementById('awTitle').value.trim(),
                year: document.getElementById('awYear').value.trim(),
                issuer: document.getElementById('awIssuer').value.trim(),
                statusPill: document.getElementById('awPill').value.trim() || 'Achievement',
                description: document.getElementById('awDesc').value.trim(),
                whyItMatters: document.getElementById('awWhy').value.trim(),
                tags: document.getElementById('awTags').value.split(',').map(s => s.trim()).filter(Boolean)
            };
            try {
                if (isEdit) {
                    const res = await api(`/api/admin/awards/${encodeURIComponent(id)}`, { method: 'PUT', body });
                    state.awards = state.awards.map(a => (a.id === id ? res.award : a));
                    showToast('Achievement updated!');
                } else {
                    const res = await api('/api/admin/awards', { method: 'POST', body });
                    state.awards.push(res.award);
                    showToast('New achievement added!');
                }
                renderAwards(state.awards);
                document.getElementById('statAwardsCount').textContent = state.awards.length + state.certifications.length;
                closeModal();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── CERTIFICATIONS MANAGER ───
    const certificationsListContainer = document.getElementById('certificationsAdminList');
    const addNewCertificationBtn = document.getElementById('addNewCertificationBtn');

    function renderCertifications(certifications) {
        if (!certificationsListContainer) return;
        certificationsListContainer.innerHTML = '';

        if (!certifications.length) {
            certificationsListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No certificates added yet.</p>';
            return;
        }

        certifications.forEach(certification => {
            const card = document.createElement('div');
            card.className = 'admin-item-card';
            card.innerHTML = `
                <div class="admin-item-left">
                    <div class="admin-item-thumb" style="color: var(--accent);">
                        ${certification.imageUrl
                            ? `<img src="${escapeHtml(certification.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;">`
                            : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>'}
                    </div>
                    <div class="admin-item-meta">
                        <h4>${escapeHtml(certification.title)}${certification.issueDate ? ` (${escapeHtml(certification.issueDate)})` : ''}</h4>
                        <p>${escapeHtml(certification.issuer || 'Issuing organization not specified')}</p>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon btn-edit-certification" data-id="${escapeHtml(certification.id)}" title="Edit certificate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-certification" data-id="${escapeHtml(certification.id)}" title="Delete certificate">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            certificationsListContainer.appendChild(card);
        });

        certificationsListContainer.querySelectorAll('.btn-edit-certification').forEach(btn => {
            btn.onclick = () => openCertificationModal(btn.dataset.id);
        });
        certificationsListContainer.querySelectorAll('.btn-del-certification').forEach(btn => {
            btn.onclick = async () => {
                const certification = state.certifications.find(item => item.id === btn.dataset.id);
                if (!confirm(`Are you sure you want to remove "${certification ? certification.title : 'this certificate'}"? This permanently deletes it from the database.`)) return;
                btn.disabled = true;
                try {
                    await api(`/api/admin/certifications/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
                    state.certifications = state.certifications.filter(item => item.id !== btn.dataset.id);
                    renderCertifications(state.certifications);
                    document.getElementById('statAwardsCount').textContent = state.awards.length + state.certifications.length;
                    showToast('Certificate removed.');
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    if (addNewCertificationBtn) {
        addNewCertificationBtn.onclick = () => openCertificationModal(null);
    }

    function openCertificationModal(id) {
        const isEdit = id !== null;
        const item = isEdit ? state.certifications.find(certification => certification.id === id) : null;
        if (isEdit && !item) { showToast('Certificate not found.', 'error'); return; }

        const modalBody = `
            <form id="certificationModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label" for="certTitle">Certificate title</label>
                    <input type="text" id="certTitle" class="form-input" value="${escapeHtml(item ? item.title : '')}" required maxlength="160">
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label" for="certIssuer">Issuing organization</label>
                        <input type="text" id="certIssuer" class="form-input" value="${escapeHtml(item ? item.issuer : '')}" maxlength="160">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="certIssueDate">Issue date</label>
                        <input type="text" id="certIssueDate" class="form-input" value="${escapeHtml(item ? item.issueDate : '')}" placeholder="e.g. October 2026">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="certCredentialUrl">Credential verification URL</label>
                    <input type="url" id="certCredentialUrl" class="form-input" value="${escapeHtml(item ? item.credentialUrl : '')}" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label class="form-label" for="certImageUrl">Certificate image URL (optional)</label>
                    <input type="text" id="certImageUrl" class="form-input" value="${escapeHtml(item && !item.imageUrl.startsWith('data:image/') ? item.imageUrl : '')}" placeholder="/assets/certificate.png or https://...">
                    <input type="file" id="certImageFile" class="form-input" accept="image/*" style="margin-top: 8px;">
                    ${item && item.imageUrl.startsWith('data:image/') ? '<small>Certificate image is uploaded. Choose a new file to replace it.</small>' : ''}
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Add Certificate'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Certificate' : 'Add Certificate', modalBody);
        const imageFileInput = document.getElementById('certImageFile');
        imageFileInput.addEventListener('change', async () => {
            const file = imageFileInput.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Please choose an image file.', 'error');
                imageFileInput.value = '';
                return;
            }
            if (file.size > 200 * 1024) {
                showToast('Certificate image is too large — please use an image under 200KB.', 'error');
                imageFileInput.value = '';
                return;
            }
            try {
                const dataUri = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = event => resolve(event.target.result);
                    reader.onerror = () => reject(new Error('Could not read the selected certificate image.'));
                    reader.readAsDataURL(file);
                });
                document.getElementById('certImageUrl').value = dataUri;
            } catch (err) {
                showToast(err.message, 'error');
                imageFileInput.value = '';
            }
        });
        document.getElementById('certificationModalForm').onsubmit = async event => {
            event.preventDefault();
            const body = {
                title: document.getElementById('certTitle').value.trim(),
                issuer: document.getElementById('certIssuer').value.trim(),
                issueDate: document.getElementById('certIssueDate').value.trim(),
                credentialUrl: document.getElementById('certCredentialUrl').value.trim(),
                imageUrl: document.getElementById('certImageUrl').value.trim()
                    || (isEdit ? item.imageUrl : '')
            };
            try {
                if (isEdit) {
                    const res = await api(`/api/admin/certifications/${encodeURIComponent(id)}`, { method: 'PUT', body });
                    state.certifications = state.certifications.map(certification => certification.id === id ? res.certification : certification);
                    showToast('Certificate updated!');
                } else {
                    const res = await api('/api/admin/certifications', { method: 'POST', body });
                    state.certifications.push(res.certification);
                    showToast('Certificate added!');
                }
                renderCertifications(state.certifications);
                document.getElementById('statAwardsCount').textContent = state.awards.length + state.certifications.length;
                closeModal();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── LOGOS & MARQUEE MANAGER ───
    const logosListContainer = document.getElementById('logosAdminList');
    const addNewLogoBtn = document.getElementById('addNewLogoBtn');

    function renderLogos(logos) {
        if (!logosListContainer) return;
        logosListContainer.innerHTML = '';

        if (!logos.length) {
            logosListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No logos added yet.</p>';
            return;
        }

        logos.forEach((logo, index) => {
            const card = document.createElement('div');
            card.className = 'admin-item-card';
            card.innerHTML = `
                <div class="admin-item-left">
                    <div class="admin-item-thumb" style="color: var(--accent-orange);">
                        <img src="${escapeHtml(logo.imageUrl)}" alt="${escapeHtml(logo.name)}" style="width: 32px; height: 32px; object-fit: contain;">
                    </div>
                    <div class="admin-item-meta">
                        <h4>${escapeHtml(logo.name)}</h4>
                        <p style="font-size: 12px; color: var(--text-tertiary);">${escapeHtml(logo.imageUrl)}</p>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon btn-edit-logo" data-id="${escapeHtml(logo.id)}" title="Edit logo">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-logo" data-id="${escapeHtml(logo.id)}" title="Delete logo">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            logosListContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-logo').forEach(btn => {
            btn.onclick = () => openLogoModal(btn.dataset.id);
        });

        document.querySelectorAll('.btn-del-logo').forEach(btn => {
            btn.onclick = async () => {
                const lg = state.logos.find(l => l.id === btn.dataset.id);
                if (!confirm(`Are you sure you want to remove "${lg ? lg.name : 'this logo'}"? This permanently deletes it from the database.`)) return;
                btn.disabled = true;
                try {
                    await api(`/api/admin/logos/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
                    state.logos = state.logos.filter(l => l.id !== btn.dataset.id);
                    renderLogos(state.logos);
                    showToast('Logo removed.');
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    if (addNewLogoBtn) {
        addNewLogoBtn.onclick = () => openLogoModal(null);
    }

    function openLogoModal(id) {
        const isEdit = id !== null;
        const item = isEdit ? state.logos.find(l => l.id === id) : null;
        if (isEdit && !item) { showToast('Logo not found.', 'error'); return; }

        const modalBody = `
            <form id="logoModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Logo Name</label>
                    <input type="text" id="logoName" class="form-input" value="${escapeHtml(item ? item.name : '')}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Image URL</label>
                    <input type="text" id="logoImageUrl" class="form-input" value="${escapeHtml(item ? item.imageUrl : '')}" placeholder="/assets/logos/python.png" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Or Upload Image</label>
                    <input type="file" id="logoImageFile" class="form-input" accept="image/*">
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Logo'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Logo' : 'Add New Logo', modalBody);

        const fileInput = document.getElementById('logoImageFile');
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 500 * 1024) {
                    showToast('Image is too large — please use an image under 500KB.', 'error');
                    fileInput.value = '';
                    return;
                }
                const dataUri = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result);
                    reader.onerror = () => reject(new Error('Could not read the selected file.'));
                    reader.readAsDataURL(file);
                });
                document.getElementById('logoImageUrl').value = dataUri;
            });
        }

        document.getElementById('logoModalForm').onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                name: document.getElementById('logoName').value.trim(),
                imageUrl: document.getElementById('logoImageUrl').value.trim(),
            };
            try {
                if (isEdit) {
                    const res = await api(`/api/admin/logos/${encodeURIComponent(id)}`, { method: 'PUT', body });
                    state.logos = state.logos.map(l => (l.id === id ? res.logo : l));
                    showToast('Logo updated!');
                } else {
                    const res = await api('/api/admin/logos', { method: 'POST', body });
                    state.logos.push(res.logo);
                    showToast('New logo added!');
                }
                renderLogos(state.logos);
                closeModal();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── VIDEO SHOWCASE MANAGER ───
    const videosListContainer = document.getElementById('videosAdminList');
    const addNewVideoBtn = document.getElementById('addNewVideoBtn');

    function renderVideos(videos) {
        if (!videosListContainer) return;
        videosListContainer.innerHTML = '';

        if (!videos || !videos.length) {
            videosListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No videos added yet. Click "Add New Video" to get started.</p>';
            return;
        }

        videos.forEach((vid) => {
            const vidId = extractYouTubeId(vid.youtube_url);
            const thumb = vidId ? `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` : '';

            const item = document.createElement('div');
            item.className = 'admin-video-item';
            item.innerHTML = `
                ${thumb ? `<div class="admin-video-thumb"><img src="${escapeHtml(thumb)}" alt="${escapeHtml(vid.title)}"></div>` : ''}
                <div class="admin-video-info">
                    <p class="admin-video-title">${escapeHtml(vid.title)}</p>
                    <p class="admin-video-meta">${vid.category ? escapeHtml(vid.category) + ' · ' : ''}${escapeHtml(vid.youtube_url)}</p>
                </div>
                <div class="admin-video-actions">
                    <button class="btn-icon btn-edit-video" data-id="${escapeHtml(String(vid.id))}" title="Edit video">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-video" data-id="${escapeHtml(String(vid.id))}" title="Delete video">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            videosListContainer.appendChild(item);
        });

        document.querySelectorAll('.btn-edit-video').forEach(btn => {
            btn.onclick = () => openVideoModal(btn.dataset.id);
        });

        document.querySelectorAll('.btn-del-video').forEach(btn => {
            btn.onclick = async () => {
                const vid = state.showcaseVideos.find(v => String(v.id) === btn.dataset.id);
                if (!confirm(`Delete "${vid ? vid.title : 'this video'}"? This is permanent.`)) return;
                btn.disabled = true;
                try {
                    await api(`/api/admin/videos/${encodeURIComponent(btn.dataset.id)}`, { method: 'DELETE' });
                    state.showcaseVideos = state.showcaseVideos.filter(v => String(v.id) !== btn.dataset.id);
                    renderVideos(state.showcaseVideos);
                    showToast('Video removed.');
                } catch (err) {
                    showToast(err.message, 'error');
                    btn.disabled = false;
                }
            };
        });
    }

    if (addNewVideoBtn) {
        addNewVideoBtn.onclick = () => openVideoModal(null);
    }

    /** Extract an 11-char YouTube video ID from a URL or raw ID string. */
    function extractYouTubeId(raw) {
        if (!raw) return null;
        const short = raw.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        if (short) return short[1];
        const shorts = raw.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shorts) return shorts[1];
        const watch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (watch) return watch[1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(raw.trim())) return raw.trim();
        return null;
    }

    function openVideoModal(id) {
        const isEdit = id !== null;
        const item = isEdit ? state.showcaseVideos.find(v => String(v.id) === id) : null;
        if (isEdit && !item) { showToast('Video not found.', 'error'); return; }

        const modalBody = `
            <form id="videoModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Video Title</label>
                    <input type="text" id="videoTitle" class="form-input" value="${escapeHtml(item ? item.title : '')}" placeholder="Enterprise RAG Pipeline Demo" required>
                </div>
                <div class="form-group">
                    <label class="form-label">YouTube URL or Video ID</label>
                    <input type="text" id="videoYoutubeUrl" class="form-input" value="${escapeHtml(item ? item.youtube_url : '')}" placeholder="https://youtu.be/dQw4w9WgXcQ or dQw4w9WgXcQ" required>
                    <span style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;display:block;">Paste any YouTube link — full URL, youtu.be short link, or just the video ID.</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Category <span style="opacity:.6">(optional)</span></label>
                    <input type="text" id="videoCategory" class="form-input" value="${escapeHtml(item ? (item.category || '') : '')}" placeholder="e.g. Agentic AI, Computer Vision">
                </div>
                <div class="form-group">
                    <label class="form-label">Short Description <span style="opacity:.6">(optional)</span></label>
                    <textarea id="videoDescription" class="form-input form-textarea" rows="3" placeholder="Brief context about what this demo shows…">${escapeHtml(item ? (item.description || '') : '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Sort Order <span style="opacity:.6">(lower = first)</span></label>
                    <input type="number" id="videoSortOrder" class="form-input" value="${item ? (item.sort_order ?? 0) : 0}" min="0" step="1">
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Add Video'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Video' : 'Add New Video', modalBody);

        document.getElementById('videoModalForm').onsubmit = async (e) => {
            e.preventDefault();
            const body = {
                title: document.getElementById('videoTitle').value.trim(),
                youtube_url: document.getElementById('videoYoutubeUrl').value.trim(),
                category: document.getElementById('videoCategory').value.trim(),
                description: document.getElementById('videoDescription').value.trim(),
                sort_order: parseInt(document.getElementById('videoSortOrder').value, 10) || 0,
            };
            try {
                if (isEdit) {
                    const res = await api(`/api/admin/videos/${encodeURIComponent(id)}`, { method: 'PUT', body });
                    state.showcaseVideos = state.showcaseVideos.map(v => (String(v.id) === id ? res.video : v));
                    showToast('Video updated!');
                } else {
                    const res = await api('/api/admin/videos', { method: 'POST', body });
                    state.showcaseVideos.push(res.video);
                    showToast('Video added!');
                }
                renderVideos(state.showcaseVideos);
                closeModal();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── CONTACT & SOCIALS MANAGER ───
    function renderContact(contact) {
        if (!contact) return;
        document.getElementById('contactEmail').value = contact.email || '';
        document.getElementById('contactWhatsapp').value = contact.whatsapp || '';
        document.getElementById('contactLinkedin').value = contact.linkedin || '';
        document.getElementById('contactGithub').value = contact.github || '';
        const upworkInput = document.getElementById('contactUpwork') || document.getElementById('contactTwitter');
        if (upworkInput) upworkInput.value = contact.upwork || contact.twitter || '';
        document.getElementById('contactKaggle').value = contact.kaggle || '';
    }

    const contactDetailsForm = document.getElementById('contactDetailsForm');
    if (contactDetailsForm) {
        contactDetailsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const upworkVal = ((document.getElementById('contactUpwork') || document.getElementById('contactTwitter'))?.value || '').trim();
            const contact = {
                email: document.getElementById('contactEmail').value.trim(),
                whatsapp: document.getElementById('contactWhatsapp').value.trim(),
                linkedin: document.getElementById('contactLinkedin').value.trim(),
                github: document.getElementById('contactGithub').value.trim(),
                upwork: upworkVal,
                twitter: upworkVal,
                kaggle: document.getElementById('contactKaggle').value.trim()
            };
            try {
                const res = await api('/api/admin/settings', { method: 'PUT', body: { contact } });
                state.contact = res.settings.contact;
                showToast('Contact details & social URLs updated!');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // ─── SECURITY & CREDENTIALS ───
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newUsername = document.getElementById('newUsername').value.trim();
            const newPassword = document.getElementById('newPassword').value;
            const confP = document.getElementById('confirmPassword').value;

            if (newPassword !== confP) {
                showToast('Passwords do not match. Please re-enter.', 'error');
                return;
            }

            try {
                const res = await api('/api/admin/credentials', {
                    method: 'PUT',
                    body: { currentPassword, username: newUsername, newPassword }
                });
                showToast('Verified! Credentials are stored as encrypted Worker secrets.');
                const cmdBox = document.getElementById('credentialCommands');
                if (cmdBox) {
                    cmdBox.innerHTML = `
                        <p style="margin-bottom: 10px; color: var(--text-secondary);">${escapeHtml(res.note)}</p>
                        <pre style="background: rgba(0,0,0,0.35); border: 1px solid var(--border-light); border-radius: 10px; padding: 14px; font-family: var(--font-mono); font-size: 0.8rem; white-space: pre-wrap; word-break: break-all;">${escapeHtml(res.commands.join('\n'))}</pre>
                    `;
                }
                securityForm.reset();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // ─── EXPORT DATA (JSON backup from live D1) ───
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.onclick = async () => {
            try {
                const content = await api('/api/admin/content');
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(content, null, 2));
                const a = document.createElement('a');
                a.setAttribute("href", dataStr);
                a.setAttribute("download", `usama-portfolio-backup-${Date.now()}.json`);
                document.body.appendChild(a);
                a.click();
                a.remove();
                showToast('Site data backup downloaded!');
            } catch (err) {
                showToast(err.message, 'error');
            }
        };
    }

    // ─── MODAL CONTROLLER ───
    const adminModal = document.getElementById('adminModal');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalClose = document.getElementById('modalClose');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    function openModal(title, contentHTML) {
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHTML;
        adminModal.classList.add('open');
        adminModal.setAttribute('aria-hidden', 'false');
    }

    function closeModal() {
        adminModal.classList.remove('open');
        adminModal.setAttribute('aria-hidden', 'true');
    }

    if (modalClose) modalClose.onclick = closeModal;
    if (modalBackdrop) modalBackdrop.onclick = closeModal;

    // ─── BOOT ───
    checkAuth();
});
