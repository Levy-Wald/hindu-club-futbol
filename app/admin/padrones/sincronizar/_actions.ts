'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { parsearFilaPadron, type FilaPadronParseada } from '@/lib/padron-sync/parsers'
import { generarDiffs, type DiffItem } from '@/lib/padron-sync/processor'
import { getPersonasParaSync } from './_lib/queries'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

// Keywords que identifican filas de encabezado de datos
const HEADER_KEYWORDS = [
  'nombre', 'apellido', 'dni', 'documento', 'socio', 'fecha', 'categoria',
  'categoría', 'actividad', 'email', 'telefono', 'fechanac', 'fechaingreso',
  'nro', 'n°', 'sexo', 'genero', 'cuil', 'cuit', 'domicilio', 'localidad',
]

// Keywords que identifican filas decorativas (título, subtítulo)
const TITLE_KEYWORDS = [
  'padron', 'padrón', 'socios', 'listado', 'club', 'planilla',
  'registro', 'nomina', 'nómina', 'resumen', 'reporte',
]

/**
 * Detecta inteligentemente la fila de encabezado en un Excel.
 * Busca la fila con más keywords de header entre las primeras 15 filas.
 * Si no encuentra encabezado claro, devuelve la última fila junk antes de datos.
 */
function detectarFilaHeader(filas: unknown[][]): number {
  let bestIndex = -1
  let bestScore = 0

  const limit = Math.min(filas.length, 15)
  for (let i = 0; i < limit; i++) {
    const row = filas[i]
    if (!row) continue

    const nonEmpty = row.filter((c) => c != null && String(c).trim() !== '')
    if (nonEmpty.length < 3) continue

    const joined = nonEmpty.map((c) => String(c)).join(' ').toLowerCase()
    let score = 0

    for (const kw of HEADER_KEYWORDS) {
      if (joined.includes(kw)) score += 2
    }

    if (score > bestScore) {
      bestScore = score
      bestIndex = i
    }
  }

  // Si encontramos un header con score >= 4, usarlo
  if (bestIndex >= 0 && bestScore >= 4) return bestIndex

  // Fallback: buscar la primera fila con datos reales (DNI numérico, nombre con letras)
  for (let i = 0; i < limit; i++) {
    const row = filas[i]
    if (!row || row.length < 3) continue

    const nonEmpty = row.filter((c) => c != null && String(c).trim() !== '')
    if (nonEmpty.length < 3) continue

    // Si la fila tiene keywords de título, es decorativa
    const joined = nonEmpty.map((c) => String(c)).join(' ').toLowerCase()
    const isTitleRow = TITLE_KEYWORDS.some((kw) => joined.includes(kw))
    if (isTitleRow && nonEmpty.length <= 3) continue

    // Si algún valor parece un DNI (7-8 dígitos), es data → la fila anterior es el header
    const hasDNI = nonEmpty.some((c) => /^\d{7,8}$/.test(String(c).replace(/[\.\-\s]/g, '')))
    if (hasDNI) return Math.max(0, i - 1)
  }

  // Último fallback: asumir fila 3 (viejo default - 1)
  return Math.min(3, filas.length - 1)
}

