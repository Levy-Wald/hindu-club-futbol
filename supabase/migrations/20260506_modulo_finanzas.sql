-- ============================================================================
-- MÓDULO: finanzas (mini-ERP contable)
-- Sprint: 9
-- Dependencias: tronco (personas, entidades, equipos, sedes, tenant_modulos,
--               catalogo_categorias_movimiento, catalogo_modulos)
-- Activación: INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo)
--             VALUES (tenant, 'finanzas', true)
-- Desactivación: UPDATE tenant_modulos SET activo = false WHERE modulo_slug = 'finanzas'
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Registrar módulo en catálogo (si no existe)
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_modulos (slug, nombre, descripcion, categoria, precio_usd_mensual, disponible_en_planes, activo_global)
VALUES ('finanzas', 'Finanzas y contabilidad', 'Mini-ERP: cajas, movimientos, cuotas, plan de cuentas, cuentas corrientes', 'operativo', 30, '{pro,enterprise}', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1. plan_cuentas (árbol contable jerárquico)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_cuentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  codigo text NOT NULL,                    -- 1.1.01.001
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('activo','pasivo','patrimonio_neto','ingreso','egreso')),
  cuenta_padre_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,
  nivel int NOT NULL DEFAULT 1,            -- 1=rubro, 2=subrubro, 3=cuenta, 4=subcuenta
  es_imputable boolean NOT NULL DEFAULT false, -- solo hojas reciben movimientos
  moneda_default text DEFAULT 'ARS',
  acepta_movimientos boolean NOT NULL DEFAULT true,
  activa boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);

CREATE INDEX idx_plan_cuentas_tenant ON plan_cuentas(tenant_id);
CREATE INDEX idx_plan_cuentas_padre ON plan_cuentas(cuenta_padre_id);
CREATE INDEX idx_plan_cuentas_tipo ON plan_cuentas(tenant_id, tipo);

-- ---------------------------------------------------------------------------
-- 2. centros_costo (sede, disciplina, equipo, área, general)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_costo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  codigo text,
  tipo text NOT NULL CHECK (tipo IN ('sede','disciplina','equipo','area','general')),
  referencia_tipo text,                     -- 'sede', 'equipo', etc.
  referencia_id uuid,                       -- FK polimórfico
  padre_id uuid REFERENCES centros_costo(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);

CREATE INDEX idx_centros_costo_tenant ON centros_costo(tenant_id);

-- ---------------------------------------------------------------------------
-- 3. medios_pago (efectivo, banco, tarjeta, digital, cheque, débito auto)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medios_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('efectivo','banco','tarjeta','digital','cheque','debito_automatico','otro')),
  comision_porcentaje numeric(5,2) DEFAULT 0,
  cuenta_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,
  requiere_comprobante boolean NOT NULL DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_medios_pago_tenant ON medios_pago(tenant_id);

-- ---------------------------------------------------------------------------
-- 4. tipos_comprobante (factura A/B/C, recibo, NC, ND, ticket)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tipos_comprobante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nombre text NOT NULL,
  codigo_afip text,                         -- código AFIP si aplica
  letra text CHECK (letra IN ('A','B','C','E','M','X',NULL)), -- letra fiscal
  es_fiscal boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_tipos_comprobante_tenant ON tipos_comprobante(tenant_id);

-- ---------------------------------------------------------------------------
-- 5. cajas (donde está la plata, cada una vinculada a una cuenta contable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cajas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('efectivo','banco','digital','otro')),
  cuenta_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,
  moneda text NOT NULL DEFAULT 'ARS',
  saldo_actual numeric(15,2) NOT NULL DEFAULT 0,
  responsable_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  activa boolean NOT NULL DEFAULT true,
  descripcion text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cajas_tenant ON cajas(tenant_id);

-- ---------------------------------------------------------------------------
-- 6. productos_servicios (catálogo unificado)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos_servicios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('producto','servicio','cuota','actividad','alquiler')),
  precio numeric(12,2) NOT NULL DEFAULT 0,
  moneda text NOT NULL DEFAULT 'ARS',
  cuenta_ingreso_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,
  cuenta_egreso_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,
  categoria_movimiento_id uuid REFERENCES catalogo_categorias_movimiento(id) ON DELETE SET NULL,
  centro_costo_id uuid REFERENCES centros_costo(id) ON DELETE SET NULL,
  es_arancelado boolean NOT NULL DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  descripcion text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_productos_servicios_tenant ON productos_servicios(tenant_id);
