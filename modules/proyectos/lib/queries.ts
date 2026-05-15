import { createClient } from '@/lib/supabase/server'
import type { ProyectoConRelaciones, TareaConRelaciones, Miembro, Comentario, EstadoTareaCatalogo } from './tipos'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchEstadosTarea(): Promise<EstadoTareaCatalogo[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('catalogo_estados_tarea')
    .select('*')
    .eq('activo', true)
    .order('orden')
  return (data ?? []) as EstadoTareaCatalogo[]
}

export async function fetchProyectos(filtros?: {
  estado?: string
  responsableId?: string
  busqueda?: string
}): Promise<ProyectoConRelaciones[]> {
  const supabase = await createClient()
  let query = supabase
    .from('proyectos')
    .select(`
      *,
      responsable:personas!proyectos_responsable_persona_id_fkey(id, nombre, apellido),
      cliente_persona:personas!proyectos_cliente_persona_id_fkey(id, nombre, apellido),
      cliente_entidad:entidades!proyectos_cliente_entidad_id_fkey(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filtros?.estado) {
    query = query.eq('estado', filtros.estado)
  }
  if (filtros?.responsableId) {
    query = query.eq('responsable_persona_id', filtros.responsableId)
  }
  if (filtros?.busqueda) {
    query = query.ilike('nombre', `%${filtros.busqueda}%`)
  }

  const { data } = await query

  if (!data) return []

  // Fetch task counts per project
  const ids = data.map((p: Record<string, unknown>) => p.id as string)
  if (ids.length === 0) return []

  const { data: taskCounts } = await supabase
    .from('proyecto_tareas')
    .select('proyecto_id, estado_slug')
    .in('proyecto_id', ids)
    .is('deleted_at', null)

  const countMap = new Map<string, { total: number; completadas: number }>()
  for (const t of taskCounts ?? []) {
    const rec = t as { proyecto_id: string; estado_slug: string }
    const curr = countMap.get(rec.proyecto_id) ?? { total: 0, completadas: 0 }
    curr.total++
    if (rec.estado_slug === 'hecho') curr.completadas++
    countMap.set(rec.proyecto_id, curr)
  }

  return data.map((p: Record<string, unknown>) => {
    const counts = countMap.get(p.id as string) ?? { total: 0, completadas: 0 }
    const resp = p.responsable as unknown
    const cp = p.cliente_persona as unknown
    const ce = p.cliente_entidad as unknown
    return {
      ...p,
      responsable: Array.isArray(resp) ? resp[0] ?? null : resp ?? null,
      cliente_persona: Array.isArray(cp) ? cp[0] ?? null : cp ?? null,
      cliente_entidad: Array.isArray(ce) ? ce[0] ?? null : ce ?? null,
      total_tareas: counts.total,
      tareas_completadas: counts.completadas,
    } as ProyectoConRelaciones
  })
}

export async function fetchProyecto(id: string): Promise<ProyectoConRelaciones | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proyectos')
    .select(`
      *,
      responsable:personas!proyectos_responsable_persona_id_fkey(id, nombre, apellido),
      cliente_persona:personas!proyectos_cliente_persona_id_fkey(id, nombre, apellido),
      cliente_entidad:entidades!proyectos_cliente_entidad_id_fkey(id, nombre)
    `)
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .maybeSingle()

  if (!data) return null

  // Get budget consumed
  const { data: presupuesto } = await supabase.rpc('fn_presupuesto_consumido', { p_proyecto_id: id })

  // Get task counts
  const { data: tareas } = await supabase
    .from('proyecto_tareas')
    .select('estado_slug')
    .eq('proyecto_id', id)
    .is('deleted_at', null)

  const total = tareas?.length ?? 0
  const completadas = tareas?.filter((t: Record<string, unknown>) => t.estado_slug === 'hecho').length ?? 0

  const resp = data.responsable as unknown
  const cp = data.cliente_persona as unknown
  const ce = data.cliente_entidad as unknown

  return {
    ...data,
    responsable: Array.isArray(resp) ? resp[0] ?? null : resp ?? null,
    cliente_persona: Array.isArray(cp) ? cp[0] ?? null : cp ?? null,
    cliente_entidad: Array.isArray(ce) ? ce[0] ?? null : ce ?? null,
    presupuesto_consumido: (presupuesto as number) ?? 0,
    total_tareas: total,
    tareas_completadas: completadas,
  } as ProyectoConRelaciones
}

export async function fetchTareasProyecto(proyectoId: string): Promise<TareaConRelaciones[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proyecto_tareas')
    .select(`
      *,
      asignado:personas!proyecto_tareas_asignado_persona_id_fkey(id, nombre, apellido)
    `)
    .eq('proyecto_id', proyectoId)
    .is('deleted_at', null)
    .order('posicion_kanban')

  if (!data) return []

  return data.map((t: Record<string, unknown>) => {
    const asig = t.asignado as unknown
    return {
      ...t,
      asignado: Array.isArray(asig) ? asig[0] ?? null : asig ?? null,
    } as TareaConRelaciones
  })
}

export async function fetchMiembrosProyecto(proyectoId: string): Promise<Miembro[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proyecto_miembros')
    .select(`
      *,
      persona:personas(id, nombre, apellido, email_principal)
    `)
    .eq('proyecto_id', proyectoId)
    .order('fecha_agregado')

  if (!data) return []

  return data.map((m: Record<string, unknown>) => {
    const p = m.persona as unknown
    return {
      ...m,
      persona: Array.isArray(p) ? p[0] ?? null : p ?? null,
    } as Miembro
  })
}

export async function fetchComentarios(proyectoId: string, tareaId?: string): Promise<Comentario[]> {
  const supabase = await createClient()
  let query = supabase
    .from('proyecto_comentarios')
    .select(`
      *,
      persona:personas(id, nombre, apellido)
    `)
    .eq('proyecto_id', proyectoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (tareaId) {
    query = query.eq('tarea_id', tareaId)
  } else {
    query = query.is('tarea_id', null)
  }

  const { data } = await query

  if (!data) return []

  return data.map((c: Record<string, unknown>) => {
    const p = c.persona as unknown
    return {
      ...c,
      persona: Array.isArray(p) ? p[0] ?? null : p ?? null,
    } as Comentario
  })
}

export async function fetchProyectosDePersona(personaId: string): Promise<ProyectoConRelaciones[]> {
  const supabase = await createClient()

  // Projects where persona is member or responsible
  const { data: miembro } = await supabase
    .from('proyecto_miembros')
    .select('proyecto_id')
    .eq('persona_id', personaId)

  const { data: responsable } = await supabase
    .from('proyectos')
    .select('id')
    .eq('responsable_persona_id', personaId)
    .is('deleted_at', null)

  const ids = new Set<string>()
  for (const m of miembro ?? []) ids.add((m as { proyecto_id: string }).proyecto_id)
  for (const r of responsable ?? []) ids.add((r as { id: string }).id)

  if (ids.size === 0) return []

  const { data } = await supabase
    .from('proyectos')
    .select('*')
    .in('id', [...ids])
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (data ?? []) as ProyectoConRelaciones[]
}

export async function fetchPersonasBusqueda(busqueda: string): Promise<{ id: string; nombre: string; apellido: string; email_principal: string | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('personas')
    .select('id, nombre, apellido, email_principal')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%`)
    .limit(20)

  return (data ?? []) as { id: string; nombre: string; apellido: string; email_principal: string | null }[]
}

export async function fetchCalendarTareas(proyectoId: string): Promise<TareaConRelaciones[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proyecto_tareas')
    .select(`
      *,
      asignado:personas!proyecto_tareas_asignado_persona_id_fkey(id, nombre, apellido)
    `)
    .eq('proyecto_id', proyectoId)
    .is('deleted_at', null)
    .not('fecha_limite', 'is', null)
    .order('fecha_limite')

  if (!data) return []

  return data.map((t: Record<string, unknown>) => {
    const asig = t.asignado as unknown
    return {
      ...t,
      asignado: Array.isArray(asig) ? asig[0] ?? null : asig ?? null,
    } as TareaConRelaciones
  })
}