// ============================================================
// Paso 1+2: Upload + Procesamiento
// ============================================================
export async function procesarArchivoSync(
  padronId: string,
  filas: unknown[][],
  archivoNombre: string,
  hashArchivo: string
) {
  const supabase = await createClient()

  // Check idempotencia
  const { data: existente } = await supabase
    .from('padron_syncs')
    .select('id, estado')
    .eq('tenant_id', TENANT_ID)
    .eq('hash_archivo', hashArchivo)
    .maybeSingle()

  if (existente) {
    return {
      error: `Este archivo ya fue procesado (sync ${existente.id}, estado: ${existente.estado})`,
      syncId: existente.id,
    }
  }

  // Get persona_id del usuario actual
  const { data: { session } } = await supabase.auth.getSession()
  let ejecutadoPor: string | null = null
  if (session) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    ejecutadoPor = persona?.id ?? null
  }

  // Detectar fila de encabezado y saltar rows decorativos
  const headerRowIndex = detectarFilaHeader(filas)
  const dataStartIndex = headerRowIndex + 1

  const filasParseadas: FilaPadronParseada[] = []
  for (let i = dataStartIndex; i < filas.length; i++) {
    const row = filas[i]
    if (!row || row.length < 3) continue
    const parsed = parsearFilaPadron(row, i)
    if (parsed) filasParseadas.push(parsed)
  }

  if (filasParseadas.length === 0) {
    return { error: 'No se encontraron filas válidas en el archivo' }
  }

  // Obtener personas existentes
  const personasExistentes = await getPersonasParaSync(padronId)

  // Generar diffs
  const { diffs, stats } = generarDiffs(filasParseadas, personasExistentes)

  // Crear sync record
  const { data: sync, error: syncError } = await supabase
    .from('padron_syncs')
    .insert({
      tenant_id: TENANT_ID,
      padron_id: padronId,
      archivo_origen: archivoNombre,
      hash_archivo: hashArchivo,
      ejecutado_por_persona_id: ejecutadoPor,
      estado: 'preview',
      total_filas_archivo: filasParseadas.length,
      altas_count: stats.altas,
      bajas_count: stats.bajas,
      cambios_count: stats.cambios,
      sin_cambios_count: stats.sin_cambios,
      rechazados_count: stats.rechazados,
      resumen: stats,
    })
    .select('id')
    .single()

  if (syncError) return { error: syncError.message }

  // Insertar diffs en batch
  const diffRows = diffs.map((d) => ({
    sync_id: sync.id,
    persona_id: d.persona_id,
    tipo_cambio: d.tipo_cambio,
    dni_archivo: d.dni_archivo,
    nombre_archivo: d.nombre_archivo,
    nombre_confianza: d.nombre_confianza,
    numero_socio_archivo: d.numero_socio_archivo,
    categoria_archivo: d.categoria_archivo,
    actividad_archivo: d.actividad_archivo,
    datos_antes: d.datos_antes,
    datos_despues: d.datos_despues,
    motivo_rechazo: d.motivo_rechazo,
  }))

  // Insert in batches of 500
  for (let i = 0; i < diffRows.length; i += 500) {
    const batch = diffRows.slice(i, i + 500)
    const { error: diffError } = await supabase
      .from('padron_sync_diffs')
      .insert(batch)
    if (diffError) {
      // Mark sync as failed
      await supabase
        .from('padron_syncs')
        .update({ estado: 'fallado', error_mensaje: diffError.message })
        .eq('id', sync.id)
      return { error: `Error guardando diffs: ${diffError.message}` }
    }
  }

  revalidatePath('/admin/padrones/sincronizar')
  return { success: true, syncId: sync.id, stats }
}

// ============================================================
// Paso 3: Acciones de revisión
// ============================================================
export async function actualizarEstadoRevision(
  diffIds: string[],
  estado: 'aprobado' | 'descartado' | 'pospuesto' | 'pendiente',
  razonDescarte?: string
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  let revisadoPor: string | null = null
  if (session) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    revisadoPor = persona?.id ?? null
  }

  const update: Record<string, unknown> = {
    estado_revision: estado,
    revisado_por_persona_id: revisadoPor,
    revisado_at: new Date().toISOString(),
  }
  if (razonDescarte) update.razon_descarte = razonDescarte

  // Reset descarte reason if not discarding
  if (estado !== 'descartado') update.razon_descarte = null

  for (let i = 0; i < diffIds.length; i += 100) {
    const batch = diffIds.slice(i, i + 100)
    await supabase
      .from('padron_sync_diffs')
      .update(update)
      .in('id', batch)
  }

  return { success: true, count: diffIds.length }
}

