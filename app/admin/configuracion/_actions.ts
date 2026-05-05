'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatResult(ok: boolean, message: string) {
  return { ok, message }
}

// --- MODULOS ---

export async function toggleModulo(moduloSlug: string) {
  const supabase = await createClient()

  // Check if tenant_modulos row exists
  const { data: existing, error: fetchError } = await supabase
    .from('tenant_modulos')
    .select('id, activo')
    .eq('tenant_id', TENANT_ID)
    .eq('modulo_slug', moduloSlug)
    .maybeSingle()

  if (fetchError) return formatResult(false, fetchError.message)

  if (existing) {
    const { error } = await supabase
      .from('tenant_modulos')
      .update({ activo: !existing.activo })
      .eq('id', existing.id)

    if (error) return formatResult(false, error.message)
  } else {
    const { error } = await supabase
      .from('tenant_modulos')
      .insert({
        tenant_id: TENANT_ID,
        modulo_slug: moduloSlug,
        activo: true,
        fecha_activacion: new Date().toISOString(),
      })

    if (error) return formatResult(false, error.message)
  }

  revalidatePath('/admin/configuracion')
  return formatResult(true, existing?.activo ? 'Modulo desactivado' : 'Modulo activado')
}

// --- CATALOGOS ---

type CatalogoTabla = 'catalogo_atributos' | 'catalogo_estados_padron' | 'catalogo_tipos_socio' | 'catalogo_roles_equipo'

const TABLAS_PERMITIDAS: CatalogoTabla[] = [
  'catalogo_atributos',
  'catalogo_estados_padron',
  'catalogo_tipos_socio',
  'catalogo_roles_equipo',
]

export async function crearItemCatalogo(tabla: string, data: { slug: string; nombre: string; categoria?: string; descripcion?: string }) {
  if (!TABLAS_PERMITIDAS.includes(tabla as CatalogoTabla)) {
    return formatResult(false, 'Tabla no permitida')
  }

  if (!data.slug || !data.nombre) {
    return formatResult(false, 'Slug y nombre son requeridos')
  }

  const supabase = await createClient()

  const insertData: Record<string, unknown> = {
    slug: data.slug.trim().toLowerCase().replace(/\s+/g, '_'),
    nombre: data.nombre.trim(),
    activo: true,
  }

  if (data.categoria) insertData.categoria = data.categoria.trim()
  if (data.descripcion) insertData.descripcion = data.descripcion.trim()

  const { error } = await supabase
    .from(tabla)
    .insert(insertData)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/configuracion')
  return formatResult(true, 'Item creado correctamente')
}

export async function toggleItemCatalogo(tabla: string, id: string) {
  if (!TABLAS_PERMITIDAS.includes(tabla as CatalogoTabla)) {
    return formatResult(false, 'Tabla no permitida')
  }

  const supabase = await createClient()

  // Determine PK column: catalogo_atributos and catalogo_roles_equipo use 'slug', others use 'id'
  const usesSlugAsPK = tabla === 'catalogo_atributos' || tabla === 'catalogo_roles_equipo'
  const pkColumn = usesSlugAsPK ? 'slug' : 'id'

  const { data: existing, error: fetchError } = await supabase
    .from(tabla)
    .select(`${pkColumn}, activo`)
    .eq(pkColumn, id)
    .single()

  if (fetchError) return formatResult(false, fetchError.message)

  const { error } = await supabase
    .from(tabla)
    .update({ activo: !existing.activo })
    .eq(pkColumn, id)

  if (error) return formatResult(false, error.message)

  revalidatePath('/admin/configuracion')
  return formatResult(true, existing.activo ? 'Item desactivado' : 'Item activado')
}
