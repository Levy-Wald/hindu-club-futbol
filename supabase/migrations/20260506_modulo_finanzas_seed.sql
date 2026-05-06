-- ============================================================================
-- SEED: Módulo Finanzas para Hindu Club
-- Tenant: 11111111-1111-1111-1111-111111111111
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Activar módulo finanzas para Hindu
-- ---------------------------------------------------------------------------
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES ('11111111-1111-1111-1111-111111111111', 'finanzas', true, now())
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Config financiera
-- ---------------------------------------------------------------------------
INSERT INTO config_financiera (tenant_id, moneda_principal, moneda_equivalencia, mora_automatica, mora_porcentaje_default, mora_dias_gracia_default)
VALUES ('11111111-1111-1111-1111-111111111111', 'ARS', 'USD', true, 5.00, 10)
ON CONFLICT (tenant_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Plan de cuentas (operativo argentino para clubes/PyMEs)
-- ---------------------------------------------------------------------------
-- Usamos DO block para insertar jerárquicamente con IDs referenciables
DO $$
DECLARE
  t uuid := '11111111-1111-1111-1111-111111111111';
  -- Nivel 1 (rubros)
  id_activo uuid;
  id_pasivo uuid;
  id_pn uuid;
  id_ingresos uuid;
  id_egresos uuid;
  -- Nivel 2
  id_ac uuid; id_anc uuid;
  id_pc uuid; id_pnc uuid;
  id_cap uuid; id_res uuid;
  id_io uuid; id_ie uuid;
  id_gp uuid; id_go uuid; id_ga uuid; id_gact uuid; id_oe uuid;
  -- Nivel 3
  id_cyb uuid; id_cred uuid; id_bc uuid;
  id_dcom uuid; id_dsoc uuid; id_dfisc uuid;
BEGIN
  -- =========== 1. ACTIVO ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, nivel, es_imputable) VALUES
    (t, '1', 'ACTIVO', 'activo', 1, false) RETURNING id INTO id_activo;

  -- 1.1 Activo Corriente
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1', 'Activo Corriente', 'activo', id_activo, 2, false) RETURNING id INTO id_ac;

  -- 1.1.01 Caja y Bancos
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1.01', 'Caja y Bancos', 'activo', id_ac, 3, false) RETURNING id INTO id_cyb;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1.01.001', 'Caja General', 'activo', id_cyb, 4, true),
    (t, '1.1.01.002', 'Caja Chica', 'activo', id_cyb, 4, true),
    (t, '1.1.01.003', 'Banco Cuenta Corriente', 'activo', id_cyb, 4, true),
    (t, '1.1.01.004', 'Banco Caja de Ahorro', 'activo', id_cyb, 4, true),
    (t, '1.1.01.005', 'MercadoPago', 'activo', id_cyb, 4, true),
    (t, '1.1.01.006', 'Valores a Depositar', 'activo', id_cyb, 4, true);

  -- 1.1.02 Créditos
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1.02', 'Créditos', 'activo', id_ac, 3, false) RETURNING id INTO id_cred;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1.02.001', 'Cuotas Sociales a Cobrar', 'activo', id_cred, 4, true),
    (t, '1.1.02.002', 'Deudores Varios', 'activo', id_cred, 4, true),
    (t, '1.1.02.003', 'Actividades a Cobrar', 'activo', id_cred, 4, true),
    (t, '1.1.02.004', 'Anticipos a Proveedores', 'activo', id_cred, 4, true);

  -- 1.1.03 Bienes de Cambio
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1.03', 'Bienes de Cambio', 'activo', id_ac, 3, false) RETURNING id INTO id_bc;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.1.03.001', 'Mercadería (Shop)', 'activo', id_bc, 4, true),
    (t, '1.1.03.002', 'Insumos Deportivos', 'activo', id_bc, 4, true);

  -- 1.2 Activo No Corriente
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.2', 'Activo No Corriente', 'activo', id_activo, 2, false) RETURNING id INTO id_anc;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.2.01', 'Bienes de Uso', 'activo', id_anc, 3, false);

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '1.2.01.001', 'Inmuebles', 'activo', (SELECT id FROM plan_cuentas WHERE tenant_id = t AND codigo = '1.2.01'), 4, true),
    (t, '1.2.01.002', 'Equipamiento Deportivo', 'activo', (SELECT id FROM plan_cuentas WHERE tenant_id = t AND codigo = '1.2.01'), 4, true),
    (t, '1.2.01.003', 'Muebles y Útiles', 'activo', (SELECT id FROM plan_cuentas WHERE tenant_id = t AND codigo = '1.2.01'), 4, true),
    (t, '1.2.01.004', 'Rodados', 'activo', (SELECT id FROM plan_cuentas WHERE tenant_id = t AND codigo = '1.2.01'), 4, true);

  -- =========== 2. PASIVO ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, nivel, es_imputable) VALUES
    (t, '2', 'PASIVO', 'pasivo', 1, false) RETURNING id INTO id_pasivo;

  -- 2.1 Pasivo Corriente
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1', 'Pasivo Corriente', 'pasivo', id_pasivo, 2, false) RETURNING id INTO id_pc;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1.01', 'Deudas Comerciales', 'pasivo', id_pc, 3, false) RETURNING id INTO id_dcom;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1.01.001', 'Proveedores', 'pasivo', id_dcom, 4, true),
    (t, '2.1.01.002', 'Acreedores Varios', 'pasivo', id_dcom, 4, true);

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1.02', 'Deudas Sociales', 'pasivo', id_pc, 3, false) RETURNING id INTO id_dsoc;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1.02.001', 'Remuneraciones a Pagar', 'pasivo', id_dsoc, 4, true),
    (t, '2.1.02.002', 'Cargas Sociales a Pagar', 'pasivo', id_dsoc, 4, true);

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1.03', 'Deudas Fiscales', 'pasivo', id_pc, 3, false) RETURNING id INTO id_dfisc;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.1.03.001', 'IVA a Pagar', 'pasivo', id_dfisc, 4, true),
    (t, '2.1.03.002', 'IIBB a Pagar', 'pasivo', id_dfisc, 4, true),
    (t, '2.1.03.003', 'Retenciones a Depositar', 'pasivo', id_dfisc, 4, true);

  -- 2.2 Pasivo No Corriente
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.2', 'Pasivo No Corriente', 'pasivo', id_pasivo, 2, false) RETURNING id INTO id_pnc;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '2.2.01', 'Deudas a Largo Plazo', 'pasivo', id_pnc, 3, true);

  -- =========== 3. PATRIMONIO NETO ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, nivel, es_imputable) VALUES
    (t, '3', 'PATRIMONIO NETO', 'patrimonio_neto', 1, false) RETURNING id INTO id_pn;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '3.1', 'Capital', 'patrimonio_neto', id_pn, 2, false) RETURNING id INTO id_cap;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '3.1.01', 'Capital Social', 'patrimonio_neto', id_cap, 3, true);

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '3.2', 'Resultados', 'patrimonio_neto', id_pn, 2, false) RETURNING id INTO id_res;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '3.2.01', 'Resultados Acumulados', 'patrimonio_neto', id_res, 3, true),
    (t, '3.2.02', 'Resultado del Ejercicio', 'patrimonio_neto', id_res, 3, true);

  -- =========== 4. INGRESOS ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, nivel, es_imputable) VALUES
    (t, '4', 'INGRESOS', 'ingreso', 1, false) RETURNING id INTO id_ingresos;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '4.1', 'Ingresos Ordinarios', 'ingreso', id_ingresos, 2, false) RETURNING id INTO id_io;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '4.1.01', 'Cuotas Sociales', 'ingreso', id_io, 3, true),
    (t, '4.1.02', 'Inscripciones', 'ingreso', id_io, 3, true),
    (t, '4.1.03', 'Actividades Aranceladas', 'ingreso', id_io, 3, true),
    (t, '4.1.04', 'Alquileres', 'ingreso', id_io, 3, true),
    (t, '4.1.05', 'Ventas Shop', 'ingreso', id_io, 3, true),
    (t, '4.1.06', 'Eventos', 'ingreso', id_io, 3, true);

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '4.2', 'Ingresos Extraordinarios', 'ingreso', id_ingresos, 2, false) RETURNING id INTO id_ie;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '4.2.01', 'Donaciones', 'ingreso', id_ie, 3, true),
    (t, '4.2.02', 'Subsidios', 'ingreso', id_ie, 3, true),
    (t, '4.2.03', 'Sponsors', 'ingreso', id_ie, 3, true),
    (t, '4.2.04', 'Otros Ingresos', 'ingreso', id_ie, 3, true);

  -- =========== 5. EGRESOS ===========
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, nivel, es_imputable) VALUES
    (t, '5', 'EGRESOS', 'egreso', 1, false) RETURNING id INTO id_egresos;

  -- 5.1 Gastos de Personal
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.1', 'Gastos de Personal', 'egreso', id_egresos, 2, false) RETURNING id INTO id_gp;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.1.01', 'Remuneraciones', 'egreso', id_gp, 3, true),
    (t, '5.1.02', 'Cargas Sociales', 'egreso', id_gp, 3, true),
    (t, '5.1.03', 'Honorarios Profesionales', 'egreso', id_gp, 3, true),
    (t, '5.1.04', 'ART y Seguros Personal', 'egreso', id_gp, 3, true);

  -- 5.2 Gastos Operativos
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.2', 'Gastos Operativos', 'egreso', id_egresos, 2, false) RETURNING id INTO id_go;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.2.01', 'Servicios (Luz, Gas, Agua, Internet)', 'egreso', id_go, 3, true),
    (t, '5.2.02', 'Mantenimiento y Reparaciones', 'egreso', id_go, 3, true),
    (t, '5.2.03', 'Seguros', 'egreso', id_go, 3, true),
    (t, '5.2.04', 'Impuestos y Tasas', 'egreso', id_go, 3, true),
    (t, '5.2.05', 'Insumos Deportivos', 'egreso', id_go, 3, true),
    (t, '5.2.06', 'Indumentaria', 'egreso', id_go, 3, true),
    (t, '5.2.07', 'Limpieza', 'egreso', id_go, 3, true);

  -- 5.3 Gastos Administrativos
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.3', 'Gastos Administrativos', 'egreso', id_egresos, 2, false) RETURNING id INTO id_ga;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.3.01', 'Papelería y Útiles', 'egreso', id_ga, 3, true),
    (t, '5.3.02', 'Sistemas y Software', 'egreso', id_ga, 3, true),
    (t, '5.3.03', 'Gastos Bancarios', 'egreso', id_ga, 3, true),
    (t, '5.3.04', 'Gastos Legales y Notariales', 'egreso', id_ga, 3, true),
    (t, '5.3.05', 'Contaduría', 'egreso', id_ga, 3, true);

  -- 5.4 Gastos de Actividades
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.4', 'Gastos de Actividades', 'egreso', id_egresos, 2, false) RETURNING id INTO id_gact;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.4.01', 'Transporte y Viáticos', 'egreso', id_gact, 3, true),
    (t, '5.4.02', 'Arbitrajes', 'egreso', id_gact, 3, true),
    (t, '5.4.03', 'Federaciones y Ligas', 'egreso', id_gact, 3, true),
    (t, '5.4.04', 'Torneos y Competencias', 'egreso', id_gact, 3, true),
    (t, '5.4.05', 'Alquiler de Canchas', 'egreso', id_gact, 3, true);

  -- 5.5 Otros Egresos
  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.5', 'Otros Egresos', 'egreso', id_egresos, 2, false) RETURNING id INTO id_oe;

  INSERT INTO plan_cuentas (tenant_id, codigo, nombre, tipo, cuenta_padre_id, nivel, es_imputable) VALUES
    (t, '5.5.01', 'Depreciaciones', 'egreso', id_oe, 3, true),
    (t, '5.5.02', 'Donaciones Realizadas', 'egreso', id_oe, 3, true),
    (t, '5.5.03', 'Otros Egresos', 'egreso', id_oe, 3, true);
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Categorías de movimiento (seed si no existen)
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_categorias_movimiento (tenant_id, slug, nombre, tipo, descripcion, orden) VALUES
  ('11111111-1111-1111-1111-111111111111', 'cuota_social', 'Cuota Social', 'ingreso', 'Cobro de cuota de socio', 1),
  ('11111111-1111-1111-1111-111111111111', 'inscripcion', 'Inscripción', 'ingreso', 'Cobro de inscripción', 2),
  ('11111111-1111-1111-1111-111111111111', 'venta_shop', 'Venta Shop', 'ingreso', 'Venta de productos del shop', 3),
  ('11111111-1111-1111-1111-111111111111', 'alquiler', 'Alquiler', 'ingreso', 'Alquiler de instalaciones', 4),
  ('11111111-1111-1111-1111-111111111111', 'evento', 'Evento', 'ingreso', 'Ingreso por eventos', 5),
  ('11111111-1111-1111-1111-111111111111', 'actividad', 'Actividad Arancelada', 'ingreso', 'Cobro de actividades', 6),
  ('11111111-1111-1111-1111-111111111111', 'donacion_recibida', 'Donación Recibida', 'ingreso', 'Donación recibida', 7),
  ('11111111-1111-1111-1111-111111111111', 'sponsor', 'Sponsor', 'ingreso', 'Ingreso por sponsoreo', 8),
  ('11111111-1111-1111-1111-111111111111', 'otro_ingreso', 'Otro Ingreso', 'ingreso', 'Otros ingresos', 9),
  ('11111111-1111-1111-1111-111111111111', 'compra_insumos', 'Compra de Insumos', 'egreso', 'Compra de insumos deportivos o generales', 10),
  ('11111111-1111-1111-1111-111111111111', 'salario', 'Salario', 'egreso', 'Pago de remuneraciones', 11),
  ('11111111-1111-1111-1111-111111111111', 'honorarios', 'Honorarios', 'egreso', 'Pago de honorarios profesionales', 12),
  ('11111111-1111-1111-1111-111111111111', 'servicios', 'Servicios', 'egreso', 'Luz, gas, agua, internet, teléfono', 13),
  ('11111111-1111-1111-1111-111111111111', 'mantenimiento', 'Mantenimiento', 'egreso', 'Mantenimiento de instalaciones', 14),
  ('11111111-1111-1111-1111-111111111111', 'seguros', 'Seguros', 'egreso', 'Pago de pólizas de seguro', 15),
  ('11111111-1111-1111-1111-111111111111', 'impuestos', 'Impuestos y Tasas', 'egreso', 'IIBB, ABL, tasas municipales', 16),
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'Federación/Liga', 'egreso', 'Cuotas y aranceles de federaciones', 17),
  ('11111111-1111-1111-1111-111111111111', 'arbitraje', 'Arbitraje', 'egreso', 'Pago de árbitros', 18),
  ('11111111-1111-1111-1111-111111111111', 'transporte', 'Transporte', 'egreso', 'Viáticos, combustible, peajes', 19),
  ('11111111-1111-1111-1111-111111111111', 'otro_egreso', 'Otro Egreso', 'egreso', 'Otros egresos', 20),
  ('11111111-1111-1111-1111-111111111111', 'transferencia_interna', 'Transferencia Interna', 'transferencia', 'Movimiento entre cajas propias', 21)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Medios de pago
