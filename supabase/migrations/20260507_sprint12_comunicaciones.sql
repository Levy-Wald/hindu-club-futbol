-- Sprint 12: Comunicaciones + Notificaciones
-- 3 tablas com_*, VIEW v_vencimientos_proximos, función helper, atributo, seeds
-- Applied via Supabase MCP apply_migration

-- 1. ATRIBUTO NUEVO
INSERT INTO catalogo_atributos (slug, nombre, categoria, activo)
VALUES ('comunicaciones.admin', 'Admin Comunicaciones', 'comunicaciones', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. TABLAS
CREATE TABLE IF NOT EXISTS com_plantillas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  slug text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo text NOT NULL CHECK (tipo IN ('email','inapp')),
  asunto text,
  cuerpo text NOT NULL,
  variables_disponibles text[] DEFAULT '{}',
  activa boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS com_mensajes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  destinatario_persona_id uuid NOT NULL REFERENCES personas(id),
  origen_modulo_slug text,
  origen_evento_type text,
  origen_entidad_id uuid,
  asunto text NOT NULL,
  cuerpo text,
  tipo_severidad text DEFAULT 'info' CHECK (tipo_severidad IN ('info','exito','advertencia','error')),
  icono text,
  color text,
  action_url text,
  leido_at timestamptz,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS com_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  persona_id uuid REFERENCES personas(id),
  canal text NOT NULL CHECK (canal IN ('email','inapp')),
  destinatario text,
  plantilla_slug text,
  asunto text,
  cuerpo_renderizado text,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','enviado','fallado','entregado','leido')),
  error_mensaje text,
  intentos int DEFAULT 0,
  origen_modulo_slug text,
  origen_entidad_id uuid,
  enviado_at timestamptz,
  entregado_at timestamptz,
  leido_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. INDICES
CREATE INDEX IF NOT EXISTS idx_com_plantillas_tenant ON com_plantillas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_com_plantillas_tipo ON com_plantillas(tenant_id, tipo) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_com_mensajes_tenant ON com_mensajes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_com_mensajes_destinatario ON com_mensajes(tenant_id, destinatario_persona_id);
CREATE INDEX IF NOT EXISTS idx_com_mensajes_no_leidos ON com_mensajes(tenant_id, destinatario_persona_id) WHERE leido_at IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_com_mensajes_created ON com_mensajes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_com_envios_tenant ON com_envios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_com_envios_persona ON com_envios(tenant_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_com_envios_estado ON com_envios(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_com_envios_plantilla ON com_envios(tenant_id, plantilla_slug);
CREATE INDEX IF NOT EXISTS idx_com_envios_idempotencia ON com_envios(tenant_id, persona_id, origen_entidad_id, plantilla_slug);

-- 4. TRIGGERS
CREATE TRIGGER trg_com_plantillas_updated_at BEFORE UPDATE ON com_plantillas
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER trg_com_envios_updated_at BEFORE UPDATE ON com_envios
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- 5. RLS
ALTER TABLE com_plantillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE com_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE com_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "com_plantillas_select" ON com_plantillas FOR SELECT
  USING (tenant_id = get_tenant_actual());
CREATE POLICY "com_plantillas_insert" ON com_plantillas FOR INSERT
  WITH CHECK (tenant_id = get_tenant_actual() AND (es_admin_tenant() OR tiene_atributo('comunicaciones.admin') OR tiene_atributo('comunicaciones.editor')));
CREATE POLICY "com_plantillas_update" ON com_plantillas FOR UPDATE
  USING (tenant_id = get_tenant_actual() AND (es_admin_tenant() OR tiene_atributo('comunicaciones.admin') OR tiene_atributo('comunicaciones.editor')));
CREATE POLICY "com_plantillas_delete" ON com_plantillas FOR DELETE
  USING (tenant_id = get_tenant_actual() AND (es_admin_tenant() OR tiene_atributo('comunicaciones.admin')));

CREATE POLICY "com_mensajes_select" ON com_mensajes FOR SELECT
  USING (tenant_id = get_tenant_actual() AND (
    destinatario_persona_id = (SELECT id FROM personas WHERE user_id = auth.uid() LIMIT 1)
    OR es_admin_tenant() OR tiene_atributo('comunicaciones.admin')
  ));
CREATE POLICY "com_mensajes_insert" ON com_mensajes FOR INSERT
  WITH CHECK (tenant_id = get_tenant_actual());
CREATE POLICY "com_mensajes_update" ON com_mensajes FOR UPDATE
  USING (tenant_id = get_tenant_actual() AND (
    destinatario_persona_id = (SELECT id FROM personas WHERE user_id = auth.uid() LIMIT 1)
    OR es_admin_tenant() OR tiene_atributo('comunicaciones.admin')
  ));

CREATE POLICY "com_envios_select" ON com_envios FOR SELECT
  USING (tenant_id = get_tenant_actual() AND (
    persona_id = (SELECT id FROM personas WHERE user_id = auth.uid() LIMIT 1)
    OR es_admin_tenant() OR tiene_atributo('comunicaciones.admin')
  ));
CREATE POLICY "com_envios_insert" ON com_envios FOR INSERT
  WITH CHECK (tenant_id = get_tenant_actual());
CREATE POLICY "com_envios_update" ON com_envios FOR UPDATE
  USING (tenant_id = get_tenant_actual() AND (es_admin_tenant() OR tiene_atributo('comunicaciones.admin')));

-- 6. FUNCIÓN HELPER
CREATE OR REPLACE FUNCTION puede_operar_comunicaciones()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT es_admin_tenant() OR tiene_atributo('comunicaciones.admin') OR tiene_atributo('comunicaciones.editor');
$$;

-- 7. VIEW v_vencimientos_proximos
CREATE OR REPLACE VIEW v_vencimientos_proximos AS
  SELECT 'cuota'::text as tipo, ce.id::text as origen_id, ce.tenant_id, ce.persona_id,
    ce.fecha_vencimiento as vence, 'Cuota ' || COALESCE(cp.nombre, 'sin plan') as titulo,
    ce.monto_final::text as detalle, (ce.fecha_vencimiento - CURRENT_DATE) as dias_para_vencer
  FROM cuotas_emitidas ce LEFT JOIN cuotas_planes cp ON cp.id = ce.plan_id
  WHERE ce.estado = 'pendiente' AND ce.fecha_vencimiento >= CURRENT_DATE - 30
  UNION ALL
  SELECT 'apto_fisico', pdm.id::text, pdm.tenant_id, pdm.persona_id, pdm.fecha_vencimiento,
    'Apto físico — ' || COALESCE(cte.nombre, 'sin tipo'), NULL::text, (pdm.fecha_vencimiento - CURRENT_DATE)
  FROM personas_documentos_medicos pdm LEFT JOIN catalogo_tipos_estudio cte ON cte.slug = pdm.tipo_estudio_slug
  WHERE pdm.fecha_vencimiento IS NOT NULL
  UNION ALL
  SELECT 'autorizacion', pa.id::text, pa.tenant_id, pa.persona_id, pa.fecha_vencimiento,
    'Autorización — ' || COALESCE(cta.nombre, 'sin tipo'), NULL::text, (pa.fecha_vencimiento - CURRENT_DATE)
  FROM personas_autorizaciones pa LEFT JOIN catalogo_tipos_autorizacion cta ON cta.slug = pa.tipo_autorizacion_slug
  WHERE pa.fecha_vencimiento IS NOT NULL AND pa.estado = 'vigente'
  UNION ALL
  SELECT 'documento_identidad', pdi.id::text, pdi.tenant_id, pdi.persona_id, pdi.fecha_vencimiento,
    'Documento de identidad', NULL::text, (pdi.fecha_vencimiento - CURRENT_DATE)
  FROM personas_documentos_identidad pdi WHERE pdi.fecha_vencimiento IS NOT NULL
  UNION ALL
  SELECT 'pasaporte', p.id::text, p.tenant_id, p.id, p.pasaporte_vigencia,
    'Pasaporte', NULL::text, (p.pasaporte_vigencia - CURRENT_DATE)
  FROM personas p WHERE p.pasaporte_vigencia IS NOT NULL AND p.deleted_at IS NULL
  UNION ALL
  SELECT 'seguro_vehiculo', pv.id::text, pv.tenant_id, pv.persona_id, pv.seguro_vigencia_hasta,
    'Seguro vehículo ' || COALESCE(pv.patente, ''), NULL::text, (pv.seguro_vigencia_hasta - CURRENT_DATE)
  FROM personas_vehiculos pv WHERE pv.seguro_vigencia_hasta IS NOT NULL
  UNION ALL
  SELECT 'tarjeta_acceso', pca.id::text, pca.tenant_id, pca.persona_id, pca.tarjeta_vigencia_hasta,
    'Tarjeta de acceso', NULL::text, (pca.tarjeta_vigencia_hasta - CURRENT_DATE)
  FROM personas_credenciales_acceso pca WHERE pca.tarjeta_vigencia_hasta IS NOT NULL
  UNION ALL
  SELECT 'obra_social', pos.id::text, pos.tenant_id, pos.persona_id, pos.vigencia_hasta,
    'Obra social', NULL::text, (pos.vigencia_hasta - CURRENT_DATE)
  FROM personas_obra_social pos WHERE pos.vigencia_hasta IS NOT NULL
  UNION ALL
  SELECT 'convenio_pago', cp2.id::text, cp2.tenant_id, cp2.persona_id, cp2.proximo_vencimiento,
    'Cuota de convenio', NULL::text, (cp2.proximo_vencimiento - CURRENT_DATE)
  FROM convenios_pago cp2 WHERE cp2.proximo_vencimiento IS NOT NULL AND cp2.estado = 'activo';

-- 8. SEED plantillas Hindu (18 plantillas)
INSERT INTO com_plantillas (tenant_id, slug, nombre, descripcion, tipo, asunto, cuerpo, variables_disponibles, activa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'bienvenida_socio_email', 'Bienvenida nuevo socio (email)', 'Se envía al dar de alta un socio', 'email',
   'Bienvenido/a a {{club_nombre}}, {{nombre}}!',
   E'Hola {{nombre}} {{apellido}},\n\nTe damos la bienvenida a {{club_nombre}}. Tu número de socio es {{numero_socio}}.\n\nPadrón: {{padron_nombre}}\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','apellido','club_nombre','numero_socio','padron_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'bienvenida_socio_inapp', 'Bienvenida nuevo socio (in-app)', NULL, 'inapp', NULL,
   'Bienvenido/a a {{club_nombre}}. Tu número de socio es {{numero_socio}} en el padrón {{padron_nombre}}.', ARRAY['club_nombre','numero_socio','padron_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencimiento_30_email', 'Cuota vence en 30 días (email)', NULL, 'email',
   'Tu cuota vence en 30 días — {{plan_nombre}}',
   E'Hola {{nombre}},\n\nTu cuota de {{plan_nombre}} por ${{monto}} vence el {{fecha_vencimiento}}.\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','plan_nombre','monto','fecha_vencimiento','club_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencimiento_30_inapp', 'Cuota vence en 30 días (in-app)', NULL, 'inapp', NULL,
   'Tu cuota de {{plan_nombre}} por ${{monto}} vence el {{fecha_vencimiento}}.', ARRAY['plan_nombre','monto','fecha_vencimiento'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencimiento_7_email', 'Cuota vence en 7 días (email)', NULL, 'email',
   'Tu cuota vence en 7 días — {{plan_nombre}}',
   E'Hola {{nombre}},\n\nTu cuota de {{plan_nombre}} por ${{monto}} vence el {{fecha_vencimiento}}. Recordá abonarla para evitar mora.\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','plan_nombre','monto','fecha_vencimiento','club_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencimiento_7_inapp', 'Cuota vence en 7 días (in-app)', NULL, 'inapp', NULL,
   'Tu cuota de {{plan_nombre}} por ${{monto}} vence en 7 días ({{fecha_vencimiento}}).', ARRAY['plan_nombre','monto','fecha_vencimiento'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencimiento_1_inapp', 'Cuota vence mañana (in-app)', NULL, 'inapp', NULL,
   'Tu cuota de {{plan_nombre}} por ${{monto}} vence MAÑANA ({{fecha_vencimiento}}).', ARRAY['plan_nombre','monto','fecha_vencimiento'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencida_email', 'Cuota vencida (email)', NULL, 'email',
   'Cuota vencida — {{plan_nombre}}',
   E'Hola {{nombre}},\n\nTu cuota de {{plan_nombre}} por ${{monto}} venció el {{fecha_vencimiento}} y aún no registramos el pago.\n\nRegularizá tu situación.\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','plan_nombre','monto','fecha_vencimiento','club_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'cuota_vencida_inapp', 'Cuota vencida (in-app)', NULL, 'inapp', NULL,
   'Tu cuota de {{plan_nombre}} por ${{monto}} venció el {{fecha_vencimiento}}.', ARRAY['plan_nombre','monto','fecha_vencimiento'], true),
  ('11111111-1111-1111-1111-111111111111', 'apto_vencimiento_email', 'Apto físico vence (email)', NULL, 'email',
   'Tu apto físico vence pronto',
   E'Hola {{nombre}},\n\nTu apto físico vence el {{fecha_vencimiento}}. Renovalo para seguir participando.\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','fecha_vencimiento','club_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'apto_vencimiento_inapp', 'Apto físico vence (in-app)', NULL, 'inapp', NULL,
   'Tu apto físico vence el {{fecha_vencimiento}}. Renovalo para seguir participando.', ARRAY['fecha_vencimiento'], true),
  ('11111111-1111-1111-1111-111111111111', 'autorizacion_vencimiento_email', 'Autorización vence (email)', NULL, 'email',
   'Tu autorización vence pronto',
   E'Hola {{nombre}},\n\nTu autorización ({{tipo_autorizacion}}) vence el {{fecha_vencimiento}}. Presentá la renovación.\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','tipo_autorizacion','fecha_vencimiento','club_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'autorizacion_vencimiento_inapp', 'Autorización vence (in-app)', NULL, 'inapp', NULL,
   'Tu autorización ({{tipo_autorizacion}}) vence el {{fecha_vencimiento}}.', ARRAY['tipo_autorizacion','fecha_vencimiento'], true),
  ('11111111-1111-1111-1111-111111111111', 'contrato_creado_inapp', 'Contrato creado (in-app)', NULL, 'inapp', NULL,
   'Se registró un nuevo contrato a tu nombre: {{tipo_contrato}} desde {{fecha_inicio}}.', ARRAY['tipo_contrato','fecha_inicio'], true),
  ('11111111-1111-1111-1111-111111111111', 'liquidacion_aprobada_email', 'Liquidación aprobada (email)', NULL, 'email',
   'Liquidación aprobada — {{periodo}}',
   E'Hola {{nombre}},\n\nTu liquidación del período {{periodo}} fue aprobada. Monto neto: ${{monto_neto}}.\n\nSaludos,\n{{club_nombre}}',
   ARRAY['nombre','periodo','monto_neto','club_nombre'], true),
  ('11111111-1111-1111-1111-111111111111', 'liquidacion_aprobada_inapp', 'Liquidación aprobada (in-app)', NULL, 'inapp', NULL,
   'Tu liquidación del período {{periodo}} fue aprobada. Monto neto: ${{monto_neto}}.', ARRAY['periodo','monto_neto'], true),
  ('11111111-1111-1111-1111-111111111111', 'evento_creado_inapp', 'Evento creado (in-app)', NULL, 'inapp', NULL,
   'Nuevo evento: {{titulo}} el {{fecha}} a las {{hora}}.', ARRAY['titulo','fecha','hora'], true),
  ('11111111-1111-1111-1111-111111111111', 'asistencia_solicitada_inapp', 'Confirmación asistencia (in-app)', NULL, 'inapp', NULL,
   'Se solicita confirmación de asistencia para {{titulo}} el {{fecha}}.', ARRAY['titulo','fecha'], true)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- 9. Activar módulo
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo)
VALUES ('11111111-1111-1111-1111-111111111111', 'comunicaciones_web', true)
ON CONFLICT (tenant_id, modulo_slug) DO UPDATE SET activo = true;
