/**
 * K. Prasanth | Portfolio Main Script
 * Handles navigation, theme interactions, Firebase sync, modal lightbox, and project ideas view.
 */

'use strict';

let firebaseDb = null;

function initFirebase() {
    if (typeof firebase !== 'undefined' && window.ENV?.FIREBASE_CONFIG) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(window.ENV.FIREBASE_CONFIG);
            }
            firebaseDb = firebase.firestore();
            console.log("🔥 Firebase Firestore Initialized Successfully!");
        } catch (e) {
            console.warn("Firebase initialization warning:", e);
        }
    }
}

// Initialize App
async function initApp() {
    initFirebase();

    // Fetch dynamic projects, blogs, certificates, and project guides
    if (typeof syncProjects === "function") syncProjects();
    if (typeof syncBlogs === "function") syncBlogs();
    if (typeof syncCertificates === "function") syncCertificates();
    if (typeof loadProjectIdeas === "function") loadProjectIdeas();

    // Set up real-time subscription channels
    if (typeof setupRealtimeChannels === "function") setupRealtimeChannels();
}

// Run dynamic app initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    setupUIEventListeners();
    applySiteProfile();
    attachRevealClasses();
    setTimeout(triggerReveal, 120);
});

// Apply customized site profile settings from localStorage / Admin panel
function applySiteProfile() {
    try {
        const saved = localStorage.getItem('portfolio_site_profile');
        if (!saved) return;
        const profile = JSON.parse(saved);

        if (profile.name) {
            const nameEl = document.querySelector('[data-profile-name]');
            if (nameEl) {
                nameEl.textContent = profile.name;
                nameEl.setAttribute('title', profile.name);
            }
        }
        if (profile.title) {
            const titleEl = document.querySelector('[data-profile-title]');
            if (titleEl) titleEl.textContent = profile.title;
        }
        if (profile.avatar) {
            const avatarEl = document.querySelector('[data-profile-avatar]');
            if (avatarEl) avatarEl.src = profile.avatar;
        }
        if (profile.email) {
            const emailEl = document.querySelector('[data-profile-email]');
            if (emailEl) {
                emailEl.textContent = profile.email;
                emailEl.setAttribute('href', 'mailto:' + profile.email);
            }
        }
        if (profile.phone) {
            const phoneEl = document.querySelector('[data-profile-phone]');
            if (phoneEl) {
                phoneEl.textContent = profile.phone;
                phoneEl.setAttribute('href', 'tel:' + profile.phone.replace(/\s+/g, ''));
            }
        }
        if (profile.github) {
            const ghEl = document.querySelector('[data-profile-github]');
            if (ghEl) ghEl.setAttribute('href', profile.github);
        }
        if (profile.linkedin) {
            const liEl = document.querySelector('[data-profile-linkedin]');
            if (liEl) liEl.setAttribute('href', profile.linkedin);
        }
        if (profile.instagram) {
            const igEl = document.querySelector('[data-profile-instagram]');
            if (igEl) igEl.setAttribute('href', profile.instagram);
        }
        if (profile.about) {
            const aboutEl = document.querySelector('.about-text > p');
            if (aboutEl) aboutEl.textContent = profile.about;
        }
    } catch (e) {
        console.error("Error applying site profile:", e);
    }
}