CREATE INDEX idx_productos_servicios_tipo ON productos_servicios(tenant_id, tipo);

-- ---------------------------------------------------------------------------
-- 7. periodos_contables (cierre mensual/anual)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS periodos_contables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  anio int NOT NULL,
  mes int NOT NULL CHECK (mes BETWEEN 1 AND 12),
  estado text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','preliminar','cerrado')),
  cerrado_por_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  cerrado_at timestamptz,
  notas text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, anio, mes)
);

CREATE INDEX idx_periodos_contables_tenant ON periodos_contables(tenant_id);

-- ---------------------------------------------------------------------------
-- 8. cotizaciones (tipo de cambio diario)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null = global
  fecha date NOT NULL,
  moneda text NOT NULL DEFAULT 'USD',
  valor_compra numeric(12,4),
  valor_venta numeric(12,4),
  fuente text DEFAULT 'BNA',               -- BNA, manual, dolarapi
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, fecha, moneda, fuente)
);

CREATE INDEX idx_cotizaciones_fecha ON cotizaciones(fecha DESC);

-- ---------------------------------------------------------------------------
-- 9. movimientos_caja (cada peso que entra o sale)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  numero int,                               -- auto-incremental por tenant
  caja_id uuid NOT NULL REFERENCES cajas(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('ingreso','egreso','transferencia')),

  -- Montos
  monto_bruto numeric(15,2) NOT NULL,
  impuestos numeric(15,2) DEFAULT 0,
  retenciones numeric(15,2) DEFAULT 0,
  monto_neto numeric(15,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'ARS',
  cotizacion_usd numeric(12,4),             -- tipo de cambio al momento
  monto_usd numeric(15,2),                  -- equivalente en USD

  -- Clasificación
  categoria_id uuid REFERENCES catalogo_categorias_movimiento(id) ON DELETE SET NULL,
  producto_id uuid REFERENCES productos_servicios(id) ON DELETE SET NULL,
  medio_pago_id uuid REFERENCES medios_pago(id) ON DELETE SET NULL,
  centro_costo_id uuid REFERENCES centros_costo(id) ON DELETE SET NULL,

  -- Vinculación a persona o entidad
  persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  entidad_id uuid REFERENCES entidades(id) ON DELETE SET NULL,

  -- Comprobante
  comprobante_tipo_id uuid REFERENCES tipos_comprobante(id) ON DELETE SET NULL,
  comprobante_numero text,
  comprobante_url text,                     -- URL en storage

  -- Contabilidad
  cuenta_debe_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,
  cuenta_haber_id uuid REFERENCES plan_cuentas(id) ON DELETE SET NULL,

  -- Transferencias
  caja_destino_id uuid REFERENCES cajas(id) ON DELETE SET NULL,

  -- Período
  periodo_contable text,                    -- '2026-05' (año-mes)
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  fecha_valor date,                         -- fecha de efectiva acreditación
  descripcion text,

  -- Anulación
  anulado boolean NOT NULL DEFAULT false,
  anulado_por_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  anulado_at timestamptz,
  motivo_anulacion text,
  movimiento_anulacion_id uuid REFERENCES movimientos_caja(id) ON DELETE SET NULL,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_movimientos_caja_tenant ON movimientos_caja(tenant_id);
CREATE INDEX idx_movimientos_caja_caja ON movimientos_caja(caja_id);
CREATE INDEX idx_movimientos_caja_fecha ON movimientos_caja(tenant_id, fecha DESC);
CREATE INDEX idx_movimientos_caja_persona ON movimientos_caja(persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX idx_movimientos_caja_entidad ON movimientos_caja(entidad_id) WHERE entidad_id IS NOT NULL;
CREATE INDEX idx_movimientos_caja_periodo ON movimientos_caja(tenant_id, periodo_contable);
CREATE INDEX idx_movimientos_caja_no_anulado ON movimientos_caja(tenant_id, caja_id) WHERE anulado = false;

-- ---------------------------------------------------------------------------
-- 10. cuotas_planes (definición de planes de cuota)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuotas_planes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  producto_id uuid REFERENCES productos_servicios(id) ON DELETE SET NULL,
  periodicidad text NOT NULL CHECK (periodicidad IN ('mensual','bimestral','trimestral','semestral','anual')),
  monto numeric(12,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'ARS',
  dia_vencimiento int DEFAULT 10 CHECK (dia_vencimiento BETWEEN 1 AND 28),
  permite_bonificacion boolean NOT NULL DEFAULT true,
  mora_porcentaje numeric(5,2) DEFAULT 5.00,
  mora_dias_gracia int DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  descripcion text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cuotas_planes_tenant ON cuotas_planes(tenant_id);

-- ---------------------------------------------------------------------------
-- 11. cuotas_bonificaciones (descuentos/recargos configurables)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuotas_bonificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES cuotas_planes(id) ON DELETE CASCADE, -- null = global
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('descuento','recargo')),
  aplicacion text NOT NULL CHECK (aplicacion IN ('familiar','anticipado','mora','beca','convenio','custom')),
  valor_porcentaje numeric(5,2),            -- ej: 20 = 20%
  valor_fijo numeric(12,2),                 -- ej: 5000 = $5000
  prioridad int DEFAULT 0,                  -- orden de aplicación
  condicion jsonb DEFAULT '{}'::jsonb,      -- {"hijo_numero": 2} o {"dias_antes": 10}
  activa boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_cuotas_bonificaciones_tenant ON cuotas_bonificaciones(tenant_id);
CREATE INDEX idx_cuotas_bonificaciones_plan ON cuotas_bonificaciones(plan_id);

-- ---------------------------------------------------------------------------
-- 12. emisiones_cuota (registro de emisión masiva)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emisiones_cuota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES cuotas_planes(id) ON DELETE RESTRICT,
  padron_id uuid REFERENCES padrones(id) ON DELETE SET NULL, -- null = todos
  periodo text NOT NULL,                    -- '2026-05'
  cantidad_emitida int NOT NULL DEFAULT 0,
  monto_total numeric(15,2) DEFAULT 0,
  emitido_por_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_emisiones_cuota_tenant ON emisiones_cuota(tenant_id);

-- ---------------------------------------------------------------------------
-- 13. cuotas_emitidas (cada cuota individual emitida)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuotas_emitidas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES cuotas_planes(id) ON DELETE RESTRICT,
  emision_id uuid REFERENCES emisiones_cuota(id) ON DELETE SET NULL,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
  periodo text NOT NULL,                    -- '2026-05'
  monto_original numeric(12,2) NOT NULL,
  bonificaciones_json jsonb DEFAULT '[]'::jsonb, -- [{nombre, tipo, monto}]
  monto_final numeric(12,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'ARS',
  cotizacion_usd numeric(12,4),
  monto_usd numeric(12,2),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','vencida','anulada','parcial')),
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date NOT NULL,
  fecha_pago date,
  movimiento_id uuid REFERENCES movimientos_caja(id) ON DELETE SET NULL,
  observaciones text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, plan_id, persona_id, periodo)
);

CREATE INDEX idx_cuotas_emitidas_tenant ON cuotas_emitidas(tenant_id);
CREATE INDEX idx_cuotas_emitidas_persona ON cuotas_emitidas(persona_id);
CREATE INDEX idx_cuotas_emitidas_estado ON cuotas_emitidas(tenant_id, estado);
CREATE INDEX idx_cuotas_emitidas_vencimiento ON cuotas_emitidas(fecha_vencimiento) WHERE estado = 'pendiente';
CREATE INDEX idx_cuotas_emitidas_periodo ON cuotas_emitidas(tenant_id, periodo);

-- ---------------------------------------------------------------------------
-- 14. convenios_pago (planes de pago para morosos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS convenios_pago (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,
  deuda_original numeric(15,2) NOT NULL,
  cantidad_cuotas int NOT NULL,
  monto_cuota numeric(12,2) NOT NULL,
  cuotas_pagadas int NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','completado','incumplido','anulado')),
  fecha_inicio date NOT NULL DEFAULT CURRENT_DATE,
  proximo_vencimiento date,
  observaciones text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_convenios_pago_tenant ON convenios_pago(tenant_id);
CREATE INDEX idx_convenios_pago_persona ON convenios_pago(persona_id);

-- ---------------------------------------------------------------------------
-- 15. cuentas_corrientes (saldo por persona o entidad)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuentas_corrientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
  entidad_id uuid REFERENCES entidades(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('socio','empleado','proveedor','acreedor','federacion','otro')),
  saldo numeric(15,2) NOT NULL DEFAULT 0,  -- positivo = a favor, negativo = deuda
  saldo_usd numeric(15,2) DEFAULT 0,
  ultimo_movimiento_at timestamptz,
  activa boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Solo una de persona_id o entidad_id
  CHECK (
    (persona_id IS NOT NULL AND entidad_id IS NULL) OR
    (persona_id IS NULL AND entidad_id IS NOT NULL)
  ),
  UNIQUE (tenant_id, persona_id, tipo) ,
  UNIQUE (tenant_id, entidad_id, tipo)
);

CREATE INDEX idx_cuentas_corrientes_tenant ON cuentas_corrientes(tenant_id);
CREATE INDEX idx_cuentas_corrientes_persona ON cuentas_corrientes(persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX idx_cuentas_corrientes_entidad ON cuentas_corrientes(entidad_id) WHERE entidad_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 16. config_financiera (configuración del módulo por tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config_financiera (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  moneda_principal text NOT NULL DEFAULT 'ARS',
  moneda_equivalencia text DEFAULT 'USD',
  comprobante_obligatorio_ingreso boolean NOT NULL DEFAULT true,
  comprobante_obligatorio_egreso boolean NOT NULL DEFAULT true,
  comprobante_obligatorio_transferencia boolean NOT NULL DEFAULT false,
  mora_automatica boolean NOT NULL DEFAULT true,
  mora_porcentaje_default numeric(5,2) DEFAULT 5.00,
  mora_dias_gracia_default int DEFAULT 0,
  cierre_automatico boolean NOT NULL DEFAULT false,
  numeracion_movimientos boolean NOT NULL DEFAULT true,
  proximo_numero_movimiento int DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Helper: puede operar finanzas (admin_tenant, admin_sistema, tesorero)
CREATE OR REPLACE FUNCTION puede_operar_finanzas()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT es_admin_tenant() OR tiene_atributo('tesorero');
$$;

-- Aplicar RLS a todas las tablas del módulo
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'plan_cuentas','centros_costo','medios_pago','tipos_comprobante',
    'cajas','productos_servicios','periodos_contables','cotizaciones',
    'movimientos_caja','cuotas_planes','cuotas_bonificaciones',
    'emisiones_cuota','cuotas_emitidas','convenios_pago',
    'cuentas_corrientes','config_financiera'
  ];
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- SELECT: autenticados del mismo tenant
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (tenant_id = get_tenant_actual())',
      t || '_select', t
    );

    -- INSERT/UPDATE/DELETE: solo admin o tesorero
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_tenant_actual() AND puede_operar_finanzas())',
      t || '_insert', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (tenant_id = get_tenant_actual() AND puede_operar_finanzas())',
      t || '_update', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (tenant_id = get_tenant_actual() AND puede_operar_finanzas())',
      t || '_delete', t
    );
  END LOOP;
END;
$$;

-- Excepción: cuentas_corrientes SELECT también para el propio usuario (Mi Cuenta)
CREATE POLICY cuentas_corrientes_own ON cuentas_corrientes
  FOR SELECT TO authenticated
  USING (
    persona_id = get_persona_actual()
  );

-- Excepción: cuotas_emitidas SELECT también para el propio usuario
CREATE POLICY cuotas_emitidas_own ON cuotas_emitidas
  FOR SELECT TO authenticated
  USING (
    persona_id = get_persona_actual()
  );

-- Excepción: cotizaciones sin tenant (globales) son legibles
DROP POLICY IF EXISTS cotizaciones_select ON cotizaciones;
CREATE POLICY cotizaciones_select ON cotizaciones
  FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_tenant_actual());

