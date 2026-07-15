// =============================================
// DAVILA'S MARKETING — Admin Panel JS (Supabase)
// =============================================
import { supabase } from './supabase-client.js';

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
const descEl  = document.getElementById('bizDescription');
const countEl = document.getElementById('descCount');
descEl.addEventListener('input', () => {
  const n = descEl.value.length;
  countEl.textContent = `${n} / 160`;
  countEl.classList.toggle('warn', n > 160);
});

// ── HERO IMAGE UPLOAD ──
document.getElementById('bizHeroFile').addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;
  const preview = document.getElementById('heroPreview');
  preview.innerHTML = '<p style="color:#aaa;font-size:.8rem">Uploading...</p>';
  const url = await uploadImage(file);
  if (url) {
    document.getElementById('bizHeroImage').value = url;
    preview.innerHTML = `<img src="${url}" alt="Hero preview" />`;
  } else {
    preview.innerHTML = '<p style="color:#e53e3e;font-size:.8rem">Upload failed</p>';
  }
});

async function compressImage(file) {
  const enabled = document.getElementById('compressEnabled')?.checked ?? true;
  if (!enabled) return file;
  const maxW    = parseInt(document.getElementById('compressMaxW')?.value    || 1400, 10);
  const quality = parseInt(document.getElementById('compressQuality')?.value || 82,   10) / 100;
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width  * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadImage(file) {
  const blob = await compressImage(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { data, error } = await supabase
    .storage.from('negocios-imagenes')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) { console.error(error); return null; }
  const { data: { publicUrl } } = supabase.storage.from('negocios-imagenes').getPublicUrl(path);
  return publicUrl;
}

document.getElementById('compressMaxW')?.addEventListener('input', e => {
  document.getElementById('compressMaxWVal').textContent = e.target.value + 'px';
});
document.getElementById('compressQuality')?.addEventListener('input', e => {
  document.getElementById('compressQualityVal').textContent = e.target.value + '%';
});

// ── GALLERY UPLOAD ──
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

document.getElementById('btnAddGallery').addEventListener('click', async () => {
  const files = document.getElementById('galleryFileInput').files;
  if (!files.length) return;
  document.getElementById('btnAddGallery').textContent = 'Uploading...';
  for (const file of files) {
    const url = await uploadImage(file);
    if (url) galleryUrls.push(url);
  }
  document.getElementById('galleryFileInput').value = '';
  document.getElementById('btnAddGallery').textContent = 'Upload';
  renderGalleryPreview();
});

// ── SERVICE TAGS ──
let serviceTags = [];
let selectedServiceIcon = '🔧';

// Icon picker toggle
document.getElementById('serviceIconBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('serviceIconDropdown').classList.toggle('hidden');
});
document.getElementById('serviceIconDropdown').addEventListener('click', (e) => {
  const icon = e.target.dataset.icon;
  if (!icon) return;
  selectedServiceIcon = icon;
  document.getElementById('serviceIconBtn').textContent = icon;
  document.getElementById('serviceIconDropdown').classList.add('hidden');
});
document.addEventListener('click', () => {
  document.getElementById('serviceIconDropdown')?.classList.add('hidden');
});

function renderServiceTags() {
  document.getElementById('servicesTags').innerHTML = serviceTags.map((s, i) => {
    const icon = typeof s === 'object' ? s.icon : '✓';
    const name = typeof s === 'object' ? s.name : s;
    return `<span class="service-tag">${icon} ${name} <button onclick="removeTag(${i})">✕</button></span>`;
  }).join('');
  document.getElementById('bizServices').value = JSON.stringify(serviceTags);
}

window.removeTag = (i) => { serviceTags.splice(i, 1); renderServiceTags(); };

