-- Fix: normalize_name debe tratar apóstrofes como separadores
-- D´AMICO → "d amico" (2 tokens), no "d´amico" (1 token)
-- Afecta: match_persona_fuzzy tokenización

CREATE OR REPLACE FUNCTION normalize_name(input text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT trim(regexp_replace(
    lower(public.unaccent(
      regexp_replace(trim(coalesce(input, '')), '[´`''''ʼʻ'']', ' ', 'g')
    )),
    '\s+', ' ', 'g'
  ))
$$;