-- ============================================================================
-- TRIGGERS: updated_at automático
-- ============================================================================
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'plan_cuentas','centros_costo','medios_pago','cajas',
    'productos_servicios','periodos_contables','movimientos_caja',
    'cuotas_planes','cuotas_bonificaciones','cuotas_emitidas',
    'convenios_pago','cuentas_corrientes','config_financiera'
  ];
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================================
-- TRIGGER: Auto-numerar movimientos por tenant
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_numerar_movimiento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.numero IS NULL THEN
    UPDATE config_financiera
    SET proximo_numero_movimiento = proximo_numero_movimiento + 1
    WHERE tenant_id = NEW.tenant_id
    RETURNING proximo_numero_movimiento - 1 INTO NEW.numero;

    -- Si no hay config, usar secuencia simple
    IF NEW.numero IS NULL THEN
      SELECT COALESCE(MAX(numero), 0) + 1 INTO NEW.numero
      FROM movimientos_caja
      WHERE tenant_id = NEW.tenant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_numerar_movimiento
  BEFORE INSERT ON movimientos_caja
  FOR EACH ROW EXECUTE FUNCTION fn_numerar_movimiento();

-- ============================================================================
-- TRIGGER: Calcular monto_neto si no se provee
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_calcular_monto_neto()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si no se provee monto_neto, calcularlo
  IF NEW.monto_neto IS NULL OR NEW.monto_neto = 0 THEN
    NEW.monto_neto := NEW.monto_bruto - COALESCE(NEW.retenciones, 0);
  END IF;

  -- Auto-calcular periodo_contable si no se provee
  IF NEW.periodo_contable IS NULL THEN
    NEW.periodo_contable := to_char(NEW.fecha, 'YYYY-MM');
  END IF;

  -- Auto-calcular equivalente USD
  IF NEW.cotizacion_usd IS NOT NULL AND NEW.cotizacion_usd > 0 THEN
    NEW.monto_usd := ROUND(NEW.monto_neto / NEW.cotizacion_usd, 2);
  ELSE
    -- Buscar cotización del día
    SELECT valor_venta INTO NEW.cotizacion_usd
    FROM cotizaciones
    WHERE (tenant_id IS NULL OR tenant_id = NEW.tenant_id)
      AND fecha <= NEW.fecha
      AND moneda = 'USD'
    ORDER BY fecha DESC
    LIMIT 1;

    IF NEW.cotizacion_usd IS NOT NULL AND NEW.cotizacion_usd > 0 THEN
      NEW.monto_usd := ROUND(NEW.monto_neto / NEW.cotizacion_usd, 2);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calcular_monto_neto
  BEFORE INSERT OR UPDATE ON movimientos_caja
  FOR EACH ROW EXECUTE FUNCTION fn_calcular_monto_neto();

