// ===== تنظیمات =====
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://127.0.0.1:5000'
    : window.location.origin;

function getToken() {
    return localStorage.getItem('admin_token');
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
    };
}

async function api(url, options = {}) {
    const res = await fetch(API_BASE + url, {
        ...options,
        headers: { ...authHeaders(), ...(options.headers || {}) }
    });
    if (res.status === 401) {
        localStorage.removeItem('admin_token');
        window.location.href = 'admin.html';
        return null;
    }
    return res.json();
}

let currentImageData = null;

// ===== شروع =====
async function init() {
    if (!getToken()) {
        window.location.href = 'admin.html';
        return;
    }
    await loadDashboard();
    await loadProductsTable();
    await loadContactInfo();
    await loadServicesPanel();
    await loadTestimonialsPanel();
    await loadHeroPanel();
    await loadAboutPanel();
    await loadTeamPanel();
    await loadAdvantagesPanel();
}

// ===== ناوبری =====
function showPanel(name) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('a').classList.add('active');
    }
}

// ===== داشبورد =====
async function loadDashboard() {
    const stats = await api('/api/admin/stats');
    if (!stats) return;
    document.getElementById('totalProducts').textContent = stats.products || 0;
    document.getElementById('totalServices').textContent = stats.services || 0;
    document.getElementById('totalTestimonials').textContent = stats.testimonials || 0;
    document.getElementById('totalCategories').textContent = stats.categories || 0;

    const products = await api('/api/admin/products');
    if (!products) return;
    const recent = products.slice(0, 3);
    document.getElementById('recentProducts').innerHTML = recent.length > 0
        ? recent.map(p => `
            <div style="display:flex;align-items:center;gap:15px;padding:12px 0;border-bottom:1px solid var(--gray);">
                ${p.image ? `<img src="${p.image}" style="width:45px;height:45px;border-radius:10px;object-fit:cover;">` : `<span style="font-size:1.8rem;">${p.emoji || '📷'}</span>`}
                <div>
                    <div style="font-weight:600;">${p.name}</div>
                    <div style="color:var(--gold);font-size:0.9rem;">${p.price || ''} تومان</div>
                </div>
            </div>
        `).join('')
        : '<p style="color:var(--text-light);">هنوز محصولی اضافه نشده</p>';
}

// ===== محصولات =====
async function loadProductsTable() {
    const products = await api('/api/admin/products');
    if (!products) return;
    const catNames = { camera: 'دوربین', nvr: 'دستگاه ضبط', alarm: 'دزدگیر', smart: 'سیستم هوشمند' };
    const catBadges = { camera: 'badge-blue', nvr: 'badge-gold', alarm: 'badge-blue', smart: 'badge-green' };

    document.getElementById('productsTableBody').innerHTML = products.map(p => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    ${p.image ? `<img src="${p.image}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">` : `<span style="font-size:1.5rem;">${p.emoji || '📷'}</span>`}
                    <div>
                        <div style="font-weight:600;">${p.name}</div>
                        <div style="font-size:0.8rem;color:var(--text-light);">${p.badge || ''}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge ${catBadges[p.category] || 'badge-blue'}">${catNames[p.category] || p.category}</span></td>
            <td style="font-weight:600;">${p.price || ''} تومان</td>
            <td><span class="badge badge-green">فعال</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn action-btn-edit" onclick="editProduct(${p.id})">✏️</button>
                    <button class="action-btn action-btn-delete" onclick="deleteProduct(${p.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { showToast('حجم عکس باید کمتر از ۵۰۰KB باشد', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        currentImageData = e.target.result;
        document.getElementById('imagePreview').innerHTML = `<img src="${currentImageData}" style="width:100%;height:100%;object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
}

function resetImagePreview() {
    currentImageData = null;
    const preview = document.getElementById('imagePreview');
    if (preview) preview.innerHTML = '📷';
}

async function openProductModal(productId = null) {
    document.getElementById('productModal').classList.add('active');
    if (productId) {
        const products = await api('/api/admin/products');
        const p = products.find(x => x.id === productId);
        if (p) {
            document.getElementById('modalTitle').textContent = 'ویرایش محصول';
            document.getElementById('editProductId').value = p.id;
            document.getElementById('prodName').value = p.name;
            document.getElementById('prodCategory').value = p.category;
            document.getElementById('prodDesc').value = p.desc || p.description || '';
            document.getElementById('prodPrice').value = p.price || '';
            document.getElementById('prodEmoji').value = p.emoji || '';
            document.getElementById('prodBadge').value = p.badge || '';
            if (p.image) {
                currentImageData = p.image;
                document.getElementById('imagePreview').innerHTML = `<img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">`;
            } else {
                resetImagePreview();
            }
        }
    } else {
        document.getElementById('modalTitle').textContent = 'افزودن محصول جدید';
        document.getElementById('editProductId').value = '';
        document.getElementById('productForm').reset();
        resetImagePreview();
    }
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    resetImagePreview();
}

