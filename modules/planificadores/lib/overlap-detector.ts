'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { ConflictoOverlap } from './types'

/**
 * S4 pre-mortem: detecta overlap de cancha en nuevo horario.
 * Retorna null si no hay conflicto.
 * Uses deleted_at IS NULL (soft delete) for active events filter.
 */
export async function detectarOverlapCancha(input: {
  cancha_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  tenant_id: string
  evento_id_excluir: string
}): Promise<ConflictoOverlap | null> {
  const supabase = createServiceRoleClient()

  const { data: cancha } = await supabase
    .from('canchas')
    .select('nombre')
    .eq('id', input.cancha_id)
    .single()

  const { data: conflictos } = await supabase
    .from('eventos')
    .select('id, titulo, hora_inicio, hora_fin')
    .eq('tenant_id', input.tenant_id)
    .eq('cancha_id', input.cancha_id)
    .eq('fecha_inicio', input.fecha)
    .is('deleted_at', null)
    .neq('id', input.evento_id_excluir)
    .lt('hora_inicio', input.hora_fin)
    .gt('hora_fin', input.hora_inicio)

  if (!conflictos || conflictos.length === 0) return null

  return {
    cancha_id: input.cancha_id,
    cancha_nombre: cancha?.nombre ?? 'Cancha desconocida',
    eventos_en_conflicto: conflictos.map(c => ({
      id: c.id,
      titulo: c.titulo ?? '(sin título)',
      hora_inicio: c.hora_inicio,
      hora_fin: c.hora_fin,
    })),
  }
}
