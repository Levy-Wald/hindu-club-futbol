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
