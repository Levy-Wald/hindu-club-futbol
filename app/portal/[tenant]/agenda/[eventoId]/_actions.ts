'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { TENANT_ID } from '@/lib/tenant'
import { crearNotificacion } from '@/modules/notificaciones/lib/crear'
import {
  esRespuestaValida,
  puedeResponderConvocatoria,
  type RespuestaConvocatoria,
} from '@/app/admin/[tenant]/(troncal)/convocatorias/_lib/calculos'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const LABEL: Record<RespuestaConvocatoria, string> = {
  aceptado: 'confirmó',
  rechazado: 'no va a poder ir a',
  tentativa: 'está en duda para',
  pendiente: 'no respondió',
}

// F1 portal — el jugador convocado responde su disponibilidad para un partido.
// Self-scoped: solo puede responder SU propia convocatoria. Avisa a los
// responsables del evento (DT / cuerpo técnico).
export async function responderConvocatoria(
  eventoId: string,
  respuesta: string,
  motivo?: string,
) {
  if (!esRespuestaValida(respuesta) || respuesta === 'pendiente') {
    return formatResult(false, 'Respuesta inválida')
  }

  const personaId = await getCurrentPersonaId()
  if (!personaId) return formatResult(false, 'No autenticado')

  const supabase = createServiceRoleClient()

  // Convocatoria propia + datos del evento para validar
  const [{ data: conv }, { data: evento }] = await Promise.all([
    supabase
      .from('evento_convocados')
      .select('id, estado')
      .eq('evento_id', eventoId)
      .eq('persona_id', personaId)
      .maybeSingle(),
    supabase
      .from('eventos')
      .select('id, titulo, fecha_inicio, responsables_persona_id')
      .eq('id', eventoId)
      .eq('tenant_id', TENANT_ID)
      .maybeSingle(),
  ])

  if (!conv) return formatResult(false, 'No estás convocado a este partido.')
  if (!evento) return formatResult(false, 'Partido no encontrado.')

  const gate = puedeResponderConvocatoria({
    estado: conv.estado as 'titular' | 'suplente' | 'convocado',
    fechaInicio: evento.fecha_inicio as string | null,
    hoyISO: hoyISO(),
  })
  if (!gate.ok) return formatResult(false, gate.motivo ?? 'No podés responder esta convocatoria.')

  const { error } = await supabase
    .from('evento_convocados')
    .update({
      respuesta,
      respuesta_at: new Date().toISOString(),
      motivo_respuesta: motivo?.trim() || null,
    })
    .eq('id', conv.id)

  if (error) return formatResult(false, error.message)

  // Avisar a los responsables del evento (DT / cuerpo técnico)
  const responsables = (evento.responsables_persona_id as string[] | null) ?? []
  if (responsables.length > 0) {
    const { data: yo } = await supabase
      .from('personas')
      .select('nombre, apellido')
      .eq('id', personaId)
      .maybeSingle()
    const nombre = yo ? `${yo.nombre} ${yo.apellido}` : 'Un jugador'
    const partido = evento.titulo ?? 'el partido'
    await Promise.all(
      responsables
        .filter((rid) => rid !== personaId)
        .map((rid) =>
          crearNotificacion({
            tenant_id: TENANT_ID,
            destinatario_persona_id: rid,
            tipo: 'convocatoria_respondida',
            titulo: `${nombre} ${LABEL[respuesta as RespuestaConvocatoria]} ${partido}`,
            mensaje: motivo?.trim() ? `Motivo: ${motivo.trim()}` : `Respuesta: ${respuesta}`,
            prioridad: respuesta === 'rechazado' ? 'alta' : 'media',
            link_accion: `/admin/convocatorias/${eventoId}`,
            origen_tabla: 'evento_convocados',
            origen_registro_id: conv.id,
            generada_por_persona_id: personaId,
          }),
        ),
    )
  }

  revalidatePath('/portal', 'layout')
  return formatResult(true, 'Listo, registramos tu respuesta.')
}
