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
    .select('id, name, description, category, hero_image, website, status')
    .neq('status', 'inactive')
    .order('created_at', { ascending: false })
    .limit(6);

  if (error || !data || !data.length) {
    grid.innerHTML = '<p class="loading-spinner">No businesses registered yet.</p>';
    return;
  }

  grid.innerHTML = data.map(b => {
    const link = `../negocios/negocio.html?id=${b.id}`;
    return `
    <div class="business-card">
      <div class="business-card-img">
        <img src="${b.hero_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80'}"
             alt="${b.name}" loading="lazy" />
      </div>
      <div class="business-card-body">
        <span class="business-tag">${b.category || 'Business'}</span>
        <h3><a href="${link}">${b.name}</a></h3>
        <p>${b.description || ''}</p>
        <a href="${link}" class="btn-participate">VIEW BUSINESS →</a>
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
// LOAD ARTICLES FROM SUPABASE
// =============================================
async function loadArticles() {
  const grid = document.getElementById('articlesGrid');

  const { data, error } = await db
    .from('articulos')
    .select('titulo, imagen_url, slug')
    .eq('publicado', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error || !data || !data.length) {
    grid.innerHTML = '<p style="color:#aaa;text-align:center;grid-column:1/-1">No articles published yet.</p>';
    return;
  }

  grid.innerHTML = data.map(a => `
    <div class="article-card">
      <img src="${a.imagen_url || 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&q=80'}" alt="${a.titulo}" loading="lazy" />
      <div class="article-card-body">
        <p class="article-by">BY DAVILA'S MARKETING</p>
        <h3>${a.titulo}</h3>
        <a href="articulo.html?slug=${a.slug}" class="article-link">READ MORE →</a>
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
