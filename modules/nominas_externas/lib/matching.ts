import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * Wrapper de match_persona_fuzzy RPC.
 * Signature: (p_tenant_id, p_payload jsonb, p_threshold_high=0.92, p_threshold_low=0.75, p_max_candidates=5)
 * Returns: TABLE(persona_id, score, match_type, snapshot)
 *
 * S4: thresholds overrideados a 0.85/0.70 per spec
 */
export async function buscarMatchPersona(
  tenant_id: string,
  payload: { nombre: string; apellido: string; numero_documento?: string }
): Promise<{
  persona_id: string | null
  score: number
  match_type: string
  snapshot: Record<string, unknown> | null
  decision: 'auto_match' | 'posible_match' | 'crear_nueva'
}> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase.rpc('match_persona_fuzzy', {
    p_tenant_id: tenant_id,
    p_payload: {
      nombre: payload.nombre,
      apellido: payload.apellido,
      numero_documento: payload.numero_documento ?? null,
    },
    p_threshold_high: 0.85,
    p_threshold_low: 0.70,
    p_max_candidates: 3,
  })

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    return { persona_id: null, score: 0, match_type: 'none', snapshot: null, decision: 'crear_nueva' }
  }

  const best = Array.isArray(data) ? data[0] : data
  const score = best.score as number

  let decision: 'auto_match' | 'posible_match' | 'crear_nueva'
  if (score > 0.85) {
    decision = 'auto_match'
  } else if (score > 0.70) {
    decision = 'posible_match'
  } else {
    decision = 'crear_nueva'
  }

  return {
    persona_id: best.persona_id,
    score,
    match_type: best.match_type,
    snapshot: best.snapshot as Record<string, unknown> | null,
    decision,
  }
}

/**
 * Verifica si persona es socio activo (D1: alertar admin si match con socio)
 */
export async function esPersonaSocioActivo(persona_id: string, tenant_id: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  // AP-001 ✓: personas_padrones NO tiene deleted_at
  const { data } = await supabase
    .from('personas_padrones')
    .select('id')
    .eq('persona_id', persona_id)
    .eq('tenant_id', tenant_id)
    .eq('activo', true)
    .is('fecha_baja', null)
    .limit(1)

  return Boolean(data && data.length > 0)
}
