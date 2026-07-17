const { createClient } = supabase;
const db = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh'
);

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