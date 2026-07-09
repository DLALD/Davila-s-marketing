// =============================================
// DAVILA'S MARKETING — Generic Business Page JS
// =============================================

// Default config — overridden by each business page
window.BIZ_CONFIG = window.BIZ_CONFIG || {
  name:        'Business Name',
  category:    'Category',
  description: 'Short description of this business.',
  phone:       '',
  email:       '',
  address:     'City, Country',
  website:     '',
  hours:       'Mon–Fri: 9am – 6pm',
  heroImage:   'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  gallery:     [],
  services:    [],
  reviews:     [],
};

function renderHero() {
  const c = window.BIZ_CONFIG;
  const el = document.getElementById('bizHero');
  if (!el) return;
  el.innerHTML = `
    ${c.heroImage ? `<img class="biz-hero-img" src="${c.heroImage}" alt="${c.name}" />` : ''}
    <div class="biz-hero-overlay">
      <span class="biz-hero-tag">${c.category}</span>
      <h1>${c.name}</h1>
      <div class="biz-hero-meta">
        ${c.address ? `<span>📍 ${c.address}</span>` : ''}
        ${c.hours   ? `<span>🕐 ${c.hours}</span>`   : ''}
        ${c.phone   ? `<span>📞 ${c.phone}</span>`   : ''}
      </div>
    </div>`;
}

function renderInfo() {
  const c = window.BIZ_CONFIG;
  const el = document.getElementById('bizInfo');
  if (!el) return;
  el.innerHTML = `
    <div class="biz-info-card">
      <h3>Contact Info</h3>
      ${c.phone   ? `<div class="biz-info-row"><span class="icon">📞</span><a href="tel:${c.phone}">${c.phone}</a></div>` : ''}
      ${c.email   ? `<div class="biz-info-row"><span class="icon">✉️</span><a href="mailto:${c.email}">${c.email}</a></div>` : ''}
      ${c.address ? `<div class="biz-info-row"><span class="icon">📍</span><span>${c.address}</span></div>` : ''}
      ${c.hours   ? `<div class="biz-info-row"><span class="icon">🕐</span><span>${c.hours}</span></div>` : ''}
      ${c.website ? `<div class="biz-info-row"><span class="icon">🌐</span><a href="${c.website}" target="_blank">${c.website}</a></div>` : ''}
    </div>
    ${c.website ? `<a href="${c.website}" target="_blank" class="btn-biz-cta">VISIT WEBSITE →</a>` : ''}`;
}

function renderServices() {
  const c = window.BIZ_CONFIG;
  const el = document.getElementById('bizServices');
  if (!el || !c.services?.length) return;
  el.innerHTML = `
    <div class="biz-info-card">
      <h3>Services</h3>
      <ul class="biz-services-list">
        ${c.services.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>`;
}

function renderGallery() {
  const c = window.BIZ_CONFIG;
  const el = document.getElementById('bizGallery');
  if (!el) return;
  if (!c.gallery?.length) { el.style.display = 'none'; return; }
  el.innerHTML = `
    <div class="biz-content-card">
      <h2>Gallery</h2>
      <div class="biz-gallery">
        ${c.gallery.map(img => `<img src="${img}" alt="${c.name}" loading="lazy" />`).join('')}
      </div>
    </div>`;
}

function renderReviews() {
  const c = window.BIZ_CONFIG;
  const el = document.getElementById('bizReviews');
  if (!el || !c.reviews?.length) return;
  el.innerHTML = `
    <div class="biz-content-card">
      <h2>Reviews</h2>
      ${c.reviews.map(r => `
        <div class="biz-review">
          <div class="biz-review-header">
            <div class="biz-review-avatar">${r.name[0]}</div>
            <div>
              <p class="biz-review-name">${r.name}</p>
              <div class="biz-review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
            </div>
          </div>
          <p>${r.text}</p>
        </div>`).join('')}
    </div>`;
}

function renderDescription() {
  const el = document.getElementById('bizDescription');
  if (el) el.textContent = window.BIZ_CONFIG.description || '';
}

function renderTitle() {
  const c = window.BIZ_CONFIG;
  if (c.name && c.name !== 'Business Name') {
    document.title = `${c.name} — Davila's Marketing`;
  }
}

// Runs after the full page (including inline BIZ_CONFIG) is parsed
window.addEventListener('DOMContentLoaded', () => {
  renderTitle();
  renderHero();
  renderDescription();
  renderInfo();
  renderServices();
  renderGallery();
  renderReviews();
});
