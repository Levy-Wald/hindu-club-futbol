-- Sprint 14c.0: Plataforma de ingestión genérica + match fuzzy
-- Tablas: import_pipelines, import_runs, import_rows, import_field_conflicts
-- Funciones: normalize_name, match_persona_fuzzy
-- Índices: GIN trigram en personas para fuzzy matching

-- ═══════════════════════════════════════════════════════════════
-- 1. Extensiones
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;

-- ═══════════════════════════════════════════════════════════════
-- 2. Función normalize_name
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION normalize_name(input text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT trim(regexp_replace(lower(public.unaccent(trim(coalesce(input, '')))), '\s+', ' ', 'g'))
$$;

-- ═══════════════════════════════════════════════════════════════
-- 3. Índices GIN trigram en personas
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_personas_trgm_apellido
  ON personas USING gin (normalize_name(apellido) gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_personas_trgm_nombre
  ON personas USING gin (normalize_name(nombre) gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_personas_trgm_fullname
  ON personas USING gin (normalize_name(apellido || ' ' || nombre) gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. Tabla import_pipelines
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS import_pipelines (
  slug text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  modo text NOT NULL CHECK (modo IN ('alta', 'enriquecimiento', 'mixto')),
  parser_strategy text NOT NULL DEFAULT 'tabular'
    CHECK (parser_strategy IN ('tabular', 'agrupado_por_grupo', 'wide_enriquecimiento')),
  match_thresholds jsonb NOT NULL DEFAULT '{"high": 0.92, "low": 0.75}'::jsonb,
  field_mappings jsonb NOT NULL DEFAULT '[]'::jsonb,
  apply_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  activo boolean NOT NULL DEFAULT true,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, slug)
);

CREATE TRIGGER trg_import_pipelines_updated_at
  BEFORE UPDATE ON import_pipelines
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE import_pipelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_pipelines_tenant_read" ON import_pipelines
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY "import_pipelines_tenant_all" ON import_pipelines
  FOR ALL USING (tenant_id = (SELECT get_tenant_actual()));

-- ═══════════════════════════════════════════════════════════════
-- 5. Tabla import_runs
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  pipeline_slug text NOT NULL,
  archivo_origen text,
  archivo_url text,
  hash_archivo text,
  ejecutado_por_persona_id uuid REFERENCES personas(id),
  fecha_inicio timestamptz NOT NULL DEFAULT now(),
  fecha_fin timestamptz,
  estado text NOT NULL DEFAULT 'parseando'
    CHECK (estado IN ('parseando', 'matching', 'revisando', 'aplicando', 'aplicado', 'rollback', 'fallado')),
  total_filas integer,
  resumen jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_mensaje text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, pipeline_slug) REFERENCES import_pipelines(tenant_id, slug)
);

CREATE INDEX idx_import_runs_tenant_fecha ON import_runs (tenant_id, fecha_inicio DESC);
CREATE UNIQUE INDEX idx_import_runs_hash_unique ON import_runs (tenant_id, hash_archivo)
  WHERE estado IN ('aplicado', 'revisando');

CREATE TRIGGER trg_import_runs_updated_at
  BEFORE UPDATE ON import_runs
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_runs_tenant_read" ON import_runs
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

CREATE POLICY "import_runs_tenant_all" ON import_runs
  FOR ALL USING (tenant_id = (SELECT get_tenant_actual()));

-- ═══════════════════════════════════════════════════════════════
-- 6. Tabla import_rows
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
  numero_fila integer NOT NULL,
  raw_data jsonb NOT NULL,
  parsed_data jsonb,
  match_status text DEFAULT 'pendiente'
    CHECK (match_status IN ('pendiente', 'exacto', 'auto_fuzzy', 'revisar', 'sin_match', 'manual_review', 'aplicado', 'descartado', 'error')),
  match_score float,
  match_type text,
  persona_id uuid REFERENCES personas(id),
  candidatos jsonb NOT NULL DEFAULT '[]'::jsonb,
  apply_diff jsonb,
  apply_status text NOT NULL DEFAULT 'pendiente'
    CHECK (apply_status IN ('pendiente', 'aplicado', 'fallado', 'descartado')),
  apply_notas text,
  apply_error text,
  notas_revisor text,
  revisado_por_persona_id uuid REFERENCES personas(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_rows_run_match ON import_rows (run_id, match_status);
CREATE INDEX idx_import_rows_run_apply ON import_rows (run_id, apply_status);

CREATE TRIGGER trg_import_rows_updated_at
  BEFORE UPDATE ON import_rows
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;

-- RLS via join to import_runs.tenant_id
CREATE POLICY "import_rows_tenant_read" ON import_rows
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM import_runs r WHERE r.id = run_id AND r.tenant_id = (SELECT get_tenant_actual()))
  );

CREATE POLICY "import_rows_tenant_all" ON import_rows
  FOR ALL USING (
    EXISTS (SELECT 1 FROM import_runs r WHERE r.id = run_id AND r.tenant_id = (SELECT get_tenant_actual()))
  );

