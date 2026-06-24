'use server'

import { revalidatePath } from 'next/cache'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { TENANT_ID } from '@/lib/tenant'
import { calcularDuracionHoras, calcularTarifaTotal } from '@/modules/reservas/lib/helpers'

// F3 portal — el socio SOLICITA una reserva (estado 'pendiente'); el club la
// confirma desde el back office. persona_id se fija a la persona autenticada
// (un socio no puede reservar a nombre de otro). Sin auto-cobro ni auto-confirm.
export async function crearSolicitudReservaSocio(input: {
  cancha_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  notas?: string
}): Promise<{ ok: boolean; message: string }> {
  const personaId = await getCurrentPersonaId()
  if (!personaId) return { ok: false, message: 'No autenticado' }

  if (!input.cancha_id || !input.fecha || !input.hora_inicio || !input.hora_fin) {
    return { ok: false, message: 'Completá espacio, fecha y horario.' }
  }
  const duracion = calcularDuracionHoras(input.hora_inicio, input.hora_fin)
  if (duracion <= 0) return { ok: false, message: 'La hora de fin debe ser posterior a la de inicio.' }

  const supabase = createServiceRoleClient()

  const { data: cancha } = await supabase
    .from('canchas')
    .select('id, nombre, precio_alquiler_hora')
    .eq('id', input.cancha_id)
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .single()
  if (!cancha) return { ok: false, message: 'Espacio no encontrado.' }

  const tarifaHora = cancha.precio_alquiler_hora ? Number(cancha.precio_alquiler_hora) : null
  const tarifaTotal = calcularTarifaTotal(tarifaHora, duracion)

  const { data: evento, error: errEvento } = await supabase
    .from('eventos')
    .insert({
      tenant_id: TENANT_ID,
      tipo_evento_slug: 'reserva',
      titulo: `Reserva ${cancha.nombre} - Socio`,
      fecha_inicio: input.fecha,
      hora_inicio: input.hora_inicio,
      hora_fin: input.hora_fin,
      cancha_id: input.cancha_id,
      activo: true,
      modulo_origen: 'reservas',
    })
    .select('id')
    .single()
  if (errEvento || !evento) return { ok: false, message: errEvento?.message ?? 'Error creando la solicitud' }

  const { error: errReserva } = await supabase.from('reservas_canchas').insert({
    tenant_id: TENANT_ID,
    evento_id: evento.id,
    cancha_id: input.cancha_id,
    persona_id: personaId,
    tarifa_hora: tarifaHora,
    duracion_horas: duracion,
    tarifa_total: tarifaTotal,
    estado: 'pendiente',
    notas: input.notas?.trim() || null,
    creado_por_persona_id: personaId,
  })
  if (errReserva) {
    await supabase.from('eventos').delete().eq('id', evento.id)
    return { ok: false, message: errReserva.message }
  }

  revalidatePath('/portal', 'layout')
  return { ok: true, message: 'Solicitud de reserva enviada. El club la va a confirmar.' }
}
