'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export async function importarEquiposBatch(
  rows: Record<string, string>[]
): Promise<{ imported: number; skipped: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient()
  let imported = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.nombre) {
      errors.push({ row: i + 1, message: 'Falta nombre del equipo' })
      continue
    }

    if (!row.disciplina_slug) {
      errors.push({ row: i + 1, message: 'Falta disciplina' })
      continue
    }

    // Dedup by name + disciplina
    const { data: existing } = await supabase
      .from('equipos')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('nombre', row.nombre.trim())
      .eq('disciplina_slug', row.disciplina_slug.trim())
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const insertData: Record<string, unknown> = {
      tenant_id: TENANT_ID,
      nombre: row.nombre.trim(),
      disciplina_slug: row.disciplina_slug.trim(),
    }

    if (row.modalidad) insertData.modalidad = row.modalidad
    if (row.color_principal) insertData.color_principal = row.color_principal

    const { error } = await supabase.from('equipos').insert(insertData)

    if (error) {
      errors.push({ row: i + 1, message: error.message })
    } else {
      imported++
    }
  }

  revalidatePath('/admin/equipos')
  return { imported, skipped, errors }
}
