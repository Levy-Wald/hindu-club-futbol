'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

// =============================================================================
// Solicitudes (existente)
// =============================================================================

export async function fetchSolicitudesPendientes() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('solicitudes')
    .select(`
      id, tipo, estado, datos, created_at, motivo_rechazo,
      solicitante:personas!solicitante_id(id, nombre, apellido)
    `)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false })

  return data ?? []
}

// =============================================================================
// Plantillas
// =============================================================================

export async function fetchPlantillas(filters?: { tipo?: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('com_plantillas')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('nombre')

  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchPlantilla(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_plantillas')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

export async function obtenerPlantilla(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_plantillas')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .single()

  if (error) return null
  return data
}

// =============================================================================
// Envios
// =============================================================================

export async function fetchEnvios(filters?: {
  canal?: string
  estado?: string
  persona_id?: string
  plantilla_slug?: string
  fecha_desde?: string
  fecha_hasta?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('com_envios')
    .select(`
      *,
      persona:personas(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })

  if (filters?.canal) {
    query = query.eq('canal', filters.canal)
  }
  if (filters?.estado) {
    query = query.eq('estado', filters.estado)
  }
  if (filters?.persona_id) {
    query = query.eq('persona_id', filters.persona_id)
  }
  if (filters?.plantilla_slug) {
    query = query.eq('plantilla_slug', filters.plantilla_slug)
  }
  if (filters?.fecha_desde) {
    query = query.gte('created_at', filters.fecha_desde)
  }
  if (filters?.fecha_hasta) {
    query = query.lte('created_at', filters.fecha_hasta)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// =============================================================================
// Mensajes (bandeja in-app)
// =============================================================================

export async function fetchMensajesNoLeidos(personaId: string, limit: number = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_mensajes')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('destinatario_persona_id', personaId)
    .is('leido_at', null)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data ?? []
}

export async function fetchMensajes(personaId: string, filters?: { leido?: boolean }) {
  const supabase = await createClient()

  let query = supabase
    .from('com_mensajes')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('destinatario_persona_id', personaId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.leido === true) {
    query = query.not('leido_at', 'is', null)
  } else if (filters?.leido === false) {
    query = query.is('leido_at', null)
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchContadorNoLeidos(personaId: string) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('com_mensajes')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('destinatario_persona_id', personaId)
    .is('leido_at', null)
    .is('deleted_at', null)

  if (error) return 0
  return count ?? 0
}

// =============================================================================
// Lotes (envíos masivos)
// =============================================================================

export interface LoteResumen {
  lote_id: string
  plantilla_slug: string
  canal: string
  segmento_tipo: string
  primer_envio: string
  total: number
  enviados: number
  fallados: number
}

export async function listarLotes(limit = 50): Promise<LoteResumen[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_envios')
    .select('metadata, plantilla_slug, canal, created_at, estado')
    .eq('tenant_id', TENANT_ID)
    .not('metadata->lote_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit * 100)

  if (error) return []

  const lotesMap = new Map<string, LoteResumen>()

  for (const row of data ?? []) {
    const meta = row.metadata as Record<string, unknown> | null
    const lote_id = meta?.lote_id as string | undefined
    if (!lote_id) continue

    if (!lotesMap.has(lote_id)) {
      const segmento = meta?.segmento as Record<string, unknown> | undefined
      lotesMap.set(lote_id, {
        lote_id,
        plantilla_slug: row.plantilla_slug ?? '',
        canal: row.canal,
        segmento_tipo: (segmento?.tipo as string) ?? 'desconocido',
        primer_envio: row.created_at,
        total: 0,
        enviados: 0,
        fallados: 0,
      })
    }

    const lote = lotesMap.get(lote_id)!
    lote.total++
    if (row.estado === 'enviado') lote.enviados++
    if (row.estado === 'fallado') lote.fallados++
  }

  return Array.from(lotesMap.values()).slice(0, limit)
}

export async function obtenerEnviosDelLote(loteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_envios')
    .select(`
      id, canal, estado, error_mensaje, plantilla_slug, destinatario, created_at, metadata,
      persona:personas(id, nombre, apellido)
    `)
    .eq('tenant_id', TENANT_ID)
    .filter('metadata->lote_id', 'eq', `"${loteId}"`)
    .order('created_at', { ascending: false })
    .limit(2500)

  if (error) return []

  return (data ?? []) as unknown as Array<{
    id: string
    canal: string
    estado: string
    error_mensaje: string | null
    plantilla_slug: string | null
    destinatario: string | null
    created_at: string
    metadata: Record<string, unknown> | null
    persona: { id: string; nombre: string; apellido: string } | null
  }>
}

// =============================================================================
// Jobs Log (cron automatizaciones)
// =============================================================================

export async function listarJobsLog(limit = 50) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_jobs_log')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return data ?? []
}

export async function obtenerJobLog(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('com_jobs_log')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error) return null
  return data
}

// =============================================================================
// Dashboard
// =============================================================================

export async function fetchDashboardStats() {
  const supabase = await createClient()

  const hoy = new Date().toISOString().split('T')[0]

  // Enviados hoy
  const { count: enviadosHoy } = await supabase
    .from('com_envios')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .gte('created_at', `${hoy}T00:00:00`)
    .lte('created_at', `${hoy}T23:59:59`)

  // Pendientes
  const { count: pendientes } = await supabase
    .from('com_envios')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'pendiente')

  // Fallados
  const { count: fallados } = await supabase
    .from('com_envios')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'fallado')

  // Entregados
  const { count: entregados } = await supabase
    .from('com_envios')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('estado', 'enviado')

  return {
    enviadosHoy: enviadosHoy ?? 0,
    pendientes: pendientes ?? 0,
    fallados: fallados ?? 0,
    entregados: entregados ?? 0,
  }
}
