'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


/**
 * Import personas in batch with dedup by DNI.
 */
export async function importarPersonasBatch(
  rows: Record<string, string>[]
): Promise<{ imported: number; skipped: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient()
  let imported = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.nombre && !row.apellido) {
      errors.push({ row: i + 1, message: 'Falta nombre y apellido' })
      continue
    }

    // Dedup by DNI
    if (row.numero_documento) {
      const cleanDni = row.numero_documento.replace(/[\.\-\s]/g, '')
      const { data: existing } = await supabase
        .from('personas')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('numero_documento', cleanDni)
        .is('deleted_at', null)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }
    }

    const insertData: Record<string, unknown> = {
      tenant_id: TENANT_ID,
      nombre: row.nombre?.trim() || 'Sin nombre',
      apellido: row.apellido?.trim() || 'Sin apellido',
      fuente_origen: 'excel_bulk',
    }

    if (row.numero_documento) insertData.numero_documento = row.numero_documento.replace(/[\.\-\s]/g, '')
    if (row.tipo_documento) insertData.tipo_documento = row.tipo_documento
    if (row.email_principal) insertData.email_principal = row.email_principal
    if (row.telefono_principal) insertData.telefono_principal = row.telefono_principal
    if (row.fecha_nacimiento) insertData.fecha_nacimiento = parseDateValue(row.fecha_nacimiento)
    if (row.genero) insertData.genero = normalizeGenero(row.genero)
    if (row.cuil_cuit) insertData.cuil_cuit = row.cuil_cuit
    if (row.nacionalidad) insertData.nacionalidad = row.nacionalidad
    if (row.direccion_calle) insertData.direccion_calle = row.direccion_calle
    if (row.direccion_numero) insertData.direccion_numero = row.direccion_numero
    if (row.direccion_ciudad) insertData.direccion_ciudad = row.direccion_ciudad
    if (row.direccion_provincia) insertData.direccion_provincia = row.direccion_provincia
    if (row.direccion_codigo_postal) insertData.direccion_codigo_postal = row.direccion_codigo_postal

    const { error } = await supabase.from('personas').insert(insertData)

    if (error) {
      errors.push({ row: i + 1, message: error.message })
    } else {
      imported++
    }
  }

  revalidatePath('/admin/personas')
  return { imported, skipped, errors }
}

function parseDateValue(value: string): string | null {
  if (!value) return null
  const dmy = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  }
  const iso = value.match(/^\d{4}-\d{2}-\d{2}$/)
  if (iso) return value
  return null
}

function normalizeGenero(value: string): string | null {
  const v = value.toLowerCase().trim()
  if (['m', 'masculino', 'male', 'hombre', 'varon', 'varón'].includes(v)) return 'masculino'
  if (['f', 'femenino', 'female', 'mujer'].includes(v)) return 'femenino'
  if (['nb', 'no binario', 'no_binario'].includes(v)) return 'no_binario'
  if (['otro', 'other', 'x'].includes(v)) return 'otro'
  return null
}
