// ===== بارگذاری محتوا از API بک‌اند =====
(function () {
    // آدرس بک‌اند - موقع دیپلوی این رو تغییر بده
    const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? 'http://127.0.0.1:5000'
        : window.location.origin;

    async function fetchJSON(url) {
        try {
            const res = await fetch(API_BASE + url);
            if (!res.ok) throw new Error('Network error');
            return await res.json();
        } catch (e) {
            console.warn('API error:', url, e);
            return null;
        }
    }

    async function loadAll() {
        const [settings, services, testimonials, team, contact, products] = await Promise.all([
            fetchJSON('/api/settings'),
            fetchJSON('/api/services'),
            fetchJSON('/api/testimonials'),
            fetchJSON('/api/team'),
            fetchJSON('/api/contact'),
            fetchJSON('/api/products')
        ]);

        // ===== بنر اصلی =====
        if (settings && settings.hero) {
            const hero = settings.hero;
            const heroBadge = document.querySelector('.hero-badge');
            const heroTitle = document.querySelector('.hero-title');
            const heroSubtitle = document.querySelector('.hero-subtitle');
            if (heroBadge) heroBadge.innerHTML = hero.badge || '';
            if (heroTitle) heroTitle.innerHTML = (hero.title || '') + ' <span>' + (hero.titleHighlight || '') + '</span>';
            if (heroSubtitle) heroSubtitle.textContent = hero.subtitle || '';

            const heroBtns = document.querySelectorAll('.hero-buttons .btn');
            if (heroBtns[0] && hero.btn1Text) heroBtns[0].innerHTML = hero.btn1Text + ' <span>←</span>';
            if (heroBtns[1] && hero.btn2Text) heroBtns[1].textContent = hero.btn2Text;
        }

        // ===== مزایا =====
        if (settings && settings.advantages) {
            const advCards = document.querySelectorAll('.advantage-card');
            settings.advantages.forEach((a, i) => {
                if (advCards[i]) {
                    const num = advCards[i].querySelector('.advantage-number');
                    const title = advCards[i].querySelector('.advantage-title');
                    const desc = advCards[i].querySelector('.advantage-desc');
                    if (num) {
                        num.textContent = a.number;
                        num.setAttribute('data-target', a.number.replace(/[^\d]/g, '') || a.number);
                    }
                    if (title) title.textContent = a.title;
                    if (desc) desc.textContent = a.desc;
                }
            });
        }

        // ===== خدمات =====
        const servicesGrid = document.querySelector('.services-grid');
        if (servicesGrid && services && services.length > 0) {
            servicesGrid.innerHTML = services.map((s, i) => `
                <div class="service-card reveal" style="transition-delay: ${(i * 0.1) + 0.1}s;">
                    <div class="service-icon">${s.icon || '🔧'}</div>
                    <h3 class="service-title">${s.title}</h3>
                    <p class="service-desc">${s.desc || s.description || ''}</p>
                </div>
            `).join('');
        }

        // ===== نظرات =====
        const testGrid = document.querySelector('.testimonials-grid');
        if (testGrid && testimonials && testimonials.length > 0) {
            const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);
            testGrid.innerHTML = testimonials.map((t, i) => `
                <div class="testimonial-card reveal" style="transition-delay: ${(i * 0.1) + 0.1}s;">
                    <div class="testimonial-stars">${stars(t.stars || 5)}</div>
                    <p class="testimonial-text">"${t.text}"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">${t.initial || (t.name ? t.name[0] : '؟')}</div>
                        <div>
                            <div class="author-name">${t.name}</div>
                            <div class="author-role">${t.role || ''}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // ===== درباره ما =====
        if (settings && settings.about) {
            const about = settings.about;
            const aboutTitle = document.querySelector('.about-content .section-title');
            const aboutTexts = document.querySelectorAll('.about-text');
            const aboutFeatures = document.querySelector('.about-features');
            if (aboutTitle) aboutTitle.textContent = about.title || '';
            if (aboutTexts[0]) aboutTexts[0].textContent = about.text1 || '';
            if (aboutTexts[1]) aboutTexts[1].textContent = about.text2 || '';
            if (aboutFeatures && about.features) {
                aboutFeatures.innerHTML = about.features.map(f => `
                    <div class="about-feature">
                        <div class="about-feature-icon">✅</div>
                        <span class="about-feature-text">${f}</span>
                    </div>
                `).join('');
            }
        }

        // ===== تیم =====
        const teamGrid = document.querySelector('.team-grid');
        if (teamGrid && team && team.length > 0) {
            teamGrid.innerHTML = team.map((m, i) => `
                <div class="team-card reveal" style="transition-delay: ${(i * 0.1) + 0.1}s;">
                    <div class="team-avatar">${m.initial || (m.name ? m.name[0] : '👤')}</div>
                    <h3 class="team-name">${m.name}</h3>
                    <div class="team-role">${m.role}</div>
                </div>
            `).join('');
        }

        // ===== اطلاعات تماس در فوتر =====
        if (contact) {
            document.querySelectorAll('.footer-contact-item span:last-child').forEach(el => {
                const text = el.textContent.trim();
                if ((text.includes('۰۲۱') || text.includes('021') || text.includes('تلفن')) && contact.phone1) el.textContent = contact.phone1;
                else if ((text.includes('۰۹۱۲') || text.includes('0912')) && contact.phone2) el.textContent = contact.phone2;
                else if (text.includes('@') && contact.email1) el.textContent = contact.email1;
                else if ((text.includes('ولیعصر') || text.includes('تهران') || text.includes('آدرس')) && contact.address) el.textContent = contact.address;
            });
        }

        // ===== CTA =====
        if (settings && settings.cta) {
            const cta = settings.cta;
            const ctaTitle = document.querySelector('.cta-title');
            const ctaDesc = document.querySelector('.cta-desc');
            if (ctaTitle) ctaTitle.textContent = cta.title || '';
            if (ctaDesc) ctaDesc.textContent = cta.desc || '';
        }

        // ===== محصولات صفحه اصلی =====
        const homeProductsGrid = document.getElementById('homeProductsGrid');
        if (homeProductsGrid && products && products.length > 0) {
            const CATEGORY_NAMES = { camera: 'دوربین', nvr: 'دستگاه ضبط', alarm: 'دزدگیر', smart: 'سیستم هوشمند' };
            const BG_COLORS = {
                camera: 'linear-gradient(135deg, #1a365d, #2a4a7f)',
                nvr: 'linear-gradient(135deg, #0f1b2d, #1a365d)',
                alarm: 'linear-gradient(135deg, #7c2d12, #dc2626)',
                smart: 'linear-gradient(135deg, #065f46, #10b981)'
            };
            const limited = products.slice(0, 6);
            homeProductsGrid.innerHTML = limited.map((p, i) => `
                <div class="product-card reveal" data-category="${p.category}" style="transition-delay: ${(i * 0.05) + 0.1}s;">
                    <div class="product-image" style="background: ${BG_COLORS[p.category] || BG_COLORS.camera};">
                        <span class="product-badge">${p.badge || 'جدید'}</span>
                        ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">` : (p.emoji || '📷')}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${CATEGORY_NAMES[p.category] || p.category}</div>
                        <h3 class="product-name">${p.name}</h3>
                        <p class="product-desc">${p.desc || p.description || ''}</p>
                        <div class="product-footer">
                            <div class="product-price">${p.price || ''} <small>تومان</small></div>
                            <a href="contact.html" class="btn btn-primary btn-small">سفارش</a>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // ===== محصولات صفحه محصولات =====
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid && products && products.length > 0) {
            const CATEGORY_NAMES = { camera: 'دوربین', nvr: 'دستگاه ضبط', alarm: 'دزدگیر', smart: 'سیستم هوشمند' };
            const BG_COLORS = {
                camera: 'linear-gradient(135deg, #1a365d, #2a4a7f)',
                nvr: 'linear-gradient(135deg, #0f1b2d, #1a365d)',
                alarm: 'linear-gradient(135deg, #7c2d12, #dc2626)',
                smart: 'linear-gradient(135deg, #065f46, #10b981)'
            };
            productsGrid.innerHTML = products.map((p, i) => `
                <div class="product-card reveal" data-category="${p.category}" style="transition-delay: ${(i * 0.05) + 0.1}s;">
                    <div class="product-image" style="background: ${BG_COLORS[p.category] || BG_COLORS.camera};">
                        <span class="product-badge">${p.badge || 'جدید'}</span>
                        ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">` : (p.emoji || '📷')}
                    </div>
                    <div class="product-info">
                        <div class="product-category">${CATEGORY_NAMES[p.category] || p.category}</div>
                        <h3 class="product-name">${p.name}</h3>
                        <p class="product-desc">${p.desc || p.description || ''}</p>
                        <div class="product-footer">
                            <div class="product-price">${p.price || ''} <small>تومان</small></div>
                            <a href="contact.html" class="btn btn-primary btn-small">سفارش</a>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Re-init scroll animations
        setTimeout(() => {
            document.querySelectorAll('.reveal, .reveal-right, .reveal-left, .reveal-scale').forEach(el => {
                const windowHeight = window.innerHeight;
                const elementTop = el.getBoundingClientRect().top;
                if (elementTop < windowHeight - 120) el.classList.add('active');
            });
        }, 200);
    }

    // اجرا بعد از لود صفحه
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAll);
    } else {
        loadAll();
    }
})();
