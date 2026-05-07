-- Sprint 13: API REST + API Keys
-- Tablas: api_keys, api_logs
-- Funciones: fn_validar_api_key, fn_chequear_rate_limit
-- Atributo: api.admin
-- Modulo: api_publica activado para Hindu

-- ============================================================
-- 1. Tabla api_keys
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  nombre text NOT NULL,
  descripcion text,
  key_hash text NOT NULL,         -- SHA-256 del key completo
  key_prefix text NOT NULL,       -- primeros 8 chars para identificar
  scopes text[] NOT NULL DEFAULT '{}',
  rate_limit_por_minuto int NOT NULL DEFAULT 60,
  activa boolean NOT NULL DEFAULT true,
  ultimo_uso_at timestamptz,
  expira_at timestamptz,
  created_by uuid REFERENCES personas(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at ON api_keys;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON api_keys
  FOR SELECT USING (tenant_id = get_tenant_actual());

CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT WITH CHECK (tenant_id = get_tenant_actual());

CREATE POLICY "api_keys_update" ON api_keys
  FOR UPDATE USING (tenant_id = get_tenant_actual());

-- ============================================================
-- 2. Tabla api_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  api_key_id uuid REFERENCES api_keys(id),
  method text NOT NULL,
  path text NOT NULL,
  status_code int NOT NULL,
  response_ms int,
  ip_address text,
  user_agent text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_api_logs_tenant ON api_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_key ON api_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_rate ON api_logs(api_key_id, created_at);

-- RLS
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_logs_select" ON api_logs
  FOR SELECT USING (tenant_id = get_tenant_actual());

CREATE POLICY "api_logs_insert" ON api_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- 3. Funciones helper
-- ============================================================
CREATE OR REPLACE FUNCTION fn_validar_api_key(p_key_hash text)
RETURNS TABLE(id uuid, tenant_id uuid, scopes text[], rate_limit_por_minuto int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT k.id, k.tenant_id, k.scopes, k.rate_limit_por_minuto
  FROM api_keys k
  WHERE k.key_hash = p_key_hash
    AND k.activa = true
    AND k.deleted_at IS NULL
    AND (k.expira_at IS NULL OR k.expira_at > now())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fn_chequear_rate_limit(p_api_key_id uuid, p_limite int)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (
    SELECT count(*)
    FROM api_logs
    WHERE api_key_id = p_api_key_id
      AND created_at > now() - interval '1 minute'
  ) < p_limite;
$$;

-- ============================================================
-- 4. Atributo api.admin
-- ============================================================
INSERT INTO catalogo_atributos (slug, nombre, descripcion, categoria)
VALUES ('api.admin', 'Admin API', 'Puede gestionar API keys e integraciones', 'sistema')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. Modulo api_publica activado para Hindu
-- ============================================================
INSERT INTO tenant_modulos (tenant_id, modulo_slug, activo)
VALUES ('11111111-1111-1111-1111-111111111111', 'api_publica', true)
ON CONFLICT DO NOTHING;
