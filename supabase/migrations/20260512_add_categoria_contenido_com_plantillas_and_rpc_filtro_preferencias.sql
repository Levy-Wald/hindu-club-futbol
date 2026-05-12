-- 1. Agregar columna categoria_contenido a com_plantillas
ALTER TABLE com_plantillas
  ADD COLUMN categoria_contenido text NOT NULL DEFAULT 'eventos_club'
  CHECK (categoria_contenido IN ('transaccional','eventos_club','marketing','partners','torneos'));

-- 2. Seed: clasificar plantillas existentes como transaccional
UPDATE com_plantillas
SET categoria_contenido = 'transaccional'
WHERE deleted_at IS NULL
  AND (
    slug LIKE 'apto_vencimiento%'
    OR slug LIKE 'autorizacion_vencimiento%'
    OR slug LIKE 'cuota_vencida%'
    OR slug LIKE 'cuota_vencimiento%'
    OR slug LIKE 'liquidacion_aprobada%'
    OR slug LIKE 'pago_%'
    OR slug LIKE 'factura_%'
    OR slug LIKE 'contrato_creado%'
  );

-- 3. Indice para queries que filtran por categoria
CREATE INDEX idx_com_plantillas_categoria
  ON com_plantillas(categoria_contenido)
  WHERE deleted_at IS NULL;

-- 4. Comment
COMMENT ON COLUMN com_plantillas.categoria_contenido IS
  'Categoria de contenido para respetar opt-in/out de personas_preferencias_comunicacion. transaccional ignora opt-out.';

-- 5. Funcion RPC para filtrar personas por preferencias de comunicacion
CREATE OR REPLACE FUNCTION filtrar_personas_por_preferencias_comunicacion(
  p_tenant_id uuid,
  p_persona_ids uuid[],
  p_opt_in_column text,
  p_respeta_opt_in boolean,
  p_tz text DEFAULT 'America/Argentina/Buenos_Aires'
)
RETURNS TABLE(persona_id uuid, motivo text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now_tz timestamp;
  v_dia_actual text;
  v_hora_actual time;
BEGIN
  v_now_tz := NOW() AT TIME ZONE p_tz;
  v_hora_actual := v_now_tz::time;
  v_dia_actual := CASE EXTRACT(dow FROM v_now_tz)
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'lunes'
    WHEN 2 THEN 'martes'
    WHEN 3 THEN 'miercoles'
    WHEN 4 THEN 'jueves'
    WHEN 5 THEN 'viernes'
    WHEN 6 THEN 'sabado'
  END;

  RETURN QUERY
  WITH personas_con_prefs AS (
    SELECT
      p.id AS pid,
      COALESCE(pref.horario_preferido_inicio, '09:00:00'::time) AS h_inicio,
      COALESCE(pref.horario_preferido_fin, '21:00:00'::time) AS h_fin,
      COALESCE(pref.dias_no_contactar, '{}'::text[]) AS dias_no,
      COALESCE(
        CASE p_opt_in_column
          WHEN 'opt_in_marketing' THEN pref.opt_in_marketing
          WHEN 'opt_in_eventos_club' THEN pref.opt_in_eventos_club
          WHEN 'opt_in_partners' THEN pref.opt_in_partners
          WHEN 'opt_in_torneos' THEN pref.opt_in_torneos
          ELSE true
        END,
        CASE p_opt_in_column
          WHEN 'opt_in_marketing' THEN false
          WHEN 'opt_in_eventos_club' THEN true
          WHEN 'opt_in_partners' THEN false
          WHEN 'opt_in_torneos' THEN true
          ELSE true
        END
      ) AS opt_in_ok
    FROM personas p
    LEFT JOIN personas_preferencias_comunicacion pref
      ON pref.persona_id = p.id AND pref.tenant_id = p_tenant_id
    WHERE p.id = ANY(p_persona_ids)
      AND p.tenant_id = p_tenant_id
      AND p.deleted_at IS NULL
  )
  SELECT
    pcp.pid,
    CASE
      WHEN p_respeta_opt_in AND NOT pcp.opt_in_ok THEN 'opt_out'
      WHEN v_dia_actual = ANY(pcp.dias_no) THEN 'dia_excluido'
      WHEN v_hora_actual < pcp.h_inicio OR v_hora_actual > pcp.h_fin THEN 'horario'
      ELSE 'aEnviar'
    END AS motivo
  FROM personas_con_prefs pcp;
END;
$$;

GRANT EXECUTE ON FUNCTION filtrar_personas_por_preferencias_comunicacion TO authenticated, service_role;
