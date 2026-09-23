/* ============================================
   USAMA GUL — CENTRAL DATA STORE & HYDRATION
   Manages persistent content, themes, and
   dynamic DOM hydration across all pages.
   ============================================ */

const DEFAULT_SITE_DATA = {
    theme: 'charcoal-orange',
    auth: {
        username: 'admin',
        password: 'Admin@123'
    },
    profile: {
        name: 'Usama Gul',
        firstName: 'Usama',
        lastName: 'Gul',
        title: 'AI / ML Engineer',
        tagline: 'Building production-scale AI that actually ships.',
        photo: 'assets/profile-placeholder.svg',
        yearsExp: 4,
        systemsDelivered: 15,
        happyClients: 10,
        avgRating: 4.9,
        techStack: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'LLMs', 'LangGraph', 'OpenCV']
    },
    contact: {
        email: 'rajausamagull123@gmail.com',
        whatsapp: '+92 312 0979064',
        whatsappRaw: '923120979064',
        linkedin: 'https://linkedin.com',
        github: 'https://github.com',
        twitter: 'https://twitter.com',
        kaggle: 'https://kaggle.com'
    },
    services: [
        {
            id: 'agentic-ai',
            title: 'Agentic AI & LLM Systems',
            category: 'Autonomous Intelligence',
            price: 1500,
            priceSuffix: '/ system',
            description: 'Custom AI chatbots and multi-agent workflows engineered with LangGraph, advanced RAG architectures, and custom tool calling for real business workflows.',
            deliverables: [
                'Multi-agent orchestration with LangGraph & CrewAI',
                'Production RAG pipelines with vector databases',
                'Autonomous tool calling & API integrations',
                'Custom prompt engineering & guardrails'
            ],
            tags: ['LangGraph', 'Python', 'OpenAI / Claude', 'Vector DBs']
        },
        {
            id: 'computer-vision',
            title: 'Computer Vision & Real-Time AI',
            category: 'Visual Perception',
            price: 1200,
            priceSuffix: '/ project',
            description: 'Object detection, instance segmentation, and video analytics pipelines using YOLOv8/YOLOv11 and OpenCV, optimized for edge devices and cloud streams.',
            deliverables: [
                'Custom object detection trained on domain datasets',
                'Low-latency video streaming pipelines (RTSP, WebRTC)',
                'Edge optimization for NVIDIA Jetson & TensorRT',
                'Automated QA inspection & anomaly detection'
            ],
            tags: ['YOLOv8/11', 'OpenCV', 'TensorRT', 'PyTorch']
        },
        {
            id: 'voice-ai',
            title: 'Voice AI Assistants',
            category: 'Conversational Audio',
            price: 1800,
            priceSuffix: '/ system',
            description: 'End-to-end conversational voice agents featuring ultra-fast Speech-to-Text (STT), context-aware LLM reasoning, natural Text-to-Speech (TTS), and full telephony integration.',
            deliverables: [
                'Sub-800ms end-to-end voice latency for natural dialogue',
                'Telephony routing & setup (Twilio, SIP trunking)',
                'Neural TTS & voice cloning (ElevenLabs, Cartesia)',
                'Automated call transcripts & CRM synchronization'
            ],
            tags: ['Twilio / SIP', 'Whisper STT', 'ElevenLabs', 'WebSockets']
        },
        {
            id: 'mlops-deployment',
            title: 'MLOps & Production Deployment',
            category: 'Production Infrastructure',
            price: 1000,
            priceSuffix: '/ project',
            description: 'Deploying and optimizing ML models with FastAPI, Docker, and cloud infrastructure for scalable production use with automated drift telemetry.',
            deliverables: [
                'Ultra-fast model inference endpoints using FastAPI & Redis',
                'Containerization with Docker & auto-scaling via Kubernetes',
                'CI/CD automated testing & MLflow tracking',
                'Live metrics, latency monitoring & drift alerts'
            ],
            tags: ['FastAPI', 'Docker', 'AWS / GCP', 'MLflow']
        }
    ],
    awards: [
        {
            id: 'cybhi-2025',
            title: 'Led CYBHIAI Platform 2025',
            year: '2025',
            issuer: 'California Government Public-Sector Initiative',
            statusPill: 'Public Sector Impact',
            description: 'California government-funded agentic AI system for school incident reporting, threat mitigation, and automated triage. Recognized for delivering a production-grade LLM solution for public-sector use.',
            whyItMatters: 'Demonstrates the rare capability to deliver compliant, high-stakes, production-grade LLM architectures trusted by public institutions.',
            tags: ['Agentic AI', 'Government Funded', 'Public Safety', 'Production LLMs']
        },
        {
            id: 'certifications-ai',
            title: 'Certifications in Applied AI & Modern Frameworks',
            year: '2023 – Present',
            issuer: 'DeepLearning.AI & Industry Academies',
            statusPill: 'Continuous Upskilling',
            description: 'Completed rigorous specialized certifications from DeepLearning.AI and leading engineering curriculums covering PyTorch deep learning, advanced RAG architectures, LangChain / LangGraph development, and Agent & MCP development.',
            whyItMatters: 'Reflects continuous upskilling in modern AI, ensuring every solution built leverages cutting-edge paradigms.',
            tags: ['DeepLearning.AI', 'PyTorch', 'LangChain & RAG', 'Agent & MCP']
        },
        {
            id: 'guest-speaker',
            title: 'Guest Speaker: AI Engineering as a Career',
            year: '2024 – 2025',
            issuer: 'University Engineering Department',
            statusPill: 'Community Leadership',
            description: 'Invited as an industry guest speaker to lead a university technical seminar for undergraduate engineering students, helping students understand real-world ML and LLM work versus academic research.',
            whyItMatters: 'Highlights industry credibility, recognized thought leadership, and strong communication skills.',
            tags: ['Guest Speaker', 'Mentorship', 'Production AI Talk', 'Knowledge Sharing']
        }
    ],
    projects: [
        {
            id: 'proj-1',
            title: 'Enterprise RAG Pipeline',
            category: 'agentic',
            categoryLabel: 'Agentic AI & LLMs',
            description: 'Built a retrieval-augmented generation system for internal knowledge management, reducing search time by 60%.',
            fullDetails: 'Designed and deployed a production RAG pipeline integrating vector databases, semantic search, and GPT-4 for a Fortune 500 company\'s internal knowledge base. The system indexes over 200K documents and serves contextual answers with source citations in under 2 seconds.',
            client: 'Fortune 500 Enterprise',
            stack: 'Python, LangChain, Pinecone, FastAPI, AWS',
            impact: '60% reduction in search time, 4x faster onboarding',
            duration: '3 months',
            image: null,
            gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 40%, #ffad33 100%)'
        },
        {
            id: 'proj-2',
            title: 'Multi-Agent Orchestration Framework',
            category: 'agentic',
            categoryLabel: 'Agentic AI & LLMs',
            description: 'Designed an autonomous multi-agent system that orchestrates complex business workflows with zero human intervention.',
            fullDetails: 'Architected a multi-agent orchestration framework where specialized AI agents collaborate to handle end-to-end business processes — from data extraction and validation to report generation and stakeholder notification.',
            client: 'FinTech Startup',
            stack: 'Python, AutoGen, CrewAI, Redis, Docker',
            impact: '90% automation of manual review workflows',
            duration: '4 months',
            image: null,
            gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)'
        },
        {
            id: 'proj-3',
            title: 'Real-Time Object Detection System',
            category: 'vision',
            categoryLabel: 'Computer Vision & Real-Time AI',
            description: 'Deployed a 60fps edge-optimized detection system for manufacturing quality assurance on embedded hardware.',
            fullDetails: 'Engineered a real-time object detection pipeline running at 60fps on NVIDIA Jetson edge devices for a manufacturing plant. Identifies defects on assembly lines with 98.5% accuracy, triggering automated rejection and alerting.',
            client: 'VisionTech Manufacturing',
            stack: 'Python, YOLOv8, TensorRT, NVIDIA Jetson, MQTT',
            impact: '98.5% accuracy, 70% fewer defects reaching customers',
            duration: '4 months',
            image: null,
            gradient: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 50%, #023e8a 100%)'
        },
        {
            id: 'proj-4',
            title: 'Medical Image Analysis Platform',
            category: 'vision',
            categoryLabel: 'Computer Vision & Real-Time AI',
            description: 'Built a diagnostic imaging AI for radiology achieving 96% accuracy in detecting anomalies across chest X-rays.',
            fullDetails: 'Developed a deep learning platform for automated radiology analysis, capable of detecting pneumonia, nodules, and other anomalies in chest X-rays with heatmap visualizations for explainability.',
            client: 'HealthAI Diagnostics',
            stack: 'Python, PyTorch, ResNet, Grad-CAM, DICOM, Flask',
            impact: '96% accuracy, 3x faster preliminary reads',
            duration: '5 months',
            image: null,
            gradient: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #4f46e5 100%)'
        },
        {
            id: 'proj-5',
            title: 'Predictive Analytics Engine',
            category: 'platforms',
            categoryLabel: 'ML Platforms & Data Products',
            description: 'End-to-end ML platform for demand forecasting, reducing inventory costs by 25% for an e-commerce client.',
            fullDetails: 'Built a comprehensive demand forecasting platform that ingests sales data, market signals, and seasonal patterns to predict product demand 90 days ahead with automated retraining and A/B evaluation.',
            client: 'E-commerce Platform',
            stack: 'Python, XGBoost, Prophet, Airflow, Snowflake, Streamlit',
            impact: '25% inventory cost reduction, 92% forecast accuracy',
            duration: '4 months',
            image: null,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)'
        },
        {
            id: 'proj-6',
            title: 'Real-Time Fraud Detection',
            category: 'platforms',
            categoryLabel: 'ML Platforms & Data Products',
            description: 'Transaction scoring system processing 10K+ events/second with sub-100ms latency for a payments company.',
            fullDetails: 'Built a real-time fraud detection system that scores every transaction in under 100ms using an ensemble of gradient-boosted models and neural networks. Reduced fraud losses by 60% while maintaining low false positives.',
            client: 'Payments Company (NDA)',
            stack: 'Python, XGBoost, Kafka Streams, Flink, Cassandra, AWS',
            impact: '60% fraud reduction, 10K+ TPS at sub-100ms latency',
            duration: '4 months',
            image: null,
            gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)'
        }
    ]
};

