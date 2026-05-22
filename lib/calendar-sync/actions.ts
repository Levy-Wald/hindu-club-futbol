'use server'

import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import type { CalendarioIntegracion } from './types'

export async function getCalendarioIntegraciones(
  personaId: string,
): Promise<CalendarioIntegracion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('calendario_integraciones')
    .select('*')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as CalendarioIntegracion[]
}

export async function disconnectIntegracion(
  integracionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('calendario_integraciones')
    .update({
      estado: 'disconnected',
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
    })
    .eq('id', integracionId)
    .eq('tenant_id', TENANT_ID)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getEventosSinSyncear(
  personaId: string,
  limit = 10,
) {
  const supabase = await createClient()

  // Get eventos where persona is responsable but no sync_map exists
  const { data: eventos } = await supabase
    .from('eventos')
    .select('id, titulo, fecha_inicio, tipo_evento_slug')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .contains('responsables_persona_id', [personaId])
    .order('fecha_inicio', { ascending: false })
    .limit(limit)

  if (!eventos || eventos.length === 0) return []

  const eventoIds = eventos.map((e) => e.id)
  const { data: syncMaps } = await supabase
    .from('evento_sync_map')
    .select('evento_id')
    .in('evento_id', eventoIds)
    .eq('proveedor', 'google')

  const syncedIds = new Set((syncMaps ?? []).map((s) => s.evento_id))
  return eventos.filter((e) => !syncedIds.has(e.id))
}

export async function triggerManualSync(
  personaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: integracion } = await supabase
    .from('calendario_integraciones')
    .select('*')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .eq('proveedor', 'google')
    .eq('estado', 'connected')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integracion) {
    return { ok: false, error: 'No hay integracion Google activa' }
  }

  // Dynamic import to avoid circular deps and keep bundle small
  const { syncGoogleEventsToClubCore } = await import('./sync-from-cloud')
  const result = await syncGoogleEventsToClubCore(integracion as CalendarioIntegracion)

  if (!result.ok) {
    return { ok: false, error: result.errors.join('; ') }
  }

  return { ok: true }
}
