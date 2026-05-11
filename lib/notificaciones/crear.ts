import { createServiceRoleClient } from '@/lib/supabase/service-role'

export type NotificacionTipo =
  | 'cuota_emitida' | 'cuota_proxima_vencer' | 'cuota_vencida'
  | 'pago_recibido' | 'pago_anulado'
  | 'cargo_aplicado' | 'cargo_reversado'
  | 'utileria_solicitud_pendiente' | 'utileria_solicitud_preparada'
  | 'utileria_devolucion_vencida' | 'utileria_cargo_reposicion'
  | 'apto_medico_proximo_vencer' | 'apto_medico_vencido'
  | 'autorizacion_proxima_vencer' | 'autorizacion_vencida'
  | 'rol_asignado' | 'rol_revocado'
  | 'suscripcion_creada' | 'suscripcion_cancelada'
  | 'concesion_venta_registrada' | 'concesion_canon_calculado'
  | 'concesion_canon_pendiente_cobro' | 'concesion_stock_minimo'

export interface CrearNotificacionInput {
  tenant_id: string
  destinatario_persona_id: string
  tipo: NotificacionTipo
  titulo: string
  mensaje: string
  link_accion?: string
  prioridad?: 'baja' | 'media' | 'alta' | 'critica'
  origen_tabla?: string
  origen_registro_id?: string
  origen_evento?: string
  generada_por_persona_id?: string
  metadata?: Record<string, unknown>
}

/**
 * Crea una notificación in-app para una persona.
 * Dedup: si origen_tabla + origen_registro_id + tipo ya existe en últimas 24h, skip.
 */
export async function crearNotificacion(
  input: CrearNotificacionInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Dedup
    if (input.origen_tabla && input.origen_registro_id) {
      const { data: existente } = await supabase
        .from('notificaciones')
        .select('id')
        .eq('tenant_id', input.tenant_id)
        .eq('destinatario_persona_id', input.destinatario_persona_id)
        .eq('tipo_slug', input.tipo)
        .eq('origen_tabla', input.origen_tabla)
        .eq('origen_registro_id', input.origen_registro_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle()

      if (existente) {
        return { ok: true, id: existente.id }
      }
    }

    const { data, error } = await supabase.rpc('fn_crear_notificacion', {
      p_tenant_id: input.tenant_id,
      p_destinatario_persona_id: input.destinatario_persona_id,
      p_tipo_slug: input.tipo,
      p_titulo: input.titulo,
      p_mensaje: input.mensaje,
      p_link_accion: input.link_accion ?? null,
      p_prioridad: input.prioridad ?? null,
      p_origen_tabla: input.origen_tabla ?? null,
      p_origen_registro_id: input.origen_registro_id ?? null,
      p_origen_evento: input.origen_evento ?? null,
      p_generada_por_persona_id: input.generada_por_persona_id ?? null,
      p_metadata: input.metadata ?? {},
    })

    if (error) {
      console.error('Error creando notificación:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data as string }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('Error inesperado creando notificación:', msg)
    return { ok: false, error: msg }
  }
}

/**
 * Crea N notificaciones en batch para una lista de destinatarios.
 */
export async function crearNotificacionMasiva(
  destinatarios: string[],
  base: Omit<CrearNotificacionInput, 'destinatario_persona_id'>
): Promise<{ ok: boolean; creadas: number; errores: number }> {
  let creadas = 0
  let errores = 0

  const chunkSize = 50
  for (let i = 0; i < destinatarios.length; i += chunkSize) {
    const chunk = destinatarios.slice(i, i + chunkSize)
    const results = await Promise.all(
      chunk.map(persona_id =>
        crearNotificacion({ ...base, destinatario_persona_id: persona_id })
      )
    )
    creadas += results.filter(r => r.ok).length
    errores += results.filter(r => !r.ok).length
  }

  return { ok: errores === 0, creadas, errores }
}
