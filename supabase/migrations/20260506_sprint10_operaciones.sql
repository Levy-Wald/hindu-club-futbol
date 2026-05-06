-- Sprint 10: Operaciones deportivas avanzadas
-- Extiende eventos, agrega asistencias, esquemas tácticos y scouting
-- Rollback: DROP TABLE IF EXISTS scouting_fichas, esquema_posiciones, esquemas_tacticos, evento_asistencias;
--           ALTER TABLE equipos_horarios DROP COLUMN IF EXISTS rival, notas_pre, notas_post;

-- ============================================================
-- 1. Extender equipos_horarios con campos de partido/evento
-- ============================================================

ALTER TABLE equipos_horarios ADD COLUMN IF NOT EXISTS rival TEXT;
ALTER TABLE equipos_horarios ADD COLUMN IF NOT EXISTS notas_pre TEXT;
ALTER TABLE equipos_horarios ADD COLUMN IF NOT EXISTS notas_post TEXT;

-- ============================================================
-- 2. Tabla evento_asistencias
-- ============================================================

CREATE TABLE IF NOT EXISTS evento_asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  evento_id uuid NOT NULL REFERENCES equipos_horarios(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('confirmado', 'rechazado', 'pendiente', 'ausente', 'presente')),
  nota TEXT,
  respondido_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, evento_id, persona_id)
);

CREATE INDEX IF NOT EXISTS idx_evento_asistencias_evento ON evento_asistencias(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_asistencias_persona ON evento_asistencias(persona_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_evento_asistencias_updated ON evento_asistencias;
CREATE TRIGGER trg_evento_asistencias_updated
  BEFORE UPDATE ON evento_asistencias
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- RLS
ALTER TABLE evento_asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY evento_asistencias_tenant_select ON evento_asistencias
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY evento_asistencias_tenant_insert ON evento_asistencias
  FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY evento_asistencias_tenant_update ON evento_asistencias
  FOR UPDATE USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY evento_asistencias_tenant_delete ON evento_asistencias
  FOR DELETE USING (tenant_id = (SELECT get_tenant_actual()));

-- ============================================================
-- 3. Tabla esquemas_tacticos
-- ============================================================

CREATE TABLE IF NOT EXISTS esquemas_tacticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  equipo_id uuid NOT NULL REFERENCES equipos(id),
  evento_id uuid REFERENCES equipos_horarios(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  formacion TEXT NOT NULL DEFAULT '4-3-3',
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_esquemas_tacticos_equipo ON esquemas_tacticos(equipo_id);

DROP TRIGGER IF EXISTS trg_esquemas_tacticos_updated ON esquemas_tacticos;
CREATE TRIGGER trg_esquemas_tacticos_updated
  BEFORE UPDATE ON esquemas_tacticos
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE esquemas_tacticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY esquemas_tacticos_tenant_select ON esquemas_tacticos
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY esquemas_tacticos_tenant_insert ON esquemas_tacticos
  FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY esquemas_tacticos_tenant_update ON esquemas_tacticos
  FOR UPDATE USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY esquemas_tacticos_tenant_delete ON esquemas_tacticos
  FOR DELETE USING (tenant_id = (SELECT get_tenant_actual()));

-- ============================================================
-- 4. Tabla esquema_posiciones
-- ============================================================

CREATE TABLE IF NOT EXISTS esquema_posiciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  esquema_id uuid NOT NULL REFERENCES esquemas_tacticos(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id),
  posicion TEXT NOT NULL,
  es_titular BOOLEAN NOT NULL DEFAULT true,
  orden INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, esquema_id, persona_id)
);

CREATE INDEX IF NOT EXISTS idx_esquema_posiciones_esquema ON esquema_posiciones(esquema_id);

ALTER TABLE esquema_posiciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY esquema_posiciones_tenant_select ON esquema_posiciones
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY esquema_posiciones_tenant_insert ON esquema_posiciones
  FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY esquema_posiciones_tenant_update ON esquema_posiciones
  FOR UPDATE USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY esquema_posiciones_tenant_delete ON esquema_posiciones
  FOR DELETE USING (tenant_id = (SELECT get_tenant_actual()));

-- ============================================================
-- 5. Tabla scouting_fichas
-- ============================================================

CREATE TABLE IF NOT EXISTS scouting_fichas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  equipo_id uuid REFERENCES equipos(id),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  fecha_nacimiento DATE,
  posicion TEXT,
  club_actual TEXT,
  contacto TEXT,
  estado TEXT NOT NULL DEFAULT 'observado' CHECK (estado IN ('observado', 'contactado', 'en_negociacion', 'descartado', 'incorporado')),
  observaciones TEXT,
  evaluacion INT CHECK (evaluacion BETWEEN 1 AND 5),
  persona_id uuid REFERENCES personas(id),
  scout_id uuid REFERENCES personas(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_scouting_fichas_equipo ON scouting_fichas(equipo_id);
CREATE INDEX IF NOT EXISTS idx_scouting_fichas_estado ON scouting_fichas(estado);

DROP TRIGGER IF EXISTS trg_scouting_fichas_updated ON scouting_fichas;
CREATE TRIGGER trg_scouting_fichas_updated
  BEFORE UPDATE ON scouting_fichas
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE scouting_fichas ENABLE ROW LEVEL SECURITY;

CREATE POLICY scouting_fichas_tenant_select ON scouting_fichas
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY scouting_fichas_tenant_insert ON scouting_fichas
  FOR INSERT WITH CHECK (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY scouting_fichas_tenant_update ON scouting_fichas
  FOR UPDATE USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY scouting_fichas_tenant_delete ON scouting_fichas
  FOR DELETE USING (tenant_id = (SELECT get_tenant_actual()));
