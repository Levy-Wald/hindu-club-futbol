import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { syncGoogleEventsToClubCore } from './sync-from-cloud'
import { syncMicrosoftEventsToClubCore } from './sync-from-microsoft'
import { syncICloudEventsToClubCore } from './sync-from-icloud'
import type { CalendarioIntegracion } from './types'

const MAX_RETRIES = 3
const BACKOFF_BASE_MS = 2000

/**
 * Processes all due calendar integrations (Google + Microsoft).
 * Called by the Vercel Cron endpoint.
 */
export async function processCalendarSync(): Promise<{
  processed: number
  errors: string[]
}> {
  const supabase = createServiceRoleClient()
  const errors: string[] = []
  let processed = 0

  const now = new Date().toISOString()

  const { data: integraciones, error } = await supabase
    .from('calendario_integraciones')
    .select('*')
    .in('proveedor', ['google', 'microsoft', 'icloud'])
    .eq('estado', 'connected')
    .is('deleted_at', null)
    .or(`next_sync_at.is.null,next_sync_at.lte.${now}`)
    .limit(50)

  if (error) {
    return { processed: 0, errors: [error.message] }
  }

  for (const raw of integraciones ?? []) {
    const integracion = raw as CalendarioIntegracion
    let retries = 0
    let success = false

    while (retries < MAX_RETRIES && !success) {
      try {
        const result = integracion.proveedor === 'microsoft'
          ? await syncMicrosoftEventsToClubCore(integracion)
          : integracion.proveedor === 'icloud'
            ? await syncICloudEventsToClubCore(integracion)
            : await syncGoogleEventsToClubCore(integracion)

        if (result.ok) {
          success = true
          processed++
          if (result.errors.length > 0) {
            errors.push(...result.errors.map((e) => `[${integracion.id}] ${e}`))
          }
        } else {
          retries++
          if (retries < MAX_RETRIES) {
            await sleep(BACKOFF_BASE_MS * Math.pow(2, retries - 1))
          }
        }
      } catch (err) {
        retries++
        const msg = err instanceof Error ? err.message : String(err)

        if (msg.includes('token revoked') || msg.includes('disconnected')) {
          errors.push(`[${integracion.id}] Token revoked, skipping`)
          break
        }

        if (retries < MAX_RETRIES) {
          await sleep(BACKOFF_BASE_MS * Math.pow(2, retries - 1))
        }
      }
    }

    if (!success && retries >= MAX_RETRIES) {
      await supabase
        .from('calendario_integraciones')
        .update({
          estado: 'error',
          error_log: [
            ...((integracion.error_log as Record<string, unknown>[]) ?? []),
            { type: 'sync_failed_max_retries', at: new Date().toISOString() },
          ],
        })
        .eq('id', integracion.id)

      errors.push(`[${integracion.id}] Failed after ${MAX_RETRIES} retries`)
    }
  }

  return { processed, errors }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
