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

  // Hero settings (height + width)
  const hs = b.hero_settings || {};
  if (hs.desktop)      document.documentElement.style.setProperty('--hero-height-desktop', hs.desktop + 'px');
  if (hs.mobile)       document.documentElement.style.setProperty('--hero-height-mobile',  hs.mobile  + 'px');
  if (hs.widthDesktop) document.documentElement.style.setProperty('--hero-width-desktop',  hs.widthDesktop + '%');
  if (hs.widthMobile)  document.documentElement.style.setProperty('--hero-width-mobile',   hs.widthMobile  + '%');
  if (hs.zoom)         document.documentElement.style.setProperty('--hero-zoom',            hs.zoom / 100);
  if (hs.fit)          document.documentElement.style.setProperty('--hero-fit',             hs.fit);

  // Hero
  if (b.hero_image) {
    document.getElementById('heroBg').src = b.hero_image;
    document.getElementById('heroBg').alt = b.name;
  }
  if (b.logo_url) {
    const heroLogo = document.getElementById('heroLogo');
    heroLogo.src = b.logo_url;
    heroLogo.alt = `${b.name} logo`;
    document.getElementById('heroLogoContainer').classList.add('hidden');
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
  if (b.website) {
    // Show website as a proper CTA with logo + text when logo_url exists
    if (b.logo_url) {
      actions.push(`<a class="btn-cta btn-cta-blue" href="${b.website}" target="_blank"><img class="btn-logo" src="${b.logo_url}" alt="${b.name} logo" /> Visit Website</a>`);
    } else {
      actions.push(`<a class="btn-cta btn-cta-blue" href="${b.website}" target="_blank">Visit Website</a>`);
    }
  }
  if (b.email)    actions.push(`<a class="btn-cta btn-cta-outline" href="mailto:${b.email}">✉️ Email</a>`);
  document.getElementById('contactActions').innerHTML = actions.join('');

  // Social bubbles
  const SOCIAL_META = {
    facebook:  { icon: '📘', cls: 'sb-facebook',  label: 'Facebook',  logo: '../logos/facebook.png' },
    instagram: { icon: '📸', cls: 'sb-instagram', label: 'Instagram', logo: '../logos/instagram.png' },
    whatsapp:  { icon: '💬', cls: 'sb-whatsapp',  label: 'WhatsApp',  logo: '../logos/whatsapp.png' },
    tiktok:    { icon: '🎵', cls: 'sb-tiktok',    label: 'TikTok' },
    youtube:   { icon: '▶️', cls: 'sb-youtube',   label: 'YouTube',   logo: '../logos/youtube.png' },
    twitter:   { icon: '𝕏',  cls: 'sb-twitter',   label: 'X' },
    linkedin:  { icon: '💼', cls: 'sb-linkedin',  label: 'LinkedIn' },
    snapchat:  { icon: '👻', cls: 'sb-snapchat',  label: 'Snapchat', logo: '../logos/snapchat.png' },
    pinterest: { icon: '📌', cls: 'sb-pinterest', label: 'Pinterest' },
  };

  // merge old fields + new socials object
  const socialsObj = b.socials || {};
  if (b.facebook  && !socialsObj.facebook)  socialsObj.facebook  = b.facebook;
  if (b.instagram && !socialsObj.instagram) socialsObj.instagram = b.instagram;
  if (b.whatsapp  && !socialsObj.whatsapp)  socialsObj.whatsapp  = b.whatsapp;
  if (b.tiktok    && !socialsObj.tiktok)    socialsObj.tiktok    = b.tiktok;
  if (b.website   && !socialsObj.website)   socialsObj.website   = b.website;

  const socialEntries = Object.entries(socialsObj).filter(([,v]) => v);
  if (socialEntries.length || b.logo_url) {
    document.getElementById('socialCard').classList.remove('hidden');
    document.getElementById('socialLinks').innerHTML = socialEntries.map(([key, url]) => {
      if (key === 'website') return '';
      const m = SOCIAL_META[key] || { icon: '🔗', cls: 'sb-website', label: key };
      const href = key === 'whatsapp' ? `https://wa.me/${url.replace(/\D/g,'')}` : url;
      const iconHtml = m.logo ? `<img src="${m.logo}" alt="${m.label}" />` : `${m.icon}`;
      return `<a class="social-bubble ${m.cls}" href="${href}" target="_blank" title="${m.label}">${iconHtml}</a>`;
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

  const makeQueryEmbed = query => `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  const isEmbedUrl = url => url.includes('/maps/embed') || url.includes('output=embed');
  const normalizeMapsUrl = url => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (isEmbedUrl(parsed.href)) return parsed.href;
      const params = parsed.searchParams;
      if (params.has('q')) return makeQueryEmbed(params.get('q'));
      if (params.has('query')) return makeQueryEmbed(params.get('query'));
      if (params.has('pb')) return `https://www.google.com/maps/embed?pb=${params.get('pb')}`;
      const path = parsed.pathname;
      const placeMatch = path.match(/\/maps\/place\/([^\/]+)/);
      if (placeMatch) return makeQueryEmbed(decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')));
      const atMatch = path.match(/@(-?\d+\.\d+,-?\d+\.\d+)/);
      if (atMatch) return makeQueryEmbed(atMatch[1]);
      const searchMatch = path.match(/\/maps\/(search|dir)\/([^\/]+)/);
      if (searchMatch) return makeQueryEmbed(decodeURIComponent(searchMatch[2].replace(/\+/g, ' ')));
      return makeQueryEmbed(parsed.href);
    } catch (err) {
      return makeQueryEmbed(url);
    }
  };

  if (mapsUrl) {
    document.getElementById('mapCard').classList.remove('hidden');
    const src = isEmbedUrl(mapsUrl) ? mapsUrl : normalizeMapsUrl(mapsUrl);
    mapContainer.innerHTML = `<iframe src="${src}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  } else if (b.address) {
    document.getElementById('mapCard').classList.remove('hidden');
    mapContainer.innerHTML = `<iframe src="${makeQueryEmbed(b.address)}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  }

  // Services
  const services = b.services || [];
  if (services.length) {
    document.getElementById('servicesCard').classList.remove('hidden');
    document.getElementById('bizServices').innerHTML = services.map(s => `<li>${s}</li>`).join('');
  }

  // Animate text blocks on load (staggered)
  (function animateTextBlocks() {
    const selectors = ['#hero', '#cardAbout', '#cardGallery', '#cardReviews', '#contactCard', '#socialCard', '#servicesCard'];
    const els = selectors.map(s => document.querySelector(s)).filter(Boolean);
    els.forEach(el => el.classList.add('reveal'));
    // slower stagger: 220ms between blocks for a more noticeable entrance
    els.forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 220));
  })();

  // Add ripple click effect and stronger hover to CTAs (Visit button)
  (function initButtonRipples() {
    document.querySelectorAll('.btn-cta').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
      });
      // keyboard accessible press animation
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          btn.classList.add('pressed');
          setTimeout(() => btn.classList.remove('pressed'), 200);
        }
      });
    });
  })();
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

// Preview toolbar removed — hero height should come from admin `hero_settings` persisted in DB.
