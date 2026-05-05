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
  const v = parsed.data

  function str(val: string | undefined) { return val?.trim() || null }
  function num(val: number | undefined) { return val || null }
  function bool(val: boolean | undefined) { return val ?? null }

  const clean = {
    // Identidad
    nombre: v.nombre.trim(),
    apellido: v.apellido.trim(),
    nombre_completo_legal: str(v.nombre_completo_legal),
    tipo_documento: v.tipo_documento,
    numero_documento: v.numero_documento.trim(),
    dni_pais_emision: str(v.dni_pais_emision),
    cuil_cuit: str(v.cuil_cuit),
    pasaporte_numero: str(v.pasaporte_numero),
    pasaporte_pais: str(v.pasaporte_pais),
    pasaporte_vigencia: str(v.pasaporte_vigencia) || null,
    fecha_nacimiento: str(v.fecha_nacimiento) || null,
    genero: str(v.genero),
    nacionalidad: str(v.nacionalidad),
    estado_civil: str(v.estado_civil),
    foto_perfil_url: str(v.foto_perfil_url),

    // Contacto
    email_principal: str(v.email_principal),
    email_secundario: str(v.email_secundario),
    telefono_principal: str(v.telefono_principal),
    telefono_secundario: str(v.telefono_secundario),
    whatsapp: str(v.whatsapp),
    whatsapp_emergencia: str(v.whatsapp_emergencia),

    // Dirección
    direccion_calle: str(v.direccion_calle),
    direccion_numero: str(v.direccion_numero),
    direccion_piso: str(v.direccion_piso),
    direccion_depto: str(v.direccion_depto),
    direccion_barrio: str(v.direccion_barrio),
    direccion_ciudad: str(v.direccion_ciudad),
    direccion_provincia: str(v.direccion_provincia),
    direccion_codigo_postal: str(v.direccion_codigo_postal),
    direccion_pais: str(v.direccion_pais),
    direccion_observaciones: str(v.direccion_observaciones),

    // Perfil deportivo
    lateralidad: str(v.lateralidad),
    pie_dominante: str(v.pie_dominante),
    mano_dominante: str(v.mano_dominante),
    tipo_pisada: str(v.tipo_pisada),
    altura_cm: num(v.altura_cm),
    peso_kg: num(v.peso_kg),
    fecha_medicion_fisica: str(v.fecha_medicion_fisica) || null,
    contextura: str(v.contextura),
    usa_lentes: bool(v.usa_lentes),
    tipo_lentes: str(v.tipo_lentes),
    usa_audifono: bool(v.usa_audifono),
    años_practica_deporte_principal: num(v.años_practica_deporte_principal),
    deporte_principal_slug: str(v.deporte_principal_slug),
    categoria_historica_max: str(v.categoria_historica_max),
    nivel_actividad_actual: str(v.nivel_actividad_actual),
    frecuencia_entrenamiento_semanal: num(v.frecuencia_entrenamiento_semanal),
    horas_entrenamiento_semanales: num(v.horas_entrenamiento_semanales),

    // Profesional/Educativo
    profesion_ocupacion: str(v.profesion_ocupacion),
    categoria_profesional: str(v.categoria_profesional),
    empresa_actual: str(v.empresa_actual),
    cargo_actual: str(v.cargo_actual),
    industria: str(v.industria),
    sitio_web_profesional: str(v.sitio_web_profesional),
    nivel_educativo_max: str(v.nivel_educativo_max),
    titulo_carrera: str(v.titulo_carrera),
    institucion_titulo: str(v.institucion_titulo),
    año_graduacion: num(v.año_graduacion),
    estudiando_actualmente: bool(v.estudiando_actualmente),
    institucion_actual: str(v.institucion_actual),
    año_grado_actual: str(v.año_grado_actual),
    idioma_nativo: str(v.idioma_nativo),

    // Membresía
    fecha_primera_relacion_club: str(v.fecha_primera_relacion_club) || null,
    es_socio_fundador: bool(v.es_socio_fundador),
    es_socio_vitalicio: bool(v.es_socio_vitalicio),
    es_socio_honorario: bool(v.es_socio_honorario),
    bautizo_club_realizado: bool(v.bautizo_club_realizado),

    // Sistema
    notas_internas: str(v.notas_internas),
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

// --- IMPORTAR CSV ---

export async function importarPersonas(rows: { nombre: string; apellido: string; numero_documento?: string; email_principal?: string; telefono_principal?: string; fecha_nacimiento?: string; genero?: string; cuil_cuit?: string; tipo_documento?: string; direccion_calle?: string; direccion_ciudad?: string; direccion_provincia?: string }[]) {
  const supabase = await createClient()

  let imported = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    // Validate required fields
    if (!row.nombre || !row.apellido) {
      errors.push({ row: i + 1, message: 'Faltan nombre o apellido' })
      continue
    }

    // Dedupe by numero_documento
    if (row.numero_documento) {
      const { data: existing } = await supabase
        .from('personas')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('numero_documento', row.numero_documento)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }
    }

    const { error } = await supabase.from('personas').insert({
      tenant_id: TENANT_ID,
      nombre: row.nombre,
      apellido: row.apellido,
      numero_documento: row.numero_documento || null,
      email_principal: row.email_principal || null,
      telefono_principal: row.telefono_principal || null,
      fecha_nacimiento: row.fecha_nacimiento || null,
      genero: row.genero || null,
      cuil_cuit: row.cuil_cuit || null,
      tipo_documento: row.tipo_documento || 'dni',
      direccion_calle: row.direccion_calle || null,
      direccion_ciudad: row.direccion_ciudad || null,
      direccion_provincia: row.direccion_provincia || null,
    })

    if (error) {
      errors.push({ row: i + 1, message: error.message })
    } else {
      imported++
    }
  }

  revalidatePath('/admin/personas')
  return { imported, skipped, errors }
}
