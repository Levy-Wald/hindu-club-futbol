'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { canAdminPim, canEditPim } from './permisos'

// --- Helpers ---

async function getPersona() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: persona } = await supabase
    .from('personas')
    .select('id, tenant_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  return persona
}

type ActionOk<T = void> = T extends void ? { ok: true } : { ok: true } & T
type ActionErr = { ok: false; error: string }
type ActionResult<T = void> = ActionOk<T> | ActionErr

// --- Producto Schemas ---

const modosValidos = ['venta', 'alquiler', 'prestamo', 'gratis'] as const

const productoSchema = z.object({
  sku: z.string().max(100).optional(),
  nombre: z.string().min(1).max(300),
  descripcion: z.string().max(2000).optional(),
  tipo: z.enum(['producto', 'servicio']),
  precio_base_ars: z.number().min(0).nullable().optional(),
  precio_base_usd: z.number().min(0).nullable().optional(),
  stock_simple: z.number().min(0).nullable().optional(),
  unidad_medida_slug: z.string().optional(),
  categoria_ids: z.array(z.string().uuid()).optional(),
  marca_id: z.string().uuid().nullable().optional(),
  modos_disponibles: z.array(z.enum(modosValidos)).min(1).optional(),
})

// --- Producto Actions ---

export async function crearProductoAction(input: z.infer<typeof productoSchema>): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso para crear productos' }

  const parsed = productoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('productos')
    .insert({
      tenant_id,
      sku: d.sku?.trim() || null,
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || null,
      tipo: d.tipo,
      precio_base_ars: d.precio_base_ars ?? null,
      precio_base_usd: d.precio_base_usd ?? null,
      stock_simple: d.tipo === 'producto' ? (d.stock_simple ?? null) : null,
      unidad_medida_slug: d.unidad_medida_slug || null,
      marca_id: d.marca_id ?? null,
      modos_disponibles: d.modos_disponibles ?? ['venta'],
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando producto' }

  // Link categories
  if (d.categoria_ids && d.categoria_ids.length > 0) {
    await supabase.from('producto_categoria_links').insert(
      d.categoria_ids.map((cid) => ({ producto_id: data.id, categoria_id: cid }))
    )
  }

  revalidatePath('/admin/productos')
  return { ok: true, id: data.id }
}

export async function editarProductoAction(input: {
  id: string
} & z.infer<typeof productoSchema>): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = productoSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { error } = await supabase
    .from('productos')
    .update({
      sku: d.sku?.trim() || null,
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || null,
      tipo: d.tipo,
      precio_base_ars: d.precio_base_ars ?? null,
      precio_base_usd: d.precio_base_usd ?? null,
      stock_simple: d.tipo === 'producto' ? (d.stock_simple ?? null) : null,
      unidad_medida_slug: d.unidad_medida_slug || null,
      marca_id: d.marca_id ?? null,
      modos_disponibles: d.modos_disponibles ?? ['venta'],
    })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  // Sync categories: delete all, re-insert
  if (d.categoria_ids !== undefined) {
    await supabase.from('producto_categoria_links').delete().eq('producto_id', input.id)
    if (d.categoria_ids.length > 0) {
      await supabase.from('producto_categoria_links').insert(
        d.categoria_ids.map((cid) => ({ producto_id: input.id, categoria_id: cid }))
      )
    }
  }

  revalidatePath('/admin/productos')
  revalidatePath(`/admin/productos/${input.id}`)
  return { ok: true }
}

