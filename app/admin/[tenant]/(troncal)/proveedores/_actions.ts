'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { slugify } from '@/lib/slugify'

// F1.13 — Proveedores. Un proveedor es una `entidad` tipo='proveedor'. El alta
// crea además su cuenta corriente (tipo 'proveedor', saldo 0) para que la ficha
// tenga estado financiero desde el día cero.

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

interface DireccionInput {
  calle?: string
  numero?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  pais?: string
}

interface CrearProveedorInput {
  nombre: string
  cuit?: string
  razon_social?: string
  telefono?: string
  email?: string
  sitio_web?: string
  direccion?: DireccionInput
}

export async function crearProveedor(input: CrearProveedorInput) {
  const supabase = await createClient()

  const slug = slugify(input.nombre)

  const { data, error } = await supabase
    .from('entidades')
    .insert({
      tenant_id: TENANT_ID,
      tipo: 'proveedor',
      nombre: input.nombre.trim(),
      slug,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      sitio_web: input.sitio_web?.trim() || null,
      cuit: input.cuit?.trim() || null,
      razon_social: input.razon_social?.trim() || null,
      direccion: input.direccion ?? null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505' && error.message.includes('slug')) {
      return formatResult(false, 'Ya existe una entidad con ese nombre.')
    }
    return formatResult(false, error.message)
  }

  // Cuenta corriente del proveedor (no bloqueante: si falla, el proveedor queda igual creado).
  await supabase.from('cuentas_corrientes').insert({
    tenant_id: TENANT_ID,
    entidad_id: data.id,
    tipo: 'proveedor',
    saldo: 0,
    activa: true,
  })

  revalidatePath('/admin/proveedores')
  return formatResult(true, 'Proveedor creado', data)
}

interface EditarProveedorInput {
  nombre?: string
  cuit?: string
  razon_social?: string
  telefono?: string
  email?: string
  sitio_web?: string
  direccion?: DireccionInput
}

export async function editarProveedor(id: string, input: EditarProveedorInput) {
  const supabase = await createClient()

  const clean: Record<string, unknown> = {}
  if (input.nombre) {
    clean.nombre = input.nombre.trim()
    clean.slug = slugify(input.nombre)
  }
  if (input.cuit !== undefined) clean.cuit = input.cuit.trim() || null
  if (input.razon_social !== undefined) clean.razon_social = input.razon_social.trim() || null
  if (input.telefono !== undefined) clean.telefono = input.telefono.trim() || null
  if (input.email !== undefined) clean.email = input.email.trim() || null
  if (input.sitio_web !== undefined) clean.sitio_web = input.sitio_web.trim() || null
  if (input.direccion !== undefined) clean.direccion = input.direccion

  const { error } = await supabase
    .from('entidades')
    .update(clean)
    .eq('id', id)
    .eq('tipo', 'proveedor')

  if (error) {
    if (error.code === '23505' && error.message.includes('slug')) {
      return formatResult(false, 'Ya existe una entidad con ese nombre.')
    }
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/proveedores')
  revalidatePath(`/admin/proveedores/${id}`)
  return formatResult(true, 'Proveedor actualizado')
}

export async function toggleActivoProveedor(id: string) {
  const supabase = await createClient()

  const { data: entidad, error: fetchError } = await supabase
    .from('entidades')
    .select('activo')
    .eq('id', id)
    .single()

  if (fetchError) return formatResult(false, fetchError.message)

  const { error } = await supabase
    .from('entidades')
    .update({ activo: !entidad.activo })
    .eq('id', id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/proveedores')
  return formatResult(true, entidad.activo ? 'Proveedor desactivado' : 'Proveedor activado')
}

export async function eliminarProveedor(id: string) {
  const supabase = await createClient()

  // No eliminar si tiene movimientos de caja asociados (igual que entidades).
  const { count: movCount } = await supabase
    .from('movimientos_caja')
    .select('id', { count: 'exact', head: true })
    .eq('entidad_id', id)

  if (movCount && movCount > 0) {
    return formatResult(false, 'No se puede eliminar: este proveedor tiene movimientos de caja asociados. Podés desactivarlo en su lugar.')
  }

  const { error } = await supabase
    .from('entidades')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/proveedores')
  return formatResult(true, 'Proveedor eliminado')
}