-- ============================================================================
-- TRIGGER: Actualizar saldo de caja después de movimiento
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_actualizar_saldo_caja()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_delta numeric(15,2);
BEGIN
  -- Solo movimientos no anulados
  IF TG_OP = 'INSERT' AND NOT NEW.anulado THEN
    v_delta := NEW.monto_neto;

    IF NEW.tipo = 'ingreso' THEN
      UPDATE cajas SET saldo_actual = saldo_actual + v_delta WHERE id = NEW.caja_id;
    ELSIF NEW.tipo = 'egreso' THEN
      UPDATE cajas SET saldo_actual = saldo_actual - v_delta WHERE id = NEW.caja_id;
    ELSIF NEW.tipo = 'transferencia' THEN
      UPDATE cajas SET saldo_actual = saldo_actual - v_delta WHERE id = NEW.caja_id;
      IF NEW.caja_destino_id IS NOT NULL THEN
        UPDATE cajas SET saldo_actual = saldo_actual + v_delta WHERE id = NEW.caja_destino_id;
      END IF;
    END IF;

  -- Anulación: revertir
  ELSIF TG_OP = 'UPDATE' AND NEW.anulado AND NOT OLD.anulado THEN
    v_delta := OLD.monto_neto;

    IF OLD.tipo = 'ingreso' THEN
      UPDATE cajas SET saldo_actual = saldo_actual - v_delta WHERE id = OLD.caja_id;
    ELSIF OLD.tipo = 'egreso' THEN
      UPDATE cajas SET saldo_actual = saldo_actual + v_delta WHERE id = OLD.caja_id;
    ELSIF OLD.tipo = 'transferencia' THEN
      UPDATE cajas SET saldo_actual = saldo_actual + v_delta WHERE id = OLD.caja_id;
      IF OLD.caja_destino_id IS NOT NULL THEN
        UPDATE cajas SET saldo_actual = saldo_actual - v_delta WHERE id = OLD.caja_destino_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_actualizar_saldo_caja
  AFTER INSERT OR UPDATE ON movimientos_caja
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_saldo_caja();

