'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

export async function editarMiPerfil(datos: Record<string, unknown>) {
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
    .from('personas')
    .update(datos)
    .eq('id', persona.id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/mi-perfil')
  return formatResult(true, 'Perfil actualizado')
}

export async function solicitarCambioDatos(campo: string, valorActual: string, valorNuevo: string) {
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
    .insert({
      tenant_id: TENANT_ID,
      tipo: 'cambio_datos',
      solicitante_id: persona.id,
      datos: { campo, valor_actual: valorActual, valor_nuevo: valorNuevo },
    })

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/mi-perfil')
  return formatResult(true, 'Solicitud enviada. Un administrador la revisará.')
}

export async function solicitarIngresoEquipo(equipoId: string, rolSolicitado: string, mensaje?: string) {
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

  // Verificar que no haya solicitud pendiente para el mismo equipo
  const { data: existente } = await supabase
    .from('solicitudes')
    .select('id')
    .eq('solicitante_id', persona.id)
    .eq('tipo', 'ingreso_equipo')
    .eq('estado', 'pendiente')
    .single()

  if (existente) return formatResult(false, 'Ya tenés una solicitud de ingreso pendiente')

  const { error } = await supabase
    .from('solicitudes')
    .insert({
      tenant_id: TENANT_ID,
      tipo: 'ingreso_equipo',
      solicitante_id: persona.id,
      datos: { equipo_id: equipoId, rol_solicitado: rolSolicitado, mensaje: mensaje || null },
    })

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/mi-perfil')
  return formatResult(true, 'Solicitud de ingreso enviada')
}