export async function eliminarProductoAction(input: {
  id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso para eliminar productos' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('productos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/productos')
  return { ok: true }
}

export async function actualizarImagenProductoAction(input: {
  id: string
  imagen_url: string | null
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('productos')
    .update({ imagen_url: input.imagen_url })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.id}`)
  return { ok: true }
}

// --- Variante Schemas ---

const varianteSchema = z.object({
  producto_id: z.string().uuid(),
  sku_variante: z.string().max(100).optional(),
  nombre_variante: z.string().min(1).max(300),
  precio_diferencial_ars: z.number().nullable().optional(),
  precio_diferencial_usd: z.number().nullable().optional(),
  stock_simple_variante: z.number().min(0).nullable().optional(),
  atributos: z.record(z.string(), z.string()).optional(),
})

// --- Variante Actions ---

export async function crearVarianteAction(input: z.infer<typeof varianteSchema>): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = varianteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('productos_variantes')
    .insert({
      producto_id: d.producto_id,
      sku_variante: d.sku_variante?.trim() || null,
      nombre_variante: d.nombre_variante.trim(),
      precio_diferencial_ars: d.precio_diferencial_ars ?? null,
      precio_diferencial_usd: d.precio_diferencial_usd ?? null,
      stock_simple_variante: d.stock_simple_variante ?? null,
      atributos: d.atributos ?? {},
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error creando variante' }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true, id: data.id }
}

export async function editarVarianteAction(input: {
  id: string
} & z.infer<typeof varianteSchema>): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = varianteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { error } = await supabase
    .from('productos_variantes')
    .update({
      sku_variante: d.sku_variante?.trim() || null,
      nombre_variante: d.nombre_variante.trim(),
      precio_diferencial_ars: d.precio_diferencial_ars ?? null,
      precio_diferencial_usd: d.precio_diferencial_usd ?? null,
      stock_simple_variante: d.stock_simple_variante ?? null,
      atributos: d.atributos ?? {},
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true }
}

export async function eliminarVarianteAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('productos_variantes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

// --- Categoria Schemas ---

const categoriaSchema = z.object({
  nombre: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  parent_id: z.string().uuid().nullable().optional(),
  descripcion: z.string().max(500).optional(),
  orden: z.number().int().min(0).optional(),
})

// --- Categoria Actions ---

export async function crearCategoriaAction(input: z.infer<typeof categoriaSchema>): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = categoriaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('producto_categorias')
    .insert({
      tenant_id,
      nombre: d.nombre.trim(),
      slug: d.slug.trim(),
      parent_id: d.parent_id ?? null,
      descripcion: d.descripcion?.trim() || null,
      orden: d.orden ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error?.message?.includes('idx_categorias_slug_unique')) {
      return { ok: false, error: 'Ya existe una categoria con ese slug' }
    }
    return { ok: false, error: error?.message ?? 'Error creando categoria' }
  }

  revalidatePath('/admin/productos/categorias')
  return { ok: true, id: data.id }
}

export async function editarCategoriaAction(input: {
  id: string
} & z.infer<typeof categoriaSchema>): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = categoriaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { error } = await supabase
    .from('producto_categorias')
    .update({
      nombre: d.nombre.trim(),
      slug: d.slug.trim(),
      parent_id: d.parent_id ?? null,
      descripcion: d.descripcion?.trim() || null,
      orden: d.orden ?? 0,
    })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) {
    if (error.message?.includes('ciclo')) {
      return { ok: false, error: 'No se puede asignar ese padre: se crearia un ciclo' }
    }
    if (error.message?.includes('idx_categorias_slug_unique')) {
      return { ok: false, error: 'Ya existe una categoria con ese slug' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/productos/categorias')
  return { ok: true }
}

export async function eliminarCategoriaAction(input: {
  id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_categorias')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/productos/categorias')
  return { ok: true }
}

// --- Marca Schemas ---

const marcaSchema = z.object({
  nombre: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  descripcion: z.string().max(500).optional(),
  logo_url: z.string().url().nullable().optional(),
  sitio_web: z.string().url().nullable().optional(),
})

// --- Marca Actions ---

export async function crearMarcaAction(input: z.infer<typeof marcaSchema>): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = marcaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('producto_marcas')
    .insert({
      tenant_id,
      nombre: d.nombre.trim(),
      slug: d.slug.trim(),
      descripcion: d.descripcion?.trim() || null,
      logo_url: d.logo_url ?? null,
      sitio_web: d.sitio_web ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error?.message?.includes('idx_marcas_slug_unique')) {
      return { ok: false, error: 'Ya existe una marca con ese slug' }
    }
    return { ok: false, error: error?.message ?? 'Error creando marca' }
  }

  revalidatePath('/admin/productos/marcas')
  return { ok: true, id: data.id }
}

export async function editarMarcaAction(input: {
  id: string
} & z.infer<typeof marcaSchema>): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = marcaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { error } = await supabase
    .from('producto_marcas')
    .update({
      nombre: d.nombre.trim(),
      slug: d.slug.trim(),
      descripcion: d.descripcion?.trim() || null,
      logo_url: d.logo_url ?? null,
      sitio_web: d.sitio_web ?? null,
    })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) {
    if (error.message?.includes('idx_marcas_slug_unique')) {
      return { ok: false, error: 'Ya existe una marca con ese slug' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/productos/marcas')
  return { ok: true }
}

export async function eliminarMarcaAction(input: {
  id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_marcas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/productos/marcas')
  return { ok: true }
}

// --- Imagen Actions ---

export async function agregarImagenAProductoAction(input: {
  producto_id: string
  url: string
  alt_text?: string
  es_principal?: boolean
}): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  // Get max orden
  const { data: existing } = await supabase
    .from('producto_imagenes')
    .select('orden')
    .eq('producto_id', input.producto_id)
    .order('orden', { ascending: false })
    .limit(1)

  const nextOrden = (existing?.[0]?.orden ?? -1) + 1

  // If this is principal, unset others
  if (input.es_principal) {
    await supabase
      .from('producto_imagenes')
      .update({ es_principal: false })
      .eq('producto_id', input.producto_id)
  }

  const { data, error } = await supabase
    .from('producto_imagenes')
    .insert({
      producto_id: input.producto_id,
      url: input.url,
      alt_text: input.alt_text?.trim() || null,
      orden: nextOrden,
      es_principal: input.es_principal ?? (nextOrden === 0),
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error guardando imagen' }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true, id: data.id }
}

export async function eliminarImagenAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_imagenes')
    .delete()
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

export async function establecerImagenPrincipalAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  // Unset all as principal
  await supabase
    .from('producto_imagenes')
    .update({ es_principal: false })
    .eq('producto_id', input.producto_id)

  // Set this one
  const { error } = await supabase
    .from('producto_imagenes')
    .update({ es_principal: true })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

export async function reordenarImagenesAction(input: {
  producto_id: string
  orden: { id: string; orden: number }[]
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  for (const item of input.orden) {
    const { error } = await supabase
      .from('producto_imagenes')
      .update({ orden: item.orden })
      .eq('id', item.id)
    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}
