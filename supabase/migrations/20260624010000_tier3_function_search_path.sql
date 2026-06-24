-- ============================================================================
-- Tier 3 hardening (SE1-I8) — pin de search_path en funciones propias
-- ----------------------------------------------------------------------------
-- El advisor reportaba 'function_search_path_mutable': funciones sin search_path
-- fijo → un search_path mutable puede ser secuestrado (sobre todo en SECURITY
-- DEFINER). Fix: pinear search_path.
--
-- Se pinea a 'pg_catalog, public' (NO a '') a propósito: muchas funciones usan
-- nombres de tabla SIN calificar (personas, cuotas_emitidas, ...). Con public en
-- el path siguen resolviendo igual, y pg_catalog primero evita shadowing de
-- built-ins. Así se cierra el lint SIN romper comportamiento.
--
-- Se EXCLUYEN las funciones de extensiones (citext, pg_trgm, unaccent): son
-- propiedad de la extensión, no se deben alterar.
-- ============================================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(coalesce(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public', r.oid::regprocedure);
  END LOOP;
END $$;

-- ============================================================================
-- ROLLBACK (no recomendado): por función,
--   ALTER FUNCTION public.<nombre>(<args>) RESET search_path;
-- ============================================================================
