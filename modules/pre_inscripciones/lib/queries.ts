'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchPreInscripciones(filtro?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('pre_inscripciones')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('fecha_envio', { ascending: false })

  if (filtro && filtro !== 'todas') {
    query = query.eq('estado', filtro)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchPreInscripcionesStats() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('pre_inscripciones')
    .select('estado')
    .eq('tenant_id', TENANT_ID)

  const stats = { total: 0, pendiente: 0, en_revision: 0, aprobada: 0, rechazada: 0 }
  for (const row of data ?? []) {
    stats.total++
    if (row.estado in stats) stats[row.estado as keyof typeof stats]++
  }
  return stats
}
