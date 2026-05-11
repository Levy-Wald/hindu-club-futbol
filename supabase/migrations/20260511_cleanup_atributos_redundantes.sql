-- Cleanup ADR-024: eliminar atributos paralelos
-- Fuente única de verdad de roles de equipo: personas_equipos.rol_equipo_slug

DO $
DECLARE
  v_cant INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cant
    FROM personas_atributos
    WHERE atributo_slug IN (
      'responsable_equipo_dt',
      'responsable_equipo_capitan',
      'responsable_equipo_subcapitan',
      'responsable_equipo_delegado'
    );

  IF v_cant > 0 THEN
    RAISE EXCEPTION 'No se pueden eliminar atributos: % asignaciones activas', v_cant;
  END IF;
END $;

DELETE FROM catalogo_atributos
WHERE slug IN (
  'responsable_equipo_dt',
  'responsable_equipo_capitan',
  'responsable_equipo_subcapitan',
  'responsable_equipo_delegado'
);
