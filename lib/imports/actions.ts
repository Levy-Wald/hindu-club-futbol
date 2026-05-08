'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parseFile } from '@/app/admin/padrones/[id]/importar/_lib/parser'

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

function applyTransform(value: string, transform: string): unknown {
  const v = value?.trim() ?? ''
  switch (transform) {
    case 'identity':
      return v
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
      // Try common formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
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
    case 'split_apellido_nombre': {
      if (!v) return { apellido: '', nombre: '' }
      // "LAVAGNO JUAN MARCO" or "LAVAGNO, JUAN MARCO"
      const commaIdx = v.indexOf(',')
      if (commaIdx >= 0) {
        return {
          apellido: v.slice(0, commaIdx).trim(),
          nombre: v.slice(commaIdx + 1).trim(),
        }
      }
      // Without comma: first word is apellido, rest is nombre
      const parts = v.split(/\s+/)
      return {
        apellido: parts[0] ?? '',
        nombre: parts.slice(1).join(' ') ?? '',
      }
    }
    case 'validar_dni': {
      const clean = v.replace(/\D/g, '')
      if (!clean || clean.length < 7 || DNI_PLACEHOLDERS.has(clean)) return null
      return clean
    }
    default:
      return v
  }
}

function applyFieldMappings(
  rawRow: Record<string, string>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const parsed: Record<string, unknown> = {}

  for (const m of mappings) {
    const rawValue = rawRow[m.col_origen] ?? ''
    const transform = m.transform ?? 'identity'
    const result = applyTransform(rawValue, transform)

    if (transform === 'split_apellido_nombre' && typeof result === 'object' && result !== null) {
      // Spread into separate fields
      const { apellido, nombre } = result as { apellido: string; nombre: string }
      parsed.apellido = apellido
      parsed.nombre = nombre
    } else {
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
// 3.1 — iniciarImportRun
// ═══════════════════════════════════════════════════════════════

export async function iniciarImportRun(
  pipelineSlug: string,
  formData: FormData
): Promise<ActionResult> {
  const sc = getServiceClient()

  // Cargar pipeline
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

  // Parser strategy check
  if (pl.parser_strategy !== 'tabular') {
    return { ok: false, message: `Parser '${pl.parser_strategy}' no implementado todavía` }
  }

  // Hash para idempotencia
  const buffer = await file.arrayBuffer()
  const hash = await computeFileHash(buffer)

  // Verificar duplicado
  const { data: existingRun } = await sc
    .from('import_runs')
    .select('id, estado')
    .eq('tenant_id', TENANT_ID)
    .eq('hash_archivo', hash)
    .in('estado', ['aplicado', 'revisando'])
    .maybeSingle()

  if (existingRun) {
    return {
      ok: false,
      message: `Este archivo ya fue procesado (run ${existingRun.id}, estado: ${existingRun.estado})`,
    }
  }

  // Parsear archivo
  const parsed = await parseFile(file)
  if (parsed.totalRows === 0) {
    return { ok: false, message: 'El archivo no contiene datos' }
  }

  // Crear run
  const { data: run, error: runErr } = await sc
    .from('import_runs')
    .insert({
      tenant_id: TENANT_ID,
      pipeline_slug: pipelineSlug,
      archivo_origen: file.name,
      hash_archivo: hash,
      estado: 'matching',
      total_filas: parsed.totalRows,
      resumen: {},
    })
    .select('id')
    .single()

  if (runErr || !run) {
    return { ok: false, message: `Error creando run: ${runErr?.message ?? 'desconocido'}` }
  }

  // Convertir rows a raw_data + parsed_data usando field_mappings
  const rows = parsed.rows.map((cells, idx) => {
    const rawData: Record<string, string> = {}
    parsed.headers.forEach((h, i) => {
      rawData[h] = cells[i] ?? ''
    })

    const parsedData = applyFieldMappings(rawData, pl.field_mappings)

    return {
      run_id: run.id,
      numero_fila: idx + 1,
      raw_data: rawData,
      parsed_data: parsedData,
      match_status: 'pendiente',
      apply_status: 'pendiente',
    }
  })

  // Bulk insert en batches de 500
  const BATCH_SIZE = 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error: insertErr } = await sc.from('import_rows').insert(batch)
    if (insertErr) {
      // Marcar run como fallado
      await sc.from('import_runs').update({ estado: 'fallado', error_mensaje: insertErr.message }).eq('id', run.id)
      return { ok: false, message: `Error insertando filas: ${insertErr.message}` }
    }
  }

  return { ok: true, message: `Run creado con ${parsed.totalRows} filas`, data: { runId: run.id } }
}

// ═══════════════════════════════════════════════════════════════
// 3.2 — procesarMatching
// ═══════════════════════════════════════════════════════════════

export async function procesarMatching(runId: string): Promise<ActionResult> {
  const sc = getServiceClient()

  // Cargar run + pipeline
  const { data: run, error: runErr } = await sc
    .from('import_runs')
    .select('*, import_pipelines(*)')
    .eq('id', runId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (runErr || !run) {
    return { ok: false, message: 'Run no encontrado' }
  }

  const pipeline = (run.import_pipelines as Pipeline[])?.[0] ?? run.import_pipelines as Pipeline | null
  if (!pipeline) {
    return { ok: false, message: 'Pipeline del run no encontrado' }
  }

  const thresholds = (pipeline.match_thresholds ?? { high: 0.92, low: 0.75 }) as { high: number; low: number }

  // Obtener rows pendientes
  const { data: rows, error: rowsErr } = await sc
    .from('import_rows')
    .select('id, parsed_data')
    .eq('run_id', runId)
    .eq('match_status', 'pendiente')
    .order('numero_fila')

  if (rowsErr || !rows) {
    return { ok: false, message: `Error leyendo filas: ${rowsErr?.message}` }
  }

  const counts = { exactos: 0, auto_fuzzy: 0, revisar: 0, sin_match: 0, errores: 0 }

  for (const row of rows) {
    const pd = row.parsed_data as Record<string, unknown> | null
    if (!pd) {
      await sc.from('import_rows').update({ match_status: 'error', apply_error: 'parsed_data vacío' }).eq('id', row.id)
      counts.errores++
      continue
    }

    // Build payload for match_persona_fuzzy
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
      // Exacto (DNI match)
      await sc.from('import_rows').update({
        match_status: 'exacto',
        match_score: cands[0].score,
        match_type: cands[0].match_type,
        persona_id: cands[0].persona_id,
        candidatos: cands,
      }).eq('id', row.id)
      counts.exactos++
    } else if (
      cands[0].score >= thresholds.high &&
      (cands.length === 1 || (cands.length > 1 && cands[0].score - cands[1].score > 0.10))
    ) {
      // Auto fuzzy: top candidato está muy arriba y separado del segundo
      await sc.from('import_rows').update({
        match_status: 'auto_fuzzy',
        match_score: cands[0].score,
        match_type: cands[0].match_type,
        persona_id: cands[0].persona_id,
        candidatos: cands,
      }).eq('id', row.id)
      counts.auto_fuzzy++
    } else {
      // Revisar: hay candidatos pero no es seguro
      await sc.from('import_rows').update({
        match_status: 'revisar',
        match_score: cands[0].score,
        match_type: cands[0].match_type,
        candidatos: cands,
      }).eq('id', row.id)
      counts.revisar++
    }
  }

  // Actualizar run
  await sc.from('import_runs').update({
    estado: 'revisando',
    resumen: counts,
  }).eq('id', runId)

  return {
    ok: true,
    message: `Matching completo: ${counts.exactos} exactos, ${counts.auto_fuzzy} auto-fuzzy, ${counts.revisar} a revisar, ${counts.sin_match} sin match`,
    data: counts,
  }
}

// ═══════════════════════════════════════════════════════════════
// 3.3 — resolverCandidato
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
        persona_id: cands[0].persona_id,
        match_status: 'manual_review',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
    case 'aceptar_personaId': {
      if (!opciones?.personaId) return { ok: false, message: 'personaId requerido' }
      await sc.from('import_rows').update({
        persona_id: opciones.personaId,
        match_status: 'manual_review',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
    case 'crear_nueva': {
      await sc.from('import_rows').update({
        persona_id: null,
        match_status: 'sin_match',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
    case 'descartar': {
      await sc.from('import_rows').update({
        apply_status: 'descartado',
        notas_revisor: opciones?.notas ?? null,
      }).eq('id', rowId)
      break
    }
  }

  return { ok: true, message: `Fila resuelta: ${decision}` }
}

// ═══════════════════════════════════════════════════════════════
// 3.4 — aplicarRun
// ═══════════════════════════════════════════════════════════════

// Campos de personas válidos para enriquecer
const PERSONA_FIELDS = new Set([
  'nombre', 'apellido', 'numero_documento', 'tipo_documento', 'cuil_cuit',
  'fecha_nacimiento', 'genero', 'nacionalidad', 'email_principal', 'email_secundario',
  'telefono_principal', 'whatsapp', 'direccion_calle', 'direccion_numero',
  'direccion_ciudad', 'direccion_provincia', 'direccion_codigo_postal',
  'deporte_principal_slug', 'fecha_primera_relacion_club',
])

async function executeApplyAction(
  sc: ReturnType<typeof getServiceClient>,
  action: ApplyAction,
  personaId: string | null,
  parsedData: Record<string, unknown>,
  rowId: string
): Promise<{ ok: boolean; error?: string }> {
  switch (action.tipo) {
    case 'enriquecer_persona': {
      if (!personaId) return { ok: false, error: 'No hay persona para enriquecer' }

      // Obtener persona actual
      const { data: persona } = await sc
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single()

      if (!persona) return { ok: false, error: 'Persona no encontrada' }

      const updates: Record<string, unknown> = {}
      const conflicts: { campo: string; existente: unknown; nuevo: unknown }[] = []

      for (const [campo, valorNuevo] of Object.entries(parsedData)) {
        if (!PERSONA_FIELDS.has(campo)) continue
        if (valorNuevo === null || valorNuevo === undefined || valorNuevo === '') continue

        const valorExistente = (persona as Record<string, unknown>)[campo]

        if (valorExistente === null || valorExistente === undefined || valorExistente === '') {
          // Campo vacío: rellenar
          updates[campo] = valorNuevo
        } else if (String(valorExistente) !== String(valorNuevo)) {
          // Conflicto: valor existente distinto
          conflicts.push({ campo, existente: valorExistente, nuevo: valorNuevo })
        }
        // Si son iguales, no hacer nada
      }

      // Aplicar updates
      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await sc.from('personas').update(updates).eq('id', personaId)
        if (upErr) return { ok: false, error: `Error actualizando persona: ${upErr.message}` }
      }

      // Registrar conflictos
      for (const c of conflicts) {
        await sc.from('import_field_conflicts').insert({
          row_id: rowId,
          persona_id: personaId,
          tabla: 'personas',
          campo: c.campo,
          valor_existente: JSON.stringify(c.existente),
          valor_nuevo: JSON.stringify(c.nuevo),
        })
      }

      return { ok: true }
    }

    case 'agregar_atributo': {
      if (!personaId) return { ok: false, error: 'No hay persona para agregar atributo' }
      if (!action.atributo_slug) return { ok: false, error: 'atributo_slug requerido' }

      // Verificar si ya existe activo
      const { data: existing } = await sc
        .from('personas_atributos')
        .select('id')
        .eq('persona_id', personaId)
        .eq('atributo_slug', action.atributo_slug)
        .eq('activo', true)
        .maybeSingle()

      if (!existing) {
        const { error: insErr } = await sc.from('personas_atributos').insert({
          tenant_id: TENANT_ID,
          persona_id: personaId,
          atributo_slug: action.atributo_slug,
          activo: true,
        })
        if (insErr) return { ok: false, error: `Error agregando atributo: ${insErr.message}` }
      }

      return { ok: true }
    }

    case 'agregar_deporte_secundario': {
      if (!personaId) return { ok: false, error: 'No hay persona' }
      const deporte = action.valor ?? (parsedData.deporte_secundario as string)
      if (!deporte) return { ok: true } // nada que agregar

      const { data: persona } = await sc
        .from('personas')
        .select('deportes_secundarios')
        .eq('id', personaId)
        .single()

      const current = (persona?.deportes_secundarios ?? []) as string[]
      if (!current.includes(deporte)) {
        await sc.from('personas').update({
          deportes_secundarios: [...current, deporte],
        }).eq('id', personaId)
      }

      return { ok: true }
    }

    case 'crear_persona_nueva': {
      const campos: Record<string, unknown> = {
        tenant_id: TENANT_ID,
        estado: 'activo',
        ...action.campos_default,
      }

      // Tomar datos del parsed_data
      for (const [campo, valor] of Object.entries(parsedData)) {
        if (PERSONA_FIELDS.has(campo) && valor !== null && valor !== undefined && valor !== '') {
          campos[campo] = valor
        }
      }

      if (!campos.nombre || !campos.apellido) {
        return { ok: false, error: 'Nombre y apellido requeridos para crear persona' }
      }

      const { data: newPersona, error: createErr } = await sc
        .from('personas')
        .insert(campos)
        .select('id')
        .single()

      if (createErr || !newPersona) {
        return { ok: false, error: `Error creando persona: ${createErr?.message}` }
      }

      // Asignar persona_id al row para que las siguientes acciones lo usen
      await sc.from('import_rows').update({ persona_id: newPersona.id }).eq('id', rowId)

      // Atributos iniciales
      if (action.atributos_iniciales?.length) {
        for (const slug of action.atributos_iniciales) {
          await sc.from('personas_atributos').insert({
            tenant_id: TENANT_ID,
            persona_id: newPersona.id,
            atributo_slug: slug,
            activo: true,
          })
        }
      }

      return { ok: true }
    }

    case 'insertar_personas_equipos': {
      // STUB — requiere resolución de equipo_id
      return { ok: false, error: 'insertar_personas_equipos: auto-creación de equipo no implementada' }
    }

    default:
      return { ok: false, error: `Acción desconocida: ${action.tipo}` }
  }
}

function evaluateTrigger(trigger: string, matchStatus: string): boolean {
  // Simple DSL evaluator for trigger expressions like:
  // "match_status IN ('exacto','auto_fuzzy','manual_review')"
  // "match_status = 'sin_match'"
  const inMatch = trigger.match(/match_status\s+IN\s*\(([^)]+)\)/i)
  if (inMatch) {
    const values = inMatch[1].split(',').map(v => v.trim().replace(/'/g, ''))
    return values.includes(matchStatus)
  }

  const eqMatch = trigger.match(/match_status\s*=\s*'([^']+)'/i)
  if (eqMatch) {
    return matchStatus === eqMatch[1]
  }

  return false
}

export async function aplicarRun(runId: string): Promise<ActionResult> {
  const sc = getServiceClient()

  // Cargar run + pipeline
  const { data: run, error: runErr } = await sc
    .from('import_runs')
    .select('*, import_pipelines(*)')
    .eq('id', runId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (runErr || !run) return { ok: false, message: 'Run no encontrado' }

  const pipeline = (run.import_pipelines as Pipeline[])?.[0] ?? run.import_pipelines as Pipeline | null
  if (!pipeline) return { ok: false, message: 'Pipeline no encontrado' }

  const applyRules = (pipeline.apply_rules ?? []) as ApplyRule[]
  if (applyRules.length === 0) {
    return { ok: false, message: 'El pipeline no tiene apply_rules configuradas' }
  }

  // Marcar como aplicando
  await sc.from('import_runs').update({ estado: 'aplicando' }).eq('id', runId)

  // Obtener rows aplicables
  const { data: rows, error: rowsErr } = await sc
    .from('import_rows')
    .select('id, match_status, persona_id, parsed_data')
    .eq('run_id', runId)
    .eq('apply_status', 'pendiente')
    .in('match_status', ['exacto', 'auto_fuzzy', 'manual_review', 'sin_match'])
    .order('numero_fila')

  if (rowsErr || !rows) {
    await sc.from('import_runs').update({ estado: 'fallado', error_mensaje: rowsErr?.message }).eq('id', runId)
    return { ok: false, message: `Error leyendo filas: ${rowsErr?.message}` }
  }

  let aplicados = 0
  let fallados = 0
  let descartados = 0

  for (const row of rows) {
    const pd = (row.parsed_data ?? {}) as Record<string, unknown>
    let rowFailed = false
    const errors: string[] = []

    // Find matching rules
    for (const rule of applyRules) {
      if (!evaluateTrigger(rule.trigger, row.match_status)) continue

      for (const action of rule.acciones) {
        // For crear_persona_nueva, after creation the persona_id gets set on the row
        // Re-read persona_id for subsequent actions
        let currentPersonaId = row.persona_id
        if (action.tipo !== 'crear_persona_nueva') {
          // Re-fetch in case crear_persona_nueva set it
          const { data: fresh } = await sc.from('import_rows').select('persona_id').eq('id', row.id).single()
          currentPersonaId = fresh?.persona_id ?? currentPersonaId
        }

        const result = await executeApplyAction(sc, action, currentPersonaId, pd, row.id)
        if (!result.ok) {
          errors.push(`${action.tipo}: ${result.error}`)
          rowFailed = true
        }
      }
    }

    if (rowFailed) {
      await sc.from('import_rows').update({
        apply_status: 'fallado',
        apply_error: errors.join('; '),
      }).eq('id', row.id)
      fallados++
    } else {
      await sc.from('import_rows').update({ apply_status: 'aplicado' }).eq('id', row.id)
      aplicados++
    }
  }

  // Actualizar resumen y estado
  const resumen = { ...(run.resumen as Record<string, number> ?? {}), aplicados, fallados, descartados }
  const estado = fallados > 0 && aplicados === 0 ? 'fallado' : 'aplicado'

  await sc.from('import_runs').update({
    estado,
    fecha_fin: new Date().toISOString(),
    resumen,
  }).eq('id', runId)

  return {
    ok: true,
    message: `Aplicación completa: ${aplicados} aplicados, ${fallados} fallados`,
    data: resumen,
  }
}

// ═══════════════════════════════════════════════════════════════
// 3.5 — rollbackRun (STUB)
// ═══════════════════════════════════════════════════════════════

export async function rollbackRun(runId: string): Promise<ActionResult> {
  return { ok: false, message: 'Rollback no implementado para imports nuevos' }
}