export async function editarDiff(
  diffId: string,
  updates: {
    nombre_archivo?: string
    dni_archivo?: string
    numero_socio_archivo?: string
    categoria_archivo?: string
    actividad_archivo?: string
    datos_despues?: Record<string, unknown>
    tipo_cambio?: string
    motivo_rechazo?: string | null
  }
) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  let revisadoPor: string | null = null
  if (session) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    revisadoPor = persona?.id ?? null
  }

  const { error } = await supabase
    .from('padron_sync_diffs')
    .update({
      ...updates,
      estado_revision: 'editado',
      revisado_por_persona_id: revisadoPor,
      revisado_at: new Date().toISOString(),
    })
    .eq('id', diffId)

  if (error) return { error: error.message }
  return { success: true }
}

// ============================================================
// Paso 4a: Obtener IDs de diffs a aplicar (para batching del client)
// ============================================================
export async function obtenerDiffIdsParaAplicar(syncId: string, soloAprobados = false) {
  const supabase = await createClient()

  const { data: sync } = await supabase
    .from('padron_syncs')
    .select('id, padron_id, estado')
    .eq('id', syncId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!sync) return { error: 'Sync no encontrado' }
  if (!['preview', 'revisado'].includes(sync.estado)) {
    return { error: `No se puede aplicar un sync en estado "${sync.estado}"` }
  }

  // Paginar para superar límite de 1000 de Supabase
  const allIds: string[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('padron_sync_diffs')
      .select('id')
      .eq('sync_id', syncId)
      .eq('aplicado', false)
      .in('tipo_cambio', ['alta', 'baja', 'modificacion'])
      .neq('estado_revision', 'descartado')
      .range(from, from + 999)

    if (soloAprobados) {
      query = query.in('estado_revision', ['aprobado', 'editado'])
    }

    const { data: diffs } = await query
    if (!diffs || diffs.length === 0) break
    allIds.push(...diffs.map((d) => d.id))
    if (diffs.length < 1000) break
    from += 1000
  }

  return { ids: allIds, padronId: sync.padron_id }
}