document.getElementById('productForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editProductId').value;
    const productData = {
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        desc: document.getElementById('prodDesc').value,
        price: document.getElementById('prodPrice').value,
        image: currentImageData,
        emoji: document.getElementById('prodEmoji').value || '📷',
        badge: document.getElementById('prodBadge').value || 'جدید'
    };

    let result;
    if (editId) {
        result = await api('/api/admin/products/' + editId, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    } else {
        result = await api('/api/admin/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    if (result && result.success) {
        showToast(result.message);
        loadProductsTable();
        loadDashboard();
        closeModal();
    } else {
        showToast(result?.message || 'خطا', 'error');
    }
});

function editProduct(id) { openProductModal(id); }

async function deleteProduct(id) {
    if (!confirm('محصول حذف شود؟')) return;
    const result = await api('/api/admin/products/' + id, { method: 'DELETE' });
    if (result && result.success) {
        showToast(result.message);
        loadProductsTable();
        loadDashboard();
    }
}

// ===== خدمات =====
async function loadServicesPanel() {
    const services = await api('/api/admin/services');
    if (!services) return;
    document.getElementById('servicesTableBody').innerHTML = services.map(s => `
        <tr>
            <td style="font-size:1.5rem;">${s.icon}</td>
            <td style="font-weight:600;">${s.title}</td>
            <td style="max-width:300px;">${s.desc || s.description || ''}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn action-btn-edit" onclick="editService(${s.id})">✏️</button>
                    <button class="action-btn action-btn-delete" onclick="deleteService(${s.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openServiceModal(serviceId = null) {
    document.getElementById('serviceModal').classList.add('active');
    if (serviceId) {
        api('/api/admin/services').then(services => {
            const s = services.find(x => x.id === serviceId);
            if (s) {
                document.getElementById('serviceModalTitle').textContent = 'ویرایش خدمت';
                document.getElementById('editServiceIndex').value = s.id;
                document.getElementById('servIcon').value = s.icon;
                document.getElementById('servTitle').value = s.title;
                document.getElementById('servDesc').value = s.desc || s.description || '';
            }
        });
    } else {
        document.getElementById('serviceModalTitle').textContent = 'افزودن خدمت جدید';
        document.getElementById('editServiceIndex').value = '';
        document.getElementById('serviceForm').reset();
    }
}

document.getElementById('serviceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editServiceIndex').value;
    const data = {
        icon: document.getElementById('servIcon').value || '✅',
        title: document.getElementById('servTitle').value,
        desc: document.getElementById('servDesc').value
    };

    let result;
    if (editId) {
        result = await api('/api/admin/services/' + editId, { method: 'PUT', body: JSON.stringify(data) });
    } else {
        result = await api('/api/admin/services', { method: 'POST', body: JSON.stringify(data) });
    }

    if (result && result.success) {
        showToast(result.message);
        loadServicesPanel();
        document.getElementById('serviceModal').classList.remove('active');
    }
});

function editService(id) { openServiceModal(id); }
async function deleteService(id) {
    if (!confirm('خدمت حذف شود؟')) return;
    const result = await api('/api/admin/services/' + id, { method: 'DELETE' });
    if (result && result.success) {
        showToast(result.message);
        loadServicesPanel();
    }
}

// ===== نظرات =====
async function loadTestimonialsPanel() {
    const items = await api('/api/admin/testimonials');
    if (!items) return;
    document.getElementById('testimonialsTableBody').innerHTML = items.map(t => `
        <tr>
            <td style="font-size:1.3rem;">⭐</td>
            <td>
                <div style="font-weight:600;">${t.name}</div>
                <div style="font-size:0.8rem;color:var(--text-light);">${t.role || ''}</div>
            </td>
            <td style="max-width:300px;font-size:0.9rem;">${(t.text || '').substring(0, 50)}...</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn action-btn-edit" onclick="editTestimonial(${t.id})">✏️</button>
                    <button class="action-btn action-btn-delete" onclick="deleteTestimonial(${t.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openTestimonialModal(id = null) {
    document.getElementById('testimonialModal').classList.add('active');
    if (id) {
        api('/api/admin/testimonials').then(items => {
            const t = items.find(x => x.id === id);
            if (t) {
                document.getElementById('testModalTitle').textContent = 'ویرایش نظر';
                document.getElementById('editTestIndex').value = t.id;
                document.getElementById('testName').value = t.name;
                document.getElementById('testRole').value = t.role || '';
                document.getElementById('testText').value = t.text;
                document.getElementById('testStars').value = t.stars || 5;
            }
        });
    } else {
        document.getElementById('testModalTitle').textContent = 'افزودن نظر جدید';
        document.getElementById('editTestIndex').value = '';
        document.getElementById('testimonialForm').reset();
    }
}

document.getElementById('testimonialForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editTestIndex').value;
    const data = {
        name: document.getElementById('testName').value,
        role: document.getElementById('testRole').value,
        text: document.getElementById('testText').value,
        stars: parseInt(document.getElementById('testStars').value) || 5
    };

    let result;
    if (editId) {
        result = await api('/api/admin/testimonials/' + editId, { method: 'PUT', body: JSON.stringify(data) });
    } else {
        result = await api('/api/admin/testimonials', { method: 'POST', body: JSON.stringify(data) });
    }

    if (result && result.success) {
        showToast(result.message);
        loadTestimonialsPanel();
        document.getElementById('testimonialModal').classList.remove('active');
    }
});

