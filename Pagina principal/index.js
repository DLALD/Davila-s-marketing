// =============================================
// SUPABASE CONFIG
// =============================================
const { createClient } = supabase;
const db = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh'
);

// =============================================
// TESTIMONIALS
// =============================================
const testimonios = [
  { nombre: 'Maria G.',  texto: '"Davila\'s Marketing completely transformed my online presence. In 3 months we doubled my restaurant\'s sales."', inicial: 'M' },
  { nombre: 'Carlos R.', texto: '"The team is incredible. Our SEO improved significantly and we now receive twice as many calls per week."',      inicial: 'C' },
  { nombre: 'Laura P.',  texto: '"Professional, creative, and always available. The best investment I made for my business."',                    inicial: 'L' },
];
let testiIndex = 0;

function renderTesti() {
  const t = testimonios[testiIndex];
  document.getElementById('testiCard').innerHTML = `
    <div class="testi-avatar">${t.inicial}</div>
    <div>
      <p class="testi-name">${t.nombre}</p>
      <div class="stars">★★★★★</div>
      <p class="testi-text">${t.texto}</p>
    </div>`;
}

window.nextTesti = () => { testiIndex = (testiIndex + 1) % testimonios.length; renderTesti(); };
window.prevTesti = () => { testiIndex = (testiIndex - 1 + testimonios.length) % testimonios.length; renderTesti(); };

// =============================================
// LOAD BUSINESSES FROM SUPABASE
// =============================================
async function loadBusinesses() {
  const grid = document.getElementById('businessesGrid');

  const { data, error } = await db
    .from('negocios')
    .select('id, name, description, category, hero_image, website, status, card_color')
    .neq('status', 'inactive')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="loading-spinner">No businesses registered yet.</p>';
    return;
  }

  const DEFAULT_GRADIENTS = [
    ['#f12711','#f5af19'],
    ['#7F00FF','#E100FF'],
    ['#3f2b96','#a8c0ff'],
    ['#11998e','#38ef7d'],
  ];

  grid.innerHTML = data.map((b, i) => {
    const link = `../negocios/negocio.html?id=${b.id}`;
    const colors = b.card_color || {};
    const [dc1, dc2] = DEFAULT_GRADIENTS[i % 4];
    const c1 = colors.c1 || dc1;
    const c2 = colors.c2 || dc2;
    const headerStyle = `background: linear-gradient(to bottom left, ${c1}, ${c2});`;
    const btnStyle    = `background: linear-gradient(to left, ${c1}, ${c2});`;
    const imgHtml = b.hero_image
      ? `<img src="${b.hero_image}" alt="${b.name}" loading="lazy" />`
      : '';
    return `
    <div class="business-card">
      <div class="business-card-header" style="${headerStyle}">
        ${imgHtml}
      </div>
      <div class="business-card-body">
        <span class="business-tag">${b.category || 'Business'}</span>
        <h3><a href="${link}">${b.name}</a></h3>
        <p>${b.description || ''}</p>
        <a href="${link}" class="btn-participate" style="${btnStyle}"><div class="dots_border"></div>VIEW BUSINESS →</a>
      </div>
    </div>`;
  }).join('');
}

// =============================================
// LOAD CLIENTS BANNER FROM SUPABASE
// =============================================
async function loadClients() {
  const track = document.getElementById('clientsTrack');

  const { data, error } = await db
    .from('clientes')
    .select('nombre, logo_url')
    .eq('activo', true)
    .limit(10);

  if (error || !data || !data.length) {
    track.innerHTML = '<span class="client-logo">No clients yet</span>';
    return;
  }

  const items = data.map(c =>
    c.logo_url
      ? `<img src="${c.logo_url}" alt="${c.nombre}" style="height:40px;object-fit:contain;opacity:.7;" />`
      : `<span class="client-logo">${c.nombre}</span>`
  ).join('');
  // duplicate for infinite scroll effect
  track.innerHTML = items + items;
}

// =============================================
// LOAD ARTICLES + PRODUCTS FROM SUPABASE
// =============================================
async function loadArticles() {
  const grid = document.getElementById('articlesGrid');

  const [articlesRes, productsRes] = await Promise.all([
    db.from('articulos').select('titulo, imagen_url, slug, created_at')
      .eq('publicado', true).order('created_at', { ascending: false }).limit(3),
    db.from('negocios').select('name, products, created_at')
      .neq('status', 'inactive').order('created_at', { ascending: false }),
  ]);

  const articles = (articlesRes.data || []).map(a => ({
    type: 'article',
    title: a.titulo,
    image: a.imagen_url || 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&q=80',
    by: "DAVILA'S MARKETING",
    link: `articulo.html?slug=${a.slug}`,
    created_at: a.created_at,
  }));

  const products = [];
  for (const biz of (productsRes.data || [])) {
    const prods = Array.isArray(biz.products) ? biz.products
      : (typeof biz.products === 'string' ? JSON.parse(biz.products) : []);
    for (const p of prods) {
      products.push({
        type: 'product',
        title: p.nombre,
        image: p.imagen_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
        by: biz.name.toUpperCase(),
        price: p.precio || '',
        desc: p.descripcion || '',
        link: p.link || '#',
        created_at: biz.created_at,
      });
    }
  }

  const items = [...articles, ...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No resources published yet.</p>';
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="article-card">
      <img src="${item.image}" alt="${item.title}" loading="lazy" />
      <div class="article-card-body">
        <p class="article-by">${item.type === 'product' ? '🛍️ ' : ''}BY ${item.by}${item.price ? ` &mdash; ${item.price}` : ''}</p>
        <h3>${item.title}</h3>
        ${item.desc ? `<p style="font-size:.82rem;color:var(--text-muted);margin-bottom:12px">${item.desc}</p>` : ''}
        <a href="${item.link}" class="article-link" ${item.type === 'product' ? 'target="_blank"' : ''}>${
          item.type === 'product' ? 'VIEW PRODUCT →' : 'READ MORE →'
        }</a>
      </div>
    </div>`).join('');
}

// =============================================
// HAMBURGER MENU
// =============================================
document.getElementById('hamburger').addEventListener('click', () => {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  links.style.flexDirection = 'column';
  links.style.position = 'absolute';
  links.style.top = '64px';
  links.style.left = '0';
  links.style.right = '0';
  links.style.background = 'var(--dark)';
  links.style.padding = '20px 24px';
  links.style.gap = '16px';
});

// =============================================
// INIT
// =============================================
renderTesti();
loadClients();
loadBusinesses();
loadArticles();
