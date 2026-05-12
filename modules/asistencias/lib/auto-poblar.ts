'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Auto-popla evento_invitados desde personas_equipos activos del equipo.
 * Idempotente: usa ON CONFLICT DO NOTHING en el partial unique index.
 * Incluye roles especiales del evento (responsable, instructor, protagonista).
 */
export async function autoPoblarInvitadosDesdeEquipo(
  evento_id: string,
  equipo_id: string,
  tenant_id: string
): Promise<{ insertados: number }> {
  const supabase = createServiceRoleClient()

  // 1. Personas del plantel (DISTINCT persona_id — puede tener múltiples roles)
  const { data: plantel, error: errPlantel } = await supabase
    .from('personas_equipos')
    .select('persona_id')
    .eq('equipo_id', equipo_id)
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .is('deleted_at', null)

  if (errPlantel) throw new Error(`Error cargando plantel: ${errPlantel.message}`)

  const personaIdsPlantel = [...new Set((plantel ?? []).map(p => p.persona_id))]

  // 2. Personas con roles especiales del evento
  const { data: evento } = await supabase
    .from('eventos')
    .select('responsable_persona_id, instructor_principal_id, persona_protagonista_id')
    .eq('id', evento_id)
    .single()

  const personaIdsRolEvento = [
    evento?.responsable_persona_id,
    evento?.instructor_principal_id,
    evento?.persona_protagonista_id,
  ].filter((id): id is string => Boolean(id))

  // 3. Construir rows
  const rows: Array<{
    tenant_id: string
    evento_id: string
    persona_id: string
    origen: 'auto_plantel' | 'auto_rol_evento'
  }> = []

  for (const persona_id of personaIdsPlantel) {
    rows.push({ tenant_id, evento_id, persona_id, origen: 'auto_plantel' })
  }

  for (const persona_id of personaIdsRolEvento) {
    if (!personaIdsPlantel.includes(persona_id)) {
      rows.push({ tenant_id, evento_id, persona_id, origen: 'auto_rol_evento' })
    }
  }

  if (rows.length === 0) return { insertados: 0 }

  // 4. Insert con ignoreDuplicates (idempotente via partial unique index)
  const { data, error } = await supabase
    .from('evento_invitados')
    .upsert(rows, {
      onConflict: 'evento_id,persona_id',
      ignoreDuplicates: true,
    })
    .select('id')

  if (error) throw new Error(`Error auto-poblando: ${error.message}`)

  return { insertados: data?.length ?? 0 }
}
