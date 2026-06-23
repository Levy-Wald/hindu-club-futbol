-- ============================================================================
-- Pasada del menú data-driven — fix de ruta rota (cierre fino F1)
-- ----------------------------------------------------------------------------
-- El módulo `solicitudes` (área personas → Solicitudes) tenía ruta_bo
-- '/admin/solicitudes', pero esa página NO existe (el módulo modules/solicitudes
-- está vacío: solo manifest, sin código). El sidebar data-driven (RFC-006) por
-- ende renderizaba un link que daba 404.
--
-- Fix: nullear ruta_bo. El builder ya no lo renderiza (sin página → no aparece),
-- consistente con la semántica del resto. La fila queda en el catálogo como módulo
-- analizado/sin construir; cuando se cablee /admin/solicitudes se vuelve a setear.
-- ============================================================================

UPDATE catalogo_modulos SET ruta_bo = NULL WHERE slug = 'solicitudes' AND ruta_bo = '/admin/solicitudes';

-- ============================================================================
-- ROLLBACK: UPDATE catalogo_modulos SET ruta_bo='/admin/solicitudes' WHERE slug='solicitudes';
-- ============================================================================
