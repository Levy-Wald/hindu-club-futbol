-- ============================================================================
-- MIGRATION: Sprint 11.5 — Refactor Calendar (Decision D4)
-- Descripcion: Renombrar equipos_horarios → eventos, crear partidos_detalle,
--              absorber personas_eventos_personales, renombrar catalogo.
-- Aplicada via Supabase MCP: 2026-05-07
-- ============================================================================

-- 1. Drop CHECK + Rename table + Make equipo_id nullable
ALTER TABLE equipos_horarios DROP CONSTRAINT IF EXISTS equipos_horarios_tipo_actividad_check;
ALTER TABLE equipos_horarios RENAME TO eventos;
ALTER TABLE eventos ALTER COLUMN equipo_id DROP NOT NULL;

-- 2. Add new columns
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS tipo_evento_slug text;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS estado text DEFAULT 'programado';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS modulo_origen text NOT NULL DEFAULT 'equipos';
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS entidad_origen_id uuid;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS responsable_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS persona_protagonista_id uuid REFERENCES personas(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS visible_para_atributos text[];
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS icono text;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS es_recurrente boolean DEFAULT false;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS recurrencia_regla text;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS evento_padre_id uuid REFERENCES eventos(id) ON DELETE SET NULL;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS serie_uuid uuid;
ALTER TABLE eventos ADD CONSTRAINT eventos_estado_check CHECK (estado IN ('programado','en_curso','completado','cancelado','reprogramado'));

-- 3. Migrate tipo_actividad → tipo_evento_slug
UPDATE eventos SET tipo_evento_slug = CASE
  WHEN tipo_actividad IN ('partido_local','partido_visitante','amistoso','torneo') THEN 'partido'
  WHEN tipo_actividad = 'entrenamiento' THEN 'entrenamiento'
  WHEN tipo_actividad IS NULL THEN 'otro'
  ELSE tipo_actividad
END;
ALTER TABLE eventos ALTER COLUMN tipo_evento_slug SET NOT NULL;

-- 4. Create partidos_detalle (satellite 1:1)
CREATE TABLE IF NOT EXISTS partidos_detalle (
  evento_id uuid PRIMARY KEY REFERENCES eventos(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipo_id uuid REFERENCES equipos(id) ON DELETE SET NULL,
  rival_texto text,
  rival_entidad_id uuid REFERENCES entidades(id) ON DELETE SET NULL,
  condicion text CHECK (condicion IN ('local','visitante','neutral')),
  torneo_slug text,
  marcador_local int,
  marcador_visitante int,
  convocatoria_cerrada boolean DEFAULT false,
  alineacion_esquema_id uuid REFERENCES esquemas_tacticos(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_partidos_detalle_updated ON partidos_detalle;
CREATE TRIGGER trg_partidos_detalle_updated BEFORE UPDATE ON partidos_detalle FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- 5. Populate partidos_detalle
INSERT INTO partidos_detalle (evento_id, tenant_id, equipo_id, rival_texto, condicion)
SELECT e.id, e.tenant_id, e.equipo_id, e.rival,
  CASE WHEN e.tipo_actividad = 'partido_local' THEN 'local'
       WHEN e.tipo_actividad = 'partido_visitante' THEN 'visitante'
       WHEN e.tipo_actividad = 'amistoso' THEN 'neutral'
       ELSE 'local' END
FROM eventos e WHERE e.tipo_evento_slug = 'partido'
ON CONFLICT (evento_id) DO NOTHING;

-- 6. Drop old columns
ALTER TABLE eventos DROP COLUMN IF EXISTS rival;
ALTER TABLE eventos DROP COLUMN IF EXISTS tipo_actividad;

-- 7. RLS on partidos_detalle
ALTER TABLE partidos_detalle ENABLE ROW LEVEL SECURITY;
CREATE POLICY partidos_detalle_select ON partidos_detalle FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));
CREATE POLICY partidos_detalle_insert ON partidos_detalle FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_actual()));
CREATE POLICY partidos_detalle_update ON partidos_detalle FOR UPDATE USING (tenant_id = (SELECT get_tenant_actual()));
CREATE POLICY partidos_detalle_delete ON partidos_detalle FOR DELETE USING (tenant_id = (SELECT get_tenant_actual()));

-- 8. Absorb personas_eventos_personales
INSERT INTO catalogo_tipos_evento_personal (slug, nombre, es_recurrente_anual, orden) VALUES
  ('partido', 'Partido', false, 100), ('entrenamiento', 'Entrenamiento', false, 101),
  ('actividad', 'Actividad general', false, 102), ('mantenimiento', 'Mantenimiento', false, 103),
  ('reserva', 'Reserva', false, 104), ('asamblea', 'Asamblea', false, 105),
  ('torneo', 'Torneo', false, 106), ('liquidacion_pago', 'Liquidacion / Pago', false, 107)
ON CONFLICT (slug) DO NOTHING;
ALTER TABLE catalogo_tipos_evento_personal RENAME TO catalogo_tipos_evento;
DROP TABLE IF EXISTS personas_eventos_personales;

-- 9. Indexes
DROP INDEX IF EXISTS idx_equipos_horarios_fecha;
CREATE INDEX IF NOT EXISTS eventos_tenant_fecha ON eventos(tenant_id, fecha);
CREATE INDEX IF NOT EXISTS eventos_equipo_fecha ON eventos(equipo_id, fecha) WHERE equipo_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS eventos_cancha_fecha ON eventos(cancha_id, fecha) WHERE cancha_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS eventos_responsable ON eventos(responsable_persona_id) WHERE responsable_persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS eventos_modulo_origen ON eventos(modulo_origen, entidad_origen_id);
CREATE INDEX IF NOT EXISTS eventos_serie ON eventos(serie_uuid) WHERE serie_uuid IS NOT NULL;
