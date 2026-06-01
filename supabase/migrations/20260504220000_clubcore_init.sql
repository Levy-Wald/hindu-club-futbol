-- =============================================================================
-- ClubCore - Migration 0001 - INIT COMPLETO
-- =============================================================================
-- Plataforma SaaS multi-tenant para gestión de clubes deportivos.
-- Modelo troncal completo: persona como identidad única + módulos vendibles.
-- Validado contra: Hindu Club Fútbol, Hacoaj, Country del Pilar, Capitán Oliver.
--
-- Autor: Yair Levy Wald · Levy Wald CMO
-- Fecha: 2026-05-04
-- Versión: 1.0
--
-- ESTRUCTURA DEL ARCHIVO:
--   Bloque 0 - Extensions
--   Bloque 1 - Catálogos extensibles (referenciables por FK)
--   Bloque 2 - Tablas core (tenants, personas)
--   Bloque 3 - Tablas relacionadas de persona troncal (15 tablas)
--   Bloque 4 - Atributos y módulos (sistema unificado de roles + módulos)
--   Bloque 5 - Sedes, canchas, padrones
--   Bloque 6 - Equipos, categorías, horarios
--   Bloque 7 - Audit log
--   Bloque 8 - Funciones helper SQL
--   Bloque 9 - Triggers
--   Bloque 10 - RLS policies
--   Bloque 11 - Índices de performance
--   Bloque 12 - Seeds de catálogos base
-- =============================================================================

-- =============================================================================
-- BLOQUE 0 - EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================================================
-- BLOQUE 1 - CATÁLOGOS EXTENSIBLES
-- =============================================================================
-- Filosofía: sin enums rígidos. Todo catálogo es una tabla referenciable por FK.
-- Cada tenant puede agregar entradas custom (campo tenant_id NULL = global).
-- =============================================================================

