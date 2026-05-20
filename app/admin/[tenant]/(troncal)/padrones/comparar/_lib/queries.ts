import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export interface PadronOption {
  id: string
  nombre: string
  tipo: string | null
  miembros_count: number
}

export async function fetchPadronesParaComparar(): Promise<PadronOption[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('padrones')
    .select('id, nombre, tipo, personas_padrones!personas_padrones_padron_id_fkey(id)')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  if (error) throw error

  return (data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    miembros_count: Array.isArray(p.personas_padrones) ? p.personas_padrones.length : 0,
  }))
}

export interface PersonaPadronRow {
  persona_id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  padron_ids: string[]
  equipo_ids: string[]
  tiene_equipo: boolean
}

/**
 * Fetch all personas with their padron memberships and equipo memberships.
 * Used for cross-comparisons.
 */
export async function fetchPersonasConMembresías() {
  const supabase = await createClient()

  const { data: personas, error: pError } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, email_principal')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('apellido')

  if (pError) throw pError

  const { data: membresiasPadron } = await supabase
    .from('personas_padrones')
    .select('persona_id, padron_id')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  const { data: membresiasEquipo } = await supabase
    .from('personas_equipos')
    .select('persona_id, equipo_id')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)

  // Build lookup maps
  const padronMap = new Map<string, string[]>()
  for (const m of membresiasPadron ?? []) {
    if (!padronMap.has(m.persona_id)) padronMap.set(m.persona_id, [])
    padronMap.get(m.persona_id)!.push(m.padron_id)
  }

  const equipoMap = new Map<string, string[]>()
  for (const m of membresiasEquipo ?? []) {
    if (!equipoMap.has(m.persona_id)) equipoMap.set(m.persona_id, [])
    equipoMap.get(m.persona_id)!.push(m.equipo_id)
  }

  return (personas ?? []).map((p) => ({
    persona_id: p.id,
    nombre: p.nombre,
    apellido: p.apellido,
    numero_documento: p.numero_documento,
    email_principal: p.email_principal,
    padron_ids: padronMap.get(p.id) ?? [],
    equipo_ids: equipoMap.get(p.id) ?? [],
    tiene_equipo: (equipoMap.get(p.id) ?? []).length > 0,
  }))
}

export async function fetchEquiposParaComparar() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('equipos')
    .select('id, nombre, disciplina_slug')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')

  if (error) throw error
  return data ?? []
}
