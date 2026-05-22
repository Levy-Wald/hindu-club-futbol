'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { SmartDefaults } from './types'

type DefaultsFactory = (
  entidadId: string,
  tenantId: string
) => Promise<SmartDefaults>

// ── Strategy: equipos ──

const equiposDefaults: DefaultsFactory = async (equipoId, tenantId) => {
  const supabase = createServiceRoleClient()

  const { data: equipo } = await supabase
    .from('equipos')
    .select('nombre, sede_principal_id, disciplina_slug')
    .eq('id', equipoId)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!equipo) {
    return { titulo: 'Nuevo evento', tipo_evento_slug: 'entrenamiento' }
  }

  // Find DT (director técnico) as default responsable
  const { data: dt } = await supabase
    .from('personas_equipos')
    .select('persona_id')
    .eq('equipo_id', equipoId)
    .eq('tenant_id', tenantId)
    .eq('rol_equipo_slug', 'dt')
    .eq('activo', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle()

  return {
    titulo: `Entrenamiento ${equipo.nombre}`,
    tipo_evento_slug: 'entrenamiento',
    equipo_id: equipoId,
    sede_id: equipo.sede_principal_id ?? undefined,
    responsables_persona_id: dt?.persona_id ? [dt.persona_id] : undefined,
    modulo_origen: 'equipos',
    metadata: { disciplina_slug: equipo.disciplina_slug },
  }
}

// ── Strategy: finanzas ──

const finanzasDefaults: DefaultsFactory = async (_entidadId, _tenantId) => {
  return {
    titulo: 'Vencimiento',
    tipo_evento_slug: 'vencimiento',
  }
}

// ── Strategy: proyectos ──

const proyectosDefaults: DefaultsFactory = async (_entidadId, _tenantId) => {
  return {
    titulo: 'Hito de proyecto',
    tipo_evento_slug: 'reunion',
  }
}

// ── Registry ──

const FACTORIES: Record<string, DefaultsFactory> = {
  equipos: equiposDefaults,
  finanzas: finanzasDefaults,
  proyectos: proyectosDefaults,
}

/**
 * Returns smart defaults for creating an event from a module context.
 * Returns null if module has no factory registered.
 */
export async function getSmartDefaults(
  moduloOrigen: string,
  entidadId: string,
  tenantId: string
): Promise<SmartDefaults | null> {
  const factory = FACTORIES[moduloOrigen]
  if (!factory) return null
  return factory(entidadId, tenantId)
}