-- 1.1 catalogo_tipos_documento (DNI, pasaporte, libreta, etc.)
CREATE TABLE catalogo_tipos_documento (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  pais_origen text DEFAULT 'AR',
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.2 catalogo_tipos_talle (remera, calzado, casco, etc.)
CREATE TABLE catalogo_tipos_talle (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  unidad_default text,
  valores_sugeridos text[],
  aplica_a_genero text DEFAULT 'todos',
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.3 catalogo_tipos_vinculo (padre, madre, conyuge, fusion_origen, etc.)
CREATE TABLE catalogo_tipos_vinculo (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  inverso_slug text,
  es_familiar boolean DEFAULT false,
  es_legal boolean DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.4 catalogo_tipos_estudio (apto físico, ECG, ergometría, etc.)
CREATE TABLE catalogo_tipos_estudio (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  vigencia_default_dias int,
  alerta_default_dias int DEFAULT 30,
  requiere_medico_firmante boolean DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.5 catalogo_tipos_vehiculo (auto, suv, camioneta, moto, bici, etc.)
CREATE TABLE catalogo_tipos_vehiculo (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  requiere_patente boolean DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.6 catalogo_companias_seguro (Sancor, La Caja, Provincia, etc.)
CREATE TABLE catalogo_companias_seguro (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  pais text DEFAULT 'AR',
  telefono_emergencia text,
  sitio_web text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.7 catalogo_obras_sociales (OSDE, Swiss Medical, Galeno, etc.)
CREATE TABLE catalogo_obras_sociales (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  pais text DEFAULT 'AR',
  telefono_emergencia text,
  sitio_web text,
  es_prepaga boolean DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.8 catalogo_tipos_autorizacion (imagen, datos, traslado, etc.)
CREATE TABLE catalogo_tipos_autorizacion (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  vigencia_default_dias int,
  requerida_para_menor boolean DEFAULT false,
  requerida_general boolean DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.9 catalogo_tipos_evento_personal (cumpleaños, aniversario, bar mitzvah, etc.)
CREATE TABLE catalogo_tipos_evento_personal (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  es_recurrente_anual boolean DEFAULT false,
  template_saludo_default text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.10 catalogo_atributos (sistema unificado de roles)
CREATE TABLE catalogo_atributos (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  descripcion text,
  permisos jsonb DEFAULT '[]'::jsonb,
  excluye_atributos text[],
  requiere_atributos text[],
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.11 catalogo_estados_persona
CREATE TABLE catalogo_estados_persona (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  permite_actividad boolean DEFAULT true,
  bloquea_acceso boolean DEFAULT false,
  color_ui text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.12 catalogo_motivos_baja
CREATE TABLE catalogo_motivos_baja (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.13 catalogo_modulos (módulos vendibles del SaaS)
CREATE TABLE catalogo_modulos (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  categoria text NOT NULL,
  dependencias text[] DEFAULT ARRAY[]::text[],
  incompatibilidades text[] DEFAULT ARRAY[]::text[],
  precio_usd_mensual numeric(10,2),
  disponible_en_planes text[] DEFAULT ARRAY['pro', 'enterprise'],
  beta boolean DEFAULT false,
  activo_global boolean DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.14 catalogo_disciplinas
CREATE TABLE catalogo_disciplinas (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  modulo_slug text REFERENCES catalogo_modulos(slug),
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.15 catalogo_niveles_competencia
CREATE TABLE catalogo_niveles_competencia (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  orden int DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.16 catalogo_roles_equipo (jugador, capitán, dt, kine, etc.)
CREATE TABLE catalogo_roles_equipo (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  categoria text NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 1.17 catalogo_tipos_socio (configurable por tenant)
-- NOTA: tipos_socio puede tener variantes por tenant. Slug global por defecto.
CREATE TABLE catalogo_tipos_socio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  slug text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- 1.18 catalogo_estados_padron (configurable por tenant)
CREATE TABLE catalogo_estados_padron (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  slug text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  permite_actividad boolean DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- 1.19 catalogo_categorias_movimiento (ingresos/egresos)
CREATE TABLE catalogo_categorias_movimiento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  slug text NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('ingreso','egreso','transferencia')),
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- 1.20 catalogo_planes_comerciales (free, pro, enterprise)
CREATE TABLE catalogo_planes_comerciales (
  slug text PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  precio_base_usd_mensual numeric(10,2),
  modulos_incluidos text[] DEFAULT ARRAY[]::text[],
  limite_usuarios int,
  limite_personas int,
  activo boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);


-- =============================================================================
-- BLOQUE 2 - TABLAS CORE
-- =============================================================================

-- 2.1 tenants
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL DEFAULT 'club'
    CHECK (tipo IN ('club','country','federacion','capitan_amateur','saas_cliente','escuela_deportiva')),
  plan_slug text NOT NULL DEFAULT 'pro'
    REFERENCES catalogo_planes_comerciales(slug),
  activo boolean NOT NULL DEFAULT true,
  dominio_custom text,
  configuracion jsonb DEFAULT '{}'::jsonb,
  -- Branding
  logo_url text,
  color_principal text,
  color_secundario text,
  idioma_default text DEFAULT 'es-AR',
  timezone text DEFAULT 'America/Argentina/Buenos_Aires',
  -- Contacto
  email_admin text,
  telefono text,
  direccion jsonb,
  -- Sistema
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

COMMENT ON TABLE tenants IS 'Cada tenant es un cliente del SaaS (club, country, federación, capitán amateur)';

-- =============================================================================
-- 2.2 personas - IDENTIDAD ÚNICA (tabla central del troncal)
-- =============================================================================
-- Esta tabla contiene los campos directos. Datos sensibles y datos N:1 viven
-- en tablas relacionadas (datos_medicos, datos_economicos, talles, vehículos, etc.)
-- =============================================================================

CREATE TABLE personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- ============ SECCIÓN 1: IDENTIDAD ============
  nombre text NOT NULL,
  apellido text NOT NULL,
  nombre_completo_legal text,
  fecha_nacimiento date,
  genero text CHECK (genero IN ('masculino','femenino','no_binario','otro','prefiere_no_decir')),
  nacionalidad text DEFAULT 'AR',
  nacionalidades_secundarias text[],
  estado_civil text CHECK (estado_civil IN ('soltero','casado','divorciado','viudo','en_pareja','conviviente','separado')),
  foto_perfil_url text,
  foto_credencial_url text,

  -- Documentos identidad (numéricos)
  tipo_documento text NOT NULL DEFAULT 'dni' REFERENCES catalogo_tipos_documento(slug),
  numero_documento text NOT NULL,
  dni_pais_emision text DEFAULT 'AR',
  cuil_cuit text,
  pasaporte_numero text,
  pasaporte_pais text,
  pasaporte_vigencia date,
  visas_activas jsonb DEFAULT '[]'::jsonb,

  -- ============ SECCIÓN 2: CONTACTO ============
  email_principal citext,
  email_secundario citext,
  telefono_principal text,
  telefono_secundario text,
  whatsapp text,
  whatsapp_emergencia text,

  -- Dirección estructurada
  direccion_calle text,
  direccion_numero text,
  direccion_piso text,
  direccion_depto text,
  direccion_barrio text,
  direccion_ciudad text,
  direccion_provincia text,
  direccion_codigo_postal text,
  direccion_pais text DEFAULT 'AR',
  direccion_lat numeric(10, 7),
  direccion_lng numeric(10, 7),
  direccion_observaciones text,

  -- Redes sociales
  redes_sociales jsonb DEFAULT '{}'::jsonb,

  -- ============ SECCIÓN 10: PERFIL DEPORTIVO CROSS (campos directos) ============
  lateralidad text CHECK (lateralidad IN ('zurdo','derecho','ambidiestro')),
  pie_dominante text CHECK (pie_dominante IN ('izquierdo','derecho','ambidiestro')),
  mano_dominante text CHECK (mano_dominante IN ('izquierda','derecha','ambidiestra')),
  tipo_pisada text CHECK (tipo_pisada IN ('pronador','supinador','neutro','desconocido')),
  altura_cm int CHECK (altura_cm > 0 AND altura_cm < 300),
  peso_kg numeric(5,2) CHECK (peso_kg > 0 AND peso_kg < 500),
  fecha_medicion_fisica date,
  contextura text CHECK (contextura IN ('pequeña','mediana','grande','atletica')),
  usa_lentes boolean DEFAULT false,
  tipo_lentes text,
  graduacion_optica text,
  usa_audifono boolean DEFAULT false,

  -- Carrera deportiva (resumen, tablas relacionadas para detalle)
  años_practica_deporte_principal int,
  deporte_principal_slug text,
  deportes_secundarios text[],
  categoria_historica_max text CHECK (categoria_historica_max IN ('recreativo','federado','profesional','seleccion','olimpico')),
  nivel_actividad_actual text CHECK (nivel_actividad_actual IN ('sedentario','ligero','moderado','alto','atleta')),
  frecuencia_entrenamiento_semanal int,
  horas_entrenamiento_semanales numeric(4,1),
  entrenador_actual_principal_id uuid,

  -- ============ SECCIÓN 11: PROFESIONAL/PERSONAL ============
  profesion_ocupacion text,
  categoria_profesional text CHECK (categoria_profesional IN ('empleado','autonomo','empresario','profesional_independiente','jubilado','estudiante','ama_de_casa','sin_actividad','otro')),
  empresa_actual text,
  cargo_actual text,
  industria text,
  antiguedad_años_carrera int,
  sitio_web_profesional text,

  -- Educativo
  nivel_educativo_max text CHECK (nivel_educativo_max IN (
    'primaria_incompleta','primaria','secundaria_incompleta','secundaria',
    'terciario_incompleto','terciario','universitario_incompleto','universitario',
    'posgrado','doctorado'
  )),
  titulo_carrera text,
  institucion_titulo text,
  año_graduacion int,
  estudiando_actualmente boolean DEFAULT false,
  institucion_actual text,
  año_grado_actual text,
  es_alumno_polo_educativo boolean DEFAULT false,

  -- Idiomas
  idioma_nativo text DEFAULT 'es',

  -- ============ SECCIÓN 12: SISTEMA ============
  estado text NOT NULL DEFAULT 'activo' REFERENCES catalogo_estados_persona(slug),
  motivo_baja_slug text REFERENCES catalogo_motivos_baja(slug),
  motivo_baja_detalle text,
  fecha_baja date,
  fecha_pausa_inicio date,
  fecha_pausa_fin date,
  motivo_pausa text,
  fecha_alta_sistema timestamptz NOT NULL DEFAULT now(),
  fecha_primera_actividad date,

  -- Origen del registro
  fuente_origen text NOT NULL DEFAULT 'manual_admin'
    CHECK (fuente_origen IN ('manual_admin','form_publico','excel_bulk','api_externa','webhook','scrapping','mcp','sync_padron_externo')),
  fuente_origen_detalle text,
  fuente_origen_referencia text,
  importado_por_persona_id uuid,
  importado_lote_id uuid,

  -- Tags y notas internas
  tags_internos text[] DEFAULT ARRAY[]::text[],
  notas_internas text,
  restricciones_especiales text[] DEFAULT ARRAY[]::text[],

  -- Sync externo
  external_ids jsonb DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  sync_provider text,

  -- ============ SECCIÓN 17: HISTÓRICO MEMBRESÍA ============
  fecha_primera_relacion_club date,
  es_socio_fundador boolean DEFAULT false,
  es_socio_vitalicio boolean DEFAULT false,
  es_socio_honorario boolean DEFAULT false,
  recomendado_por_persona_id uuid,
  bautizo_club_realizado boolean DEFAULT false,

  -- ============ Sistema audit ============
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- ============ Constraints ============
  UNIQUE (tenant_id, tipo_documento, numero_documento)
);

COMMENT ON TABLE personas IS 'Tabla central de identidad. Una persona = una identidad. Dedupe por DNI dentro del tenant.';
COMMENT ON COLUMN personas.user_id IS 'NULL si la persona no tiene cuenta de login. Algunos casos: menor cuyo padre tiene cuenta, contacto externo no socio';
COMMENT ON COLUMN personas.tags_internos IS 'Tags operativas internas. NO visibles para la propia persona. Solo admin_tenant ve esto';
COMMENT ON COLUMN personas.estado IS 'Estado actual. Catálogo: activo, pausado, suspendido, baja, baja_temporal, pendiente_revision, fallecido';

-- FK self-reference para entrenador y recomendador
ALTER TABLE personas
  ADD CONSTRAINT personas_entrenador_fk
  FOREIGN KEY (entrenador_actual_principal_id) REFERENCES personas(id) ON DELETE SET NULL;

ALTER TABLE personas
  ADD CONSTRAINT personas_recomendado_fk
  FOREIGN KEY (recomendado_por_persona_id) REFERENCES personas(id) ON DELETE SET NULL;

ALTER TABLE personas
  ADD CONSTRAINT personas_importado_por_fk
  FOREIGN KEY (importado_por_persona_id) REFERENCES personas(id) ON DELETE SET NULL;


-- =============================================================================
-- BLOQUE 3 - TABLAS RELACIONADAS DE PERSONA TRONCAL
-- =============================================================================
-- 15 tablas que extienden la ficha de persona en relación 1:N o 1:1
-- =============================================================================

-- 3.1 personas_idiomas (1:N)
CREATE TABLE personas_idiomas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  idioma text NOT NULL,
  nivel text NOT NULL CHECK (nivel IN ('basico','intermedio','avanzado','nativo')),
  certificado_url text,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (persona_id, idioma)
);

-- 3.2 personas_obra_social (1:1 lógicamente, soporta history)
CREATE TABLE personas_obra_social (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  obra_social_slug text REFERENCES catalogo_obras_sociales(slug),
  obra_social_otra_nombre text,
  plan text,
  numero_afiliado text,
  titular_nombre text,
  titular_dni text,
  telefono_emergencia text,
  archivo_credencial_url text,
  prepaga_adicional text,
  vigencia_desde date,
  vigencia_hasta date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_personas_obra_social_persona_activo
  ON personas_obra_social(persona_id) WHERE activo = true;

-- 3.3 personas_datos_medicos (1:1)
-- TABLA SENSIBLE - RLS estricta
CREATE TABLE personas_datos_medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL UNIQUE REFERENCES personas(id) ON DELETE CASCADE,

  grupo_sanguineo text CHECK (grupo_sanguineo IN ('A','B','AB','O','desconocido')),
  factor_rh text CHECK (factor_rh IN ('positivo','negativo','desconocido')),
  donante_organos boolean DEFAULT false,

  alergias_medicamentos text[] DEFAULT ARRAY[]::text[],
  alergias_medicamentos_detalle jsonb DEFAULT '[]'::jsonb,
  alergias_alimentarias text[] DEFAULT ARRAY[]::text[],
  alergias_alimentarias_detalle jsonb DEFAULT '[]'::jsonb,
  alergias_otras text,

  medicamentos_actuales jsonb DEFAULT '[]'::jsonb,
  antecedentes_medicos text,
  enfermedades_cronicas text[] DEFAULT ARRAY[]::text[],

  vacunas_obligatorias_dia boolean DEFAULT false,
  covid_vacuna_dosis int DEFAULT 0,

  embarazo boolean DEFAULT false,
  embarazo_semanas int,
  fecha_ultima_revision_medica date,

  -- Médico de cabecera
  medico_cabecera_nombre text,
  medico_cabecera_telefono text,
  medico_cabecera_email text,
  medico_cabecera_especialidad text,
  medico_cabecera_institucion text,

  -- Visibilidad
  notas_medicas text,
  notas_visibles_a_persona boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE personas_datos_medicos IS 'TABLA SENSIBLE. RLS estricta. Solo persona, tutores, médicos club, admin_tenant';

-- 3.4 personas_lesiones (1:N)
CREATE TABLE personas_lesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_lesion text NOT NULL,
  zona_corporal text,
  gravedad text CHECK (gravedad IN ('leve','moderada','grave','muy_grave')),
  fecha_inicio date NOT NULL,
  fecha_alta_medica date,
  recuperada boolean DEFAULT false,
  restriccion_actividad text,
  archivo_estudio_url text,
  diagnostico_medico text,
  tratamiento text,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.5 personas_talles (1:N con history)
CREATE TABLE personas_talles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_talle_slug text NOT NULL REFERENCES catalogo_tipos_talle(slug),
  valor text NOT NULL,
  unidad text,
  fecha_medicion date DEFAULT CURRENT_DATE,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_personas_talles_persona_activo
  ON personas_talles(persona_id) WHERE activo = true;

-- 3.6 personas_contactos_emergencia (1:N)
CREATE TABLE personas_contactos_emergencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  nombre_completo text NOT NULL,
  vinculo_slug text REFERENCES catalogo_tipos_vinculo(slug),
  vinculo_otro text,
  telefono_principal text NOT NULL,
  telefono_secundario text,
  whatsapp text,
  email citext,
  vive_en_argentina boolean DEFAULT true,
  pais_residencia text,
  es_persona_sistema boolean DEFAULT false,
  persona_id_vinculada uuid REFERENCES personas(id) ON DELETE SET NULL,
  prioridad int DEFAULT 1 CHECK (prioridad BETWEEN 1 AND 10),
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.7 personas_documentos_identidad (1:N)
CREATE TABLE personas_documentos_identidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_documento text NOT NULL,
  archivo_url text NOT NULL,
  formato text,
  fecha_emision date,
  fecha_vencimiento date,
  numero_documento_referenciado text,
  lugar_emision text,
  validado boolean DEFAULT false,
  validado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  validado_fecha timestamptz,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.8 personas_documentos_medicos (1:N) con vigencias
CREATE TABLE personas_documentos_medicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_estudio_slug text NOT NULL REFERENCES catalogo_tipos_estudio(slug),
  tipo_estudio_otro text,
  archivo_url text,
  fecha_estudio date NOT NULL,
  fecha_vencimiento date,
  resultado text CHECK (resultado IN ('apto','no_apto','apto_con_observaciones','pendiente')),
  observaciones text,
  medico_firmante_nombre text,
  medico_firmante_matricula text,
  medico_firmante_especialidad text,
  institucion_emisora text,
  aplica_disciplinas text[],
  validado boolean DEFAULT false,
  validado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  validado_fecha timestamptz,
  alerta_vencimiento_dias int DEFAULT 30,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_personas_doc_med_vencimiento
  ON personas_documentos_medicos(fecha_vencimiento)
  WHERE activo = true;

-- 3.9 personas_vehiculos (1:N)
CREATE TABLE personas_vehiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

  -- Datos vehículo
  tipo_vehiculo_slug text NOT NULL REFERENCES catalogo_tipos_vehiculo(slug),
  marca text NOT NULL,
  modelo text NOT NULL,
  año int CHECK (año >= 1900 AND año <= EXTRACT(YEAR FROM now()) + 2),
  patente text NOT NULL,
  pais_patente text DEFAULT 'AR',
  color text,
  combustible text CHECK (combustible IN ('nafta','diesel','electrico','hibrido','gnc','otro')),
  foto_vehiculo_url text,

  -- Seguro
  seguro_compania_slug text REFERENCES catalogo_companias_seguro(slug),
  seguro_compania_otra text,
  seguro_numero_poliza text,
  seguro_tipo_cobertura text CHECK (seguro_tipo_cobertura IN ('responsabilidad_civil','terceros_completo','todo_riesgo','otro')),
  seguro_vigencia_desde date,
  seguro_vigencia_hasta date,
  seguro_archivo_url text,

  -- Titularidad y acceso
  tipo_titularidad text CHECK (tipo_titularidad IN ('titular','conductor_autorizado','vehiculo_familiar','empresa','alquiler')),
  titular_nombre text,
  titular_dni text,
  permite_ingreso_club boolean DEFAULT true,
  lugar_estacionamiento_asignado text,
  tag_rfid_estacionamiento text,
  notas text,

  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,

  UNIQUE (tenant_id, patente, pais_patente)
);

-- 3.10 personas_vinculos (1:N) - vínculos familiares + fusiones
CREATE TABLE personas_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_origen_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  persona_destino_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_vinculo_slug text NOT NULL REFERENCES catalogo_tipos_vinculo(slug),
  es_tutor_legal boolean DEFAULT false,
  puede_retirar_menor boolean DEFAULT false,
  puede_autorizar_actividades boolean DEFAULT false,
  paga_cuotas_de_origen boolean DEFAULT false,
  es_contacto_emergencia boolean DEFAULT false,
  fecha_inicio date,
  fecha_fin date,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,

  CHECK (persona_origen_id <> persona_destino_id)
);

CREATE INDEX idx_personas_vinculos_origen ON personas_vinculos(persona_origen_id) WHERE activo = true;
CREATE INDEX idx_personas_vinculos_destino ON personas_vinculos(persona_destino_id) WHERE activo = true;

-- 3.11 personas_autorizaciones (1:N)
CREATE TABLE personas_autorizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_autorizacion_slug text NOT NULL REFERENCES catalogo_tipos_autorizacion(slug),
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','firmada','rechazada','vencida','revocada')),
  fecha_firma date,
  fecha_vencimiento date,
  firmado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  archivo_firmado_url text,
  metodo_firma text CHECK (metodo_firma IN ('manuscrita_papel','digital_dibujo','oauth_check','email_confirmacion','acta_papel','otro')),
  ip_firma text,
  user_agent_firma text,
  alcance text[],
  observaciones text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.12 personas_preferencias_comunicacion (1:1)
CREATE TABLE personas_preferencias_comunicacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL UNIQUE REFERENCES personas(id) ON DELETE CASCADE,
  idioma_preferido text DEFAULT 'es-AR',
  canal_preferido text DEFAULT 'whatsapp'
    CHECK (canal_preferido IN ('whatsapp','email','sms','in_app','llamada','multi')),
  canal_emergencia text,
  horario_preferido_inicio time DEFAULT '09:00',
  horario_preferido_fin time DEFAULT '21:00',
  dias_no_contactar text[] DEFAULT ARRAY[]::text[],
  opt_in_marketing boolean DEFAULT false,
  opt_in_eventos_club boolean DEFAULT true,
  opt_in_partners boolean DEFAULT false,
  opt_in_torneos boolean DEFAULT true,
  frecuencia_resumen text DEFAULT 'semanal'
    CHECK (frecuencia_resumen IN ('diario','semanal','quincenal','mensual','nunca')),
  recibe_factura_papel boolean DEFAULT false,
  recibe_revista_papel boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.13 personas_credenciales_acceso (1:1) - acceso físico al club
CREATE TABLE personas_credenciales_acceso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL UNIQUE REFERENCES personas(id) ON DELETE CASCADE,

  numero_socio text,
  formato_numero_socio text,
  tarjeta_socio_numero text,
  tarjeta_socio_tipo text CHECK (tarjeta_socio_tipo IN ('nfc','banda_magnetica','codigo_barras','qr','sin_tarjeta')),
  tarjeta_vigencia_hasta date,
  pin_acceso_hash text,

  -- Biometría
  biometria_huella_registrada boolean DEFAULT false,
  biometria_huella_fecha date,
  biometria_huella_provider text,
  biometria_huella_template_id text,
  biometria_facial_registrada boolean DEFAULT false,
  biometria_facial_provider text,
  biometria_iris_registrada boolean DEFAULT false,

  -- Restricciones
  puede_acceder_sin_pago boolean DEFAULT true,
  sedes_permitidas text[],
  horarios_permitidos jsonb DEFAULT '{}'::jsonb,
  areas_permitidas text[],
  sancion_acceso_activa boolean DEFAULT false,
  sancion_motivo text,
  sancion_fecha_fin date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,

  UNIQUE (tenant_id, numero_socio)
);

-- 3.14 personas_datos_economicos (1:1) - SENSIBLE
CREATE TABLE personas_datos_economicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL UNIQUE REFERENCES personas(id) ON DELETE CASCADE,

  medio_pago_preferido text CHECK (medio_pago_preferido IN ('debito_automatico_cbu','debito_automatico_tarjeta','transferencia','efectivo','mercadopago','link_pago','otro')),
  medio_pago_secundario text,
  cbu_cvu text,
  banco_titular text,
  tipo_cuenta text CHECK (tipo_cuenta IN ('caja_ahorro','cuenta_corriente','otro')),
  alias_bancario text,

  tarjeta_credito_marca text,
  tarjeta_credito_ultimos_4 text,
  tarjeta_credito_token text,
  tarjeta_credito_vencimiento text,

  -- Facturación
  pide_factura_a boolean DEFAULT false,
  razon_social_factura text,
  cuit_factura text,
  condicion_iva text CHECK (condicion_iva IN ('consumidor_final','responsable_inscripto','monotributo','exento','no_responsable','otro')),
  domicilio_fiscal_difiere boolean DEFAULT false,
  domicilio_fiscal jsonb,

  -- Responsable de pago
  paga_otra_persona boolean DEFAULT false,
  responsable_pago_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  empresa_paga boolean DEFAULT false,
  empresa_paga_razon_social text,
  empresa_paga_cuit text,
  beneficio_laboral boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE personas_datos_economicos IS 'TABLA SENSIBLE. RLS estricta. CBU y tarjetas almacenadas con token, no número completo';

-- 3.15 personas_eventos_personales (1:N)
CREATE TABLE personas_eventos_personales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_evento_slug text NOT NULL REFERENCES catalogo_tipos_evento_personal(slug),
  fecha date NOT NULL,
  es_recurrente_anual boolean DEFAULT false,
  año_celebracion int,
  nombre_evento text,
  lugar_evento text,
  enviar_saludo_club boolean DEFAULT true,
  template_saludo_slug text,
  foto_evento_url text,
  es_publico_club boolean DEFAULT false,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.16 personas_datos_alimentarios (1:1)
CREATE TABLE personas_datos_alimentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL UNIQUE REFERENCES personas(id) ON DELETE CASCADE,

  dieta_principal text CHECK (dieta_principal IN ('omnivoro','vegetariano','vegano','pescatariano','flexitariano','otro')),
  restricciones_religiosas text[] DEFAULT ARRAY[]::text[],
  alergias_alimentarias_severas text[] DEFAULT ARRAY[]::text[],
  alergias_alimentarias_otros text,
  intolerancias text[] DEFAULT ARRAY[]::text[],
  celiaco boolean DEFAULT false,
  celiaco_certificado_url text,
  diabetico boolean DEFAULT false,
  diabetico_tipo text CHECK (diabetico_tipo IN ('tipo_1','tipo_2','gestacional','otro')),
  preferencias_comida text,

  suplementos_actuales jsonb DEFAULT '[]'::jsonb,
  suplementos_prohibidos text[] DEFAULT ARRAY[]::text[],
  nutricionista_actual_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  sigue_plan_nutricional boolean DEFAULT false,
  plan_nutricional_archivo_url text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.17 personas_media (galería personal 1:N)
CREATE TABLE personas_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  tipo_media text NOT NULL CHECK (tipo_media IN ('foto','video','audio')),
  categoria_slug text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  formato text,
  fecha_captura date,
  lugar_captura text,
  evento_relacionado text,
  personas_etiquetadas uuid[] DEFAULT ARRAY[]::uuid[],
  es_publica_club boolean DEFAULT false,
  es_publica_redes boolean DEFAULT false,
  autor_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.18 personas_clubes_anteriores (1:N) - histórico carrera
CREATE TABLE personas_clubes_anteriores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  club_nombre text NOT NULL,
  deporte_slug text,
  año_desde int,
  año_hasta int,
  categoria text,
  observaciones text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.19 personas_premios_logros (1:N)
CREATE TABLE personas_premios_logros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  premio_titulo text NOT NULL,
  año int,
  deporte_slug text,
  lugar_obtenido text,
  organizacion_otorgante text,
  archivo_certificado_url text,
  observaciones text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.20 personas_selecciones (1:N) - representaciones nacionales/regionales
CREATE TABLE personas_selecciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  seleccion_nombre text NOT NULL,
  año int,
  deporte_slug text,
  observacion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3.21 personas_incidentes_internos (1:N) - tags operativas
CREATE TABLE personas_incidentes_internos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  severidad text CHECK (severidad IN ('leve','media','grave','muy_grave')),
  tipo_incidente text,
  descripcion text NOT NULL,
  resolucion text,
  resuelto boolean DEFAULT false,
  resuelto_fecha date,
  registrado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);


-- =============================================================================
-- BLOQUE 4 - ATRIBUTOS Y MÓDULOS
-- =============================================================================
-- Sistema unificado de roles (atributos) + módulos por tenant
-- =============================================================================

-- 4.1 personas_atributos (los roles se modelan acá)
CREATE TABLE personas_atributos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  atributo_slug text NOT NULL REFERENCES catalogo_atributos(slug),
  valor jsonb DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_fin date,
  asignado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_personas_atributos_persona_activo
  ON personas_atributos(persona_id) WHERE activo = true;
CREATE INDEX idx_personas_atributos_slug
  ON personas_atributos(atributo_slug) WHERE activo = true;

-- 4.2 tenant_modulos (módulos activos por tenant)
CREATE TABLE tenant_modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  modulo_slug text NOT NULL REFERENCES catalogo_modulos(slug),
  activo boolean NOT NULL DEFAULT true,
  fecha_activacion timestamptz DEFAULT now(),
  fecha_desactivacion timestamptz,
  activado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  configuracion jsonb DEFAULT '{}'::jsonb,
  precio_pactado numeric(10,2),
  plan_incluido_en text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, modulo_slug)
);

-- =============================================================================
-- BLOQUE 5 - SEDES, CANCHAS, ENTIDADES, PADRONES
-- =============================================================================

-- 5.1 entidades (clubes externos, federaciones, sponsors, proveedores)
CREATE TABLE entidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CHECK (tipo IN ('club','federacion','sponsor','partner','proveedor','country','escuela','medico','otro')),
  nombre text NOT NULL,
  slug text NOT NULL,
  entidad_padre_id uuid REFERENCES entidades(id) ON DELETE SET NULL,
  sitio_web text,
  telefono text,
  email citext,
  direccion jsonb,
  logo_url text,
  cuit text,
  razon_social text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, slug)
);

-- 5.2 sedes
CREATE TABLE sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nombre text NOT NULL,
  tipo text DEFAULT 'deportiva'
    CHECK (tipo IN ('deportiva','educativa','residencial','mixta','administrativa','otra')),
  direccion jsonb,
  lat numeric(10,7),
  lng numeric(10,7),
  telefono text,
  email citext,
  horario_atencion jsonb DEFAULT '{}'::jsonb,
  capacidad_personas int,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, slug)
);

-- 5.3 canchas (instalaciones dentro de sedes)
CREATE TABLE canchas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sede_id uuid NOT NULL REFERENCES sedes(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo text NOT NULL,
  superficie text,
  iluminada boolean DEFAULT false,
  techada boolean DEFAULT false,
  capacidad_jugadores int,
  capacidad_espectadores int,
  disponible_para_alquiler boolean DEFAULT false,
  precio_alquiler_hora numeric(10,2),
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 5.4 padrones (multi-padrón configurable)
CREATE TABLE padrones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  nombre text NOT NULL,
  tipo text DEFAULT 'global'
    CHECK (tipo IN ('global','deportivo','educativo','residencial','administrativo','otro')),
  es_externo boolean DEFAULT false,
  fuente_externa text,
  disciplina_slug text REFERENCES catalogo_disciplinas(slug),
  activo boolean NOT NULL DEFAULT true,
  configuracion jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, slug)
);

-- 5.5 personas_padrones
CREATE TABLE personas_padrones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  padron_id uuid NOT NULL REFERENCES padrones(id) ON DELETE CASCADE,
  estado_padron_id uuid REFERENCES catalogo_estados_padron(id),
  tipo_socio_id uuid REFERENCES catalogo_tipos_socio(id),
  fecha_alta date DEFAULT CURRENT_DATE,
  fecha_baja date,
  motivo_baja_slug text REFERENCES catalogo_motivos_baja(slug),
  numero_socio text,
  origen_alta text DEFAULT 'manual',
  fuente_externa_id text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, persona_id, padron_id)
);

-- 5.6 personas_historial_padron (auditoría de altas/bajas)
CREATE TABLE personas_historial_padron (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  padron_id uuid NOT NULL REFERENCES padrones(id) ON DELETE CASCADE,
  evento text NOT NULL CHECK (evento IN ('alta','baja','suspension','reactivacion','cambio_categoria','cambio_tipo_socio')),
  fecha_evento date DEFAULT CURRENT_DATE,
  estado_anterior_slug text,
  estado_nuevo_slug text,
  tipo_socio_anterior_slug text,
  tipo_socio_nuevo_slug text,
  motivo text,
  realizado_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 5.7 pre_inscripciones (form público landing)
CREATE TABLE pre_inscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  padron_id uuid REFERENCES padrones(id) ON DELETE SET NULL,
  datos jsonb NOT NULL,
  estado text DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','en_revision','aprobada','rechazada','convertida','expirada')),
  persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  fecha_envio timestamptz DEFAULT now(),
  fecha_revision timestamptz,
  revisada_por_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  motivo_rechazo text,
  origen text,
  url_landing text,
  periodo_prueba_dias int DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- =============================================================================
-- BLOQUE 6 - EQUIPOS, CATEGORÍAS, HORARIOS
-- =============================================================================

-- 6.1 categorias_equipo
CREATE TABLE categorias_equipo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  disciplina_slug text NOT NULL REFERENCES catalogo_disciplinas(slug),
  modalidad text CHECK (modalidad IN ('M','F','mixto')),
  tipo_categoria text CHECK (tipo_categoria IN ('sub_X','año_nacimiento','primera','libre','adulto_mayor','recreativo')),
  valor text,
  nombre_display text NOT NULL,
  edad_min int,
  edad_max int,
  nivel_competencia_slug text REFERENCES catalogo_niveles_competencia(slug),
  activa boolean NOT NULL DEFAULT true,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 6.2 equipos
CREATE TABLE equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entidad_id uuid REFERENCES entidades(id) ON DELETE SET NULL,
  disciplina_slug text NOT NULL REFERENCES catalogo_disciplinas(slug),
  categoria_id uuid REFERENCES categorias_equipo(id) ON DELETE SET NULL,
  modalidad text CHECK (modalidad IN ('M','F','mixto')),
  nombre text NOT NULL,
  nivel_competencia_slug text REFERENCES catalogo_niveles_competencia(slug),
  color_principal text,
  color_secundario text,
  foto_url text,
  escudo_url text,
  sede_principal_id uuid REFERENCES sedes(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 6.3 equipos_competencias (multi-torneo simultáneo)
CREATE TABLE equipos_competencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipo_id uuid NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  federacion_id uuid REFERENCES entidades(id) ON DELETE SET NULL,
  torneo_nombre text NOT NULL,
  categoria_externa text,
  numero_afiliacion text,
  fecha_alta date DEFAULT CURRENT_DATE,
  fecha_baja date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 6.4 equipos_horarios
CREATE TABLE equipos_horarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipo_id uuid NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  dia_semana int CHECK (dia_semana BETWEEN 1 AND 7),
  hora_inicio time,
  hora_fin time,
  sede_id uuid REFERENCES sedes(id) ON DELETE SET NULL,
  cancha_id uuid REFERENCES canchas(id) ON DELETE SET NULL,
  tipo_actividad text CHECK (tipo_actividad IN ('entrenamiento','partido_local','partido_visitante','amistoso','torneo','otro')),
  instructor_principal_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  fecha_vigencia_desde date,
  fecha_vigencia_hasta date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 6.5 personas_equipos
CREATE TABLE personas_equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  equipo_id uuid NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
  rol_equipo_slug text NOT NULL REFERENCES catalogo_roles_equipo(slug),
  dorsal int,
  posicion text,
  fecha_inicio date DEFAULT CURRENT_DATE,
  fecha_fin date,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (tenant_id, persona_id, equipo_id, rol_equipo_slug)
);

-- 6.6 personas_historial_categoria_deportiva
CREATE TABLE personas_historial_categoria_deportiva (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  año int NOT NULL,
  disciplina_slug text REFERENCES catalogo_disciplinas(slug),
  categoria_display text,
  equipo_id uuid REFERENCES equipos(id) ON DELETE SET NULL,
  observacion text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);


-- =============================================================================
-- BLOQUE 7 - AUDIT LOG
-- =============================================================================

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  ts timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_persona_id uuid REFERENCES personas(id) ON DELETE SET NULL,
  actor_tipo text CHECK (actor_tipo IN ('usuario','sistema','api','webhook','mcp','sync_externo','trigger')),
  accion text NOT NULL,
  tabla text,
  registro_id uuid,
  cambios jsonb,
  ip_origen text,
  user_agent text,
  request_id text,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_log_tenant_ts ON audit_log(tenant_id, ts DESC);
CREATE INDEX idx_audit_log_tabla_registro ON audit_log(tabla, registro_id);
CREATE INDEX idx_audit_log_actor_persona ON audit_log(actor_persona_id);

-- =============================================================================
-- BLOQUE 8 - FUNCIONES HELPER SQL
-- =============================================================================

-- 8.1 get_persona_actual()
-- Devuelve la persona logueada (resuelta vía auth.uid() -> personas.user_id)
CREATE OR REPLACE FUNCTION get_persona_actual()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id FROM personas
  WHERE user_id = auth.uid()
  AND deleted_at IS NULL
  LIMIT 1;
$$;

-- 8.2 get_tenant_actual()
-- Devuelve el tenant_id de la persona logueada
-- SECURITY DEFINER desde el día 1 (lección aprendida del v1)
CREATE OR REPLACE FUNCTION get_tenant_actual()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tenant_id FROM personas
  WHERE user_id = auth.uid()
  AND deleted_at IS NULL
  LIMIT 1;
$$;

-- 8.3 tiene_atributo(slug)
CREATE OR REPLACE FUNCTION tiene_atributo(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM personas_atributos pa
    JOIN personas p ON p.id = pa.persona_id
    WHERE p.user_id = auth.uid()
    AND pa.atributo_slug = p_slug
    AND pa.activo = true
    AND (pa.fecha_fin IS NULL OR pa.fecha_fin > CURRENT_DATE)
  );
$$;

-- 8.4 modulo_activo(slug)
CREATE OR REPLACE FUNCTION modulo_activo(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_modulos tm
    JOIN personas p ON p.tenant_id = tm.tenant_id
    WHERE p.user_id = auth.uid()
    AND tm.modulo_slug = p_slug
    AND tm.activo = true
  );
$$;

-- 8.5 es_admin_tenant()
CREATE OR REPLACE FUNCTION es_admin_tenant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tiene_atributo('admin_tenant') OR tiene_atributo('admin_sistema');
$$;

-- 8.6 es_admin_sistema()
CREATE OR REPLACE FUNCTION es_admin_sistema()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT tiene_atributo('admin_sistema');
$$;

-- 8.7 es_menor_de_edad(persona_id)
CREATE OR REPLACE FUNCTION es_menor_de_edad(p_persona_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM personas
    WHERE id = p_persona_id
    AND fecha_nacimiento IS NOT NULL
    AND fecha_nacimiento > (CURRENT_DATE - INTERVAL '18 years')
  );
$$;

-- 8.8 dedupe_persona_por_dni(tenant_id, tipo_doc, numero_doc, datos)
-- Busca o crea atómicamente una persona por DNI dentro del tenant
CREATE OR REPLACE FUNCTION dedupe_persona_por_dni(
  p_tenant_id uuid,
  p_tipo_documento text,
  p_numero_documento text,
  p_datos jsonb
)
RETURNS TABLE (persona_id uuid, fue_creada boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_persona_id uuid;
  v_fue_creada boolean := false;
BEGIN
  -- Buscar
  SELECT id INTO v_persona_id
  FROM personas
  WHERE tenant_id = p_tenant_id
    AND tipo_documento = p_tipo_documento
    AND numero_documento = p_numero_documento
    AND deleted_at IS NULL
  LIMIT 1;

  -- Si no existe, crear
  IF v_persona_id IS NULL THEN
    INSERT INTO personas (
      tenant_id,
      tipo_documento,
      numero_documento,
      nombre,
      apellido,
      email_principal,
      telefono_principal,
      fuente_origen
    )
    VALUES (
      p_tenant_id,
      p_tipo_documento,
      p_numero_documento,
      COALESCE(p_datos->>'nombre', 'Sin nombre'),
      COALESCE(p_datos->>'apellido', 'Sin apellido'),
      (p_datos->>'email_principal')::citext,
      p_datos->>'telefono_principal',
      COALESCE(p_datos->>'fuente_origen', 'manual_admin')
    )
    RETURNING id INTO v_persona_id;
    v_fue_creada := true;
  END IF;

  RETURN QUERY SELECT v_persona_id, v_fue_creada;
END;
$$;

-- 8.9 trg_set_updated_at - trigger genérico
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 8.10 trg_audit_log_personas - registra cambios en personas
CREATE OR REPLACE FUNCTION trg_audit_log_personas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_persona_id uuid;
  v_cambios jsonb;
BEGIN
  -- Resolver actor
  SELECT get_persona_actual() INTO v_actor_persona_id;

  IF TG_OP = 'INSERT' THEN
    v_cambios := jsonb_build_object('nuevo', to_jsonb(NEW));
    INSERT INTO audit_log (tenant_id, actor_persona_id, actor_user_id, actor_tipo, accion, tabla, registro_id, cambios)
    VALUES (NEW.tenant_id, v_actor_persona_id, auth.uid(), 'usuario', 'INSERT', TG_TABLE_NAME, NEW.id, v_cambios);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_cambios := jsonb_build_object('anterior', to_jsonb(OLD), 'nuevo', to_jsonb(NEW));
    INSERT INTO audit_log (tenant_id, actor_persona_id, actor_user_id, actor_tipo, accion, tabla, registro_id, cambios)
    VALUES (NEW.tenant_id, v_actor_persona_id, auth.uid(), 'usuario', 'UPDATE', TG_TABLE_NAME, NEW.id, v_cambios);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_cambios := jsonb_build_object('eliminado', to_jsonb(OLD));
    INSERT INTO audit_log (tenant_id, actor_persona_id, actor_user_id, actor_tipo, accion, tabla, registro_id, cambios)
    VALUES (OLD.tenant_id, v_actor_persona_id, auth.uid(), 'usuario', 'DELETE', TG_TABLE_NAME, OLD.id, v_cambios);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- =============================================================================
-- BLOQUE 9 - TRIGGERS
-- =============================================================================
-- updated_at en todas las tablas operacionales
-- =============================================================================

-- Helper para crear triggers updated_at en bulk
DO $$
DECLARE
  t text;
  tablas text[] := ARRAY[
    'tenants','personas',
    'personas_idiomas','personas_obra_social','personas_datos_medicos',
    'personas_lesiones','personas_talles','personas_contactos_emergencia',
    'personas_documentos_identidad','personas_documentos_medicos',
    'personas_vehiculos','personas_vinculos','personas_autorizaciones',
    'personas_preferencias_comunicacion','personas_credenciales_acceso',
    'personas_datos_economicos','personas_eventos_personales',
    'personas_datos_alimentarios','personas_media',
    'personas_clubes_anteriores','personas_premios_logros','personas_selecciones',
    'personas_incidentes_internos',
    'personas_atributos','tenant_modulos',
    'entidades','sedes','canchas',
    'padrones','personas_padrones',
    'categorias_equipo','equipos','equipos_competencias','equipos_horarios','personas_equipos',
    'catalogo_tipos_socio','catalogo_estados_padron','catalogo_categorias_movimiento'
  ];
BEGIN
  FOREACH t IN ARRAY tablas
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- Audit log triggers en tablas core
CREATE TRIGGER personas_audit AFTER INSERT OR UPDATE OR DELETE ON personas
  FOR EACH ROW EXECUTE FUNCTION trg_audit_log_personas();

CREATE TRIGGER tenants_audit AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION trg_audit_log_personas();

CREATE TRIGGER personas_atributos_audit AFTER INSERT OR UPDATE OR DELETE ON personas_atributos
  FOR EACH ROW EXECUTE FUNCTION trg_audit_log_personas();


-- =============================================================================
-- BLOQUE 10 - ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Estrategia:
-- - Catálogos globales (sin tenant_id): SELECT permitido a authenticated
-- - Tablas con tenant_id: solo registros del tenant del usuario actual
-- - service_role bypass automático (Supabase lo maneja)
-- =============================================================================

-- Catálogos globales (lectura pública para auth)
ALTER TABLE catalogo_tipos_documento ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_documento_read ON catalogo_tipos_documento FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_tipos_talle ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_talle_read ON catalogo_tipos_talle FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_tipos_vinculo ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_vinculo_read ON catalogo_tipos_vinculo FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_tipos_estudio ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_estudio_read ON catalogo_tipos_estudio FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_tipos_vehiculo ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_vehiculo_read ON catalogo_tipos_vehiculo FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_companias_seguro ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_companias_seguro_read ON catalogo_companias_seguro FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_obras_sociales ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_obras_sociales_read ON catalogo_obras_sociales FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_tipos_autorizacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_autorizacion_read ON catalogo_tipos_autorizacion FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_tipos_evento_personal ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_evento_personal_read ON catalogo_tipos_evento_personal FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_atributos ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_atributos_read ON catalogo_atributos FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_estados_persona ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_estados_persona_read ON catalogo_estados_persona FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_motivos_baja ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_motivos_baja_read ON catalogo_motivos_baja FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_modulos ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_modulos_read ON catalogo_modulos FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_disciplinas ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_disciplinas_read ON catalogo_disciplinas FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_niveles_competencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_niveles_competencia_read ON catalogo_niveles_competencia FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_roles_equipo ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_roles_equipo_read ON catalogo_roles_equipo FOR SELECT TO authenticated USING (true);

ALTER TABLE catalogo_planes_comerciales ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_planes_comerciales_read ON catalogo_planes_comerciales FOR SELECT TO authenticated USING (true);

-- Catálogos tenant-scope (con UUID)
ALTER TABLE catalogo_tipos_socio ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_tipos_socio_read ON catalogo_tipos_socio FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_tenant_actual());
CREATE POLICY catalogo_tipos_socio_admin ON catalogo_tipos_socio FOR ALL TO authenticated
  USING (tenant_id = get_tenant_actual() AND es_admin_tenant())
  WITH CHECK (tenant_id = get_tenant_actual() AND es_admin_tenant());

ALTER TABLE catalogo_estados_padron ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_estados_padron_read ON catalogo_estados_padron FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_tenant_actual());
CREATE POLICY catalogo_estados_padron_admin ON catalogo_estados_padron FOR ALL TO authenticated
  USING (tenant_id = get_tenant_actual() AND es_admin_tenant())
  WITH CHECK (tenant_id = get_tenant_actual() AND es_admin_tenant());

ALTER TABLE catalogo_categorias_movimiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY catalogo_categorias_movimiento_read ON catalogo_categorias_movimiento FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR tenant_id = get_tenant_actual());

-- Tenants (solo el propio)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenants_read ON tenants FOR SELECT TO authenticated USING (id = get_tenant_actual());
CREATE POLICY tenants_admin ON tenants FOR ALL TO authenticated
  USING (es_admin_sistema())
  WITH CHECK (es_admin_sistema());

-- Personas - core
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY personas_select_tenant ON personas FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_actual());
CREATE POLICY personas_insert_admin ON personas FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_tenant_actual() AND es_admin_tenant());
CREATE POLICY personas_update_admin_o_propio ON personas FOR UPDATE TO authenticated
  USING (
    tenant_id = get_tenant_actual()
    AND (es_admin_tenant() OR id = get_persona_actual())
  )
  WITH CHECK (
    tenant_id = get_tenant_actual()
    AND (es_admin_tenant() OR id = get_persona_actual())
  );
