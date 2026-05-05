-- ============================================================
-- Migration: Lesiones y Rehabilitaciones
-- Descripcion: Tablas para trackear historial de lesiones y
--              procesos de rehabilitacion de personas.
-- Fecha: 2026-05-05
-- ============================================================

-- --- LESIONES ---

CREATE TABLE IF NOT EXISTS personas_lesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

  -- Datos de la lesion
  tipo_lesion text NOT NULL, -- esguince, fractura, desgarro, contractura, tendinitis, luxacion, otro
  zona_cuerpo text NOT NULL, -- tobillo_izq, rodilla_der, hombro_izq, espalda_baja, etc.
  lateralidad text, -- izquierdo, derecho, bilateral, central
  gravedad text NOT NULL DEFAULT 'moderada', -- leve, moderada, grave, muy_grave
  descripcion text,
  diagnostico text,
  mecanismo_lesion text, -- como ocurrió (ej: "entrada fuerte en partido")

  -- Contexto
  contexto_actividad text, -- entrenamiento, partido_oficial, partido_amistoso, fuera_club
  equipo_id uuid REFERENCES equipos(id),

  -- Fechas
  fecha_lesion date NOT NULL,
  fecha_diagnostico date,
  fecha_alta date,
  dias_baja_estimados integer,
  dias_baja_reales integer,

  -- Profesional que diagnosticó
  profesional_id uuid REFERENCES personas(id),
  profesional_externo_nombre text,
  institucion_diagnostico text,

  -- Estado
  estado text NOT NULL DEFAULT 'activa', -- activa, en_rehabilitacion, alta_parcial, alta_total, recaida
  recurrencia boolean NOT NULL DEFAULT false,
  lesion_relacionada_id uuid REFERENCES personas_lesiones(id),

  -- Sistema
  notas text,
  metadata jsonb DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personas_lesiones_persona ON personas_lesiones(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_lesiones_tenant ON personas_lesiones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personas_lesiones_estado ON personas_lesiones(estado) WHERE activo = true;

-- Trigger updated_at
CREATE OR REPLACE TRIGGER trg_personas_lesiones_updated_at
  BEFORE UPDATE ON personas_lesiones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE personas_lesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_lesiones_tenant_access" ON personas_lesiones
  FOR ALL USING (tenant_id = get_tenant_actual())
  WITH CHECK (tenant_id = get_tenant_actual());


-- --- REHABILITACIONES ---

CREATE TABLE IF NOT EXISTS personas_rehabilitaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  lesion_id uuid REFERENCES personas_lesiones(id) ON DELETE SET NULL,

  -- Datos de la rehabilitacion
  tipo_rehabilitacion text NOT NULL, -- kinesiologia, fisioterapia, cirugia_post, readaptacion_deportiva, otro
  descripcion text,
  objetivos text,

  -- Fechas
  fecha_inicio date NOT NULL,
  fecha_fin_estimada date,
  fecha_fin_real date,

  -- Sesiones
  sesiones_planificadas integer,
  sesiones_completadas integer DEFAULT 0,
  frecuencia_semanal integer, -- veces por semana

  -- Profesional tratante
  profesional_id uuid REFERENCES personas(id),
  profesional_externo_nombre text,
  institucion text,

  -- Estado y progreso
  estado text NOT NULL DEFAULT 'en_curso', -- planificada, en_curso, pausada, completada, abandonada
  progreso_porcentaje integer DEFAULT 0 CHECK (progreso_porcentaje >= 0 AND progreso_porcentaje <= 100),
  resultado_final text, -- alta_total, alta_parcial, sin_mejora, pendiente

  -- Sistema
  notas text,
  metadata jsonb DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_personas_rehabilitaciones_persona ON personas_rehabilitaciones(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_rehabilitaciones_lesion ON personas_rehabilitaciones(lesion_id);
CREATE INDEX IF NOT EXISTS idx_personas_rehabilitaciones_tenant ON personas_rehabilitaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personas_rehabilitaciones_estado ON personas_rehabilitaciones(estado) WHERE activo = true;

-- Trigger updated_at
CREATE OR REPLACE TRIGGER trg_personas_rehabilitaciones_updated_at
  BEFORE UPDATE ON personas_rehabilitaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE personas_rehabilitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personas_rehabilitaciones_tenant_access" ON personas_rehabilitaciones
  FOR ALL USING (tenant_id = get_tenant_actual())
  WITH CHECK (tenant_id = get_tenant_actual());
