import type { SupabaseClient } from '@supabase/supabase-js'
import { enviarComunicacionMasiva } from '../cliente'
import { filtrarDuplicados } from './dedup'
import type { TriggerResult } from './tipos'

const JOB_SLUG = 'cuota_vence_7d'
const PLANTILLA_SLUG = 'cuota_vencimiento_7_inapp'
const CANAL = 'inapp' as const
const ORIGEN_MODULO = 'cuotas'

/**
 * Busca personas con cuotas emitidas que vencen en los próximos 7 días
 * y les envía una notificación in-app.
 */
export async function ejecutarCuotaVence7d(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TriggerResult> {
  const detalles: string[] = []

  const hoy = new Date()
  const en7dias = new Date()
  en7dias.setDate(en7dias.getDate() + 7)

  const { data: cuotas, error } = await supabase
    .from('cuotas_emitidas')
    .select('persona_id, fecha_vencimiento, monto_final, periodo')
    .eq('tenant_id', tenantId)
    .eq('estado', 'emitida')
    .gte('fecha_vencimiento', hoy.toISOString().split('T')[0])
    .lte('fecha_vencimiento', en7dias.toISOString().split('T')[0])

  if (error) {
    detalles.push(`Error consultando cuotas: ${error.message}`)
    return { job_slug: JOB_SLUG, personas_encontradas: 0, personas_notificadas: 0, personas_dedup: 0, errores: 1, lote_id: null, detalles }
  }

  const personaIds = [...new Set((cuotas ?? []).map(c => c.persona_id))]
  detalles.push(`Personas con cuota por vencer: ${personaIds.length}`)

  if (personaIds.length === 0) {
    return { job_slug: JOB_SLUG, personas_encontradas: 0, personas_notificadas: 0, personas_dedup: 0, errores: 0, lote_id: null, detalles }
  }

  const { permitidos, descartados } = await filtrarDuplicados(supabase, tenantId, personaIds, ORIGEN_MODULO, CANAL)
  detalles.push(`Dedup: ${descartados} descartados, ${permitidos.length} a notificar`)

  if (permitidos.length === 0) {
    return { job_slug: JOB_SLUG, personas_encontradas: personaIds.length, personas_notificadas: 0, personas_dedup: descartados, errores: 0, lote_id: null, detalles }
  }

  const resultado = await enviarComunicacionMasiva({
    tenantId,
    plantillaSlug: PLANTILLA_SLUG,
    canal: CANAL,
    segmento: { tipo: 'personas_ids_directos', persona_ids: permitidos },
    origenModuloSlug: ORIGEN_MODULO,
    supabaseClient: supabase,
  })

  detalles.push(`Lote ${resultado.lote_id}: ${resultado.total_enviados} enviados, ${resultado.total_fallados} fallados`)

  return {
    job_slug: JOB_SLUG,
    personas_encontradas: personaIds.length,
    personas_notificadas: resultado.total_enviados,
    personas_dedup: descartados,
    errores: resultado.total_fallados,
    lote_id: resultado.lote_id || null,
    detalles,
  }
}
