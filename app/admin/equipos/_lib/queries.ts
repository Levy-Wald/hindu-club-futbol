import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchEquipos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('equipos')
    .select(
      `id, nombre, disciplina_slug, modalidad, activo, color_principal, created_at,
       categorias_equipo!categoria_id(id, nombre_display, disciplina_slug),
       personas_equipos(count)`
    )
    .eq('tenant_id', TENANT_ID)
    .order('nombre', { ascending: true })

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
      `id, nombre, disciplina_slug, modalidad, activo, created_at, updated_at, metadata,
       categorias_equipo!categoria_id(id, nombre_display, disciplina_slug, modalidad, tipo_categoria, valor)`
    )
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) throw error

  const { data: miembros } = await supabase
    .from('personas_equipos')
    .select(
      `id, persona_id, rol_equipo_slug, dorsal, posicion, fecha_inicio, fecha_fin, activo, notas,
       personas!persona_id(id, nombre, apellido, numero_documento, email_principal)`
    )
    .eq('equipo_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('rol_equipo_slug', { ascending: true })

  const { data: horarios } = await supabase
    .from('equipos_horarios')
    .select('id, dia_semana, hora_inicio, hora_fin, tipo_actividad, activo')
    .eq('equipo_id', id)
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
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
    .select('id, nombre_display, disciplina_slug, modalidad, tipo_categoria, valor, activa')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .order('orden', { ascending: true })

  if (error) throw error
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
