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

  // Supabase default limit = 1000. Padrones grandes pueden tener 3000+ diffs.
  // Fetch en bloques de 1000 para traer todos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDiffs: any[] = []
  let from = 0
  const PAGE = 1000

  while (true) {
    let query = supabase
      .from('padron_sync_diffs')
      .select('*')
      .eq('sync_id', syncId)
      .order('tipo_cambio')
      .order('nombre_archivo')
      .range(from, from + PAGE - 1)

    if (tipoCambio) {
      query = query.eq('tipo_cambio', tipoCambio)
    }

    const { data } = await query
    if (!data || data.length === 0) break
    allDiffs.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  return allDiffs
}

export async function getPersonasParaSync(padronId: string): Promise<PersonaExistente[]> {
  const supabase = await createClient()

  // Todas las personas del tenant con sus datos de este padrón
  // Fetch paginado para superar el límite de 1000 de Supabase
  const personas: { id: string; nombre: string; apellido: string; numero_documento: string | null; fecha_nacimiento: string | null }[] = []
  let pFrom = 0
  while (true) {
    const { data } = await supabase
      .from('personas')
      .select('id, nombre, apellido, numero_documento, fecha_nacimiento')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .range(pFrom, pFrom + 999)
    if (!data || data.length === 0) break
    personas.push(...data)
    if (data.length < 1000) break
    pFrom += 1000
  }

  const membresiasPadron: { id: string; persona_id: string; numero_socio: string | null; categoria_club: string | null; actividad_club: string | null; fecha_ingreso_club: string | null; estado_club: string | null; notas_club: string | null; activo: boolean }[] = []
  let mFrom = 0
  while (true) {
    const { data } = await supabase
      .from('personas_padrones')
      .select('id, persona_id, numero_socio, categoria_club, actividad_club, fecha_ingreso_club, estado_club, notas_club, activo')
      .eq('padron_id', padronId)
      .eq('tenant_id', TENANT_ID)
      .range(mFrom, mFrom + 999)
    if (!data || data.length === 0) break
    membresiasPadron.push(...data)
    if (data.length < 1000) break
    mFrom += 1000
  }

  const ppMap = new Map<string, typeof membresiasPadron[number]>()
  for (const pp of membresiasPadron) {
    ppMap.set(pp.persona_id, pp)
  }

  return personas.map((p) => {
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
    .is('pipeline_slug', null)
    .order('nombre')
  return data ?? []
}
