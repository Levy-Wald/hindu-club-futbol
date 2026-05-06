-- Fix: producto_proveedor era la única tabla sin RLS habilitada
-- Agujero de seguridad multi-tenant detectado en auditoría

ALTER TABLE producto_proveedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY producto_proveedor_tenant_select ON producto_proveedor
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY producto_proveedor_tenant_insert ON producto_proveedor
  FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY producto_proveedor_tenant_update ON producto_proveedor
  FOR UPDATE USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY producto_proveedor_tenant_delete ON producto_proveedor
  FOR DELETE USING (tenant_id = (SELECT get_tenant_actual()));
