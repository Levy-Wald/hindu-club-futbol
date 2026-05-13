'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { canAdministrarTorneos } from './permisos'
import type { TipoTorneo, FormatoTorneo, EstadoTorneo } from './types'

async function getPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàäâã]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöôõ]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function crearTorneoAction(input: {
  nombre: string
  descripcion?: string
  tipo: TipoTorneo
  formato: FormatoTorneo
  federacion_id?: string
  temporada?: string
  fecha_inicio?: string
  fecha_fin?: string
  nivel_competencia_slug?: string
  criterios_desempate?: string[]
}): Promise<{ ok: true; torneo_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso para administrar torneos' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const baseSlug = slugify(input.nombre)
  let slug = baseSlug
  // Ensure unique slug
  const { data: existing } = await supabase
    .from('torneos')
    .select('slug')
    .eq('tenant_id', tenant_id)
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    slug = `${baseSlug}-${Date.now().toString(36)}`
  }

  const { data: torneo, error } = await supabase
    .from('torneos')
    .insert({
      tenant_id,
      slug,
      nombre: input.nombre.trim(),
      descripcion: input.descripcion?.trim() || null,
      tipo: input.tipo,
      formato: input.formato,
      federacion_id: input.federacion_id || null,
      temporada: input.temporada?.trim() || null,
      fecha_inicio: input.fecha_inicio || null,
      fecha_fin: input.fecha_fin || null,
      estado: 'planificado' as EstadoTorneo,
      nivel_competencia_slug: input.nivel_competencia_slug || null,
      criterios_desempate: input.criterios_desempate ?? [
        'puntos',
        'diferencia_goles',
        'goles_a_favor',
        'enfrentamiento_directo',
      ],
    })
    .select('id')
    .single()

  if (error || !torneo) return { ok: false, error: error?.message ?? 'Error creando torneo' }
  return { ok: true, torneo_id: torneo.id }
}

export async function actualizarTorneoAction(input: {
  torneo_id: string
  nombre?: string
  descripcion?: string
  tipo?: TipoTorneo
  formato?: FormatoTorneo
  federacion_id?: string | null
  temporada?: string
  fecha_inicio?: string | null
  fecha_fin?: string | null
  estado?: EstadoTorneo
  nivel_competencia_slug?: string | null
  criterios_desempate?: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const updateData: Record<string, unknown> = {}
  if (input.nombre !== undefined) updateData.nombre = input.nombre.trim()
  if (input.descripcion !== undefined) updateData.descripcion = input.descripcion?.trim() || null
  if (input.tipo !== undefined) updateData.tipo = input.tipo
  if (input.formato !== undefined) updateData.formato = input.formato
  if (input.federacion_id !== undefined) updateData.federacion_id = input.federacion_id
  if (input.temporada !== undefined) updateData.temporada = input.temporada?.trim() || null
  if (input.fecha_inicio !== undefined) updateData.fecha_inicio = input.fecha_inicio
  if (input.fecha_fin !== undefined) updateData.fecha_fin = input.fecha_fin
  if (input.estado !== undefined) updateData.estado = input.estado
  if (input.nivel_competencia_slug !== undefined) updateData.nivel_competencia_slug = input.nivel_competencia_slug
  if (input.criterios_desempate !== undefined) updateData.criterios_desempate = input.criterios_desempate

  if (Object.keys(updateData).length === 0) return { ok: true }

  const { error } = await supabase
    .from('torneos')
    .update(updateData)
    .eq('id', input.torneo_id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function agregarCategoriaAction(input: {
  torneo_id: string
  nombre: string
  num_equipos_max?: number
}): Promise<{ ok: true; categoria_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const slug = slugify(input.nombre)

  // Get next orden
  const { data: existing } = await supabase
    .from('torneo_categorias')
    .select('orden')
    .eq('torneo_id', input.torneo_id)
    .order('orden', { ascending: false })
    .limit(1)

  const nextOrden = existing && existing.length > 0 ? existing[0].orden + 1 : 1

  const { data: cat, error } = await supabase
    .from('torneo_categorias')
    .insert({
      tenant_id,
      torneo_id: input.torneo_id,
      slug,
      nombre: input.nombre.trim(),
      orden: nextOrden,
      num_equipos_max: input.num_equipos_max ?? null,
    })
    .select('id')
    .single()

  if (error || !cat) return { ok: false, error: error?.message ?? 'Error creando categoria' }
  return { ok: true, categoria_id: cat.id }
}

export async function agregarEquipoAction(input: {
  torneo_id: string
  categoria_id?: string
  equipo_id?: string
  equipo_externo_nombre?: string
  equipo_externo_entidad_id?: string
}): Promise<{ ok: true; equipo_inscripto_id: string } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  if (!input.equipo_id && !input.equipo_externo_nombre) {
    return { ok: false, error: 'Debe indicar equipo propio o nombre externo' }
  }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { data: eq, error } = await supabase
    .from('torneo_equipos')
    .insert({
      tenant_id,
      torneo_id: input.torneo_id,
      categoria_id: input.categoria_id || null,
      equipo_id: input.equipo_id || null,
      equipo_externo_nombre: input.equipo_id ? null : (input.equipo_externo_nombre?.trim() ?? null),
      equipo_externo_entidad_id: input.equipo_id ? null : (input.equipo_externo_entidad_id || null),
    })
    .select('id')
    .single()

  if (error || !eq) return { ok: false, error: error?.message ?? 'Error inscribiendo equipo' }
  return { ok: true, equipo_inscripto_id: eq.id }
}

export async function quitarEquipoAction(input: {
  equipo_inscripto_id: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdministrarTorneos(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('torneo_equipos')
    .update({ activo: false })
    .eq('id', input.equipo_inscripto_id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
