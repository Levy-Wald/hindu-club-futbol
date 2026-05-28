'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAllCapabilities } from '@/lib/permissions/capabilities'
import { TENANT_ID } from '@/lib/tenant'
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
  function num(val: number | undefined) { return val != null ? val : null }
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
  const auth = await requireAllCapabilities('personas.delete', 'personas.admin')
  if (!auth.ok) return formatResult(false, auth.error)

  const supabase = await createClient()

  // Verificar si tiene movimientos financieros
  const { count: movCount } = await supabase
    .from('movimientos_caja')
    .select('id', { count: 'exact', head: true })
    .eq('persona_id', id)

  if (movCount && movCount > 0) {
    return formatResult(false, 'No se puede eliminar: esta persona tiene movimientos de caja asociados. Podés desactivarla en su lugar.')
  }

  const { count: cuotasCount } = await supabase
    .from('cuotas_generadas')
    .select('id', { count: 'exact', head: true })
    .eq('persona_id', id)

  if (cuotasCount && cuotasCount > 0) {
    return formatResult(false, 'No se puede eliminar: esta persona tiene cuotas generadas. Podés desactivarla en su lugar.')
  }

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

export async function cambiarEstadoPersona(id: string, estado: string) {
  const estadosValidos = ['activo', 'inactivo', 'pausado', 'pendiente_revision']
  if (!estadosValidos.includes(estado)) {
    return formatResult(false, 'Estado no válido')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('personas')
    .update({ estado })
    .eq('id', id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/personas')
  revalidatePath(`/admin/personas/${id}`)
  return formatResult(true, `Estado cambiado a ${estado}`)
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

// --- BAJAS ---

export async function darDeBaja(input: {
  personaId: string
  motivo_baja_slug: string
  motivo_baja_detalle?: string
  fecha_baja: string
}) {
  const { personaId, motivo_baja_slug, motivo_baja_detalle, fecha_baja } = input

  if (!personaId || !motivo_baja_slug || !fecha_baja) {
    return formatResult(false, 'Faltan datos obligatorios')
  }

  const supabase = await createClient()

  // Actualizar persona
  const { error } = await supabase
    .from('personas')
    .update({
      estado: 'baja',
      motivo_baja_slug,
      motivo_baja_detalle: motivo_baja_detalle?.trim() || null,
      fecha_baja,
    })
    .eq('id', personaId)

  if (error) return formatResult(false, error.message)

  // Propagar a personas_padrones
  const { error: errorPadrones } = await supabase
    .from('personas_padrones')
    .update({
      activo: false,
      fecha_baja,
      motivo_baja_slug,
    })
    .eq('persona_id', personaId)
    .eq('activo', true)

  if (errorPadrones) {
    // No falla la operación principal, pero logueamos
    console.error('Error propagando baja a padrones:', errorPadrones.message)
  }

  revalidatePath(`/admin/personas/${personaId}`)
  revalidatePath('/admin/bajas')
  revalidatePath('/admin/personas')
  return formatResult(true, 'Persona dada de baja correctamente')
}

export async function reactivarPersona(personaId: string) {
  if (!personaId) return formatResult(false, 'ID de persona requerido')

  const supabase = await createClient()

  const { error } = await supabase
    .from('personas')
    .update({
      estado: 'activo',
      motivo_baja_slug: null,
      motivo_baja_detalle: null,
      fecha_baja: null,
    })
    .eq('id', personaId)

  if (error) return formatResult(false, error.message)

  revalidatePath(`/admin/personas/${personaId}`)
  revalidatePath('/admin/bajas')
  revalidatePath('/admin/personas')
  return formatResult(true, 'Persona reactivada correctamente')
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

// --- FUSIÓN DE PERSONAS ---

interface FusionFieldChoices {
  [field: string]: 'A' | 'B'  // A = master original, B = merged original
}

export async function obtenerDatosParaFusion(idA: string, idB: string) {
  // Use service role to bypass RLS — this is an admin-only operation
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: personaA, error: errA } = await serviceClient
    .from('personas')
    .select('*, personas_atributos!persona_id(*)')
    .eq('id', idA)
    .eq('tenant_id', TENANT_ID)
    .single()
  const { data: personaB, error: errB } = await serviceClient
    .from('personas')
    .select('*, personas_atributos!persona_id(*)')
    .eq('id', idB)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!personaA || !personaB) return { error: 'Una o ambas personas no existen' }

  return { personaA, personaB }
}

export async function fusionarPersonas(
  masterId: string,
  mergedId: string,
  fieldChoices: FusionFieldChoices
) {
  if (masterId === mergedId) return formatResult(false, 'No se puede fusionar una persona consigo misma')

  // Use service role throughout — fusion is an admin-only operation that needs
  // to bypass RLS for reading personas, reassigning FKs, and deleting
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar que ambas personas existen
  const { data: master } = await serviceClient.from('personas').select('*, personas_atributos!persona_id(*)').eq('id', masterId).eq('tenant_id', TENANT_ID).single()
  const { data: merged } = await serviceClient.from('personas').select('*, personas_atributos!persona_id(*)').eq('id', mergedId).eq('tenant_id', TENANT_ID).single()

  if (!master || !merged) return formatResult(false, 'Una o ambas personas no existen o ya fueron eliminadas')
  if (master.deleted_at || merged.deleted_at) return formatResult(false, 'No se puede fusionar personas eliminadas')

  // --- Auth transfer: si merged tiene user_id y master no, transferir ---
  if (merged.user_id && !master.user_id) {
    await serviceClient.from('personas').update({ user_id: merged.user_id }).eq('id', masterId)
  } else if (merged.user_id && master.user_id && merged.user_id !== master.user_id) {
    return formatResult(false, 'Ambas personas tienen login (auth.user) distinto. Eliminá manualmente uno de los usuarios de auth antes de fusionar.')
  }

  // --- Apply field choices to master ---
  // fieldChoices maps field_name → 'A' (keep master) or 'B' (take from merged)
  const updateFields: Record<string, unknown> = {}
  for (const [field, choice] of Object.entries(fieldChoices)) {
    if (choice === 'B') {
      updateFields[field] = (merged as Record<string, unknown>)[field]
    }
  }

  if (Object.keys(updateFields).length > 0) {
    const { error: updateErr } = await serviceClient.from('personas').update(updateFields).eq('id', masterId)
    if (updateErr) return formatResult(false, `Error actualizando master: ${updateErr.message}`)
  }

  // --- Discover all FK references to personas dynamically ---
  const { data: fkRefs, error: fkError } = await serviceClient.rpc('get_persona_fk_references')

  if (fkError || !fkRefs) {
    // Fallback: use hardcoded list if function doesn't exist yet
    return formatResult(false, `Error descubriendo FKs: ${fkError?.message}. Ejecutá la migración de la función get_persona_fk_references.`)
  }

  // --- Reassign FKs ---
  const errors: string[] = []
  for (const ref of fkRefs as { table_name: string; column_name: string }[]) {
    const { table_name, column_name } = ref

    // Skip audit_log — preserve history
    if (table_name === 'audit_log') continue
    // Skip personas itself — handled separately
    if (table_name === 'personas') continue

    // Handle tables with UNIQUE constraints that include persona_id
    // First check for conflicts: rows where masterId already exists
    const { data: masterRows } = await serviceClient
      .from(table_name)
      .select('id')
      .eq(column_name, masterId)

    const { data: mergedRows } = await serviceClient
      .from(table_name)
      .select('id')
      .eq(column_name, mergedId)

    if (!mergedRows || mergedRows.length === 0) continue

    // For personas_vinculos: after reassignment, check for self-references
    if (table_name === 'personas_vinculos') {
      for (const row of mergedRows) {
        // Try to reassign, if unique conflict → delete the duplicate
        const { error: updateErr } = await serviceClient
          .from(table_name)
          .update({ [column_name]: masterId })
          .eq('id', row.id)

        if (updateErr) {
          // Unique conflict or self-reference — delete the merged row
          await serviceClient.from(table_name).delete().eq('id', row.id)
        }
      }

      // Clean up self-references (persona_origen_id == persona_destino_id)
      await serviceClient
        .from('personas_vinculos')
        .delete()
        .eq('persona_origen_id', masterId)
        .eq('persona_destino_id', masterId)

      continue
    }

    // For tables with potential UNIQUE conflicts (personas_atributos, personas_padrones, etc.)
    // Strategy: try UPDATE, on conflict DELETE the merged row
    if (masterRows && masterRows.length > 0) {
      // Table has master rows — potential UNIQUE conflicts
      for (const row of mergedRows) {
        const { error: updateErr } = await serviceClient
          .from(table_name)
          .update({ [column_name]: masterId })
          .eq('id', row.id)

        if (updateErr) {
          // Unique constraint conflict — master already has this, delete merged's
          await serviceClient.from(table_name).delete().eq('id', row.id)
        }
      }
    } else {
      // No master rows — safe to bulk update
      const { error: bulkErr } = await serviceClient
        .from(table_name)
        .update({ [column_name]: masterId })
        .eq(column_name, mergedId)

      if (bulkErr) {
        errors.push(`${table_name}.${column_name}: ${bulkErr.message}`)
      }
    }
  }

  // --- Delete merged persona ---
  // First remove user_id to avoid auth conflicts
  await serviceClient.from('personas').update({ user_id: null }).eq('id', mergedId)
  const { error: deleteErr } = await serviceClient.from('personas').delete().eq('id', mergedId)
  if (deleteErr) {
    // If hard delete fails (e.g. remaining FKs), soft delete instead
    await serviceClient.from('personas').update({
      deleted_at: new Date().toISOString(),
      estado: 'baja',
      notas_internas: `Fusionada con ${masterId}`,
    }).eq('id', mergedId)
  }

  // --- Audit log ---
  await serviceClient.from('audit_log').insert({
    tenant_id: TENANT_ID,
    tabla: 'personas',
    registro_id: masterId,
    accion: 'persona_fused',
    actor_persona_id: null, // Will be set by trigger if available
    origen: 'web',
    descripcion: `Fusión: ${masterId} absorbe ${mergedId}`,
    cambios: {
      master_id: masterId,
      merged_id: mergedId,
      field_choices: fieldChoices,
      errors: errors.length > 0 ? errors : undefined,
    },
  })

  revalidatePath('/admin/personas')
  revalidatePath(`/admin/personas/${masterId}`)

  if (errors.length > 0) {
    return formatResult(true, `Fusión completada con ${errors.length} advertencia(s): ${errors.join('; ')}`)
  }

  return formatResult(true, 'Personas fusionadas correctamente')
}
