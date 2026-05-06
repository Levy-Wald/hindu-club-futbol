-- ============================================================================
-- MÓDULO: RRHH (Empleados + Contratos Laborales + Liquidaciones)
-- Sprint: 11
-- Prefijo: rrhh_ (tablas nuevas según convención acordada)
-- Dependencias: tronco (personas, personas_atributos, catalogo_atributos),
--               finanzas (movimientos_caja, cajas)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Registrar módulo en catálogo
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_modulos (slug, nombre, descripcion, categoria, precio_usd_mensual, disponible_en_planes, activo_global)
VALUES ('rrhh', 'Recursos Humanos', 'Empleados, contratos laborales, liquidaciones de sueldo', 'operativo', 25, '{pro,enterprise}', true)
ON CONFLICT (slug) DO NOTHING;

-- Activar para Hindu
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo)
VALUES ('11111111-1111-1111-1111-111111111111', 'rrhh', true)
ON CONFLICT (tenant_id, modulo_slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 0.1 Atributos namespaceados para RRHH
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_atributos (slug, nombre, categoria, descripcion, orden) VALUES
  ('rrhh.empleado', 'Empleado', 'laboral', 'Persona con vinculo laboral activo', 1),
  ('rrhh.admin', 'Admin RRHH', 'laboral', 'Puede gestionar empleados, contratos y liquidaciones', 2),
  ('rrhh.consulta', 'Consulta RRHH', 'laboral', 'Solo lectura del modulo RRHH', 3)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 1. rrhh_contratos — Contratos laborales vinculados a persona
-- ---------------------------------------------------------------------------
-- No creamos tabla rrhh_empleados porque empleado = persona con atributo rrhh.empleado.
-- Los datos laborales (CUIL, fecha_ingreso, area, puesto) van en el contrato,
-- que es lo que define la relación laboral real.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rrhh_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,

  -- Modalidad
  modalidad text NOT NULL CHECK (modalidad IN (
    'relacion_dependencia', 'monotributo', 'honorarios', 'informal', 'pasantia', 'voluntariado'
  )),

  -- Puesto
  puesto text NOT NULL,                       -- ej: 'Kinesiologo', 'Preparador Fisico', 'Administrativo'
  area text,                                  -- ej: 'Deportiva', 'Administrativa', 'Mantenimiento', 'Medica'
  categoria_convenio text,                    -- categoría según CCT si aplica

  -- Vigencia
  fecha_inicio date NOT NULL,
  fecha_fin date,                             -- NULL = indefinido
  estado text NOT NULL DEFAULT 'vigente' CHECK (estado IN (
    'vigente', 'vencido', 'rescindido', 'suspendido'
  )),
  motivo_fin text,                            -- motivo de rescisión/no-renovación

  -- Remuneración
  monto numeric(12,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'ARS',
  frecuencia text NOT NULL DEFAULT 'mensual' CHECK (frecuencia IN (
    'mensual', 'quincenal', 'semanal', 'por_evento', 'por_hora'
  )),
  horas_semanales numeric(4,1),               -- para por_hora o part-time

  -- Datos laborales de la persona en este contrato
  cuil text,                                  -- CUIL del empleado
  obra_social text,                           -- obra social asignada
  sindicato text,                             -- sindicato si corresponde
  numero_legajo text,                         -- legajo interno

  -- Vínculos con equipos/actividades
  -- (un kine puede estar en 3 equipos, un PF en 2 disciplinas)
  -- Se resuelve via personas_equipos, no duplicamos acá

  -- Documentación
  contrato_url text,                          -- PDF del contrato firmado en storage

  -- Sistema
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_rrhh_contratos_tenant ON rrhh_contratos(tenant_id);
CREATE INDEX idx_rrhh_contratos_persona ON rrhh_contratos(persona_id);
CREATE INDEX idx_rrhh_contratos_estado ON rrhh_contratos(tenant_id, estado);
CREATE INDEX idx_rrhh_contratos_vigente ON rrhh_contratos(tenant_id) WHERE estado = 'vigente' AND deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2. rrhh_liquidaciones — Liquidaciones de sueldo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rrhh_liquidaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contrato_id uuid NOT NULL REFERENCES rrhh_contratos(id) ON DELETE RESTRICT,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE RESTRICT,

  -- Período
  periodo text NOT NULL,                      -- '2026-05' (año-mes)
  fecha_liquidacion date NOT NULL DEFAULT CURRENT_DATE,

  -- Montos
  monto_bruto numeric(12,2) NOT NULL,
  deducciones numeric(12,2) NOT NULL DEFAULT 0,
  aportes_patronales numeric(12,2) NOT NULL DEFAULT 0,
  bonificaciones numeric(12,2) NOT NULL DEFAULT 0,
  monto_neto numeric(12,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'ARS',

  -- Detalle de conceptos (flexible)
  conceptos jsonb DEFAULT '[]'::jsonb,        -- [{concepto, tipo: 'haber'|'deduccion', monto}]

  -- Estado
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN (
    'borrador', 'aprobada', 'pagada', 'anulada'
  )),

  -- Vínculo con finanzas
  movimiento_caja_id uuid REFERENCES movimientos_caja(id) ON DELETE SET NULL,
  caja_id uuid REFERENCES cajas(id) ON DELETE SET NULL,

  -- Aprobación
  aprobada_por_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  aprobada_at timestamptz,

  -- Recibo
  recibo_url text,                            -- PDF del recibo en storage

  -- Sistema
  observaciones text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,

  -- Un contrato no puede tener dos liquidaciones del mismo período
  UNIQUE (tenant_id, contrato_id, periodo)
);

CREATE INDEX idx_rrhh_liquidaciones_tenant ON rrhh_liquidaciones(tenant_id);
CREATE INDEX idx_rrhh_liquidaciones_contrato ON rrhh_liquidaciones(contrato_id);
CREATE INDEX idx_rrhh_liquidaciones_persona ON rrhh_liquidaciones(persona_id);
CREATE INDEX idx_rrhh_liquidaciones_periodo ON rrhh_liquidaciones(tenant_id, periodo);
CREATE INDEX idx_rrhh_liquidaciones_estado ON rrhh_liquidaciones(tenant_id, estado);

-- ============================================================================
-- RLS
-- ============================================================================

-- Helper: puede operar RRHH (admin_tenant, admin_sistema, rrhh.admin)
CREATE OR REPLACE FUNCTION puede_operar_rrhh()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT es_admin_tenant() OR tiene_atributo('rrhh.admin');
$$;

-- Aplicar RLS a tablas RRHH
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY['rrhh_contratos', 'rrhh_liquidaciones'];
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- SELECT: autenticados del mismo tenant
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (tenant_id = get_tenant_actual())',
      t || '_select', t
    );

    -- INSERT/UPDATE/DELETE: solo admin o rrhh.admin
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_tenant_actual() AND puede_operar_rrhh())',
      t || '_insert', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (tenant_id = get_tenant_actual() AND puede_operar_rrhh())',
      t || '_update', t
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (tenant_id = get_tenant_actual() AND puede_operar_rrhh())',
      t || '_delete', t
    );
  END LOOP;
END;
$$;

-- Excepción: empleado puede ver su propio contrato
CREATE POLICY rrhh_contratos_own ON rrhh_contratos
  FOR SELECT TO authenticated
  USING (persona_id = get_persona_actual());

-- Excepción: empleado puede ver sus propias liquidaciones
CREATE POLICY rrhh_liquidaciones_own ON rrhh_liquidaciones
  FOR SELECT TO authenticated
  USING (persona_id = get_persona_actual());

-- ============================================================================
-- TRIGGERS: updated_at automático
-- ============================================================================
CREATE TRIGGER rrhh_contratos_set_updated_at
  BEFORE UPDATE ON rrhh_contratos
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE TRIGGER rrhh_liquidaciones_set_updated_at
  BEFORE UPDATE ON rrhh_liquidaciones
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON TABLE rrhh_contratos IS 'Contratos laborales vinculados a personas con atributo rrhh.empleado';
COMMENT ON TABLE rrhh_liquidaciones IS 'Liquidaciones de sueldo mensuales. Al pagarse, generan movimiento_caja';
COMMENT ON FUNCTION puede_operar_rrhh() IS 'Verifica si el usuario puede operar el modulo RRHH (admin o rrhh.admin)';
