-- =============================================
-- SCHEMA SUPABASE - Davila's Marketing
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- Tabla de negocios publicitados
CREATE TABLE negocios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT,
  imagen_url TEXT,
  sitio_web TEXT,
  telefono TEXT,
  email TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de clientes (logos en el banner)
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  logo_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de artículos del blog
CREATE TABLE articulos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  contenido TEXT,
  imagen_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  publicado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de testimonios
CREATE TABLE testimonios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  texto TEXT NOT NULL,
  estrellas INT DEFAULT 5,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) - Lectura pública
-- =============================================
ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública negocios" ON negocios FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública clientes" ON clientes FOR SELECT USING (activo = true);
CREATE POLICY "Lectura pública artículos" ON articulos FOR SELECT USING (publicado = true);
CREATE POLICY "Lectura pública testimonios" ON testimonios FOR SELECT USING (activo = true);

-- =============================================
-- STORAGE BUCKET para imágenes
-- Crea un bucket llamado "negocios-imagenes" en Supabase Storage
-- con política de lectura pública
-- =============================================

-- Datos de ejemplo
INSERT INTO negocios (nombre, descripcion, categoria, imagen_url) VALUES
  ('Restaurante El Sabor', 'Cocina tradicional con los mejores sabores.', 'Restaurante', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80'),
  ('Boutique Moda', 'Ropa y accesorios para toda la familia.', 'Moda', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80'),
  ('Tech Solutions', 'Servicios de tecnología para empresas.', 'Tecnología', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80');

INSERT INTO clientes (nombre) VALUES ('Restaurante El Sabor'), ('Boutique Moda'), ('Tech Solutions');
