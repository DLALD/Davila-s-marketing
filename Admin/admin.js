// =============================================
// DAVILA'S MARKETING — Admin Panel JS
// =============================================

const STORAGE_KEY = 'davilas_businesses';

function getBusinesses() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveBusinesses(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

// ── TABS ──
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

function resetTabs() {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.tab-panel').forEach((p, i) => p.classList.toggle('active', i === 0));
}

// ── CHAR COUNTER ──
const descEl = document.getElementById('bizDescription');
const countEl = document.getElementById('descCount');
descEl.addEventListener('input', () => {
  const n = descEl.value.length;
  countEl.textContent = `${n} / 160`;
  countEl.classList.toggle('warn', n > 160);
});

// ── HERO IMAGE PREVIEW ──
document.getElementById('bizHeroImage').addEventListener('input', function () {
  const preview = document.getElementById('heroPreview');
  preview.innerHTML = this.value
    ? `<img src="${this.value}" alt="Hero preview" onerror="this.parentElement.innerHTML='<p style=color:#e53e3e;font-size:.8rem>Invalid image URL</p>'" />`
    : '';
});

// ── GALLERY ──
let galleryUrls = [];

function renderGalleryPreview() {
  document.getElementById('galleryPreview').innerHTML = galleryUrls.map((url, i) => `
    <div class="gallery-thumb">
      <img src="${url}" alt="Gallery ${i + 1}" onerror="this.src=''" />
      <button class="gallery-thumb-remove" onclick="removeGalleryImg(${i})">✕</button>
    </div>`).join('');
  document.getElementById('bizGallery').value = JSON.stringify(galleryUrls);
}

window.removeGalleryImg = (i) => { galleryUrls.splice(i, 1); renderGalleryPreview(); };

document.getElementById('btnAddGallery').addEventListener('click', () => {
  const input = document.getElementById('galleryUrlInput');
  const url = input.value.trim();
  if (url) { galleryUrls.push(url); input.value = ''; renderGalleryPreview(); }
});
document.getElementById('galleryUrlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btnAddGallery').click(); }
});

// ── SERVICE TAGS ──
let serviceTags = [];

function renderServiceTags() {
  document.getElementById('servicesTags').innerHTML = serviceTags.map((s, i) => `
    <span class="service-tag">${s} <button onclick="removeTag(${i})">✕</button></span>`).join('');
  document.getElementById('bizServices').value = JSON.stringify(serviceTags);
}

window.removeTag = (i) => { serviceTags.splice(i, 1); renderServiceTags(); };

function addServiceTag() {
  const input = document.getElementById('serviceInput');
  const val = input.value.trim();
  if (val && !serviceTags.includes(val)) { serviceTags.push(val); input.value = ''; renderServiceTags(); }
}
document.getElementById('btnAddService').addEventListener('click', addServiceTag);
document.getElementById('serviceInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); addServiceTag(); }
});

// ── REVIEWS ──
let reviews = [];

function renderReviews() {
  document.getElementById('reviewsList').innerHTML = reviews.map((r, i) => `
    <div class="review-item">
      <input type="text" value="${r.name}" placeholder="Reviewer name" onchange="reviews[${i}].name=this.value;syncReviews()" />
      <select onchange="reviews[${i}].stars=+this.value;syncReviews()">
        ${[5,4,3,2,1].map(n => `<option value="${n}" ${r.stars===n?'selected':''}>${'★'.repeat(n)} ${n} star${n>1?'s':''}</option>`).join('')}
      </select>
      <button class="btn-remove-review" onclick="removeReview(${i})">✕</button>
      <div class="review-text-row">
        <input type="text" value="${r.text}" placeholder="Review text..." onchange="reviews[${i}].text=this.value;syncReviews()" />
      </div>
    </div>`).join('');
  syncReviews();
}

function syncReviews() { document.getElementById('bizReviews').value = JSON.stringify(reviews); }
window.removeReview = (i) => { reviews.splice(i, 1); renderReviews(); };

document.getElementById('btnAddReview').addEventListener('click', () => {
  reviews.push({ name: '', stars: 5, text: '' });
  renderReviews();
});

// ── CATEGORY: show custom input when "Other" ──
document.getElementById('bizCategory').addEventListener('change', function () {
  document.getElementById('bizCategoryCustom').style.display = this.value === 'Other' ? 'block' : 'none';
});