function addServiceTag() {
  const input = document.getElementById('serviceInput');
  const val = input.value.trim();
  if (!val) return;
  serviceTags.push({ icon: selectedServiceIcon, name: val });
  input.value = '';
  renderServiceTags();
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

// Hero height inputs behavior
const heroDesktopInput = document.getElementById('bizHeroHeightDesktop');
const heroMobileInput  = document.getElementById('bizHeroHeightMobile');
const heroWidthDesktopInput = document.getElementById('bizHeroWidthDesktop');
const heroWidthMobileInput  = document.getElementById('bizHeroWidthMobile');
const heroZoomInput         = document.getElementById('bizHeroZoom');

function getHeroSettings() {
  return {
    desktop:      parseInt(heroDesktopInput?.value || 620, 10),
    mobile:       parseInt(heroMobileInput?.value  || 360, 10),
    widthDesktop: parseInt(heroWidthDesktopInput?.value || 100, 10),
    widthMobile:  parseInt(heroWidthMobileInput?.value  || 100, 10),
    zoom:         parseInt(heroZoomInput?.value || 100, 10),
    fit:          document.getElementById('bizHeroFit')?.value || 'cover',
  };
}
function syncHeroSettings() {
  document.getElementById('bizHeroSettings').value = JSON.stringify(getHeroSettings());
}

if (heroDesktopInput) {
  heroDesktopInput.addEventListener('input', e => {
    document.getElementById('heroHeightDesktopVal').textContent = e.target.value + 'px';
    syncHeroSettings();
  });
}
if (heroMobileInput) {
  heroMobileInput.addEventListener('input', e => {
    document.getElementById('heroHeightMobileVal').textContent = e.target.value + 'px';
    syncHeroSettings();
  });
}
if (heroWidthDesktopInput) {
  heroWidthDesktopInput.addEventListener('input', e => {
    document.getElementById('heroWidthDesktopVal').textContent = e.target.value + '%';
    syncHeroSettings();
  });
}
if (heroWidthMobileInput) {
  heroWidthMobileInput.addEventListener('input', e => {
    document.getElementById('heroWidthMobileVal').textContent = e.target.value + '%';
    syncHeroSettings();
  });
}
if (heroZoomInput) {
  heroZoomInput.addEventListener('input', e => {
    document.getElementById('heroZoomVal').textContent = e.target.value + '%';
    syncHeroSettings();
  });
}
document.getElementById('bizHeroFit')?.addEventListener('change', syncHeroSettings);

// ── SOCIAL NETWORKS (dynamic) ──
const SOCIAL_OPTIONS = [
  { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/...', logo: '../logos/facebook.png' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...', logo: '../logos/instagram.png' },
  { key: 'whatsapp',  label: 'WhatsApp',  placeholder: '+1 (234) 567-890', logo: '../logos/whatsapp.png' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@...', logo: '../logos/tik-tok.png' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/...', logo: '../logos/youtube.png' },
  { key: 'twitter',   label: 'X / Twitter', placeholder: 'https://x.com/...' },
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/...', logo: '../logos/linkedin.png' },
  { key: 'snapchat',  label: 'Snapchat',  placeholder: 'https://snapchat.com/add/...', logo: '../logos/snapchat.png' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/...' },
];
let socials = {}; // { facebook: 'url', instagram: 'url', ... }

function renderSocialPicker() {
  const picker = document.getElementById('socialPicker');
  const available = SOCIAL_OPTIONS.filter(o => !socials[o.key]);
  if (!available.length) {
    picker.innerHTML = '<div class="social-picker-empty">All social networks added.</div>';
    return;
  }
  picker.innerHTML = available.map(opt => `
    <button type="button" class="social-picker-btn" data-key="${opt.key}" title="Add ${opt.label}">
      ${opt.logo ? `<img src="${opt.logo}" alt="${opt.label}" />` : opt.label[0]}
      <span>${opt.label}</span>
    </button>`).join('');
  picker.querySelectorAll('.social-picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      socials[key] = '';
      renderSocials();
    });
  });
}

