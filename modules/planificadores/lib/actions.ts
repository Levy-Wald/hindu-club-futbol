'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { canEditarPlanificador } from './permisos'
import { detectarOverlapCancha } from './overlap-detector'
import type { MoverEventoScope, ResultadoMover } from './types'

/**
 * Mueve un evento a nueva fecha/hora.
 * S1 pre-mortem: SOLO actualiza fecha, hora_inicio, hora_fin. Nada más.
 * S2 pre-mortem: para recurrentes con scope='esta_ocurrencia', crea evento hijo.
 * S4 pre-mortem: detecta overlap de cancha antes de mover.
 */
export async function moverEventoAction(input: {
  evento_id: string
  nueva_fecha: string
  nueva_hora_inicio: string
  nueva_hora_fin: string
  scope: MoverEventoScope
  ignorar_overlap?: boolean
}): Promise<ResultadoMover> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .single()
  if (!persona) return { ok: false, error: 'Persona no encontrada' }

  const adminSupabase = createServiceRoleClient()

  // AP-001: usar .eq('activo', true), no deleted_at
  const { data: evento } = await adminSupabase
    .from('eventos')
    .select('*')
    .eq('id', input.evento_id)
    .eq('tenant_id', persona.tenant_id)
    .eq('activo', true)
    .single()
  if (!evento) return { ok: false, error: 'Evento no encontrado' }

  // Permisos: tenant.admin, planificadores.editor, o coach del equipo
  const puede = await canEditarPlanificador(persona.id, evento.equipo_id)
  if (!puede) return { ok: false, error: 'Sin permiso para mover este evento' }

  // S4: detectar overlap si hay cancha asignada
  if (evento.cancha_id && !input.ignorar_overlap) {
    const conflicto = await detectarOverlapCancha({
      cancha_id: evento.cancha_id,
      fecha: input.nueva_fecha,
      hora_inicio: input.nueva_hora_inicio,
      hora_fin: input.nueva_hora_fin,
      tenant_id: persona.tenant_id,
      evento_id_excluir: input.evento_id,
    })
    if (conflicto) {
      return { ok: false, error: 'Conflicto de cancha detectado', conflicto }
    }
  }

  // S2: evento recurrente + scope 'esta_ocurrencia' → crear hijo huérfano
  if (input.scope === 'esta_ocurrencia' && evento.es_recurrente) {
    const { data: nuevoEvento, error } = await adminSupabase
      .from('eventos')
      .insert({
        tenant_id: evento.tenant_id,
        titulo: evento.titulo,
        descripcion: evento.descripcion,
        tipo_evento_slug: evento.tipo_evento_slug,
        equipo_id: evento.equipo_id,
        sede_id: evento.sede_id,
        cancha_id: evento.cancha_id,
        instructor_principal_id: evento.instructor_principal_id,
        responsable_persona_id: evento.responsable_persona_id,
        estado: evento.estado,
        color: evento.color,
        icono: evento.icono,
        modulo_origen: evento.modulo_origen,
        fecha: input.nueva_fecha,
        hora_inicio: input.nueva_hora_inicio,
        hora_fin: input.nueva_hora_fin,
        es_recurrente: false,
        evento_padre_id: evento.id,
        serie_uuid: evento.serie_uuid,
        activo: true,
      })
      .select('id')
      .single()

    if (error || !nuevoEvento) {
      return { ok: false, error: error?.message ?? 'Error creando ocurrencia' }
    }
    return { ok: true, evento_id: evento.id, evento_nuevo_id: nuevoEvento.id }
  }

  // S1: UPDATE explícito SOLO de fecha/hora. Nada más.
  if (input.scope === 'toda_la_serie' && evento.es_recurrente) {
    // Mover toda la serie: actualizar el evento padre
    const { error } = await adminSupabase
      .from('eventos')
      .update({
        fecha: input.nueva_fecha,
        hora_inicio: input.nueva_hora_inicio,
        hora_fin: input.nueva_hora_fin,
      })
      .eq('id', evento.id)

    if (error) return { ok: false, error: error.message }
    return { ok: true, evento_id: evento.id }
  }

  // Caso default: evento simple (no recurrente)
  const { error } = await adminSupabase
    .from('eventos')
    .update({
      fecha: input.nueva_fecha,
      hora_inicio: input.nueva_hora_inicio,
      hora_fin: input.nueva_hora_fin,
    })
    .eq('id', evento.id)

  if (error) return { ok: false, error: error.message }
  return { ok: true, evento_id: evento.id }
}
