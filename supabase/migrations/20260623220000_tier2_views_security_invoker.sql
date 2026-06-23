-- ============================================================================
-- Tier 2 hardening — vistas con security_invoker (cierre F1, calidad)
-- ----------------------------------------------------------------------------
-- El advisor de seguridad de Supabase reportaba 31 ERRORs 'security_definer_view':
-- vistas definidas con SECURITY DEFINER que BYPASSEAN RLS (corren con permisos
-- del owner, no del usuario que consulta) → agujero multi-tenant / de capability.
--
-- Fix estándar (recomendado por Supabase, mismo patrón que v_actores_roles):
-- ALTER VIEW ... SET (security_invoker = on) → la vista respeta la RLS del que
-- consulta. Idempotente: solo toca las que todavía NO tienen security_invoker.
--
-- Vistas afectadas (31): import_pending_teams_v, v_balance_cuentas,
-- v_centros_costo_stats, v_comparativa_equipos, v_concesion_ventas_mensuales,
-- v_concesionarios_resumen, v_cuenta_corriente_persona, v_cuerpo_tecnico,
-- v_cuotas_completas, v_cuotas_resumen_periodo, v_estado_cobranzas, v_libro_mayor,
-- v_notificaciones_no_leidas_por_persona, v_performance_jugadores,
-- v_personas_disciplinas_vigentes, v_personas_equipos_vigentes,
-- v_personas_lesionadas_activas, v_producto_precios_actuales, v_producto_stock_total,
-- v_productos_catalogo, v_resumen_membresias, v_salud_alertas_faltantes,
-- v_salud_autorizaciones, v_salud_contactos_emergencia, v_salud_datos_medicos,
-- v_salud_lesiones, v_salud_obra_social, v_salud_vehiculos, v_scouting_fichas_resumen,
-- v_socios_activos, v_stats_equipo.
-- ============================================================================

DO $$
DECLARE v text;
BEGIN
  FOR v IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
      AND COALESCE(array_to_string(c.reloptions, ',') NOT ILIKE '%security_invoker%', true)
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on)', v);
  END LOOP;
END $$;

-- ROLLBACK: ALTER VIEW public.<nombre> SET (security_invoker = off);  -- (no recomendado)