function renderSocials() {
  const container = document.getElementById('socialNetworks');
  const used = Object.keys(socials);
  container.innerHTML = used.map(key => {
    const opt = SOCIAL_OPTIONS.find(o => o.key === key);
    return `
    <div class="social-row" data-key="${key}">
      <div class="social-row-icon">
        ${opt?.logo ? `<img src="${opt.logo}" alt="${opt.label}" />` : opt?.label?.charAt(0) || key}
      </div>
      <div class="social-row-body">
        <label>${opt?.label || key}</label>
        <input type="text" value="${socials[key]}" placeholder="${opt?.placeholder || ''}"
               onchange="socials['${key}']=this.value;syncSocials()" />
      </div>
      <button type="button" class="social-row-remove" onclick="removeSocial('${key}')">✕</button>
    </div>`;
  }).join('');
  syncSocials();
  renderSocialPicker();
}

function syncSocials() { document.getElementById('bizSocials').value = JSON.stringify(socials); }
window.removeSocial = (key) => { delete socials[key]; renderSocials(); };
document.getElementById('bizCategory').addEventListener('change', function () {
  document.getElementById('bizCategoryCustom').style.display = this.value === 'Other' ? 'block' : 'none';
});

// ── MAPS PREVIEW ──
function normalizeMapsUrl(raw) {
  let url = raw.trim();
  const srcMatch = url.match(/src=["']([^"']+)["']/);
  if (srcMatch) url = srcMatch[1];
  url = url.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  const makeEmbed = q => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  const isEmbed  = u => u.includes('/maps/embed') || u.includes('output=embed');
  if (!url || url.length < 8) return '';
  if (isEmbed(url)) return url;
  try {
    const p = new URL(url.startsWith('http') ? url : `https://${url}`);
    if (p.searchParams.has('q'))    return makeEmbed(p.searchParams.get('q'));
    if (p.searchParams.has('pb'))   return `https://www.google.com/maps/embed?pb=${p.searchParams.get('pb')}`;
    const place = p.pathname.match(/\/maps\/place\/([^\/]+)/);
    if (place) return makeEmbed(decodeURIComponent(place[1].replace(/\+/g,' ')));
    const at = p.pathname.match(/@(-?\d+\.\d+,-?\d+\.\d+)/);
    if (at) return makeEmbed(at[1]);
    return makeEmbed(url);
  } catch { return makeEmbed(url); }
}

(function() {
  let debounce;
  document.getElementById('bizMapsUrl').addEventListener('input', function () {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const src = normalizeMapsUrl(this.value);
      const wrap  = document.getElementById('mapsPreviewWrap');
      const frame = document.getElementById('mapsPreviewFrame');
      if (src) { frame.src = src; wrap.style.display = 'block'; }
      else     { frame.src = '';  wrap.style.display = 'none';  }
    }, 800);
  });
})();

document.getElementById('bizLogoFile').addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;
  const preview = document.getElementById('logoPreview');
  preview.innerHTML = '<p style="color:#aaa;font-size:.8rem">Uploading...</p>';
  const url = await uploadImage(file);
  if (url) {
    document.getElementById('bizLogoUrl').value = url;
    document.getElementById('bizLogoUrlInput').value = url;
    preview.innerHTML = `<img src="${url}" alt="Logo preview" />`;
  } else {
    preview.innerHTML = '<p style="color:#e53e3e;font-size:.8rem">Upload failed</p>';
  }
});

document.getElementById('bizLogoUrlInput').addEventListener('input', function () {
  const value = this.value.trim();
  document.getElementById('bizLogoUrl').value = value;
  const preview = document.getElementById('logoPreview');
  preview.innerHTML = value ? `<img src="${value}" alt="Logo preview" />` : '';
});