// UI Event Listeners & Navigation Toggle Logic
function setupUIEventListeners() {
    const elementToggleFunc = function (elem) { if (elem) elem.classList.toggle("active"); };

    const sidebar = document.querySelector("[data-sidebar]");
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn && sidebar) {
        sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
    }

    // Custom select variables
    const select = document.querySelector("[data-select]");
    const selectItems = document.querySelectorAll("[data-select-item]");
    const selectValue = document.querySelector("[data-select-value]");
    const filterBtn = document.querySelectorAll("[data-filter-btn]");

    if (select) {
        select.addEventListener("click", function () { elementToggleFunc(this); });
    }

    for (let i = 0; i < selectItems.length; i++) {
        selectItems[i].addEventListener("click", function () {
            let selectedValue = this.innerText.toLowerCase();
            if (selectValue) selectValue.innerText = this.innerText;
            elementToggleFunc(select);
            filterFunc(selectedValue);
        });
    }

    const filterFunc = function (selectedValue) {
        const currentFilterItems = document.querySelectorAll("[data-filter-item]");
        for (let i = 0; i < currentFilterItems.length; i++) {
            if (selectedValue === "all") { currentFilterItems[i].classList.add("active"); }
            else if (selectedValue === currentFilterItems[i].dataset.category.toLowerCase()) { currentFilterItems[i].classList.add("active"); }
            else { currentFilterItems[i].classList.remove("active"); }
        }
    };

    let lastClickedBtn = filterBtn[0];
    for (let i = 0; i < filterBtn.length; i++) {
        filterBtn[i].addEventListener("click", function () {
            let selectedValue = this.innerText.toLowerCase();
            if (selectValue) selectValue.innerText = this.innerText;
            filterFunc(selectedValue);
            if (lastClickedBtn) lastClickedBtn.classList.remove("active");
            this.classList.add("active");
            lastClickedBtn = this;
        });
    }

    // Contact Form Handler
    const contactForm = document.getElementById("contactForm");
    const successBox = document.getElementById("form-success");
    const errorBox = document.getElementById("form-error");
    const errorText = document.getElementById("form-error-text");
    const submitBtn = document.getElementById("submitBtn");
    const btnIcon = document.getElementById("btn-icon");
    const btnText = document.getElementById("btn-text");
    const formInputs = document.querySelectorAll("[data-form-input]");

    for (let i = 0; i < formInputs.length; i++) {
        formInputs[i].addEventListener("input", function () {
            if (contactForm && contactForm.checkValidity()) {
                if (submitBtn) submitBtn.removeAttribute("disabled");
            } else {
                if (submitBtn) submitBtn.setAttribute("disabled", "");
            }
        });
    }

    if (contactForm) {
        contactForm.addEventListener("submit", async function (e) {
            e.preventDefault();

            const name = document.getElementById("input-name").value.trim();
            const email = document.getElementById("input-email").value.trim();
            const message = document.getElementById("input-message").value.trim();

            if (successBox) successBox.style.display = "none";
            if (errorBox) errorBox.style.display = "none";

            if (submitBtn) submitBtn.disabled = true;
            if (btnIcon) btnIcon.className = "fas fa-spinner fa-spin";
            if (btnText) btnText.textContent = "Sending...";

            let sentToFirebase = false;

            // 1. Try sending to Firebase Firestore if client is ready
            if (firebaseDb) {
                try {
                    await firebaseDb.collection("messages").add({
                        name: name,
                        fullname: name,
                        email: email,
                        message: message,
                        created_at: new Date().toISOString()
                    });
                    sentToFirebase = true;
                } catch (err) {
                    console.warn("Firebase fetch failed, falling back to Local Storage:", err);
                }
            }

            // 3. Always show success confirmation to user
            if (successBox) successBox.style.display = "flex";
            contactForm.reset();
            if (submitBtn) submitBtn.setAttribute("disabled", "");

            if (btnIcon) btnIcon.className = "fas fa-paper-plane";
            if (btnText) btnText.textContent = "Send Message";
            if (submitBtn) submitBtn.disabled = false;
        });
    }

    // Page navigation
    const navigationLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");

    navigationLinks.forEach((link) => {
        link.addEventListener("click", function () {
            const rawText = (this.textContent || this.innerText || "").trim();
            const targetKey = rawText.toLowerCase().replace(/[\s\-_]+/g, "");

            pages.forEach((page) => {
                const pageKey = (page.dataset.page || "").toLowerCase().replace(/[\s\-_]+/g, "");
                if (targetKey === pageKey) {
                    page.classList.add("active");
                } else {
                    page.classList.remove("active");
                }
            });

            navigationLinks.forEach((navBtn) => {
                if (navBtn === this) {
                    navBtn.classList.add("active");
                } else {
                    navBtn.classList.remove("active");
                }
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(triggerReveal, 80);

            if (targetKey.includes("resume")) {
                skillBarsAnimated = false;
                document.querySelectorAll(".skill-progress-fill").forEach(bar => {
                    bar.style.width = "0px";
                });
                setTimeout(animateSkillBars, 300);
            }
            if (targetKey.includes("blog")) {
                if (typeof syncBlogs === "function") syncBlogs();
            }
            if (targetKey === "projects" || targetKey === "project" || targetKey.includes("portfolio")) {
                if (typeof syncProjects === "function") syncProjects();
            }
            if (targetKey.includes("guide") || targetKey.includes("idea")) {
                closePiPost();
                loadProjectIdeas();
            }
        });
    });

    // Lightbox backdrop click & escape key
    const lb = document.getElementById("cert-lightbox");
    if (lb) {
        lb.addEventListener("click", (e) => { if (e.target === lb) closeCertLightbox(); });
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCertLightbox();
});

/* ============================================
   SKILL BAR ANIMATION
   ============================================ */
let skillBarsAnimated = false;
function animateSkillBars() {
    if (skillBarsAnimated) return;
    skillBarsAnimated = true;
    document.querySelectorAll(".skill-progress-fill").forEach(bar => {
        const target = bar.dataset.width || bar.style.width;
        if (target) {
            requestAnimationFrame(() => {
                setTimeout(() => { bar.style.width = target; }, 50);
            });
        }
    });
}

// Observe the skills section to trigger bar fill when scrolled into view
const skillSection = document.querySelector(".skill");
if (skillSection) {
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateSkillBars();
                skillObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    skillObserver.observe(skillSection);
}

/* ============================================
   ATTACH REVEAL CLASSES TO KEY ELEMENTS
   ============================================ */
function attachRevealClasses() {
    document.querySelectorAll(".about-text p").forEach((el, i) => {
        el.classList.add("reveal");
        el.style.transitionDelay = (i * 0.1) + "s";
    });

    const serviceList = document.querySelector(".service-list");
    if (serviceList) serviceList.classList.add("reveal-stagger");
    document.querySelectorAll(".service-item").forEach(el => {
        el.classList.add("reveal", "reveal-scale");
    });

    document.querySelectorAll(".timeline-item").forEach((el, i) => {
        el.classList.add("reveal", "reveal-left");
        el.style.transitionDelay = (i * 0.08) + "s";
    });

    document.querySelectorAll(".skills-title").forEach(el => el.classList.add("reveal"));

    document.querySelectorAll(".skills-item").forEach((el, i) => {
        el.classList.add("reveal");
        el.style.transitionDelay = (i * 0.12) + "s";
    });

    document.querySelectorAll(".project-item").forEach((el, i) => {
        el.classList.add("reveal", "reveal-scale");
        el.style.transitionDelay = (i * 0.07) + "s";
    });

    document.querySelectorAll(".blog-post-item").forEach((el, i) => {
        el.classList.add("reveal");
        el.style.transitionDelay = (i * 0.1) + "s";
    });

    document.querySelectorAll(".contact-form").forEach(el => el.classList.add("reveal"));

    document.querySelectorAll(".article-title").forEach(el => el.classList.add("reveal"));

    document.querySelectorAll(".timeline .title-wrapper").forEach(el => el.classList.add("reveal", "reveal-left"));

    document.querySelectorAll(".cert-card.static-certificate").forEach((el, i) => {
        el.classList.add("reveal", "reveal-scale");
        el.style.transitionDelay = (i * 0.1) + "s";
    });
}

/* ============================================
   SCROLL REVEAL — IntersectionObserver
   ============================================ */
function triggerReveal() {
    const revealEls = document.querySelectorAll(".reveal:not(.visible)");
    if (!revealEls.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));
}

