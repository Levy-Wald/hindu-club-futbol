'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { clubCoreToICloudEvent } from './icloud-event-mapping'
import { computeEventHash, eventsEqual } from './event-mapping'
import { createICloudEvent, updateICloudEvent, deleteICloudEvent } from './icloud-client'
import type { CalendarioIntegracion } from './types'

/**
 * Syncs a single ClubCore evento to iCloud via CalDAV.
 */
export async function syncEventoToICloud(
  eventoId: string,
  integracion: CalendarioIntegracion,
  mode: 'upsert' | 'delete' = 'upsert',
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceRoleClient()

  try {
    if (!integracion.icloud_calendar_url || !integracion.icloud_email || !integracion.icloud_app_password) {
      return { ok: false, error: 'Missing iCloud calendar config' }
    }

    const { data: syncMap } = await supabase
      .from('evento_sync_map')
      .select('*')
      .eq('evento_id', eventoId)
      .eq('proveedor', 'icloud')
      .maybeSingle()

    if (mode === 'delete') {
      if (syncMap?.evento_id_externo) {
        await deleteICloudEvent(
          integracion.icloud_calendar_url,
          integracion.icloud_email,
          integracion.icloud_app_password,
          syncMap.evento_id_externo,
          syncMap.hash_sync, // Use hash as ETag proxy
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
    const icloudEvent = clubCoreToICloudEvent(evento)

    if (syncMap) {
      if (eventsEqual(hash, syncMap.hash_sync)) {
        return { ok: true }
      }

      const { etag } = await updateICloudEvent(
        integracion.icloud_calendar_url,
        integracion.icloud_email,
        integracion.icloud_app_password,
        { ...icloudEvent, uid: syncMap.evento_id_externo },
        syncMap.hash_sync,
      )

      await supabase
        .from('evento_sync_map')
        .update({
          hash_sync: etag || hash,
          synced_at: new Date().toISOString(),
          sync_direction: 'local→cloud',
        })
        .eq('id', syncMap.id)
    } else {
      const { uid, etag } = await createICloudEvent(
        integracion.icloud_calendar_url,
        integracion.icloud_email,
        integracion.icloud_app_password,
        icloudEvent,
      )

      await supabase.from('evento_sync_map').insert({
        evento_id: eventoId,
        proveedor: 'icloud',
        evento_id_externo: uid,
        hash_sync: etag || hash,
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
      .eq('proveedor', 'icloud')
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
