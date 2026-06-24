// F3 portal — El club: sedes + espacios (canchas) + ubicación. Read-only.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface SedePortal {
  id: string
  nombre: string
  direccion: string | null
  espacios: { nombre: string; tipo: string | null }[]
}

export async function fetchSedesClub(): Promise<SedePortal[]> {
  const supabase = await createClient()

  const [sedesRes, canchasRes] = await Promise.all([
    supabase.from('sedes').select('id, nombre, direccion').eq('tenant_id', TENANT_ID).order('nombre'),
    supabase.from('canchas').select('nombre, tipo, sede_id').eq('tenant_id', TENANT_ID).eq('activa', true).order('nombre'),
  ])

  const canchasPorSede = new Map<string, { nombre: string; tipo: string | null }[]>()
  for (const c of canchasRes.data ?? []) {
    const k = c.sede_id as string
    if (!canchasPorSede.has(k)) canchasPorSede.set(k, [])
    canchasPorSede.get(k)!.push({ nombre: c.nombre, tipo: c.tipo })
  }

  return (sedesRes.data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    direccion: s.direccion,
    espacios: canchasPorSede.get(s.id) ?? [],
  }))
}

export interface CanchaDetalle {
  id: string
  nombre: string
  tipo: string | null
  superficie: string | null
  iluminada: boolean | null
  techada: boolean | null
  capacidad_jugadores: number | null
  disponible_para_alquiler: boolean | null
  precio_alquiler_hora: number | null
}

export interface SedeDetalle {
  id: string
  nombre: string
  tipo: string | null
  direccion: string | null
  lat: number | null
  lng: number | null
  telefono: string | null
  email: string | null
  horario_atencion: string | null
  canchas: CanchaDetalle[]
}

export async function fetchSedeDetalle(sedeId: string): Promise<SedeDetalle | null> {
  const supabase = await createClient()

  const { data: s } = await supabase
    .from('sedes')
    .select('id, nombre, tipo, direccion, lat, lng, telefono, email, horario_atencion')
    .eq('tenant_id', TENANT_ID)
    .eq('id', sedeId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!s) return null

  const { data: canchas } = await supabase
    .from('canchas')
    .select('id, nombre, tipo, superficie, iluminada, techada, capacidad_jugadores, disponible_para_alquiler, precio_alquiler_hora')
    .eq('tenant_id', TENANT_ID)
    .eq('sede_id', sedeId)
    .eq('activa', true)
    .order('nombre')

  return {
    id: s.id,
    nombre: s.nombre,
    tipo: s.tipo,
    direccion: s.direccion,
    lat: s.lat != null ? Number(s.lat) : null,
    lng: s.lng != null ? Number(s.lng) : null,
    telefono: s.telefono,
    email: s.email,
    horario_atencion: s.horario_atencion,
    canchas: (canchas ?? []).map((c) => ({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      superficie: c.superficie,
      iluminada: c.iluminada,
      techada: c.techada,
      capacidad_jugadores: c.capacidad_jugadores,
      disponible_para_alquiler: c.disponible_para_alquiler,
      precio_alquiler_hora: c.precio_alquiler_hora != null ? Number(c.precio_alquiler_hora) : null,
    })),
  }
}