-- ============================================================================
-- TRIGGER: Actualizar cuenta corriente después de movimiento
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_actualizar_cuenta_corriente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_cc_id uuid;
  v_delta numeric(15,2);
  v_delta_usd numeric(15,2);
BEGIN
  -- Solo si tiene persona_id o entidad_id
  IF NEW.persona_id IS NULL AND NEW.entidad_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NOT NEW.anulado THEN
    v_delta := CASE WHEN NEW.tipo = 'ingreso' THEN NEW.monto_neto ELSE -NEW.monto_neto END;
    v_delta_usd := CASE WHEN NEW.tipo = 'ingreso' THEN COALESCE(NEW.monto_usd, 0) ELSE -COALESCE(NEW.monto_usd, 0) END;

    IF NEW.persona_id IS NOT NULL THEN
      INSERT INTO cuentas_corrientes (tenant_id, persona_id, tipo, saldo, saldo_usd, ultimo_movimiento_at)
      VALUES (NEW.tenant_id, NEW.persona_id, 'socio', v_delta, v_delta_usd, now())
      ON CONFLICT (tenant_id, persona_id, tipo)
      DO UPDATE SET
        saldo = cuentas_corrientes.saldo + v_delta,
        saldo_usd = cuentas_corrientes.saldo_usd + v_delta_usd,
        ultimo_movimiento_at = now();
    END IF;

    IF NEW.entidad_id IS NOT NULL THEN
      INSERT INTO cuentas_corrientes (tenant_id, entidad_id, tipo, saldo, saldo_usd, ultimo_movimiento_at)
      VALUES (NEW.tenant_id, NEW.entidad_id, 'proveedor', -v_delta, -v_delta_usd, now())
      ON CONFLICT (tenant_id, entidad_id, tipo)
      DO UPDATE SET
        saldo = cuentas_corrientes.saldo + (-v_delta),
        saldo_usd = cuentas_corrientes.saldo_usd + (-v_delta_usd),
        ultimo_movimiento_at = now();
    END IF;

  -- Anulación: revertir
  ELSIF TG_OP = 'UPDATE' AND NEW.anulado AND NOT OLD.anulado THEN
    v_delta := CASE WHEN OLD.tipo = 'ingreso' THEN -OLD.monto_neto ELSE OLD.monto_neto END;
    v_delta_usd := CASE WHEN OLD.tipo = 'ingreso' THEN -COALESCE(OLD.monto_usd, 0) ELSE COALESCE(OLD.monto_usd, 0) END;

    IF OLD.persona_id IS NOT NULL THEN
      UPDATE cuentas_corrientes
      SET saldo = saldo + v_delta, saldo_usd = saldo_usd + v_delta_usd, ultimo_movimiento_at = now()
      WHERE tenant_id = OLD.tenant_id AND persona_id = OLD.persona_id;
    END IF;

    IF OLD.entidad_id IS NOT NULL THEN
      UPDATE cuentas_corrientes
      SET saldo = saldo + (-v_delta), saldo_usd = saldo_usd + (-v_delta_usd), ultimo_movimiento_at = now()
      WHERE tenant_id = OLD.tenant_id AND entidad_id = OLD.entidad_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_actualizar_cuenta_corriente
  AFTER INSERT OR UPDATE ON movimientos_caja
  FOR EACH ROW EXECUTE FUNCTION fn_actualizar_cuenta_corriente();

