-- Sprint 11.6: Atributos namespacing (D7)
-- Migra atributos planos a formato {modulo}.{rol}
-- Crea funcion tiene_atributo_namespace()

-- 1. Insertar nuevos atributos namespaced en catalogo_atributos
INSERT INTO catalogo_atributos (tenant_id, slug, nombre, categoria, activo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'sistema.admin', 'Admin del sistema', 'sistema', true),
  ('11111111-1111-1111-1111-111111111111', 'sistema.soporte', 'Soporte técnico', 'sistema', true),
  ('11111111-1111-1111-1111-111111111111', 'tenant.admin', 'Admin del tenant', 'tenant', true),
  ('11111111-1111-1111-1111-111111111111', 'tenant.admin_padron', 'Admin de padrón', 'tenant', true),
  ('11111111-1111-1111-1111-111111111111', 'tenant.editor', 'Editor de contenidos', 'tenant', true),
  ('11111111-1111-1111-1111-111111111111', 'tenant.staff', 'Staff', 'tenant', true),
  ('11111111-1111-1111-1111-111111111111', 'finanzas.admin', 'Admin de finanzas', 'finanzas', true),
  ('11111111-1111-1111-1111-111111111111', 'finanzas.tesorero', 'Tesorero', 'finanzas', true),
  ('11111111-1111-1111-1111-111111111111', 'finanzas.consulta', 'Consulta finanzas', 'finanzas', true),
  ('11111111-1111-1111-1111-111111111111', 'rrhh.admin', 'Admin RRHH', 'laboral', true),
  ('11111111-1111-1111-1111-111111111111', 'rrhh.empleado', 'Empleado', 'laboral', true),
  ('11111111-1111-1111-1111-111111111111', 'rrhh.consulta', 'Consulta RRHH', 'laboral', true),
  ('11111111-1111-1111-1111-111111111111', 'operaciones.coordinador', 'Coordinador operaciones', 'operaciones', true),
  ('11111111-1111-1111-1111-111111111111', 'operaciones.scout', 'Scout', 'operaciones', true),
  ('11111111-1111-1111-1111-111111111111', 'comunicaciones.editor', 'Editor comunicaciones', 'comunicaciones', true)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- 2. Migrar personas_atributos existentes a slugs namespaced
UPDATE personas_atributos SET atributo_slug = 'sistema.admin' WHERE atributo_slug = 'admin_sistema';
UPDATE personas_atributos SET atributo_slug = 'tenant.admin' WHERE atributo_slug = 'admin_tenant';
UPDATE personas_atributos SET atributo_slug = 'sistema.soporte' WHERE atributo_slug = 'soporte';

-- 3. Crear funcion tiene_atributo_namespace(modulo, roles[])
CREATE OR REPLACE FUNCTION tiene_atributo_namespace(p_modulo text, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM personas_atributos pa
    JOIN personas p ON p.id = pa.persona_id
    WHERE p.user_id = auth.uid()
    AND pa.atributo_slug = ANY(
      SELECT p_modulo || '.' || unnest(p_roles)
    )
    AND pa.activo = true
    AND (pa.fecha_fin IS NULL OR pa.fecha_fin > CURRENT_DATE)
  );
$$;
