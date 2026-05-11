'use server'

import { createClient } from '@/lib/supabase/server'
import { obtenerPermisosSalud } from '@/lib/permisos/salud'
import { logAccesoSalud, type AccionSalud } from '@/lib/audit/salud-log'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

async function checkPermiso(permiso: keyof Awaited<ReturnType<typeof obtenerPermisosSalud>>) {
  const p = await obtenerPermisosSalud()
  if (p.nivel === 'denegado') throw new Error('Sin acceso')
  if (permiso !== 'nivel' && permiso !== 'user_id' && permiso !== 'persona_id' && !p[permiso]) {
    throw new Error('Sin permiso para esta sección')
  }
  return p
}

async function logYQuery(accion: AccionSalud, permisoKey: keyof Awaited<ReturnType<typeof obtenerPermisosSalud>>) {
  const p = await checkPermiso(permisoKey)
  await logAccesoSalud({
    accion,
    user_id: p.user_id!,
    persona_id: p.persona_id,
  })
  return p
}

// -------------------------------------------------------------------
// Tab: Lesiones
// -------------------------------------------------------------------

export async function fetchLesiones(filtros?: {
  equipo?: string
  estado?: string
  busqueda?: string
}) {
  const p = await logYQuery('salud.vista_lesiones', 'puede_ver_lesiones')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_lesiones')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('fecha_lesion', { ascending: false })
    .limit(200)

  if (filtros?.equipo) query = query.eq('equipo_id', filtros.equipo)
  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.busqueda) query = query.or(`nombre_completo.ilike.%${filtros.busqueda}%,tipo_lesion.ilike.%${filtros.busqueda}%`)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Tab: Datos Medicos
// -------------------------------------------------------------------

export async function fetchDatosMedicos(filtros?: {
  busqueda?: string
  grupo_sanguineo?: string
}) {
  const p = await logYQuery('salud.vista_datos_medicos', 'puede_ver_datos_medicos')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_datos_medicos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre_completo')
    .limit(200)

  if (filtros?.busqueda) query = query.ilike('nombre_completo', `%${filtros.busqueda}%`)
  if (filtros?.grupo_sanguineo) query = query.eq('grupo_sanguineo', filtros.grupo_sanguineo)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Tab: Obra Social
// -------------------------------------------------------------------

export async function fetchObraSocial(filtros?: {
  busqueda?: string
  obra_social?: string
}) {
  const p = await logYQuery('salud.vista_obra_social', 'puede_ver_obra_social')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_obra_social')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre_completo')
    .limit(200)

  if (filtros?.busqueda) query = query.ilike('nombre_completo', `%${filtros.busqueda}%`)
  if (filtros?.obra_social) query = query.eq('obra_social_slug', filtros.obra_social)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Tab: Autorizaciones
// -------------------------------------------------------------------

export async function fetchAutorizaciones(filtros?: {
  busqueda?: string
  estado?: string
}) {
  const p = await logYQuery('salud.vista_autorizaciones', 'puede_ver_autorizaciones')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_autorizaciones')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('fecha_vencimiento', { ascending: true })
    .limit(200)

  if (filtros?.busqueda) query = query.ilike('nombre_completo', `%${filtros.busqueda}%`)
  if (filtros?.estado) query = query.eq('estado', filtros.estado)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Tab: Contactos Emergencia
// -------------------------------------------------------------------

export async function fetchContactosEmergencia(filtros?: {
  busqueda?: string
}) {
  const p = await logYQuery('salud.vista_contactos', 'puede_ver_contactos')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_contactos_emergencia')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre_completo')
    .limit(200)

  if (filtros?.busqueda) query = query.ilike('nombre_completo', `%${filtros.busqueda}%`)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Tab: Vehiculos
// -------------------------------------------------------------------

export async function fetchVehiculos(filtros?: {
  busqueda?: string
}) {
  const p = await logYQuery('salud.vista_vehiculos', 'puede_ver_vehiculos')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_vehiculos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre_completo')
    .limit(200)

  if (filtros?.busqueda) query = query.ilike('nombre_completo', `%${filtros.busqueda}%`)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Tab: Alertas
// -------------------------------------------------------------------

export async function fetchAlertas(filtros?: {
  busqueda?: string
  tipo_alerta?: string
}) {
  const p = await logYQuery('salud.vista_alertas', 'puede_ver_lesiones')
  const supabase = await createClient()

  let query = supabase
    .from('v_salud_alertas_faltantes')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('nombre_completo')
    .limit(300)

  if (filtros?.busqueda) query = query.ilike('nombre_completo', `%${filtros.busqueda}%`)
  if (filtros?.tipo_alerta) query = query.eq('tipo_alerta', filtros.tipo_alerta)

  const { data, error } = await query
  if (error) return { ok: false, data: [], error: error.message }
  return { ok: true, data: data ?? [], nivel: p.nivel }
}

// -------------------------------------------------------------------
// Equipos (para filtros)
// -------------------------------------------------------------------

export async function fetchEquiposSalud() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select('id, nombre')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}

// -------------------------------------------------------------------
// Levantar caso de salud
// -------------------------------------------------------------------

export async function levantarCasoSalud(input: {
  persona_id: string
  tipo: string
  descripcion: string
  severidad: string
  fecha: string
}) {
  const p = await checkPermiso('puede_ver_lesiones')
  if (!p) throw new Error('Sin acceso')

  const supabase = await createClient()

  const { error } = await supabase
    .from('personas_lesiones')
    .insert({
      tenant_id: TENANT_ID,
      persona_id: input.persona_id,
      tipo_lesion: input.tipo,
      zona_cuerpo: 'no_especificada',
      gravedad: input.severidad,
      descripcion: input.descripcion,
      fecha_lesion: input.fecha,
      estado: 'activa',
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
