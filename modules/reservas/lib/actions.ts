'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canGestionarReservas } from './permisos'
import { calcularDuracionHoras, calcularTarifaTotal } from './helpers'
import type { EstadoReserva } from './types'

async function getPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

/**
 * Crea una reserva: evento tipo='reserva' + fila en reservas_canchas.
 * D51: tarifa calculada al crear, persistida.
 */
export async function crearReservaAction(input: {
  cancha_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  persona_id?: string
  entidad_id?: string
  cliente_nombre_externo?: string
  cliente_contacto_telefono?: string
  cliente_contacto_email?: string
  notas?: string
}): Promise<{ ok: true; reserva_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canGestionarReservas(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Get cancha info for tarifa
  const { data: cancha } = await supabase
    .from('canchas')
    .select('id, nombre, precio_alquiler_hora, disponible_para_alquiler')
    .eq('id', input.cancha_id)
    .eq('tenant_id', tenant_id)
    .eq('activa', true)
    .single()

  if (!cancha) return { ok: false, error: 'Cancha no encontrada' }

  // Calculate tarifa
  const duracionHoras = calcularDuracionHoras(input.hora_inicio, input.hora_fin)
  if (duracionHoras <= 0) return { ok: false, error: 'Hora fin debe ser posterior a hora inicio' }

  const tarifaHora = cancha.precio_alquiler_hora ? Number(cancha.precio_alquiler_hora) : null
  const tarifaTotal = calcularTarifaTotal(tarifaHora, duracionHoras)

  // Build titulo
  const clienteLabel = input.persona_id
    ? 'Socio'
    : input.entidad_id
      ? 'Entidad'
      : input.cliente_nombre_externo ?? 'Reserva'
  const titulo = `Reserva ${cancha.nombre} - ${clienteLabel}`

  // 1. Create evento tipo='reserva'
  const { data: evento, error: errEvento } = await supabase
    .from('eventos')
    .insert({
      tenant_id,
      tipo_evento_slug: 'reserva',
      titulo,
      fecha: input.fecha,
      hora_inicio: input.hora_inicio,
      hora_fin: input.hora_fin,
      cancha_id: input.cancha_id,
      activo: true,
      modulo_origen: 'reservas',
    })
    .select('id')
    .single()

  if (errEvento || !evento) return { ok: false, error: errEvento?.message ?? 'Error creando evento' }

  // 2. Create reserva
  const { data: reserva, error: errReserva } = await supabase
    .from('reservas_canchas')
    .insert({
      tenant_id,
      evento_id: evento.id,
      cancha_id: input.cancha_id,
      persona_id: input.persona_id ?? null,
      entidad_id: input.entidad_id ?? null,
      cliente_nombre_externo: input.cliente_nombre_externo ?? null,
      cliente_contacto_telefono: input.cliente_contacto_telefono ?? null,
      cliente_contacto_email: input.cliente_contacto_email ?? null,
      tarifa_hora: tarifaHora,
      duracion_horas: duracionHoras,
      tarifa_total: tarifaTotal,
      estado: 'pendiente',
      notas: input.notas ?? null,
      creado_por_persona_id: persona.id,
    })
    .select('id')
    .single()

  if (errReserva || !reserva) {
    // Rollback evento
    await supabase.from('eventos').delete().eq('id', evento.id)
    return { ok: false, error: errReserva?.message ?? 'Error creando reserva' }
  }

  return { ok: true, reserva_id: reserva.id }
}

/**
 * Actualiza el estado de una reserva.
 * Si estado='pagada', registra fecha_pago + metodo_pago.
 */
export async function actualizarEstadoReservaAction(input: {
  reserva_id: string
  estado: EstadoReserva
  metodo_pago?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canGestionarReservas(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const updateData: Record<string, unknown> = { estado: input.estado }
  if (input.estado === 'pagada') {
    updateData.fecha_pago = new Date().toISOString()
    updateData.metodo_pago = input.metodo_pago ?? null
  }

  const { error } = await supabase
    .from('reservas_canchas')
    .update(updateData)
    .eq('id', input.reserva_id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Cancela una reserva: estado='cancelada' + evento.activo=false.
 */
export async function cancelarReservaAction(input: {
  reserva_id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canGestionarReservas(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Get reserva to find evento_id
  const { data: reserva } = await supabase
    .from('reservas_canchas')
    .select('id, evento_id')
    .eq('id', input.reserva_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!reserva) return { ok: false, error: 'Reserva no encontrada' }

  // Update reserva
  const { error: errReserva } = await supabase
    .from('reservas_canchas')
    .update({ estado: 'cancelada' })
    .eq('id', reserva.id)

  if (errReserva) return { ok: false, error: errReserva.message }

  // Deactivate evento
  await supabase
    .from('eventos')
    .update({ activo: false })
    .eq('id', reserva.evento_id)
    .eq('tenant_id', tenant_id)

  return { ok: true }
}
