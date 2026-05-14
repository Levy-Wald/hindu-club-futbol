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
const tiposUsoValidos = ['reventa', 'uso_interno_consumible', 'uso_interno_bien_uso', 'servicio'] as const

const productoSchema = z.object({
  sku: z.string().max(100).optional(),
  nombre: z.string().min(1).max(300),
  descripcion: z.string().max(2000).optional(),
  descripcion_corta: z.string().max(300).optional().or(z.literal('')),
  descripcion_larga: z.string().max(5000).optional().or(z.literal('')),
  tipo: z.enum(['producto', 'servicio']),
  tipo_uso: z.enum(tiposUsoValidos).nullable().optional(),
  precio_base_ars: z.number().min(0).nullable().optional(),
  precio_base_usd: z.number().min(0).nullable().optional(),
  stock_simple: z.number().min(0).nullable().optional(),
  unidad_medida_slug: z.string().optional(),
  categoria_ids: z.array(z.string().uuid()).optional(),
  marca_id: z.string().uuid().nullable().optional(),
  modos_disponibles: z.array(z.enum(modosValidos)).min(1).optional(),
  ean13: z.string().regex(/^\d{13}$/).optional().or(z.literal('')),
  ean14: z.string().regex(/^\d{14}$/).optional().or(z.literal('')),
  material: z.string().max(100).optional().or(z.literal('')),
  color: z.string().max(50).optional().or(z.literal('')),
  medida_tamano: z.string().max(100).optional().or(z.literal('')),
  origen_pais: z.string().max(100).optional().or(z.literal('')),
  cantidad_por_bulto: z.number().int().positive().nullable().optional(),
  peso_kg: z.number().positive().nullable().optional(),
  // Financial
  cuenta_ingreso_id: z.string().uuid().nullable().optional(),
  cuenta_egreso_id: z.string().uuid().nullable().optional(),
  categoria_movimiento_id: z.string().uuid().nullable().optional(),
  centro_costo_id: z.string().uuid().nullable().optional(),
  es_arancelado: z.boolean().optional(),
  es_comprable: z.boolean().optional(),
  iva_compra: z.number().min(0).max(100).nullable().optional(),
  iva_venta: z.number().min(0).max(100).nullable().optional(),
  precio_compra: z.number().min(0).nullable().optional(),
  stock_minimo: z.number().min(0).nullable().optional(),
  cupo_maximo: z.number().int().positive().nullable().optional(),
  instalacion: z.string().max(200).optional().or(z.literal('')),
  moneda: z.string().max(10).optional(),
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
      descripcion_corta: d.descripcion_corta?.trim() || null,
      descripcion_larga: d.descripcion_larga?.trim() || null,
      tipo: d.tipo,
      tipo_uso: d.tipo_uso ?? null,
      precio_base_ars: d.precio_base_ars ?? null,
      precio_base_usd: d.precio_base_usd ?? null,
      stock_simple: d.tipo === 'producto' ? (d.stock_simple ?? null) : null,
      unidad_medida_slug: d.unidad_medida_slug || null,
      marca_id: d.marca_id ?? null,
      modos_disponibles: d.modos_disponibles ?? ['venta'],
      ean13: d.ean13?.trim() || null,
      ean14: d.ean14?.trim() || null,
      material: d.material?.trim() || null,
      color: d.color?.trim() || null,
      medida_tamano: d.medida_tamano?.trim() || null,
      origen_pais: d.origen_pais?.trim() || null,
      cantidad_por_bulto: d.cantidad_por_bulto ?? null,
      peso_kg: d.peso_kg ?? null,
      cuenta_ingreso_id: d.cuenta_ingreso_id ?? null,
      cuenta_egreso_id: d.cuenta_egreso_id ?? null,
      categoria_movimiento_id: d.categoria_movimiento_id ?? null,
      centro_costo_id: d.centro_costo_id ?? null,
      es_arancelado: d.es_arancelado ?? false,
      es_comprable: d.es_comprable ?? false,
      iva_compra: d.iva_compra ?? 21,
      iva_venta: d.iva_venta ?? 21,
      precio_compra: d.precio_compra ?? null,
      stock_minimo: d.stock_minimo ?? null,
      cupo_maximo: d.cupo_maximo ?? null,
      instalacion: d.instalacion?.trim() || null,
      moneda: d.moneda || 'ARS',
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
      descripcion_corta: d.descripcion_corta?.trim() || null,
      descripcion_larga: d.descripcion_larga?.trim() || null,
      tipo: d.tipo,
      tipo_uso: d.tipo_uso ?? null,
      precio_base_ars: d.precio_base_ars ?? null,
      precio_base_usd: d.precio_base_usd ?? null,
      stock_simple: d.tipo === 'producto' ? (d.stock_simple ?? null) : null,
      unidad_medida_slug: d.unidad_medida_slug || null,
      marca_id: d.marca_id ?? null,
      modos_disponibles: d.modos_disponibles ?? ['venta'],
      ean13: d.ean13?.trim() || null,
      ean14: d.ean14?.trim() || null,
      material: d.material?.trim() || null,
      color: d.color?.trim() || null,
      medida_tamano: d.medida_tamano?.trim() || null,
      origen_pais: d.origen_pais?.trim() || null,
      cantidad_por_bulto: d.cantidad_por_bulto ?? null,
      peso_kg: d.peso_kg ?? null,
      cuenta_ingreso_id: d.cuenta_ingreso_id ?? null,
      cuenta_egreso_id: d.cuenta_egreso_id ?? null,
      categoria_movimiento_id: d.categoria_movimiento_id ?? null,
      centro_costo_id: d.centro_costo_id ?? null,
      es_arancelado: d.es_arancelado ?? false,
      es_comprable: d.es_comprable ?? false,
      iva_compra: d.iva_compra ?? 21,
      iva_venta: d.iva_venta ?? 21,
      precio_compra: d.precio_compra ?? null,
      stock_minimo: d.stock_minimo ?? null,
      cupo_maximo: d.cupo_maximo ?? null,
      instalacion: d.instalacion?.trim() || null,
      moneda: d.moneda || 'ARS',
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

// --- Proveedor Schemas ---

const rolesResponsable = ['general', 'compras', 'stock', 'marketing', 'product_owner', 'qa', 'logistica', 'ventas'] as const

const proveedorSchema = z.object({
  producto_id: z.string().uuid(),
  entidad_id: z.string().uuid().nullable().optional(),
  persona_id: z.string().uuid().nullable().optional(),
  es_principal: z.boolean().optional(),
  codigo_proveedor: z.string().max(100).optional().or(z.literal('')),
  plazo_entrega_dias: z.number().int().min(0).nullable().optional(),
  moneda_compra: z.string().max(10).optional().or(z.literal('')),
  precio_proveedor: z.number().min(0).nullable().optional(),
  notas: z.string().max(1000).optional().or(z.literal('')),
})

// --- Proveedor Actions ---

export async function agregarProveedorAProductoAction(
  input: z.infer<typeof proveedorSchema>
): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = proveedorSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  if (!d.entidad_id && !d.persona_id) return { ok: false, error: 'Debe seleccionar una entidad o persona' }
  if (d.entidad_id && d.persona_id) return { ok: false, error: 'Solo una entidad o persona, no ambas' }

  const supabase = createServiceRoleClient()

  // If es_principal, unset others
  if (d.es_principal) {
    await supabase
      .from('producto_proveedores')
      .update({ es_principal: false })
      .eq('producto_id', d.producto_id)
      .eq('es_principal', true)
  }

  const { data, error } = await supabase
    .from('producto_proveedores')
    .insert({
      producto_id: d.producto_id,
      entidad_id: d.entidad_id ?? null,
      persona_id: d.persona_id ?? null,
      es_principal: d.es_principal ?? false,
      codigo_proveedor: d.codigo_proveedor?.trim() || null,
      plazo_entrega_dias: d.plazo_entrega_dias ?? null,
      moneda_compra: d.moneda_compra?.trim() || null,
      precio_proveedor: d.precio_proveedor ?? null,
      notas: d.notas?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error agregando proveedor' }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true, id: data.id }
}

export async function editarProveedorDeProductoAction(
  input: { id: string } & z.infer<typeof proveedorSchema>
): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = proveedorSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = createServiceRoleClient()

  // If es_principal, unset others
  if (d.es_principal) {
    await supabase
      .from('producto_proveedores')
      .update({ es_principal: false })
      .eq('producto_id', d.producto_id)
      .eq('es_principal', true)
      .neq('id', input.id)
  }

  const { error } = await supabase
    .from('producto_proveedores')
    .update({
      es_principal: d.es_principal ?? false,
      codigo_proveedor: d.codigo_proveedor?.trim() || null,
      plazo_entrega_dias: d.plazo_entrega_dias ?? null,
      moneda_compra: d.moneda_compra?.trim() || null,
      precio_proveedor: d.precio_proveedor ?? null,
      notas: d.notas?.trim() || null,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true }
}

export async function eliminarProveedorDeProductoAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_proveedores')
    .delete()
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

export async function establecerProveedorPrincipalAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  // Unset all
  await supabase
    .from('producto_proveedores')
    .update({ es_principal: false })
    .eq('producto_id', input.producto_id)

  // Set this one
  const { error } = await supabase
    .from('producto_proveedores')
    .update({ es_principal: true })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

// --- Responsable Schemas ---

const responsableSchema = z.object({
  producto_id: z.string().uuid(),
  persona_id: z.string().uuid().nullable().optional(),
  atributo_slug: z.string().max(100).nullable().optional(),
  rol: z.enum(rolesResponsable),
  notas: z.string().max(1000).optional().or(z.literal('')),
})

// --- Responsable Actions ---

export async function agregarResponsableAProductoAction(
  input: z.infer<typeof responsableSchema>
): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = responsableSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  if (!d.persona_id && !d.atributo_slug) return { ok: false, error: 'Debe seleccionar persona o atributo' }
  if (d.persona_id && d.atributo_slug) return { ok: false, error: 'Solo persona o atributo, no ambos' }

  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('producto_responsables')
    .insert({
      producto_id: d.producto_id,
      persona_id: d.persona_id ?? null,
      atributo_slug: d.atributo_slug ?? null,
      rol: d.rol,
      notas: d.notas?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Error agregando responsable' }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true, id: data.id }
}

export async function editarResponsableDeProductoAction(
  input: { id: string } & z.infer<typeof responsableSchema>
): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = responsableSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_responsables')
    .update({
      rol: d.rol,
      notas: d.notas?.trim() || null,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true }
}

export async function eliminarResponsableDeProductoAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_responsables')
    .delete()
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

// --- Lista de Precios Schemas ---

const monedasValidas = ['ARS', 'USD', 'EUR', 'BRL', 'UYU', 'CLP'] as const
const tiposListaValidos = ['compra', 'costo', 'venta'] as const

const listaPreciosSchema = z.object({
  slug: z.string().min(1).max(100),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  tipo: z.enum(tiposListaValidos),
  moneda: z.enum(monedasValidas),
  activa: z.boolean().optional(),
  es_default: z.boolean().optional(),
  orden: z.number().int().min(0).optional(),
})

// --- Lista de Precios Actions ---

export async function crearListaPreciosAction(
  input: z.infer<typeof listaPreciosSchema>
): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = listaPreciosSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  // If es_default, unset others of same tipo
  if (d.es_default) {
    await supabase
      .from('producto_listas_precios')
      .update({ es_default: false })
      .eq('tenant_id', tenant_id)
      .eq('tipo', d.tipo)
      .eq('es_default', true)
  }

  const { data, error } = await supabase
    .from('producto_listas_precios')
    .insert({
      tenant_id,
      slug: d.slug.trim(),
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || null,
      tipo: d.tipo,
      moneda: d.moneda,
      activa: d.activa ?? true,
      es_default: d.es_default ?? false,
      orden: d.orden ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error?.message?.includes('idx_listas_slug_tenant')) {
      return { ok: false, error: 'Ya existe una lista con ese slug' }
    }
    return { ok: false, error: error?.message ?? 'Error creando lista' }
  }

  revalidatePath('/admin/productos/listas-precios')
  return { ok: true, id: data.id }
}

export async function editarListaPreciosAction(
  input: { id: string } & z.infer<typeof listaPreciosSchema>
): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = listaPreciosSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()
  const d = parsed.data

  if (d.es_default) {
    await supabase
      .from('producto_listas_precios')
      .update({ es_default: false })
      .eq('tenant_id', tenant_id)
      .eq('tipo', d.tipo)
      .eq('es_default', true)
      .neq('id', input.id)
  }

  const { error } = await supabase
    .from('producto_listas_precios')
    .update({
      slug: d.slug.trim(),
      nombre: d.nombre.trim(),
      descripcion: d.descripcion?.trim() || null,
      tipo: d.tipo,
      moneda: d.moneda,
      activa: d.activa ?? true,
      es_default: d.es_default ?? false,
      orden: d.orden ?? 0,
    })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) {
    if (error.message?.includes('idx_listas_slug_tenant')) {
      return { ok: false, error: 'Ya existe una lista con ese slug' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/productos/listas-precios')
  return { ok: true }
}

export async function eliminarListaPreciosAction(input: {
  id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_listas_precios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/productos/listas-precios')
  return { ok: true }
}

export async function establecerListaDefaultAction(input: {
  id: string
  tipo: 'compra' | 'costo' | 'venta'
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Unset all defaults for this tipo
  await supabase
    .from('producto_listas_precios')
    .update({ es_default: false })
    .eq('tenant_id', tenant_id)
    .eq('tipo', input.tipo)

  // Set this one
  const { error } = await supabase
    .from('producto_listas_precios')
    .update({ es_default: true })
    .eq('id', input.id)
    .eq('tenant_id', tenant_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/productos/listas-precios')
  return { ok: true }
}

export async function seedListasEstandarAction(): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canAdminPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const tenant_id = persona.tenant_id ?? TENANT_ID
  const supabase = createServiceRoleClient()

  // Check if any lists already exist
  const { data: existing } = await supabase
    .from('producto_listas_precios')
    .select('id')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .limit(1)

  if (existing && existing.length > 0) {
    return { ok: false, error: 'Ya existen listas de precios para este tenant' }
  }

  const listas = [
    { slug: 'compra', nombre: 'Compra a Proveedores', tipo: 'compra', moneda: 'ARS', es_default: true, orden: 1 },
    { slug: 'costo_fabrica', nombre: 'Costo Fabrica', tipo: 'costo', moneda: 'ARS', es_default: false, orden: 2 },
    { slug: 'costo_deposito', nombre: 'Costo en Deposito', tipo: 'costo', moneda: 'ARS', es_default: true, orden: 3 },
    { slug: 'costo_calle', nombre: 'Costo en Calle', tipo: 'costo', moneda: 'ARS', es_default: false, orden: 4 },
    { slug: 'venta_distribuidor', nombre: 'Venta a Distribuidor', tipo: 'venta', moneda: 'ARS', es_default: false, orden: 5 },
    { slug: 'venta_mayorista', nombre: 'Venta Mayorista', tipo: 'venta', moneda: 'ARS', es_default: false, orden: 6 },
    { slug: 'venta_minorista_pdv', nombre: 'Venta Minorista PDV', tipo: 'venta', moneda: 'ARS', es_default: true, orden: 7 },
    { slug: 'venta_minorista_ecommerce', nombre: 'Venta Minorista E-commerce', tipo: 'venta', moneda: 'ARS', es_default: false, orden: 8 },
  ]

  const { error } = await supabase
    .from('producto_listas_precios')
    .insert(listas.map((l) => ({ ...l, tenant_id })))

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin/productos/listas-precios')
  return { ok: true }
}

// --- Precio Schemas ---

const precioSchema = z.object({
  producto_id: z.string().uuid(),
  variante_id: z.string().uuid().nullable().optional(),
  lista_id: z.string().uuid(),
  precio: z.number().min(0),
  moneda: z.enum(monedasValidas),
  fecha_vigencia_desde: z.string().nullable().optional(),
  fecha_vigencia_hasta: z.string().nullable().optional(),
  notas: z.string().max(1000).optional().or(z.literal('')),
})

// --- Precio Actions ---

export async function asignarPrecioAction(
  input: z.infer<typeof precioSchema>
): Promise<ActionResult<{ id: string }>> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = precioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const supabase = createServiceRoleClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('producto_precios')
    .insert({
      producto_id: d.producto_id,
      variante_id: d.variante_id ?? null,
      lista_id: d.lista_id,
      precio: d.precio,
      moneda: d.moneda,
      fecha_vigencia_desde: d.fecha_vigencia_desde || null,
      fecha_vigencia_hasta: d.fecha_vigencia_hasta || null,
      notas: d.notas?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    if (error?.message?.includes('idx_producto_precio_unico')) {
      return { ok: false, error: 'Ya existe un precio base para esta combinacion producto/variante/lista' }
    }
    return { ok: false, error: error?.message ?? 'Error asignando precio' }
  }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true, id: data.id }
}

export async function editarPrecioAction(
  input: { id: string } & z.infer<typeof precioSchema>
): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const parsed = precioSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_precios')
    .update({
      precio: d.precio,
      moneda: d.moneda,
      fecha_vigencia_desde: d.fecha_vigencia_desde || null,
      fecha_vigencia_hasta: d.fecha_vigencia_hasta || null,
      notas: d.notas?.trim() || null,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${d.producto_id}`)
  return { ok: true }
}

export async function eliminarPrecioAction(input: {
  id: string
  producto_id: string
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('producto_precios')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/productos/${input.producto_id}`)
  return { ok: true }
}

export async function actualizarPreciosMasivoAction(input: {
  precios: { producto_id: string; variante_id: string | null; lista_id: string; precio: number; moneda: string }[]
}): Promise<ActionResult> {
  const persona = await getPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }

  const puede = await canEditPim(persona.id)
  if (!puede) return { ok: false, error: 'Sin permiso' }

  if (!input.precios.length) return { ok: false, error: 'Sin precios para actualizar' }

  const supabase = createServiceRoleClient()

  for (const p of input.precios) {
    const { error } = await supabase
      .from('producto_precios')
      .upsert(
        {
          producto_id: p.producto_id,
          variante_id: p.variante_id ?? null,
          lista_id: p.lista_id,
          precio: p.precio,
          moneda: p.moneda,
        },
        { onConflict: 'producto_id,variante_id,lista_id', ignoreDuplicates: false }
      )
    if (error) return { ok: false, error: error.message }
  }

  const prodIds = [...new Set(input.precios.map((p) => p.producto_id))]
  for (const pid of prodIds) {
    revalidatePath(`/admin/productos/${pid}`)
  }
  return { ok: true }
}
