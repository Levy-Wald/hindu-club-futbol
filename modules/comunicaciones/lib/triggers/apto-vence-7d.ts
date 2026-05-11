import type { SupabaseClient } from '@supabase/supabase-js'
import { enviarComunicacionMasiva } from '../cliente'
import { filtrarDuplicados } from './dedup'
import type { TriggerResult } from './tipos'

const JOB_SLUG = 'apto_vence_7d'
const PLANTILLA_SLUG = 'apto_vencimiento_inapp'
const CANAL = 'inapp' as const
const ORIGEN_MODULO = 'apto_fisico'

/**
 * Busca personas con apto físico que vence en los próximos 7 días
 * y les envía una notificación in-app.
 */
export async function ejecutarAptoVence7d(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TriggerResult> {
  const detalles: string[] = []

  // 1. Buscar autorizaciones de apto_fisico que vencen en los próximos 7 días
  const hoy = new Date()
  const en7dias = new Date()
  en7dias.setDate(en7dias.getDate() + 7)

  const { data: autorizaciones, error } = await supabase
    .from('personas_autorizaciones')
    .select('persona_id, fecha_vencimiento')
    .eq('tenant_id', tenantId)
    .eq('tipo_autorizacion_slug', 'apto_fisico')
    .eq('activo', true)
    .gte('fecha_vencimiento', hoy.toISOString().split('T')[0])
    .lte('fecha_vencimiento', en7dias.toISOString().split('T')[0])

  if (error) {
    detalles.push(`Error consultando autorizaciones: ${error.message}`)
    return { job_slug: JOB_SLUG, personas_encontradas: 0, personas_notificadas: 0, personas_dedup: 0, errores: 1, lote_id: null, detalles }
  }

  const personaIds = [...new Set((autorizaciones ?? []).map(a => a.persona_id))]
  detalles.push(`Personas con apto por vencer: ${personaIds.length}`)

  if (personaIds.length === 0) {
    return { job_slug: JOB_SLUG, personas_encontradas: 0, personas_notificadas: 0, personas_dedup: 0, errores: 0, lote_id: null, detalles }
  }

  // 2. Dedup: filtrar personas ya notificadas en los últimos 7 días
  const { permitidos, descartados } = await filtrarDuplicados(supabase, tenantId, personaIds, ORIGEN_MODULO, CANAL)
  detalles.push(`Dedup: ${descartados} descartados, ${permitidos.length} a notificar`)

  if (permitidos.length === 0) {
    return { job_slug: JOB_SLUG, personas_encontradas: personaIds.length, personas_notificadas: 0, personas_dedup: descartados, errores: 0, lote_id: null, detalles }
  }

  // 3. Enviar comunicación masiva
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