// ============================================================
// Paso 4b: Aplicar un batch de diffs (llamado repetidamente desde el client)
// Usa bulk insert para altas (rápido), fallback individual si falla.
// ============================================================
export async function aplicarSyncBatch(syncId: string, diffIds: string[]) {
  const supabase = await createClient()

  const { data: sync } = await supabase
    .from('padron_syncs')
    .select('id, padron_id, estado')
    .eq('id', syncId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!sync) return { error: 'Sync no encontrado' }

  const { data: { session } } = await supabase.auth.getSession()
  let revisadoPor: string | null = null
  if (session) {
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()
    revisadoPor = persona?.id ?? null
  }

  const { data: diffs } = await supabase
    .from('padron_sync_diffs')
    .select('*')
    .in('id', diffIds)
    .eq('aplicado', false)

  if (!diffs || diffs.length === 0) return { success: true, aplicados: 0, errores: 0 }

  // Separar por tipo
  const altas = diffs.filter((d) => d.tipo_cambio === 'alta')
  const modificaciones = diffs.filter((d) => d.tipo_cambio === 'modificacion')
  const bajas = diffs.filter((d) => d.tipo_cambio === 'baja')

  let aplicados = 0
  let errores = 0
  const now = new Date().toISOString()
  const hoy = now.split('T')[0]

  // --- ALTAS: bulk insert personas → bulk insert personas_padrones ---
  if (altas.length > 0) {
    const personasToInsert = altas.map((diff) => {
      const datos = diff.datos_despues as Record<string, string> | null
      const deportes = parsearDeportesDesdeActividad(datos?.actividad_club)
      return {
        tenant_id: TENANT_ID,
        nombre: datos?.nombre || 'Sin nombre',
        apellido: datos?.apellido || 'Sin apellido',
        numero_documento: datos?.numero_documento || null,
        fecha_nacimiento: datos?.fecha_nacimiento || null,
        deporte_principal_slug: deportes.principal,
        deportes_secundarios: deportes.secundarios.length > 0 ? deportes.secundarios : null,
        fuente_origen: 'sync_padron_externo',
      }
    })

    const { data: personasCreadas, error: bulkError } = await supabase
      .from('personas')
      .insert(personasToInsert)
      .select('id')

    if (!bulkError && personasCreadas && personasCreadas.length === altas.length) {
      // Bulk insert exitoso — crear vínculos al padrón
      const ppToInsert = altas.map((diff, idx) => {
        const datos = diff.datos_despues as Record<string, string> | null
        return {
          tenant_id: TENANT_ID,
          padron_id: sync.padron_id,
          persona_id: personasCreadas[idx].id,
          numero_socio: datos?.numero_socio || null,
          categoria_club: datos?.categoria_club || null,
          actividad_club: datos?.actividad_club || null,
          fecha_ingreso_club: datos?.fecha_ingreso_club || null,
          notas_club: datos?.notas_club || null,
          estado_club: 'activo',
          activo: true,
          fecha_alta: hoy,
          origen_alta: 'sync_padron_externo',
          ultimo_sync_id: syncId,
        }
      })

      await supabase.from('personas_padrones').insert(ppToInsert)

      // UPDATE deportes por separado (defensa contra schema cache stale que descarta campos en INSERT)
      await Promise.all(altas.map((diff, idx) => {
        const datos = diff.datos_despues as Record<string, string> | null
        const deportes = parsearDeportesDesdeActividad(datos?.actividad_club)
        if (!deportes.principal) return Promise.resolve()
        return supabase
          .from('personas')
          .update({
            deporte_principal_slug: deportes.principal,
            deportes_secundarios: deportes.secundarios.length > 0 ? deportes.secundarios : null,
          })
          .eq('id', personasCreadas[idx].id)
      }))

      // Bulk insert atributo socio_padron para todas las personas creadas
      const atributosToInsert = personasCreadas.map((p) => ({
        tenant_id: TENANT_ID,
        persona_id: p.id,
        atributo_slug: 'socio_padron',
        activo: true,
        fecha_inicio: hoy,
      }))
      const { error: attrError } = await supabase.from('personas_atributos').insert(atributosToInsert)
      if (attrError) {
        // Fallback: insertar uno a uno si el bulk falla
        for (const attr of atributosToInsert) {
          await supabase.from('personas_atributos').insert(attr)
        }
      }

      // Marcar todos los diffs del batch como aplicados en una sola query
      const altaIds = altas.map((d) => d.id)
      await supabase
        .from('padron_sync_diffs')
        .update({ aplicado: true, aplicado_at: now, revisado_por_persona_id: revisadoPor })
        .in('id', altaIds)

      // Asignar persona_id a cada diff (necesita ser individual por el mapeo 1:1)
      // Usamos Promise.all para paralelizar
      await Promise.all(altas.map((diff, i) =>
        supabase
          .from('padron_sync_diffs')
          .update({ persona_id: personasCreadas[i].id })
          .eq('id', diff.id)
      ))

      aplicados += altas.length
    } else {
      // Bulk falló (ej: DNI duplicado) → fallback individual
      for (const diff of altas) {
        try {
          await aplicarAlta(supabase, sync.padron_id, diff, syncId)
          await supabase
            .from('padron_sync_diffs')
            .update({ aplicado: true, aplicado_at: now, revisado_por_persona_id: revisadoPor })
            .eq('id', diff.id)
          aplicados++
        } catch (err) {
          errores++
          await supabase
            .from('padron_sync_diffs')
            .update({ notas: `Error: ${err instanceof Error ? err.message : 'desconocido'}` })
            .eq('id', diff.id)
        }
      }
    }
  }

  // --- MODIFICACIONES y BAJAS: individual (son pocos normalmente) ---
  for (const diff of [...modificaciones, ...bajas]) {
    try {
      if (diff.tipo_cambio === 'modificacion') {
        await aplicarModificacion(supabase, sync.padron_id, diff, syncId)
      } else {
        await aplicarBaja(supabase, sync.padron_id, diff)
      }
      await supabase
        .from('padron_sync_diffs')
        .update({ aplicado: true, aplicado_at: now, revisado_por_persona_id: revisadoPor })
        .eq('id', diff.id)
      aplicados++
    } catch (err) {
      errores++
      await supabase
        .from('padron_sync_diffs')
        .update({ notas: `Error: ${err instanceof Error ? err.message : 'desconocido'}` })
        .eq('id', diff.id)
    }
  }

  return { success: true, aplicados, errores }
}

