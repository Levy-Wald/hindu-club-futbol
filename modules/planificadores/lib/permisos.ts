'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Verifica si la persona puede mover eventos en el planificador.
 * Permitido si:
 * 1. Tiene atributo 'tenant.admin' o 'planificadores.editor' activo, OR
 * 2. Es coach (dt, asistente_dt, preparador_fisico) del equipo del evento.
 *
 * AP-001 N/A: personas_atributos no tiene deleted_at
 */
export async function canEditarPlanificador(
  persona_id: string,
  equipo_id_evento: string | null
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data: atributos } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin', 'planificadores.editor'])
    .eq('activo', true)

  if (atributos && atributos.length > 0) return true

  if (equipo_id_evento) {
    const { data: rol } = await supabase
      .from('personas_equipos')
      .select('id')
      .eq('persona_id', persona_id)
      .eq('equipo_id', equipo_id_evento)
      .in('rol_equipo_slug', ['dt', 'asistente_dt', 'preparador_fisico'])
      .eq('activo', true)
      .is('deleted_at', null)
      .maybeSingle()

    if (rol) return true
  }

  return false
}

/**
 * Verifica si la persona puede ver el planificador (lectura).
 * Más permisivo: cualquier admin, editor, o coach de cualquier equipo.
 */
export async function canVerPlanificador(persona_id: string): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data: atributos } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin', 'planificadores.editor'])
    .eq('activo', true)

  if (atributos && atributos.length > 0) return true

  // Coach de cualquier equipo puede ver
  const { data: rol } = await supabase
    .from('personas_equipos')
    .select('id')
    .eq('persona_id', persona_id)
    .in('rol_equipo_slug', ['dt', 'asistente_dt', 'preparador_fisico'])
    .eq('activo', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  return !!rol
}
