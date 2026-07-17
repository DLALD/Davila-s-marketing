import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh'
);

// ── STATE ──
let products    = [];
let businesses  = [];
let activecat   = 'all';
let searchQuery = '';
let galleryUrls = [];   // for the form
let currentDetailId = null;

// ── INIT ──
async function init() {
  await Promise.all([loadProducts(), loadBusinesses()]);
  buildCatFilter();
  render();
}

// ── LOAD ──
async function loadProducts() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return; }
  products = data || [];
}

async function loadBusinesses() {
  const { data } = await supabase.from('negocios').select('id, name').order('name');
  businesses = data || [];
  const sel = document.getElementById('fNegocio');
  sel.innerHTML = '<option value="">— Sin negocio asociado —</option>' +
    businesses.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
}

// ── CATEGORY FILTER ──
function buildCatFilter() {
  const cats = ['all', ...new Set(products.map(p => p.categoria).filter(Boolean))];
  const container = document.getElementById('catFilter');
  container.innerHTML = cats.map(c =>
    `<button class="pill ${c === activecat ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'Todos' : c}</button>`
  ).join('');
  container.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activecat = btn.dataset.cat;
      container.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === btn));
      render();
    });
  });
}

// ── RENDER GRID ──
function render() {
  const grid = document.getElementById('productsGrid');
  const q = searchQuery.toLowerCase();
  const filtered = products.filter(p => {
    const matchCat  = activecat === 'all' || p.categoria === activecat;
    const matchText = !q || p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q);
    return matchCat && matchText;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><span>🛍️</span>No hay productos aún.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const biz  = businesses.find(b => b.id === p.negocio_id);
    const imgs = Array.isArray(p.galeria) ? p.galeria : [];
    const mainImg = imgs[0] || '';
    return `
    <div class="product-card" onclick="openDetail('${p.id}')">
      <div class="product-card-img-wrap">
        ${mainImg
          ? `<img src="${mainImg}" alt="${p.nombre}" loading="lazy" />`
          : `<div class="product-card-placeholder">🛍️</div>`}
        ${p.categoria ? `<span class="product-card-badge">${p.categoria}</span>` : ''}
        ${p.video_url ? `<span class="product-card-video-badge">▶ Video</span>` : ''}
      </div>
      <div class="product-card-body">
        ${p.categoria ? `<div class="product-card-cat">${p.categoria}</div>` : ''}
        <div class="product-card-name">${p.nombre}</div>
        ${biz ? `<div class="product-card-biz">🏢 ${biz.name}</div>` : ''}
        ${p.precio ? `<div class="product-card-price">${p.precio}</div>` : ''}
        ${p.stock  ? `<div class="product-card-stock">${p.stock}</div>` : ''}
        <div class="product-card-footer">
          <button class="btn-card-view" onclick="event.stopPropagation();openDetail('${p.id}')">Ver producto</button>
          <button class="btn-card-edit" onclick="event.stopPropagation();openEdit('${p.id}')">✏️</button>
          <button class="btn-card-delete" onclick="event.stopPropagation();deleteProduct('${p.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── DETAIL MODAL ──
window.openDetail = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  currentDetailId = id;
  const biz  = businesses.find(b => b.id === p.negocio_id);
  const imgs = Array.isArray(p.galeria) ? p.galeria : [];

  // Biz tag
  const bizTag = document.getElementById('detailBiz');
  bizTag.textContent = biz ? `🏢 ${biz.name}` : '';
  bizTag.style.display = biz ? 'inline-block' : 'none';

  document.getElementById('detailName').textContent  = p.nombre;
  document.getElementById('detailPrice').textContent = p.precio || '';
  document.getElementById('detailPrice').style.display = p.precio ? 'block' : 'none';

  const stockEl = document.getElementById('detailStock');
  stockEl.textContent = p.stock || '';
  stockEl.style.display = p.stock ? 'block' : 'none';
  stockEl.className = 'detail-stock' + (p.stock?.toLowerCase().includes('agot') ? ' out' : '');

  document.getElementById('detailDesc').textContent = p.descripcion || '';

  const linkEl = document.getElementById('detailLink');
  if (p.link_compra) { linkEl.href = p.link_compra; linkEl.style.display = 'block'; }
  else               { linkEl.style.display = 'none'; }

  // Main media — show first image or video
  setDetailMain(imgs[0] || null, p.video_url || null, !imgs.length);

  // Thumbnails
  const thumbsEl = document.getElementById('detailThumbs');
  const thumbItems = [
    ...imgs.map((url, i) => ({ type: 'img', url, i })),
    ...(p.video_url ? [{ type: 'video', url: p.video_url }] : []),
  ];
  thumbsEl.innerHTML = thumbItems.map((t, i) =>
    t.type === 'img'
      ? `<div class="detail-thumb ${i === 0 ? 'active' : ''}" onclick="switchMedia('img','${t.url}',this)"><img src="${t.url}" alt="" /></div>`
      : `<div class="detail-thumb-video" onclick="switchMedia('video','${t.url}',this)">▶</div>`
  ).join('');

  // Edit / Delete buttons
  document.getElementById('detailEditBtn').onclick   = () => { closeDetail(); openEdit(id); };
  document.getElementById('detailDeleteBtn').onclick = () => deleteProduct(id);

  document.getElementById('detailOverlay').classList.add('open');
};

function setDetailMain(imgUrl, videoUrl, preferVideo) {
  const imgEl   = document.getElementById('detailMainImg');
  const videoEl = document.getElementById('detailMainVideo');

  if (preferVideo && videoUrl) {
    imgEl.style.display   = 'none';
    videoEl.style.display = 'block';
    videoEl.innerHTML = `<iframe src="${embedUrl(videoUrl)}" allowfullscreen></iframe>`;
    document.querySelector('.detail-main-img-wrap').style.aspectRatio = '16/9';
  } else if (imgUrl) {
    imgEl.src = imgUrl; imgEl.style.display = 'block';
    videoEl.style.display = 'none'; videoEl.innerHTML = '';
    document.querySelector('.detail-main-img-wrap').style.aspectRatio = '1/1';
  } else if (videoUrl) {
    imgEl.style.display   = 'none';
    videoEl.style.display = 'block';
    videoEl.innerHTML = `<iframe src="${embedUrl(videoUrl)}" allowfullscreen></iframe>`;
    document.querySelector('.detail-main-img-wrap').style.aspectRatio = '16/9';
  }
}

window.switchMedia = (type, url, el) => {
  document.querySelectorAll('.detail-thumb, .detail-thumb-video').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (type === 'img') setDetailMain(url, null, false);
  else                setDetailMain(null, url, true);
};

function closeDetail() { document.getElementById('detailOverlay').classList.remove('open'); }
document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
});

// ── VIDEO EMBED PARSER ──
function embedUrl(url) {
  if (!url) return '';
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // TikTok — use oembed iframe approach
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) return `https://www.tiktok.com/embed/v2/${tt[1]}`;
  // Instagram
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([^/?]+)/);
  if (ig) return `https://www.instagram.com/p/${ig[1]}/embed`;
  return url;
}

