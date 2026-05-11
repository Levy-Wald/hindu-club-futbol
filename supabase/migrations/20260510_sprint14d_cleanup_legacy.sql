-- Sprint 14d: Cleanup legacy systems
-- 1. Drop legacy padron sync tables
DROP TABLE IF EXISTS padron_sync_diffs CASCADE;
DROP TABLE IF EXISTS padron_syncs CASCADE;

-- 2. Drop unused fin_* backward-compat views
DROP VIEW IF EXISTS fin_cajas;
DROP VIEW IF EXISTS fin_movimientos;
DROP VIEW IF EXISTS fin_productos;
DROP VIEW IF EXISTS fin_cuotas;
DROP VIEW IF EXISTS fin_planes;
DROP VIEW IF EXISTS fin_bonificaciones;
DROP VIEW IF EXISTS fin_cuentas;
DROP VIEW IF EXISTS fin_movimientos_cuenta;
DROP VIEW IF EXISTS fin_convenios;
DROP VIEW IF EXISTS fin_cuotas_convenio;

-- 3. Cleanup duplicate old-style atributos (0 personas assigned)
DELETE FROM catalogo_atributos WHERE slug IN ('admin_sistema', 'admin_tenant', 'admin_padron');
