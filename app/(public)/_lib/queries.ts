import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchConfigPublica() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_config_publica')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .single()
  return data
}

export async function fetchEquiposPublicos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select(`
      id, nombre, disciplina_slug, modalidad, color_principal, escudo_url, foto_equipo_url, torneo,
      categoria:categorias_equipo!categoria_id(id, nombre_display, edad_min, edad_max)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}

export async function fetchEquipoPublico(id: string) {
  const supabase = await createClient()
  const { data: equipo } = await supabase
    .from('equipos')
    .select(`
      id, nombre, disciplina_slug, modalidad, color_principal, color_secundario,
      escudo_url, foto_equipo_url, torneo, indumentaria,
      categoria:categorias_equipo!categoria_id(id, nombre_display, edad_min, edad_max),
      entidad:entidades!entidad_id(id, nombre, logo_url, tipo)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .single()

  if (!equipo) return null

  // Plantel publico (solo nombre + apellido completo)
  const { data: miembros } = await supabase
    .from('personas_equipos')
    .select(`
      id, rol_equipo_slug, dorsal, posicion,
      persona:personas!persona_id(id, nombre, apellido, foto_perfil_url)
    `)
    .eq('equipo_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('rol_equipo_slug')

  // Proximos eventos
  const hoy = new Date().toISOString().split('T')[0]
  const { data: eventos } = await supabase
    .from('equipos_horarios')
    .select('id, fecha, dia_semana, hora_inicio, hora_fin, tipo_actividad, titulo, sede_id')
    .eq('equipo_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .gte('fecha', hoy)
    .order('fecha')
    .limit(10)

  return { ...equipo, miembros: miembros ?? [], eventos: eventos ?? [] }
}

export async function fetchCapitanesPublicos() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('personas_equipos')
    .select(`
      equipo_id, rol_equipo_slug,
      persona:personas!persona_id(id, nombre, apellido, foto_perfil_url),
      equipo:equipos!equipo_id(id, nombre, color_principal, escudo_url,
        categoria:categorias_equipo!categoria_id(nombre_display, edad_min, edad_max)
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('rol_equipo_slug', ['capitan', 'subcapitan'])

  return data ?? []
}

export async function fetchStaffPublico() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('personas_equipos')
    .select(`
      equipo_id, rol_equipo_slug,
      persona:personas!persona_id(id, nombre, apellido, foto_perfil_url),
      equipo:equipos!equipo_id(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('rol_equipo_slug', ['dt', 'ayudante_campo', 'preparador_fisico', 'kinesiologo', 'delegado', 'coordinador', 'director_deportivo'])

  return data ?? []
}

export async function fetchFederacionesPublicas() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('entidades')
    .select('id, nombre, tipo, logo_url, web_url')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('tipo', ['federacion', 'liga', 'asociacion'])
    .order('nombre')
  return data ?? []
}

export async function fetchCategoriasPublicas() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categorias_equipo')
    .select('id, nombre_display, edad_min, edad_max, disciplina_slug')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .order('orden')
  return data ?? []
}

export async function fetchProximosEventos() {
  const supabase = await createClient()
  const hoy = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('equipos_horarios')
    .select(`
      id, fecha, hora_inicio, hora_fin, tipo_actividad, titulo,
      equipo:equipos!equipo_id(id, nombre, escudo_url, color_principal,
        categoria:categorias_equipo!categoria_id(nombre_display)
      )
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .gte('fecha', hoy)
    .order('fecha')
    .limit(6)
  return data ?? []
}
