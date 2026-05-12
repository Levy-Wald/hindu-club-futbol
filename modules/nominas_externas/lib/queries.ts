import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { NominaConEvento, NominaItem, NominaPublicInfo } from './types'

// AP-001 ✓: nominas_externas tiene deleted_at
// AP-001 ✓: nomina_externa_items tiene deleted_at

export async function obtenerNominaPorToken(token: string): Promise<NominaConEvento | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('nominas_externas')
    .select(`
      *,
      evento:eventos!inner(titulo, fecha, hora_inicio),
      equipo_destino:equipos(nombre),
      entidad_destino:entidades(nombre)
    `)
    .eq('token', token)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  return {
    ...data,
    evento: Array.isArray(data.evento) ? data.evento[0] : data.evento,
    equipo_destino: Array.isArray(data.equipo_destino) ? data.equipo_destino[0] : data.equipo_destino,
    entidad_destino: Array.isArray(data.entidad_destino) ? data.entidad_destino[0] : data.entidad_destino,
  } as unknown as NominaConEvento
}

export async function obtenerInfoPublicaPorToken(token: string): Promise<NominaPublicInfo | null> {
  const nomina = await obtenerNominaPorToken(token)
  if (!nomina) return null
  if (nomina.estado !== 'pendiente') return null
  if (new Date(nomina.caduca_at) < new Date()) return null

  return {
    campos_solicitados: nomina.campos_solicitados,
    nivel_validacion: nomina.nivel_validacion,
    evento: nomina.evento,
    contexto: nomina.equipo_destino?.nombre ?? nomina.entidad_destino?.nombre ?? null,
    caduca_at: nomina.caduca_at,
  }
}

export async function listarNominasAdmin(tenant_id: string, filtro: 'pendientes' | 'todas' = 'pendientes') {
  const supabase = createServiceRoleClient()
  let query = supabase
    .from('nominas_externas')
    .select(`
      *,
      evento:eventos!inner(titulo, fecha, hora_inicio),
      equipo_destino:equipos(nombre),
      entidad_destino:entidades(nombre),
      items_pendientes:nomina_externa_items(count)
    `)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null) // AP-001 ✓
    .order('created_at', { ascending: false })

  if (filtro === 'pendientes') {
    query = query.eq('estado', 'pendiente')
  }

  const { data, error } = await query
  if (error) return []
  return (data ?? []).map((n: any) => ({
    ...n,
    evento: Array.isArray(n.evento) ? n.evento[0] : n.evento,
    equipo_destino: Array.isArray(n.equipo_destino) ? n.equipo_destino[0] : n.equipo_destino,
    entidad_destino: Array.isArray(n.entidad_destino) ? n.entidad_destino[0] : n.entidad_destino,
    items_pendientes_count: Array.isArray(n.items_pendientes) ? n.items_pendientes[0]?.count ?? 0 : 0,
  }))
}

export async function obtenerNominaConItems(nomina_id: string, tenant_id: string) {
  const supabase = createServiceRoleClient()

  const { data: nomina } = await supabase
    .from('nominas_externas')
    .select(`
      *,
      evento:eventos!inner(titulo, fecha, hora_inicio, tipo_evento_slug),
      equipo_destino:equipos(nombre),
      entidad_destino:entidades(nombre)
    `)
    .eq('id', nomina_id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null) // AP-001 ✓
    .maybeSingle()

  if (!nomina) return null

  const { data: items } = await supabase
    .from('nomina_externa_items')
    .select('*')
    .eq('nomina_externa_id', nomina_id)
    .is('deleted_at', null) // AP-001 ✓
    .order('created_at', { ascending: true })

  return {
    nomina: {
      ...nomina,
      evento: Array.isArray(nomina.evento) ? nomina.evento[0] : nomina.evento,
      equipo_destino: Array.isArray(nomina.equipo_destino) ? nomina.equipo_destino[0] : nomina.equipo_destino,
      entidad_destino: Array.isArray(nomina.entidad_destino) ? nomina.entidad_destino[0] : nomina.entidad_destino,
    },
    items: (items ?? []) as NominaItem[],
  }
}

export async function contarPendientes(tenant_id: string): Promise<number> {
  const supabase = createServiceRoleClient()
  const { count } = await supabase
    .from('nomina_externa_items')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
    .eq('procesada', false)
    .is('deleted_at', null) // AP-001 ✓

  return count ?? 0
}
