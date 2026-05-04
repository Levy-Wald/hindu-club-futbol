-- =============================================================================
-- Seed: Datos iniciales ClubCore — Hindu Club Fútbol
-- Fecha: 2026-05-04
-- =============================================================================

-- 1. Tenant Hindu
INSERT INTO tenants (id, slug, nombre, tipo, plan_slug)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'hindu_club_futbol',
  'Hindu Club Fútbol',
  'club',
  'pro'
) ON CONFLICT (id) DO NOTHING;

-- 2. Atributos builtin
INSERT INTO catalogo_atributos (slug, categoria, nombre, builtin) VALUES
  ('admin_sistema', 'sistema', 'Admin del Sistema', true),
  ('admin_tenant', 'sistema', 'Admin del Tenant', true),
  ('socio_padron', 'institucional', 'Socio del Padrón', true),
  ('dirigente', 'institucional', 'Dirigente', true),
  ('jugador', 'deportivo', 'Jugador', true),
  ('capitan', 'deportivo', 'Capitán', true),
  ('dt', 'deportivo', 'Director Técnico', true),
  ('padre_tutor', 'familiar', 'Padre/Tutor', true),
  ('jugador_fusion', 'fusion', 'Jugador Fusión', true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Vínculos builtin
INSERT INTO catalogo_vinculos (slug, nombre, builtin) VALUES
  ('padre', 'Padre', true),
  ('madre', 'Madre', true),
  ('tutor_legal', 'Tutor Legal', true),
  ('hijo', 'Hijo', true),
  ('conyuge', 'Cónyuge', true),
  ('fusion_origen', 'Fusión Origen', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Roles equipo builtin
INSERT INTO catalogo_roles_equipo (slug, nombre, categoria, builtin) VALUES
  ('jugador', 'Jugador', 'jugadores', true),
  ('capitan', 'Capitán', 'capitania', true),
  ('sub_capitan_1', 'Sub-Capitán 1', 'capitania', true),
  ('sub_capitan_2', 'Sub-Capitán 2', 'capitania', true),
  ('dt', 'Director Técnico', 'cuerpo_tecnico', true),
  ('ayudante_campo', 'Ayudante de Campo', 'cuerpo_tecnico', true),
  ('entrenador_arqueros', 'Entrenador de Arqueros', 'cuerpo_tecnico', true),
  ('kinesiologo', 'Kinesiólogo', 'salud', true),
  ('masajista', 'Masajista', 'salud', true),
  ('vestuarista', 'Vestuarista', 'otros', true),
  ('preparador_fisico', 'Preparador Físico', 'cuerpo_tecnico', true),
  ('delegado_equipo', 'Delegado de Equipo', 'delegacion', true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Federaciones (entidades)
INSERT INTO entidades (tenant_id, tipo, nombre, slug) VALUES
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'FACCMA', 'faccma'),
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'AIF', 'aif'),
  ('11111111-1111-1111-1111-111111111111', 'federacion', 'APDCC', 'apdcc');

-- 6. Sede Hindu
INSERT INTO sedes (tenant_id, nombre, slug, tipo)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Hindu Club',
  'hindu_principal',
  'deportiva'
);

-- 7. Padrones Hindu
INSERT INTO padrones (tenant_id, nombre, slug, tipo, es_externo) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Padrón Hindu Global', 'global', 'global', true),
  ('11111111-1111-1111-1111-111111111111', 'Padrón Fútbol', 'futbol', 'deportivo', false);

-- 8. Módulos catálogo
INSERT INTO catalogo_modulos (slug, nombre, descripcion, categoria, precio_usd_mensual) VALUES
  ('disciplina_futbol', 'Disciplina Fútbol', 'Operación deportiva fútbol', 'disciplina', 30),
  ('padron_consolidacion', 'Consolidación de padrones', 'Sync con padrón externo', 'integracion', 10),
  ('cuotas_recurrentes', 'Cuotas recurrentes', 'Emisión y cobro de cuotas', 'integracion', 10),
  ('caja_multiarea', 'Cajas múltiples por área', 'Cajas separadas con consolidación', 'integracion', 10)
ON CONFLICT (slug) DO NOTHING;

-- 9. Activar módulos para Hindu
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo) VALUES
  ('11111111-1111-1111-1111-111111111111', 'disciplina_futbol', true),
  ('11111111-1111-1111-1111-111111111111', 'padron_consolidacion', true),
  ('11111111-1111-1111-1111-111111111111', 'cuotas_recurrentes', true),
  ('11111111-1111-1111-1111-111111111111', 'caja_multiarea', true);
