// =============================================
// SUPABASE CONFIG
// =============================================
const { createClient } = supabase;
const db = createClient(
  'https://oumaxwaclbmpvlvdwcnk.supabase.co',
  'sb_publishable_amKjWarZp3n4NVbczuzbig_-u0toExh',
  { realtime: { enabled: false } }
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
    db.from('productos').select('id, nombre, precio, descripcion, galeria, link_compra, created_at')
      .order('created_at', { ascending: false }).limit(3),
  ]);

  const articles = (articlesRes.data || []).map(a => ({
    type: 'article',
    title: a.titulo,
    image: a.imagen_url || 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=400&q=80',
    by: "DAVILA'S MARKETING",
    link: `articulo.html?slug=${a.slug}`,
    created_at: a.created_at,
    price: null,
    desc: null,
  }));

  const products = (productsRes.data || []).map(p => ({
    type: 'product',
    title: p.nombre,
    image: (Array.isArray(p.galeria) && p.galeria[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    price: p.precio || '',
    desc: p.descripcion || '',
    link: `../productos/producto.html?id=${p.id}`,
    created_at: p.created_at,
    by: '🛍️ PRODUCTO',
  }));

  const items = [...articles, ...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  if (!items.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No resources published yet.</p>';
    return;
  }

  grid.innerHTML = items.map(item => {
    let badgeHtml = '';
    if (item.type === 'product') {
      badgeHtml = `<span class="article-by">🛍️ PRODUCTO</span>`;
    } else {
      badgeHtml = `<span class="article-by">BY DAVILA'S MARKETING</span>`;
    }

    let priceHtml = '';
    if (item.price) {
      priceHtml = `<div class="product-price">${item.price}</div>`;
    }

    let descHtml = '';
    if (item.desc) {
      descHtml = `<p class="product-desc">${item.desc}</p>`;
    }

    const btnText = item.type === 'product' ? 'VER PRODUCTO →' : 'READ MORE →';

    return `
    <div class="article-card">
      <img src="${item.image}" alt="${item.title}" loading="lazy" />
      <div class="article-card-body">
        ${badgeHtml}
        <h3>${item.title}</h3>
        ${priceHtml}
        ${descHtml}
        <a href="${item.link}" class="article-link">${btnText}</a>
      </div>
    </div>`;
  }).join('');
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
// CARRUSEL ESTILO XIAOMI
// =============================================

async function loadCarousel() {
  console.log('🔄 Cargando carrusel...');
  const track = document.getElementById('carouselTrack');
  const dotsContainer = document.getElementById('carouselDots');

  const { data: slides, error } = await db
    .from('carrusel_slides')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  console.log('📊 Slides cargados:', slides);
  console.log('❌ Error:', error);

  if (error || !slides || !slides.length) {
    showDefaultSlide();
    return;
  }

  track.innerHTML = slides.map((slide, index) => {
    const color = slide.color_texto || '#ffffff';
    const bgImage = slide.imagen_mobile || slide.imagen || '';
    
    let linkInfo = '#';
    if (slide.producto_id) {
      linkInfo = `../productos/producto.html?id=${slide.producto_id}`;
    } else if (slide.negocio_id) {
      linkInfo = `../negocios/negocio.html?id=${slide.negocio_id}`;
    } else if (slide.link_info) {
      linkInfo = slide.link_info;
    }

    return `
    <div class="carousel-slide" data-index="${index}" style="background-image: url('${bgImage}');">
      <div class="slide-overlay"></div>
      <div class="slide-content" style="color: ${color};">
        ${slide.badge ? `<span class="slide-badge">${slide.badge}</span>` : ''}
        ${slide.subtitulo ? `<span class="slide-eyebrow">${slide.subtitulo}</span>` : ''}
        <h2 class="slide-title">${slide.titulo || ''}</h2>
        ${slide.descripcion ? `<p class="slide-description">${slide.descripcion}</p>` : ''}
        <div class="slide-buttons">
          ${slide.link_compra ? `<a href="${slide.link_compra}" class="btn-primary-carousel" target="_blank">${slide.texto_boton_compra || 'Comprar →'}</a>` : ''}
          ${linkInfo !== '#' ? `<a href="${linkInfo}" class="btn-ghost-carousel">${slide.texto_boton_info || 'Más información'}</a>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  dotsContainer.innerHTML = slides.map((_, i) =>
    `<button class="progress-dot" data-index="${i}" aria-label="Slide ${i+1}"></button>`
  ).join('');

  initCarousel(slides.length);
}

function showDefaultSlide() {
  const track = document.getElementById('carouselTrack');
  const dotsContainer = document.getElementById('carouselDots');

  track.innerHTML = `
    <div class="carousel-slide active" style="background: linear-gradient(135deg, #0d1a35, #1a2d4a);">
      <div class="slide-overlay"></div>
      <div class="slide-content" style="color: #ffffff;">
        <span class="slide-eyebrow">Bienvenido</span>
        <h2 class="slide-title">DAVILA'S<br>Marketing</h2>
        <p class="slide-description">Estrategias digitales efectivas para tu negocio</p>
        <div class="slide-buttons">
          <a href="#contact" class="btn-primary-carousel">Contáctanos →</a>
          <a href="#services" class="btn-ghost-carousel">Nuestros servicios</a>
        </div>
      </div>
    </div>
  `;
  dotsContainer.innerHTML = '<button class="progress-dot active" data-index="0"></button>';
  initCarousel(1);
}

function initCarousel(totalSlides) {
  const track = document.getElementById('carouselTrack');
  const dots = document.querySelectorAll('.progress-dot');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  if (totalSlides <= 1) {
    document.querySelectorAll('.carousel-btn').forEach(el => el.style.display = 'none');
    document.getElementById('carouselDots').style.display = 'none';
    return;
  }

  let currentIndex = 0;
  let intervalId = null;
  const AUTOPLAY_DELAY = 5000;

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
    document.querySelectorAll('.carousel-slide').forEach((slide, i) => {
      slide.classList.toggle('active', i === currentIndex);
    });
  }

  function nextSlide() { goToSlide(currentIndex + 1); }
  function prevSlide() { goToSlide(currentIndex - 1); }

  function startAutoplay() {
    if (intervalId) clearInterval(intervalId);
    if (totalSlides <= 1) return;
    intervalId = setInterval(nextSlide, AUTOPLAY_DELAY);
  }

  function stopAutoplay() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
  }

  const newPrevBtn = prevBtn.cloneNode(true);
  const newNextBtn = nextBtn.cloneNode(true);
  prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
  nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

  newPrevBtn.addEventListener('click', () => { stopAutoplay(); prevSlide(); startAutoplay(); });
  newNextBtn.addEventListener('click', () => { stopAutoplay(); nextSlide(); startAutoplay(); });

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => { stopAutoplay(); goToSlide(index); startAutoplay(); });
  });

  const carousel = document.getElementById('xiaomiCarousel');
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') { stopAutoplay(); prevSlide(); startAutoplay(); }
    else if (e.key === 'ArrowRight') { stopAutoplay(); nextSlide(); startAutoplay(); }
  });

  goToSlide(0);
  startAutoplay();
}

// =============================================
// INIT
// =============================================
renderTesti();
loadClients();
loadBusinesses();
loadCarousel();
loadArticles();