'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

export async function aprobarSolicitud(solicitudId: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return formatResult(false, 'Persona no encontrada')

  // Obtener solicitud
  const { data: solicitud } = await supabase
    .from('solicitudes')
    .select('*')
    .eq('id', solicitudId)
    .single()

  if (!solicitud) return formatResult(false, 'Solicitud no encontrada')
  if (solicitud.estado !== 'pendiente') return formatResult(false, 'La solicitud ya fue procesada')

  // Aprobar
  const { error: updateError } = await supabase
    .from('solicitudes')
    .update({
      estado: 'aprobada',
      revisado_por: persona.id,
      revisado_at: new Date().toISOString(),
    })
    .eq('id', solicitudId)

  if (updateError) return formatResult(false, updateError.message)

  // Si es ingreso_equipo, crear la asignación
  const datos = solicitud.datos as Record<string, unknown>
  if (solicitud.tipo === 'ingreso_equipo' && datos.equipo_id) {
    await supabase.from('personas_equipos').insert({
      persona_id: solicitud.solicitante_id,
      equipo_id: datos.equipo_id as string,
      rol_equipo_slug: (datos.rol_solicitado as string) || 'jugador',
      activo: true,
    })
  }

  // Si es cambio_datos, aplicar el cambio
  if (solicitud.tipo === 'cambio_datos' && datos.campo && datos.valor_nuevo) {
    await supabase
      .from('personas')
      .update({ [datos.campo as string]: datos.valor_nuevo })
      .eq('id', solicitud.solicitante_id)
  }

  revalidatePath('/admin/comunicaciones')
  return formatResult(true, 'Solicitud aprobada')
}

export async function rechazarSolicitud(solicitudId: string, motivo: string) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return formatResult(false, 'Persona no encontrada')

  const { error } = await supabase
    .from('solicitudes')
    .update({
      estado: 'rechazada',
      revisado_por: persona.id,
      revisado_at: new Date().toISOString(),
      motivo_rechazo: motivo || null,
    })
    .eq('id', solicitudId)
    .eq('estado', 'pendiente')

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/comunicaciones')
  return formatResult(true, 'Solicitud rechazada')
}
