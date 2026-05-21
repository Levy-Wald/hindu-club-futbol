'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { getCatalogoDef } from '@/lib/catalogos/registry'

function formatResult(ok: boolean, message: string, data?: unknown) {
  return { ok, message, data }
}

export async function fetchCatalogoData(catalogoSlug: string) {
  const def = getCatalogoDef(catalogoSlug)
  if (!def) return { ok: false, message: 'Catálogo no encontrado', data: [] }

  const supabase = await createClient()
  const selectCols = def.columns.map((c) => c.key).join(', ')

  let query = supabase
    .from(def.table)
    .select(def.pkType === 'uuid' ? `id, tenant_id, ${selectCols}` : selectCols)
    .order('nombre')

  if (def.pkType === 'uuid') {
    query = query.or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
  }

  const { data, error } = await query

  if (error) return { ok: false, message: error.message, data: [] }
  return { ok: true, message: '', data: data ?? [] }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function crearRegistroCatalogo(
  catalogoSlug: string,
  values: Record<string, unknown>
) {
  const def = getCatalogoDef(catalogoSlug)
  if (!def) return formatResult(false, 'Catálogo no encontrado')

  const nombre = (values.nombre as string)?.trim()
  if (!nombre) return formatResult(false, 'El nombre es obligatorio')

  const slug = slugify(nombre)
  if (!slug) return formatResult(false, 'No se pudo generar un slug válido')

  const supabase = await createClient()

  const record: Record<string, unknown> = { slug, activo: true }
  for (const col of def.columns) {
    if (col.key === 'slug' || col.key === 'activo') continue
    if (values[col.key] !== undefined) {
      record[col.key] = values[col.key]
    }
  }

  if (def.pkType === 'uuid') {
    record.tenant_id = TENANT_ID
  }

  const { error } = await supabase.from(def.table).insert(record)

  if (error) {
    if (error.code === '23505') return formatResult(false, `Ya existe un registro con slug "${slug}"`)
    return formatResult(false, error.message)
  }

  revalidatePath('/admin/catalogos')
  revalidatePath(`/admin/catalogos/${catalogoSlug}`)
  return formatResult(true, 'Registro creado')
}

export async function editarRegistroCatalogo(
  catalogoSlug: string,
  pk: string,
  values: Record<string, unknown>
) {
  const def = getCatalogoDef(catalogoSlug)
  if (!def) return formatResult(false, 'Catálogo no encontrado')

  const supabase = await createClient()

  const updates: Record<string, unknown> = {}
  for (const col of def.columns) {
    if (!col.editable) continue
    if (values[col.key] !== undefined) {
      updates[col.key] = values[col.key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return formatResult(false, 'No hay cambios para guardar')
  }

  let query = supabase.from(def.table).update(updates)

  if (def.pkType === 'uuid') {
    query = query.eq('id', pk)
  } else {
    query = query.eq('slug', pk)
  }

  const { error } = await query

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/catalogos')
  revalidatePath(`/admin/catalogos/${catalogoSlug}`)
  return formatResult(true, 'Registro actualizado')
}

export async function toggleActivoCatalogo(
  catalogoSlug: string,
  pk: string,
  nuevoEstado: boolean
) {
  const def = getCatalogoDef(catalogoSlug)
  if (!def) return formatResult(false, 'Catálogo no encontrado')

  const supabase = await createClient()

  let query = supabase.from(def.table).update({ activo: nuevoEstado })

  if (def.pkType === 'uuid') {
    query = query.eq('id', pk)
  } else {
    query = query.eq('slug', pk)
  }

  const { error } = await query

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/catalogos')
  revalidatePath(`/admin/catalogos/${catalogoSlug}`)
  return formatResult(true, nuevoEstado ? 'Registro activado' : 'Registro desactivado')
}