// ============================================================
// Paso 4b.1: Progreso real desde DB (polling del client)
// ============================================================
export async function obtenerProgresoSync(syncId: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('padron_sync_diffs')
    .select('id', { count: 'exact', head: true })
    .eq('sync_id', syncId)
    .eq('aplicado', true)
  return { aplicados: count ?? 0 }
}

// ============================================================
// Paso 4c: Finalizar sync (marcar estado tras todos los batches)
// ============================================================
export async function finalizarSync(syncId: string, totalAplicados: number, totalErrores: number, dryRun = false) {
  const supabase = await createClient()

  const total = totalAplicados + totalErrores
  const tasaExito = total > 0 ? totalAplicados / total : 1

  // Detección server-side de run parcial (defensa contra dryRun perdido en serialización)
  const { count: totalDiffs } = await supabase
    .from('padron_sync_diffs')
    .select('id', { count: 'exact', head: true })
    .eq('sync_id', syncId)
  const esParcial = dryRun || (totalDiffs != null && totalAplicados < totalDiffs)

  let estado: string
  if (esParcial) {
    estado = 'preview'
  } else {
    estado = tasaExito >= 0.95 ? 'aplicado' : 'fallado'
  }

  await supabase
    .from('padron_syncs')
    .update({
      estado,
      error_mensaje: totalErrores > 0
        ? `${totalErrores} error${totalErrores !== 1 ? 'es' : ''} de ${total} (${Math.round(tasaExito * 100)}% exitoso)`
        : null,
    })
    .eq('id', syncId)

  revalidatePath('/admin/padrones/sincronizar')
  revalidatePath('/admin/padrones')
  revalidatePath('/admin/personas')

  return { success: true }
}

// ============================================================
// Paso 5: Rollback
// ============================================================
export async function rollbackSync(syncId: string) {
  const supabase = await createClient()

  const { data: sync } = await supabase
    .from('padron_syncs')
    .select('id, padron_id, estado')
    .eq('id', syncId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!sync) return { error: 'Sync no encontrado' }
  if (sync.estado !== 'aplicado') {
    return { error: `Solo se puede hacer rollback de syncs aplicados (estado actual: "${sync.estado}")` }
  }

  const { data: diffs } = await supabase
    .from('padron_sync_diffs')
    .select('*')
    .eq('sync_id', syncId)
    .eq('aplicado', true)

  let revertidos = 0

  for (const diff of diffs ?? []) {
    try {
      if (diff.tipo_cambio === 'alta' && diff.persona_id) {
        // Revert alta: soft-delete persona y desvincular del padrón
        await supabase
          .from('personas_padrones')
          .update({ activo: false, estado_club: 'baja' })
          .eq('persona_id', diff.persona_id)
          .eq('padron_id', sync.padron_id)
          .eq('tenant_id', TENANT_ID)

        await supabase
          .from('personas')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', diff.persona_id)
          .eq('tenant_id', TENANT_ID)
      } else if (diff.tipo_cambio === 'modificacion' && diff.persona_id && diff.datos_antes) {
        // Revert modificación: restaurar datos anteriores en personas_padrones
        const antes = diff.datos_antes as Record<string, unknown>
        const ppUpdate: Record<string, unknown> = {}
        if ('numero_socio' in antes) ppUpdate.numero_socio = antes.numero_socio
        if ('categoria_club' in antes) ppUpdate.categoria_club = antes.categoria_club
        if ('actividad_club' in antes) ppUpdate.actividad_club = antes.actividad_club
        if ('notas_club' in antes) ppUpdate.notas_club = antes.notas_club
        if ('estado_club' in antes) ppUpdate.estado_club = antes.estado_club

        if (Object.keys(ppUpdate).length > 0) {
          await supabase
            .from('personas_padrones')
            .update(ppUpdate)
            .eq('persona_id', diff.persona_id)
            .eq('padron_id', sync.padron_id)
            .eq('tenant_id', TENANT_ID)
        }

        // Revert fecha_nacimiento si se llenó
        if ('fecha_nacimiento' in antes) {
          await supabase
            .from('personas')
            .update({ fecha_nacimiento: antes.fecha_nacimiento as string | null })
            .eq('id', diff.persona_id)
            .eq('tenant_id', TENANT_ID)
        }
      } else if (diff.tipo_cambio === 'baja' && diff.persona_id) {
        // Revert baja: reactivar en padrón
        await supabase
          .from('personas_padrones')
          .update({ activo: true, estado_club: 'activo' })
          .eq('persona_id', diff.persona_id)
          .eq('padron_id', sync.padron_id)
          .eq('tenant_id', TENANT_ID)
      }

      await supabase
        .from('padron_sync_diffs')
        .update({ aplicado: false, aplicado_at: null })
        .eq('id', diff.id)

      revertidos++
    } catch {
      // Continue with other reverts
    }
  }

  await supabase
    .from('padron_syncs')
    .update({ estado: 'rollback' })
    .eq('id', syncId)

  revalidatePath('/admin/padrones/sincronizar')
  revalidatePath('/admin/padrones')
  revalidatePath('/admin/personas')

  return { success: true, revertidos }
}

