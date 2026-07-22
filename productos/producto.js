const { createClient } = supabase;
// Disable realtime on public pages to avoid automatic push updates during admin edits
const db = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh',
  { realtime: { enabled: false } }
);

// --- Debug helpers: detect and (temporarily) block automatic reloads ---
(function installReloadGuards() {
  try {
    // Log navigation type on load
    window.addEventListener('load', () => {
      try {
        const nav = performance.getEntriesByType('navigation')[0];
        console.log('NAVIGATION TYPE:', nav ? nav.type : 'unknown');
      } catch (e) { console.log('nav type error', e); }
    });

    // Override programmatic reloads
    if (window.location && typeof window.location.reload === 'function') {
      const origReload = window.location.reload.bind(window.location);
      window.location.reload = function reloadBlocker() {
        console.warn('Blocked call to location.reload()');
        console.trace();
        // do not call original reload to avoid refresh while debugging
      };
    }

    // Warn and block unloads triggered by scripts (will trigger a browser prompt)
    window.addEventListener('beforeunload', (e) => {
      console.warn('beforeunload fired — blocking to capture cause');
      // Modern browsers require setting returnValue to show prompt
      e.preventDefault();
      e.returnValue = '';
      return '';
    }, { capture: true });

    // Log visibility and pagehide events
    document.addEventListener('visibilitychange', () => console.log('visibilitychange', document.visibilityState));
    window.addEventListener('pagehide', (ev) => console.log('pagehide', ev));
  } catch (err) {
    console.error('installReloadGuards error', err);
  }
})();

let galleryImages = [];
let lightboxIndex = 0;

function parseGallery(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      if (parsed) return [parsed];
    } catch (e) {
      const parts = trimmed.split(',').map(item => item.trim()).filter(Boolean);
      return parts;
    }
    return [trimmed];
  }
  return [];
}

