-- Vista guardada por usuario: configuración de columnas visibles por módulo
-- Cada usuario puede guardar múltiples vistas por módulo (personas, equipos, padrones, externos)

CREATE TABLE IF NOT EXISTS user_vistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo text NOT NULL, -- 'personas' | 'equipos' | 'padrones' | 'externos'
  nombre text NOT NULL,
  columnas jsonb NOT NULL DEFAULT '[]', -- array de column IDs visibles
  filtros jsonb DEFAULT '{}', -- filtros opcionales guardados
  es_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Un solo default por user+modulo
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_vistas_default
  ON user_vistas (tenant_id, user_id, modulo)
  WHERE es_default = true;

-- Índice para consultas
CREATE INDEX IF NOT EXISTS idx_user_vistas_user_modulo
  ON user_vistas (user_id, modulo);

-- RLS
ALTER TABLE user_vistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vistas"
  ON user_vistas
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
