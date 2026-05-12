import type { SupabaseClient } from '@supabase/supabase-js'
import type { CategoriaContenido, ResultadoFiltro } from './tipos'
import { CATEGORIA_TO_OPTIN, TZ_ARGENTINA } from './defaults'

/**
 * Filtra persona_ids segun preferencias de comunicacion via RPC SQL.
 * - transaccional: ignora opt-in/out (solo horario + dias)
 * - otras categorias: respeta opt-in correspondiente + horario + dias
 */
export async function filtrarPorPreferencias(
  supabase: SupabaseClient,
  tenantId: string,
  personaIds: string[],
  categoria: CategoriaContenido
): Promise<ResultadoFiltro> {
  if (personaIds.length === 0) {
    return { aEnviar: [], filtrados: { opt_out: [], horario: [], dia_excluido: [] } }
  }

  const optInColumn = CATEGORIA_TO_OPTIN[categoria]
  const respetaOptIn = optInColumn !== null

  const { data, error } = await supabase.rpc('filtrar_personas_por_preferencias_comunicacion', {
    p_tenant_id: tenantId,
    p_persona_ids: personaIds,
    p_opt_in_column: optInColumn ?? '',
    p_respeta_opt_in: respetaOptIn,
    p_tz: TZ_ARGENTINA,
  })

  if (error) throw new Error(`Error filtrando por preferencias: ${error.message}`)

  const aEnviar: string[] = []
  const filtrados = { opt_out: [] as string[], horario: [] as string[], dia_excluido: [] as string[] }

  for (const row of (data ?? []) as Array<{ persona_id: string; motivo: string }>) {
    if (row.motivo === 'aEnviar') aEnviar.push(row.persona_id)
    else if (row.motivo === 'opt_out') filtrados.opt_out.push(row.persona_id)
    else if (row.motivo === 'horario') filtrados.horario.push(row.persona_id)
    else if (row.motivo === 'dia_excluido') filtrados.dia_excluido.push(row.persona_id)
  }

  return { aEnviar, filtrados }
}
