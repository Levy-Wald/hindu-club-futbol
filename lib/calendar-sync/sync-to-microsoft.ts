'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { clubCoreToMicrosoftEvent } from './microsoft-event-mapping'
import { computeEventHash, eventsEqual } from './event-mapping'
import {
  createMicrosoftEvent,
  updateMicrosoftEvent,
  deleteMicrosoftEvent,
} from './microsoft-client'
import { ensureMicrosoftTokenValid } from './microsoft-token-refresh'
import type { CalendarioIntegracion } from './types'

/**
 * Syncs a single ClubCore evento to Microsoft Outlook.
 */
export async function syncEventoToMicrosoft(
  eventoId: string,
  integracion: CalendarioIntegracion,
  mode: 'upsert' | 'delete' = 'upsert',
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  try {
    const accessToken = await ensureMicrosoftTokenValid(integracion)

    if (!integracion.microsoft_calendar_id) {
      return { ok: false, error: 'Missing Microsoft calendar config' }
    }

    const { data: syncMap } = await supabase
      .from('evento_sync_map')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('proveedor', 'microsoft')
      .maybeSingle()

    if (mode === 'delete') {
      if (syncMap?.evento_id_externo) {
        await deleteMicrosoftEvent(
          accessToken,
          integracion.microsoft_calendar_id,
          syncMap.evento_id_externo,
        )
        await supabase.from('evento_sync_map').delete().eq('id', syncMap.id)
      }
      return { ok: true }
    }

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
    const msEvent = clubCoreToMicrosoftEvent(evento)

    if (syncMap) {
      if (eventsEqual(hash, syncMap.hash_sync)) {
        return { ok: true }
      }

      await updateMicrosoftEvent(
        accessToken,
        integracion.microsoft_calendar_id,
        syncMap.evento_id_externo,
        msEvent,
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
      const { eventId } = await createMicrosoftEvent(
        accessToken,
        integracion.microsoft_calendar_id,
        msEvent,
      )

      await supabase.from('evento_sync_map').insert({
        evento_id: eventoId,
        proveedor: 'microsoft',
        evento_id_externo: eventId,
        hash_sync: hash,
        synced_at: new Date().toISOString(),
        sync_direction: 'local→cloud',
      })
    }

    return { ok: true }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)

    const { data: existing } = await supabase
      .from('evento_sync_map')
      .select('id, errores')
      .eq('evento_id', eventoId)
      .eq('proveedor', 'microsoft')
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

    return { ok: false, error: errorMsg }
  }
}