-- ---------------------------------------------------------------------------
INSERT INTO medios_pago (tenant_id, slug, nombre, tipo, comision_porcentaje, requiere_comprobante, orden) VALUES
  ('11111111-1111-1111-1111-111111111111', 'efectivo', 'Efectivo', 'efectivo', 0, true, 1),
  ('11111111-1111-1111-1111-111111111111', 'transferencia_bancaria', 'Transferencia Bancaria', 'banco', 0, true, 2),
  ('11111111-1111-1111-1111-111111111111', 'debito', 'Tarjeta de Débito', 'tarjeta', 1.50, true, 3),
  ('11111111-1111-1111-1111-111111111111', 'credito', 'Tarjeta de Crédito', 'tarjeta', 3.50, true, 4),
  ('11111111-1111-1111-1111-111111111111', 'mercadopago', 'MercadoPago', 'digital', 4.99, true, 5),
  ('11111111-1111-1111-1111-111111111111', 'cheque', 'Cheque', 'cheque', 0, true, 6),
  ('11111111-1111-1111-1111-111111111111', 'debito_automatico', 'Débito Automático', 'debito_automatico', 1.00, false, 7)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Tipos de comprobante
-- ---------------------------------------------------------------------------
INSERT INTO tipos_comprobante (tenant_id, slug, nombre, codigo_afip, letra, es_fiscal, orden) VALUES
  ('11111111-1111-1111-1111-111111111111', 'factura_a', 'Factura A', '001', 'A', true, 1),
  ('11111111-1111-1111-1111-111111111111', 'factura_b', 'Factura B', '006', 'B', true, 2),
  ('11111111-1111-1111-1111-111111111111', 'factura_c', 'Factura C', '011', 'C', true, 3),
  ('11111111-1111-1111-1111-111111111111', 'nota_credito_a', 'Nota de Crédito A', '003', 'A', true, 4),
  ('11111111-1111-1111-1111-111111111111', 'nota_credito_b', 'Nota de Crédito B', '008', 'B', true, 5),
  ('11111111-1111-1111-1111-111111111111', 'nota_credito_c', 'Nota de Crédito C', '013', 'C', true, 6),
  ('11111111-1111-1111-1111-111111111111', 'nota_debito_a', 'Nota de Débito A', '002', 'A', true, 7),
  ('11111111-1111-1111-1111-111111111111', 'nota_debito_b', 'Nota de Débito B', '007', 'B', true, 8),
  ('11111111-1111-1111-1111-111111111111', 'recibo_x', 'Recibo X', NULL, 'X', false, 9),
  ('11111111-1111-1111-1111-111111111111', 'ticket', 'Ticket', NULL, NULL, false, 10),
  ('11111111-1111-1111-1111-111111111111', 'remito', 'Remito', NULL, NULL, false, 11),
  ('11111111-1111-1111-1111-111111111111', 'sin_comprobante', 'Sin Comprobante', NULL, NULL, false, 12)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Cajas iniciales (vinculadas a cuentas del plan)
