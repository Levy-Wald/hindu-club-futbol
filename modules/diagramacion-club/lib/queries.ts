'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function fetchShapes() {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('diagramacion_club')
    .select('*, espacio:espacios(id, nombre)')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .eq('activo', true)
    .order('capa', { ascending: true })

  if (error) return []
  return (data ?? []).map((d: any) => ({
    ...d,
    espacio_nombre: Array.isArray(d.espacio) ? d.espacio[0]?.nombre : d.espacio?.nombre ?? null,
  }))
}

export async function fetchEspaciosDisponibles() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('espacios')
    .select('id, nombre, tipo_slug')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}
