import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

export interface FetchEquiposParams {
  search?: string
  disciplina?: string
  activo?: string
}

export async function fetchEquipos(params: FetchEquiposParams = {}) {
  const supabase = await createClient()

  let query = supabase
    .from('equipos')
    .select(
      `id, nombre, disciplina_slug, modalidad, activo, color_principal, created_at,
       categorias_equipo!categoria_id(id, nombre_display, disciplina_slug),
       personas_equipos(count)`
    )
    .eq('tenant_id', TENANT_ID)
    .order('nombre', { ascending: true })

  if (params.search) {
    query = query.ilike('nombre', `%${params.search}%`)
  }
  if (params.disciplina) {
    query = query.eq('disciplina_slug', params.disciplina)
  }
  if (params.activo === 'activo') {
    query = query.eq('activo', true)
  } else if (params.activo === 'inactivo') {
    query = query.eq('activo', false)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    disciplina_slug: e.disciplina_slug,
    modalidad: e.modalidad,
    activo: e.activo,
    color_principal: e.color_principal,
    created_at: e.created_at,
    categoria_nombre: (e.categorias_equipo as unknown as { nombre_display: string } | null)?.nombre_display ?? '—',
    miembros_count: ((e.personas_equipos as { count: number }[])?.[0]?.count) ?? 0,
  }))
}

export async function fetchEquipoDetalle(id: string) {
  const supabase = await createClient()

  const { data: equipo, error } = await supabase
    .from('equipos')
    .select(
      `id, nombre, disciplina_slug, modalidad, activo, color_principal, color_secundario, categoria_id, escudo_url, foto_url, foto_equipo_url, indumentaria, torneo, entidad_id, created_at, updated_at, metadata,
       categorias_equipo!categoria_id(id, nombre_display, disciplina_slug, modalidad, tipo_categoria, valor, edad_min, edad_max),
       entidad:entidades!entidad_id(id, nombre, tipo, logo_url)`
    )
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) throw error

  const { data: miembros } = await supabase
    .from('personas_equipos')
    .select(
      `id, persona_id, rol_equipo_slug, dorsal, posicion, fecha_inicio, fecha_fin, activo, notas,
       personas!persona_id(id, nombre, apellido, numero_documento, email_principal, telefono_principal, whatsapp, foto_perfil_url)`
    )
    .eq('equipo_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('rol_equipo_slug', { ascending: true })

  const { data: horarios } = await supabase
    .from('equipos_horarios')
    .select('id, dia_semana, hora_inicio, hora_fin, tipo_actividad, activo, sede_id, cancha_id, metadata, fecha, titulo, hora_citacion, descripcion')
    .eq('equipo_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('fecha', { ascending: true, nullsFirst: false })
    .order('dia_semana', { ascending: true })

  return {
    ...equipo,
    categoria: equipo.categorias_equipo as unknown as { nombre_display: string; disciplina_slug: string; modalidad: string | null } | null,
    miembros: miembros ?? [],
    horarios: horarios ?? [],
  }
}

export async function fetchCategoriasEquipo() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categorias_equipo')
    .select('id, nombre_display, disciplina_slug, modalidad, tipo_categoria, valor, edad_min, edad_max, activa')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .order('orden', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchEntidadesFederaciones() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre, tipo')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('tipo', ['federacion', 'liga', 'asociacion'])
    .order('nombre', { ascending: true })

  if (error) throw error
  return data ?? []
}

export interface CapitanInfo {
  persona_id: string
  nombre: string
  apellido: string
  whatsapp: string | null
  email_principal: string | null
  foto_perfil_url: string | null
  rol_equipo_slug: string
}

export interface EquipoConCapitanes {
  id: string
  nombre: string
  disciplina_slug: string
  color_principal: string | null
  escudo_url: string | null
  capitanes: CapitanInfo[]
}

export async function fetchCapitanesPorEquipo(): Promise<EquipoConCapitanes[]> {
  const supabase = await createClient()

  // Traer todos los equipos activos
  const { data: equipos, error: eqError } = await supabase
    .from('equipos')
    .select('id, nombre, disciplina_slug, color_principal, escudo_url')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (eqError) throw eqError

  // Traer capitanes y subcapitanes activos
  const { data: capitanes, error: capError } = await supabase
    .from('personas_equipos')
    .select(
      `equipo_id, rol_equipo_slug, persona_id,
       personas!persona_id(id, nombre, apellido, whatsapp, email_principal, foto_perfil_url)`
    )
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .in('rol_equipo_slug', ['capitan', 'subcapitan'])

  if (capError) throw capError

  // Agrupar capitanes por equipo
  const capsByEquipo = new Map<string, CapitanInfo[]>()
  for (const c of capitanes ?? []) {
    const p = c.personas as unknown as {
      id: string
      nombre: string
      apellido: string
      whatsapp: string | null
      email_principal: string | null
      foto_perfil_url: string | null
    } | null
    if (!p) continue

    const list = capsByEquipo.get(c.equipo_id) ?? []
    list.push({
      persona_id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      whatsapp: p.whatsapp,
      email_principal: p.email_principal,
      foto_perfil_url: p.foto_perfil_url,
      rol_equipo_slug: c.rol_equipo_slug,
    })
    capsByEquipo.set(c.equipo_id, list)
  }

  return (equipos ?? []).map((eq) => ({
    id: eq.id,
    nombre: eq.nombre,
    disciplina_slug: eq.disciplina_slug,
    color_principal: eq.color_principal,
    escudo_url: eq.escudo_url,
    capitanes: capsByEquipo.get(eq.id) ?? [],
  }))
}

export async function fetchSedes() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sedes')
    .select('id, nombre, direccion')
    .eq('tenant_id', TENANT_ID)
    .order('nombre')
  return data ?? []
}

export async function fetchCanchas(sedeId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('canchas')
    .select('id, nombre, sede_id')
    .eq('tenant_id', TENANT_ID)
    .order('nombre')
  if (sedeId) query = query.eq('sede_id', sedeId)
  const { data } = await query
  return data ?? []
}

export async function fetchRolesEquipo() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('catalogo_roles_equipo')
    .select('slug, nombre, categoria')
    .order('categoria', { ascending: true })

  if (error) throw error
  return data ?? []
}