-- ============================================================================
-- FUNCIÓN: Vencimiento automático de cuotas (para pg_cron o cron externo)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_vencer_cuotas()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE cuotas_emitidas
  SET estado = 'vencida', updated_at = now()
  WHERE estado = 'pendiente'
    AND fecha_vencimiento < CURRENT_DATE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- FUNCIÓN: Aplicar mora automática a cuotas vencidas
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_aplicar_mora()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int := 0;
  r record;
BEGIN
  FOR r IN
    SELECT ce.id, ce.monto_final, ce.fecha_vencimiento, ce.tenant_id,
           cp.mora_porcentaje, cp.mora_dias_gracia,
           ce.metadata
    FROM cuotas_emitidas ce
    JOIN cuotas_planes cp ON cp.id = ce.plan_id
    WHERE ce.estado = 'vencida'
      AND cp.mora_porcentaje > 0
      AND (ce.metadata->>'mora_aplicada')::boolean IS NOT TRUE
      AND ce.fecha_vencimiento + cp.mora_dias_gracia < CURRENT_DATE
  LOOP
    -- Verificar que el tenant tiene mora automática activa
    IF EXISTS (
      SELECT 1 FROM config_financiera
      WHERE tenant_id = r.tenant_id AND mora_automatica = true
    ) THEN
      UPDATE cuotas_emitidas
      SET monto_final = r.monto_final * (1 + r.mora_porcentaje / 100),
          metadata = metadata || jsonb_build_object('mora_aplicada', true, 'mora_porcentaje', r.mora_porcentaje, 'mora_fecha', CURRENT_DATE),
          updated_at = now()
      WHERE id = r.id;
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- VISTA: Estado financiero por persona (interfaz tronco <-> módulo)
-- ============================================================================
CREATE OR REPLACE VIEW v_estado_financiero_persona AS
SELECT
  cc.tenant_id,
  cc.persona_id,
  cc.tipo,
  cc.saldo,
  cc.saldo_usd,
  cc.ultimo_movimiento_at,
  (SELECT COUNT(*) FROM cuotas_emitidas ce
   WHERE ce.persona_id = cc.persona_id AND ce.estado IN ('pendiente','vencida')) AS cuotas_pendientes,
  (SELECT COALESCE(SUM(ce.monto_final), 0) FROM cuotas_emitidas ce
   WHERE ce.persona_id = cc.persona_id AND ce.estado IN ('pendiente','vencida')) AS deuda_cuotas,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM cuotas_emitidas ce
      WHERE ce.persona_id = cc.persona_id AND ce.estado = 'vencida'
    ) THEN true
    ELSE false
  END AS al_dia
