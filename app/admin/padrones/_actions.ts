'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

export interface CrearPadronInput {
  nombre: string
  slug: string
  tipo: string
  pipeline_slug: string
}

export async function crearPadron(input: CrearPadronInput) {
  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }
  if (!input.slug.trim()) {
    return formatResult(false, 'El slug es obligatorio')
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('padrones')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      slug: input.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      tipo: input.tipo || null,
      pipeline_slug: (input.pipeline_slug && input.pipeline_slug !== '__none') ? input.pipeline_slug : null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return formatResult(false, 'Ya existe un padrón con ese slug.')
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/padrones')
  return formatResult(true, 'Padrón creado', data)
}

export interface EditarPadronInput {
  nombre: string
  tipo: string
  activo: boolean
}

export async function editarPadron(id: string, input: EditarPadronInput) {
  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('padrones')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo || null,
      activo: input.activo,
    })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/padrones')
  revalidatePath(`/admin/padrones/${id}`)
  return formatResult(true, 'Padrón actualizado')
}

export async function eliminarPadron(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('padrones')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/padrones')
  return formatResult(true, 'Padrón eliminado')
}

export async function toggleActivoPadron(id: string) {
  const supabase = await createClient()

  // Fetch current state
  const { data: current, error: fetchError } = await supabase
    .from('padrones')
    .select('activo')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (fetchError) return formatResult(false, fetchError.message)

  const { error } = await supabase
    .from('padrones')
    .update({ activo: !current.activo })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/padrones')
  revalidatePath(`/admin/padrones/${id}`)
  return formatResult(true, current.activo ? 'Padrón desactivado' : 'Padrón activado')
}

// --- MIEMBROS DE PADRON ---

export interface AgregarMiembroPadronInput {
  padron_id: string
  persona_id: string
  estado_padron_id?: string
  tipo_socio_id?: string
  numero_socio?: string
}

export async function agregarMiembroPadron(input: AgregarMiembroPadronInput) {
  if (!input.padron_id || !input.persona_id) {
    return formatResult(false, 'Padrón y persona son obligatorios')
  }

  const supabase = await createClient()

  // Check if already a member
  const { data: existing } = await supabase
    .from('personas_padrones')
    .select('id, activo')
    .eq('padron_id', input.padron_id)
    .eq('persona_id', input.persona_id)
    .maybeSingle()

  if (existing && existing.activo) {
    return formatResult(false, 'La persona ya es miembro activo de este padrón')
  }

  // If previously removed, reactivate
  if (existing && !existing.activo) {
    const { error } = await supabase
      .from('personas_padrones')
      .update({
        activo: true,
        estado_padron_id: input.estado_padron_id || null,
        tipo_socio_id: input.tipo_socio_id || null,
        numero_socio: input.numero_socio || null,
        fecha_alta: new Date().toISOString().split('T')[0],
      })
      .eq('id', existing.id)

    if (error) return formatResult(false, error.message)

    revalidatePath(`/admin/padrones/${input.padron_id}`)
    return formatResult(true, 'Miembro reactivado en el padrón')
  }

  const { error } = await supabase.from('personas_padrones').insert({
    tenant_id: TENANT_ID,
    padron_id: input.padron_id,
    persona_id: input.persona_id,
    estado_padron_id: input.estado_padron_id || null,
    tipo_socio_id: input.tipo_socio_id || null,
    numero_socio: input.numero_socio || null,
    fecha_alta: new Date().toISOString().split('T')[0],
  })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/padrones/${input.padron_id}`)
  return formatResult(true, 'Miembro agregado al padrón')
}

export async function quitarMiembroPadron(personaPadronId: string, padronId: string) {
  if (!personaPadronId) return formatResult(false, 'ID de membresía requerido')

  const supabase = await createClient()

  const { error } = await supabase
    .from('personas_padrones')
    .update({ activo: false })
    .eq('id', personaPadronId)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/padrones/${padronId}`)
  return formatResult(true, 'Miembro dado de baja del padrón')
}

export async function importarMiembrosPadron(
  padronId: string,
  rows: { persona_id: string; numero_socio?: string; estado_padron_id?: string; tipo_socio_id?: string }[]
) {
  const supabase = await createClient()

  let imported = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.persona_id) {
      errors.push({ row: i + 1, message: 'persona_id faltante' })
      continue
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from('personas_padrones')
      .select('id, activo')
      .eq('padron_id', padronId)
      .eq('persona_id', row.persona_id)
      .maybeSingle()

    if (existing && existing.activo) {
      skipped++
      continue
    }

    if (existing && !existing.activo) {
      const { error } = await supabase
        .from('personas_padrones')
        .update({
          activo: true,
          numero_socio: row.numero_socio || null,
          estado_padron_id: row.estado_padron_id || null,
          tipo_socio_id: row.tipo_socio_id || null,
          fecha_alta: new Date().toISOString().split('T')[0],
        })
        .eq('id', existing.id)

      if (error) {
        errors.push({ row: i + 1, message: error.message })
      } else {
        imported++
      }
      continue
    }

    const { error } = await supabase.from('personas_padrones').insert({
      tenant_id: TENANT_ID,
      padron_id: padronId,
      persona_id: row.persona_id,
      numero_socio: row.numero_socio || null,
      estado_padron_id: row.estado_padron_id || null,
      tipo_socio_id: row.tipo_socio_id || null,
      fecha_alta: new Date().toISOString().split('T')[0],
    })

    if (error) {
      errors.push({ row: i + 1, message: error.message })
    } else {
      imported++
    }
  }

  revalidatePath(`/admin/padrones/${padronId}`)
  return { imported, skipped, errors }
}

// --- BUSCAR PERSONAS ---

export async function buscarPersonas(query: string) {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .or(`nombre.ilike.%${query}%,apellido.ilike.%${query}%,numero_documento.ilike.%${query}%`)
    .limit(10)

  if (error) return []
  return data ?? []
}

export async function buscarPersonaPorDocumento(documento: string) {
  if (!documento || !documento.trim()) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento')
    .eq('tenant_id', TENANT_ID)
    .eq('numero_documento', documento.trim())
    .is('deleted_at', null)
    .limit(1)

  if (error) return []
  return data ?? []
}
