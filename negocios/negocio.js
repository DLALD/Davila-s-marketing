const { createClient } = supabase;
const db = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh'
);

async function loadBusiness() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('bizDescription').textContent = 'Business not found.'; return; }

  const { data: b, error } = await db.from('negocios').select('*').eq('id', id).single();
  if (error || !b) { document.getElementById('bizDescription').textContent = 'Business not found.'; return; }

  document.title = `${b.name} — Davila's Marketing`;

  // Hero
  if (b.hero_image) {
    document.getElementById('heroBg').src = b.hero_image;
    document.getElementById('heroBg').alt = b.name;
  }
  document.getElementById('heroTag').textContent  = b.category || 'Business';
  document.getElementById('heroName').textContent = b.name;

  const metaParts = [];
  if (b.address) metaParts.push(`📍 ${b.address}`);
  if (b.hours)   metaParts.push(`🕐 ${b.hours}`);
  document.getElementById('heroMeta').innerHTML = metaParts.map(p => `<span>${p}</span>`).join('');

  // About
  document.getElementById('bizDescription').textContent = b.description_full || b.description || '';

  // Gallery
  const gallery = b.gallery || [];
  if (gallery.length) {
    document.getElementById('cardGallery').classList.remove('hidden');
    document.getElementById('bizGallery').innerHTML = gallery.map((url, i) =>
      `<img src="${url}" alt="Gallery ${i+1}" loading="lazy" data-index="${i}" />`
    ).join('');
    document.getElementById('bizGallery').addEventListener('click', e => {
      if (e.target.tagName === 'IMG') openLightbox(e.target.src);
    });
  }

  // Reviews
  const reviews = b.reviews || [];
  if (reviews.length) {
    document.getElementById('cardReviews').classList.remove('hidden');
    document.getElementById('bizReviews').innerHTML = reviews.map(r => `
      <div class="review">
        <div class="review-avatar">${(r.name || '?')[0].toUpperCase()}</div>
        <div>
          <div class="review-name">${r.name}</div>
          <div class="review-stars">${'★'.repeat(r.stars || 5)}${'☆'.repeat(5 - (r.stars || 5))}</div>
          <div class="review-text">${r.text}</div>
        </div>
      </div>`).join('');
  }

  // Contact rows
  const rows = [];
  if (b.phone)   rows.push(`<div class="contact-row"><span class="ci">📞</span><a href="tel:${b.phone}">${b.phone}</a></div>`);
  if (b.email)   rows.push(`<div class="contact-row"><span class="ci">✉️</span><a href="mailto:${b.email}">${b.email}</a></div>`);
  if (b.address) rows.push(`<div class="contact-row"><span class="ci">📍</span><span>${b.address}</span></div>`);
  if (b.hours)   rows.push(`<div class="contact-row"><span class="ci">🕐</span><span>${b.hours}</span></div>`);
  document.getElementById('contactRows').innerHTML = rows.join('');

  // Contact action buttons
  const actions = [];
  if (b.whatsapp) actions.push(`<a class="btn-cta btn-cta-green" href="https://wa.me/${b.whatsapp.replace(/\D/g,'')}" target="_blank">💬 WhatsApp</a>`);
  if (b.phone)    actions.push(`<a class="btn-cta btn-cta-blue" href="tel:${b.phone}">📞 Call Now</a>`);
  if (b.email)    actions.push(`<a class="btn-cta btn-cta-outline" href="mailto:${b.email}">✉️ Send Email</a>`);
  document.getElementById('contactActions').innerHTML = actions.join('');

  // Social bubbles
  const SOCIAL_META = {
    facebook:  { icon: '📘', cls: 'sb-facebook',  label: 'Facebook' },
    instagram: { icon: '📸', cls: 'sb-instagram', label: 'Instagram' },
    whatsapp:  { icon: '💬', cls: 'sb-whatsapp',  label: 'WhatsApp' },
    tiktok:    { icon: '🎵', cls: 'sb-tiktok',    label: 'TikTok' },
    youtube:   { icon: '▶️', cls: 'sb-youtube',   label: 'YouTube' },
    twitter:   { icon: '𝕏',  cls: 'sb-twitter',   label: 'X' },
    linkedin:  { icon: '💼', cls: 'sb-linkedin',  label: 'LinkedIn' },
    snapchat:  { icon: '👻', cls: 'sb-snapchat',  label: 'Snapchat' },
    pinterest: { icon: '📌', cls: 'sb-pinterest', label: 'Pinterest' },
    website:   { icon: '🌐', cls: 'sb-website',   label: 'Website' },
  };

  // merge old fields + new socials object
  const socialsObj = b.socials || {};
  if (b.facebook  && !socialsObj.facebook)  socialsObj.facebook  = b.facebook;
  if (b.instagram && !socialsObj.instagram) socialsObj.instagram = b.instagram;
  if (b.whatsapp  && !socialsObj.whatsapp)  socialsObj.whatsapp  = b.whatsapp;
  if (b.tiktok    && !socialsObj.tiktok)    socialsObj.tiktok    = b.tiktok;
  if (b.website   && !socialsObj.website)   socialsObj.website   = b.website;

  const socialEntries = Object.entries(socialsObj).filter(([,v]) => v);
  if (socialEntries.length) {
    document.getElementById('socialCard').classList.remove('hidden');
    document.getElementById('socialLinks').innerHTML = socialEntries.map(([key, url]) => {
      const m = SOCIAL_META[key] || { icon: '🔗', cls: 'sb-website', label: key };
      const href = key === 'whatsapp' ? `https://wa.me/${url.replace(/\D/g,'')}` : url;
      return `<a class="social-bubble ${m.cls}" href="${href}" target="_blank" title="${m.label}">${m.icon}</a>`;
    }).join('');
  }

  // Map
  const mapContainer = document.getElementById('bizMap');
  let mapsUrl = b.maps_url || '';
  // Accept full iframe HTML — extract src
  const srcMatch = mapsUrl.match(/src=["']([^"']+)["']/);
  if (srcMatch) mapsUrl = srcMatch[1];
  // Decode HTML entities
  mapsUrl = mapsUrl.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

  if (mapsUrl && mapsUrl.includes('maps/embed')) {
    document.getElementById('mapCard').classList.remove('hidden');
    mapContainer.innerHTML = `<iframe src="${mapsUrl}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  } else if (b.address) {
    document.getElementById('mapCard').classList.remove('hidden');
    const q = encodeURIComponent(b.address);
    mapContainer.innerHTML = `
      <a class="map-link" href="https://maps.google.com/?q=${q}" target="_blank">
        <div class="map-placeholder">
          <div class="map-pin">📍</div>
          <div class="map-address">${b.address}</div>
          <div class="map-open">Open in Google Maps →</div>
        </div>
      </a>`;
  }

  // Services
  const services = b.services || [];
  if (services.length) {
    document.getElementById('servicesCard').classList.remove('hidden');
    document.getElementById('bizServices').innerHTML = services.map(s => `<li>${s}</li>`).join('');
  }
}

// Lightbox
function openLightbox(src) {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightbox').classList.remove('hidden');
}
document.getElementById('lightboxClose').addEventListener('click', () => {
  document.getElementById('lightbox').classList.add('hidden');
});
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox'))
    document.getElementById('lightbox').classList.add('hidden');
});

loadBusiness();
