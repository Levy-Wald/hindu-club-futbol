import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { SegmentoConfig, SegmentoResuelto } from './tipos'

export async function resolverSegmento(
  tenantId: string,
  config: SegmentoConfig,
  supabaseClient?: SupabaseClient
): Promise<SegmentoResuelto> {
  const supabase = supabaseClient ?? await createClient()

  if (config.tipo === 'todos_activos') {
    const { data, error } = await supabase
      .from('personas')
      .select('id, nombre, apellido, email_principal, whatsapp')
      .eq('tenant_id', tenantId)
      .eq('estado', 'activo')
      .is('deleted_at', null)

    if (error) throw new Error(`Error resolviendo segmento: ${error.message}`)

    return {
      tipo: 'todos_activos',
      parametros: {},
      personas: data ?? [],
      total: data?.length ?? 0,
    }
  }

  if (config.tipo === 'equipo') {
    const { data: vinculos, error: vinculosError } = await supabase
      .from('personas_equipos')
      .select('persona_id')
      .eq('tenant_id', tenantId)
      .eq('equipo_id', config.equipo_id)
      .eq('activo', true)
      .is('deleted_at', null)

    if (vinculosError) throw new Error(`Error resolviendo equipo: ${vinculosError.message}`)

    const personaIds = (vinculos ?? []).map(v => v.persona_id)
    if (personaIds.length === 0) {
      return { tipo: 'equipo', parametros: { equipo_id: config.equipo_id }, personas: [], total: 0 }
    }

    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, nombre, apellido, email_principal, whatsapp')
      .in('id', personaIds)
      .eq('estado', 'activo')
      .is('deleted_at', null)

    if (personasError) throw new Error(`Error obteniendo personas del equipo: ${personasError.message}`)

    return {
      tipo: 'equipo',
      parametros: { equipo_id: config.equipo_id },
      personas: personas ?? [],
      total: personas?.length ?? 0,
    }
  }

  if (config.tipo === 'personas_ids_directos') {
    if (config.persona_ids.length === 0) {
      return { tipo: 'personas_ids_directos', parametros: {}, personas: [], total: 0 }
    }

    const { data, error } = await supabase
      .from('personas')
      .select('id, nombre, apellido, email_principal, whatsapp')
      .in('id', config.persona_ids)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (error) throw new Error(`Error resolviendo personas directas: ${error.message}`)

    return {
      tipo: 'personas_ids_directos',
      parametros: { count: config.persona_ids.length },
      personas: data ?? [],
      total: data?.length ?? 0,
    }
  }

  throw new Error(`Tipo de segmento no soportado: ${JSON.stringify(config)}`)
}
