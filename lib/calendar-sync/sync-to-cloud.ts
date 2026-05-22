'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { clubCoreToGoogleEvent, computeEventHash, eventsEqual } from './event-mapping'
import { createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from './google-client'
import { ensureValidToken } from './token-refresh'
import type { CalendarioIntegracion } from './types'

/**
 * Syncs a single ClubCore evento to Google Calendar.
 * Handles create, update, and delete.
 */
export async function syncEventoToGoogle(
  eventoId: string,
  integracion: CalendarioIntegracion,
  mode: 'upsert' | 'delete' = 'upsert',
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  try {
    // Ensure valid token
    await ensureValidToken(integracion)

    if (!integracion.google_calendar_id || !integracion.google_refresh_token) {
      return { ok: false, error: 'Missing Google calendar config' }
    }

    // Check existing sync map
    const { data: syncMap } = await supabase
      .from('evento_sync_map')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('proveedor', 'google')
      .maybeSingle()

    if (mode === 'delete') {
      if (syncMap?.evento_id_externo) {
        await deleteGoogleEvent(
          integracion.google_refresh_token,
          integracion.google_calendar_id,
          syncMap.evento_id_externo,
        )
        await supabase.from('evento_sync_map').delete().eq('id', syncMap.id)
      }
      return { ok: true }
    }

    // Fetch the evento
    const { data: evento, error: evError } = await supabase
      .from('eventos')
      .select('id, titulo, descripcion, fecha_inicio, fecha_fin, hora_inicio, hora_fin, lugar_encuentro, tipo_evento_slug, updated_at')
      .eq('id', eventoId)
      .is('deleted_at', null)
      .single()

    if (evError || !evento) {
      return { ok: false, error: 'Evento not found or deleted' }
    }

    const hash = computeEventHash(evento)
    const googleEvent = clubCoreToGoogleEvent(evento)

    if (syncMap) {
      // Already synced — check if changed
      if (eventsEqual(hash, syncMap.hash_sync)) {
        return { ok: true } // No changes
      }

      // Update existing Google event
      await updateGoogleEvent(
        integracion.google_refresh_token,
        integracion.google_calendar_id,
        syncMap.evento_id_externo,
        googleEvent,
      )

      await supabase
        .from('evento_sync_map')
        .update({
          hash_sync: hash,
          synced_at: new Date().toISOString(),
          sync_direction: 'local→cloud',
        })
        .eq('id', syncMap.id)
    } else {
      // Create new Google event
      const { eventId } = await createGoogleEvent(
        integracion.google_refresh_token,
        integracion.google_calendar_id,
        googleEvent,
      )

      await supabase.from('evento_sync_map').insert({
        evento_id: eventoId,
        proveedor: 'google',
        evento_id_externo: eventId,
        hash_sync: hash,
        synced_at: new Date().toISOString(),
        sync_direction: 'local→cloud',
      })
    }

    return { ok: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    // Log error in sync map if exists
    if (eventoId) {
      const { data: existing } = await supabase
        .from('evento_sync_map')
        .select('id, errores')
        .eq('evento_id', eventoId)
        .eq('proveedor', 'google')
        .maybeSingle()

      if (existing) {
        await supabase
          .from('evento_sync_map')
          .update({
            errores: [
              ...((existing.errores as Record<string, unknown>[]) ?? []),
              { at: new Date().toISOString(), error: errorMsg },
            ],
          })
          .eq('id', existing.id)
      }
    }

    return { ok: false, error: errorMsg }
  }
}
