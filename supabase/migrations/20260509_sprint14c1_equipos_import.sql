-- Sprint 14c.1: Columnas import en equipos + resolver_o_crear_equipo + pipeline jugadores

-- 1.1 Columnas en equipos
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS requiere_revision boolean NOT NULL DEFAULT false;
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS created_via_import_run uuid REFERENCES import_runs(id);
CREATE INDEX IF NOT EXISTS equipos_requiere_revision_idx ON equipos(tenant_id) WHERE requiere_revision = true;

-- 1.2 Extend apply_status CHECK
ALTER TABLE import_rows DROP CONSTRAINT IF EXISTS import_rows_apply_status_check;
ALTER TABLE import_rows ADD CONSTRAINT import_rows_apply_status_check
  CHECK (apply_status IN ('pendiente', 'aplicado', 'fallado', 'descartado', 'pendiente_revision_equipo'));

-- 1.3 Función resolver_o_crear_equipo
CREATE OR REPLACE FUNCTION resolver_o_crear_equipo(
  p_tenant_id uuid,
  p_nombre text,
  p_disciplina text,
  p_run_id uuid DEFAULT NULL
)
RETURNS TABLE(equipo_id uuid, fue_creado boolean, requiere_revision boolean)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_equipo_id uuid;
  v_requiere boolean;
BEGIN
  SELECT e.id, e.requiere_revision INTO v_equipo_id, v_requiere
  FROM equipos e
  WHERE e.tenant_id = p_tenant_id
    AND e.activo = true
    AND lower(public.unaccent(trim(e.nombre))) = lower(public.unaccent(trim(p_nombre)))
    AND (e.disciplina_slug = p_disciplina OR p_disciplina IS NULL)
  LIMIT 1;

  IF v_equipo_id IS NOT NULL THEN
    RETURN QUERY SELECT v_equipo_id, false::boolean, v_requiere;
    RETURN;
  END IF;

  INSERT INTO equipos (tenant_id, nombre, disciplina_slug, requiere_revision, created_via_import_run, activo)
  VALUES (p_tenant_id, trim(p_nombre), coalesce(p_disciplina, 'futbol'), true, p_run_id, true)
  RETURNING id INTO v_equipo_id;

  RETURN QUERY SELECT v_equipo_id, true::boolean, true::boolean;
END;
$$;

-- 1.4 Vista equipos pendientes
CREATE OR REPLACE VIEW import_pending_teams_v AS
SELECT
  e.id AS equipo_id,
  e.nombre,
  e.disciplina_slug,
  e.tenant_id,
  e.created_via_import_run AS run_id,
  e.created_at
FROM equipos e
WHERE e.requiere_revision = true
  AND e.activo = true;

-- 1.5 Pipeline jugadores_por_equipo
INSERT INTO import_pipelines (tenant_id, slug, nombre, descripcion, modo, parser_strategy, match_thresholds, field_mappings, apply_rules, config)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'jugadores_por_equipo',
  'Jugadores por Equipo',
  'Listado de jugadores agrupados por equipo, sin DNI',
  'mixto',
  'agrupado_por_grupo',
  '{"high": 0.92, "low": 0.60}'::jsonb,
  '[
    {"col_origen": "nombre_completo", "campo_destino": "nombre_completo", "transform": "split_apellido_nombre"},
    {"col_origen": "equipo_nombre", "campo_destino": "equipo_nombre", "transform": "trim"}
  ]'::jsonb,
  '[
    {
      "trigger": "match_status IN (''exacto'',''auto_fuzzy'',''manual_review'')",
      "acciones": [
        {"tipo": "agregar_atributo", "atributo_slug": "jugador"},
        {"tipo": "agregar_deporte_secundario", "valor": "futbol"},
        {"tipo": "insertar_personas_equipos", "equipo_resolver": "from_parsed.equipo_nombre"}
      ]
    },
    {
      "trigger": "match_status = ''sin_match''",
      "acciones": [
        {"tipo": "crear_persona_nueva", "campos_default": {"deporte_principal_slug": "futbol"}, "atributos_iniciales": ["jugador"]},
        {"tipo": "insertar_personas_equipos", "equipo_resolver": "from_parsed.equipo_nombre"}
      ]
    }
  ]'::jsonb,
  '{
    "header_pattern": "^([A-Z][A-Z\\s\\-\\(\\)0-9]+?)\\s*[—–-]\\s*\\d+\\s+(jugadores|suscriptores)",
    "header_capture_group": 1,
    "item_pattern": "^\\s*\\d+[,\\.\\s]+(.+?)\\s*$",
    "item_capture_group": 1,
    "campo_grupo": "equipo_nombre",
    "campo_item": "nombre_completo",
    "disciplina_default": "futbol",
    "rol_equipo_default": "jugador"
  }'::jsonb
)
ON CONFLICT (tenant_id, slug) DO UPDATE SET
  field_mappings = EXCLUDED.field_mappings,
  apply_rules = EXCLUDED.apply_rules,
  config = EXCLUDED.config,
  match_thresholds = EXCLUDED.match_thresholds,
  parser_strategy = EXCLUDED.parser_strategy;
