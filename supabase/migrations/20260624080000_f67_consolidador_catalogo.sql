-- F6.7 — Consolidador de Padrones: registrar en catálogo + activar tenant.
INSERT INTO catalogo_modulos (
  slug, nombre, nombre_display, descripcion, categoria, capa,
  ruta_bo, icono, area_sidebar_bo, sub_area_sidebar_bo, orden,
  capability_requerida, interfaz_primaria, activo_global, portable
)
VALUES (
  'padron_consolidado', 'Consolidador de padrones', 'Consolidador',
  'Vista unificada de todos los padrones, entidades y proveedores',
  'troncal', 'cross_vertical',
  '/admin/padrones/consolidado', 'GitMerge', 'personas', 'Padrón', 4,
  'personas.read', 'back_office', true, true
)
ON CONFLICT (slug) DO UPDATE SET
  ruta_bo = EXCLUDED.ruta_bo, icono = EXCLUDED.icono,
  area_sidebar_bo = EXCLUDED.area_sidebar_bo, sub_area_sidebar_bo = EXCLUDED.sub_area_sidebar_bo,
  capability_requerida = EXCLUDED.capability_requerida;

INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'padron_consolidado', true, now())
ON CONFLICT (tenant_id, modulo_slug) DO UPDATE SET activo = true, fecha_desactivacion = NULL;

-- ROLLBACK:
--   DELETE FROM tenant_modulos WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND modulo_slug='padron_consolidado';
--   DELETE FROM catalogo_modulos WHERE slug='padron_consolidado';
