import { createClient } from '@/lib/supabase/server'
import type { PersonaExistente } from '@/lib/padron-sync/processor'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function getSyncHistory(padronId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('padron_syncs')
    .select('id, padron_id, archivo_origen, estado, total_filas_archivo, altas_count, bajas_count, cambios_count, sin_cambios_count, rechazados_count, fecha_sync, created_at, padrones(nombre)')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(50)

  if (padronId) {
    query = query.eq('padron_id', padronId)
  }

  const { data } = await query
  return data ?? []
}

export async function getSyncById(syncId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('padron_syncs')
    .select('*')
    .eq('id', syncId)
    .eq('tenant_id', TENANT_ID)
    .single()

  return data
}

export async function getSyncDiffs(syncId: string, tipoCambio?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('padron_sync_diffs')
    .select('*')
    .eq('sync_id', syncId)
    .order('tipo_cambio')
    .order('nombre_archivo')

  if (tipoCambio) {
    query = query.eq('tipo_cambio', tipoCambio)
  }

  const { data } = await query
  return data ?? []
}

export async function getPersonasParaSync(padronId: string): Promise<PersonaExistente[]> {
  const supabase = await createClient()

  // Todas las personas del tenant con sus datos de este padrón
  const { data: personas } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, fecha_nacimiento')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)

  const { data: membresiasPadron } = await supabase
    .from('personas_padrones')
    .select('id, persona_id, numero_socio, categoria_club, actividad_club, fecha_ingreso_club, estado_club, notas_club, activo')
    .eq('padron_id', padronId)
    .eq('tenant_id', TENANT_ID)

  const ppMap = new Map<string, typeof membresiasPadron extends (infer T)[] | null ? T : never>()
  for (const pp of membresiasPadron ?? []) {
    ppMap.set(pp.persona_id, pp)
  }

  return (personas ?? []).map((p) => {
    const pp = ppMap.get(p.id)
    return {
      id: p.id,
      nombre: p.nombre,
      apellido: p.apellido,
      numero_documento: p.numero_documento,
      fecha_nacimiento: p.fecha_nacimiento,
      pp_id: pp?.id ?? null,
      pp_numero_socio: pp?.numero_socio ?? null,
      pp_categoria_club: pp?.categoria_club ?? null,
      pp_actividad_club: pp?.actividad_club ?? null,
      pp_fecha_ingreso_club: pp?.fecha_ingreso_club ?? null,
      pp_estado_club: pp?.estado_club ?? null,
      pp_notas_club: pp?.notas_club ?? null,
      pp_activo: pp?.activo ?? false,
    }
  })
}

export async function getPadrones() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('padrones')
    .select('id, nombre, slug, tipo')
    .eq('tenant_id', TENANT_ID)
    .eq('activo', true)
    .order('nombre')
  return data ?? []
}
