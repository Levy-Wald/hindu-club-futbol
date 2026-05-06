'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function importarProductosBatch(
  rows: Record<string, string>[]
): Promise<{ imported: number; skipped: number; errors: { row: number; message: string }[] }> {
  const supabase = await createClient()
  let imported = 0
  let skipped = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    if (!row.nombre) {
      errors.push({ row: i + 1, message: 'Falta nombre del producto' })
      continue
    }

    // Dedup by SKU
    if (row.sku) {
      const { data: existing } = await supabase
        .from('productos_servicios')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('sku', row.sku.trim())
        .is('deleted_at', null)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }
    }

    // Dedup by EAN13
    if (!row.sku && row.ean13) {
      const { data: existing } = await supabase
        .from('productos_servicios')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .eq('ean13', row.ean13.trim())
        .is('deleted_at', null)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }
    }

    const insertData: Record<string, unknown> = {
      tenant_id: TENANT_ID,
      nombre: row.nombre.trim(),
      tipo: normalizeTipo(row.tipo),
      activo: true,
    }

    if (row.sku) insertData.sku = row.sku.trim()
    if (row.ean13) insertData.ean13 = row.ean13.trim()
    if (row.ean14) insertData.ean14 = row.ean14.trim()
    if (row.marca) insertData.marca = row.marca.trim()
    if (row.modelo) insertData.modelo = row.modelo.trim()
    if (row.color) insertData.color = row.color.trim()
    if (row.material) insertData.material = row.material.trim()
    if (row.origen) insertData.origen = row.origen.trim()
    if (row.descripcion) insertData.descripcion = row.descripcion.trim()
    if (row.descripcion_larga) insertData.descripcion_larga = row.descripcion_larga.trim()
    if (row.unidad_medida) insertData.unidad_medida = row.unidad_medida.trim().toLowerCase()
    if (row.precio) insertData.precio = parseFloat(row.precio) || 0
    if (row.precio_compra) insertData.precio_compra = parseFloat(row.precio_compra) || null
    if (row.moneda) insertData.moneda = row.moneda.trim().toUpperCase() === 'USD' ? 'USD' : 'ARS'
    if (row.iva_venta) insertData.iva_venta = parseFloat(row.iva_venta) ?? 21
    if (row.iva_compra) insertData.iva_compra = parseFloat(row.iva_compra) ?? 21
    if (row.stock_actual) insertData.stock_actual = parseFloat(row.stock_actual) || null
    if (row.stock_minimo) insertData.stock_minimo = parseFloat(row.stock_minimo) || null
    if (row.peso_kg) insertData.peso_kg = parseFloat(row.peso_kg) || null
    if (row.instalacion) insertData.instalacion = row.instalacion.trim()

    insertData.es_arancelado = row.es_arancelado ? ['si', 'sí', '1', 'true', 'yes'].includes(row.es_arancelado.toLowerCase().trim()) : false
    insertData.es_comprable = row.es_comprable ? ['si', 'sí', '1', 'true', 'yes'].includes(row.es_comprable.toLowerCase().trim()) : false

    const { error } = await supabase.from('productos_servicios').insert(insertData)

    if (error) {
      errors.push({ row: i + 1, message: error.message })
    } else {
      imported++
    }
  }

  revalidatePath('/admin/finanzas/productos')
  return { imported, skipped, errors }
}

function normalizeTipo(value?: string): string {
  if (!value) return 'producto'
  const v = value.toLowerCase().trim()
  const valid = [
    'producto', 'servicio', 'cuota', 'actividad', 'alquiler',
    'insumo', 'activo', 'gasto', 'locker', 'cochera', 'expensa', 'multa', 'consumo',
  ]
  if (valid.includes(v)) return v
  if (v.includes('serv')) return 'servicio'
  if (v.includes('cuot')) return 'cuota'
  if (v.includes('activ')) return 'actividad'
  if (v.includes('alquil')) return 'alquiler'
  if (v.includes('insum')) return 'insumo'
  if (v.includes('gast')) return 'gasto'
  return 'producto'
}