FROM cuentas_corrientes cc
WHERE cc.persona_id IS NOT NULL;

-- Vista para entidades
CREATE OR REPLACE VIEW v_estado_financiero_entidad AS
SELECT
  cc.tenant_id,
  cc.entidad_id,
  cc.tipo,
  cc.saldo,
  cc.saldo_usd,
  cc.ultimo_movimiento_at
FROM cuentas_corrientes cc
WHERE cc.entidad_id IS NOT NULL;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON TABLE plan_cuentas IS 'Plan de cuentas contable jerárquico (módulo finanzas)';
COMMENT ON TABLE centros_costo IS 'Centros de costo para imputación (sede, disciplina, equipo, área)';
COMMENT ON TABLE medios_pago IS 'Medios de cobro y pago (efectivo, banco, tarjeta, digital)';
COMMENT ON TABLE tipos_comprobante IS 'Tipos de comprobante fiscal (factura, recibo, NC, ND)';
COMMENT ON TABLE cajas IS 'Cajas y cuentas bancarias del club';
COMMENT ON TABLE productos_servicios IS 'Catálogo unificado de productos, servicios, cuotas y actividades';
COMMENT ON TABLE periodos_contables IS 'Períodos contables para cierre mensual/anual';
COMMENT ON TABLE cotizaciones IS 'Cotizaciones de moneda extranjera (BNA)';
COMMENT ON TABLE movimientos_caja IS 'Movimientos de caja: ingresos, egresos, transferencias';
COMMENT ON TABLE cuotas_planes IS 'Planes de cuota (mensual, trimestral, anual)';
COMMENT ON TABLE cuotas_bonificaciones IS 'Bonificaciones y recargos aplicables a cuotas';
COMMENT ON TABLE emisiones_cuota IS 'Registro de emisiones masivas de cuotas';
COMMENT ON TABLE cuotas_emitidas IS 'Cuotas individuales emitidas por persona';
COMMENT ON TABLE convenios_pago IS 'Convenios de pago para morosos';
COMMENT ON TABLE cuentas_corrientes IS 'Cuentas corrientes por persona o entidad';
COMMENT ON TABLE config_financiera IS 'Configuración del módulo financiero por tenant';
COMMENT ON FUNCTION puede_operar_finanzas() IS 'Verifica si el usuario puede operar el módulo financiero (admin o tesorero)';
COMMENT ON FUNCTION fn_vencer_cuotas() IS 'Marca como vencidas las cuotas pendientes pasadas de fecha';
COMMENT ON FUNCTION fn_aplicar_mora() IS 'Aplica recargo de mora a cuotas vencidas según configuración';
COMMENT ON VIEW v_estado_financiero_persona IS 'Vista para que el tronco consulte estado financiero de personas';
COMMENT ON VIEW v_estado_financiero_entidad IS 'Vista para que el tronco consulte estado financiero de entidades';
