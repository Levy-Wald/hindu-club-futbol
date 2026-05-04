'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  crearPersonaSchema,
  editarPersonaSchema,
  asignarAtributoSchema,
  asignarVinculoSchema,
  asignarPadronSchema,
  type CrearPersonaInput,
  type EditarPersonaInput,
  type AsignarAtributoInput,
  type AsignarVinculoInput,
  type AsignarPadronInput,
} from './_lib/schemas'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

// --- PERSONAS ---

export async function crearPersona(input: CrearPersonaInput) {
  const parsed = crearPersonaSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  const values = parsed.data

  const clean = {
    tenant_id: TENANT_ID,
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    tipo_documento: values.tipo_documento,
    numero_documento: values.numero_documento.trim(),
    email_principal: values.email_principal?.trim() || null,
    telefono_principal: values.telefono_principal?.trim() || null,
    whatsapp: values.whatsapp?.trim() || null,
    fecha_nacimiento: values.fecha_nacimiento || null,
    genero: values.genero || null,
    nacionalidad: values.nacionalidad || null,
  }

  const { data, error } = await supabase
    .from('personas')
    .insert(clean)
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505' && error.message.includes('numero_documento')) {
      return formatResult(false, `Ya existe una persona con ese documento en este tenant.`)
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/personas')
  return formatResult(true, 'Persona creada', data)
}

export async function editarPersona(id: string, input: EditarPersonaInput) {
  const parsed = editarPersonaSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  const values = parsed.data

  const clean = {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    tipo_documento: values.tipo_documento,
    numero_documento: values.numero_documento.trim(),
    email_principal: values.email_principal?.trim() || null,
    telefono_principal: values.telefono_principal?.trim() || null,
    whatsapp: values.whatsapp?.trim() || null,
    fecha_nacimiento: values.fecha_nacimiento || null,
    genero: values.genero || null,
    nacionalidad: values.nacionalidad || null,
    profesion_ocupacion: values.profesion_ocupacion?.trim() || null,
    notas_internas: values.notas_internas?.trim() || null,
  }

  const { error } = await supabase
    .from('personas')
    .update(clean)
    .eq('id', id)

  if (error) {
    if (error.code === '23505' && error.message.includes('numero_documento')) {
      return formatResult(false, `Ya existe otra persona con ese documento.`)
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/personas')
  revalidatePath(`/admin/personas/${id}`)
  return formatResult(true, 'Persona actualizada')
}

export async function softDeletePersona(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas')
    .update({
      deleted_at: new Date().toISOString(),
      estado: 'baja',
      fecha_baja: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/personas')
  return formatResult(true, 'Persona eliminada')
}

export async function restaurarPersona(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas')
    .update({
      deleted_at: null,
      estado: 'activo',
      fecha_baja: null,
      motivo_baja_slug: null,
    })
    .eq('id', id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/personas')
  return formatResult(true, 'Persona restaurada')
}

// --- ATRIBUTOS ---

export async function asignarAtributo(input: AsignarAtributoInput) {
  const parsed = asignarAtributoSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  const values = parsed.data

  const { error } = await supabase
    .from('personas_atributos')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: values.persona_id,
      atributo_slug: values.atributo_slug,
      valor: values.valor ?? null,
      fecha_inicio: values.fecha_inicio || null,
      fecha_fin: values.fecha_fin || null,
    })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${values.persona_id}`)
  return formatResult(true, 'Atributo asignado')
}

export async function desactivarAtributo(atributoId: string, personaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas_atributos')
    .update({ activo: false })
    .eq('id', atributoId)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${personaId}`)
  return formatResult(true, 'Atributo desactivado')
}

export async function reactivarAtributo(atributoId: string, personaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas_atributos')
    .update({ activo: true })
    .eq('id', atributoId)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${personaId}`)
  return formatResult(true, 'Atributo reactivado')
}

// --- VÍNCULOS ---

export async function asignarVinculo(input: AsignarVinculoInput) {
  const parsed = asignarVinculoSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  const values = parsed.data

  const { error } = await supabase
    .from('personas_vinculos')
    .insert({
      tenant_id: TENANT_ID,
      persona_origen_id: values.persona_origen_id,
      persona_destino_id: values.persona_destino_id,
      tipo_vinculo_slug: values.tipo_vinculo_slug,
      notas: values.notas?.trim() || null,
    })

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${values.persona_origen_id}`)
  return formatResult(true, 'Vínculo creado')
}

export async function desactivarVinculo(vinculoId: string, personaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas_vinculos')
    .update({ activo: false })
    .eq('id', vinculoId)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${personaId}`)
  return formatResult(true, 'Vínculo desactivado')
}

// --- PADRONES ---

export async function asignarPadron(input: AsignarPadronInput) {
  const parsed = asignarPadronSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }

  const supabase = await createClient()
  const values = parsed.data

  const { error } = await supabase
    .from('personas_padrones')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: values.persona_id,
      padron_id: values.padron_id,
      estado_padron_id: values.estado_padron_id,
      tipo_socio_id: values.tipo_socio_id || null,
      numero_socio: values.numero_socio?.trim() || null,
    })

  if (error) {
    if (error.code === '23505') {
      return formatResult(false, 'Esta persona ya está en ese padrón.')
    }
    return formatResult(false, error.message)
  }

  revalidatePath(`/admin/personas/${values.persona_id}`)
  return formatResult(true, 'Persona asignada al padrón')
}

export async function quitarDePadron(personaPadronId: string, personaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas_padrones')
    .update({ activo: false, fecha_baja: new Date().toISOString().split('T')[0] })
    .eq('id', personaPadronId)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${personaId}`)
  return formatResult(true, 'Persona dada de baja del padrón')
}
