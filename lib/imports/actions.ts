'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parseFile } from '@/app/admin/padrones/[id]/importar/_lib/parser'
import { parseAgrupado } from './parsers/agrupado-por-grupo'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ═══════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════

interface FieldMapping {
  col_origen: string
  campo_destino: string
  transform?: string
  requerido?: boolean
}

interface ApplyAction {
  tipo: string
  atributo_slug?: string
  valor?: string
  equipo_resolver?: string
  campos_default?: Record<string, unknown>
  atributos_iniciales?: string[]
  plan_slug?: string
}

interface ApplyRule {
  trigger: string
  acciones: ApplyAction[]
}

interface Pipeline {
  slug: string
  nombre: string
  modo: string
  parser_strategy: string
  match_thresholds: { high: number; low: number }
  field_mappings: FieldMapping[]
  apply_rules: ApplyRule[]
  config: Record<string, unknown>
  tenant_id: string
}

interface MatchCandidate {
  persona_id: string
  score: number
  match_type: string
  snapshot: Record<string, unknown>
}

type ActionResult = { ok: true; message: string; data?: unknown } | { ok: false; message: string }

// ═══════════════════════════════════════════════════════════════
// Transforms
// ═══════════════════════════════════════════════════════════════

const DNI_PLACEHOLDERS = new Set([
  '0', '00', '000', '0000', '00000', '000000', '0000000', '00000000',
  '1', '11', '111', '1111', '11111', '111111', '1111111', '11111111',
])

const APELLIDO_PREFIXES = new Set([
  'de', 'del', 'de la', 'la', 'san', 'santa', 'von', 'van', 'di', 'do', 'da',
  'le', 'el', 'los', 'las',
])

// Cache de apellidos compuestos del tenant (memoized per run)
let cachedCompoundApellidos: Set<string> | null = null

async function getCompoundApellidos(): Promise<Set<string>> {
  if (cachedCompoundApellidos) return cachedCompoundApellidos
  const sc = getServiceClient()
  const { data } = await sc
    .from('personas')
    .select('apellido')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .like('apellido', '% %')
  cachedCompoundApellidos = new Set(
    (data ?? []).map((r: { apellido: string }) => r.apellido.toLowerCase().trim())
  )
  return cachedCompoundApellidos
}

function clearCompoundCache() {
  cachedCompoundApellidos = null
}

async function splitApellidoNombreHeuristic(input: string): Promise<{ apellido: string; nombre: string }> {
  const v = input?.trim() ?? ''
  if (!v) return { apellido: '', nombre: '' }

  // Comma-separated: "LAVAGNO, JUAN MARCO"
  const commaIdx = v.indexOf(',')
  if (commaIdx >= 0) {
    return {
      apellido: v.slice(0, commaIdx).trim(),
      nombre: v.slice(commaIdx + 1).trim(),
    }
  }

  const tokens = v.split(/\s+/)
  if (tokens.length <= 2) {
    return { apellido: tokens[0] ?? '', nombre: tokens.slice(1).join(' ') }
  }

  // Single-letter first token (D, O, L) → likely abbreviated compound apellido
  // "D Amico Manuel" → apellido="D Amico", nombre="Manuel"
  if (tokens[0].length === 1 && tokens.length >= 3) {
    return { apellido: tokens.slice(0, 2).join(' '), nombre: tokens.slice(2).join(' ') }
  }

  // Check if first 2-3 tokens match a known compound apellido
  const knownApellidos = await getCompoundApellidos()

  // Try 3 tokens first, then 2
  for (const tryLen of [3, 2]) {
    if (tokens.length <= tryLen) continue
    const candidate = tokens.slice(0, tryLen).join(' ').toLowerCase()
    if (knownApellidos.has(candidate)) {
      return {
        apellido: tokens.slice(0, tryLen).join(' '),
        nombre: tokens.slice(tryLen).join(' '),
      }
    }
  }

  // Check for prefix particles: "de la Cruz Juan"
  const firstLower = tokens[0].toLowerCase()
  if (APELLIDO_PREFIXES.has(firstLower) && tokens.length >= 3) {
    // "de la Cruz" → take 3 tokens; "del Valle" → take 2
    const secondLower = `${firstLower} ${tokens[1].toLowerCase()}`
    if (APELLIDO_PREFIXES.has(secondLower) && tokens.length >= 4) {
      return { apellido: tokens.slice(0, 3).join(' '), nombre: tokens.slice(3).join(' ') }
    }
    return { apellido: tokens.slice(0, 2).join(' '), nombre: tokens.slice(2).join(' ') }
  }

  // Default: if 4+ tokens, assume first 2 are apellido (Garcia Cuerva Valentin → Garcia Cuerva)
  if (tokens.length >= 4) {
    return { apellido: tokens.slice(0, 2).join(' '), nombre: tokens.slice(2).join(' ') }
  }

  // 3 tokens, no match: first token is apellido
  return { apellido: tokens[0], nombre: tokens.slice(1).join(' ') }
}

