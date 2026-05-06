-- ============================================================================
-- MIGRATION: Expansion del plan de cuentas
-- Sprint: 9 (fix)
-- Descripcion: Agrega cuentas comunes para clubes y countries argentinos
--              que faltaban en el seed original (86 cuentas).
-- Idempotente: SI (usa ON CONFLICT DO NOTHING)
-- ============================================================================

DO $$
DECLARE
  t uuid := '11111111-1111-1111-1111-111111111111';
  id_io uuid;
  id_ie uuid;
  id_go uuid;
  id_ga uuid;
  id_oe uuid;
BEGIN
  -- Obtener IDs de las cuentas padre existentes
  SELECT id INTO id_io FROM plan_cuentas WHERE tenant_id = t AND codigo = '4.1';
  SELECT id INTO id_ie FROM plan_cuentas WHERE tenant_id = t AND codigo = '4.2';
  SELECT id INTO id_go FROM plan_cuentas WHERE tenant_id = t AND codigo = '5.2';
  SELECT id INTO id_ga FROM plan_cuentas WHERE tenant_id = t AND codigo = '5.3';
  SELECT id INTO id_oe FROM plan_cuentas WHERE tenant_id = t AND codigo = '5.5';

  -- =========== 4.1 Ingresos Ordinarios (nuevos) ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '4.1.07', 'Buffet / Restaurante', 'ingreso', id_io, 3, true),
    (t, '4.1.08', 'Estacionamiento y Bauleras', 'ingreso', id_io, 3, true),
    (t, '4.1.09', 'Pase Diario / Invitados', 'ingreso', id_io, 3, true),
    (t, '4.1.10', 'Expensas', 'ingreso', id_io, 3, true),
    (t, '4.1.11', 'Cursos y Clinicas', 'ingreso', id_io, 3, true)
  ON CONFLICT (tenant_id, codigo) DO NOTHING;

  -- =========== 4.2 Ingresos Extraordinarios (nuevos) ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '4.2.05', 'Multas y Recargos', 'ingreso', id_ie, 3, true),
    (t, '4.2.06', 'Intereses Ganados', 'ingreso', id_ie, 3, true),
    (t, '4.2.07', 'Diferencia de Cambio Favorable', 'ingreso', id_ie, 3, true)
  ON CONFLICT (tenant_id, codigo) DO NOTHING;

  -- =========== 5.2 Gastos Operativos (nuevos) ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.2.08', 'Vigilancia y Seguridad', 'egreso', id_go, 3, true),
    (t, '5.2.09', 'Jardineria y Parquizacion', 'egreso', id_go, 3, true),
    (t, '5.2.10', 'Mercaderia Buffet / Insumos Gastronomia', 'egreso', id_go, 3, true),
    (t, '5.2.11', 'Costo de Mercaderia Vendida (Shop)', 'egreso', id_go, 3, true)
  ON CONFLICT (tenant_id, codigo) DO NOTHING;

  -- =========== 5.3 Gastos Administrativos (nuevos) ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.3.06', 'Marketing y Publicidad', 'egreso', id_ga, 3, true),
    (t, '5.3.07', 'Comisiones de Pasarelas de Pago (MP, Stripe)', 'egreso', id_ga, 3, true),
    (t, '5.3.08', 'Hosting, Dominios y Software SaaS', 'egreso', id_ga, 3, true)
  ON CONFLICT (tenant_id, codigo) DO NOTHING;

  -- =========== 5.5 Otros Egresos (nuevos) ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.5.04', 'Diferencia de Cambio Desfavorable', 'egreso', id_oe, 3, true),
    (t, '5.5.05', 'Intereses Bancarios Pagados', 'egreso', id_oe, 3, true),
    (t, '5.5.06', 'Intereses por Mora', 'egreso', id_oe, 3, true)
  ON CONFLICT (tenant_id, codigo) DO NOTHING;
END;
$$;
