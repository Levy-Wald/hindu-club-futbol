-- Sprint 14a.9: Función helper para fusión de personas
-- Descubre dinámicamente todas las FK que apuntan a personas.id

CREATE OR REPLACE FUNCTION get_persona_fk_references()
RETURNS TABLE(table_name text, column_name text)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    kcu.table_name::text,
    kcu.column_name::text
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_name = 'personas'
    AND ccu.column_name = 'id'
    AND tc.table_schema = 'public'
  ORDER BY kcu.table_name, kcu.column_name;
$$;
