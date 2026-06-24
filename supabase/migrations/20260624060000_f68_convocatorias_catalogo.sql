-- F6.8 — Planificador de Partido: registrar módulo en catálogo + activar tenant.
INSERT INTO catalogo_modulos (
  slug, nombre, nombre_display, descripcion, categoria, capa,
  ruta_bo, icono, area_sidebar_bo, sub_area_sidebar_bo, orden,
  capability_requerida, interfaz_primaria, activo_global, portable
)
VALUES (
  'planificador_partido', 'Planificador de partido', 'Convocatorias',
  'Convocatoria de partidos desde el plantel (titular/suplente/convocado)',
  'vertical_ccbp', 'cross_vertical',
  '/admin/convocatorias', 'ClipboardList', 'actividad', 'Partidos', 1,
  NULL, 'back_office', true, true
)
ON CONFLICT (slug) DO UPDATE SET
  ruta_bo = EXCLUDED.ruta_bo, icono = EXCLUDED.icono,
  area_sidebar_bo = EXCLUDED.area_sidebar_bo, sub_area_sidebar_bo = EXCLUDED.sub_area_sidebar_bo;

INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'planificador_partido', true, now())
ON CONFLICT (tenant_id, modulo_slug) DO UPDATE SET activo = true, fecha_desactivacion = NULL;

-- ROLLBACK:
--   DELETE FROM tenant_modulos WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND modulo_slug='planificador_partido';
--   DELETE FROM catalogo_modulos WHERE slug='planificador_partido';
