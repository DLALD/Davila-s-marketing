const { createClient } = supabase;
const db = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh'
);

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

async function loadProduct() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { document.getElementById('infoName').textContent = 'Producto no encontrado.'; return; }

  const { data: p, error } = await db.from('productos').select('*').eq('id', id).single();
  if (error || !p) { document.getElementById('infoName').textContent = 'Producto no encontrado.'; return; }

  document.title = `${p.nombre} — Davila's Marketing`;

  const imgs = parseGallery(p.galeria);

  // ── HERO ──
  if (imgs[0]) {
    document.getElementById('heroBg').src = imgs[0];
    document.getElementById('heroBg').alt = p.nombre;
  }
  document.getElementById('heroTag').textContent  = p.categoria || 'Producto';
  document.getElementById('heroName').textContent = p.nombre;
  if (p.precio) document.getElementById('heroPrice').textContent = p.precio;

  // ── MAIN MEDIA (first image or video) ──
  setMain(imgs[0] || null, p.video_url || null, !imgs.length && !!p.video_url);

  // ── THUMBNAILS ──
  const thumbContainer = document.getElementById('galleryThumbs');
  const mediaItems = imgs.map((url, i) => ({ type: 'img', url, active: i === 0 }));
  if (mediaItems.length > 1) {
    thumbContainer.innerHTML = mediaItems.map((t) =>
      `<button class="thumb ${t.active ? 'active' : ''}" type="button" onclick="switchMedia('img','${t.url}',this)"><img src="${t.url}" alt="" loading="lazy" /></button>`
    ).join('');
  }

  // ── INFO COL ──
  document.getElementById('infoTag').textContent  = p.categoria || '';
  document.getElementById('infoName').textContent = p.nombre;

  if (p.precio) {
    document.getElementById('infoPrice').textContent = p.precio;
  } else {
    document.getElementById('infoPrice').style.display = 'none';
  }

  const stockEl = document.getElementById('infoStock');
  if (p.stock) {
    stockEl.textContent = p.stock;
    if (p.stock.toLowerCase().includes('agot')) stockEl.classList.add('out');
  } else {
    stockEl.style.display = 'none';
  }

  document.getElementById('infoDesc').textContent = p.descripcion || '';

  // Business association
  if (p.negocio_id) {
    const { data: biz } = await db.from('negocios').select('id, name').eq('id', p.negocio_id).single();
    if (biz) {
      document.getElementById('infoBiz').innerHTML =
        `🏢 <a href="../negocios/negocio.html?id=${biz.id}" style="color:var(--blue);text-decoration:none;font-weight:700">${biz.name}</a>`;
    }
  }

  // Buy button
  if (p.link_compra) {
    const btn = document.getElementById('btnBuy');
    btn.href = p.link_compra;
    btn.classList.remove('hidden');
  }

  // ── VIDEO SECTION (full width) ──
  const uploadedVideos = Array.isArray(p.videos) ? p.videos : [];
  const hasVideoUrl = !!p.video_url;
  const hasUploadedVideos = uploadedVideos.length > 0;
  
  if (hasVideoUrl || hasUploadedVideos) {
    document.getElementById('videoSection').classList.remove('hidden');
    let videoHtml = '';
    
    if (hasVideoUrl) {
      videoHtml = `<iframe src="${embedUrl(p.video_url)}" allowfullscreen loading="lazy"></iframe>`;
    } else if (hasUploadedVideos) {
      videoHtml = `<video controls style="width:100%;height:100%;object-fit:cover;"><source src="${uploadedVideos[0]}" type="video/mp4"></video>`;
    }
    
    document.getElementById('videoEmbed').innerHTML = videoHtml;
  }

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
      const img = Array.isArray(r.galeria) ? r.galeria[0] : '';
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

  // ── SCROLL ANIMATIONS ──
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('anim-in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  ['.gallery-col', '.info-col', '.video-section', '.related-section', '.about-us-section']
    .forEach(sel => { const el = document.querySelector(sel); if (el) { el.classList.add('anim-fade'); obs.observe(el); } });
}

// ── MEDIA SWITCHER ──
function setMain(imgUrl, videoUrl, showVideo) {
  const imgEl   = document.getElementById('mainImg');
  const videoEl = document.getElementById('mainVideo');
  const wrap    = document.getElementById('galleryMain');
  const zoomBtn = document.getElementById('galleryZoomBtn');

  if (showVideo && videoUrl) {
    imgEl.style.display   = 'none';
    videoEl.style.display = 'block';
    videoEl.innerHTML     = `<iframe src="${embedUrl(videoUrl)}" allowfullscreen loading="lazy"></iframe>`;
    wrap.style.aspectRatio = '16/9';
    wrap.style.cursor = 'default';
    zoomBtn.style.display = 'none';
  } else if (imgUrl) {
    imgEl.src = imgUrl; imgEl.style.display = 'block';
    videoEl.style.display = 'none'; videoEl.innerHTML = '';
    wrap.style.aspectRatio = '16/9';
    wrap.style.cursor = 'zoom-in';
    wrap.onclick = () => openLightbox(imgUrl);
    zoomBtn.style.display = 'flex';
    zoomBtn.onclick = (e) => {
      e.stopPropagation();
      openLightbox(imgUrl);
    };
  } else if (videoUrl) {
    imgEl.style.display   = 'none';
    videoEl.style.display = 'block';
    videoEl.innerHTML     = `<iframe src="${embedUrl(videoUrl)}" allowfullscreen loading="lazy"></iframe>`;
    wrap.style.aspectRatio = '16/9';
    wrap.style.cursor = 'default';
    zoomBtn.style.display = 'none';
  }
}

window.switchMedia = (type, url, el) => {
  document.querySelectorAll('.thumb, .thumb-video').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  setMain(type === 'img' ? url : null, type === 'video' ? url : null, type === 'video');
};

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

// ── LIGHTBOX ──
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

loadProduct();