function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function loadProduct() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('heroName').textContent = 'Producto no encontrado.'; return; }

  const { data: p, error } = await db.from('productos').select('*').eq('id', id).single();
  if (error || !p) { document.getElementById('heroName').textContent = 'Producto no encontrado.'; return; }

  document.title = `${p.nombre} — Davila's Marketing`;

  const imgs = parseGallery(p.galeria);
  galleryImages = imgs;
  const sentences = splitSentences(p.descripcion);

  // ── HERO ──
  document.getElementById('heroTag').textContent = p.categoria || 'Producto';
  document.getElementById('heroName').textContent = p.nombre;
  document.getElementById('heroSub').textContent = sentences[0] || '';

  if (imgs[0]) {
    document.getElementById('heroImg').src = imgs[0];
    document.getElementById('heroImg').alt = p.nombre;
    document.getElementById('heroFigure').onclick = () => openLightbox(0);
  } else {
    document.getElementById('heroFigure').classList.add('hidden');
  }

  if (p.precio) document.getElementById('heroPrice').textContent = p.precio;

  const heroStockEl = document.getElementById('heroStock');
  if (p.stock) {
    heroStockEl.textContent = p.stock;
    if (p.stock.toLowerCase().includes('agot')) heroStockEl.classList.add('out');
  } else {
    heroStockEl.classList.add('hidden');
  }

  if (p.link_compra) {
    document.getElementById('heroBuyBtn').href = p.link_compra;
    document.getElementById('heroBuyBtn').classList.remove('hidden');
  }

  // ── SPEC STRIP (only real fields) ──
  const specs = [];
  if (p.categoria) specs.push({ num: p.categoria, label: 'Categoría' });
  if (p.precio) specs.push({ num: p.precio, label: 'Precio' });
  if (p.stock) specs.push({ num: p.stock, label: 'Disponibilidad' });
  const specStrip = document.getElementById('specStrip');
  if (specs.length) {
    specStrip.innerHTML = specs.map(s =>
      `<div class="spec-item"><div class="spec-num">${s.num}</div><div class="spec-label">${s.label}</div></div>`
    ).join('');
  } else {
    specStrip.closest('.spec-strip').classList.add('hidden');
  }

  // ── STORY SECTIONS (remaining images paired with remaining sentences) ──
  const storyImgs = imgs.slice(1);
  const storySentences = sentences.slice(1);
  const storyEl = document.getElementById('story');
  const bgCycle = ['on-white', 'on-panel', 'on-black'];
  storyImgs.forEach((url, i) => {
    const bg = bgCycle[i % bgCycle.length];
    const caption = storySentences[i] || '';
    const section = document.createElement('section');
    section.className = `story-section reveal ${bg}`;
    section.innerHTML = `
      <div class="story-inner">
        <div class="story-figure" data-index="${i + 1}">
          <img src="${url}" alt="${p.nombre}" loading="lazy" />
        </div>
        ${caption ? `<p class="story-caption">${caption}</p>` : ''}
      </div>`;
    storyEl.appendChild(section);
  });
  storyEl.querySelectorAll('.story-figure').forEach(fig => {
    fig.addEventListener('click', () => openLightbox(parseInt(fig.dataset.index, 10)));
  });

  // ── CONTENT SECTIONS ──
  function normalizeSections(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // not JSON, fallthrough
      }
    }
    return [];
  }

  const contentSections = normalizeSections(p.content_sections);
  console.log('producto: content_sections ->', contentSections);
  if (contentSections.length) {
    const container = document.getElementById('contentSectionsContainer');
    document.getElementById('contentSectionsSection').classList.remove('hidden');
    container.innerHTML = contentSections.map(section => {
      const type = section && section.type ? section.type : (section && (section.rows || section.cards) ? (section.rows ? 'table' : 'cards') : 'section');
      const title = section && section.title ? `<h4 class="content-section-title">${section.title}</h4>` : '';
      const text = section && section.text ? `<p class="content-section-text">${section.text}</p>` : '';
      const imgUrl = (section && (section.image || section.img || section.image_url)) || '';
      const imageHtml = imgUrl ? `<div class="content-section-media"><img src="${imgUrl}" alt="${(section && section.title) || p.nombre}" loading="lazy" /></div>` : '';
      const styleClass = (section && section.style) || 'card';
      const animationClass = (section && section.animation) || 'fade-up';
      const imgPos = (section && section.image_position) || 'right';
      const bgMode = (section && section.bg_mode) || 'default';
      const bgClass = bgMode && bgMode !== 'default' ? `bg-mode-${bgMode}` : '';

      // Table type
      if (type === 'table' && Array.isArray(section.rows)) {
        const rowsHtml = section.rows.map(r => `<tr><td class="tbl-key">${r.key}</td><td class="tbl-val">${r.value}</td></tr>`).join('');
        return `<article class="content-section-card table ${animationClass} ${bgClass}">
          <div class="content-section-body">${title}<table class="product-specs">${rowsHtml}</table></div>
        </article>`;
      }

      // Cards type
      if (type === 'cards' && Array.isArray(section.cards)) {
        const cardsInner = section.cards.map(c => `
          <div class="prod-card">
            ${c.image ? `<div class="prod-card-img"><img src="${c.image}" alt="${c.title || ''}" loading="lazy" /></div>` : ''}
            <div class="prod-card-body"><strong>${c.title || ''}</strong><div>${c.text || ''}</div></div>
          </div>`).join('');
        return `<article class="content-section-card cards ${animationClass} ${bgClass}">
          ${title}
          <div class="cards-grid">${cardsInner}</div>
        </article>`;
      }

      // Default section (text + image). Image can be placed outside left/right
      const contentHtml = `<div class="content-section-body">${title}${text}</div>`;
      const outsideClass = imgUrl && (imgPos === 'left' || imgPos === 'right') ? `outside-${imgPos}` : '';
      let markup = '';
      if (styleClass === 'split') {
        markup = `<article class="content-section-card split ${animationClass} ${outsideClass} ${bgClass}">${imgUrl ? imageHtml : ''}${contentHtml}</article>`;
      } else if (styleClass === 'highlight') {
        markup = `<article class="content-section-card highlight ${animationClass} ${outsideClass} ${bgClass}">${contentHtml}${imgUrl ? imageHtml : ''}</article>`;
      } else {
        // card style: if image_position is outside, render flex with image outside
        if (outsideClass) {
          // place image next to the card body
          const imgBlock = `<div class="outside-media">${imageHtml}</div>`;
          if (imgPos === 'left') {
            markup = `<article class="content-section-card card ${animationClass} outside-left ${bgClass}"><div class="outside-wrap">${imgBlock}<div class="inside-wrap">${contentHtml}</div></div></article>`;
          } else {
            markup = `<article class="content-section-card card ${animationClass} outside-right ${bgClass}"><div class="outside-wrap">${contentHtml}${imgBlock}</div></article>`;
          }
        } else {
          markup = `<article class="content-section-card card ${animationClass} ${bgClass}">${imageHtml}${contentHtml}</article>`;
        }
      }

      return markup;
    }).join('');
  }

  // ── QUOTE SECTION (leftover description text + business link) ──
  const leftoverSentences = storySentences.slice(storyImgs.length);
  let quoteText = '';
  if (storyImgs.length === 0 && sentences.length) {
    quoteText = p.descripcion;
  } else if (leftoverSentences.length) {
    quoteText = leftoverSentences.join(' ');
  }

  let hasBiz = false;
  let bizHtml = '';
  if (p.negocio_id) {
    const { data: biz } = await db.from('negocios').select('id, name').eq('id', p.negocio_id).single();
    if (biz) {
      hasBiz = true;
      bizHtml = `Un producto de <a href="../negocios/negocio.html?id=${biz.id}">${biz.name}</a>`;
    }
  }

  if (quoteText || hasBiz) {
    document.getElementById('quoteSection').classList.remove('hidden');
    document.getElementById('quoteText').textContent = quoteText;
    if (!quoteText) document.getElementById('quoteText').classList.add('hidden');
    if (hasBiz) {
      const bizEl = document.getElementById('infoBiz');
      bizEl.innerHTML = bizHtml;
      bizEl.classList.remove('hidden');
    }
  }

  // ── VIDEO SECTION ──
  const uploadedVideos = Array.isArray(p.videos) ? p.videos : [];
  const hasVideoUrl = !!p.video_url;
  const hasUploadedVideos = uploadedVideos.length > 0;

  if (hasVideoUrl || hasUploadedVideos) {
    document.getElementById('videoSection').classList.remove('hidden');
    document.getElementById('videoTitle').textContent = p.nombre;
    let videoHtml = '';
    if (hasVideoUrl) {
      videoHtml = `<iframe src="${embedUrl(p.video_url)}" allowfullscreen loading="lazy"></iframe>`;
    } else if (hasUploadedVideos) {
      videoHtml = `<video controls style="width:100%;height:100%;object-fit:cover;"><source src="${uploadedVideos[0]}" type="video/mp4"></video>`;
    }
    document.getElementById('videoEmbed').innerHTML = videoHtml;
  }

  // ── BUY PANEL ──
  document.getElementById('buyPanelName').textContent = p.nombre;
  if (p.precio) document.getElementById('buyPanelPrice').textContent = p.precio;
  const buyPanelStockEl = document.getElementById('buyPanelStock');
  if (p.stock) {
    buyPanelStockEl.textContent = p.stock;
    if (p.stock.toLowerCase().includes('agot')) buyPanelStockEl.classList.add('out');
  } else {
    buyPanelStockEl.classList.add('hidden');
  }
  if (p.link_compra) {
    const btn = document.getElementById('btnBuy');
    btn.href = p.link_compra;
    btn.classList.remove('hidden');
    document.getElementById('stickyBtn').href = p.link_compra;
    document.getElementById('stickyBtn').classList.remove('hidden');
  }
  document.getElementById('stickyName').textContent = p.nombre;
  if (p.precio) document.getElementById('stickyPrice').textContent = p.precio;

  // ── RELATED PRODUCTS ──
  const { data: related } = await db
    .from('productos')
    .select('id, nombre, precio, galeria')
    .neq('id', id)
    .eq('categoria', p.categoria || '')
    .limit(4);

  if (related && related.length) {
    document.getElementById('relatedSection').classList.remove('hidden');
    document.getElementById('relatedGrid').innerHTML = related.map(r => {
      const rImgs = parseGallery(r.galeria);
      const img = rImgs[0] || '';
      return `
      <a class="related-card" href="producto.html?id=${r.id}">
        ${img
          ? `<img class="related-card-img" src="${img}" alt="${r.nombre}" loading="lazy" />`
          : `<div class="related-card-placeholder">🛍️</div>`}
        <div class="related-card-body">
          <div class="related-card-name">${r.nombre}</div>
          ${r.precio ? `<div class="related-card-price">${r.precio}</div>` : ''}
        </div>
      </a>`;
    }).join('');
  }

  // ── SCROLL REVEAL + STICKY BAR ──
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

  const stickyBar = document.getElementById('stickyBar');
  const heroSection = document.querySelector('.hero-section');
  window.addEventListener('scroll', () => {
    const trigger = heroSection.offsetHeight + 100;
    stickyBar.classList.toggle('visible', window.scrollY > trigger);
  });
}

// ── VIDEO EMBED PARSER ──
function embedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) return `https://www.tiktok.com/embed/v2/${tt[1]}`;
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([^/?]+)/);
  if (ig) return `https://www.instagram.com/p/${ig[1]}/embed`;
  return url;
}

// ── LIGHTBOX (navigable across full gallery) ──
function openLightbox(index) {
  if (!galleryImages.length) return;
  lightboxIndex = index;
  renderLightbox();
  document.getElementById('lightbox').classList.remove('hidden');
}
function renderLightbox() {
  document.getElementById('lightboxImg').src = galleryImages[lightboxIndex];
  const multi = galleryImages.length > 1;
  document.getElementById('lightboxPrev').classList.toggle('hidden', !multi);
  document.getElementById('lightboxNext').classList.toggle('hidden', !multi);
}
function closeLightbox() {
  document.getElementById('lightbox').classList.add('hidden');
}
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
});
document.getElementById('lightboxPrev').addEventListener('click', e => {
  e.stopPropagation();
  lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
  renderLightbox();
});
document.getElementById('lightboxNext').addEventListener('click', e => {
  e.stopPropagation();
  lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
  renderLightbox();
});
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});

loadProduct();