// ── RENDER BUSINESS LIST ──
function renderList() {
  const list = getBusinesses();
  const container = document.getElementById('businessesList');
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><span>🏢</span>No businesses yet. Click "+ Add Business" to get started.</div>`;
    return;
  }
  container.innerHTML = list.map((b, i) => `
    <div class="biz-admin-card">
      ${b.heroImage
        ? `<img class="biz-admin-card-img" src="${b.heroImage}" alt="${b.name}" onerror="this.style.display='none'" />`
        : `<div class="biz-admin-card-img-placeholder">🏢</div>`}
      <div class="biz-admin-card-body">
        <span class="tag">${b.category}</span>
        <h3>${b.name}</h3>
        <p>${b.description}</p>
        <div class="biz-admin-card-actions">
          <button class="btn-edit" onclick="openEdit(${i})">✏️ Edit</button>
          <a class="btn-view" href="../negocios/${slugify(b.name)}/index.html" target="_blank">🔗</a>
          <button class="btn-delete" onclick="deleteBusiness(${i})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

// ── OPEN / CLOSE MODAL ──
function openAdd() {
  document.getElementById('modalTitle').textContent = 'Add Business';
  document.getElementById('bizForm').reset();
  document.getElementById('bizIndex').value = -1;
  document.getElementById('bizCategoryCustom').style.display = 'none';
  document.getElementById('heroPreview').innerHTML = '';
  galleryUrls = []; renderGalleryPreview();
  serviceTags = []; renderServiceTags();
  reviews = []; renderReviews();
  resetTabs();
  document.getElementById('modalOverlay').classList.add('open');
}

window.openEdit = (i) => {
  const b = getBusinesses()[i];
  document.getElementById('modalTitle').textContent = 'Edit Business';
  document.getElementById('bizIndex').value = i;
  document.getElementById('bizName').value           = b.name             || '';
  document.getElementById('bizDescription').value    = b.description      || '';
  document.getElementById('bizDescriptionFull').value= b.descriptionFull  || '';
  document.getElementById('bizPhone').value          = b.phone            || '';
  document.getElementById('bizEmail').value          = b.email            || '';
  document.getElementById('bizAddress').value        = b.address          || '';
  document.getElementById('bizHours').value          = b.hours            || '';
  document.getElementById('bizWebsite').value        = b.website          || '';
  document.getElementById('bizFacebook').value       = b.facebook         || '';
  document.getElementById('bizInstagram').value      = b.instagram        || '';
  document.getElementById('bizWhatsapp').value       = b.whatsapp         || '';
  document.getElementById('bizTiktok').value         = b.tiktok           || '';
  document.getElementById('bizHeroImage').value      = b.heroImage        || '';
  document.getElementById('bizCategoryCustom').style.display = 'none';

  // Category
  const catSelect = document.getElementById('bizCategory');
  const knownCats = Array.from(catSelect.options).map(o => o.value);
  if (knownCats.includes(b.category)) {
    catSelect.value = b.category;
  } else {
    catSelect.value = 'Other';
    document.getElementById('bizCategoryCustom').value = b.category;
    document.getElementById('bizCategoryCustom').style.display = 'block';
  }

  // Status
  document.querySelectorAll('input[name="bizStatus"]').forEach(r => { r.checked = r.value === (b.status || 'active'); });

  // Hero preview
  document.getElementById('heroPreview').innerHTML = b.heroImage
    ? `<img src="${b.heroImage}" alt="Hero preview" />` : '';

  // Gallery
  galleryUrls = b.gallery || []; renderGalleryPreview();

  // Services
  serviceTags = b.services || []; renderServiceTags();

  // Reviews
  reviews = b.reviews ? JSON.parse(JSON.stringify(b.reviews)) : []; renderReviews();

  // Char count
  countEl.textContent = `${b.description?.length || 0} / 160`;

  resetTabs();
  document.getElementById('modalOverlay').classList.add('open');
};

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// ── SAVE ──
document.getElementById('bizForm').addEventListener('submit', e => {
  e.preventDefault();
  const list  = getBusinesses();
  const index = parseInt(document.getElementById('bizIndex').value);
  const catSelect = document.getElementById('bizCategory');
  const category = catSelect.value === 'Other'
    ? document.getElementById('bizCategoryCustom').value.trim()
    : catSelect.value;

  const biz = {
    name:            document.getElementById('bizName').value.trim(),
    category,
    description:     document.getElementById('bizDescription').value.trim(),
    descriptionFull: document.getElementById('bizDescriptionFull').value.trim(),
    phone:           document.getElementById('bizPhone').value.trim(),
    email:           document.getElementById('bizEmail').value.trim(),
    address:         document.getElementById('bizAddress').value.trim(),
    hours:           document.getElementById('bizHours').value.trim(),
    website:         document.getElementById('bizWebsite').value.trim(),
    facebook:        document.getElementById('bizFacebook').value.trim(),
    instagram:       document.getElementById('bizInstagram').value.trim(),
    whatsapp:        document.getElementById('bizWhatsapp').value.trim(),
    tiktok:          document.getElementById('bizTiktok').value.trim(),
    heroImage:       document.getElementById('bizHeroImage').value.trim(),
    gallery:         galleryUrls,
    services:        serviceTags,
    reviews:         reviews,
    status:          document.querySelector('input[name="bizStatus"]:checked')?.value || 'active',
    date:            index === -1
      ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : (list[index]?.date || ''),
  };

  if (index === -1) { list.push(biz); } else { list[index] = biz; }
  saveBusinesses(list);
  closeModal();
  renderList();
  showToast(index === -1 ? '✓ Business added' : '✓ Business updated');
});

// ── DELETE ──
window.deleteBusiness = (i) => {
  if (!confirm('Delete this business?')) return;
  const list = getBusinesses();
  list.splice(i, 1);
  saveBusinesses(list);
  renderList();
  showToast('Business deleted');
};

// ── UTILS ──
function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── EVENTS ──
document.getElementById('btnAdd').addEventListener('click', openAdd);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ── INIT ──
renderList();
