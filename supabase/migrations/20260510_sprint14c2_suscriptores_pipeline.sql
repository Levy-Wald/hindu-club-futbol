-- Sprint 14c.2 — Pipeline suscriptores_por_equipo
-- Atributo 'suscriptor', pipeline con config especifica, padron vinculado

BEGIN;

-- 1. Atributo 'suscriptor'
INSERT INTO catalogo_atributos (tenant_id, slug, nombre, categoria, descripcion)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'suscriptor',
  'Suscriptor',
  'institucional',
  'Persona que aporta cuota mensual a un equipo sin ser jugador/staff'
)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- 2. Pipeline suscriptores_por_equipo
INSERT INTO import_pipelines (tenant_id, slug, nombre, descripcion, config)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'suscriptores_por_equipo',
  'Suscriptores por equipo',
  'Importa suscriptores agrupados por equipo desde planilla con headers de grupo',
  jsonb_build_object(
    'formato_origen', 'xlsx_grupos',
    'header_regex', 'suscriptos',
    'grupo_sin_equipo', 'Aportan sin equipo',
    'campo_monto', 'monto',
    'match_rules', jsonb_build_array(
      jsonb_build_object('field', 'numero_documento', 'weight', 1.0),
      jsonb_build_object('field', 'nombre_apellido', 'weight', 0.8, 'fuzzy', true)
    ),
    'apply_rules', jsonb_build_array(
      jsonb_build_object(
        'trigger', jsonb_build_object('match_status', jsonb_build_array('exacto', 'probable')),
        'actions', jsonb_build_array(
          jsonb_build_object('type', 'insertar_personas_padrones'),
          jsonb_build_object('type', 'asignar_atributo', 'atributo_slug', 'suscriptor')
        )
      ),
      jsonb_build_object(
        'trigger', jsonb_build_object('match_status', jsonb_build_array('sin_match'), 'decision', 'crear_nueva'),
        'actions', jsonb_build_array(
          jsonb_build_object('type', 'crear_persona_nueva'),
          jsonb_build_object('type', 'insertar_personas_padrones'),
          jsonb_build_object('type', 'asignar_atributo', 'atributo_slug', 'suscriptor')
        )
      )
    )
  )
)
ON CONFLICT (tenant_id, slug) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  config = EXCLUDED.config;

-- 3. Padron vinculado
INSERT INTO padrones (tenant_id, nombre, tipo, activo, pipeline_slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Hindu Futbol Suscriptores 2026',
  'administrativo',
  true,
  'suscriptores_por_equipo'
)
ON CONFLICT DO NOTHING;

COMMIT;
