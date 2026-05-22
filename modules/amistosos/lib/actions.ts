'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canEditarAmistoso } from './permisos'
import { generarNominaLinkAction } from '@/modules/nominas_externas/lib/actions'
import type { LogisticaAmistoso } from './types'

async function getPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

export async function actualizarLogisticaAction(input: {
  evento_id: string
  logistica: LogisticaAmistoso
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarAmistoso(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Verify event is amistoso
  const { data: evento } = await supabase
    .from('eventos')
    .select('id, metadata')
    .eq('id', input.evento_id)
    .eq('tenant_id', tenant_id)
    .eq('tipo_evento_slug', 'amistoso')
    .is('deleted_at', null)
    .single()

  if (!evento) return { ok: false, error: 'Evento amistoso no encontrado' }

  // Merge logistica into metadata without overwriting other fields
  const currentMetadata = (evento.metadata as Record<string, unknown>) ?? {}
  const newMetadata = {
    ...currentMetadata,
    logistica_amistoso: input.logistica,
  }

  const { error } = await supabase
    .from('eventos')
    .update({ metadata: newMetadata })
    .eq('id', input.evento_id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function generarNominaParaAmistosoAction(input: {
  evento_id: string
  club_rival_nombre?: string
}): Promise<{ ok: true; url: string; nomina_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditarAmistoso(persona.id, input.evento_id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  // Delegate to nominas_externas module
  const result = await generarNominaLinkAction({
    evento_id: input.evento_id,
    nombre_contacto: input.club_rival_nombre ?? undefined,
    nivel_validacion: 'L0',
    campos_solicitados: ['nombre', 'apellido', 'dni', 'rol'],
  })

  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, url: result.data.url, nomina_id: result.data.nomina_id }
}
