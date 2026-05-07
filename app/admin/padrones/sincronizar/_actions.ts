'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { parsearFilaPadron, type FilaPadronParseada } from '@/lib/padron-sync/parsers'
import { generarDiffs, type DiffItem } from '@/lib/padron-sync/processor'
import { getPersonasParaSync } from './_lib/queries'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

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

  // Parsear filas (saltar headers decorativos: rows 0-3)
  const filasParseadas: FilaPadronParseada[] = []
  for (let i = 4; i < filas.length; i++) {
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
// Paso 4: Aplicar sync
// ============================================================
export async function aplicarSync(syncId: string) {
  const supabase = await createClient()

  // Verificar estado
  const { data: sync } = await supabase
    .from('padron_syncs')
    .select('id, padron_id, estado')
    .eq('id', syncId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!sync) return { error: 'Sync no encontrado' }
  if (sync.estado !== 'preview' && sync.estado !== 'revisado') {
    return { error: `No se puede aplicar un sync en estado "${sync.estado}"` }
  }

  // Get persona_id for revisado_por
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

  // Get all diffs that need to be applied
  const { data: diffs } = await supabase
    .from('padron_sync_diffs')
    .select('*')
    .eq('sync_id', syncId)
    .eq('aplicado', false)
    .in('tipo_cambio', ['alta', 'baja', 'modificacion'])

  let aplicados = 0
  let errores = 0

  for (const diff of diffs ?? []) {
    try {
      if (diff.tipo_cambio === 'alta') {
        await aplicarAlta(supabase, sync.padron_id, diff, syncId)
      } else if (diff.tipo_cambio === 'modificacion') {
        await aplicarModificacion(supabase, sync.padron_id, diff, syncId)
      } else if (diff.tipo_cambio === 'baja') {
        await aplicarBaja(supabase, sync.padron_id, diff)
      }

      // Marcar diff como aplicado
      await supabase
        .from('padron_sync_diffs')
        .update({
          aplicado: true,
          aplicado_at: new Date().toISOString(),
          revisado_por_persona_id: revisadoPor,
        })
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

  // Update sync status
  await supabase
    .from('padron_syncs')
    .update({
      estado: errores > 0 ? 'fallado' : 'aplicado',
      error_mensaje: errores > 0 ? `${errores} errores al aplicar` : null,
    })
    .eq('id', syncId)

  revalidatePath('/admin/padrones/sincronizar')
  revalidatePath('/admin/padrones')
  revalidatePath('/admin/personas')

  return { success: true, aplicados, errores }
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

async function aplicarAlta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  padronId: string,
  diff: { id: string; datos_despues: unknown; dni_archivo: string | null },
  syncId: string
) {
  const datos = diff.datos_despues as Record<string, string> | null
  if (!datos) return

  // Crear persona
  const { data: persona, error } = await supabase
    .from('personas')
    .insert({
      tenant_id: TENANT_ID,
      nombre: datos.nombre || 'Sin nombre',
      apellido: datos.apellido || 'Sin apellido',
      numero_documento: datos.numero_documento || null,
      fecha_nacimiento: datos.fecha_nacimiento || null,
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
