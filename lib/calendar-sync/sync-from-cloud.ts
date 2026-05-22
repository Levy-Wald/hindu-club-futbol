'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { googleEventToClubCore } from './event-mapping'
import { getAllGoogleEventsSince } from './google-client'
import { ensureValidToken } from './token-refresh'
import { detectConflict } from './conflict-resolution'
import type { CalendarioIntegracion } from './types'

/**
 * Pulls events from Google Calendar and upserts into ClubCore.
 * Uses last-write-wins conflict resolution.
 */
export async function syncGoogleEventsToClubCore(
  integracion: CalendarioIntegracion,
): Promise<{ ok: boolean; synced: number; errors: string[] }> {
  const supabase = createServiceRoleClient()
  const errors: string[] = []
  let synced = 0

  try {
    await ensureValidToken(integracion)

    if (!integracion.google_calendar_id || !integracion.google_refresh_token) {
      return { ok: false, synced: 0, errors: ['Missing Google calendar config'] }
    }

    // Fetch events since last sync (or last 30 days)
    const since = integracion.last_sync_at
      ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const googleEvents = await getAllGoogleEventsSince(
      integracion.google_refresh_token,
      integracion.google_calendar_id,
      since,
    )

    for (const gEvent of googleEvents) {
      try {
        // Skip cancelled events
        if (gEvent.status === 'cancelled') continue

        // Check if we already track this Google event
        const { data: syncMap } = await supabase
          .from('evento_sync_map')
          .select('*, eventos!evento_id(id, updated_at)')
          .eq('evento_id_externo', gEvent.id)
          .eq('proveedor', 'google')
          .maybeSingle()

        const mapped = googleEventToClubCore(gEvent)

        if (syncMap) {
          // Event exists locally — check for conflict
          const localEvento = (syncMap as Record<string, unknown>).eventos as {
            id: string
            updated_at: string
          } | null

          if (!localEvento) continue

          const conflict = detectConflict(localEvento, gEvent)

          if (conflict.winner === 'cloud') {
            // Cloud wins: update local evento
            await supabase
              .from('eventos')
              .update({
                titulo: mapped.titulo,
                descripcion: mapped.descripcion,
                fecha_inicio: mapped.fecha_inicio,
                fecha_fin: mapped.fecha_fin,
                hora_inicio: mapped.hora_inicio,
                hora_fin: mapped.hora_fin,
                lugar_encuentro: mapped.lugar_encuentro,
              })
              .eq('id', localEvento.id)

            await supabase
              .from('evento_sync_map')
              .update({
                synced_at: new Date().toISOString(),
                sync_direction: 'cloud→local',
              })
              .eq('id', syncMap.id)

            synced++
          }
          // If local wins, skip (our data is newer)
        } else {
          // New event from Google — insert into ClubCore
          const { data: newEvento, error: insertErr } = await supabase
            .from('eventos')
            .insert({
              tenant_id: integracion.tenant_id,
              titulo: mapped.titulo || 'Evento sincronizado',
              descripcion: mapped.descripcion,
              fecha_inicio: mapped.fecha_inicio,
              fecha_fin: mapped.fecha_fin,
              hora_inicio: mapped.hora_inicio,
              hora_fin: mapped.hora_fin,
              lugar_encuentro: mapped.lugar_encuentro,
              tipo_evento_slug: 'otro',
              modulo_origen: 'sync',
              responsables_persona_id: [integracion.persona_id],
              periodicidad: 'nunca',
              created_by: integracion.persona_id,
            })
            .select('id')
            .single()

          if (insertErr || !newEvento) {
            errors.push(`Insert failed for Google event ${gEvent.id}: ${insertErr?.message}`)
            continue
          }

          await supabase.from('evento_sync_map').insert({
            evento_id: newEvento.id,
            proveedor: 'google',
            evento_id_externo: gEvent.id,
            hash_sync: '',
            synced_at: new Date().toISOString(),
            sync_direction: 'cloud→local',
          })

          synced++
        }
      } catch (err) {
        errors.push(`Error syncing Google event ${gEvent.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // Update last_sync_at
    await supabase
      .from('calendario_integraciones')
      .update({
        last_sync_at: new Date().toISOString(),
        next_sync_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq('id', integracion.id)

    return { ok: true, synced, errors }
  } catch (err) {
    return {
      ok: false,
      synced,
      errors: [...errors, err instanceof Error ? err.message : String(err)],
    }
  }
}
