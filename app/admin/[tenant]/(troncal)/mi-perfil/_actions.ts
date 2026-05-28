'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { editarPersonaSchema } from '../personas/_lib/schemas'


function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

export async function editarMiPerfil(datos: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!persona) return formatResult(false, 'Persona no encontrada')

  // Validate and clean data the same way as editarPersona
  const parsed = editarPersonaSchema.safeParse(datos)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }

  const v = parsed.data

  function str(val: string | undefined) { return val?.trim() || null }
  function num(val: number | undefined) { return val != null ? val : null }
  function bool(val: boolean | undefined) { return val ?? null }

  const clean: Record<string, unknown> = {
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
    .eq('id', persona.id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/mi-perfil')
  return formatResult(true, 'Perfil actualizado')
}

export async function solicitarCambioDatos(campo: string, valorActual: string, valorNuevo: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return formatResult(false, 'No autenticado')

  const { data: persona } = await supabase
    .from('personas')
    .select('id')
    .eq('user_id', user.id)
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
