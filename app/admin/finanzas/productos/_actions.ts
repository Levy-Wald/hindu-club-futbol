'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

interface ProductoInput {
  nombre: string
  tipo: string
  precio: number | null
  moneda: string
  descripcion: string | null
  es_arancelado: boolean
  es_comprable: boolean
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
    .from('productos_servicios')
    .insert({
      tenant_id: TENANT_ID,
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      precio: input.precio ?? 0,
      moneda: input.moneda || 'ARS',
      descripcion: input.descripcion?.trim() || null,
      es_arancelado: input.es_arancelado,
      es_comprable: input.es_comprable,
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
    .from('productos_servicios')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      precio: input.precio ?? 0,
      moneda: input.moneda || 'ARS',
      descripcion: input.descripcion?.trim() || null,
      es_arancelado: input.es_arancelado,
      es_comprable: input.es_comprable,
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
    .from('productos_servicios')
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
    .from('productos_servicios')
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
    .from('productos_servicios')
    .select(`
      id, nombre, tipo, precio, moneda, descripcion, es_arancelado, es_comprable, activo, created_at,
      centro_costo:centros_costo(nombre),
      categoria:catalogo_categorias_movimiento(nombre),
      cuenta_ingreso:plan_cuentas!productos_servicios_cuenta_ingreso_id_fkey(codigo, nombre),
      cuenta_egreso:plan_cuentas!productos_servicios_cuenta_egreso_id_fkey(codigo, nombre)
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
