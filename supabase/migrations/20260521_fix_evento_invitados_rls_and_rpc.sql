-- Fix: evento_invitados RLS was noop (qual: "true") — any user could access any tenant's data
-- Fix: obtener_invitados_evento_con_roles RPC missing tenant_id filter on asistencias JOIN

-- 1. Replace noop RLS on evento_invitados
DROP POLICY IF EXISTS evento_invitados_tenant_isolation ON evento_invitados;

CREATE POLICY evento_invitados_tenant_select ON evento_invitados
  FOR SELECT USING (tenant_id = get_tenant_actual());

CREATE POLICY evento_invitados_tenant_insert ON evento_invitados
  FOR INSERT WITH CHECK (tenant_id = get_tenant_actual());

CREATE POLICY evento_invitados_tenant_update ON evento_invitados
  FOR UPDATE USING (tenant_id = get_tenant_actual());

CREATE POLICY evento_invitados_tenant_delete ON evento_invitados
  FOR DELETE USING (tenant_id = get_tenant_actual());

-- 2. Fix RPC: add tenant_id to LEFT JOIN on evento_asistencias
CREATE OR REPLACE FUNCTION public.obtener_invitados_evento_con_roles(p_evento_id uuid, p_tenant_id uuid)
 RETURNS TABLE(persona_id uuid, nombre text, apellido text, foto_url text, roles jsonb, asistencia jsonb, evento_invitado_id uuid, origen_invitacion text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_equipo_id uuid;
BEGIN
  SELECT e.equipo_id INTO v_equipo_id
  FROM eventos e
  WHERE e.id = p_evento_id AND e.tenant_id = p_tenant_id;

  RETURN QUERY
  SELECT
    p.id AS persona_id,
    p.nombre,
    p.apellido,
    p.foto_perfil_url AS foto_url,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'rol_equipo_slug', pe.rol_equipo_slug,
        'rol_nombre', cre.nombre,
        'categoria', cre.categoria,
        'dorsal', pe.dorsal,
        'posicion', pe.posicion,
        'es_capitan', (pe.rol_equipo_slug = 'capitan'),
        'es_subcapitan', (pe.rol_equipo_slug = 'subcapitan')
      ) ORDER BY
        CASE cre.categoria
          WHEN 'deportivo' THEN 1
          WHEN 'cuerpo_tecnico' THEN 2
          WHEN 'comision_delegados' THEN 3
        END,
        pe.rol_equipo_slug
      )
      FROM personas_equipos pe
      JOIN catalogo_roles_equipo cre ON cre.slug = pe.rol_equipo_slug
      WHERE pe.persona_id = p.id
        AND pe.equipo_id = v_equipo_id
        AND pe.activo = true
        AND pe.deleted_at IS NULL),
      '[]'::jsonb
    ) AS roles,
    jsonb_build_object(
      'id', ea.id,
      'estado', COALESCE(ea.estado, 'pendiente'),
      'nota', ea.nota,
      'respondido_at', ea.respondido_at
    ) AS asistencia,
    ei.id AS evento_invitado_id,
    ei.origen AS origen_invitacion
  FROM evento_invitados ei
  JOIN personas p ON p.id = ei.persona_id
  LEFT JOIN evento_asistencias ea
    ON ea.evento_id = ei.evento_id
    AND ea.persona_id = ei.persona_id
    AND ea.tenant_id = ei.tenant_id  -- FIX: was missing tenant isolation
  WHERE ei.evento_id = p_evento_id
    AND ei.tenant_id = p_tenant_id
    AND ei.persona_id IS NOT NULL
    AND ei.deleted_at IS NULL
    AND p.deleted_at IS NULL
  ORDER BY p.apellido, p.nombre;
END;
$function$;