function editTestimonial(id) { openTestimonialModal(id); }
async function deleteTestimonial(id) {
    if (!confirm('نظر حذف شود؟')) return;
    const result = await api('/api/admin/testimonials/' + id, { method: 'DELETE' });
    if (result && result.success) {
        showToast(result.message);
        loadTestimonialsPanel();
    }
}

// ===== بنر اصلی =====
async function loadHeroPanel() {
    const hero = await api('/api/admin/settings/hero');
    if (!hero) return;
    document.getElementById('heroBadge').value = hero.badge || '';
    document.getElementById('heroTitle').value = hero.title || '';
    document.getElementById('heroTitleHighlight').value = hero.titleHighlight || '';
    document.getElementById('heroSubtitle').value = hero.subtitle || '';
    document.getElementById('heroBtn1').value = hero.btn1Text || '';
    document.getElementById('heroBtn2').value = hero.btn2Text || '';
}

async function saveHero() {
    const data = {
        badge: document.getElementById('heroBadge').value,
        title: document.getElementById('heroTitle').value,
        titleHighlight: document.getElementById('heroTitleHighlight').value,
        subtitle: document.getElementById('heroSubtitle').value,
        btn1Text: document.getElementById('heroBtn1').value,
        btn2Text: document.getElementById('heroBtn2').value
    };
    const result = await api('/api/admin/settings/hero', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    if (result && result.success) showToast(result.message);
}

// ===== مزایا =====
async function loadAdvantagesPanel() {
    const advantages = await api('/api/admin/settings/advantages');
    if (!advantages) return;
    document.getElementById('advantagesTableBody').innerHTML = advantages.map((a, i) => `
        <tr>
            <td style="font-weight:700;color:var(--gold);font-size:1.2rem;">${a.number}</td>
            <td style="font-weight:600;">${a.title}</td>
            <td>${a.desc}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn action-btn-edit" onclick="editAdvantage(${i})">✏️</button>
                    <button class="action-btn action-btn-delete" onclick="deleteAdvantage(${i})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    window._advantagesCache = advantages;
}

function openAdvantageModal(index = null) {
    document.getElementById('advantageModal').classList.add('active');
    if (index !== null && window._advantagesCache) {
        const a = window._advantagesCache[index];
        document.getElementById('advModalTitle').textContent = 'ویرایش مزیت';
        document.getElementById('editAdvIndex').value = index;
        document.getElementById('advNumber').value = a.number;
        document.getElementById('advTitle').value = a.title;
        document.getElementById('advDesc').value = a.desc;
    } else {
        document.getElementById('advModalTitle').textContent = 'افزودن مزیت جدید';
        document.getElementById('editAdvIndex').value = '';
        document.getElementById('advantageForm').reset();
    }
}

document.getElementById('advantageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    let advantages = window._advantagesCache || [];
    const editIndex = document.getElementById('editAdvIndex').value;
    const data = {
        number: document.getElementById('advNumber').value,
        title: document.getElementById('advTitle').value,
        desc: document.getElementById('advDesc').value
    };
    if (editIndex !== '') {
        advantages[parseInt(editIndex)] = data;
    } else {
        advantages.push(data);
    }
    const result = await api('/api/admin/settings/advantages', {
        method: 'PUT',
        body: JSON.stringify(advantages)
    });
    if (result && result.success) {
        showToast('مزیت ذخیره شد');
        loadAdvantagesPanel();
        document.getElementById('advantageModal').classList.remove('active');
    }
});

function editAdvantage(i) { openAdvantageModal(i); }
async function deleteAdvantage(i) {
    if (!confirm('مزیت حذف شود؟')) return;
    let advantages = window._advantagesCache || [];
    advantages.splice(i, 1);
    const result = await api('/api/admin/settings/advantages', {
        method: 'PUT',
        body: JSON.stringify(advantages)
    });
    if (result && result.success) {
        showToast('مزیت حذف شد');
        loadAdvantagesPanel();
    }
}

// ===== درباره ما =====
async function loadAboutPanel() {
    const about = await api('/api/admin/settings/about');
    if (!about) return;
    document.getElementById('aboutTitle').value = about.title || '';
    document.getElementById('aboutText1').value = about.text1 || '';
    document.getElementById('aboutText2').value = about.text2 || '';
    document.getElementById('aboutFeatures').value = (about.features || []).join('\n');
}

async function saveAbout() {
    const data = {
        title: document.getElementById('aboutTitle').value,
        text1: document.getElementById('aboutText1').value,
        text2: document.getElementById('aboutText2').value,
        features: document.getElementById('aboutFeatures').value.split('\n').filter(f => f.trim())
    };
    const result = await api('/api/admin/settings/about', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    if (result && result.success) showToast(result.message);
}

// ===== تیم =====
async function loadTeamPanel() {
    const team = await api('/api/admin/team');
    if (!team) return;
    document.getElementById('teamTableBody').innerHTML = team.map(m => `
        <tr>
            <td style="font-size:1.3rem;">👤</td>
            <td style="font-weight:600;">${m.name}</td>
            <td>${m.role}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn action-btn-edit" onclick="editMember(${m.id})">✏️</button>
                    <button class="action-btn action-btn-delete" onclick="deleteMember(${m.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openTeamModal(id = null) {
    document.getElementById('teamModal').classList.add('active');
    if (id) {
        api('/api/admin/team').then(team => {
            const m = team.find(x => x.id === id);
            if (m) {
                document.getElementById('teamModalTitle').textContent = 'ویرایش عضو';
                document.getElementById('editTeamIndex').value = m.id;
                document.getElementById('memberName').value = m.name;
                document.getElementById('memberRole').value = m.role;
            }
        });
    } else {
        document.getElementById('teamModalTitle').textContent = 'افزودن عضو جدید';
        document.getElementById('editTeamIndex').value = '';
        document.getElementById('teamForm').reset();
    }
}

document.getElementById('teamForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const editId = document.getElementById('editTeamIndex').value;
    const data = {
        name: document.getElementById('memberName').value,
        role: document.getElementById('memberRole').value
    };

    let result;
    if (editId) {
        result = await api('/api/admin/team/' + editId, { method: 'PUT', body: JSON.stringify(data) });
    } else {
        result = await api('/api/admin/team', { method: 'POST', body: JSON.stringify(data) });
    }

    if (result && result.success) {
        showToast(result.message);
        loadTeamPanel();
        document.getElementById('teamModal').classList.remove('active');
    }
});

function editMember(id) { openTeamModal(id); }
async function deleteMember(id) {
    if (!confirm('عضو حذف شود؟')) return;
    const result = await api('/api/admin/team/' + id, { method: 'DELETE' });
    if (result && result.success) {
        showToast(result.message);
        loadTeamPanel();
    }
}

// ===== اطلاعات تماس =====
async function loadContactInfo() {
    const contact = await api('/api/admin/contact');
    if (!contact) return;
    Object.keys(contact).forEach(key => {
        const el = document.getElementById(key);
        if (el) el.value = contact[key] || '';
    });
}

async function saveContactInfo() {
    const contact = {};
    ['companyName','phone1','phone2','email1','email2','address','workHours','instagram','telegram','whatsapp','linkedin'].forEach(key => {
        contact[key] = document.getElementById(key)?.value || '';
    });
    const result = await api('/api/admin/contact', {
        method: 'PUT',
        body: JSON.stringify(contact)
    });
    if (result && result.success) showToast(result.message);
}

// ===== تنظیمات =====
async function changePassword() {
    const current = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const result = await api('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: newPass })
    });
    if (result && result.success) {
        showToast(result.message);
        document.getElementById('currentPass').value = '';
        document.getElementById('newPass').value = '';
    } else {
        showToast(result?.message || 'خطا', 'error');
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = 'admin.html';
}

// ===== Toast =====
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = (type === 'success' ? '✓ ' : '✕ ') + msg;
    toast.style.background = type === 'success' ? '#39ff14' : '#ef4444';
    toast.style.color = type === 'success' ? '#0a0a0a' : 'white';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// شروع
init();
