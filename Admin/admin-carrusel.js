// =============================================
// ADMIN — CARRUSEL
// =============================================
import { supabase } from './supabase-client.js';

// ── STATE ──
let slides = [];
let editingSlideId = null;

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── COMPRESS / UPLOAD IMAGE ──
async function compressImage(file) {
  const enabled = document.getElementById('compressEnabled')?.checked ?? true;
  if (!enabled) return file;
  const maxW = 1400;
  const quality = 0.82;
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url);
      resolve(file); };
    img.src = url;
  });
}

async function uploadImage(file) {
  const blob = await compressImage(file);
  const path = `carrusel/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { data, error } = await supabase
    .storage.from('negocios-imagenes')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) { console.error(error); return null; }
  const { data: { publicUrl } } = supabase.storage.from('negocios-imagenes').getPublicUrl(path);
  return publicUrl;
}

// ── CARGAR PRODUCTOS ──
async function loadProductos() {
  const select = document.getElementById('slideProducto');
  if (!select) return;

  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre')
    .order('nombre');

  if (error) {
    console.error('Error loading products:', error);
    return;
  }

  select.innerHTML = '<option value="">— Seleccionar —</option>' +
    productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

// ── CARGAR NEGOCIOS ──
async function loadNegocios() {
  const select = document.getElementById('slideNegocio');
  if (!select) return;

  const { data: negocios, error } = await supabase
    .from('negocios')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('Error loading negocios:', error);
    return;
  }

  select.innerHTML = '<option value="">— Seleccionar —</option>' +
    negocios.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
}

// ── MOSTRAR/OCULTAR CAMPOS SEGÚN TIPO ──
function setupLinkTypeToggle() {
  const linkType = document.getElementById('slideLinkType');
  const productoGroup = document.getElementById('slideProductoGroup');
  const negocioGroup = document.getElementById('slideNegocioGroup');
  const customGroup = document.getElementById('slideCustomLinkGroup');

  linkType.addEventListener('change', function() {
    const val = this.value;
    productoGroup.style.display = val === 'producto' ? 'block' : 'none';
    negocioGroup.style.display = val === 'negocio' ? 'block' : 'none';
    customGroup.style.display = val === 'custom' ? 'block' : 'none';
  });
}

// ── CARGAR SLIDES ──
async function loadSlides() {
  const { data, error } = await supabase
    .from('carrusel_slides')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('Error loading slides:', error);
    return;
  }

  slides = data || [];
  renderSlidesList();
}

// ── RENDER SLIDES ──
function renderSlidesList() {
  const container = document.getElementById('slidesList');
  if (!slides.length) {
    container.innerHTML = `
      <div style="color:var(--text-muted);padding:40px;text-align:center;border:1px dashed var(--border);border-radius:8px;">
        <span style="font-size:2rem;display:block;margin-bottom:10px;">🎠</span>
        No hay slides. Haz clic en "+ Agregar Slide"
      </div>
    `;
    return;
  }

  container.innerHTML = slides.map(s => {
    let asociacion = '—';
    if (s.producto_id) asociacion = '🛍️ Producto';
    else if (s.negocio_id) asociacion = '🏢 Negocio';
    else if (s.link_info) asociacion = '🔗 Link personalizado';

    return `
    <div class="slide-card">
      <div class="slide-card-img">
        ${s.imagen 
          ? `<img src="${s.imagen}" alt="${s.titulo}" />` 
          : `<div class="slide-card-img-placeholder">sin img</div>`
        }
      </div>
      <div class="slide-card-body">
        <div class="title">${s.titulo || 'Sin título'}</div>
        <div class="meta">
          ${s.subtitulo || ''} ${s.badge ? `· ${s.badge}` : ''}
          <span class="badge-link">${asociacion}</span>
          <span style="margin-left:8px;opacity:0.5;">Orden: ${s.orden || 0}</span>
          ${s.activo !== false ? '<span style="color:var(--green);margin-left:8px;">● Activo</span>' : '<span style="color:var(--danger);margin-left:8px;">● Inactivo</span>'}
          ${s.link_compra ? '<span style="margin-left:8px;opacity:0.5;">🛒 con compra</span>' : ''}
        </div>
      </div>
      <div class="slide-card-actions">
        <button class="btn-edit" onclick="editSlide('${s.id}')">✏️</button>
        <button class="btn-delete" onclick="deleteSlide('${s.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

// ── SHOW / HIDE FORM ──
function showSlideForm(slide = null) {
  const container = document.getElementById('slideFormContainer');
  container.classList.add('visible');

  if (slide) {
    document.getElementById('slideFormTitle').textContent = 'Editar Slide';
    document.getElementById('slideEditId').value = slide.id;
    document.getElementById('slideOrden').value = slide.orden || 0;
    document.getElementById('slideTitulo').value = slide.titulo || '';
    document.getElementById('slideSubtitulo').value = slide.subtitulo || '';
    document.getElementById('slideBadge').value = slide.badge || '';
    document.getElementById('slideDescripcion').value = slide.descripcion || '';
    document.getElementById('slideLinkCompra').value = slide.link_compra || '';
    document.getElementById('slideTextoCompra').value = slide.texto_boton_compra || 'Comprar →';
    document.getElementById('slideTextoInfo').value = slide.texto_boton_info || 'Más información';
    document.getElementById('slideColorTexto').value = slide.color_texto || '#ffffff';
    document.getElementById('slideCustomLink').value = slide.link_info || '';

    // Determinar tipo de enlace
    const linkType = document.getElementById('slideLinkType');
    if (slide.producto_id) {
      linkType.value = 'producto';
      document.getElementById('slideProducto').value = slide.producto_id;
    } else if (slide.negocio_id) {
      linkType.value = 'negocio';
      document.getElementById('slideNegocio').value = slide.negocio_id;
    } else if (slide.link_info) {
      linkType.value = 'custom';
      document.getElementById('slideCustomLink').value = slide.link_info;
    } else {
      linkType.value = 'none';
    }
    linkType.dispatchEvent(new Event('change'));

    if (slide.imagen) {
      document.getElementById('slideImagenPreview').innerHTML = `<img src="${slide.imagen}" />`;
      document.getElementById('slideImagen').value = slide.imagen;
    }
    if (slide.imagen_mobile) {
      document.getElementById('slideImagenMobilePreview').innerHTML = `<img src="${slide.imagen_mobile}" />`;
      document.getElementById('slideImagenMobile').value = slide.imagen_mobile;
    }

    document.querySelectorAll('input[name="slideActivo"]').forEach(r => {
      r.checked = r.value === String(slide.activo !== false);
    });

    editingSlideId = slide.id;
  } else {
    document.getElementById('slideFormTitle').textContent = 'Agregar Slide';
    document.getElementById('slideEditId').value = '';
    document.getElementById('slideOrden').value = slides.length;
    document.getElementById('slideTitulo').value = '';
    document.getElementById('slideSubtitulo').value = '';
    document.getElementById('slideBadge').value = '';
    document.getElementById('slideDescripcion').value = '';
    document.getElementById('slideLinkCompra').value = '';
    document.getElementById('slideTextoCompra').value = 'Comprar →';
    document.getElementById('slideTextoInfo').value = 'Más información';
    document.getElementById('slideColorTexto').value = '#ffffff';
    document.getElementById('slideProducto').value = '';
    document.getElementById('slideNegocio').value = '';
    document.getElementById('slideCustomLink').value = '';
    document.getElementById('slideLinkType').value = 'none';
    document.getElementById('slideLinkType').dispatchEvent(new Event('change'));
    document.getElementById('slideImagenPreview').innerHTML = '';
    document.getElementById('slideImagen').value = '';
    document.getElementById('slideImagenMobilePreview').innerHTML = '';
    document.getElementById('slideImagenMobile').value = '';
    document.querySelectorAll('input[name="slideActivo"]').forEach(r => {
      r.checked = r.value === 'true';
    });
    editingSlideId = null;
  }

  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideSlideForm() {
  document.getElementById('slideFormContainer').classList.remove('visible');
  document.getElementById('slideEditId').value = '';
  editingSlideId = null;
}

// ── SAVE SLIDE ──
async function saveSlide() {
  const titulo = document.getElementById('slideTitulo').value.trim();
  if (!titulo) {
    showToast('❌ El título es obligatorio');
    return;
  }

  const imagen = document.getElementById('slideImagen').value.trim();
  if (!imagen) {
    showToast('❌ La imagen principal es obligatoria');
    return;
  }

  // Determinar el tipo de enlace
  const linkType = document.getElementById('slideLinkType').value;
  let producto_id = null;
  let negocio_id = null;
  let link_info = null;

  switch (linkType) {
    case 'producto':
      producto_id = document.getElementById('slideProducto').value || null;
      break;
    case 'negocio':
      negocio_id = document.getElementById('slideNegocio').value || null;
      break;
    case 'custom':
      link_info = document.getElementById('slideCustomLink').value.trim() || null;
      break;
    default:
      break;
  }

  const slideData = {
    orden: parseInt(document.getElementById('slideOrden').value) || 0,
    titulo: titulo,
    subtitulo: document.getElementById('slideSubtitulo').value.trim(),
    badge: document.getElementById('slideBadge').value.trim(),
    descripcion: document.getElementById('slideDescripcion').value.trim(),
    link_compra: document.getElementById('slideLinkCompra').value.trim() || null,
    texto_boton_compra: document.getElementById('slideTextoCompra').value.trim() || 'Comprar →',
    texto_boton_info: document.getElementById('slideTextoInfo').value.trim() || 'Más información',
    producto_id: producto_id,
    negocio_id: negocio_id,
    link_info: link_info,
    color_texto: document.getElementById('slideColorTexto').value || '#ffffff',
    imagen: imagen,
    imagen_mobile: document.getElementById('slideImagenMobile').value.trim() || null,
    activo: document.querySelector('input[name="slideActivo"]:checked')?.value === 'true',
  };

  const editId = document.getElementById('slideEditId').value;
  let error;

  if (editId) {
    ({ error } = await supabase
      .from('carrusel_slides')
      .update(slideData)
      .eq('id', editId));
  } else {
    ({ error } = await supabase
      .from('carrusel_slides')
      .insert(slideData));
  }

  if (error) {
    showToast('❌ Error: ' + error.message);
    return;
  }

  showToast(editId ? '✓ Slide actualizado' : '✓ Slide agregado');
  hideSlideForm();
  loadSlides();
}

// ── EDIT SLIDE ──
window.editSlide = async (id) => {
  const { data: slide, error } = await supabase
    .from('carrusel_slides')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    showToast('❌ Error al cargar slide');
    return;
  }

  showSlideForm(slide);
};

// ── DELETE SLIDE ──
window.deleteSlide = async (id) => {
  if (!confirm('¿Eliminar este slide?')) return;

  const { error } = await supabase
    .from('carrusel_slides')
    .delete()
    .eq('id', id);

  if (error) {
    showToast('❌ Error: ' + error.message);
    return;
  }

  showToast('Slide eliminado');
  loadSlides();
};

// ── EVENTOS ──

// Subir imagen principal
document.getElementById('slideImagenFile')?.addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;
  const preview = document.getElementById('slideImagenPreview');
  preview.innerHTML = '<p style="color:#aaa;font-size:.8rem">Subiendo...</p>';
  const url = await uploadImage(file);
  if (url) {
    document.getElementById('slideImagen').value = url;
    preview.innerHTML = `<img src="${url}" alt="Slide preview" />`;
  } else {
    preview.innerHTML = '<p style="color:#e53e3e;font-size:.8rem">Error al subir</p>';
  }
});

// Subir imagen móvil
document.getElementById('slideImagenMobileFile')?.addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;
  const preview = document.getElementById('slideImagenMobilePreview');
  preview.innerHTML = '<p style="color:#aaa;font-size:.8rem">Subiendo...</p>';
  const url = await uploadImage(file);
  if (url) {
    document.getElementById('slideImagenMobile').value = url;
    preview.innerHTML = `<img src="${url}" alt="Slide mobile preview" />`;
  } else {
    preview.innerHTML = '<p style="color:#e53e3e;font-size:.8rem">Error al subir</p>';
  }
});

// Configurar toggle de tipo de enlace
setupLinkTypeToggle();

// Botones
document.getElementById('btnAddSlide')?.addEventListener('click', () => showSlideForm(null));
document.getElementById('slideCancelBtn')?.addEventListener('click', hideSlideForm);
document.getElementById('slideSaveBtn')?.addEventListener('click', saveSlide);

// ── INIT ──
loadProductos();
loadNegocios();
loadSlides();