CREATE POLICY personas_delete_admin ON personas FOR DELETE TO authenticated
  USING (tenant_id = get_tenant_actual() AND es_admin_tenant());

-- Helper: aplicar policy estándar a todas las tablas con tenant_id
-- "Lee si tenant_id = mi tenant; modifica si tenant_id = mi tenant Y soy admin"
DO $$
DECLARE
  t text;
  tablas_estandar text[] := ARRAY[
    'personas_idiomas','personas_lesiones','personas_talles',
    'personas_contactos_emergencia','personas_documentos_identidad',
    'personas_documentos_medicos','personas_vehiculos','personas_vinculos',
    'personas_autorizaciones','personas_preferencias_comunicacion',
    'personas_credenciales_acceso','personas_eventos_personales',
    'personas_datos_alimentarios','personas_media',
    'personas_clubes_anteriores','personas_premios_logros','personas_selecciones',
    'personas_incidentes_internos','personas_atributos','personas_historial_padron',
    'personas_historial_categoria_deportiva','personas_obra_social',
    'tenant_modulos','entidades','sedes','canchas',
    'padrones','personas_padrones','pre_inscripciones',
    'categorias_equipo','equipos','equipos_competencias','equipos_horarios','personas_equipos'
  ];
BEGIN
  FOREACH t IN ARRAY tablas_estandar
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I_select ON %I FOR SELECT TO authenticated USING (tenant_id = get_tenant_actual())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_insert ON %I FOR INSERT TO authenticated WITH CHECK (tenant_id = get_tenant_actual() AND es_admin_tenant())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_update ON %I FOR UPDATE TO authenticated USING (tenant_id = get_tenant_actual() AND es_admin_tenant()) WITH CHECK (tenant_id = get_tenant_actual() AND es_admin_tenant())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_delete ON %I FOR DELETE TO authenticated USING (tenant_id = get_tenant_actual() AND es_admin_tenant())',
      t, t
    );
  END LOOP;
