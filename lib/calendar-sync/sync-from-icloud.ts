'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { icloudEventToClubCore } from './icloud-event-mapping'
import { getAllICloudEventsSince } from './icloud-client'
import { detectConflict } from './conflict-resolution'
import type { CalendarioIntegracion } from './types'

/**
 * Pulls events from iCloud CalDAV and upserts into ClubCore.
 * Uses last-write-wins conflict resolution.
 */
export async function syncICloudEventsToClubCore(
  integracion: CalendarioIntegracion,
): Promise<{ ok: boolean; synced: number; errors: string[] }> {
  const supabase = createServiceRoleClient()
  const errors: string[] = []
  let synced = 0

  try {
    if (!integracion.icloud_calendar_url || !integracion.icloud_email || !integracion.icloud_app_password) {
      return { ok: false, synced: 0, errors: ['Missing iCloud calendar config'] }
    }

    const since = integracion.last_sync_at
      ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const icloudEvents = await getAllICloudEventsSince(
      integracion.icloud_calendar_url,
      integracion.icloud_email,
      integracion.icloud_app_password,
      since,
    )

    for (const icEvent of icloudEvents) {
      try {
        if (icEvent.status === 'CANCELLED') continue

        const { data: syncMap } = await supabase
          .from('evento_sync_map')
          .select('*, eventos!evento_id(id, updated_at)')
          .eq('evento_id_externo', icEvent.uid)
          .eq('proveedor', 'icloud')
          .maybeSingle()

        const mapped = icloudEventToClubCore(icEvent)

        if (syncMap) {
          const localEvento = (syncMap as Record<string, unknown>).eventos as {
            id: string
            updated_at: string
          } | null

          if (!localEvento) continue

          const conflict = detectConflict(localEvento, {
            id: icEvent.uid,
            summary: icEvent.summary,
            start: {},
            end: {},
            updated: icEvent.lastModified,
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
                hash_sync: icEvent.etag ?? '',
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
            errors.push(`Insert failed for iCloud event ${icEvent.uid}: ${insertErr?.message}`)
            continue
          }

          await supabase.from('evento_sync_map').insert({
            evento_id: newEvento.id,
            proveedor: 'icloud',
            evento_id_externo: icEvent.uid,
            hash_sync: icEvent.etag ?? '',
            synced_at: new Date().toISOString(),
            sync_direction: 'cloud→local',
          })

          synced++
        }
      } catch (err) {
        errors.push(`Error syncing iCloud event ${icEvent.uid}: ${err instanceof Error ? err.message : String(err)}`)
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