// ── RENDER BUSINESS LIST ──
async function renderList() {
  const container = document.getElementById('businessesList');
  container.innerHTML = `<div class="empty-state"><span>⏳</span>Loading...</div>`;

  const { data, error } = await supabase.from('negocios').select('*').order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<div class="empty-state"><span>❌</span>Error: ${error.message}</div>`;
    return;
  }
  if (!data.length) {
    container.innerHTML = `<div class="empty-state"><span>🏢</span>No businesses yet. Click "+ Add Business" to get started.</div>`;
    return;
  }

  container.innerHTML = data.map(b => `
    <div class="biz-admin-card">
      ${b.hero_image
        ? `<img class="biz-admin-card-img" src="${b.hero_image}" alt="${b.name}" onerror="this.style.display='none'" />`
        : `<div class="biz-admin-card-img-placeholder">🏢</div>`}
      <div class="biz-admin-card-body">
        <span class="tag">${b.category || ''}</span>
        <h3>${b.name}</h3>
        <p>${b.description || ''}</p>
        <div class="biz-admin-card-actions">
          <button class="btn-edit" onclick="openEdit('${b.id}')">✏️ Edit</button>
          <a class="btn-view" href="../negocios/negocio.html?id=${b.id}" target="_blank">🔗</a>
          <button class="btn-delete" onclick="deleteBusiness('${b.id}')">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

// ── OPEN / CLOSE MODAL ──
function openAdd() {
  document.getElementById('modalTitle').textContent = 'Add Business';
  document.getElementById('bizForm').reset();
  document.getElementById('bizIndex').value = '';
  document.getElementById('bizCategoryCustom').style.display = 'none';
  document.getElementById('heroPreview').innerHTML = '';
  document.getElementById('logoPreview').innerHTML = '';
  galleryUrls = []; renderGalleryPreview();
  serviceTags = []; renderServiceTags();
  reviews = []; renderReviews();
  socials = {}; renderSocials();
  resetTabs();
  document.getElementById('modalOverlay').classList.add('open');
}

window.openEdit = async (id) => {
  const { data: b, error } = await supabase.from('negocios').select('*').eq('id', id).single();
  if (error) { showToast('Error loading business'); return; }

  document.getElementById('modalTitle').textContent = 'Edit Business';
  document.getElementById('bizIndex').value          = b.id;
  document.getElementById('bizName').value           = b.name             || '';
  document.getElementById('bizDescription').value    = b.description      || '';
  document.getElementById('bizDescriptionFull').value= b.description_full || '';
  document.getElementById('bizPhone').value          = b.phone            || '';
  document.getElementById('bizEmail').value          = b.email            || '';
  document.getElementById('bizAddress').value        = b.address          || '';
  document.getElementById('bizMapsUrl').value = b.maps_url || '';
  // maps preview
  const mapsPreviewSrc = normalizeMapsUrl(b.maps_url || '');
  const mapsWrap = document.getElementById('mapsPreviewWrap');
  const mapsFrame = document.getElementById('mapsPreviewFrame');
  if (mapsPreviewSrc) { mapsFrame.src = mapsPreviewSrc; mapsWrap.style.display = 'block'; }
  else                { mapsFrame.src = '';             mapsWrap.style.display = 'none';  }
  document.getElementById('bizHours').value           = b.hours            || '';
  document.getElementById('bizWebsite').value         = b.website          || '';
  document.getElementById('bizLogoUrl').value         = b.logo_url        || '';
  document.getElementById('bizLogoUrlInput').value    = b.logo_url        || '';
  document.getElementById('bizHeroImage').value       = b.hero_image       || '';
  document.getElementById('bizCategoryCustom').style.display = 'none';

  // Socials
  socials = b.socials ? JSON.parse(JSON.stringify(b.socials)) : {};
  // migrate old fields if present
  if (!Object.keys(socials).length) {
    if (b.facebook)  socials.facebook  = b.facebook;
    if (b.instagram) socials.instagram = b.instagram;
    if (b.whatsapp)  socials.whatsapp  = b.whatsapp;
    if (b.tiktok)    socials.tiktok    = b.tiktok;
  }
  renderSocials();

  const catSelect = document.getElementById('bizCategory');
  const knownCats = Array.from(catSelect.options).map(o => o.value);
  if (knownCats.includes(b.category)) {
    catSelect.value = b.category;
  } else {
    catSelect.value = 'Other';
    document.getElementById('bizCategoryCustom').value = b.category;
    document.getElementById('bizCategoryCustom').style.display = 'block';
  }

  document.querySelectorAll('input[name="bizStatus"]').forEach(r => { r.checked = r.value === (b.status || 'active'); });

  document.getElementById('heroPreview').innerHTML = b.hero_image
    ? `<img src="${b.hero_image}" alt="Hero preview" />` : '';
  document.getElementById('bizHeroFile').value = '';
  document.getElementById('logoPreview').innerHTML = b.logo_url
    ? `<img src="${b.logo_url}" alt="Logo preview" />` : '';
  document.getElementById('bizLogoFile').value = '';

  // hero settings (desktop/mobile height + width)
  const heroSettings = b.hero_settings || {};
  document.getElementById('bizHeroHeightDesktop').value = heroSettings.desktop || 620;
  document.getElementById('heroHeightDesktopVal').textContent = (heroSettings.desktop || 620) + 'px';
  document.getElementById('bizHeroHeightMobile').value = heroSettings.mobile || 360;
  document.getElementById('heroHeightMobileVal').textContent = (heroSettings.mobile || 360) + 'px';
  document.getElementById('bizHeroWidthDesktop').value = heroSettings.widthDesktop || 100;
  document.getElementById('heroWidthDesktopVal').textContent = (heroSettings.widthDesktop || 100) + '%';
  document.getElementById('bizHeroWidthMobile').value = heroSettings.widthMobile || 100;
  document.getElementById('heroWidthMobileVal').textContent = (heroSettings.widthMobile || 100) + '%';
  document.getElementById('bizHeroZoom').value = heroSettings.zoom || 100;
  document.getElementById('heroZoomVal').textContent = (heroSettings.zoom || 100) + '%';
  const fitEl = document.getElementById('bizHeroFit');
  if (fitEl) fitEl.value = heroSettings.fit || 'cover';
  document.getElementById('bizHeroSettings').value = JSON.stringify(heroSettings || {});

  galleryUrls = b.gallery  || []; renderGalleryPreview();
  serviceTags = b.services || []; renderServiceTags();
  reviews     = b.reviews  ? JSON.parse(JSON.stringify(b.reviews)) : []; renderReviews();

  countEl.textContent = `${b.description?.length || 0} / 160`;
  resetTabs();
  document.getElementById('modalOverlay').classList.add('open');
};

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

// ── SAVE ──
document.getElementById('bizForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('bizIndex').value;
  const catSelect = document.getElementById('bizCategory');
  const category = catSelect.value === 'Other'
    ? document.getElementById('bizCategoryCustom').value.trim()
    : catSelect.value;

  const biz = {
    name:             document.getElementById('bizName').value.trim(),
    category,
    description:      document.getElementById('bizDescription').value.trim(),
    description_full: document.getElementById('bizDescriptionFull').value.trim(),
    phone:            document.getElementById('bizPhone').value.trim(),
    email:            document.getElementById('bizEmail').value.trim(),
    address:          document.getElementById('bizAddress').value.trim(),
    maps_url:         document.getElementById('bizMapsUrl').value.trim(),
    hours:            document.getElementById('bizHours').value.trim(),
    website:          document.getElementById('bizWebsite').value.trim(),
    logo_url:         document.getElementById('bizLogoUrl').value.trim() || document.getElementById('bizLogoUrlInput').value.trim(),
    socials:          socials,
    hero_image:       document.getElementById('bizHeroImage').value.trim(),
    hero_settings:    (() => {
      try { return JSON.parse(document.getElementById('bizHeroSettings').value || '{}'); } catch(e) { return {}; }
    })(),
    gallery:          galleryUrls,
    services:         serviceTags,
    reviews:          reviews,
    status:           document.querySelector('input[name="bizStatus"]:checked')?.value || 'active',
  };

  let error;
  if (!id) {
    biz.date = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    ({ error } = await supabase.from('negocios').insert(biz));
  } else {
    ({ error } = await supabase.from('negocios').update(biz).eq('id', id));
  }

  if (error) { showToast('❌ Error: ' + error.message); return; }

  closeModal();
  renderList();
  showToast(!id ? '✓ Business added' : '✓ Business updated');
});

// ── DELETE ──
window.deleteBusiness = async (id) => {
  if (!confirm('Delete this business?')) return;
  const { error } = await supabase.from('negocios').delete().eq('id', id);
  if (error) { showToast('❌ Error: ' + error.message); return; }
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
