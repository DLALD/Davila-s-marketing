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

  // Hero meta: location + hours + social icons
  const SOCIAL_META = {
    facebook:  { icon: '📘', label: 'Facebook',  logo: '../logos/facebook.png' },
    instagram: { icon: '📸', label: 'Instagram', logo: '../logos/instagram.png' },
    whatsapp:  { icon: '💬', label: 'WhatsApp',  logo: '../logos/whatsapp.png' },
    tiktok:    { icon: '🎵', label: 'TikTok' },
    youtube:   { icon: '▶️', label: 'YouTube',   logo: '../logos/youtube.png' },
    twitter:   { icon: '𝕏',  label: 'X' },
    linkedin:  { icon: '💼', label: 'LinkedIn' },
    snapchat:  { icon: '👻', label: 'Snapchat',  logo: '../logos/snapchat.png' },
    pinterest: { icon: '📌', label: 'Pinterest' },
  };

  const socialsObj = b.socials || {};
  if (b.facebook  && !socialsObj.facebook)  socialsObj.facebook  = b.facebook;
  if (b.instagram && !socialsObj.instagram) socialsObj.instagram = b.instagram;
  if (b.whatsapp  && !socialsObj.whatsapp)  socialsObj.whatsapp  = b.whatsapp;
  if (b.tiktok    && !socialsObj.tiktok)    socialsObj.tiktok    = b.tiktok;

  // Hero meta: vacío (sin address/hours)
  document.getElementById('heroMeta').innerHTML = '';

  // Contact bar: phone + email + address + hours + redes sociales
  const barParts = [];
  if (b.phone)   barParts.push(`<div class="contact-bar-item"><div class="contact-bar-icon">📞</div><div><strong>Phone</strong><a href="tel:${b.phone}">${b.phone}</a></div></div>`);
  if (b.email)   barParts.push(`<div class="contact-bar-item"><div class="contact-bar-icon">✉️</div><div><strong>Email</strong><a href="mailto:${b.email}">${b.email}</a></div></div>`);
  if (b.address) barParts.push(`<div class="contact-bar-item"><div class="contact-bar-icon">📍</div><div><strong>Address</strong>${b.address}</div></div>`);
  if (b.hours)   barParts.push(`<div class="contact-bar-item"><div class="contact-bar-icon">🕐</div><div><strong>Hours</strong>${b.hours}</div></div>`);

  // Redes sociales en el contact bar
  const socialBarEntries = Object.entries(socialsObj).filter(([k, v]) => v && k !== 'website' && SOCIAL_META[k]);
  if (socialBarEntries.length) {
    const icons = socialBarEntries.map(([key, url]) => {
      const m = SOCIAL_META[key] || { icon: '🔗', label: key };
      const href = key === 'whatsapp' ? `https://wa.me/${url.replace(/\D/g,'')}` : url;
      const img = m.logo ? `<img src="${m.logo}" alt="${m.label}" style="width:48px;height:48px;object-fit:contain;border-radius:4px;" />` : m.icon;
      return `<a class="hero-social-icon" href="${href}" target="_blank" title="${m.label}">${img}</a>`;
    }).join('');
    barParts.push(`<div class="contact-bar-item"><div><strong>Follow Us</strong><div style="display:flex;gap:8px;margin-top:6px;">${icons}</div></div></div>`);
  }

  if (barParts.length) document.getElementById('contactBar').innerHTML = barParts.join('');

  // About
  document.getElementById('bizDescription').textContent = b.description_full || b.description || '';

  // Gallery
  const gallery = b.gallery || [];
  if (gallery.length) {
    document.getElementById('cardGallery').classList.remove('hidden');
    const galleryEl = document.getElementById('bizGallery');
    galleryEl.innerHTML = gallery.map((url, i) =>
      `<div class="gallery-item" data-index="${i}"><img src="${url}" alt="Gallery ${i+1}" loading="lazy" /></div>`
    ).join('');
    // IntersectionObserver: staggered entrance
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = +entry.target.dataset.index;
          setTimeout(() => entry.target.classList.add('visible'), idx * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    galleryEl.querySelectorAll('.gallery-item').forEach(el => observer.observe(el));
    galleryEl.addEventListener('click', e => {
      const item = e.target.closest('.gallery-item');
      if (item) openLightbox(item.querySelector('img').src);
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

  const socialEntries2 = Object.entries(socialsObj).filter(([,v]) => v);
  if (socialEntries2.length || b.logo_url) {
    document.getElementById('socialCard').classList.remove('hidden');
    document.getElementById('socialLinks').innerHTML = socialEntries2.map(([key, url]) => {
      if (key === 'website') return '';
      const m = SOCIAL_META[key] || { icon: '🔗', cls: 'sb-website', label: key };
      const href = key === 'whatsapp' ? `https://wa.me/${url.replace(/\D/g,'')}` : url;
      const iconHtml = m.logo ? `<img src="${m.logo}" alt="${m.label}" />` : `${m.icon}`;
      return `<a class="social-bubble ${m.cls || ''}" href="${href}" target="_blank" title="${m.label}">${iconHtml}</a>`;
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
    const titleEl = document.getElementById('servicesTitle');
    if (titleEl) titleEl.textContent = `${b.name} Services`;
    document.getElementById('bizServices').innerHTML = services.map(s => {
      const icon = typeof s === 'object' ? s.icon : '✓';
      const name = typeof s === 'object' ? s.name : s;
      return `<div class="service-item"><span class="service-item-icon">${icon}</span><span class="service-item-name">${name}</span></div>`;
    }).join('');
  }

  // Animate sections on scroll
  (function initScrollAnimations() {
    const blocks = [
      { sel: '.col-about',    cls: 'anim-block-left' },
      { sel: '.col-contact',  cls: 'anim-block-right' },
      { sel: '#servicesCard', cls: 'anim-block' },
      { sel: '#cardGallery',  cls: 'anim-block' },
      { sel: '.col-reviews',  cls: 'anim-block-left' },
      { sel: '#socialCard',   cls: 'anim-block-right' },
      { sel: '.map-section',  cls: 'anim-block' },
      { sel: '.about-us-section', cls: 'anim-block' },
    ];
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = (i * 0.08) + 's';
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    blocks.forEach(({ sel, cls }) => {
      const el = document.querySelector(sel);
      if (el) { el.classList.add(cls); obs.observe(el); }
    });
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
