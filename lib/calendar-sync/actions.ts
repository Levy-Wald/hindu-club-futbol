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
      microsoft_access_token: null,
      microsoft_refresh_token: null,
      microsoft_token_expires_at: null,
      icloud_app_password: null,
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

export async function connectICloud(
  personaId: string,
  email: string,
  appPassword: string,
): Promise<{ ok: boolean; error?: string }> {
  const { authenticateICloud, discoverICloudCalendarUrl } = await import('./icloud-client')

  const isValid = await authenticateICloud(email, appPassword)
  if (!isValid) {
    return { ok: false, error: 'Credenciales invalidas. Usa una app-specific password de appleid.apple.com.' }
  }

  let calendarUrl: string
  try {
    calendarUrl = await discoverICloudCalendarUrl(email, appPassword)
  } catch (err) {
    return { ok: false, error: `Error descubriendo calendario: ${err instanceof Error ? err.message : String(err)}` }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('calendario_integraciones')
    .upsert(
      {
        tenant_id: TENANT_ID,
        persona_id: personaId,
        proveedor: 'icloud',
        estado: 'connected',
        icloud_email: email,
        icloud_app_password: appPassword,
        icloud_calendar_url: calendarUrl,
        sync_direction: 'two-way',
        last_sync_at: null,
        next_sync_at: new Date().toISOString(),
        error_log: [],
      },
      { onConflict: 'tenant_id,persona_id,proveedor' },
    )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function triggerManualSyncICloud(
  personaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: integracion } = await supabase
    .from('calendario_integraciones')
    .select('*')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .eq('proveedor', 'icloud')
    .eq('estado', 'connected')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integracion) {
    return { ok: false, error: 'No hay integracion iCloud activa' }
  }

  const { syncICloudEventsToClubCore } = await import('./sync-from-icloud')
  const result = await syncICloudEventsToClubCore(integracion as CalendarioIntegracion)

  if (!result.ok) {
    return { ok: false, error: result.errors.join('; ') }
  }

  return { ok: true }
}

export async function triggerManualSyncMicrosoft(
  personaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: integracion } = await supabase
    .from('calendario_integraciones')
    .select('*')
    .eq('persona_id', personaId)
    .eq('tenant_id', TENANT_ID)
    .eq('proveedor', 'microsoft')
    .eq('estado', 'connected')
    .is('deleted_at', null)
    .maybeSingle()

  if (!integracion) {
    return { ok: false, error: 'No hay integracion Microsoft activa' }
  }

  const { syncMicrosoftEventsToClubCore } = await import('./sync-from-microsoft')
  const result = await syncMicrosoftEventsToClubCore(integracion as CalendarioIntegracion)

  if (!result.ok) {
    return { ok: false, error: result.errors.join('; ') }
  }

  return { ok: true }
}
