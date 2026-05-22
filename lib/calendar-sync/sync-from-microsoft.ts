'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { microsoftEventToClubCore } from './microsoft-event-mapping'
import { getAllMicrosoftEventsSince } from './microsoft-client'
import { ensureMicrosoftTokenValid } from './microsoft-token-refresh'
import { detectConflict } from './conflict-resolution'
import type { CalendarioIntegracion, MicrosoftCalendarEvent } from './types'

/**
 * Pulls events from Microsoft Outlook and upserts into ClubCore.
 * Uses last-write-wins conflict resolution.
 */
export async function syncMicrosoftEventsToClubCore(
  integracion: CalendarioIntegracion,
): Promise<{ ok: boolean; synced: number; errors: string[] }> {
  const supabase = createServiceRoleClient()
  const errors: string[] = []
  let synced = 0

  try {
    const accessToken = await ensureMicrosoftTokenValid(integracion)

    if (!integracion.microsoft_calendar_id) {
      return { ok: false, synced: 0, errors: ['Missing Microsoft calendar config'] }
    }

    const since = integracion.last_sync_at
      ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const msEvents = await getAllMicrosoftEventsSince(
      accessToken,
      integracion.microsoft_calendar_id,
      since,
    )

    for (const msEvent of msEvents) {
      try {
        if (msEvent.isCancelled) continue

        const { data: syncMap } = await supabase
          .from('evento_sync_map')
          .select('*, eventos!evento_id(id, updated_at)')
          .eq('evento_id_externo', msEvent.id)
          .eq('proveedor', 'microsoft')
          .maybeSingle()

        const mapped = microsoftEventToClubCore(msEvent)

        if (syncMap) {
          const localEvento = (syncMap as Record<string, unknown>).eventos as {
            id: string
            updated_at: string
          } | null

          if (!localEvento) continue

          const conflict = detectConflict(localEvento, {
            id: msEvent.id,
            summary: msEvent.subject,
            start: {},
            end: {},
            updated: msEvent.lastModifiedDateTime,
          })

          if (conflict.winner === 'cloud') {
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
        } else {
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
            errors.push(`Insert failed for MS event ${msEvent.id}: ${insertErr?.message}`)
            continue
          }

          await supabase.from('evento_sync_map').insert({
            evento_id: newEvento.id,
            proveedor: 'microsoft',
            evento_id_externo: msEvent.id,
            hash_sync: '',
            synced_at: new Date().toISOString(),
            sync_direction: 'cloud→local',
          })

          synced++
        }
      } catch (err) {
        errors.push(`Error syncing MS event ${msEvent.id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

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
