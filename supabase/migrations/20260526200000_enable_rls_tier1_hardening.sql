-- Migration: enable_rls_tier1_hardening
-- Applied: 2026-05-26 via Supabase MCP (Claude Opus session)
-- Closes: Deuda Tier 1 de auditoría 26-may-2026 (10 tablas sin RLS)
--
-- Strategy:
-- - 7 global catalogs: ENABLE RLS + SELECT policy for authenticated
-- - 1 anti-abuse table (abuse_blocks): ENABLE RLS without policies (service_role only)
-- - 1 operational table (evento_deportivo): ENABLE RLS + policy inheriting via FK to eventos
-- - 1 backup table (eventos_backup_20260522): DROPPED (0 FKs depending on it)

-- 1. DROP obsolete backup
DROP TABLE IF EXISTS public.eventos_backup_20260522;

-- 2. GLOBAL CATALOGS (7) — SELECT only for authenticated
ALTER TABLE public.catalogo_niveles_validacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_niveles_validacion_select_authenticated
  ON public.catalogo_niveles_validacion
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.tipos_evento_validacion_default ENABLE ROW LEVEL SECURITY;
CREATE POLICY tipos_evento_validacion_default_select_authenticated
  ON public.tipos_evento_validacion_default
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.catalogo_unidades_medida ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_unidades_medida_select_authenticated
  ON public.catalogo_unidades_medida
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.com_variables_disponibles ENABLE ROW LEVEL SECURITY;
CREATE POLICY com_variables_disponibles_select_authenticated
  ON public.com_variables_disponibles
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.catalogo_estados_tarea ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_estados_tarea_select_authenticated
  ON public.catalogo_estados_tarea
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.tipos_lesion ENABLE ROW LEVEL SECURITY;
CREATE POLICY tipos_lesion_select_authenticated
  ON public.tipos_lesion
  FOR SELECT TO authenticated USING (true);

ALTER TABLE public.scouting_dimensiones ENABLE ROW LEVEL SECURITY;
CREATE POLICY scouting_dimensiones_select_authenticated
  ON public.scouting_dimensiones
  FOR SELECT TO authenticated USING (true);

-- 3. ANTI-ABUSE: ENABLE RLS without policies (service_role bypass only)
ALTER TABLE public.abuse_blocks ENABLE ROW LEVEL SECURITY;

-- 4. EVENTO_DEPORTIVO: inherit RLS from eventos via FK
ALTER TABLE public.evento_deportivo ENABLE ROW LEVEL SECURITY;
CREATE POLICY evento_deportivo_inherit_eventos
  ON public.evento_deportivo
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.eventos WHERE eventos.id = evento_deportivo.evento_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.eventos WHERE eventos.id = evento_deportivo.evento_id)
  );
