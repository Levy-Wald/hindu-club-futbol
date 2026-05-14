'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

interface ProductoInput {
  // Identidad
  nombre: string
  tipo: string
  sku: string | null
  ean13: string | null
  ean14: string | null
  marca: string | null
  modelo: string | null
  color: string | null
  material: string | null
  origen: string | null
  unidad_medida: string
  descripcion: string | null
  descripcion_larga: string | null
  // Precios e impuestos
  precio: number | null
  precio_compra: number | null
  moneda: string
  iva_compra: number | null
  iva_venta: number | null
  es_arancelado: boolean
  es_comprable: boolean
  // Inventario
  stock_actual: number | null
  stock_minimo: number | null
  peso_kg: number | null
  cupo_maximo: number | null
  instalacion: string | null
  // Contabilidad
  cuenta_ingreso_id: string | null
  cuenta_egreso_id: string | null
  centro_costo_id: string | null
  categoria_movimiento_id: string | null
}

export async function crearProducto(input: ProductoInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }
  if (!input.tipo) {
    return formatResult(false, 'El tipo es obligatorio')
  }

  const { data, error } = await supabase
    .from('productos')
    .insert({
      tenant_id: TENANT_ID,
      // Identidad
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      sku: input.sku?.trim() || null,
      ean13: input.ean13?.trim() || null,
      ean14: input.ean14?.trim() || null,
      marca: input.marca?.trim() || null,
      modelo: input.modelo?.trim() || null,
      color: input.color?.trim() || null,
      material: input.material?.trim() || null,
      origen: input.origen?.trim() || null,
      unidad_medida: input.unidad_medida || 'unidad',
      descripcion: input.descripcion?.trim() || null,
      descripcion_larga: input.descripcion_larga?.trim() || null,
      // Precios e impuestos
      precio: input.precio ?? 0,
      precio_compra: input.precio_compra ?? null,
      moneda: input.moneda || 'ARS',
      iva_compra: input.iva_compra ?? 21,
      iva_venta: input.iva_venta ?? 21,
      es_arancelado: input.es_arancelado,
      es_comprable: input.es_comprable,
      // Inventario
      stock_actual: input.stock_actual ?? null,
      stock_minimo: input.stock_minimo ?? null,
      peso_kg: input.peso_kg ?? null,
      cupo_maximo: input.cupo_maximo ?? null,
      instalacion: input.instalacion?.trim() || null,
      // Contabilidad
      cuenta_ingreso_id: input.cuenta_ingreso_id || null,
      cuenta_egreso_id: input.cuenta_egreso_id || null,
      centro_costo_id: input.centro_costo_id || null,
      categoria_movimiento_id: input.categoria_movimiento_id || null,
      activo: true,
    })
    .select('id')
    .single()

  if (error) {
    return formatResult(false, `Error al crear producto: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/productos')
  return formatResult(true, 'Producto creado correctamente', { id: data.id })
}

export async function editarProducto(productoId: string, input: ProductoInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const { error } = await supabase
    .from('productos')
    .update({
      // Identidad
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      sku: input.sku?.trim() || null,
      ean13: input.ean13?.trim() || null,
      ean14: input.ean14?.trim() || null,
      marca: input.marca?.trim() || null,
      modelo: input.modelo?.trim() || null,
      color: input.color?.trim() || null,
      material: input.material?.trim() || null,
      origen: input.origen?.trim() || null,
      unidad_medida: input.unidad_medida || 'unidad',
      descripcion: input.descripcion?.trim() || null,
      descripcion_larga: input.descripcion_larga?.trim() || null,
      // Precios e impuestos
      precio: input.precio ?? 0,
      precio_compra: input.precio_compra ?? null,
      moneda: input.moneda || 'ARS',
      iva_compra: input.iva_compra ?? 21,
      iva_venta: input.iva_venta ?? 21,
      es_arancelado: input.es_arancelado,
      es_comprable: input.es_comprable,
      // Inventario
      stock_actual: input.stock_actual ?? null,
      stock_minimo: input.stock_minimo ?? null,
      peso_kg: input.peso_kg ?? null,
      cupo_maximo: input.cupo_maximo ?? null,
      instalacion: input.instalacion?.trim() || null,
      // Contabilidad
      cuenta_ingreso_id: input.cuenta_ingreso_id || null,
      cuenta_egreso_id: input.cuenta_egreso_id || null,
      centro_costo_id: input.centro_costo_id || null,
      categoria_movimiento_id: input.categoria_movimiento_id || null,
    })
    .eq('id', productoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar producto: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/productos')
  return formatResult(true, 'Producto actualizado correctamente')
}

export async function toggleProductoActivo(productoId: string, activo: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('productos')
    .update({ activo })
    .eq('id', productoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al actualizar producto: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/productos')
  return formatResult(true, activo ? 'Producto activado' : 'Producto desactivado')
}

export async function eliminarProducto(productoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('productos')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', productoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al eliminar producto: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/productos')
  return formatResult(true, 'Producto eliminado correctamente')
}

export async function exportarProductos(filtros: { tipo?: string; search?: string; activo?: boolean }) {
  const supabase = await createClient()

  let query = supabase
    .from('productos')
    .select(`
      id, nombre, tipo, sku, ean13, ean14, marca, modelo, color, material, origen,
      unidad_medida, descripcion, descripcion_larga,
      precio, precio_compra, moneda, iva_compra, iva_venta,
      es_arancelado, es_comprable,
      stock_actual, stock_minimo, peso_kg, cupo_maximo, instalacion,
      activo, created_at,
      centro_costo:centros_costo(nombre),
      categoria:catalogo_categorias_movimiento(nombre),
      cuenta_ingreso:plan_cuentas!fk_productos_cuenta_ingreso(codigo, nombre),
      cuenta_egreso:plan_cuentas!fk_productos_cuenta_egreso(codigo, nombre)
    `)
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('nombre')
    .limit(5000)

  if (filtros.tipo && filtros.tipo !== 'todos') {
    query = query.eq('tipo', filtros.tipo)
  }

  if (filtros.search) {
    query = query.ilike('nombre', `%${filtros.search}%`)
  }

  const { data, error } = await query

  if (error) {
    return { ok: false as const, data: [] }
  }

  return { ok: true as const, data: data ?? [] }
}