function applyTransform(value: string, transform: string): unknown {
  const v = value?.trim() ?? ''
  switch (transform) {
    case 'identity':
    case 'trim':
      return v
    case 'upper':
      return v.toUpperCase()
    case 'lower':
      return v.toLowerCase()
    case 'parse_int': {
      const n = parseInt(v.replace(/\D/g, ''), 10)
      return isNaN(n) ? null : n
    }
    case 'parse_date': {
      if (!v) return null
      const isoMatch = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
      if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
      const dmyMatch = v.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
      if (dmyMatch) {
        const year = dmyMatch[3].length === 2
          ? (parseInt(dmyMatch[3]) > 50 ? `19${dmyMatch[3]}` : `20${dmyMatch[3]}`)
          : dmyMatch[3]
        return `${year}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`
      }
      return null
    }
    case 'split_apellido_nombre':
      // Sync fallback — heuristic version is async and handled separately
      return { apellido: '', nombre: '', _needs_async: true, _raw: v }
    case 'validar_dni': {
      const clean = v.replace(/\D/g, '')
      if (!clean || clean.length < 7 || DNI_PLACEHOLDERS.has(clean)) return null
      return clean
    }
    default:
      return v
  }
}

async function applyFieldMappingsAsync(
  rawRow: Record<string, string>,
  mappings: FieldMapping[]
): Promise<Record<string, unknown>> {
  const parsed: Record<string, unknown> = {}

  for (const m of mappings) {
    const rawValue = rawRow[m.col_origen] ?? ''
    const transform = m.transform ?? 'identity'

    if (transform === 'split_apellido_nombre') {
      const result = await splitApellidoNombreHeuristic(rawValue)
      parsed.apellido = result.apellido
      parsed.nombre = result.nombre
    } else {
      const result = applyTransform(rawValue, transform)
      parsed[m.campo_destino] = result
    }
  }

  return parsed
}

async function computeFileHash(buffer: ArrayBuffer): Promise<string> {
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(Buffer.from(buffer)).digest('hex')
}

// ═══════════════════════════════════════════════════════════════
// iniciarImportRun
// ═══════════════════════════════════════════════════════════════