/* ══════════════════════════════════════
   DIRECT FIREBASE FIRESTORE SYNC FOR PROJECTS, BLOGS & CERTS
══════════════════════════════════════ */

function sortItemsByNewest(items) {
    if (!Array.isArray(items)) return [];
    return items.sort((a, b) => {
        const getTs = (x) => {
            if (!x) return 0;
            if (x.created_at) return new Date(x.created_at).getTime();
            if (x.date) return new Date(x.date).getTime();
            if (x.id && typeof x.id === 'string' && x.id.includes('_')) {
                const parts = x.id.split('_');
                const last = parseInt(parts[parts.length - 1]);
                if (!isNaN(last) && last > 1000000000) return last;
            }
            return 0;
        };
        return getTs(b) - getTs(a); // Newest first
    });
}

async function fetchFirestoreCollection(primaryKey, fallbackKey) {
    if (!firebaseDb) return [];
    try {
        let snap = await firebaseDb.collection(primaryKey).get();
        if (snap.empty && fallbackKey) {
            snap = await firebaseDb.collection(fallbackKey).get();
        }
        if (!snap.empty) {
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
    } catch (e) {
        console.warn(`Firestore fetch error for ${primaryKey}:`, e);
        if (fallbackKey) {
            try {
                let snap2 = await firebaseDb.collection(fallbackKey).get();
                if (!snap2.empty) {
                    return snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                }
            } catch (err2) {}
        }
    }
    return [];
}

async function syncProjects() {
    let data = await fetchFirestoreCollection('portfolio_projects', 'projects');

    window.allProjects = data;

    document.querySelectorAll(".dynamic-project").forEach(el => el.remove());
    
    const projectList = document.querySelector(".project-list");
    if (!projectList) return;

    if (data.length === 0) {
        data = [
            {
                id: 'proj_default_1',
                title: 'Helparea',
                category: 'Web development',
                link: 'https://helparea.vercel.app/',
                image: 'helparea.png',
                created_at: '2026-02-21T00:00:00.000Z',
                blocks: [
                    { type: 'title', level: 'h2', content: 'Helparea' },
                    { type: 'highlight', color: 'blue', style: 'glow', content: '🌐 Web Development Project' },
                    { type: 'text', content: 'Comprehensive platform for local service discovery and community assistance.' },
                    { type: 'custom_button', text: 'Visit Live Site', url: 'https://helparea.vercel.app/', style: 'blue', icon: 'fa-external-link-alt' }
                ]
            },
            {
                id: 'proj_default_2',
                title: 'AvenoraHub',
                category: 'Web development',
                link: 'https://rathinaminnovation.com/avenorahub/index.php',
                image: 'campuslink.png',
                created_at: '2026-02-15T00:00:00.000Z',
                blocks: [
                    { type: 'title', level: 'h2', content: 'AvenoraHub' },
                    { type: 'highlight', color: 'purple', style: 'badge', content: '🎓 Campus Innovation Portal' },
                    { type: 'text', content: 'Innovation and campus event management platform for students and educators.' },
                    { type: 'custom_button', text: 'Visit AvenoraHub', url: 'https://rathinaminnovation.com/avenorahub/index.php', style: 'purple', icon: 'fa-rocket' }
                ]
            },
            {
                id: 'proj_default_3',
                title: 'QR Code Generator',
                category: 'Applications',
                link: 'https://prasanth781007.github.io/qrcode/',
                image: 'Screenshot 2026-02-21 124805.png',
                created_at: '2026-02-10T00:00:00.000Z',
                blocks: [
                    { type: 'title', level: 'h2', content: 'QR Code Generator' },
                    { type: 'highlight', color: 'green', style: 'pill', content: '⚡ Web Application' },
                    { type: 'text', content: 'Instant QR code generation utility with customizable colors, logos, and download options.' },
                    { type: 'custom_button', text: 'Launch Generator', url: 'https://prasanth781007.github.io/qrcode/', style: 'green', icon: 'fa-play' }
                ]
            },
            {
                id: 'proj_default_4',
                title: 'VOLTERA\'26 Symposium',
                category: 'Web development',
                link: 'https://prasanth781007.github.io/GTEC-ECE-VOLTERA-26-Symposium/',
                image: 'Screenshot 2026-02-21 124934.png',
                created_at: '2026-02-05T00:00:00.000Z',
                blocks: [
                    { type: 'title', level: 'h2', content: 'VOLTERA\'26 Symposium' },
                    { type: 'highlight', color: 'orange', style: 'marker', content: '⚡ National Level Symposium Website' },
                    { type: 'text', content: 'Official website for GTEC ECE VOLTERA\'26 National Level Technical Symposium.' },
                    { type: 'custom_button', text: 'View Symposium Site', url: 'https://prasanth781007.github.io/GTEC-ECE-VOLTERA-26-Symposium/', style: 'gradient', icon: 'fa-star' }
                ]
            }
        ];
    }
    
    // Sort newest first
    data = sortItemsByNewest(data);

    data.forEach((item, index) => {
        const projectItem = document.createElement("li");
        projectItem.className = "project-item active reveal reveal-scale dynamic-project";
        projectItem.dataset.filterItem = "";
        projectItem.dataset.category = (item.category || "").toLowerCase();
        projectItem.style.transitionDelay = (index * 0.07) + "s";
        projectItem.style.cursor = "pointer";
        
        const imageUrl = item.image || getProjectPlaceholderImage(item.category);

        const firstTextBlock = (item.blocks || []).find(b => b.type === 'text' || b.type === 'highlight');
        const descText = firstTextBlock ? firstTextBlock.content : (item.text || item.category || '');
        
        projectItem.innerHTML = `
            <div onclick="openCmsModal('project', '${item.id}')">
                <figure class="project-img">
                    <div class="project-item-icon-box"><i class="fas fa-eye"></i></div>
                    <img src="${imageUrl}" alt="${escHtml(item.title)}" loading="lazy">
                </figure>
                <h3 class="project-title">${escHtml(item.title)}</h3>
                <p class="project-category">${escHtml(descText.slice(0, 50) + (descText.length > 50 ? '…' : ''))}</p>
            </div>
        `;
        projectList.appendChild(projectItem);
    });

    setTimeout(triggerReveal, 100);
}

async function syncBlogs() {
    let data = await fetchFirestoreCollection('portfolio_blogs', 'blogs');

    window.allBlogs = data;

    document.querySelectorAll(".dynamic-blog").forEach(el => el.remove());

    const blogPostsList = document.querySelector(".blog-posts-list");
    if (!blogPostsList) return;

    if (data.length === 0) {
        data = [
            {
                id: 'blog_default_1',
                title: 'From Hesitation to Confidence! 🚀',
                category: 'Personal Growth',
                image: 'placementtraningblog.jpg',
                text: 'I recently completed a transformative communication skills training program at my college, led by the amazing trainer Wasim Rehman from Smart Training Company. From someone who never spoke on stage, I now confidently spoke four times! 🎉',
                created_at: '2026-02-16T00:00:00.000Z'
            },
            {
                id: 'blog_default_2',
                title: 'Building Modern Web Applications with HTML, CSS & JavaScript 💻',
                category: 'Web Development',
                image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop',
                text: 'A deep dive into creating clean, high-performance web applications using vanilla web technologies, modern responsive layouts, smooth micro-animations, and offline storage.',
                created_at: '2026-02-10T00:00:00.000Z'
            }
        ];
    }

    // Sort newest first
    data = sortItemsByNewest(data);

    data.forEach((item, index) => {
        const blogItem = document.createElement("li");
        blogItem.className = "blog-post-item reveal dynamic-blog";
        blogItem.style.transitionDelay = (index * 0.1) + "s";
        blogItem.style.cursor = "pointer";
        
        const imgBlock = (item.blocks || []).find(b => b.type === 'image');
        const imageUrl = item.image ? item.image : (imgBlock && imgBlock.url ? imgBlock.url : getBlogPlaceholderImage(item.category));

        const firstTextBlock = (item.blocks || []).find(b => b.type === 'text' || b.type === 'highlight');
        const descText = firstTextBlock ? firstTextBlock.content : (item.text || item.description || '');
        
        const dateStr = item.created_at 
            ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
            : (item.date || 'Recent');

        blogItem.innerHTML = `
            <div onclick="openCmsModal('blog', '${item.id}')">
                <figure class="blog-banner-box">
                    <img src="${imageUrl}" alt="${escHtml(item.title)}" loading="lazy">
                </figure>
                <div class="blog-content">
                    <div class="blog-meta">
                        <p class="blog-category">${escHtml(item.category || 'Blog')}</p>
                        <span class="dot"></span>
                        <time datetime="${item.created_at || ''}">${dateStr}</time>
                    </div>
                    <h3 class="h3 blog-item-title">${escHtml(item.title)}</h3>
                    <p class="blog-text">${escHtml(descText.slice(0, 100) + (descText.length > 100 ? '…' : ''))}</p>
                </div>
            </div>
        `;
        blogPostsList.appendChild(blogItem);
    });
    
    setTimeout(triggerReveal, 100);
}

async function syncCertificates() {
    let data = await fetchFirestoreCollection('portfolio_certificates', 'certificates');

    window.allCertificates = data;

    document.querySelectorAll(".dynamic-certificate").forEach(el => el.remove());

    const grid = document.getElementById("cert-cards-grid");
    if (!grid) return;

    const staticCerts = document.querySelectorAll(".static-certificate");
    if (data && data.length > 0) {
        staticCerts.forEach(el => el.style.display = "none");
    } else {
        staticCerts.forEach(el => el.style.display = "block");
    }

    data = sortItemsByNewest(data);

    data.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "cert-card dynamic-certificate reveal reveal-scale";
        card.style.transitionDelay = (index * 0.1) + "s";
        card.style.cursor = "pointer";

        const safeTitle = escHtml(item.title);
        const safeIssuer = escHtml(item.issuer || "Verified Certificate");

        const firstTextBlock = (item.blocks || []).find(b => b.type === 'text' || b.type === 'highlight');
        const safeDesc = escHtml(firstTextBlock ? firstTextBlock.content : (item.description || ""));
        
        const imgBlock = (item.blocks || []).find(b => b.type === 'image');
        const safeImg = item.image ? escHtml(item.image) : (imgBlock ? escHtml(imgBlock.url) : "");

        const imgSection = safeImg
            ? `<div class="cert-card-img-wrap">
                   <img src="${safeImg}" alt="${safeTitle}" loading="lazy">
                   <div class="cert-card-overlay">
                       <span class="cert-card-overlay-text"><i class="fas fa-expand"></i> View Certificate</span>
                   </div>
               </div>`
            : `<div class="cert-card-img-wrap">
                   <div class="cert-card-img-placeholder"><i class="fas fa-certificate"></i></div>
               </div>`;

        card.innerHTML = `
            ${imgSection}
            <div class="cert-card-body">
                <div class="cert-card-title">${safeTitle}</div>
                <div class="cert-card-issuer">${safeIssuer}</div>
                <div class="cert-card-desc">${safeDesc.slice(0, 80)}${safeDesc.length > 80 ? '…' : ''}</div>
                <div class="cert-badge"><i class="fas fa-award"></i> Verified</div>
            </div>
        `;

        card.addEventListener("click", () => {
            openCmsModal('certificate', item.id);
        });

        grid.appendChild(card);
    });

    setTimeout(triggerReveal, 100);
}