-- ---------------------------------------------------------------------------
INSERT INTO cajas (tenant_id, nombre, tipo, moneda, saldo_actual, cuenta_id, descripcion)
SELECT
  '11111111-1111-1111-1111-111111111111',
  'Caja General',
  'efectivo',
  'ARS',
  0,
  pc.id,
  'Caja principal del club'
FROM plan_cuentas pc
WHERE pc.tenant_id = '11111111-1111-1111-1111-111111111111' AND pc.codigo = '1.1.01.001';

INSERT INTO cajas (tenant_id, nombre, tipo, moneda, saldo_actual, cuenta_id, descripcion)
SELECT
  '11111111-1111-1111-1111-111111111111',
  'Caja Chica',
  'efectivo',
  'ARS',
  0,
  pc.id,
  'Gastos menores del día a día'
FROM plan_cuentas pc
WHERE pc.tenant_id = '11111111-1111-1111-1111-111111111111' AND pc.codigo = '1.1.01.002';

INSERT INTO cajas (tenant_id, nombre, tipo, moneda, saldo_actual, cuenta_id, descripcion)
SELECT
  '11111111-1111-1111-1111-111111111111',
  'Banco CC',
  'banco',
  'ARS',
  0,
  pc.id,
  'Cuenta corriente bancaria'
