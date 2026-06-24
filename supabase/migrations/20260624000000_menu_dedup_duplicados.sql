-- ============================================================================
-- Pasada del menú — dedup de entradas duplicadas (cierre fino F1)
-- ----------------------------------------------------------------------------
-- 2 pares de módulos del catálogo apuntaban al MISMO destino y grupo, generando
-- doble ítem en el sidebar:
--   • 'competencias' (Competencias) y 'torneos' (Torneos) → /admin/competencias/torneos
--   • 'rrhh' (Equipo (RRHH)) y 'rrhh_basico' (RRHH) → /admin/rrhh
-- Se conserva el label más específico (Torneos, Equipo (RRHH)) y se desactiva el
-- duplicado nulleando su ruta_bo (el builder data-driven ya no lo renderiza).
--
-- NO se tocan cuotas/socios→/admin/membresias ni comunicaciones_masivas/web→
-- /admin/comunicaciones: son entry-points con label/grupo distintos (intencionales).
-- ============================================================================

UPDATE catalogo_modulos SET ruta_bo = NULL WHERE slug = 'competencias' AND ruta_bo = '/admin/competencias/torneos';
UPDATE catalogo_modulos SET ruta_bo = NULL WHERE slug = 'rrhh_basico' AND ruta_bo = '/admin/rrhh';

-- ============================================================================
-- ROLLBACK:
--   UPDATE catalogo_modulos SET ruta_bo='/admin/competencias/torneos' WHERE slug='competencias';
--   UPDATE catalogo_modulos SET ruta_bo='/admin/rrhh' WHERE slug='rrhh_basico';
-- ============================================================================