-- ═══════════════════════════════════════════════════════════════
-- 7. Tabla import_field_conflicts
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS import_field_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id uuid NOT NULL REFERENCES import_rows(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id),
  tabla text NOT NULL,
  campo text NOT NULL,
  valor_existente jsonb,
  valor_nuevo jsonb,
  resuelto boolean NOT NULL DEFAULT false,
  resolucion text CHECK (resolucion IN ('mantener_existente', 'aplicar_nuevo', 'manual', 'postergar')),
  resuelto_por_persona_id uuid REFERENCES personas(id),
  resuelto_at timestamptz,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE import_field_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_field_conflicts_tenant_read" ON import_field_conflicts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM import_rows ir
      JOIN import_runs r ON r.id = ir.run_id
      WHERE ir.id = row_id AND r.tenant_id = (SELECT get_tenant_actual())
    )
  );

CREATE POLICY "import_field_conflicts_tenant_all" ON import_field_conflicts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM import_rows ir
      JOIN import_runs r ON r.id = ir.run_id
      WHERE ir.id = row_id AND r.tenant_id = (SELECT get_tenant_actual())
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 8. Función match_persona_fuzzy
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_persona_fuzzy(
  p_tenant_id uuid,
  p_payload jsonb,
  p_threshold_high float DEFAULT 0.92,
  p_threshold_low float DEFAULT 0.75,
  p_max_candidates int DEFAULT 5
)
RETURNS TABLE(
  persona_id uuid,
  score float,
  match_type text,
  snapshot jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_dni text;
  v_nombre_norm text;
  v_apellido_norm text;
  v_fullname_norm text;
  v_found_by_dni boolean := false;
  v_dni_placeholders text[] := ARRAY[
    '0','00','000','0000','00000','000000','0000000','00000000',
    '1','11','111','1111','11111','111111','1111111','11111111'
  ];
BEGIN
  v_dni := trim(coalesce(p_payload->>'dni', p_payload->>'numero_documento', ''));

  -- Paso 1: Match por DNI exacto (si DNI válido)
  IF v_dni <> '' AND length(v_dni) >= 7 AND NOT (v_dni = ANY(v_dni_placeholders)) THEN
    RETURN QUERY
      SELECT
        p.id,
        1.0::float AS score,
        'dni_exacto'::text AS match_type,
        jsonb_build_object(
          'nombre', p.nombre,
          'apellido', p.apellido,
          'numero_documento', p.numero_documento,
          'fecha_nacimiento', p.fecha_nacimiento,
          'email_principal', p.email_principal
        ) AS snapshot
      FROM personas p
      WHERE p.tenant_id = p_tenant_id
        AND p.deleted_at IS NULL
        AND p.numero_documento = v_dni
      LIMIT 1;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Paso 2: Match fuzzy por nombre + apellido
  v_apellido_norm := normalize_name(coalesce(p_payload->>'apellido', ''));
  v_nombre_norm := normalize_name(coalesce(p_payload->>'nombre', ''));
  v_fullname_norm := normalize_name(
    coalesce(p_payload->>'apellido', '') || ' ' || coalesce(p_payload->>'nombre', '')
  );

  IF v_fullname_norm = '' OR v_fullname_norm = ' ' THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      p.id,
      similarity(normalize_name(p.apellido || ' ' || p.nombre), v_fullname_norm)::float AS score,
      'nombre_apellido'::text AS match_type,
      jsonb_build_object(
        'nombre', p.nombre,
        'apellido', p.apellido,
        'numero_documento', p.numero_documento,
        'fecha_nacimiento', p.fecha_nacimiento,
        'email_principal', p.email_principal
      ) AS snapshot
    FROM personas p
    WHERE p.tenant_id = p_tenant_id
      AND p.deleted_at IS NULL
      AND similarity(normalize_name(p.apellido || ' ' || p.nombre), v_fullname_norm) >= p_threshold_low
    ORDER BY score DESC
    LIMIT p_max_candidates;

  -- Paso 3: (Futuro) Match por email/telefono — slot reservado
  RETURN;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 9. Seed: pipeline de referencia
-- ═══════════════════════════════════════════════════════════════

INSERT INTO import_pipelines (tenant_id, slug, nombre, modo, parser_strategy, field_mappings, apply_rules)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'padron_socios',
  'Padrón de Socios',
  'mixto',
  'tabular',
  '[
    {"col_origen": "APELLIDO Y NOMBRE", "campo_destino": "apellido_nombre", "transform": "split_apellido_nombre"},
    {"col_origen": "DNI", "campo_destino": "numero_documento", "transform": "validar_dni"},
    {"col_origen": "FECHA NAC", "campo_destino": "fecha_nacimiento", "transform": "parse_date"}
  ]'::jsonb,
  '[]'::jsonb
)
ON CONFLICT (tenant_id, slug) DO NOTHING;