/* ══════════════════════════════════════
   UNIVERSAL DYNAMIC READER MODAL FOR BLOGS, PROJECTS, CERTS & IDEAS
══════════════════════════════════════ */
async function openCmsModal(type, id) {
    const keyMap = {
        blog: 'portfolio_blogs',
        project: 'portfolio_projects',
        certificate: 'portfolio_certificates',
        idea: 'project_ideas'
    };
    const storageKey = keyMap[type] || 'project_ideas';
    let item = null;

    if (type === 'blog' && window.allBlogs) item = window.allBlogs.find(x => String(x.id) === String(id));
    else if (type === 'project' && window.allProjects) item = window.allProjects.find(x => String(x.id) === String(id));
    else if (type === 'certificate' && window.allCertificates) item = window.allCertificates.find(x => String(x.id) === String(id));
    else if (type === 'idea' && window.allIdeas) item = window.allIdeas.find(x => String(x.id) === String(id));

    if (!item && firebaseDb) {
        try {
            const snap = await firebaseDb.collection(storageKey).doc(String(id)).get();
            if (snap.exists) {
                item = { id: snap.id, ...snap.data() };
            }
        } catch (e) {
            console.warn("Error fetching item from Firebase:", e);
        }
    }

    if (!item) return;

    const modal = document.getElementById('cms-reader-modal');
    const content = document.getElementById('cms-reader-content');
    const typeLabel = document.getElementById('cms-reader-type');

    const typeTitles = {
        blog: '📝 Blog Post',
        project: '🚀 Project Showcase',
        certificate: '📜 Certificate',
        idea: '💡 Project Guide'
    };

    if (typeLabel) typeLabel.textContent = typeTitles[type] || 'Dynamic Post';

    let blocks = item.blocks || [];
    if (blocks.length === 0) {
        blocks = [];
        if (item.title) blocks.push({ type: 'title', level: 'h2', content: item.title });
        if (item.image) blocks.push({ type: 'image', url: item.image });
        if (item.text || item.description) blocks.push({ type: 'text', content: item.text || item.description });
        if (item.link) blocks.push({ type: 'custom_button', text: 'Open Link', url: item.link, style: 'purple', icon: 'fa-external-link-alt' });
    }

    if (content) {
        content.innerHTML = blocks.map(b => renderPiBlock(b)).join('');
    }

    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeCmsModal() {
    const modal = document.getElementById('cms-reader-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function openCertLightbox(imgSrc, title, issuer, desc) {
    const lb = document.getElementById("cert-lightbox");
    const lbImg = document.getElementById("cert-lightbox-img");

    if (imgSrc) {
        lbImg.src = imgSrc;
        lbImg.style.display = "block";
    } else {
        lbImg.style.display = "none";
    }

    document.getElementById("cert-lightbox-title").textContent = title || "";
    document.getElementById("cert-lightbox-issuer").textContent = issuer || "";
    document.getElementById("cert-lightbox-desc").textContent = desc || "";

    if (lb) lb.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeCertLightbox() {
    const lb = document.getElementById("cert-lightbox");
    if (lb) lb.classList.remove("open");
    document.body.style.overflow = "";
}

function setupRealtimeChannels() {
    if (!firebaseDb) return;

    try {
        firebaseDb.collection('projects').onSnapshot(() => {
            if (typeof syncProjects === "function") syncProjects();
        }, e => console.warn("Firebase projects listener notice:", e));

        firebaseDb.collection('blogs').onSnapshot(() => {
            if (typeof syncBlogs === "function") syncBlogs();
        }, e => console.warn("Firebase blogs listener notice:", e));

        firebaseDb.collection('certificates').onSnapshot(() => {
            if (typeof syncCertificates === "function") syncCertificates();
        }, e => console.warn("Firebase certs listener notice:", e));
    } catch (err) {
        console.warn("Realtime listener error:", err);
    }
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getProjectPlaceholderImage(category) {
    const cat = String(category).toLowerCase();
    if (cat.includes("design")) {
        return "https://images.unsplash.com/photo-1541462608143-67571c6738dd?q=80&w=600&auto=format&fit=crop";
    }
    if (cat.includes("app")) {
        return "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop";
}

function getBlogPlaceholderImage(category) {
    const cat = String(category).toLowerCase();
    if (cat.includes("dev") || cat.includes("tech")) {
        return "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop";
    }
    if (cat.includes("design") || cat.includes("art")) {
        return "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=600&auto=format&fit=crop";
    }
    return "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop";
}

/* ══════════════════════════════════════
   PROJECT IDEAS — PUBLIC VIEW
══════════════════════════════════════ */

let currentPiFilter = 'all';

function filterPiCategory(btn, cat) {
    document.querySelectorAll('.pi-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    currentPiFilter = cat;
    loadProjectIdeas();
}

async function loadProjectIdeas() {
    let posts = await fetchFirestoreCollection('project_ideas', 'ideas');
    window.allIdeas = posts;

    const grid = document.getElementById('pi-posts-grid');
    if (!grid) return;

    if (posts.length === 0) {
        posts = [{
            id: 'pi_default_1',
            title: '🚀 Smart Portfolio Notion CMS & Page Builder',
            created_at: new Date().toISOString(),
            image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop',
            blocks: [
                { type: 'title', level: 'h2', content: 'Smart Portfolio Notion CMS' },
                { type: 'highlight', color: 'purple', style: 'glow', content: '✨ High-performance web application built with HTML5, Vanilla CSS, and Firebase Firestore.' },
                { type: 'step', steps: [
                    { title: '1. Designing Notion Block Builder', desc: 'Custom block-by-block editor supporting text highlights, step cards, custom buttons, code snippets, and Cloudinary uploads.' },
                    { title: '2. Firebase Database Sync', desc: 'Direct cloud storage sync with real-time Firestore collection listeners.' }
                ]},
                { type: 'custom_button', text: 'View Project Details', url: '#', style: 'purple', icon: 'fa-rocket', align: 'left', target: '_self' }
            ]
        }];
    }

    posts = sortItemsByNewest(posts);

    const query = (document.getElementById('pi-search-input')?.value || '').toLowerCase().trim();

    if (query) {
        posts = posts.filter(post => {
            const titleMatch = (post.title || '').toLowerCase().includes(query);
            const blockMatch = (post.blocks || []).some(b => {
                if (b.content && String(b.content).toLowerCase().includes(query)) return true;
                if (b.text && String(b.text).toLowerCase().includes(query)) return true;
                if (b.url && String(b.url).toLowerCase().includes(query)) return true;
                if (b.steps && Array.isArray(b.steps)) {
                    return b.steps.some(s => (s.title || '').toLowerCase().includes(query) || (s.desc || s.description || '').toLowerCase().includes(query));
                }
                if (b.connections && Array.isArray(b.connections)) {
                    return b.connections.some(c => (c.from || '').toLowerCase().includes(query) || (c.to || '').toLowerCase().includes(query) || (c.note || '').toLowerCase().includes(query));
                }
                return false;
            });
            return titleMatch || blockMatch;
        });
    }

    if (currentPiFilter !== 'all') {
        posts = posts.filter(post => {
            return (post.blocks || []).some(b => {
                if (currentPiFilter === 'link') return b.type === 'link' || b.type === 'custom_button';
                return b.type === currentPiFilter;
            });
        });
    }

    if (posts.length === 0) {
        grid.innerHTML = `
            <div class="pi-empty-state">
                <i class="fas fa-search"></i>
                <p>${query || currentPiFilter !== 'all' ? 'No project guides match your search or filter.' : 'No project guides published yet. Check back soon!'}</p>
            </div>`;
        return;
    }

    grid.innerHTML = posts.map(post => {
        const date = new Date(post.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const cnt = (post.blocks || []).length;
        const imgBlock = (post.blocks || []).find(b => b.type === 'image' && b.url);
        const thumb = post.image ? post.image : (imgBlock ? imgBlock.url : null);
        const textBlock = (post.blocks || []).find(b => (b.type === 'text' || b.type === 'highlight') && b.content);
        const previewText = textBlock ? textBlock.content : '';
        const preview = previewText ? previewText.slice(0, 100) + (previewText.length > 100 ? '…' : '') : '';
        const safeId = String(post.id).replace(/'/g, "\\'");

        return `<div class="pi-card" onclick="openPiPost('${safeId}')" role="button" tabindex="0">
            ${thumb ? `<div class="pi-card-thumb"><img src="${escHtml(thumb)}" alt="${escHtml(post.title)}"></div>` : `<div class="pi-card-thumb pi-card-thumb--placeholder"><i class="fas fa-lightbulb"></i></div>`}
            <div class="pi-card-body">
                <h3 class="pi-card-title">${escHtml(post.title)}</h3>
                ${preview ? `<p class="pi-card-preview">${escHtml(preview)}</p>` : ''}
                <div class="pi-card-meta">
                    <span><i class="fas fa-calendar-alt"></i> ${date}</span>
                    <span><i class="fas fa-cubes"></i> ${cnt} block${cnt !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function openPiPost(id) {
    let post = (window.allIdeas || []).find(p => String(p.id) === String(id));
    if (!post && firebaseDb) {
        try {
            let snap = await firebaseDb.collection('project_ideas').doc(String(id)).get();
            if (!snap.exists) snap = await firebaseDb.collection('ideas').doc(String(id)).get();
            if (snap.exists) post = { id: snap.id, ...snap.data() };
        } catch (e) {}
    }
    if (!post) return;

    const content = document.getElementById('pi-post-content');
    if (content) {
        content.innerHTML = (post.blocks || []).map(block => renderPiBlock(block)).join('');
    }

    const listView = document.getElementById('pi-list-view');
    const postView = document.getElementById('pi-post-view');
    if (listView) listView.style.display = 'none';
    if (postView) postView.style.display = 'block';

    const piPage = document.querySelector('[data-page="project-ideas"]');
    if (piPage) piPage.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closePiPost() {
    const listView = document.getElementById('pi-list-view');
    const postView = document.getElementById('pi-post-view');
    if (listView) listView.style.display = 'block';
    if (postView) postView.style.display = 'none';
}

function renderPiBlock(block) {
    if (block.type === 'title') {
        const tag = ['h1','h2','h3','h4'].includes(block.level) ? block.level : 'h2';
        const sizeMap = { h1: '1.8rem', h2: '1.4rem', h3: '1.15rem', h4: '1rem' };
        const sz = sizeMap[tag];
        return `<${tag} class="pi-block-title" style="font-size:${sz};">${escHtml(block.content)}</${tag}>`;
    }

    if (block.type === 'text') {
        const paras = (block.content || '').split(/\n{2,}/).filter(p => p.trim());
        if (paras.length === 0) return '';
        return paras.map(p => {
            let html = escHtml(p);
            html = html.replace(/==(.*?)==/g, '<mark class="pi-inline-mark">$1</mark>');
            html = html.replace(/&lt;mark&gt;(.*?)&lt;\/mark&gt;/gi, '<mark class="pi-inline-mark">$1</mark>');
            return `<p class="pi-block-text">${html.replace(/\n/g, '<br>')}</p>`;
        }).join('');
    }

    if (block.type === 'highlight') {
        const col = block.color || 'yellow';
        const st = block.style || 'marker';
        const rawContent = block.content || '';
        if (!rawContent) return '';
        let contentHtml = escHtml(rawContent);
        contentHtml = contentHtml.replace(/==(.*?)==/g, '<mark class="pi-inline-mark">$1</mark>');
        contentHtml = contentHtml.replace(/&lt;mark&gt;(.*?)&lt;\/mark&gt;/gi, '<mark class="pi-inline-mark">$1</mark>');

        return `<div class="pi-block-highlight pi-highlight--${col} pi-highlight-style--${st}">
            <span class="pi-highlight-icon"><i class="fas fa-highlighter"></i></span>
            <div class="pi-highlight-text">${contentHtml.replace(/\n/g, '<br>')}</div>
        </div>`;
    }

    if (block.type === 'step') {
        const steps = block.steps || [];
        if (steps.length === 0 && block.content) {
            steps.push({ title: 'Step 1', desc: block.content });
        }
        if (steps.length === 0) return '';

        return `<div class="pi-block-steps">
            <div class="pi-steps-list">
                ${steps.map((s, i) => `
                    <div class="pi-step-card">
                        <div class="pi-step-badge">${i + 1}</div>
                        <div class="pi-step-body">
                            <h4 class="pi-step-title">${escHtml(s.title || `Step ${i + 1}`)}</h4>
                            ${(s.desc || s.description) ? `<p class="pi-step-desc">${escHtml(s.desc || s.description).replace(/\n/g, '<br>')}</p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    if (block.type === 'custom_button') {
        const text = escHtml(block.text || 'Open Link');
        const url = escHtml(block.url || '#');
        const st = block.style || 'purple';
        const icon = escHtml(block.icon || 'fa-external-link-alt');
        const align = block.align || 'left';
        const target = block.target || '_blank';

        return `<div class="pi-block-button-wrapper pi-btn-align--${align}">
            <a href="${url}" target="${target}" rel="noopener noreferrer" class="pi-custom-btn pi-btn-theme--${st}">
                <i class="fas ${icon}"></i>
                <span>${text}</span>
            </a>
        </div>`;
    }

    if (block.type === 'code') {
        const lang = escHtml(block.lang || 'javascript');
        const codeId = 'picode_' + Math.random().toString(36).slice(2, 8);

        const sampleCode = `// 💡 Code snippet example
const name = "K. Prasanth";
console.log("Hello, " + name + "! Welcome to my Portfolio.");`;

        const codeText = block.content && block.content.trim() ? block.content : sampleCode;

        return `<div class="pi-block-code">
            <div class="pi-code-topbar">
                <span class="pi-code-lang"><i class="fas fa-code"></i> ${lang}</span>
                <div>
                    <button class="pi-copy-btn" onclick="copyPiCode('${codeId}')"><i class="fas fa-copy"></i> Copy Code</button>
                </div>
            </div>
            <textarea id="${codeId}" class="pi-code-textarea" spellcheck="false" placeholder="// Write code here…" onkeydown="handleCodeTabKey(event, this)" oninput="autoResizeTA(this)">${escHtml(codeText)}</textarea>
        </div>`;
    }

    if (block.type === 'image' && block.url) {
        return `<figure class="pi-block-image">
            <img src="${escHtml(block.url)}" alt="Project idea image" loading="lazy">
        </figure>`;
    }

    if (block.type === 'link' && block.url) {
        return `<div class="pi-block-link">
            <a href="${escHtml(block.url)}" target="_blank" rel="noopener noreferrer" class="pi-link-chip">
                <i class="fas fa-external-link-alt"></i>
                ${escHtml(block.text || block.url)}
            </a>
        </div>`;
    }

    if (block.type === 'callout') {
        const st = block.style || 'info';
        const iconMap = { info: 'fa-circle-info', tip: 'fa-lightbulb', warning: 'fa-triangle-exclamation' };
        const colorMap = {
            info: { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#60a5fa', icon: 'fa-circle-info' },
            tip: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#34d399', icon: 'fa-lightbulb' },
            warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#fbbf24', icon: 'fa-triangle-exclamation' }
        };
        const c = colorMap[st] || colorMap.info;
        return `<div style="background:${c.bg};border-left:4px solid ${c.border};border-radius:12px;padding:14px 18px;margin:16px 0;display:flex;gap:12px;align-items:flex-start;">
            <i class="fas ${c.icon}" style="color:${c.border};font-size:1.2rem;margin-top:2px;"></i>
            <div style="font-size:0.9rem;line-height:1.6;color:var(--white-2);">${escHtml(block.content || '')}</div>
        </div>`;
    }

    if (block.type === 'list') {
        const items = (block.content || '').split('\n').filter(x => x.trim());
        if (items.length === 0) return '';
        return `<ul style="list-style:none;padding:0;margin:16px 0;">
            ${items.map(item => `<li style="display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:0.92rem;color:var(--white-2);"><i class="fas fa-check-circle" style="color:#a855f7;font-size:0.85rem;"></i> ${escHtml(item)}</li>`).join('')}
        </ul>`;
    }

    if (block.type === 'tags') {
        const tags = (block.content || '').split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length === 0) return '';
        return `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0;">
            ${tags.map(tag => `<span style="padding:4px 12px;border-radius:20px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.3);color:#c084fc;font-size:0.78rem;font-weight:600;"><i class="fas fa-tag"></i> ${escHtml(tag)}</span>`).join('')}
        </div>`;
    }

    if (block.type === 'video' && block.url) {
        let embedUrl = block.url;
        if (embedUrl.includes('youtube.com/watch?v=')) {
            embedUrl = embedUrl.replace('youtube.com/watch?v=', 'youtube.com/embed/');
        } else if (embedUrl.includes('youtu.be/')) {
            embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
        }
        return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:16px;margin:16px 0;box-shadow:0 8px 24px rgba(0,0,0,0.2);">
            <iframe src="${escHtml(embedUrl)}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
        </div>`;
    }

    if (block.type === 'wiring') {
        const conns = block.connections || [];
        const title = escHtml(block.title || 'Hardware Wiring Connections');

        const rowsHtml = conns.map((c, i) => {
            return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);transition:background 0.2s ease;">
                    <td style="padding:12px 16px;font-weight:600;color:var(--white-1, #ffffff);font-size:0.88rem;">
                        <span style="padding:5px 12px;border-radius:8px;background:rgba(168, 85, 247, 0.1);border:1px solid rgba(168, 85, 247, 0.25);display:inline-flex;align-items:center;gap:8px;color:#e9d5ff;">
                            <i class="fas fa-microchip" style="color:#c084fc;font-size:0.8rem;"></i>
                            ${escHtml(c.from || '')}
                        </span>
                    </td>
                    <td style="padding:12px 10px;text-align:center;">
                        <span style="color:#a855f7;font-weight:700;font-size:0.95rem;display:inline-flex;align-items:center;gap:4px;">
                            <span style="height:2px;width:14px;background:#a855f7;display:inline-block;border-radius:2px;"></span>
                            ⚡➔
                        </span>
                    </td>
                    <td style="padding:12px 16px;font-weight:600;color:var(--white-1, #ffffff);font-size:0.88rem;">
                        <span style="padding:5px 12px;border-radius:8px;background:rgba(56, 189, 248, 0.1);border:1px solid rgba(56, 189, 248, 0.25);display:inline-flex;align-items:center;gap:8px;color:#bae6fd;">
                            <i class="fas fa-cube" style="color:#38bdf8;font-size:0.8rem;"></i>
                            ${escHtml(c.to || '')}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div style="background:rgba(15, 23, 42, 0.65);border:1px solid rgba(168, 85, 247, 0.35);border-radius:16px;padding:20px;margin:20px 0;box-shadow:0 8px 32px rgba(0,0,0,0.3);overflow:hidden;backdrop-filter:blur(10px);">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(168, 85, 247, 0.25);">
                    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg, #a855f7, #7c3aed);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;box-shadow:0 4px 14px rgba(168, 85, 247, 0.4);">
                        <i class="fas fa-plug-circle-bolt"></i>
                    </div>
                    <h3 style="font-size:1.1rem;font-weight:700;color:var(--white-1, #ffffff);margin:0;">${title}</h3>
                </div>
                ${conns.length > 0 ? `
                    <div style="overflow-x:auto;">
                        <table style="width:100%;border-collapse:collapse;text-align:left;">
                            <thead>
                                <tr style="border-bottom:2px solid rgba(168, 85, 247, 0.3);background:rgba(255,255,255,0.03);">
                                    <th style="padding:10px 16px;font-size:0.78rem;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:0.5px;">From Pin / Component</th>
                                    <th style="padding:10px 10px;text-align:center;font-size:0.78rem;font-weight:700;color:#c084fc;">Connection</th>
                                    <th style="padding:10px 16px;font-size:0.78rem;font-weight:700;color:#c084fc;text-transform:uppercase;letter-spacing:0.5px;">To Pin / Component</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                ` : `<p style="font-size:0.85rem;color:var(--text-muted);font-style:italic;">No wiring connections added yet.</p>`}
            </div>
        `;
    }

    if (block.type === 'divider') {
        return `<hr style="border:none;border-top:1px dashed rgba(168, 85, 247, 0.3);margin:24px 0;">`;
    }

    return '';
}

function handleCodeTabKey(e, textarea) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
}

function autoResizeTA(ta) {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = (ta.scrollHeight) + 'px';
}

function runPiCode(codeId) {
    const el = document.getElementById(codeId);
    const outputEl = document.getElementById('output_' + codeId);
    if (!el || !outputEl) return;

    outputEl.style.display = 'block';
    outputEl.textContent = 'Running code...';

    const code = el.value || el.innerText || '';
    let logs = [];
    const originalLog = console.log;
    console.log = function(...args) {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        originalLog.apply(console, args);
    };

    try {
        const result = new Function(code)();
        console.log = originalLog;
        let outText = logs.length ? logs.join('\n') : '';
        if (result !== undefined) outText += (outText ? '\n▶ Returned: ' : '▶ Returned: ') + String(result);
        outputEl.textContent = outText || '✅ Executed successfully with no console output.';
        outputEl.style.color = '#34d399';
    } catch (err) {
        console.log = originalLog;
        outputEl.textContent = '❌ Execution Error: ' + err.message;
        outputEl.style.color = '#f87171';
    }
}

function copyPiCode(codeId) {
    const el = document.getElementById(codeId);
    if (!el) return;
    const textToCopy = el.value || el.innerText || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = el.closest('.pi-block-code')?.querySelector('.pi-copy-btn');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => { btn.innerHTML = orig; }, 1800);
        }
    });
}
