'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Verifica si la persona puede tomar asistencia en el evento.
 * Permitido si:
 * 1. Tiene atributo 'tenant.admin' activo, OR
 * 2. El evento tiene equipo_id y la persona tiene rol CT activo en ese equipo, OR
 * 3. La persona es responsable/instructor/protagonista del evento.
 */
export async function verificarPermisoTomarAsistencia(
  persona_id: string,
  tenant_id: string,
  evento_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  // 1. ¿Tiene atributo tenant.admin?
  const { data: esAdmin } = await supabase
    .from('personas_atributos')
    .select('id')
    .eq('persona_id', persona_id)
    .eq('atributo_slug', 'tenant.admin')
    .eq('activo', true)
    .maybeSingle()

  if (esAdmin) return true

  // 2. ¿Está como CT del equipo del evento?
  const { data: evento } = await supabase
    .from('eventos')
    .select('equipo_id, responsable_persona_id, instructor_principal_id, persona_protagonista_id')
    .eq('id', evento_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!evento) return false

  if (evento.equipo_id) {
    const { data: esCT } = await supabase
      .from('personas_equipos')
      .select('id')
      .eq('persona_id', persona_id)
      .eq('equipo_id', evento.equipo_id)
      .in('rol_equipo_slug', ['dt', 'asistente_dt', 'preparador_fisico'])
      .eq('activo', true)
      .is('deleted_at', null)
      .maybeSingle()

    if (esCT) return true
  }

  // 3. ¿Es rol especial del evento?
  const rolesEspeciales = [
    evento.responsable_persona_id,
    evento.instructor_principal_id,
    evento.persona_protagonista_id,
  ]
  if (rolesEspeciales.includes(persona_id)) return true

  return false
}
