-- ============================================================================
-- F1.13 — Proveedores (UI gestor MVP): completar catálogo + activar módulo
-- ----------------------------------------------------------------------------
-- La fila `proveedores` ya existía en catalogo_modulos (área comercial, ADR-066)
-- pero con ruta_bo NULL → el sidebar data-driven (RFC-006) no la renderiza.
-- Esta migración completa la ruta/ícono/capability ("completar ruta_bo de módulos
-- sin página", CURRENT-STATE §4) y activa el módulo para el tenant Hindu.
--
-- Modelo: un proveedor ES una `entidad` (tipo='proveedor'), por eso la capability
-- es entidades.read (que tenant.admin/sistema.admin ya tienen). No se crea una
-- capability nueva sin asignar.
-- ============================================================================

-- (1) Completar la fila del catálogo (idempotente: solo si sigue sin ruta).
UPDATE catalogo_modulos
SET ruta_bo = '/admin/proveedores',
    icono = COALESCE(icono, 'Truck'),
    capability_requerida = COALESCE(capability_requerida, 'entidades.read')
WHERE slug = 'proveedores';

-- (2) Activar el módulo para el tenant Hindu (cross_vertical → requiere tenant_modulos).
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'proveedores', true, now())
ON CONFLICT (tenant_id, modulo_slug) DO UPDATE SET activo = true, fecha_desactivacion = NULL;

-- ============================================================================
-- ROLLBACK:
--   UPDATE catalogo_modulos SET ruta_bo = NULL WHERE slug='proveedores';
--   UPDATE tenant_modulos SET activo=false WHERE tenant_id='11111111-1111-1111-1111-111111111111' AND modulo_slug='proveedores';
-- ============================================================================