// Storage Key
const STORAGE_KEY = 'usama_portfolio_site_data';

// Load or initialize data
function getSiteData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge defaults to ensure backwards compatibility
            return Object.assign({}, DEFAULT_SITE_DATA, parsed);
        }
    } catch (e) {
        console.warn('Could not read localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
}

// Save data
function saveSiteData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Broadcast custom event for cross-tab or same-window sync
        window.dispatchEvent(new CustomEvent('siteDataChanged', { detail: data }));
        return true;
    } catch (e) {
        console.error('Could not save to localStorage:', e);
        return false;
    }
}

// Reset data to defaults
function resetSiteData() {
    localStorage.removeItem(STORAGE_KEY);
    return getSiteData();
}

// Apply theme across any page
function applyTheme(themeName) {
    const validThemes = ['charcoal-orange', 'midnight-blue', 'slate-purple', 'emerald-dark'];
    const selectedTheme = validThemes.includes(themeName) ? themeName : 'charcoal-orange';
    document.documentElement.setAttribute('data-theme', selectedTheme);
    document.body.setAttribute('data-theme', selectedTheme);
}

// Hydrate public pages with stored dynamic data
function hydratePage() {
    const data = getSiteData();
    applyTheme(data.theme);

    // Profile updates
    document.querySelectorAll('[data-bind="profile.name"]').forEach(el => el.textContent = data.profile.name);
    document.querySelectorAll('[data-bind="profile.title"]').forEach(el => el.textContent = data.profile.title);
    document.querySelectorAll('[data-bind="profile.tagline"]').forEach(el => el.textContent = data.profile.tagline);
    
    // Hero Name split
    const heroName = document.querySelector('.hero-name');
    if (heroName && data.profile.firstName) {
        heroName.innerHTML = `<span class="name-line">${data.profile.firstName}</span> <span class="name-line accent">${data.profile.lastName}</span>`;
    }
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && data.profile.title) {
        heroTitle.textContent = data.profile.title;
    }
    const heroTagline = document.querySelector('.hero-tagline');
    if (heroTagline && data.profile.tagline) {
        heroTagline.textContent = data.profile.tagline;
    }

    // Dynamic Stat counters on index.html
    const statCards = document.querySelectorAll('.stat-card .counter');
    if (statCards.length >= 4) {
        if (data.profile.systemsDelivered) statCards[0].dataset.target = data.profile.systemsDelivered;
        if (data.profile.happyClients) statCards[1].dataset.target = data.profile.happyClients;
        if (data.profile.yearsExp) statCards[2].dataset.target = data.profile.yearsExp;
        if (data.profile.avgRating) statCards[3].dataset.target = data.profile.avgRating;
    }

    // Profile photo
    if (data.profile.photo) {
        document.querySelectorAll('#profilePhoto, .hero-photo, .story-photo').forEach(img => {
            img.src = data.profile.photo;
        });
    }

    // Contact details
    document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = `mailto:${data.contact.email}`;
        if (el.querySelector('span')) {
            el.querySelector('span').textContent = data.contact.email;
        } else if (el.textContent.includes('@')) {
            el.textContent = data.contact.email;
        }
    });

    document.querySelectorAll('[data-bind="contact.whatsapp"]').forEach(el => {
        el.textContent = data.contact.whatsapp;
    });

    document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        const raw = (data.contact.whatsappRaw || data.contact.whatsapp).replace(/[^0-9]/g, '');
        el.href = `https://wa.me/${raw}`;
    });

    // Update social links
    if (data.contact.linkedin) {
        document.querySelectorAll('a[aria-label="LinkedIn"], a[aria-label="LinkedIn Profile"]').forEach(a => a.href = data.contact.linkedin);
    }
    if (data.contact.github) {
        document.querySelectorAll('a[aria-label="GitHub"], a[aria-label="GitHub Profile"]').forEach(a => a.href = data.contact.github);
    }

    // ── Dynamic Services Rendering (services.html) ──
    const servicesGrid = document.querySelector('.services-detail-section .services-list');
    if (servicesGrid && data.services && data.services.length) {
        servicesGrid.innerHTML = data.services.map((svc, i) => `
            <div class="service-detail-card reveal-up visible" style="--delay: ${i * 0.1}s">
                <div class="service-card-glow ${i % 2 === 1 ? 'blue-glow' : ''}"></div>
                <div class="service-card-header">
                    <div class="service-header-left">
                        <div class="service-badge-cat ${i % 2 === 1 ? 'blue-cat' : ''}">${svc.category}</div>
                        <div class="service-icon-box ${i % 2 === 1 ? 'icon-blue' : ''}">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>
                        </div>
                    </div>
                    <div class="service-pricing-pill ${i % 2 === 1 ? 'blue-pill' : ''}">
                        <span class="price-prefix">Starting at</span>
                        <span class="price-value">$${svc.price.toLocaleString()}</span>
                        <span class="price-suffix">${svc.priceSuffix || '/ project'}</span>
                    </div>
                </div>
                <div class="service-card-body">
                    <h2 class="service-card-title">${svc.title}</h2>
                    <p class="service-card-description">${svc.description}</p>
                    <div class="service-deliverables">
                        <h4 class="deliverables-heading">Key Capabilities & Deliverables:</h4>
                        <ul class="deliverables-list">
                            ${(svc.deliverables || []).map(d => `
                                <li>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    ${d}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="service-card-footer">
                        <div class="tech-stack-mini">
                            ${(svc.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                        <a href="contact.html?service=${encodeURIComponent(svc.id || svc.title)}" class="btn ${i % 2 === 0 ? 'btn-primary' : 'btn-outline'}">
                            <span>Inquire About This Service</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ── Dynamic Portfolio Rendering (portfolio.html) ──
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (portfolioGrid && data.projects && data.projects.length) {
        portfolioGrid.innerHTML = data.projects.map((proj, i) => `
            <div class="portfolio-card reveal-up visible card-visible" data-category="${proj.category}" data-index="${i}">
                <div class="portfolio-thumb" style="--thumb-gradient: ${proj.gradient || 'linear-gradient(135deg, #ff6b35 0%, #00b4d8 100%)'}">
                    <div class="portfolio-thumb-inner">
                        ${proj.image ? `<img src="${proj.image}" alt="${proj.title}" style="width: 100%; height: 100%; object-fit: cover;">` : `<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`}
                    </div>
                    <div class="portfolio-card-overlay">
                        <button class="portfolio-view-btn" aria-label="View project details">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
                            <span>View Details</span>
                        </button>
                    </div>
                </div>
                <div class="portfolio-card-body">
                    <span class="portfolio-card-cat">${proj.categoryLabel || proj.category}</span>
                    <h3 class="portfolio-card-title">${proj.title}</h3>
                    <p class="portfolio-card-desc">${proj.description}</p>
                </div>
                <div class="lightbox-data" hidden>
                    <h3>${proj.title}</h3>
                    <span class="lb-cat">${proj.categoryLabel || proj.category}</span>
                    <div class="lb-details">
                        <p>${proj.fullDetails || proj.description}</p>
                        <div class="lb-meta">
                            <div class="lb-meta-item"><strong>Client:</strong> ${proj.client || 'Enterprise'}</div>
                            <div class="lb-meta-item"><strong>Stack:</strong> ${proj.stack || 'Python, AI'}</div>
                            <div class="lb-meta-item"><strong>Impact:</strong> ${proj.impact || 'Production Deployed'}</div>
                            <div class="lb-meta-item"><strong>Duration:</strong> ${proj.duration || '3 months'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Re-attach card click listeners if portfolio.js is present
        if (window.initPortfolioListeners) {
            window.initPortfolioListeners();
        }
    }

    // ── Dynamic Awards Rendering (awards.html) ──
    const awardsList = document.querySelector('.awards-section .awards-list');
    if (awardsList && data.awards && data.awards.length) {
        awardsList.innerHTML = data.awards.map((aw, i) => `
            <div class="award-card reveal-up visible" style="--delay: ${i * 0.1}s">
                <div class="award-card-glow ${i % 2 === 1 ? 'blue-glow' : ''}"></div>
                <div class="award-layout">
                    <div class="award-visual">
                        <div class="award-trophy-badge ${i % 2 === 1 ? 'icon-blue' : ''}">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                        </div>
                        <span class="award-year-tag ${i % 2 === 1 ? 'blue-tag' : ''}">${aw.year}</span>
                    </div>
                    <div class="award-main">
                        <div class="award-header-row">
                            <div>
                                <span class="award-issuer">${aw.issuer}</span>
                                <h2 class="award-title">${aw.title}</h2>
                            </div>
                            <span class="award-status-pill ${i % 2 === 1 ? 'blue-pill' : ''}">${aw.statusPill || 'Achievement'}</span>
                        </div>
                        <p class="award-description">${aw.description}</p>
                        <div class="award-highlight-box ${i % 2 === 1 ? 'blue-highlight' : ''}">
                            <div class="highlight-label">Why It Matters:</div>
                            <p class="highlight-text">${aw.whyItMatters}</p>
                        </div>
                        <div class="award-tags">
                            ${(aw.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Auto-run on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    hydratePage();
});

// Sync on cross-window changes
window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
        hydratePage();
    }
});

window.addEventListener('siteDataChanged', () => {
    hydratePage();
});

// Expose globally
window.SiteData = {
    get: getSiteData,
    save: saveSiteData,
    reset: resetSiteData,
    applyTheme: applyTheme,
    hydrate: hydratePage,
    defaults: DEFAULT_SITE_DATA
};
