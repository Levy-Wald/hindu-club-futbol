// F6.7 — Consolidador de Padrones. Vista cenital read-only de todo el registro:
// N padrones (personas) + entidades + proveedores, con solapamiento de personas.
// Cero schema nuevo: agrega sobre padrones / personas_padrones / entidades.
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'

export interface PadronResumen {
  id: string
  nombre: string
  tipo: string | null
  miembros: number
}

export interface Consolidado {
  padrones: PadronResumen[]
  totalPadrones: number
  personasUnicas: number
  personasEnVariosPadrones: number
  entidadesCount: number
  proveedoresCount: number
}

export async function fetchConsolidado(): Promise<Consolidado> {
  const supabase = await createClient()

  const [padronesRes, membresiasRes, entidadesRes, proveedoresRes] = await Promise.all([
    supabase.from('padrones').select('id, nombre, tipo').eq('tenant_id', TENANT_ID),
    supabase.from('personas_padrones').select('persona_id, padron_id').eq('tenant_id', TENANT_ID).eq('activo', true),
    supabase.from('entidades').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).is('deleted_at', null),
    supabase.from('entidades').select('id', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID).eq('tipo', 'proveedor').is('deleted_at', null),
  ])

  const padrones = padronesRes.data ?? []
  const membresias = (membresiasRes.data ?? []) as { persona_id: string; padron_id: string }[]

  // Conteo de miembros por padrón.
  const miembrosPorPadron = new Map<string, number>()
  // Cantidad de padrones distintos por persona (para el solapamiento).
  const padronesPorPersona = new Map<string, Set<string>>()
  for (const m of membresias) {
    miembrosPorPadron.set(m.padron_id, (miembrosPorPadron.get(m.padron_id) ?? 0) + 1)
    if (!padronesPorPersona.has(m.persona_id)) padronesPorPersona.set(m.persona_id, new Set())
    padronesPorPersona.get(m.persona_id)!.add(m.padron_id)
  }

  let personasEnVariosPadrones = 0
  for (const set of padronesPorPersona.values()) {
    if (set.size > 1) personasEnVariosPadrones++
  }

  const resumen: PadronResumen[] = padrones
    .map((p) => ({ id: p.id, nombre: p.nombre, tipo: p.tipo, miembros: miembrosPorPadron.get(p.id) ?? 0 }))
    .sort((a, b) => b.miembros - a.miembros)

  return {
    padrones: resumen,
    totalPadrones: padrones.length,
    personasUnicas: padronesPorPersona.size,
    personasEnVariosPadrones,
    entidadesCount: entidadesRes.count ?? 0,
    proveedoresCount: proveedoresRes.count ?? 0,
  }
}