// ============================================================
// Helpers internos para aplicar cambios
// ============================================================

// Mapeo actividad_club → slug deporte
const ACTIVIDAD_DEPORTE_MAP: Record<string, string> = {
  RUGBY: 'rugby', HOCKEY: 'hockey', FUTBOL: 'futbol', FÚTBOL: 'futbol',
  GOLF: 'golf', TENIS: 'tenis', PILETA: 'natacion', NATACION: 'natacion',
  NATACIÓN: 'natacion', PADEL: 'padel', PÁDEL: 'padel', VOLEY: 'voley',
  VÓLEY: 'voley', BASKET: 'basket', BÁSQUET: 'basket', BASQUET: 'basket',
  SQUASH: 'squash', ATLETISMO: 'atletismo', POLO: 'polo', CRICKET: 'cricket',
  SOFTBOL: 'softbol',
}

function parsearDeportesDesdeActividad(actividad: string | null | undefined): {
  principal: string | null
  secundarios: string[]
} {
  if (!actividad?.trim()) return { principal: null, secundarios: [] }
  const tokens = actividad
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos para buscar
    .split(/[\/\s,;]+/)
    .filter(Boolean)

  const slugs: string[] = []
  for (const token of tokens) {
    // Buscar con acento original y sin
    const slug = ACTIVIDAD_DEPORTE_MAP[token]
      ?? ACTIVIDAD_DEPORTE_MAP[actividad.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')]
    if (slug && !slugs.includes(slug)) slugs.push(slug)
  }

  // Fallback: buscar en el string completo
  if (slugs.length === 0) {
    const upper = actividad.toUpperCase()
    for (const [key, slug] of Object.entries(ACTIVIDAD_DEPORTE_MAP)) {
      if (upper.includes(key) && !slugs.includes(slug)) slugs.push(slug)
    }
  }

  return {
    principal: slugs[0] ?? null,
    secundarios: slugs.slice(1),
  }
}

async function aplicarAlta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  padronId: string,
  diff: { id: string; datos_despues: unknown; dni_archivo: string | null },
  syncId: string
) {
  const datos = diff.datos_despues as Record<string, string> | null
  if (!datos) return

  // Parsear deportes desde actividad_club
  const deportes = parsearDeportesDesdeActividad(datos.actividad_club)

  // Crear persona
  const { data: persona, error } = await supabase
    .from('personas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: datos.nombre || 'Sin nombre',
      apellido: datos.apellido || 'Sin apellido',
      numero_documento: datos.numero_documento || null,
      fecha_nacimiento: datos.fecha_nacimiento || null,
      deporte_principal_slug: deportes.principal,
      deportes_secundarios: deportes.secundarios.length > 0 ? deportes.secundarios : null,
      fuente_origen: 'sync_padron_externo',
    })
    .select('id')
    .single()

  if (error || !persona) throw new Error(error?.message || 'Error creando persona')

  // Vincular al padrón
  await supabase.from('personas_padrones').insert({
    tenant_id: TENANT_ID,
    padron_id: padronId,
    persona_id: persona.id,
    numero_socio: datos.numero_socio || null,
    categoria_club: datos.categoria_club || null,
    actividad_club: datos.actividad_club || null,
    fecha_ingreso_club: datos.fecha_ingreso_club || null,
    notas_club: datos.notas_club || null,
    estado_club: 'activo',
    activo: true,
    fecha_alta: new Date().toISOString().split('T')[0],
    origen_alta: 'sync_padron_externo',
    ultimo_sync_id: syncId,
  })

  // Asignar atributo 'socio_padron' automáticamente
  await supabase.from('personas_atributos').insert({
    tenant_id: TENANT_ID,
    persona_id: persona.id,
    atributo_slug: 'socio_padron',
    activo: true,
    fecha_inicio: new Date().toISOString().split('T')[0],
  })

  // Update diff with persona_id
  await supabase
    .from('padron_sync_diffs')
    .update({ persona_id: persona.id })
    .eq('id', diff.id)
}

