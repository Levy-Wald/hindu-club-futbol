'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

// -------------------------------------------------------------------
// Tipos
// -------------------------------------------------------------------

interface ProductoInput {
  nombre: string
  tipo: string
  precio: number | null
  moneda: string
  descripcion: string | null
  es_arancelado: boolean
  cuenta_ingreso: string | null
  cuenta_egreso: string | null
  centro_costo: string | null
  categoria: string | null
}

// -------------------------------------------------------------------
// Crear producto
// -------------------------------------------------------------------

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
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      precio: input.precio,
      moneda: input.moneda || 'ARS',
      descripcion: input.descripcion?.trim() || null,
      es_arancelado: input.es_arancelado,
      cuenta_ingreso: input.cuenta_ingreso?.trim() || null,
      cuenta_egreso: input.cuenta_egreso?.trim() || null,
      centro_costo: input.centro_costo?.trim() || null,
      categoria: input.categoria?.trim() || null,
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

// -------------------------------------------------------------------
// Editar producto
// -------------------------------------------------------------------

export async function editarProducto(productoId: string, input: ProductoInput) {
  const supabase = await createClient()

  if (!input.nombre.trim()) {
    return formatResult(false, 'El nombre es obligatorio')
  }

  const { error } = await supabase
    .from('productos')
    .update({
      nombre: input.nombre.trim(),
      tipo: input.tipo,
      precio: input.precio,
      moneda: input.moneda || 'ARS',
      descripcion: input.descripcion?.trim() || null,
      es_arancelado: input.es_arancelado,
      cuenta_ingreso: input.cuenta_ingreso?.trim() || null,
      cuenta_egreso: input.cuenta_egreso?.trim() || null,
      centro_costo: input.centro_costo?.trim() || null,
      categoria: input.categoria?.trim() || null,
    })
    .eq('id', productoId)
    .eq('tenant_id', TENANT_ID)

  if (error) {
    return formatResult(false, `Error al editar producto: ${error.message}`)
  }

  revalidatePath('/admin/finanzas/productos')
  return formatResult(true, 'Producto actualizado correctamente')
}

// -------------------------------------------------------------------
// Toggle activo
// -------------------------------------------------------------------

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

// -------------------------------------------------------------------
// Eliminar producto (soft delete)
// -------------------------------------------------------------------

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
