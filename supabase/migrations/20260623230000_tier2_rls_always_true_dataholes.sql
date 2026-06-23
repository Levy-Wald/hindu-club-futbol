-- ============================================================================
-- Tier 2 hardening — RLS always-true en tablas de DATOS (cierre F1, seguridad)
-- ----------------------------------------------------------------------------
-- El advisor reportaba 'rls_policy_always_true'. La mayoría de los hits son
-- catálogos globales con `SELECT USING (true)` (intencional, lectura compartida).
-- PERO 3 eran tablas de DATOS con una policy LLAMADA "tenant_isolation" que en
-- realidad era `FOR ALL TO public USING (true)` → cero aislamiento multi-tenant.
-- El nombre mentía: cualquiera con la anon key habría visto TODOS los tenants.
--
--   • acceso_logs           (audit trail de control de acceso)
--   • nominas_externas      (links públicos de carga por token)
--   • nomina_externa_items  (submissions de esos links)
--
-- Por qué es seguro tighten: TODOS los write/read paths de estas tablas usan
-- createServiceRoleClient() (bypassa RLS). El flujo público por token NO depende
-- de este USING(true). Restringir a `authenticated + tenant` es defence-in-depth:
-- no rompe ningún path actual y cierra el agujero si alguna vez se consulta con
-- la anon key. Admins autenticados quedan correctamente tenant-scoped.
-- Patrón idéntico al resto del esquema: tenant_id = (SELECT get_tenant_actual()).
-- ============================================================================

-- ── acceso_logs ──
DROP POLICY IF EXISTS acceso_logs_tenant_isolation ON acceso_logs;
CREATE POLICY acceso_logs_tenant_isolation ON acceso_logs
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

-- ── nominas_externas ──
DROP POLICY IF EXISTS nominas_externas_tenant_isolation ON nominas_externas;
CREATE POLICY nominas_externas_tenant_isolation ON nominas_externas
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

-- ── nomina_externa_items ──
DROP POLICY IF EXISTS nomina_items_tenant_isolation ON nomina_externa_items;
CREATE POLICY nomina_items_tenant_isolation ON nomina_externa_items
  FOR ALL TO authenticated
  USING (tenant_id = (SELECT get_tenant_actual()))
  WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

-- ============================================================================
-- ROLLBACK (no recomendado — reabre el agujero):
--   DROP POLICY ... ; CREATE POLICY <nombre> ON <tabla> FOR ALL TO public USING (true);
-- ============================================================================
