'use server'

import { createClient } from '@/lib/supabase/server'

export async function fetchMiPersona() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .maybeSingle()

  return persona
}

export async function fetchMisEquipos(personaId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('personas_equipos')
    .select(`
      id, rol_equipo_slug, dorsal, posicion, activo,
      equipo:equipos!equipo_id(id, nombre, disciplina_slug, color_principal, color_secundario, foto_url, escudo_url, indumentaria, foto_equipo_url)
    `)
    .eq('persona_id', personaId)
    .eq('activo', true)

  return data ?? []
}

export async function fetchMisPadrones(personaId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('personas_padrones')
    .select(`
      id, numero_socio, activo,
      padron:padrones!padron_id(id, nombre, tipo)
    `)
    .eq('persona_id', personaId)
    .eq('activo', true)

  return data ?? []
}

export async function fetchMisVinculos(personaId: string) {
  const supabase = await createClient()

  const [origenRes, destinoRes] = await Promise.all([
    supabase
      .from('personas_vinculos')
      .select('id, tipo_vinculo_slug, activo, destino:personas!persona_destino_id(id, nombre, apellido)')
      .eq('persona_origen_id', personaId)
      .eq('activo', true),
    supabase
      .from('personas_vinculos')
      .select('id, tipo_vinculo_slug, activo, origen:personas!persona_origen_id(id, nombre, apellido)')
      .eq('persona_destino_id', personaId)
      .eq('activo', true),
  ])

  return {
    origen: origenRes.data ?? [],
    destino: destinoRes.data ?? [],
  }
}

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
