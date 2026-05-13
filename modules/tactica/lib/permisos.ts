'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Verifica si la persona puede editar la táctica de un evento.
 * Permitido si:
 * 1. Tiene atributo 'tenant.admin' activo, OR
 * 2. Es CT del equipo del evento (dt, asistente_dt, preparador_fisico).
 *
 * Mismo patrón que amistosos (D40).
 */
export async function canEditarTactica(
  persona_id: string,
  evento_id: string
): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data: atrs } = await supabase
    .from('personas_atributos')
    .select('atributo_slug')
    .eq('persona_id', persona_id)
    .in('atributo_slug', ['tenant.admin'])
    .eq('activo', true)

  if (atrs && atrs.length > 0) return true

  const { data: evento } = await supabase
    .from('eventos')
    .select('equipo_id')
    .eq('id', evento_id)
    .single()

  if (!evento?.equipo_id) return false

  const { data: rol } = await supabase
    .from('personas_equipos')
    .select('id')
    .eq('persona_id', persona_id)
    .eq('equipo_id', evento.equipo_id)
    .in('rol_equipo_slug', ['dt', 'asistente_dt', 'preparador_fisico'])
    .eq('activo', true)
    .maybeSingle()

  return !!rol
}
