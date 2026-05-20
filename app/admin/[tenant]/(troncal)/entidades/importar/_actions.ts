'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'


export async function importarEntidadesBatch(
  rows: Record<string, string>[]
): Promise<{ imported: number; skipped: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient()
  let imported = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.nombre) {
      errors.push({ row: i + 1, message: 'Falta nombre' })
      continue
    }

    if (!row.tipo) {
      errors.push({ row: i + 1, message: 'Falta tipo' })
      continue
    }

    const slug = row.nombre.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')

    // Dedup by slug
    const { data: existing } = await supabase
      .from('entidades')
      .select('id')
      .eq('tenant_id', TENANT_ID)
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const insertData: Record<string, unknown> = {
      tenant_id: TENANT_ID,
      nombre: row.nombre.trim(),
      slug,
      tipo: row.tipo.trim().toLowerCase(),
    }

    if (row.telefono) insertData.telefono = row.telefono
    if (row.email) insertData.email = row.email
    if (row.sitio_web) insertData.sitio_web = row.sitio_web
    if (row.cuit) insertData.cuit = row.cuit

    const { error } = await supabase.from('entidades').insert(insertData)

    if (error) {
      errors.push({ row: i + 1, message: error.message })
    } else {
      imported++
    }
  }

  revalidatePath('/admin/entidades')
  return { imported, skipped, errors }
}
