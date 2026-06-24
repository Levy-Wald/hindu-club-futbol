// F6.9 — Federaciones. Vista consolidada read-only: una federación (entidad
// tipo='federacion') y su estructura deportiva (equipos vinculados por
// equipos.entidad_id → disciplinas, categorías, torneos). Cero schema nuevo.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface FederacionRow {
  id: string
  nombre: string
  cuit: string | null
  sitio_web: string | null
  activo: boolean
  equipos_count: number
}

export async function fetchFederaciones(): Promise<FederacionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('entidades')
    .select('id, nombre, cuit, sitio_web, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('tipo', 'federacion')
    .is('deleted_at', null)
    .order('nombre')
  if (error) throw error

  const fed = data ?? []
  if (fed.length === 0) return []

  const ids = fed.map((f) => f.id)
  const { data: equipos } = await supabase
    .from('equipos')
    .select('entidad_id')
    .in('entidad_id', ids)
    .eq('activo', true)

  const countPorFed = new Map<string, number>()
  for (const e of equipos ?? []) {
    const k = e.entidad_id as string
    countPorFed.set(k, (countPorFed.get(k) ?? 0) + 1)
  }

  return fed.map((f) => ({ ...f, equipos_count: countPorFed.get(f.id) ?? 0 }))
}

export interface EquipoFederado {
  id: string
  nombre: string
  disciplina_slug: string | null
  modalidad: string | null
  torneo: string | null
  categoria: string | null
}

export async function fetchFederacionDetalle(id: string) {
  const supabase = await createClient()

  const { data: federacion, error } = await supabase
    .from('entidades')
    .select('id, nombre, cuit, razon_social, sitio_web, email, telefono, activo')
    .eq('id', id)
    .eq('tipo', 'federacion')
    .is('deleted_at', null)
    .single()
  if (error) throw error

  const { data: equiposRaw, error: eqErr } = await supabase
    .from('equipos')
    .select('id, nombre, disciplina_slug, modalidad, torneo, categoria:categorias_equipo!categoria_id(nombre_display)')
    .eq('tenant_id', TENANT_ID)
    .eq('entidad_id', id)
    .eq('activo', true)
    .order('nombre')
  if (eqErr) throw eqErr

  const equipos: EquipoFederado[] = (equiposRaw ?? []).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    disciplina_slug: e.disciplina_slug,
    modalidad: e.modalidad,
    torneo: e.torneo,
    categoria: (e.categoria as unknown as { nombre_display: string } | null)?.nombre_display ?? null,
  }))

  return { federacion, equipos }
}
