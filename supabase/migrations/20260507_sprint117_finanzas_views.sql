-- Sprint 11.7: Renombres finanzas con VIEWs (D2)
-- Crea VIEWs fin_* apuntando a tablas existentes
-- SECURITY INVOKER para que RLS de la tabla base aplique

CREATE OR REPLACE VIEW fin_cajas WITH (security_invoker = true) AS
SELECT * FROM cajas;

CREATE OR REPLACE VIEW fin_movimientos WITH (security_invoker = true) AS
SELECT * FROM movimientos_caja;

CREATE OR REPLACE VIEW fin_productos WITH (security_invoker = true) AS
SELECT * FROM productos_servicios;

CREATE OR REPLACE VIEW fin_categorias_movimiento WITH (security_invoker = true) AS
SELECT * FROM catalogo_categorias_movimiento;

CREATE OR REPLACE VIEW fin_plan_cuentas WITH (security_invoker = true) AS
SELECT * FROM plan_cuentas;

CREATE OR REPLACE VIEW fin_cuotas_planes WITH (security_invoker = true) AS
SELECT * FROM cuotas_planes;

CREATE OR REPLACE VIEW fin_cuotas_emitidas WITH (security_invoker = true) AS
SELECT * FROM cuotas_emitidas;

CREATE OR REPLACE VIEW fin_emisiones_cuota WITH (security_invoker = true) AS
SELECT * FROM emisiones_cuota;

CREATE OR REPLACE VIEW fin_cuotas_bonificaciones WITH (security_invoker = true) AS
SELECT * FROM cuotas_bonificaciones;

CREATE OR REPLACE VIEW fin_producto_proveedor WITH (security_invoker = true) AS
SELECT * FROM producto_proveedor;
