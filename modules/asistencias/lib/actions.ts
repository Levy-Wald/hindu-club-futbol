'use server'

import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { verificarPermisoTomarAsistencia } from './permisos'
import type { EstadoAsistencia } from './types'

type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export async function marcarAsistenciaAction(input: {
  evento_id: string
  persona_id: string
  estado: EstadoAsistencia
  nota?: string | null
}): Promise<ActionResult<{ asistencia_id: string }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'No autenticado' }

  // Cargar persona del usuario logueado
  const { data: personaUsuario } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!personaUsuario) return { ok: false, error: 'Persona del usuario no encontrada' }

  const tenant_id = personaUsuario.tenant_id ?? TENANT_ID

  // Verificar permiso
  const tienePermiso = await verificarPermisoTomarAsistencia(
    personaUsuario.id,
    tenant_id,
    input.evento_id
  )

  if (!tienePermiso) {
    return { ok: false, error: 'Sin permiso para tomar asistencia en este evento' }
  }

  // Buscar evento_invitado_id para trazabilidad
  const { data: invitado } = await supabase
    .from('evento_invitados')
    .select('id')
    .eq('evento_id', input.evento_id)
    .eq('persona_id', input.persona_id)
    .is('deleted_at', null)
    .maybeSingle()

  // Upsert por (tenant_id, evento_id, persona_id) — idempotente
  const { data, error } = await supabase
    .from('evento_asistencias')
    .upsert({
      evento_id: input.evento_id,
      persona_id: input.persona_id,
      tenant_id,
      estado: input.estado,
      nota: input.nota ?? null,
      respondido_at: new Date().toISOString(),
      evento_invitado_id: invitado?.id ?? null,
    }, {
      onConflict: 'tenant_id,evento_id,persona_id',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  return { ok: true, data: { asistencia_id: data.id } }
}