// ── VIDEO PREVIEW IN FORM ──
let videoDebounce;
document.getElementById('fVideo').addEventListener('input', function () {
  clearTimeout(videoDebounce);
  videoDebounce = setTimeout(() => {
    const src = embedUrl(this.value.trim());
    const el  = document.getElementById('videoPreview');
    el.innerHTML = src ? `<iframe src="${src}" allowfullscreen></iframe>` : '';
  }, 700);
});

// ── GALLERY UPLOAD ──
document.getElementById('btnUploadGallery').addEventListener('click', async () => {
  const files = document.getElementById('galleryFileInput').files;
  if (!files.length) return;
  const status = document.getElementById('galleryUploadStatus');
  status.textContent = `Subiendo ${files.length} imagen(es)...`;
  for (const file of files) {
    const url = await uploadImage(file);
    if (url) galleryUrls.push(url);
  }
  document.getElementById('galleryFileInput').value = '';
  status.textContent = '✓ Listo';
  renderGalleryPreview();
});

function renderGalleryPreview() {
  document.getElementById('galleryPreview').innerHTML = galleryUrls.map((url, i) => `
    <div class="gallery-thumb">
      <img src="${url}" alt="" />
      <button class="gallery-thumb-remove" onclick="removeGalleryImg(${i})">✕</button>
    </div>`).join('');
}
window.removeGalleryImg = (i) => { galleryUrls.splice(i, 1); renderGalleryPreview(); };

async function uploadImage(file) {
  const blob = await new Promise(resolve => {
    const img = new Image(), objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const scale = Math.min(1, 1400 / img.width);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(b => resolve(b || file), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file); };
    img.src = objUrl;
  });
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from('negocios-imagenes').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) { console.error(error); return null; }
  return supabase.storage.from('negocios-imagenes').getPublicUrl(path).data.publicUrl;
}

// ── OPEN ADD ──
function openAdd() {
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('editId').value = '';
  galleryUrls = []; renderGalleryPreview();
  document.getElementById('videoPreview').innerHTML = '';
  document.getElementById('galleryUploadStatus').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
}

// ── OPEN EDIT ──
window.openEdit = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('editId').value    = p.id;
  document.getElementById('fNombre').value   = p.nombre      || '';
  document.getElementById('fPrecio').value   = p.precio      || '';
  document.getElementById('fCategoria').value= p.categoria   || '';
  document.getElementById('fStock').value    = p.stock       || '';
  document.getElementById('fDesc').value     = p.descripcion || '';
  document.getElementById('fNegocio').value  = p.negocio_id  || '';
  document.getElementById('fVideo').value    = p.video_url   || '';
  document.getElementById('fLink').value     = p.link_compra || '';
  galleryUrls = Array.isArray(p.galeria) ? [...p.galeria] : [];
  renderGalleryPreview();
  // video preview
  const src = embedUrl(p.video_url || '');
  document.getElementById('videoPreview').innerHTML = src ? `<iframe src="${src}" allowfullscreen></iframe>` : '';
  document.getElementById('galleryUploadStatus').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
};

// ── SAVE ──
document.getElementById('productForm').addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const payload = {
    nombre:      document.getElementById('fNombre').value.trim(),
    precio:      document.getElementById('fPrecio').value.trim(),
    categoria:   document.getElementById('fCategoria').value.trim(),
    stock:       document.getElementById('fStock').value.trim(),
    descripcion: document.getElementById('fDesc').value.trim(),
    negocio_id:  document.getElementById('fNegocio').value || null,
    video_url:   document.getElementById('fVideo').value.trim(),
    link_compra: document.getElementById('fLink').value.trim(),
    galeria:     galleryUrls,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from('productos').update(payload).eq('id', id));
  } else {
    ({ error } = await supabase.from('productos').insert(payload));
  }
  if (error) { showToast('❌ ' + error.message); return; }

  closeModal();
  await loadProducts();
  buildCatFilter();
  render();
  showToast(id ? '✓ Producto actualizado' : '✓ Producto agregado');
});

// ── DELETE ──
window.deleteProduct = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message); return; }
  closeDetail();
  await loadProducts();
  buildCatFilter();
  render();
  showToast('Producto eliminado');
};

// ── SEARCH ──
document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value; render();
});

// ── MODAL OPEN/CLOSE ──
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
document.getElementById('btnAdd').addEventListener('click', openAdd);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

init();
