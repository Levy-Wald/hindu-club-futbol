'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

// --- REGISTRAR / ACTUALIZAR ASISTENCIA ---

export async function registrarAsistencia(input: {
  evento_id: string
  persona_id: string
  estado: string // confirmado, rechazado, pendiente, ausente, presente
  nota?: string
}) {
  const supabase = await createClient()

  const estados = ['confirmado', 'rechazado', 'pendiente', 'ausente', 'presente']
  if (!estados.includes(input.estado)) {
    return formatResult(false, `Estado invalido: ${input.estado}`)
  }

  // Upsert: si ya existe la asistencia para este evento+persona, actualizar
  const { error } = await supabase
    .from('evento_asistencias')
    .upsert(
      {
        tenant_id: TENANT_ID,
        evento_id: input.evento_id,
        persona_id: input.persona_id,
        estado: input.estado,
        nota: input.nota?.trim() || null,
        respondido_at: input.estado !== 'pendiente' ? new Date().toISOString() : null,
      },
      { onConflict: 'tenant_id,evento_id,persona_id' }
    )

  if (error) {
    return formatResult(false, `Error al registrar asistencia: ${error.message}`)
  }

  revalidatePath('/admin/operaciones')
  return formatResult(true, 'Asistencia registrada')
}

// --- GENERAR ASISTENCIAS PARA TODOS LOS MIEMBROS DEL EQUIPO ---

export async function generarAsistenciasEvento(eventoId: string, equipoId: string) {
  const supabase = await createClient()

  // Obtener miembros activos del equipo
  const { data: miembros, error: miembrosError } = await supabase
    .from('personas_equipos')
    .select('persona_id')
    .eq('equipo_id', equipoId)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  if (miembrosError) {
    return formatResult(false, `Error al obtener miembros: ${miembrosError.message}`)
  }

  if (!miembros || miembros.length === 0) {
    return formatResult(false, 'No hay miembros activos en este equipo.')
  }

  // Obtener persona_ids unicos (un miembro puede tener multiples roles)
  const personaIds = [...new Set(miembros.map((m) => m.persona_id))]

  // Obtener asistencias existentes para no duplicar
  const { data: existentes } = await supabase
    .from('evento_asistencias')
    .select('persona_id')
    .eq('evento_id', eventoId)
    .eq('tenant_id', TENANT_ID)

  const existenteSet = new Set((existentes ?? []).map((e) => e.persona_id))

  // Filtrar los que ya tienen asistencia
  const nuevos = personaIds.filter((pid) => !existenteSet.has(pid))

  if (nuevos.length === 0) {
    return formatResult(true, 'Todos los miembros ya tienen asistencia registrada.')
  }

  const rows = nuevos.map((persona_id) => ({
    tenant_id: TENANT_ID,
    evento_id: eventoId,
    persona_id,
    estado: 'pendiente' as const,
  }))

  const { error } = await supabase.from('evento_asistencias').insert(rows)

  if (error) {
    return formatResult(false, `Error al generar asistencias: ${error.message}`)
  }

  revalidatePath('/admin/operaciones')
  return formatResult(true, `Se crearon ${nuevos.length} asistencias pendientes.`)
}
