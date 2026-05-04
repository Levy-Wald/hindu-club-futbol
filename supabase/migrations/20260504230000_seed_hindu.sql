-- =============================================================================
-- Migration 0002: Seed Hindu Club — datos operativos iniciales
-- Fecha: 2026-05-04
-- Descripción: Tenant Hindu, persona admin Yair, catálogos tenant-scoped,
--              módulos activos, sedes, federaciones, persona operador Lavagno.
-- =============================================================================

-- Disable audit triggers during seed (no auth context, tenants table lacks tenant_id field)
ALTER TABLE tenants DISABLE TRIGGER tenants_audit;
ALTER TABLE personas DISABLE TRIGGER personas_audit;
ALTER TABLE personas_atributos DISABLE TRIGGER personas_atributos_audit;

-- ---------------------------------------------------------------------------
-- 1. Atributos faltantes en catálogo global
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_atributos (slug, nombre, categoria, descripcion, activo)
VALUES
  ('staff', 'Staff', 'empleado', 'Personal interno del club', true),
  ('admin_padron', 'Admin de padrón', 'sistema', 'Administrador de padrones y socios', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Módulos faltantes en catálogo global
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_modulos (slug, nombre, descripcion, categoria, precio_usd_mensual, disponible_en_planes, activo_global)
VALUES
  ('equipos', 'Gestión de equipos', 'ABM de equipos, asignación de personas, horarios', 'core', 0, '{free,pro,enterprise}', true),
  ('autorizaciones_imagen', 'Autorizaciones de imagen', 'Gestión de consentimientos de uso de imagen', 'compliance', 5, '{pro,enterprise}', true),
  ('datos_medicos', 'Datos médicos', 'Fichas médicas, aptos, alergias, grupo sanguíneo', 'salud', 10, '{pro,enterprise}', true),
  ('vehiculos_acceso', 'Vehículos y acceso', 'Registro de vehículos para control de acceso', 'acceso', 5, '{pro,enterprise}', true),
  ('contactos_emergencia', 'Contactos de emergencia', 'Gestión de contactos de emergencia por persona', 'salud', 0, '{free,pro,enterprise}', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Tenant Hindu
-- ---------------------------------------------------------------------------
INSERT INTO tenants (id, slug, nombre, tipo, plan_slug, activo, timezone, idioma_default, email_admin)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'hindu_club',
  'Hindu Club',
  'club',
  'enterprise',
  true,
  'America/Argentina/Buenos_Aires',
  'es',
  'yair@levywald.com'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Persona Yair (admin del sistema)
-- ---------------------------------------------------------------------------
INSERT INTO personas (
  id, tenant_id, user_id, nombre, apellido,
  tipo_documento, numero_documento, email_principal,
  estado, fuente_origen, fecha_alta_sistema
)
VALUES (
  '3d2d5902-9c10-4154-8086-316b0fbe081e',
  '11111111-1111-1111-1111-111111111111',
  '231fa500-6935-4d6a-9228-cd436713da50',
  'Yair',
  'Levy Wald',
  'dni',
  '00000000',
  'yair@levywald.com',
  'activo',
  'manual_admin',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Atributos para Yair
-- ---------------------------------------------------------------------------
INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug, activo)
VALUES
  ('11111111-1111-1111-1111-111111111111', '3d2d5902-9c10-4154-8086-316b0fbe081e', 'admin_sistema', true),
  ('11111111-1111-1111-1111-111111111111', '3d2d5902-9c10-4154-8086-316b0fbe081e', 'admin_tenant', true),
  ('11111111-1111-1111-1111-111111111111', '3d2d5902-9c10-4154-8086-316b0fbe081e', 'socio', true);

-- ---------------------------------------------------------------------------
-- 6. Catálogo tipos socio (tenant-scoped para Hindu)
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_tipos_socio (tenant_id, slug, nombre, descripcion, activo, orden)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'titular', 'Titular', 'Socio titular pleno', true, 1),
  ('11111111-1111-1111-1111-111111111111', 'adherente', 'Adherente', 'Socio adherente', true, 2),
  ('11111111-1111-1111-1111-111111111111', 'suscriptor', 'Suscriptor', 'Socio suscriptor', true, 3),
  ('11111111-1111-1111-1111-111111111111', 'vitalicio', 'Vitalicio', 'Socio vitalicio', true, 4),
  ('11111111-1111-1111-1111-111111111111', 'honorario', 'Honorario', 'Socio honorario', true, 5),
  ('11111111-1111-1111-1111-111111111111', 'jubilado', 'Jubilado', 'Socio jubilado', true, 6),
  ('11111111-1111-1111-1111-111111111111', 'temporario', 'Temporario', 'Socio temporario', true, 7);

-- ---------------------------------------------------------------------------
-- 7. Catálogo estados padrón (tenant-scoped para Hindu)
-- ---------------------------------------------------------------------------
INSERT INTO catalogo_estados_padron (tenant_id, slug, nombre, descripcion, permite_actividad, activo, orden)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'activo', 'Activo', 'Socio al día', true, true, 1),
  ('11111111-1111-1111-1111-111111111111', 'dado_baja', 'Dado de baja', 'Socio dado de baja', false, true, 2),
  ('11111111-1111-1111-1111-111111111111', 'irregular', 'Irregular', 'Socio con cuotas impagas o documentación vencida', false, true, 3),
  ('11111111-1111-1111-1111-111111111111', 'pendiente_documentacion', 'Pendiente documentación', 'Falta completar documentación requerida', false, true, 4);