async function aplicarModificacion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  padronId: string,
  diff: { persona_id: string | null; datos_despues: unknown },
  syncId: string
) {
  if (!diff.persona_id || !diff.datos_despues) return
  const cambios = diff.datos_despues as Record<string, unknown>

  // Update personas_padrones fields
  const ppUpdate: Record<string, unknown> = { ultimo_sync_id: syncId }
  if ('numero_socio' in cambios) ppUpdate.numero_socio = cambios.numero_socio
  if ('categoria_club' in cambios) ppUpdate.categoria_club = cambios.categoria_club
  if ('actividad_club' in cambios) ppUpdate.actividad_club = cambios.actividad_club
  if ('notas_club' in cambios) ppUpdate.notas_club = cambios.notas_club
  if ('estado_club' in cambios) {
    ppUpdate.estado_club = cambios.estado_club
    if (cambios.estado_club === 'activo') ppUpdate.activo = true
  }

  // Upsert personas_padrones (may not exist if reactivating)
  const { data: existing } = await supabase
    .from('personas_padrones')
    .select('id')
    .eq('persona_id', diff.persona_id)
    .eq('padron_id', padronId)
    .eq('tenant_id', TENANT_ID)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('personas_padrones')
      .update(ppUpdate)
      .eq('id', existing.id)
  } else {
    await supabase.from('personas_padrones').insert({
      tenant_id: TENANT_ID,
      padron_id: padronId,
      persona_id: diff.persona_id,
      activo: true,
      fecha_alta: new Date().toISOString().split('T')[0],
      origen_alta: 'sync_padron_externo',
      ...ppUpdate,
    })
  }

  // Update persona fields (fecha_nacimiento)
  if ('fecha_nacimiento' in cambios) {
    await supabase
      .from('personas')
      .update({ fecha_nacimiento: cambios.fecha_nacimiento as string })
      .eq('id', diff.persona_id)
      .eq('tenant_id', TENANT_ID)
  }
}

async function aplicarBaja(
  supabase: Awaited<ReturnType<typeof createClient>>,
  padronId: string,
  diff: { persona_id: string | null }
) {
  if (!diff.persona_id) return

  await supabase
    .from('personas_padrones')
    .update({ activo: false, estado_club: 'baja', fecha_baja: new Date().toISOString().split('T')[0] })
    .eq('persona_id', diff.persona_id)
    .eq('padron_id', padronId)
    .eq('tenant_id', TENANT_ID)
}
