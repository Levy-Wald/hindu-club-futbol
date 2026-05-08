-- Sprint 14c.0.1: Reemplazo algoritmo match_persona_fuzzy con scoring por tokens
-- Misma firma, nueva lógica interna en paso 2
-- Resuelve: orden invertido, apellidos compuestos, distinción juan/juana

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
  v_fullname_norm text;
  v_tokens_input text[];
  v_token_count int;
  v_dni_placeholders text[] := ARRAY[
    '0','00','000','0000','00000','000000','0000000','00000000',
    '1','11','111','1111','11111','111111','1111111','11111111'
  ];
BEGIN
  v_dni := trim(coalesce(p_payload->>'dni', p_payload->>'numero_documento', ''));

  -- Paso 1: Match por DNI exacto (sin cambios)
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

  -- Paso 2: Match por tokens nombre/apellido
  v_fullname_norm := normalize_name(
    coalesce(p_payload->>'apellido', '') || ' ' || coalesce(p_payload->>'nombre', '')
  );

  IF v_fullname_norm = '' OR v_fullname_norm = ' ' THEN
    RETURN;
  END IF;

  v_tokens_input := array_remove(string_to_array(v_fullname_norm, ' '), '');
  v_token_count := cardinality(v_tokens_input);

  IF v_token_count = 0 THEN
    RETURN;
  END IF;

  -- Pre-filtrar con GIN trigram (usa índice), luego scoring por tokens
  RETURN QUERY
    WITH prefiltro AS (
      SELECT
        p.id,
        p.nombre,
        p.apellido,
        p.numero_documento,
        p.fecha_nacimiento,
        p.email_principal,
        normalize_name(p.apellido || ' ' || p.nombre) AS fullname_norm
      FROM personas p
      WHERE p.tenant_id = p_tenant_id
        AND p.deleted_at IS NULL
        AND (
          normalize_name(p.apellido || ' ' || p.nombre) % v_fullname_norm
          OR similarity(normalize_name(p.apellido), v_tokens_input[1]) > 0.3
          OR similarity(normalize_name(p.nombre), v_tokens_input[v_token_count]) > 0.3
        )
    ),
    token_scores AS (
      SELECT
        pf.id,
        pf.nombre,
        pf.apellido,
        pf.numero_documento,
        pf.fecha_nacimiento,
        pf.email_principal,
        (
          SELECT coalesce(sum(best_sim), 0)::float / v_token_count::float
          FROM (
            SELECT
              ti,
              greatest(max(similarity(ti, tp)), 0) AS best_sim
            FROM unnest(v_tokens_input) AS ti
            CROSS JOIN LATERAL unnest(
              array_remove(string_to_array(pf.fullname_norm, ' '), '')
            ) AS tp
            GROUP BY ti
            HAVING max(similarity(ti, tp)) >= 0.5
          ) matched_tokens
        )::float AS token_score
      FROM prefiltro pf
    )
    SELECT
      ts.id AS persona_id,
      ts.token_score AS score,
      'nombre_apellido_tokens'::text AS match_type,
      jsonb_build_object(
        'nombre', ts.nombre,
        'apellido', ts.apellido,
        'numero_documento', ts.numero_documento,
        'fecha_nacimiento', ts.fecha_nacimiento,
        'email_principal', ts.email_principal
      ) AS snapshot
    FROM token_scores ts
    WHERE ts.token_score >= p_threshold_low
    ORDER BY ts.token_score DESC
    LIMIT p_max_candidates;

  -- Paso 3: (Futuro) Match por email/telefono
  RETURN;
END;
$$;