END $$;

-- Tablas SENSIBLES - RLS más estricta (datos médicos y económicos)
ALTER TABLE personas_datos_medicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY personas_datos_medicos_select ON personas_datos_medicos FOR SELECT TO authenticated
  USING (
    tenant_id = get_tenant_actual()
    AND (
      persona_id = get_persona_actual()
      OR es_admin_tenant()
      OR tiene_atributo('medico_club')
      OR tiene_atributo('kine_club')
    )
  );
CREATE POLICY personas_datos_medicos_modify ON personas_datos_medicos FOR ALL TO authenticated
  USING (
    tenant_id = get_tenant_actual()
    AND (
      persona_id = get_persona_actual()
      OR es_admin_tenant()
      OR tiene_atributo('medico_club')
    )
  )
  WITH CHECK (
    tenant_id = get_tenant_actual()
    AND (
      persona_id = get_persona_actual()
      OR es_admin_tenant()
      OR tiene_atributo('medico_club')
    )
  );

ALTER TABLE personas_datos_economicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY personas_datos_economicos_select ON personas_datos_economicos FOR SELECT TO authenticated
  USING (
    tenant_id = get_tenant_actual()
    AND (
      persona_id = get_persona_actual()
      OR es_admin_tenant()
      OR tiene_atributo('admin_finanzas')
    )
  );
