-- =============================================
-- SCHEMA SUPABASE - Davila's Marketing
-- Ejecuta esto en el SQL Editor de Supabase
-- =============================================

-- ── TABLA PRINCIPAL: negocios ──
CREATE TABLE IF NOT EXISTS negocios (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  category         TEXT,
  description      TEXT,
  description_full TEXT,
  phone            TEXT,
  email            TEXT,
  address          TEXT,
  hours            TEXT,
  website          TEXT,
  facebook         TEXT,
  instagram        TEXT,
  whatsapp         TEXT,
  tiktok           TEXT,
  logo_url         TEXT,
  hero_image       TEXT,
  gallery          JSONB DEFAULT '[]',
  services         JSONB DEFAULT '[]',
  reviews          JSONB DEFAULT '[]',
  status           TEXT DEFAULT 'active',
  date             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE negocios ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE negocios ADD COLUMN IF NOT EXISTS hero_settings JSONB DEFAULT '{}'::jsonb;

-- ── TABLA: clientes (logos en el banner) ──
CREATE TABLE IF NOT EXISTS clientes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre     TEXT NOT NULL,
  logo_url   TEXT,
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TABLA: articulos del blog ──
CREATE TABLE IF NOT EXISTS articulos (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo     TEXT NOT NULL,
  contenido  TEXT,
  imagen_url TEXT,
  slug       TEXT UNIQUE NOT NULL,
  publicado  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── TABLA: testimonios ──
CREATE TABLE IF NOT EXISTS testimonios (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre     TEXT NOT NULL,
  texto      TEXT NOT NULL,
  estrellas  INT DEFAULT 5,
  activo     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE negocios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonios ENABLE ROW LEVEL SECURITY;

-- negocios: acceso total público (admin sin auth)
CREATE POLICY "negocios_select" ON negocios FOR SELECT USING (true);
CREATE POLICY "negocios_insert" ON negocios FOR INSERT WITH CHECK (true);
CREATE POLICY "negocios_update" ON negocios FOR UPDATE USING (true);
CREATE POLICY "negocios_delete" ON negocios FOR DELETE USING (true);

-- clientes: solo lectura pública
CREATE POLICY "clientes_select" ON clientes FOR SELECT USING (activo = true);

-- articulos: solo lectura pública (publicados)
CREATE POLICY "articulos_select" ON articulos FOR SELECT USING (publicado = true);

-- testimonios: solo lectura pública
CREATE POLICY "testimonios_select" ON testimonios FOR SELECT USING (activo = true);

-- =============================================
-- DATOS DE EJEMPLO
-- =============================================
INSERT INTO clientes (nombre) VALUES
  ('Davila''s Autos Detailing'),
  ('Restaurante El Sabor'),
  ('Tech Solutions')
ON CONFLICT DO NOTHING;
