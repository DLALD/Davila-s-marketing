import { supabase } from './supabase-client.js';

let products   = [];
let businesses = [];
let galleryUrls = [];
let activeCat  = 'all';
let search     = '';

// ── INIT ──
async function init() {
  await Promise.all([loadProducts(), loadBusinesses()]);
  buildCatFilter();
  render();
}

async function loadProducts() {
  const { data, error } = await supabase
    .from('productos').select('*').order('created_at', { ascending: false });
  if (error) {
    document.getElementById('productsGrid').innerHTML =
      `<div class="empty-state"><span>❌</span>${error.message}</div>`;
    return;
  }
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
  const el = document.getElementById('catFilter');
  el.innerHTML = cats.map(c =>
    `<button class="pill ${c === activeCat ? 'active' : ''}" data-cat="${c}">${c === 'all' ? 'Todos' : c}</button>`
  ).join('');
  el.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      el.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p === btn));
      render();
    });
  });
}

// ── RENDER ──
function render() {
  const grid = document.getElementById('productsGrid');
  const q = search.toLowerCase();
  const filtered = products.filter(p => {
    const matchCat  = activeCat === 'all' || p.categoria === activeCat;
    const matchText = !q || p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q);
    return matchCat && matchText;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state"><span>🛍️</span>No hay productos. Haz clic en "+ Add Product".</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const biz  = businesses.find(b => b.id === p.negocio_id);
    const imgs = Array.isArray(p.galeria) ? p.galeria : [];
    return `
    <div class="biz-admin-card">
      ${imgs[0]
        ? `<img class="biz-admin-card-img" src="${imgs[0]}" alt="${p.nombre}" onerror="this.style.display='none'" />`
        : `<div class="biz-admin-card-img-placeholder">🛍️</div>`}
      <div class="biz-admin-card-body">
        ${p.categoria ? `<span class="tag">${p.categoria}</span>` : ''}
        <h3>${p.nombre}</h3>
        ${p.precio ? `<p style="color:#4ade80;font-weight:800;font-size:.95rem;margin-bottom:4px">${p.precio}</p>` : ''}
        ${biz ? `<p style="font-size:.75rem;color:var(--blue);margin-bottom:6px">🏢 ${biz.name}</p>` : ''}
        <p>${p.descripcion || ''}</p>
        <div class="biz-admin-card-actions">
          <button class="btn-edit" onclick="openEdit('${p.id}')">✏️ Edit</button>
          <a class="btn-view" href="../productos/productos.html" target="_blank">🔗</a>
          <button class="btn-delete" onclick="deleteProduct('${p.id}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── OPEN ADD ──
function openAdd() {
  document.getElementById('modalTitle').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('editId').value = '';
  galleryUrls = []; renderGalleryPreview();
  document.getElementById('videoPreview').innerHTML = '';
  document.getElementById('galleryStatus').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
}

// ── OPEN EDIT ──
window.openEdit = (id) => {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modalTitle').textContent = 'Edit Product';
  document.getElementById('editId').value     = p.id;
  document.getElementById('fNombre').value    = p.nombre      || '';
  document.getElementById('fPrecio').value    = p.precio      || '';
  document.getElementById('fCategoria').value = p.categoria   || '';
  document.getElementById('fStock').value     = p.stock       || '';
  document.getElementById('fDesc').value      = p.descripcion || '';
  document.getElementById('fNegocio').value   = p.negocio_id  || '';
  document.getElementById('fVideo').value     = p.video_url   || '';
  document.getElementById('fLink').value      = p.link_compra || '';
  galleryUrls = Array.isArray(p.galeria) ? [...p.galeria] : [];
  renderGalleryPreview();
  const src = embedUrl(p.video_url || '');
  document.getElementById('videoPreview').innerHTML = src ? `<iframe src="${src}" allowfullscreen></iframe>` : '';
  document.getElementById('galleryStatus').textContent = '';
  document.getElementById('modalOverlay').classList.add('open');
};

// ── DELETE ──
window.deleteProduct = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;
  const { error } = await supabase.from('productos').delete().eq('id', id);
  if (error) { showToast('❌ ' + error.message); return; }
  await loadProducts(); buildCatFilter(); render();
  showToast('Producto eliminado');
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
  if (id) { ({ error } = await supabase.from('productos').update(payload).eq('id', id)); }
  else    { ({ error } = await supabase.from('productos').insert(payload)); }
  if (error) { showToast('❌ ' + error.message); return; }
  closeModal();
  await loadProducts(); buildCatFilter(); render();
  showToast(id ? '✓ Producto actualizado' : '✓ Producto agregado');
});

// ── GALLERY UPLOAD ──
document.getElementById('btnUploadGallery').addEventListener('click', async () => {
  const files = document.getElementById('galleryFileInput').files;
  if (!files.length) return;
  const status = document.getElementById('galleryStatus');
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
      <button class="gallery-thumb-remove" onclick="removeImg(${i})">✕</button>
    </div>`).join('');
}
window.removeImg = (i) => { galleryUrls.splice(i, 1); renderGalleryPreview(); };

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

// ── VIDEO PREVIEW ──
let vDebounce;
document.getElementById('fVideo').addEventListener('input', function () {
  clearTimeout(vDebounce);
  vDebounce = setTimeout(() => {
    const src = embedUrl(this.value.trim());
    document.getElementById('videoPreview').innerHTML = src ? `<iframe src="${src}" allowfullscreen></iframe>` : '';
  }, 700);
});

function embedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) return `https://www.tiktok.com/embed/v2/${tt[1]}`;
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([^/?]+)/);
  if (ig) return `https://www.instagram.com/p/${ig[1]}/embed`;
  return url;
}

// ── SEARCH ──
document.getElementById('searchInput').addEventListener('input', e => { search = e.target.value; render(); });

// ── MODAL ──
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
