-- =============================================================================
-- Migration: Campos extra para tenant_config_publica (branding studio)
-- Agrega columnas de tipografia, secciones del home y media
-- =============================================================================

-- Tipografia
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS fuente_titulos text DEFAULT 'Inter';
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS fuente_cuerpo text DEFAULT 'Inter';

-- Secciones del home (visibilidad)
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS seccion_hero_visible boolean DEFAULT true;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS seccion_eventos_visible boolean DEFAULT true;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS seccion_ligas_visible boolean DEFAULT true;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS seccion_capitanes_visible boolean DEFAULT true;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS seccion_contacto_visible boolean DEFAULT true;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS seccion_palmares_visible boolean DEFAULT true;

-- Contenido de secciones del home
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS eventos_titulo text;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS ligas_titulo text;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS capitanes_titulo text;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS capitanes_bajada text;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS contacto_titulo text;
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS palmares_titulo text;

-- Palmares y media (jsonb)
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS palmares jsonb DEFAULT '[]';
ALTER TABLE tenant_config_publica ADD COLUMN IF NOT EXISTS media jsonb DEFAULT '[]';
