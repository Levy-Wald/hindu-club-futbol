'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

export async function fetchCuerpoTecnico(equipoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas_equipos')
    .select(
      `id, persona_id, rol_equipo_slug, fecha_inicio, fecha_fin, activo, notas,
       personas!persona_id(id, nombre, apellido, numero_documento, email_principal, telefono_principal, whatsapp, foto_perfil_url)`
    )
    .eq('equipo_id', equipoId)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('rol_equipo_slug', ['dt', 'asistente_dt', 'preparador_fisico', 'kine', 'medico_equipo', 'utilero', 'manager', 'scout', 'delegado', 'referente'])
    .order('rol_equipo_slug', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchCuerpoTecnicoGlobal() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas_equipos')
    .select(
      `id, persona_id, rol_equipo_slug, fecha_inicio, fecha_fin, activo, notas, equipo_id,
       personas!persona_id(id, nombre, apellido, email_principal, telefono_principal, whatsapp, foto_perfil_url),
       equipos!equipo_id(id, nombre, disciplina_slug)`
    )
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('rol_equipo_slug', ['dt', 'asistente_dt', 'preparador_fisico', 'kine', 'medico_equipo', 'utilero', 'manager', 'scout', 'delegado', 'referente'])
    .order('rol_equipo_slug', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function asignarStaff(input: {
  equipo_id: string
  persona_id: string
  rol_equipo_slug: string
  notas?: string
}) {
  const supabase = await createClient()

  if (!input.persona_id || !input.rol_equipo_slug) {
    return formatResult(false, 'Persona y rol son obligatorios.')
  }

  const ROLES_UNICOS = ['dt', 'capitan', 'manager']
  if (ROLES_UNICOS.includes(input.rol_equipo_slug)) {
    // Check if there's already someone with this role
    const { data: existing } = await supabase
      .from('personas_equipos')
      .select('id, persona_id')
      .eq('equipo_id', input.equipo_id)
      .eq('tenant_id', TENANT_ID)
      .eq('rol_equipo_slug', input.rol_equipo_slug)
      .eq('activo', true)
      .is('fecha_fin', null)
      .limit(1)

    if (existing && existing.length > 0) {
      return formatResult(false, `Ya existe un ${input.rol_equipo_slug} activo en este equipo. Desvinculá al actual primero.`)
    }
  }

  const { error } = await supabase
    .from('personas_equipos')
    .insert({
      tenant_id: TENANT_ID,
      equipo_id: input.equipo_id,
      persona_id: input.persona_id,
      rol_equipo_slug: input.rol_equipo_slug,
      notas: input.notas?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') {
      return formatResult(false, 'Esta persona ya tiene ese rol en el equipo.')
    }
    return formatResult(false, `Error al asignar staff: ${error.message}`)
  }

  revalidatePath(`/admin/equipos/${input.equipo_id}`)
  revalidatePath('/admin/equipos/cuerpo-tecnico')
  return formatResult(true, 'Staff asignado correctamente.')
}

export async function desvincularStaff(personaEquipoId: string, equipoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('personas_equipos')
    .update({ activo: false, fecha_fin: new Date().toISOString().split('T')[0] })
    .eq('id', personaEquipoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al desvincular: ${error.message}`)
  }

  revalidatePath(`/admin/equipos/${equipoId}`)
  revalidatePath('/admin/equipos/cuerpo-tecnico')
  return formatResult(true, 'Staff desvinculado correctamente.')
}

export async function fetchRolesStaff() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('catalogo_roles_equipo')
    .select('slug, nombre, categoria')
    .eq('categoria', 'staff')
    .order('nombre', { ascending: true })

  if (error) throw error
  return data ?? []
}
