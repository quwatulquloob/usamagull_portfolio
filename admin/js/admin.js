/* ============================================
   ADMIN PANEL ENGINE — Logic & Interactions
   Authentication, live content CRUD, image
   upload (Base64), theme selector, security
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ─── AUTHENTICATION STATE ───
    const loginView = document.getElementById('loginView');
    const dashboardLayout = document.getElementById('dashboardLayout');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    function isAuthenticated() {
        return sessionStorage.getItem('usama_admin_logged_in') === 'true';
    }

    function checkAuth() {
        if (isAuthenticated()) {
            loginView.style.display = 'none';
            dashboardLayout.style.display = 'flex';
            loadAllPanels();
        } else {
            loginView.style.display = 'flex';
            dashboardLayout.style.display = 'none';
        }
    }

    // Login Form Submit
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = window.SiteData.get();
            const enteredUser = document.getElementById('loginUsername').value.trim();
            const enteredPass = document.getElementById('loginPassword').value;

            const validUser = data.auth?.username || 'admin';
            const validPass = data.auth?.password || 'Admin@123';

            if (enteredUser === validUser && enteredPass === validPass) {
                sessionStorage.setItem('usama_admin_logged_in', 'true');
                loginError.classList.remove('show');
                checkAuth();
                showToast('Welcome back, Usama! Admin session active.');
            } else {
                loginError.textContent = 'Invalid credentials. Please check username and password.';
                loginError.classList.add('show');
            }
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('usama_admin_logged_in');
            checkAuth();
            showToast('Logged out successfully.');
        });
    }


    // ─── TAB NAVIGATION ───
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const panels = document.querySelectorAll('.admin-panel');
    const pageTitle = document.getElementById('pageTitle');

    window.switchTab = function(targetPanelId) {
        panels.forEach(p => p.classList.remove('active'));
        navItems.forEach(n => n.classList.remove('active'));

        const targetPanel = document.getElementById(targetPanelId);
        const matchingBtn = document.querySelector(`.sidebar-nav .nav-item[data-target="${targetPanelId}"]`);

        if (targetPanel) targetPanel.classList.add('active');
        if (matchingBtn) {
            matchingBtn.classList.add('active');
            if (pageTitle) {
                pageTitle.textContent = matchingBtn.querySelector('span').textContent;
            }
        }
    };

    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            window.switchTab(targetId);
        });
    });


    // ─── TOAST NOTIFICATION ───
    window.showToast = function(message) {
        const toast = document.getElementById('adminToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };


    // ─── LOAD & REFRESH ALL PANELS ───
    function loadAllPanels() {
        const data = window.SiteData.get();

        // 1. Overview counts
        document.getElementById('statServicesCount').textContent = data.services?.length || 0;
        document.getElementById('statProjectsCount').textContent = data.projects?.length || 0;
        document.getElementById('statAwardsCount').textContent = data.awards?.length || 0;
        const themeMap = {
            'charcoal-orange': 'Charcoal Orange',
            'midnight-blue': 'Midnight Blue',
            'slate-purple': 'Slate Purple',
            'emerald-dark': 'Emerald Dark'
        };
        document.getElementById('statActiveTheme').textContent = themeMap[data.theme] || 'Charcoal Orange';

        // 2. Color Theme active indicator
        renderThemes(data.theme);

        // 3. Profile & Bio form
        renderProfile(data.profile);

        // 4. Services list
        renderServices(data.services);

        // 5. Portfolio list
        renderProjects(data.projects);

        // 6. Awards list
        renderAwards(data.awards);

        // 7. Contact form
        renderContact(data.contact);

        // 8. Security form
        renderSecurity(data.auth);
    }


    // ─── THEME SWITCHER ───
    function renderThemes(currentTheme) {
        const themeCards = document.querySelectorAll('.theme-card');
        themeCards.forEach(card => {
            const name = card.getAttribute('data-theme-name');
            if (name === currentTheme) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }

            card.onclick = () => {
                const data = window.SiteData.get();
                data.theme = name;
                window.SiteData.save(data);
                window.SiteData.applyTheme(name);
                renderThemes(name);
                document.getElementById('statActiveTheme').textContent = card.querySelector('.theme-name').textContent;
                showToast(`Theme switched to ${name}! Live site updated.`);
            };
        });
    }


    // ─── PROFILE & PHOTO MANAGER ───
    let currentPhotoBase64 = null;

    function renderProfile(profile) {
        if (!profile) return;
        document.getElementById('profName').value = profile.name || '';
        document.getElementById('profTitle').value = profile.title || '';
        document.getElementById('profTagline').value = profile.tagline || '';
        document.getElementById('profSystems').value = profile.systemsDelivered || 15;
        document.getElementById('profClients').value = profile.happyClients || 10;
        document.getElementById('profYears').value = profile.yearsExp || 4;
        document.getElementById('profRating').value = profile.avgRating || 4.9;

        const preview = document.getElementById('adminPhotoPreview');
        if (preview && profile.photo) {
            preview.src = profile.photo;
            currentPhotoBase64 = profile.photo;
        }
    }

    // Photo file upload
    const photoInput = document.getElementById('profilePhotoInput');
    const photoPreview = document.getElementById('adminPhotoPreview');
    const resetPhotoBtn = document.getElementById('resetPhotoBtn');

    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentPhotoBase64 = event.target.result;
                    photoPreview.src = currentPhotoBase64;
                    showToast('Photo selected! Click "Save Profile Changes" to apply.');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (resetPhotoBtn) {
        resetPhotoBtn.addEventListener('click', () => {
            currentPhotoBase64 = '../assets/profile-placeholder.svg';
            photoPreview.src = currentPhotoBase64;
            showToast('Reset to placeholder headshot.');
        });
    }

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = window.SiteData.get();

            const fullName = document.getElementById('profName').value.trim();
            const parts = fullName.split(' ');
            data.profile.name = fullName;
            data.profile.firstName = parts[0] || 'Usama';
            data.profile.lastName = parts.slice(1).join(' ') || 'Gul';
            data.profile.title = document.getElementById('profTitle').value.trim();
            data.profile.tagline = document.getElementById('profTagline').value.trim();
            data.profile.systemsDelivered = parseInt(document.getElementById('profSystems').value, 10) || 15;
            data.profile.happyClients = parseInt(document.getElementById('profClients').value, 10) || 10;
            data.profile.yearsExp = parseInt(document.getElementById('profYears').value, 10) || 4;
            data.profile.avgRating = parseFloat(document.getElementById('profRating').value) || 4.9;

            if (currentPhotoBase64) {
                data.profile.photo = currentPhotoBase64;
            }

            window.SiteData.save(data);
            showToast('Profile & Headshot saved successfully!');
        });
    }


    // ─── SERVICES MANAGER ───
    const servicesListContainer = document.getElementById('servicesAdminList');
    const addNewServiceBtn = document.getElementById('addNewServiceBtn');

    function renderServices(services) {
        if (!servicesListContainer) return;
        servicesListContainer.innerHTML = '';

        if (!services || services.length === 0) {
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
                        <span class="admin-item-price-tag">Starting at $${service.price} ${service.priceSuffix || ''}</span>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon btn-edit-service" data-index="${index}" title="Edit service and price">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-service" data-index="${index}" title="Delete service">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            servicesListContainer.appendChild(card);
        });

        // Edit button listener
        document.querySelectorAll('.btn-edit-service').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index, 10);
                openServiceModal(idx);
            };
        });

        // Delete button listener
        document.querySelectorAll('.btn-del-service').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index, 10);
                if (confirm(`Are you sure you want to remove "${services[idx].title}"?`)) {
                    const data = window.SiteData.get();
                    data.services.splice(idx, 1);
                    window.SiteData.save(data);
                    renderServices(data.services);
                    document.getElementById('statServicesCount').textContent = data.services.length;
                    showToast('Service removed.');
                }
            };
        });
    }

    if (addNewServiceBtn) {
        addNewServiceBtn.onclick = () => openServiceModal(-1);
    }

    function openServiceModal(index) {
        const data = window.SiteData.get();
        const isEdit = index >= 0;
        const item = isEdit ? data.services[index] : {
            title: '',
            category: 'Autonomous Intelligence',
            price: 1500,
            priceSuffix: '/ system',
            description: '',
            deliverables: ['Custom architecture', 'Production deployment'],
            tags: ['Python', 'AI']
        };

        const modalBody = `
            <form id="serviceModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Service Title</label>
                    <input type="text" id="svcTitle" class="form-input" value="${escapeHtml(item.title)}" required>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <input type="text" id="svcCat" class="form-input" value="${escapeHtml(item.category || '')}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Starting Price ($ USD)</label>
                        <input type="number" id="svcPrice" class="form-input" value="${item.price || 1000}" min="0" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Price Suffix</label>
                    <input type="text" id="svcSuffix" class="form-input" value="${escapeHtml(item.priceSuffix || '/ project')}" placeholder="/ project or / system" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Short Description</label>
                    <textarea id="svcDesc" class="form-input" rows="3" required>${escapeHtml(item.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Deliverables (one per line)</label>
                    <textarea id="svcDeliverables" class="form-input" rows="4">${(item.deliverables || []).join('\n')}</textarea>
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Service'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Service' : 'Add New Service', modalBody);

        document.getElementById('serviceModalForm').onsubmit = (e) => {
            e.preventDefault();
            const deliverables = document.getElementById('svcDeliverables').value
                .split('\n')
                .map(s => s.trim())
                .filter(Boolean);

            const updated = {
                id: item.id || `svc-${Date.now()}`,
                title: document.getElementById('svcTitle').value.trim(),
                category: document.getElementById('svcCat').value.trim(),
                price: parseInt(document.getElementById('svcPrice').value, 10) || 1000,
                priceSuffix: document.getElementById('svcSuffix').value.trim(),
                description: document.getElementById('svcDesc').value.trim(),
                deliverables: deliverables.length ? deliverables : ['Standard Deliverable'],
                tags: item.tags || ['Python', 'AI']
            };

            if (isEdit) {
                data.services[index] = updated;
            } else {
                data.services.push(updated);
            }

            window.SiteData.save(data);
            renderServices(data.services);
            document.getElementById('statServicesCount').textContent = data.services.length;
            closeModal();
            showToast(isEdit ? 'Service & pricing updated!' : 'New service added!');
        };
    }


    // ─── PORTFOLIO PROJECTS MANAGER ───
    const projectsListContainer = document.getElementById('projectsAdminList');
    const addNewProjectBtn = document.getElementById('addNewProjectBtn');

    function renderProjects(projects) {
        if (!projectsListContainer) return;
        projectsListContainer.innerHTML = '';

        if (!projects || projects.length === 0) {
            projectsListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No projects added yet.</p>';
            return;
        }

        projects.forEach((proj, index) => {
            const card = document.createElement('div');
            card.className = 'admin-item-card';

            const thumbDisplay = proj.image ? 
                `<img src="${proj.image}" alt="${escapeHtml(proj.title)}">` : 
                `<div style="width: 100%; height: 100%; background: ${proj.gradient || 'var(--gradient-accent)'};"></div>`;

            card.innerHTML = `
                <div class="admin-item-left">
                    <div class="admin-item-thumb">
                        ${thumbDisplay}
                    </div>
                    <div class="admin-item-meta">
                        <h4>${escapeHtml(proj.title)}</h4>
                        <p>${escapeHtml(proj.description)}</p>
                        <span style="font-size: 0.75rem; color: var(--accent-blue); text-transform: uppercase; font-weight: 600;">${proj.categoryLabel || proj.category}</span>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="btn-icon btn-edit-project" data-index="${index}" title="Edit project & thumbnail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-project" data-index="${index}" title="Delete project">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            projectsListContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-project').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index, 10);
                openProjectModal(idx);
            };
        });

        document.querySelectorAll('.btn-del-project').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index, 10);
                if (confirm(`Are you sure you want to remove "${projects[idx].title}"?`)) {
                    const data = window.SiteData.get();
                    data.projects.splice(idx, 1);
                    window.SiteData.save(data);
                    renderProjects(data.projects);
                    document.getElementById('statProjectsCount').textContent = data.projects.length;
                    showToast('Project removed.');
                }
            };
        });
    }

    if (addNewProjectBtn) {
        addNewProjectBtn.onclick = () => openProjectModal(-1);
    }

    function openProjectModal(index) {
        const data = window.SiteData.get();
        const isEdit = index >= 0;
        const item = isEdit ? data.projects[index] : {
            title: '',
            category: 'agentic',
            categoryLabel: 'Agentic AI & LLMs',
            description: '',
            fullDetails: '',
            client: '',
            stack: '',
            impact: '',
            duration: '',
            image: null,
            gradient: 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'
        };

        let tempImageBase64 = item.image || null;

        const modalBody = `
            <form id="projectModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Project Title</label>
                    <input type="text" id="projTitle" class="form-input" value="${escapeHtml(item.title)}" required>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Filter Category</label>
                        <select id="projCat" class="form-input" required>
                            <option value="agentic" ${item.category === 'agentic' ? 'selected' : ''}>Agentic AI & LLM Systems</option>
                            <option value="vision" ${item.category === 'vision' ? 'selected' : ''}>Computer Vision & Real-Time AI</option>
                            <option value="platforms" ${item.category === 'platforms' ? 'selected' : ''}>ML Platforms & Data Products</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client / Context</label>
                        <input type="text" id="projClient" class="form-input" value="${escapeHtml(item.client || '')}" placeholder="e.g. FinTech Client (NDA)">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Short Description (1-2 sentences)</label>
                    <input type="text" id="projDesc" class="form-input" value="${escapeHtml(item.description)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Full Case Study Details (Expanded Lightbox View)</label>
                    <textarea id="projFullDetails" class="form-input" rows="4" required>${escapeHtml(item.fullDetails || item.description)}</textarea>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Tech Stack</label>
                        <input type="text" id="projStack" class="form-input" value="${escapeHtml(item.stack || '')}" placeholder="Python, PyTorch, FastAPI">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Measurable Impact</label>
                        <input type="text" id="projImpact" class="form-input" value="${escapeHtml(item.impact || '')}" placeholder="e.g. 60% faster, 98% accuracy">
                    </div>
                </div>
                
                <!-- Project Image Upload Box -->
                <div class="form-group">
                    <label class="form-label">Project Thumbnail Image</label>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div id="projThumbPreview" style="width: 80px; height: 60px; border-radius: 10px; overflow: hidden; background: ${item.gradient || 'var(--gradient-accent)'}; border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center;">
                            ${tempImageBase64 ? `<img src="${tempImageBase64}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 0.7rem; color: #fff;">Gradient</span>'}
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
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        tempImageBase64 = event.target.result;
                        projThumbPreview.innerHTML = `<img src="${tempImageBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        if (resetProjImgBtn) {
            resetProjImgBtn.onclick = () => {
                tempImageBase64 = null;
                projThumbPreview.innerHTML = '<span style="font-size: 0.7rem; color: #fff;">Gradient</span>';
                projThumbPreview.style.background = item.gradient || 'var(--gradient-accent)';
            };
        }

        document.getElementById('projectModalForm').onsubmit = (e) => {
            e.preventDefault();
            const cat = document.getElementById('projCat').value;
            const catLabelMap = {
                'agentic': 'Agentic AI & LLMs',
                'vision': 'Computer Vision & Real-Time AI',
                'platforms': 'ML Platforms & Data Products'
            };

            const updated = {
                id: item.id || `proj-${Date.now()}`,
                title: document.getElementById('projTitle').value.trim(),
                category: cat,
                categoryLabel: catLabelMap[cat],
                description: document.getElementById('projDesc').value.trim(),
                fullDetails: document.getElementById('projFullDetails').value.trim(),
                client: document.getElementById('projClient').value.trim(),
                stack: document.getElementById('projStack').value.trim(),
                impact: document.getElementById('projImpact').value.trim(),
                duration: item.duration || '3 months',
                image: tempImageBase64,
                gradient: item.gradient || 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'
            };

            if (isEdit) {
                data.projects[index] = updated;
            } else {
                data.projects.push(updated);
            }

            window.SiteData.save(data);
            renderProjects(data.projects);
            document.getElementById('statProjectsCount').textContent = data.projects.length;
            closeModal();
            showToast(isEdit ? 'Project updated!' : 'New project added!');
        };
    }


    // ─── AWARDS & HONORS MANAGER ───
    const awardsListContainer = document.getElementById('awardsAdminList');
    const addNewAwardBtn = document.getElementById('addNewAwardBtn');

    function renderAwards(awards) {
        if (!awardsListContainer) return;
        awardsListContainer.innerHTML = '';

        if (!awards || awards.length === 0) {
            awardsListContainer.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">No awards added yet.</p>';
            return;
        }

        awards.forEach((award, index) => {
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
                    <button class="btn-icon btn-edit-award" data-index="${index}" title="Edit award">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="btn-icon btn-icon-del btn-del-award" data-index="${index}" title="Delete award">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            `;
            awardsListContainer.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-award').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index, 10);
                openAwardModal(idx);
            };
        });

        document.querySelectorAll('.btn-del-award').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.index, 10);
                if (confirm(`Are you sure you want to remove "${awards[idx].title}"?`)) {
                    const data = window.SiteData.get();
                    data.awards.splice(idx, 1);
                    window.SiteData.save(data);
                    renderAwards(data.awards);
                    document.getElementById('statAwardsCount').textContent = data.awards.length;
                    showToast('Award removed.');
                }
            };
        });
    }

    if (addNewAwardBtn) {
        addNewAwardBtn.onclick = () => openAwardModal(-1);
    }

    function openAwardModal(index) {
        const data = window.SiteData.get();
        const isEdit = index >= 0;
        const item = isEdit ? data.awards[index] : {
            title: '',
            year: new Date().getFullYear().toString(),
            issuer: '',
            statusPill: 'Honored',
            description: '',
            whyItMatters: '',
            tags: ['AI', 'Engineering']
        };

        const modalBody = `
            <form id="awardModalForm" class="admin-form" style="background: transparent; border: none; padding: 0;">
                <div class="form-group">
                    <label class="form-label">Award / Achievement Title</label>
                    <input type="text" id="awTitle" class="form-input" value="${escapeHtml(item.title)}" required>
                </div>
                <div class="form-grid-2">
                    <div class="form-group">
                        <label class="form-label">Year / Date</label>
                        <input type="text" id="awYear" class="form-input" value="${escapeHtml(item.year)}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Issuing Body / Organization</label>
                        <input type="text" id="awIssuer" class="form-input" value="${escapeHtml(item.issuer)}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Detailed Description</label>
                    <textarea id="awDesc" class="form-input" rows="3" required>${escapeHtml(item.description)}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Why It Matters (Callout highlight)</label>
                    <textarea id="awWhy" class="form-input" rows="3" required>${escapeHtml(item.whyItMatters)}</textarea>
                </div>
                <div class="form-actions-bar">
                    <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Award'}</button>
                </div>
            </form>
        `;

        openModal(isEdit ? 'Edit Achievement' : 'Add New Achievement', modalBody);

        document.getElementById('awardModalForm').onsubmit = (e) => {
            e.preventDefault();
            const updated = {
                id: item.id || `aw-${Date.now()}`,
                title: document.getElementById('awTitle').value.trim(),
                year: document.getElementById('awYear').value.trim(),
                issuer: document.getElementById('awIssuer').value.trim(),
                statusPill: item.statusPill || 'Achievement',
                description: document.getElementById('awDesc').value.trim(),
                whyItMatters: document.getElementById('awWhy').value.trim(),
                tags: item.tags || ['AI', 'Engineering']
            };

            if (isEdit) {
                data.awards[index] = updated;
            } else {
                data.awards.push(updated);
            }

            window.SiteData.save(data);
            renderAwards(data.awards);
            document.getElementById('statAwardsCount').textContent = data.awards.length;
            closeModal();
            showToast(isEdit ? 'Achievement updated!' : 'New achievement added!');
        };
    }


    // ─── CONTACT & SOCIALS MANAGER ───
    function renderContact(contact) {
        if (!contact) return;
        document.getElementById('contactEmail').value = contact.email || '';
        document.getElementById('contactWhatsapp').value = contact.whatsapp || '';
        document.getElementById('contactLinkedin').value = contact.linkedin || '';
        document.getElementById('contactGithub').value = contact.github || '';
        document.getElementById('contactTwitter').value = contact.twitter || '';
        document.getElementById('contactKaggle').value = contact.kaggle || '';
    }

    const contactDetailsForm = document.getElementById('contactDetailsForm');
    if (contactDetailsForm) {
        contactDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = window.SiteData.get();

            data.contact.email = document.getElementById('contactEmail').value.trim();
            const rawWa = document.getElementById('contactWhatsapp').value.trim();
            data.contact.whatsapp = rawWa;
            data.contact.whatsappRaw = rawWa.replace(/[^0-9]/g, '');
            data.contact.linkedin = document.getElementById('contactLinkedin').value.trim();
            data.contact.github = document.getElementById('contactGithub').value.trim();
            data.contact.twitter = document.getElementById('contactTwitter').value.trim();
            data.contact.kaggle = document.getElementById('contactKaggle').value.trim();

            window.SiteData.save(data);
            showToast('Contact details & social URLs updated!');
        });
    }


    // ─── SECURITY & ADMIN PASSWORD CHANGER ───
    function renderSecurity(auth) {
        if (!auth) return;
        document.getElementById('newUsername').value = auth.username || 'admin';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
        securityForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newU = document.getElementById('newUsername').value.trim();
            const newP = document.getElementById('newPassword').value;
            const confP = document.getElementById('confirmPassword').value;

            if (newP !== confP) {
                alert('Passwords do not match. Please re-enter.');
                return;
            }

            const data = window.SiteData.get();
            data.auth = {
                username: newU,
                password: newP
            };

            window.SiteData.save(data);
            showToast('Admin credentials updated! Use your new password on next login.');
            securityForm.reset();
            document.getElementById('newUsername').value = newU;
        });
    }


    // ─── EXPORT & RESET DATA BACKUP ───
    const exportBtn = document.getElementById('exportDataBtn');
    const resetBtn = document.getElementById('resetDataBtn');

    if (exportBtn) {
        exportBtn.onclick = () => {
            const data = window.SiteData.get();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `usama-portfolio-backup-${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast('Site data backup downloaded!');
        };
    }

    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('Are you sure you want to reset all site data back to factory defaults? Any custom uploaded images will be reset.')) {
                window.SiteData.reset();
                loadAllPanels();
                showToast('Reset back to factory defaults.');
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

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Run auth check on initial load
    checkAuth();
});
