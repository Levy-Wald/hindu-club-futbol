'use server'

import { createClient } from '@/lib/supabase/server'

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