CREATE POLICY personas_datos_economicos_modify ON personas_datos_economicos FOR ALL TO authenticated
  USING (
    tenant_id = get_tenant_actual()
    AND (
      persona_id = get_persona_actual()
      OR es_admin_tenant()
      OR tiene_atributo('admin_finanzas')
    )
  )
  WITH CHECK (
    tenant_id = get_tenant_actual()
    AND (
      persona_id = get_persona_actual()
      OR es_admin_tenant()
      OR tiene_atributo('admin_finanzas')
    )
  );

-- Audit log: solo admins leen, sistema escribe
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_read ON audit_log FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_actual() AND es_admin_tenant());

-- =============================================================================
-- BLOQUE 11 - ÍNDICES DE PERFORMANCE
-- =============================================================================

-- Personas
CREATE INDEX idx_personas_tenant ON personas(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_personas_user_id ON personas(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_personas_dni ON personas(tenant_id, numero_documento);
CREATE INDEX idx_personas_apellido ON personas(tenant_id, apellido);
CREATE INDEX idx_personas_email ON personas(tenant_id, email_principal) WHERE email_principal IS NOT NULL;
CREATE INDEX idx_personas_estado ON personas(tenant_id, estado);
CREATE INDEX idx_personas_fecha_nacimiento ON personas(tenant_id, fecha_nacimiento);
CREATE INDEX idx_personas_tags_internos ON personas USING gin(tags_internos);
CREATE INDEX idx_personas_search ON personas USING gin(
  to_tsvector('spanish', coalesce(nombre,'') || ' ' || coalesce(apellido,'') || ' ' || coalesce(numero_documento,''))
);

-- Tenants
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Padrones
CREATE INDEX idx_padrones_tenant_activo ON padrones(tenant_id) WHERE activo = true;
CREATE INDEX idx_personas_padrones_persona ON personas_padrones(persona_id) WHERE activo = true;
CREATE INDEX idx_personas_padrones_padron ON personas_padrones(padron_id) WHERE activo = true;

-- Equipos
CREATE INDEX idx_equipos_tenant_activo ON equipos(tenant_id) WHERE activo = true;
CREATE INDEX idx_personas_equipos_persona ON personas_equipos(persona_id) WHERE activo = true;
CREATE INDEX idx_personas_equipos_equipo ON personas_equipos(equipo_id) WHERE activo = true;

-- Tenant_modulos
CREATE INDEX idx_tenant_modulos_tenant ON tenant_modulos(tenant_id) WHERE activo = true;
CREATE INDEX idx_tenant_modulos_modulo ON tenant_modulos(modulo_slug) WHERE activo = true;


-- =============================================================================
-- BLOQUE 12 - SEEDS DE CATÁLOGOS BASE
-- =============================================================================
-- Datos iniciales que aplican a todos los tenants.
-- Tenant-specific catalogs (tipos_socio, estados_padron) se siembran en seed Hindu.
-- =============================================================================

-- 12.1 Tipos de documento
INSERT INTO catalogo_tipos_documento (slug, nombre, pais_origen, orden) VALUES
  ('dni', 'DNI Argentino', 'AR', 1),
  ('pasaporte', 'Pasaporte', NULL, 2),
  ('cedula', 'Cédula', 'AR', 3),
  ('libreta_civica', 'Libreta Cívica', 'AR', 4),
  ('libreta_enrolamiento', 'Libreta de Enrolamiento', 'AR', 5),
  ('dni_extranjero', 'DNI Extranjero', NULL, 6),
  ('cuit', 'CUIT', 'AR', 7),
  ('otro', 'Otro', NULL, 99);

-- 12.2 Tipos de talle
INSERT INTO catalogo_tipos_talle (slug, nombre, unidad_default, valores_sugeridos, orden) VALUES
  ('remera', 'Remera', NULL, ARRAY['XS','S','M','L','XL','XXL','XXXL'], 1),
  ('camiseta_partido', 'Camiseta de partido', NULL, ARRAY['XS','S','M','L','XL','XXL','XXXL'], 2),
  ('camiseta_termica', 'Camiseta térmica', NULL, ARRAY['XS','S','M','L','XL','XXL'], 3),
  ('pantalon_corto', 'Short / Pantalón corto', NULL, ARRAY['XS','S','M','L','XL','XXL'], 4),
  ('pantalon_largo', 'Pantalón largo', NULL, ARRAY['XS','S','M','L','XL','XXL'], 5),
  ('calzado_deportivo', 'Calzado deportivo', 'AR', ARRAY['38','39','40','41','42','43','44','45','46'], 6),
  ('calzado_futbol', 'Botín de fútbol', 'AR', ARRAY['38','39','40','41','42','43','44','45','46'], 7),
  ('calzado_tenis', 'Calzado de tenis', 'AR', ARRAY['38','39','40','41','42','43','44','45','46'], 8),
  ('calzado_golf', 'Calzado de golf', 'AR', ARRAY['38','39','40','41','42','43','44','45','46'], 9),
  ('medias_deportivas', 'Medias deportivas', NULL, ARRAY['S','M','L','XL'], 10),
  ('buzo', 'Buzo', NULL, ARRAY['XS','S','M','L','XL','XXL','XXXL'], 11),
  ('campera', 'Campera', NULL, ARRAY['XS','S','M','L','XL','XXL','XXXL'], 12),
  ('gorro_vincha', 'Gorro / Vincha', NULL, ARRAY['S','M','L','U'], 13),
  ('casco', 'Casco', NULL, ARRAY['XS','S','M','L','XL'], 14),
  ('guantes', 'Guantes', NULL, ARRAY['XS','S','M','L','XL'], 15),
  ('protector_bucal', 'Protector bucal', NULL, ARRAY['junior','adulto','custom'], 16),
  ('mochila_bolso', 'Mochila / Bolso', NULL, ARRAY['S','M','L'], 17),
  ('traje_baño', 'Traje de baño', NULL, ARRAY['XS','S','M','L','XL','XXL'], 18),
  ('short_natacion', 'Short de natación', NULL, ARRAY['XS','S','M','L','XL','XXL'], 19),
  ('gafas_natacion', 'Gafas de natación', NULL, ARRAY['junior','adulto','custom'], 20);

-- 12.3 Tipos de vínculo
INSERT INTO catalogo_tipos_vinculo (slug, nombre, categoria, inverso_slug, es_familiar, es_legal, orden) VALUES
  ('padre', 'Padre', 'familiar', 'hijo', true, true, 1),
  ('madre', 'Madre', 'familiar', 'hijo', true, true, 2),
  ('tutor_legal', 'Tutor legal', 'familiar', 'pupilo', true, true, 3),
  ('conyuge', 'Cónyuge', 'familiar', 'conyuge', true, true, 4),
  ('pareja', 'Pareja', 'familiar', 'pareja', true, false, 5),
  ('hijo', 'Hijo/a', 'familiar', 'padre', true, true, 6),
  ('hermano', 'Hermano/a', 'familiar', 'hermano', true, false, 7),
  ('abuelo', 'Abuelo/a', 'familiar', 'nieto', true, false, 8),
  ('nieto', 'Nieto/a', 'familiar', 'abuelo', true, false, 9),
  ('tio', 'Tío/a', 'familiar', 'sobrino', true, false, 10),
  ('sobrino', 'Sobrino/a', 'familiar', 'tio', true, false, 11),
  ('primo', 'Primo/a', 'familiar', 'primo', true, false, 12),
  ('cuñado', 'Cuñado/a', 'familiar', 'cuñado', true, false, 13),
  ('suegro', 'Suegro/a', 'familiar', 'yerno_nuera', true, false, 14),
  ('padrastro', 'Padrastro', 'familiar', 'hijastro', true, false, 15),
  ('madrastra', 'Madrastra', 'familiar', 'hijastro', true, false, 16),
  ('hermanastro', 'Hermanastro/a', 'familiar', 'hermanastro', true, false, 17),
  ('otro_familiar', 'Otro familiar', 'familiar', NULL, true, false, 18),
  ('amigo', 'Amigo/a', 'social', 'amigo', false, false, 19),
  ('vecino', 'Vecino/a', 'social', 'vecino', false, false, 20),
  ('fusion_origen', 'Origen de fusión', 'sistema', 'fusion_destino', false, false, 90),
  ('fusion_destino', 'Destino de fusión', 'sistema', 'fusion_origen', false, false, 91),
  ('otro', 'Otro', 'otro', NULL, false, false, 99);

-- 12.4 Tipos de estudio médico (con vigencia default)
INSERT INTO catalogo_tipos_estudio (slug, nombre, vigencia_default_dias, alerta_default_dias, requiere_medico_firmante, orden) VALUES
  ('apto_fisico', 'Apto físico deportivo', 365, 30, true, 1),
  ('ecg', 'Electrocardiograma', 730, 60, true, 2),
  ('ergometria', 'Ergometría', 730, 60, true, 3),
  ('espirometria', 'Espirometría', 365, 30, true, 4),
  ('laboratorio', 'Análisis de laboratorio', 180, 30, true, 5),
  ('audiometria', 'Audiometría', 1095, 60, true, 6),
  ('oftalmologico', 'Examen oftalmológico', 730, 60, true, 7),
  ('antidoping', 'Control antidoping', 365, 30, true, 8),
  ('certificado_buena_salud', 'Certificado de buena salud', 365, 30, true, 9),
  ('otro', 'Otro estudio', 365, 30, false, 99);

-- 12.5 Tipos de vehículo
INSERT INTO catalogo_tipos_vehiculo (slug, nombre, categoria, requiere_patente, orden) VALUES
  ('auto', 'Auto / Sedán', 'liviano', true, 1),
  ('suv', 'SUV', 'liviano', true, 2),
  ('camioneta', 'Camioneta / Pick-up', 'liviano', true, 3),
  ('utilitario', 'Utilitario', 'liviano', true, 4),
  ('moto', 'Moto', 'liviano', true, 5),
  ('cuatrimoto', 'Cuatriciclo', 'liviano', true, 6),
  ('bicicleta', 'Bicicleta', 'no_motorizado', false, 7),
  ('monopatin', 'Monopatín', 'no_motorizado', false, 8),
  ('camion', 'Camión', 'pesado', true, 9),
  ('otro', 'Otro', 'otro', false, 99);

-- 12.6 Compañías de seguro AR (sample inicial)
INSERT INTO catalogo_companias_seguro (slug, nombre, pais, orden) VALUES
  ('sancor', 'Sancor Seguros', 'AR', 1),
  ('la_caja', 'La Caja', 'AR', 2),
  ('provincia', 'Provincia Seguros', 'AR', 3),
  ('mapfre', 'Mapfre', 'AR', 4),
  ('zurich', 'Zurich', 'AR', 5),
  ('rio_uruguay', 'Río Uruguay Seguros', 'AR', 6),
  ('allianz', 'Allianz', 'AR', 7),
  ('federacion_patronal', 'Federación Patronal', 'AR', 8),
  ('mercantil_andina', 'Mercantil Andina', 'AR', 9),
  ('san_cristobal', 'San Cristóbal', 'AR', 10),
  ('otra', 'Otra', NULL, 99);

-- 12.7 Obras sociales / prepagas AR (sample inicial)
INSERT INTO catalogo_obras_sociales (slug, nombre, pais, es_prepaga, orden) VALUES
  ('osde', 'OSDE', 'AR', true, 1),
  ('swiss_medical', 'Swiss Medical', 'AR', true, 2),
  ('galeno', 'Galeno', 'AR', true, 3),
  ('medicus', 'Medicus', 'AR', true, 4),
  ('hospital_italiano', 'Hospital Italiano', 'AR', true, 5),
  ('hospital_aleman', 'Hospital Alemán', 'AR', true, 6),
  ('hospital_britanico', 'Hospital Británico', 'AR', true, 7),
  ('omint', 'OMINT', 'AR', true, 8),
  ('ospe', 'OSPE', 'AR', false, 9),
  ('union_personal', 'Unión Personal', 'AR', false, 10),
  ('osseg', 'OSSEG', 'AR', false, 11),
  ('osecac', 'OSECAC', 'AR', false, 12),
  ('iapos', 'IAPOS', 'AR', false, 13),
  ('pami', 'PAMI', 'AR', false, 14),
  ('iosfa', 'IOSFA', 'AR', false, 15),
  ('otra', 'Otra', NULL, false, 99);

-- 12.8 Tipos de autorización
INSERT INTO catalogo_tipos_autorizacion (slug, nombre, vigencia_default_dias, requerida_para_menor, requerida_general, orden) VALUES
  ('imagen_redes', 'Uso de imagen en redes sociales del club', 730, true, false, 1),
  ('imagen_prensa', 'Uso de imagen en prensa externa', 730, true, false, 2),
  ('datos_personales_ley_25326', 'Tratamiento de datos personales (Ley 25.326)', NULL, true, true, 3),
  ('traslado_menor', 'Autorización para traslado del menor', 365, true, false, 4),
  ('atencion_medica_emergencia', 'Atención médica de emergencia', NULL, true, true, 5),
  ('viaje_torneo', 'Autorización viaje a torneo', 365, true, false, 6),
  ('comunicaciones_marketing', 'Opt-in comunicaciones marketing', NULL, false, false, 7),
  ('cesion_datos_terceros', 'Cesión de datos a terceros (sponsors, federaciones)', 730, false, false, 8),
  ('uso_imagen_publicidad_comercial', 'Uso de imagen en publicidad comercial', 730, true, false, 9),
  ('reglamento_club', 'Aceptación del reglamento del club', NULL, true, true, 10),
  ('otra', 'Otra autorización', 365, false, false, 99);

-- 12.9 Tipos de evento personal
INSERT INTO catalogo_tipos_evento_personal (slug, nombre, es_recurrente_anual, orden) VALUES
  ('cumpleaños', 'Cumpleaños', true, 1),
  ('aniversario_socio', 'Aniversario como socio del club', true, 2),
  ('casamiento', 'Casamiento', false, 3),
  ('aniversario_casamiento', 'Aniversario de casamiento', true, 4),
  ('nacimiento_hijo', 'Nacimiento de hijo/a', false, 5),
  ('graduacion', 'Graduación', false, 6),
  ('bar_mitzvah', 'Bar Mitzvah', false, 7),
  ('bat_mitzvah', 'Bat Mitzvah', false, 8),
  ('primera_comunion', 'Primera Comunión', false, 9),
  ('confirmacion', 'Confirmación', false, 10),
  ('quinceañera', 'Quinceañera', false, 11),
  ('premiacion_deportiva', 'Premiación deportiva', false, 12),
  ('logro_profesional', 'Logro profesional importante', false, 13),
  ('fallecimiento_familiar', 'Fallecimiento familiar (silenciar comunicaciones)', false, 14),
  ('otro', 'Otro', false, 99);

-- 12.10 Atributos (sistema unificado de roles)
INSERT INTO catalogo_atributos (slug, nombre, categoria, descripcion, orden) VALUES
  -- Sistema
  ('admin_sistema', 'Admin del sistema', 'sistema', 'Acceso total a todos los tenants. Solo Anthropic/Levy Wald CMO', 1),
  ('admin_tenant', 'Admin del tenant', 'sistema', 'Acceso total al tenant', 2),
  ('soporte_tecnico', 'Soporte técnico', 'sistema', 'Acceso de lectura para troubleshooting', 3),
  ('editor_contenidos', 'Editor de contenidos', 'sistema', 'Puede publicar comunicaciones', 4),
  -- Institucional
  ('socio', 'Socio', 'institucional', 'Atributo principal de membresía', 10),
  ('socio_padron', 'Socio del padrón', 'institucional', 'En padrón vigente', 11),
  ('dirigente', 'Dirigente', 'institucional', 'Comisión directiva o subcomisión', 12),
  ('comision_directiva', 'Comisión Directiva', 'institucional', 'Miembro de CD', 13),
  ('voluntario', 'Voluntario', 'institucional', 'Apoyo voluntario al club', 14),
  -- Familiar
  ('padre_tutor', 'Padre/Madre/Tutor', 'familiar', 'Padre, madre o tutor de un menor del club. Puede o no ser socio', 20),
  ('menor_de_edad', 'Menor de edad', 'familiar', 'Auto-asignado si fecha_nacimiento implica menos de 18', 21),
  ('conyuge_socio', 'Cónyuge de socio', 'familiar', 'Cónyuge de un socio activo', 22),
  -- Deportivo
  ('jugador', 'Jugador', 'deportivo', 'Jugador activo de algún equipo', 30),
  ('capitan', 'Capitán', 'deportivo', 'Capitán de equipo', 31),
  ('dt', 'DT / Director Técnico', 'deportivo', 'DT de algún equipo', 32),
  ('asistente_dt', 'Asistente DT', 'deportivo', 'Asistente de DT', 33),
  ('preparador_fisico', 'Preparador físico', 'deportivo', 'PF', 34),
  ('kine_club', 'Kinesiólogo del club', 'deportivo', 'Acceso a datos médicos para tratamientos', 35),
  ('medico_club', 'Médico del club', 'deportivo', 'Acceso a datos médicos', 36),
  ('scout', 'Scout', 'deportivo', 'Scout deportivo', 37),
  -- Externo
  ('representante_federacion', 'Representante federación', 'externo', 'Contacto en federación', 40),
  ('sponsor', 'Sponsor', 'externo', 'Empresa sponsor', 41),
  ('proveedor', 'Proveedor', 'externo', 'Proveedor del club', 42),
  ('jugador_rival', 'Jugador rival', 'externo', 'Jugador de equipo rival registrado', 43),
  -- Country
  ('propietario', 'Propietario', 'country', 'Propietario inmueble', 50),
  ('inquilino', 'Inquilino', 'country', 'Inquilino temporal', 51),
  ('invitado_familiar', 'Invitado familiar', 'country', 'Invitado registrado por propietario', 52),
  -- Educativo
  ('alumno', 'Alumno', 'educativo', 'Alumno del polo educativo', 60),
  ('docente', 'Docente', 'educativo', 'Docente del polo educativo', 61),
  ('directivo_escuela', 'Directivo escolar', 'educativo', 'Directivo escuela asociada', 62),
  -- Empleado
  ('empleado_administrativo', 'Empleado administrativo', 'empleado', 'Personal admin', 70),
  ('empleado_operativo', 'Empleado operativo', 'empleado', 'Personal operativo', 71),
  ('instructor_externo', 'Instructor externo', 'empleado', 'Instructor contratado', 72),
  ('admin_finanzas', 'Admin de finanzas', 'empleado', 'Acceso a datos económicos', 73),
  -- Transversal
  ('vip', 'VIP', 'transversal', 'Atención preferencial', 80),
  ('requiere_revision', 'Requiere revisión', 'transversal', 'Datos pendientes de validar', 81),
  ('en_mora', 'En mora', 'transversal', 'Tiene cuotas impagas', 82),
  ('sancionado', 'Sancionado', 'transversal', 'Tiene sanción activa', 83);

-- 12.11 Estados de persona
INSERT INTO catalogo_estados_persona (slug, nombre, permite_actividad, bloquea_acceso, color_ui, orden) VALUES
  ('activo', 'Activo', true, false, 'green', 1),
  ('pausado', 'Pausado', false, false, 'yellow', 2),
  ('suspendido', 'Suspendido', false, true, 'orange', 3),
  ('baja_temporal', 'Baja temporal', false, true, 'gray', 4),
  ('baja', 'Baja', false, true, 'red', 5),
  ('pendiente_revision', 'Pendiente revisión', false, false, 'blue', 6),
  ('fallecido', 'Fallecido', false, true, 'gray', 7);

-- 12.12 Motivos de baja
INSERT INTO catalogo_motivos_baja (slug, nombre, orden) VALUES
  ('renuncia_voluntaria', 'Renuncia voluntaria', 1),
  ('mora', 'Mora en pagos', 2),
  ('sancion_disciplinaria', 'Sanción disciplinaria', 3),
  ('mudanza', 'Mudanza', 4),
  ('fallecimiento', 'Fallecimiento', 5),
  ('inactividad', 'Inactividad prolongada', 6),
  ('cambio_club', 'Cambio de club', 7),
  ('motivos_economicos', 'Motivos económicos', 8),
  ('motivos_personales', 'Motivos personales', 9),
  ('otro', 'Otro', 99);

-- 12.13 Niveles de competencia
INSERT INTO catalogo_niveles_competencia (slug, nombre, descripcion, orden) VALUES
  ('escuela', 'Escuela', 'Iniciación deportiva infantil', 1),
  ('recreativo', 'Recreativo', 'Recreativo no competitivo', 2),
  ('amateur_federado', 'Amateur federado', 'Amateur con federación', 3),
  ('semi_profesional', 'Semi-profesional', 'Entre amateur y profesional', 4),
  ('profesional', 'Profesional', 'Profesional rentado', 5),
  ('representativo', 'Representativo / Selección', 'Representando al país/región', 6);

-- 12.14 Roles de equipo
INSERT INTO catalogo_roles_equipo (slug, nombre, categoria, orden) VALUES
  ('jugador', 'Jugador', 'deportivo', 1),
  ('capitan', 'Capitán', 'deportivo', 2),
  ('subcapitan', 'Subcapitán', 'deportivo', 3),
  ('dt', 'DT', 'staff', 10),
  ('asistente_dt', 'Asistente DT', 'staff', 11),
  ('preparador_fisico', 'Preparador físico', 'staff', 12),
  ('kine', 'Kinesiólogo', 'staff', 13),
  ('medico_equipo', 'Médico del equipo', 'staff', 14),
  ('utilero', 'Utilero', 'staff', 15),
  ('manager', 'Manager', 'staff', 16),
  ('scout', 'Scout', 'staff', 17),
  ('delegado', 'Delegado', 'staff', 18),
  ('referente', 'Referente', 'staff', 19);

-- 12.15 Disciplinas (genéricas, sin módulo asignado todavía)
INSERT INTO catalogo_disciplinas (slug, nombre, categoria, orden) VALUES
  ('futbol', 'Fútbol', 'pelota', 1),
  ('hockey', 'Hockey', 'pelota_palo', 2),
  ('rugby', 'Rugby', 'pelota_contacto', 3),
  ('tenis', 'Tenis', 'raqueta', 4),
  ('padel', 'Pádel', 'raqueta', 5),
  ('golf', 'Golf', 'palo', 6),
  ('basquet', 'Básquet', 'pelota', 7),
  ('voley', 'Vóley', 'pelota', 8),
  ('cestoball', 'Cestoball', 'pelota', 9),
  ('judo', 'Judo', 'combate', 10),
  ('natacion', 'Natación', 'agua', 11),
  ('remo', 'Remo', 'agua', 12),
  ('squash', 'Squash', 'raqueta', 13),
  ('gimnasia_artistica', 'Gimnasia artística', 'gimnasia', 14),
  ('running', 'Running', 'atletismo', 15),
  ('atletismo', 'Atletismo', 'atletismo', 16),
  ('actividades_recreativas', 'Actividades recreativas', 'recreativo', 99);

-- 12.16 Planes comerciales
INSERT INTO catalogo_planes_comerciales (slug, nombre, precio_base_usd_mensual, orden) VALUES
  ('free', 'Free', 0, 1),
  ('pro', 'Pro', 49, 2),
  ('enterprise', 'Enterprise', 199, 3);

-- 12.17 Módulos (sample inicial)
INSERT INTO catalogo_modulos (slug, nombre, categoria, precio_usd_mensual, orden) VALUES
  ('disciplina_futbol', 'Disciplina Fútbol', 'disciplina', 30, 1),
  ('disciplina_hockey', 'Disciplina Hockey', 'disciplina', 30, 2),
  ('disciplina_tenis', 'Disciplina Tenis', 'disciplina', 30, 3),
  ('disciplina_padel', 'Disciplina Pádel', 'disciplina', 30, 4),
  ('disciplina_golf', 'Disciplina Golf', 'disciplina', 30, 5),
  ('disciplina_rugby', 'Disciplina Rugby', 'disciplina', 30, 6),
  ('disciplina_basquet', 'Disciplina Básquet', 'disciplina', 30, 7),
  ('multi_sede', 'Multi-sede', 'tronco_extension', 50, 20),
  ('country_deportivo', 'Country deportivo', 'vertical', 40, 21),
  ('federacion_hub', 'Federación Hub', 'vertical', 100, 22),
  ('polo_educativo', 'Polo educativo', 'vertical', 80, 23),
  ('bot_whatsapp_equipo', 'Bot WhatsApp equipo', 'canal', 15, 30),
  ('app_movil_propia', 'App móvil propia', 'canal', 100, 31),
  ('api_publica', 'API pública', 'integracion', 30, 40),
  ('mcp_server', 'MCP Server', 'integracion', 50, 41),
  ('conector_zoho_crm', 'Conector ZOHO CRM', 'integracion', 20, 42),
  ('conector_mercadopago', 'Conector MercadoPago', 'integracion', 15, 43),
  ('conector_resend', 'Conector Resend (emails)', 'integracion', 10, 44),
  ('ecommerce_shop', 'Ecommerce / Shop', 'operativo', 30, 50),
  ('inventario_productos', 'Inventario productos', 'operativo', 20, 51),
  ('cuotas_recurrentes', 'Cuotas recurrentes', 'operativo', 20, 52),
  ('caja_multiarea', 'Caja multi-área', 'operativo', 25, 53),
  ('rrhh_basico', 'RRHH básico', 'operativo', 15, 54),
  ('comunicaciones_web', 'Comunicaciones web', 'operativo', 15, 55),
  ('comunicaciones_masivas', 'Comunicaciones masivas', 'operativo', 30, 56),
  ('padron_consolidacion', 'Consolidación con padrón externo', 'integracion', 20, 60),
  ('pre_inscripcion_landing', 'Landing pre-inscripción', 'tronco_extension', 10, 61);

-- F1.5 (SE1-I3): este INSERT no setea `capa`; los slugs CCBP quedaban NULL en un
-- reseed. Alineado aquí para que un fresh reset deje la capa correcta de entrada.
-- Idempotente (guard capa IS NULL). vertical_ccbp es valor válido del set.
UPDATE catalogo_modulos
SET capa = 'vertical_ccbp'
WHERE slug IN (
  'disciplina_basquet', 'disciplina_futbol', 'disciplina_golf', 'disciplina_hockey',
  'disciplina_padel', 'disciplina_rugby', 'disciplina_tenis', 'federacion_hub', 'polo_educativo'
)
AND capa IS NULL;

