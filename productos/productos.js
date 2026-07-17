import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh'
);

let products   = [];
let businesses = {};   // { id: name }
let activeCat  = 'all';
let search     = '';

// ── INIT ──
async function init() {
  // Load businesses for name lookup
  const { data: bizData } = await supabase.from('negocios').select('id, name');
  (bizData || []).forEach(b => { businesses[b.id] = b.name; });

  // Load products
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    document.getElementById('productsGrid').innerHTML =
      `<div class="state-msg"><span>❌</span>${error.message}</div>`;
    return;
  }
  products = data || [];
  buildCatFilter();
  render();
}

// ── CATEGORY PILLS ──
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

// ── RENDER GRID ──
function render() {
  const grid = document.getElementById('productsGrid');
  const q = search.toLowerCase();

  const filtered = products.filter(p => {
    const matchCat  = activeCat === 'all' || p.categoria === activeCat;
    const matchText = !q || p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q);
    return matchCat && matchText;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div class="state-msg"><span>🛍️</span>No se encontraron productos.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const imgs    = Array.isArray(p.galeria) ? p.galeria : [];
    const mainImg = imgs[0] || '';
    const bizName = p.negocio_id ? businesses[p.negocio_id] : null;
    const link    = `producto.html?id=${p.id}`;
    return `
    <a class="product-card" href="${link}">
      <div class="pc-img-wrap">
        ${mainImg
          ? `<img src="${mainImg}" alt="${p.nombre}" loading="lazy" />`
          : `<div class="pc-placeholder">🛍️</div>`}
        ${p.categoria ? `<span class="pc-badge">${p.categoria}</span>` : ''}
        ${p.video_url  ? `<span class="pc-video-badge">▶ Video</span>` : ''}
      </div>
      <div class="pc-body">
        ${p.categoria ? `<div class="pc-cat">${p.categoria}</div>` : ''}
        <div class="pc-name">${p.nombre}</div>
        ${bizName ? `<div class="pc-biz">🏢 ${bizName}</div>` : ''}
        ${p.precio ? `<div class="pc-price">${p.precio}</div>` : ''}
        ${p.stock  ? `<div class="pc-stock">${p.stock}</div>`  : ''}
        <div class="pc-btn">Ver producto</div>
      </div>
    </a>`;
  }).join('');
}

// ── SEARCH ──
document.getElementById('searchInput').addEventListener('input', e => {
  search = e.target.value; render();
});

init();