FROM plan_cuentas pc
WHERE pc.tenant_id = '11111111-1111-1111-1111-111111111111' AND pc.codigo = '1.1.01.003';

-- ---------------------------------------------------------------------------
-- 8. Centro de costo: General
-- ---------------------------------------------------------------------------
INSERT INTO centros_costo (tenant_id, nombre, codigo, tipo)
VALUES ('11111111-1111-1111-1111-111111111111', 'General', 'GEN', 'general')
ON CONFLICT (tenant_id, codigo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Período contable actual
-- ---------------------------------------------------------------------------
INSERT INTO periodos_contables (tenant_id, anio, mes, estado)
VALUES ('11111111-1111-1111-1111-111111111111', 2026, 5, 'abierto')
ON CONFLICT (tenant_id, anio, mes) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. Cotización inicial (placeholder)
-- ---------------------------------------------------------------------------
INSERT INTO cotizaciones (tenant_id, fecha, moneda, valor_compra, valor_venta, fuente)
VALUES (NULL, CURRENT_DATE, 'USD', 1150.00, 1200.00, 'manual')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 11. Atributo "tesorero" si no existe
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_atributos (slug, nombre, categoria, descripcion, orden)
VALUES ('tesorero', 'Tesorero', 'institucional', 'Responsable de finanzas del club', 30)
ON CONFLICT (slug) DO NOTHING;