-- ---------------------------------------------------------------------------
-- 8. Módulos activos para tenant Hindu
-- ---------------------------------------------------------------------------
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo, fecha_activacion)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'disciplina_futbol', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'padron_consolidacion', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'equipos', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'autorizaciones_imagen', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'datos_medicos', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'vehiculos_acceso', true, now()),
  ('11111111-1111-1111-1111-111111111111', 'contactos_emergencia', true, now());

-- ---------------------------------------------------------------------------
-- 9. Sedes Hindu
-- ---------------------------------------------------------------------------
INSERT INTO sedes (tenant_id, slug, nombre, tipo, activa)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'sede_central', 'Sede Central', 'deportiva', true),
  ('11111111-1111-1111-1111-111111111111', 'country', 'Country', 'residencial', true);

-- ---------------------------------------------------------------------------
-- 10. Persona Lavagno (operador padrón)
-- ---------------------------------------------------------------------------
INSERT INTO personas (
  tenant_id, nombre, apellido,
  tipo_documento, numero_documento,
  estado, fuente_origen, fecha_alta_sistema
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Pablo',
  'Lavagno',
  'dni',
  '00000001',
  'activo',
  'manual_admin',
  now()
);

-- Atributos Lavagno
INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug, activo)
SELECT
  '11111111-1111-1111-1111-111111111111',
  id,
  unnest(ARRAY['staff', 'admin_padron']),
  true
FROM personas
WHERE apellido = 'Lavagno' AND tenant_id = '11111111-1111-1111-1111-111111111111'
LIMIT 1;

-- ---------------------------------------------------------------------------
-- 11. Federaciones (entidades)
-- ---------------------------------------------------------------------------
INSERT INTO entidades (tenant_id, tipo, nombre, slug, activo)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'FACCMA — Federación Argentina Macabea', 'faccma', true),
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'AIF — Israel Football Association', 'aif', true),
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'APDCC — Asociación Pampeana de Cesto-Centro', 'apdcc', true);

-- ---------------------------------------------------------------------------
-- Re-enable audit triggers
-- ---------------------------------------------------------------------------
ALTER TABLE tenants ENABLE TRIGGER tenants_audit;
ALTER TABLE personas ENABLE TRIGGER personas_audit;
ALTER TABLE personas_atributos ENABLE TRIGGER personas_atributos_audit;
