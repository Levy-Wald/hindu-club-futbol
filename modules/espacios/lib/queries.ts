'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { EspacioConSede, TipoEspacio } from './tipos'

export async function listarEspacios(
  tenant_id: string,
  filtros?: { sede_id?: string; tipo_slug?: string; activo?: boolean }
): Promise<EspacioConSede[]> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('espacios')
    .select('*')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .order('nombre')

  if (filtros?.sede_id) query = query.eq('sede_id', filtros.sede_id)
  if (filtros?.tipo_slug) query = query.eq('tipo_slug', filtros.tipo_slug)
  if (filtros?.activo !== undefined) query = query.eq('activo', filtros.activo)

  const { data: espacios } = await query
  if (!espacios || espacios.length === 0) return []

  const sedeIds = [...new Set(espacios.map(e => e.sede_id))]
  const { data: sedes } = await supabase
    .from('sedes')
    .select('id, nombre')
    .in('id', sedeIds)

  const sedesMap = (sedes ?? []).reduce((acc, s) => {
    acc[s.id] = s.nombre
    return acc
  }, {} as Record<string, string>)

  return espacios.map(e => ({
    ...e,
    capacidad_personas: e.capacidad_personas ? Number(e.capacidad_personas) : null,
    dimensiones_m2: e.dimensiones_m2 ? Number(e.dimensiones_m2) : null,
    sede_nombre: sedesMap[e.sede_id] ?? '',
  })) as EspacioConSede[]
}

export async function espacioPorId(
  tenant_id: string,
  id: string
): Promise<EspacioConSede | null> {
  const supabase = createServiceRoleClient()

  const { data: espacio } = await supabase
    .from('espacios')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!espacio) return null

  const { data: sede } = await supabase
    .from('sedes')
    .select('nombre')
    .eq('id', espacio.sede_id)
    .single()

  return {
    ...espacio,
    capacidad_personas: espacio.capacidad_personas ? Number(espacio.capacidad_personas) : null,
    dimensiones_m2: espacio.dimensiones_m2 ? Number(espacio.dimensiones_m2) : null,
    sede_nombre: sede?.nombre ?? '',
  } as EspacioConSede
}

export async function espaciosPorSede(
  tenant_id: string,
  sede_id: string,
  tipoFilter?: string
): Promise<EspacioConSede[]> {
  return listarEspacios(tenant_id, {
    sede_id,
    tipo_slug: tipoFilter,
    activo: true,
  })
}

export async function listarTiposEspacio(): Promise<TipoEspacio[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('catalogo_tipos_espacio')
    .select('*')
    .eq('activo', true)
    .order('orden')
  return (data ?? []) as TipoEspacio[]
}