export async function iniciarImportRun(
  pipelineSlug: string,
  formData: FormData,
  padronId: string
): Promise<ActionResult> {
  const sc = getServiceClient()
  clearCompoundCache()

  // Validar padrón
  const { data: padron, error: padronErr } = await sc
    .from('padrones')
    .select('id, pipeline_slug, activo')
    .eq('id', padronId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (padronErr || !padron) {
    return { ok: false, message: 'Padrón no encontrado' }
  }
  if (!padron.activo) {
    return { ok: false, message: 'El padrón está inactivo' }
  }
  if (padron.pipeline_slug !== pipelineSlug) {
    return { ok: false, message: 'Pipeline del archivo no coincide con el del padrón' }
  }

  const { data: pipeline, error: pErr } = await sc
    .from('import_pipelines')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', pipelineSlug)
    .eq('activo', true)
    .single()

  if (pErr || !pipeline) {
    return { ok: false, message: `Pipeline no encontrado: '${pipelineSlug}'` }
  }

  const pl = pipeline as Pipeline
  const file = formData.get('file') as File | null
  if (!file) return { ok: false, message: 'No se recibió archivo' }

  // Hash para idempotencia (por padron_id)
  const buffer = await file.arrayBuffer()
  const hash = await computeFileHash(buffer)

  const { data: existingRun } = await sc
    .from('import_runs')
    .select('id, estado')
    .eq('padron_id', padronId)
    .eq('hash_archivo', hash)
    .in('estado', ['aplicado', 'revisando'])
    .maybeSingle()

  if (existingRun) {
    return { ok: false, message: `Este archivo ya fue procesado en este padrón (run ${existingRun.id}, estado: ${existingRun.estado})` }
  }

  // Parse según strategy
  let importRows: { numero_fila: number; raw_data: Record<string, string>; parsed_data: Record<string, unknown> }[]

  if (pl.parser_strategy === 'agrupado_por_grupo') {
    const config = pl.config as {
      header_pattern: string; header_capture_group: number
      item_pattern: string; item_capture_group: number
      campo_grupo: string; campo_item: string
    }
    // Need to reconstruct File from buffer since we already consumed it
    const newFile = new File([buffer], file.name, { type: file.type })
    const result = await parseAgrupado(newFile, config)
    if (result.error) return { ok: false, message: result.error }

    // Apply field_mappings to parsed_data
    const mapped: typeof importRows = []
    for (const row of result.rows) {
      const parsedData = await applyFieldMappingsAsync(row.parsed_data as Record<string, string>, pl.field_mappings)
      // Keep equipo_nombre and other non-mapped fields
      for (const [k, v] of Object.entries(row.parsed_data)) {
        if (!(k in parsedData)) parsedData[k] = v
      }
      mapped.push({ numero_fila: row.numero_fila, raw_data: row.raw_data, parsed_data: parsedData })
    }
    importRows = mapped
  } else if (pl.parser_strategy === 'tabular') {
    const newFile = new File([buffer], file.name, { type: file.type })
    const parsed = await parseFile(newFile)
    if (parsed.totalRows === 0) return { ok: false, message: 'El archivo no contiene datos' }

    const mapped: typeof importRows = []
    for (let idx = 0; idx < parsed.rows.length; idx++) {
      const cells = parsed.rows[idx]
      const rawData: Record<string, string> = {}
      parsed.headers.forEach((h, i) => { rawData[h] = cells[i] ?? '' })
      const parsedData = await applyFieldMappingsAsync(rawData, pl.field_mappings)
      mapped.push({ numero_fila: idx + 1, raw_data: rawData, parsed_data: parsedData })
    }
    importRows = mapped
  } else {
    return { ok: false, message: `Parser '${pl.parser_strategy}' no implementado` }
  }

  if (importRows.length === 0) return { ok: false, message: 'El archivo no contiene datos procesables' }

  // Crear run
  const { data: run, error: runErr } = await sc
    .from('import_runs')
    .insert({
      tenant_id: TENANT_ID,
      pipeline_slug: pipelineSlug,
      padron_id: padronId,
      archivo_origen: file.name,
      hash_archivo: hash,
      estado: 'matching',
      total_filas: importRows.length,
      resumen: {},
    })
    .select('id')
    .single()

  if (runErr || !run) return { ok: false, message: `Error creando run: ${runErr?.message ?? 'desconocido'}` }

  // Bulk insert en batches de 500
  const BATCH_SIZE = 500
  for (let i = 0; i < importRows.length; i += BATCH_SIZE) {
    const batch = importRows.slice(i, i + BATCH_SIZE).map((r) => ({
      run_id: run.id,
      numero_fila: r.numero_fila,
      raw_data: r.raw_data,
      parsed_data: r.parsed_data,
      match_status: 'pendiente',
      apply_status: 'pendiente',
    }))
    const { error: insertErr } = await sc.from('import_rows').insert(batch)
    if (insertErr) {
      await sc.from('import_runs').update({ estado: 'fallado', error_mensaje: insertErr.message }).eq('id', run.id)
      return { ok: false, message: `Error insertando filas: ${insertErr.message}` }
    }
  }

  return { ok: true, message: `Run creado con ${importRows.length} filas`, data: { runId: run.id } }
}

// ═══════════════════════════════════════════════════════════════
// procesarMatching
// ═══════════════════════════════════════════════════════════════

export async function procesarMatching(runId: string): Promise<ActionResult> {
  const sc = getServiceClient()

  const { data: run, error: runErr } = await sc
    .from('import_runs')
    .select('*, import_pipelines(*)')
    .eq('id', runId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (runErr || !run) return { ok: false, message: 'Run no encontrado' }

  const pipelineRaw = run.import_pipelines
  const pipeline = (Array.isArray(pipelineRaw) ? pipelineRaw[0] : pipelineRaw) as Pipeline | null
  if (!pipeline) return { ok: false, message: 'Pipeline del run no encontrado' }

  const thresholds = (pipeline.match_thresholds ?? { high: 0.92, low: 0.75 }) as { high: number; low: number }

  const { data: rows, error: rowsErr } = await sc
    .from('import_rows')
    .select('id, parsed_data')
    .eq('run_id', runId)
    .eq('match_status', 'pendiente')
    .order('numero_fila')

  if (rowsErr || !rows) return { ok: false, message: `Error leyendo filas: ${rowsErr?.message}` }

  const counts = { exactos: 0, auto_fuzzy: 0, revisar: 0, sin_match: 0, errores: 0 }

  for (const row of rows) {
    const pd = row.parsed_data as Record<string, unknown> | null
    if (!pd) {
      await sc.from('import_rows').update({ match_status: 'error', apply_error: 'parsed_data vacío' }).eq('id', row.id)
      counts.errores++
      continue
    }

    const payload: Record<string, string> = {}
    if (pd.nombre) payload.nombre = String(pd.nombre)
    if (pd.apellido) payload.apellido = String(pd.apellido)
    if (pd.numero_documento) payload.dni = String(pd.numero_documento)
    if (pd.fecha_nacimiento) payload.fecha_nacimiento = String(pd.fecha_nacimiento)
    if (pd.email_principal) payload.email = String(pd.email_principal)

    const { data: candidates, error: matchErr } = await sc.rpc('match_persona_fuzzy', {
      p_tenant_id: TENANT_ID,
      p_payload: payload,
      p_threshold_high: thresholds.high,
      p_threshold_low: thresholds.low,
      p_max_candidates: 5,
    })

    if (matchErr) {
      await sc.from('import_rows').update({ match_status: 'error', apply_error: matchErr.message }).eq('id', row.id)
      counts.errores++
      continue
    }

    const cands = (candidates ?? []) as MatchCandidate[]

    if (cands.length === 0) {
      await sc.from('import_rows').update({ match_status: 'sin_match', candidatos: [] }).eq('id', row.id)
      counts.sin_match++
    } else if (cands[0].score >= 1.0) {
      await sc.from('import_rows').update({
        match_status: 'exacto', match_score: cands[0].score,
        match_type: cands[0].match_type, persona_id: cands[0].persona_id, candidatos: cands,
      }).eq('id', row.id)
      counts.exactos++
    } else if (
      cands[0].score >= thresholds.high &&
      (cands.length === 1 || cands[0].score - (cands[1]?.score ?? 0) > 0.10)
    ) {
      await sc.from('import_rows').update({
        match_status: 'auto_fuzzy', match_score: cands[0].score,
        match_type: cands[0].match_type, persona_id: cands[0].persona_id, candidatos: cands,
      }).eq('id', row.id)
      counts.auto_fuzzy++
    } else {
      await sc.from('import_rows').update({
        match_status: 'revisar', match_score: cands[0].score,
        match_type: cands[0].match_type, candidatos: cands,
      }).eq('id', row.id)
      counts.revisar++
    }
  }

  await sc.from('import_runs').update({ estado: 'revisando', resumen: counts }).eq('id', runId)

  return {
    ok: true,
    message: `Matching completo: ${counts.exactos} exactos, ${counts.auto_fuzzy} auto-fuzzy, ${counts.revisar} a revisar, ${counts.sin_match} sin match`,
    data: counts,
  }
}

// ═══════════════════════════════════════════════════════════════
// reprocesarMatching — re-run matching sin re-parsear archivo
// ═══════════════════════════════════════════════════════════════

export async function reprocesarMatching(
  runId: string,
  soloSinMatch: boolean = false
): Promise<ActionResult> {
  const sc = getServiceClient()

  const { data: run, error: runErr } = await sc
    .from('import_runs')
    .select('id, estado')
    .eq('id', runId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (runErr || !run) return { ok: false, message: 'Run no encontrado' }
  if (!['revisando', 'matching'].includes(run.estado)) {
    return { ok: false, message: `No se puede reprocesar un run en estado "${run.estado}"` }
  }

  // Reset match_status to 'pendiente' for target rows
  let resetQuery = sc.from('import_rows')
    .update({ match_status: 'pendiente', match_score: null, match_type: null, persona_id: null, candidatos: [] })
    .eq('run_id', runId)
    .in('apply_status', ['pendiente', 'pendiente_revision_equipo'])

  if (soloSinMatch) {
    resetQuery = resetQuery.eq('match_status', 'sin_match')
  }

  const { error: resetErr } = await resetQuery
  if (resetErr) return { ok: false, message: `Error reseteando filas: ${resetErr.message}` }

  // Re-run matching
  return procesarMatching(runId)
}

// ═══════════════════════════════════════════════════════════════
// resolverCandidato
// ═══════════════════════════════════════════════════════════════

export async function resolverCandidato(
  rowId: string,
  decision: 'aceptar_top' | 'aceptar_personaId' | 'crear_nueva' | 'descartar',
  opciones?: { personaId?: string; notas?: string }
): Promise<ActionResult> {
  const sc = getServiceClient()

  const { data: row, error: rowErr } = await sc
    .from('import_rows')
    .select('id, candidatos, match_status')
    .eq('id', rowId)
    .single()

  if (rowErr || !row) return { ok: false, message: 'Fila no encontrada' }
  const cands = (row.candidatos ?? []) as MatchCandidate[]

  switch (decision) {
    case 'aceptar_top': {
      if (cands.length === 0) return { ok: false, message: 'No hay candidatos' }
      await sc.from('import_rows').update({
        persona_id: cands[0].persona_id, match_status: 'manual_review',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
    case 'aceptar_personaId': {
      if (!opciones?.personaId) return { ok: false, message: 'personaId requerido' }
      await sc.from('import_rows').update({
        persona_id: opciones.personaId, match_status: 'manual_review',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
    case 'crear_nueva': {
      await sc.from('import_rows').update({
        persona_id: null, match_status: 'sin_match',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
    case 'descartar': {
      await sc.from('import_rows').update({
        apply_status: 'descartado', notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
  }

  revalidatePath('/admin/padrones')
  return { ok: true, message: `Fila resuelta: ${decision}` }
}

// ═══════════════════════════════════════════════════════════════
// aplicarRun — con insertar_personas_equipos implementado
// ═══════════════════════════════════════════════════════════════

const PERSONA_FIELDS = new Set([
  'nombre', 'apellido', 'numero_documento', 'tipo_documento', 'cuil_cuit',
  'fecha_nacimiento', 'genero', 'nacionalidad', 'email_principal', 'email_secundario',
  'telefono_principal', 'whatsapp', 'direccion_calle', 'direccion_numero',
  'direccion_ciudad', 'direccion_provincia', 'direccion_codigo_postal',
  'fecha_primera_relacion_club',
])

async function executeApplyAction(
  sc: ReturnType<typeof getServiceClient>,
  action: ApplyAction,
  personaId: string | null,
  parsedData: Record<string, unknown>,
  rowId: string,
  runId: string,
  pipelineConfig: Record<string, unknown>
): Promise<{ ok: boolean; error?: string; pendiente_equipo?: boolean }> {
  switch (action.tipo) {
    case 'enriquecer_persona': {
      if (!personaId) return { ok: false, error: 'No hay persona para enriquecer' }
      const { data: persona } = await sc.from('personas').select('*').eq('id', personaId).single()
      if (!persona) return { ok: false, error: 'Persona no encontrada' }

      const updates: Record<string, unknown> = {}
      const conflicts: { campo: string; existente: unknown; nuevo: unknown }[] = []

      for (const [campo, valorNuevo] of Object.entries(parsedData)) {
        if (!PERSONA_FIELDS.has(campo)) continue
        if (valorNuevo === null || valorNuevo === undefined || valorNuevo === '') continue
        const valorExistente = (persona as Record<string, unknown>)[campo]
        if (valorExistente === null || valorExistente === undefined || valorExistente === '') {
          updates[campo] = valorNuevo
        } else if (String(valorExistente) !== String(valorNuevo)) {
          conflicts.push({ campo, existente: valorExistente, nuevo: valorNuevo })
        }
      }

      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await sc.from('personas').update(updates).eq('id', personaId)
        if (upErr) return { ok: false, error: `Error actualizando persona: ${upErr.message}` }
      }

      for (const c of conflicts) {
        await sc.from('import_field_conflicts').insert({
          row_id: rowId, persona_id: personaId, tabla: 'personas', campo: c.campo,
          valor_existente: JSON.stringify(c.existente), valor_nuevo: JSON.stringify(c.nuevo),
        })
      }
      return { ok: true }
    }

    case 'agregar_atributo': {
      if (!personaId) return { ok: false, error: 'No hay persona para agregar atributo' }
      if (!action.atributo_slug) return { ok: false, error: 'atributo_slug requerido' }
      const { data: existing } = await sc.from('personas_atributos')
        .select('id').eq('persona_id', personaId)
        .eq('atributo_slug', action.atributo_slug).eq('activo', true).maybeSingle()
      if (!existing) {
        const { error: insErr } = await sc.from('personas_atributos').insert({
          tenant_id: TENANT_ID, persona_id: personaId,
          atributo_slug: action.atributo_slug, activo: true,
        })
        if (insErr) return { ok: false, error: `Error agregando atributo: ${insErr.message}` }
      }
      return { ok: true }
    }

    case 'agregar_deporte_secundario': {
      if (!personaId) return { ok: false, error: 'No hay persona' }
      const deporte = action.valor ?? (parsedData.deporte_secundario as string)
      if (!deporte) return { ok: true }

      // Check if disciplina already exists for this persona
      const { data: existing } = await sc.from('personas_disciplinas')
        .select('id').eq('persona_id', personaId)
        .eq('disciplina_slug', deporte).eq('activo', true).maybeSingle()
      if (!existing) {
        await sc.from('personas_disciplinas').insert({
          tenant_id: TENANT_ID, persona_id: personaId,
          disciplina_slug: deporte, es_principal: false, activo: true,
        })
      }
      return { ok: true }
    }

    case 'crear_persona_nueva': {
      const campos: Record<string, unknown> = {
        tenant_id: TENANT_ID, estado: 'activo', ...action.campos_default,
      }
      for (const [campo, valor] of Object.entries(parsedData)) {
        if (PERSONA_FIELDS.has(campo) && valor !== null && valor !== undefined && valor !== '') {
          campos[campo] = valor
        }
      }
      if (!campos.nombre || !campos.apellido) {
        return { ok: false, error: 'Nombre y apellido requeridos para crear persona' }
      }

      const { data: newPersona, error: createErr } = await sc
        .from('personas').insert(campos).select('id').single()
      if (createErr || !newPersona) return { ok: false, error: `Error creando persona: ${createErr?.message}` }

      await sc.from('import_rows').update({ persona_id: newPersona.id }).eq('id', rowId)

      if (action.atributos_iniciales?.length) {
        for (const slug of action.atributos_iniciales) {
          await sc.from('personas_atributos').insert({
            tenant_id: TENANT_ID, persona_id: newPersona.id, atributo_slug: slug, activo: true,
          })
        }
      }

      // If import data includes a disciplina, insert into personas_disciplinas
      const deporteSlug = parsedData.deporte_principal_slug as string | undefined
      if (deporteSlug) {
        await sc.from('personas_disciplinas').insert({
          tenant_id: TENANT_ID, persona_id: newPersona.id,
          disciplina_slug: deporteSlug, es_principal: true, activo: true,
        })
      }
      return { ok: true }
    }

    case 'insertar_personas_equipos': {
      if (!personaId) {
        // Re-read persona_id (might have been set by crear_persona_nueva)
        const { data: fresh } = await sc.from('import_rows').select('persona_id').eq('id', rowId).single()
        personaId = fresh?.persona_id ?? null
      }
      if (!personaId) return { ok: false, error: 'No hay persona para asignar a equipo' }

      // Resolve equipo name from parsed_data
      const resolverPath = action.equipo_resolver ?? ''
      const campo = resolverPath.startsWith('from_parsed.') ? resolverPath.slice('from_parsed.'.length) : resolverPath
      const equipoNombre = String(parsedData[campo] ?? '').trim()
      if (!equipoNombre) return { ok: false, error: 'Nombre de equipo vacío' }

      const disciplina = String(pipelineConfig.disciplina_default ?? 'futbol')

      // Call SQL function
      const { data: equipoResult, error: eqErr } = await sc.rpc('resolver_o_crear_equipo', {
        p_tenant_id: TENANT_ID,
        p_nombre: equipoNombre,
        p_disciplina: disciplina,
        p_run_id: runId,
      })

      if (eqErr || !equipoResult || equipoResult.length === 0) {
        return { ok: false, error: `Error resolviendo equipo: ${eqErr?.message ?? 'sin resultado'}` }
      }

      const eq = equipoResult[0] as { equipo_id: string; fue_creado: boolean; requiere_revision: boolean }

      // Direct DB check — don't trust resolver return value for requiere_revision
      // (can be stale if equipo was just created/approved in same batch)
      const { data: equipoCheck } = await sc.from('equipos')
        .select('requiere_revision')
        .eq('id', eq.equipo_id)
        .single()

      if (equipoCheck?.requiere_revision === true) {
        // Don't insert yet — mark row as pending team review
        await sc.from('import_rows').update({
          apply_status: 'pendiente_revision_equipo',
          apply_notas: `Equipo "${equipoNombre}" pendiente de aprobación`,
        }).eq('id', rowId)
        return { ok: true, pendiente_equipo: true }
      }

      // Insert into personas_equipos if not exists
      const rolSlug = String(pipelineConfig.rol_equipo_default ?? 'jugador')
      const { data: existingPE } = await sc.from('personas_equipos')
        .select('id').eq('tenant_id', TENANT_ID)
        .eq('persona_id', personaId).eq('equipo_id', eq.equipo_id)
        .eq('rol_equipo_slug', rolSlug).eq('activo', true).maybeSingle()

      if (!existingPE) {
        const { error: peErr } = await sc.from('personas_equipos').insert({
          tenant_id: TENANT_ID, persona_id: personaId, equipo_id: eq.equipo_id,
          rol_equipo_slug: rolSlug, fecha_inicio: new Date().toISOString().split('T')[0], activo: true,
        })
        if (peErr) return { ok: false, error: `Error asignando equipo: ${peErr.message}` }
      }
      return { ok: true }
    }

    case 'crear_suscripcion': {
      if (!personaId) return { ok: false, error: 'No hay persona para crear suscripción' }
      if (!action.plan_slug) return { ok: false, error: 'plan_slug requerido' }

      // Resolve plan by metadata->>'slug'
      const { data: plan } = await sc.from('cuotas_planes')
        .select('id, monto')
        .eq('tenant_id', TENANT_ID)
        .eq('activo', true)
        .filter('metadata->>slug', 'eq', action.plan_slug)
        .maybeSingle()

      if (!plan) return { ok: false, error: `Plan "${action.plan_slug}" no encontrado` }

      // Parse monto from parsed_data if available
      const montoRaw = parsedData.monto as string | number | undefined
      const montoPactado = montoRaw ? parseFloat(String(montoRaw)) : null

      // Check if active subscription already exists (partial unique index handles this too)
      const { data: existingSub } = await sc.from('suscripciones')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', personaId)
        .eq('plan_id', plan.id)
        .is('fecha_baja', null)
        .maybeSingle()

      if (!existingSub) {
        const { error: subErr } = await sc.from('suscripciones').insert({
          tenant_id: TENANT_ID,
          persona_id: personaId,
          plan_id: plan.id,
          estado: 'activa',
          fecha_alta: new Date().toISOString().split('T')[0],
          monto_pactado: montoPactado && !isNaN(montoPactado) && montoPactado > 0 ? montoPactado : null,
          origen: 'import',
        })
        if (subErr) return { ok: false, error: `Error creando suscripción: ${subErr.message}` }
      }
      return { ok: true }
    }

    default:
      return { ok: false, error: `Acción desconocida: ${action.tipo}` }
  }
}

function evaluateTrigger(trigger: string, matchStatus: string): boolean {
  const inMatch = trigger.match(/match_status\s+IN\s*\(([^)]+)\)/i)
  if (inMatch) {
    const values = inMatch[1].split(',').map(v => v.trim().replace(/'/g, ''))
    return values.includes(matchStatus)
  }
  const eqMatch = trigger.match(/match_status\s*=\s*'([^']+)'/i)
  if (eqMatch) return matchStatus === eqMatch[1]
  return false
}

export async function aplicarRun(runId: string): Promise<ActionResult> {
  const sc = getServiceClient()

  const { data: run, error: runErr } = await sc
    .from('import_runs').select('*, import_pipelines(*)').eq('id', runId).eq('tenant_id', TENANT_ID).single()
  if (runErr || !run) return { ok: false, message: 'Run no encontrado' }

  const pipelineRaw = run.import_pipelines
  const pipeline = (Array.isArray(pipelineRaw) ? pipelineRaw[0] : pipelineRaw) as Pipeline | null
  if (!pipeline) return { ok: false, message: 'Pipeline no encontrado' }

  const applyRules = (pipeline.apply_rules ?? []) as ApplyRule[]
  if (applyRules.length === 0) return { ok: false, message: 'El pipeline no tiene apply_rules configuradas' }

  await sc.from('import_runs').update({ estado: 'aplicando' }).eq('id', runId)

  const { data: rows, error: rowsErr } = await sc
    .from('import_rows').select('id, match_status, persona_id, parsed_data')
    .eq('run_id', runId)
    .in('apply_status', ['pendiente', 'pendiente_revision_equipo', 'fallado'])
    .in('match_status', ['exacto', 'auto_fuzzy', 'manual_review', 'sin_match'])
    .order('numero_fila')

  if (rowsErr || !rows) {
    await sc.from('import_runs').update({ estado: 'fallado', error_mensaje: rowsErr?.message }).eq('id', runId)
    return { ok: false, message: `Error leyendo filas: ${rowsErr?.message}` }
  }

  let aplicados = 0, fallados = 0, pendientes_equipo = 0

  for (const row of rows) {
    const pd = (row.parsed_data ?? {}) as Record<string, unknown>
    let rowFailed = false
    let rowPendienteEquipo = false
    const errors: string[] = []

    for (const rule of applyRules) {
      if (!evaluateTrigger(rule.trigger, row.match_status)) continue
      for (const action of rule.acciones) {
        let currentPersonaId = row.persona_id
        if (action.tipo !== 'crear_persona_nueva') {
          const { data: fresh } = await sc.from('import_rows').select('persona_id').eq('id', row.id).single()
          currentPersonaId = fresh?.persona_id ?? currentPersonaId
        }
        const result = await executeApplyAction(sc, action, currentPersonaId, pd, row.id, runId, pipeline.config)
        if (result.pendiente_equipo) { rowPendienteEquipo = true; break }
        if (!result.ok) { errors.push(`${action.tipo}: ${result.error}`); rowFailed = true }
      }
      if (rowPendienteEquipo) break
    }

    if (rowPendienteEquipo) {
      pendientes_equipo++
    } else if (rowFailed) {
      await sc.from('import_rows').update({ apply_status: 'fallado', apply_error: errors.join('; ') }).eq('id', row.id)
      fallados++
    } else {
      await sc.from('import_rows').update({ apply_status: 'aplicado', apply_error: null }).eq('id', row.id)
      aplicados++
    }
  }

  // Auto-insertar personas en el padrón del run
  const padronId = run.padron_id as string
  if (padronId) {
    const { data: appliedRows } = await sc.from('import_rows')
      .select('persona_id')
      .eq('run_id', runId)
      .eq('apply_status', 'aplicado')
      .not('persona_id', 'is', null)

    let padronInserted = 0
    for (const r of appliedRows ?? []) {
      if (!r.persona_id) continue
      const { data: existing } = await sc.from('personas_padrones')
        .select('id, activo')
        .eq('padron_id', padronId)
        .eq('persona_id', r.persona_id)
        .maybeSingle()

      if (existing?.activo) continue

      if (existing && !existing.activo) {
        await sc.from('personas_padrones').update({
          activo: true,
          fecha_alta: new Date().toISOString().split('T')[0],
          origen_alta: 'import_run',
        }).eq('id', existing.id)
        padronInserted++
      } else {
        const { error: ppErr } = await sc.from('personas_padrones').insert({
          tenant_id: TENANT_ID,
          persona_id: r.persona_id,
          padron_id: padronId,
          fecha_alta: new Date().toISOString().split('T')[0],
          activo: true,
          origen_alta: 'import_run',
        })
        if (!ppErr) padronInserted++
      }
    }
    if (padronInserted > 0) {
      revalidatePath(`/admin/padrones/${padronId}`)
    }
  }

  const resumen = { ...(run.resumen as Record<string, number> ?? {}), aplicados, fallados, pendientes_equipo }
  const estado = pendientes_equipo > 0 ? 'revisando' : (fallados > 0 && aplicados === 0 ? 'fallado' : 'aplicado')

  await sc.from('import_runs').update({
    estado, fecha_fin: pendientes_equipo > 0 ? null : new Date().toISOString(), resumen,
  }).eq('id', runId)

  revalidatePath('/admin/padrones')
  return {
    ok: true,
    message: `Aplicación: ${aplicados} aplicados, ${fallados} fallados, ${pendientes_equipo} pendientes equipo`,
    data: resumen,
  }
}

// ═══════════════════════════════════════════════════════════════
// Gestión de equipos pendientes
// ═══════════════════════════════════════════════════════════════

export async function listarEquiposPendientesPorRun(runId: string) {
  const sc = getServiceClient()
  const { data: equipos } = await sc
    .from('import_pending_teams_v')
    .select('*')
    .eq('run_id', runId)
    .eq('tenant_id', TENANT_ID)
    .order('nombre')

  // Count rows per equipo
  const result = []
  for (const eq of equipos ?? []) {
    const { count } = await sc
      .from('import_rows')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', runId)
      .contains('parsed_data', { equipo_nombre: eq.nombre })

    result.push({ ...eq, filas_count: count ?? 0 })
  }
  return result
}

export async function aprobarEquipoPendiente(
  equipoId: string,
  opciones?: { nuevoNombre?: string }
): Promise<ActionResult> {
  const sc = getServiceClient()
  const updates: Record<string, unknown> = { requiere_revision: false }
  if (opciones?.nuevoNombre) updates.nombre = opciones.nuevoNombre.trim()

  const { error } = await sc.from('equipos').update(updates).eq('id', equipoId)
  if (error) return { ok: false, message: `Error aprobando equipo: ${error.message}` }

  revalidatePath('/admin/padrones')
  return { ok: true, message: 'Equipo aprobado' }
}

export async function rechazarEquipoPendiente(
  equipoId: string,
  opciones?: { filasAccion: 'descartar' | 'pendientes' }
): Promise<ActionResult> {
  const sc = getServiceClient()

  // Get run_id before deactivating
  const { data: equipo } = await sc.from('equipos').select('created_via_import_run, nombre').eq('id', equipoId).single()

  // Soft delete equipo
  await sc.from('equipos').update({ activo: false, requiere_revision: false }).eq('id', equipoId)

  if (equipo?.created_via_import_run && opciones?.filasAccion === 'descartar') {
    // Mark rows as descartado
    const { data: rows } = await sc.from('import_rows')
      .select('id')
      .eq('run_id', equipo.created_via_import_run)
      .eq('apply_status', 'pendiente_revision_equipo')
      .contains('parsed_data', { equipo_nombre: equipo.nombre })

    for (const r of rows ?? []) {
      await sc.from('import_rows').update({
        apply_status: 'descartado', apply_notas: 'Equipo rechazado',
      }).eq('id', r.id)
    }
  }

  revalidatePath('/admin/padrones')
  return { ok: true, message: 'Equipo rechazado' }
}

export async function aprobarTodosEquiposPorRun(runId: string): Promise<ActionResult> {
  const sc = getServiceClient()
  const { error } = await sc.from('equipos')
    .update({ requiere_revision: false })
    .eq('created_via_import_run', runId)
    .eq('requiere_revision', true)

  if (error) return { ok: false, message: error.message }
  revalidatePath('/admin/padrones')
  return { ok: true, message: 'Todos los equipos aprobados' }
}

// ═══════════════════════════════════════════════════════════════
// Queries para UI
// ═══════════════════════════════════════════════════════════════

export async function obtenerPipelines() {
  const sc = getServiceClient()
  const { data } = await sc.from('import_pipelines')
    .select('slug, nombre, descripcion, parser_strategy')
    .eq('tenant_id', TENANT_ID).eq('activo', true).order('nombre')
  return data ?? []
}

export async function obtenerRuns(filtros?: { estado?: string; pipelineSlug?: string; padronId?: string }) {
  const sc = getServiceClient()
  let query = sc.from('import_runs')
    .select('*, import_pipelines(nombre)')
    .eq('tenant_id', TENANT_ID)
    .order('fecha_inicio', { ascending: false })
    .limit(50)

  if (filtros?.estado) query = query.eq('estado', filtros.estado)
  if (filtros?.pipelineSlug) query = query.eq('pipeline_slug', filtros.pipelineSlug)
  if (filtros?.padronId) query = query.eq('padron_id', filtros.padronId)

  const { data } = await query
  return data ?? []
}

export async function obtenerRun(runId: string) {
  const sc = getServiceClient()
  const { data } = await sc.from('import_runs')
    .select('*, import_pipelines(*)')
    .eq('id', runId).eq('tenant_id', TENANT_ID).single()
  return data
}

export async function obtenerRowsDeRun(
  runId: string,
  filtros?: { matchStatus?: string; applyStatus?: string; page?: number; pageSize?: number }
) {
  const sc = getServiceClient()
  const page = filtros?.page ?? 1
  const pageSize = filtros?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = sc.from('import_rows')
    .select('*', { count: 'exact' })
    .eq('run_id', runId)
    .order('numero_fila')
    .range(from, to)

  if (filtros?.matchStatus) query = query.eq('match_status', filtros.matchStatus)
  if (filtros?.applyStatus) query = query.eq('apply_status', filtros.applyStatus)

  const { data, count } = await query
  return { rows: data ?? [], total: count ?? 0 }
}

export async function obtenerConteosRun(runId: string) {
  const sc = getServiceClient()
  const statuses = ['exacto', 'auto_fuzzy', 'revisar', 'sin_match', 'manual_review', 'error', 'aplicado', 'descartado'] as const
  const counts: Record<string, number> = {}

  for (const st of statuses) {
    const { count } = await sc.from('import_rows')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', runId).eq('match_status', st)
    counts[st] = count ?? 0
  }

  // Also count apply statuses
  for (const st of ['pendiente', 'aplicado', 'fallado', 'descartado', 'pendiente_revision_equipo'] as const) {
    const { count } = await sc.from('import_rows')
      .select('id', { count: 'exact', head: true })
      .eq('run_id', runId).eq('apply_status', st)
    counts[`apply_${st}`] = count ?? 0
  }

  return counts
}

// ═══════════════════════════════════════════════════════════════
// Bulk actions
// ═══════════════════════════════════════════════════════════════

export async function resolverBulk(
  runId: string,
  matchStatus: string,
  decision: 'aceptar_top' | 'crear_nueva' | 'descartar'
): Promise<ActionResult> {
  const sc = getServiceClient()
  const { data: rows } = await sc.from('import_rows')
    .select('id, candidatos')
    .eq('run_id', runId).eq('match_status', matchStatus)
    .eq('apply_status', 'pendiente')

  if (!rows || rows.length === 0) return { ok: true, message: 'No hay filas para resolver' }

  let resueltas = 0
  for (const row of rows) {
    const cands = (row.candidatos ?? []) as MatchCandidate[]
    if (decision === 'aceptar_top' && cands.length > 0) {
      await sc.from('import_rows').update({
        persona_id: cands[0].persona_id, match_status: 'manual_review',
      }).eq('id', row.id)
      resueltas++
    } else if (decision === 'crear_nueva') {
      await sc.from('import_rows').update({ persona_id: null, match_status: 'sin_match', notas_revisor: 'confirmado_crear' }).eq('id', row.id)
      resueltas++
    } else if (decision === 'descartar') {
      await sc.from('import_rows').update({ apply_status: 'descartado' }).eq('id', row.id)
      resueltas++
    }
  }

  revalidatePath('/admin/padrones')
  return { ok: true, message: `${resueltas} filas resueltas` }
}

// ═══════════════════════════════════════════════════════════════
// rollbackRun (STUB)
// ═══════════════════════════════════════════════════════════════

export async function rollbackRun(_runId: string): Promise<ActionResult> {
  return { ok: false, message: 'Rollback no implementado para imports nuevos' }
}
