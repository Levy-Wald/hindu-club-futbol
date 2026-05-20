'use server'

import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export interface SocioActivo {
  suscripcion_id: string
  tenant_id: string
  persona_id: string
  persona_nombre: string
  email: string | null
  plan_id: string
  plan_nombre: string | null
  plan_monto: number | null
  plan_moneda: string | null
  periodicidad: string | null
  tipo: string
  disciplina_slug: string | null
  equipo_id: string | null
  equipo_nombre: string | null
  fecha_alta: string
  monto_pactado: number | null
  origen: string | null
  ultima_cuota_estado: string | null
}

export interface ResumenMembresia {
  tenant_id: string
  tipo: string
  disciplina_slug: string | null
  activos: number
  dados_baja: number
  suspendidos: number
  ingreso_mensual_estimado: number | null
}

export async function fetchSociosActivos(filters?: {
  tipo?: string
  equipo_id?: string
  disciplina_slug?: string
}) {
  const supabase = await createClient()

  let query = (supabase as any)
    .from('v_socios_activos')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('persona_nombre')

  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.equipo_id) query = query.eq('equipo_id', filters.equipo_id)
  if (filters?.disciplina_slug) query = query.eq('disciplina_slug', filters.disciplina_slug)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as SocioActivo[]
}

export async function fetchResumenMembresias() {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('v_resumen_membresias')
    .select('*')
    .eq('tenant_id', TENANT_ID)

  if (error) return []
  return (data ?? []) as ResumenMembresia[]
}

export async function fetchMembresiasCompletas(filters?: {
  tipo?: string
  estado?: string
  equipo_id?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('suscripciones')
    .select(`
      *,
      persona:personas(id, nombre, apellido, numero_documento, email_principal),
      plan:cuotas_planes(id, nombre, monto, periodicidad, moneda),
      equipo:equipos(id, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.tipo) query = query.eq('tipo', filters.tipo)
  if (filters?.estado) query = query.eq('estado', filters.estado)
  if (filters?.equipo_id) query = query.eq('equipo_id', filters.equipo_id)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchEquiposActivos() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('equipos')
    .select('id, nombre, disciplina_slug')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}

export async function fetchMembresiasStats() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('suscripciones')
    .select('estado, tipo, monto_pactado, fecha_alta')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)

  const now = new Date()
  const hace30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const stats = {
    activas: 0,
    suspendidas: 0,
    canceladas: 0,
    total: 0,
    ingresoMensual: 0,
    altasUltimoMes: 0,
  }

  for (const row of data ?? []) {
    stats.total++
    if (row.estado === 'activa') {
      stats.activas++
      stats.ingresoMensual += Number(row.monto_pactado ?? 0)
    }
    else if (row.estado === 'suspendida') stats.suspendidas++
    else if (row.estado === 'cancelada') stats.canceladas++
    if (row.fecha_alta >= hace30) stats.altasUltimoMes++
  }

  return stats
}
