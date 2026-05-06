'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FieldKey, ImportSummary } from './_lib/types'

const TENANT_ID = '62e25f3c-7c86-42f1-9b43-cdbab28dacde'

/**
 * Fetch existing personas for dedup matching.
 * Returns personas with key fields for comparison.
 */
export async function fetchPersonasParaDedup() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personas')
    .select('id, nombre, apellido, numero_documento, email_principal, telefono_principal, fecha_nacimiento, genero, direccion_calle, direccion_ciudad, direccion_provincia, cuil_cuit')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('apellido')

  if (error) throw error
  return data ?? []
}

/**
 * Fetch catalogs needed for the import (tipos_socio, estados_padron).
 */
export async function fetchCatalogosImport(padronId: string) {
  const supabase = await createClient()

  const [tiposSocio, estadosPadron, padron] = await Promise.all([
    supabase
      .from('catalogo_tipos_socio')
      .select('id, slug, nombre')
      .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
      .eq('activo', true)
      .order('orden'),
    supabase
      .from('catalogo_estados_padron')
      .select('id, slug, nombre')
      .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
      .eq('activo', true)
      .order('orden'),
    supabase
      .from('padrones')
      .select('id, nombre, slug, tipo')
      .eq('id', padronId)
      .eq('tenant_id', TENANT_ID)
      .single(),
  ])

  return {
    tiposSocio: tiposSocio.data ?? [],
    estadosPadron: estadosPadron.data ?? [],
    padron: padron.data,
  }
}

interface ImportRowData {
  data: Partial<Record<FieldKey, string>>
  unmappedData: Record<string, string>
  action: 'crear' | 'vincular' | 'vincular_y_actualizar' | 'omitir'
  matchedPersonaId: string | null
  fieldsToUpdate: { field: string; value: string }[]
}

/**
 * Execute the import: create personas, link to padron, update fields.
 */
export async function ejecutarImport(
  padronId: string,
  rows: ImportRowData[]
): Promise<ImportSummary> {
  const supabase = await createClient()

  const summary: ImportSummary = {
    total: rows.length,
    nuevas: 0,
    vinculadas: 0,
    actualizadas: 0,
    errores: 0,
    detalleErrores: [],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (row.action === 'omitir') continue

    try {
      let personaId: string

      if (row.action === 'crear') {
        // Create new persona
        const insertData: Record<string, unknown> = {
          tenant_id: TENANT_ID,
          nombre: row.data.nombre?.trim() || 'Sin nombre',
          apellido: row.data.apellido?.trim() || 'Sin apellido',
          fuente_origen: 'sync_padron_externo',
        }

        // Map optional fields
        if (row.data.numero_documento) insertData.numero_documento = row.data.numero_documento.replace(/[\.\-\s]/g, '')
        if (row.data.tipo_documento) insertData.tipo_documento = row.data.tipo_documento
        if (row.data.email_principal) insertData.email_principal = row.data.email_principal
        if (row.data.telefono_principal) insertData.telefono_principal = row.data.telefono_principal
        if (row.data.fecha_nacimiento) insertData.fecha_nacimiento = parseDateValue(row.data.fecha_nacimiento)
        if (row.data.genero) insertData.genero = normalizeGenero(row.data.genero)
        if (row.data.cuil_cuit) insertData.cuil_cuit = row.data.cuil_cuit
        if (row.data.nacionalidad) insertData.nacionalidad = row.data.nacionalidad
        if (row.data.direccion_calle) insertData.direccion_calle = row.data.direccion_calle
        if (row.data.direccion_numero) insertData.direccion_numero = row.data.direccion_numero
        if (row.data.direccion_ciudad) insertData.direccion_ciudad = row.data.direccion_ciudad
        if (row.data.direccion_provincia) insertData.direccion_provincia = row.data.direccion_provincia
        if (row.data.direccion_codigo_postal) insertData.direccion_codigo_postal = row.data.direccion_codigo_postal

        // Store unmapped data in metadata
        if (Object.keys(row.unmappedData).length > 0) {
          insertData.metadata = { import_extra: row.unmappedData }
        }

        const { data: newPersona, error: insertError } = await supabase
          .from('personas')
          .insert(insertData)
          .select('id')
          .single()

        if (insertError) {
          summary.errores++
          summary.detalleErrores.push({ row: i + 1, message: insertError.message })
          continue
        }

        personaId = newPersona.id
        summary.nuevas++
      } else {
        // Vincular (con o sin actualizar)
        personaId = row.matchedPersonaId!

        if (row.action === 'vincular_y_actualizar' && row.fieldsToUpdate.length > 0) {
          const updateData: Record<string, unknown> = {}
          for (const { field, value } of row.fieldsToUpdate) {
            if (field === 'fecha_nacimiento') {
              updateData[field] = parseDateValue(value)
            } else if (field === 'genero') {
              updateData[field] = normalizeGenero(value)
            } else {
              updateData[field] = value
            }
          }

          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('personas')
              .update(updateData)
              .eq('id', personaId)
              .eq('tenant_id', TENANT_ID)

            if (updateError) {
              summary.detalleErrores.push({ row: i + 1, message: `Update: ${updateError.message}` })
            } else {
              summary.actualizadas++
            }
          }
        }

        summary.vinculadas++
      }

      // Link to padron
      const { data: existing } = await supabase
        .from('personas_padrones')
        .select('id, activo')
        .eq('padron_id', padronId)
        .eq('persona_id', personaId)
        .maybeSingle()

      if (existing && existing.activo) {
        // Already linked, skip
        continue
      }

      if (existing && !existing.activo) {
        // Reactivate
        await supabase
          .from('personas_padrones')
          .update({
            activo: true,
            numero_socio: row.data.numero_socio || null,
            fecha_alta: new Date().toISOString().split('T')[0],
            origen_alta: 'sync_padron_externo',
          })
          .eq('id', existing.id)
      } else {
        // Create new link
        await supabase.from('personas_padrones').insert({
          tenant_id: TENANT_ID,
          padron_id: padronId,
          persona_id: personaId,
          numero_socio: row.data.numero_socio || null,
          fecha_alta: new Date().toISOString().split('T')[0],
          origen_alta: 'sync_padron_externo',
          activo: true,
        })
      }
    } catch (err) {
      summary.errores++
      summary.detalleErrores.push({
        row: i + 1,
        message: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  revalidatePath(`/admin/padrones/${padronId}`)
  revalidatePath('/admin/padrones')
  revalidatePath('/admin/personas')

  return summary
}

// --- Helpers ---

function parseDateValue(value: string): string | null {
  if (!value) return null

  // Try DD/MM/YYYY or DD-MM-YYYY
  const dmy = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }

  // Try YYYY-MM-DD (already ISO)
  const iso = value.match(/^\d{4}-\d{2}-\d{2}$/)
  if (iso) return value

  return null
}

function normalizeGenero(value: string): string | null {
  const v = value.toLowerCase().trim()
  if (['m', 'masculino', 'male', 'hombre', 'varon', 'varón'].includes(v)) return 'masculino'
  if (['f', 'femenino', 'female', 'mujer'].includes(v)) return 'femenino'
  if (['nb', 'no binario', 'no_binario', 'non-binary'].includes(v)) return 'no_binario'
  if (['otro', 'other', 'x'].includes(v)) return 'otro'
  return null
}
