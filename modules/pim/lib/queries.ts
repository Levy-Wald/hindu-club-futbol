'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type {
  ProductoConCategorias,
  ProductoVariante,
  ProductoCategoria,
  CategoriaConHijos,
  UnidadMedida,
  Marca,
  ProductoImagen,
} from './tipos'

export async function listarProductos(
  tenant_id: string,
  filtros?: {
    busqueda?: string
    categoria_id?: string
    marca_id?: string
    tipo?: 'producto' | 'servicio'
    activo?: boolean
  }
): Promise<ProductoConCategorias[]> {
  const supabase = createServiceRoleClient()

  let query = supabase
    .from('productos')
    .select('*')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .order('nombre')

  if (filtros?.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros?.activo !== undefined) query = query.eq('activo', filtros.activo)
  if (filtros?.marca_id) query = query.eq('marca_id', filtros.marca_id)
  if (filtros?.busqueda) {
    query = query.or(`nombre.ilike.%${filtros.busqueda}%,sku.ilike.%${filtros.busqueda}%,ean13.ilike.%${filtros.busqueda}%,ean14.ilike.%${filtros.busqueda}%`)
  }

  const { data: productos } = await query
  if (!productos || productos.length === 0) return []

  const prodIds = productos.map((p) => p.id)

  // Get category links
  const { data: links } = await supabase
    .from('producto_categoria_links')
    .select('producto_id, categoria_id')
    .in('producto_id', prodIds)

  // Get category names
  const catIds = [...new Set((links ?? []).map((l) => l.categoria_id))]
  const catsMap: Record<string, { id: string; nombre: string; slug: string }> = {}
  if (catIds.length > 0) {
    const { data: cats } = await supabase
      .from('producto_categorias')
      .select('id, nombre, slug')
      .in('id', catIds)
    for (const c of cats ?? []) {
      catsMap[c.id] = { id: c.id, nombre: c.nombre, slug: c.slug }
    }
  }

  // Get variantes count per product
  const { data: varianteCounts } = await supabase
    .from('productos_variantes')
    .select('producto_id')
    .in('producto_id', prodIds)
    .is('deleted_at', null)

  const varCountMap: Record<string, number> = {}
  for (const v of varianteCounts ?? []) {
    varCountMap[v.producto_id] = (varCountMap[v.producto_id] ?? 0) + 1
  }

  // Get marca names
  const marcaIds = [...new Set(productos.map((p) => p.marca_id).filter(Boolean))] as string[]
  const marcasMap: Record<string, string> = {}
  if (marcaIds.length > 0) {
    const { data: marcas } = await supabase
      .from('producto_marcas')
      .select('id, nombre')
      .in('id', marcaIds)
    for (const m of marcas ?? []) {
      marcasMap[m.id] = m.nombre
    }
  }

  // Filter by category if needed
  let filteredProdIds: Set<string> | null = null
  if (filtros?.categoria_id) {
    filteredProdIds = new Set(
      (links ?? [])
        .filter((l) => l.categoria_id === filtros.categoria_id)
        .map((l) => l.producto_id)
    )
  }

  return productos
    .filter((p) => !filteredProdIds || filteredProdIds.has(p.id))
    .map((p) => ({
      ...p,
      precio_base_ars: p.precio_base_ars ? Number(p.precio_base_ars) : null,
      precio_base_usd: p.precio_base_usd ? Number(p.precio_base_usd) : null,
      stock_simple: p.stock_simple ? Number(p.stock_simple) : null,
      modos_disponibles: p.modos_disponibles ?? ['venta'],
      cantidad_por_bulto: p.cantidad_por_bulto ? Number(p.cantidad_por_bulto) : null,
      peso_kg: p.peso_kg ? Number(p.peso_kg) : null,
      iva_compra: p.iva_compra ? Number(p.iva_compra) : null,
      iva_venta: p.iva_venta ? Number(p.iva_venta) : null,
      precio_compra: p.precio_compra ? Number(p.precio_compra) : null,
      stock_minimo: p.stock_minimo ? Number(p.stock_minimo) : null,
      categorias: (links ?? [])
        .filter((l) => l.producto_id === p.id)
        .map((l) => catsMap[l.categoria_id])
        .filter(Boolean),
      variantes_count: varCountMap[p.id] ?? 0,
      marca_nombre: p.marca_id ? (marcasMap[p.marca_id] ?? null) : null,
    })) as ProductoConCategorias[]
}

export async function productoPorId(
  tenant_id: string,
  id: string
): Promise<ProductoConCategorias | null> {
  const supabase = createServiceRoleClient()

  const { data: producto } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .maybeSingle()

  if (!producto) return null

  const { data: links } = await supabase
    .from('producto_categoria_links')
    .select('categoria_id')
    .eq('producto_id', id)

  const catIds = (links ?? []).map((l) => l.categoria_id)
  let categorias: { id: string; nombre: string; slug: string }[] = []
  if (catIds.length > 0) {
    const { data: cats } = await supabase
      .from('producto_categorias')
      .select('id, nombre, slug')
      .in('id', catIds)
    categorias = (cats ?? []).map((c) => ({ id: c.id, nombre: c.nombre, slug: c.slug }))
  }

  const { data: variantes } = await supabase
    .from('productos_variantes')
    .select('id')
    .eq('producto_id', id)
    .is('deleted_at', null)

  let marca_nombre: string | null = null
  if (producto.marca_id) {
    const { data: marca } = await supabase
      .from('producto_marcas')
      .select('nombre')
      .eq('id', producto.marca_id)
      .maybeSingle()
    marca_nombre = marca?.nombre ?? null
  }

  return {
    ...producto,
    precio_base_ars: producto.precio_base_ars ? Number(producto.precio_base_ars) : null,
    precio_base_usd: producto.precio_base_usd ? Number(producto.precio_base_usd) : null,
    stock_simple: producto.stock_simple ? Number(producto.stock_simple) : null,
    modos_disponibles: producto.modos_disponibles ?? ['venta'],
    cantidad_por_bulto: producto.cantidad_por_bulto ? Number(producto.cantidad_por_bulto) : null,
    peso_kg: producto.peso_kg ? Number(producto.peso_kg) : null,
    iva_compra: producto.iva_compra ? Number(producto.iva_compra) : null,
    iva_venta: producto.iva_venta ? Number(producto.iva_venta) : null,
    precio_compra: producto.precio_compra ? Number(producto.precio_compra) : null,
    stock_minimo: producto.stock_minimo ? Number(producto.stock_minimo) : null,
    categorias,
    variantes_count: variantes?.length ?? 0,
    marca_nombre,
  } as ProductoConCategorias
}

export async function listarVariantes(
  producto_id: string
): Promise<ProductoVariante[]> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('productos_variantes')
    .select('*')
    .eq('producto_id', producto_id)
    .is('deleted_at', null)
    .order('nombre_variante')

  return (data ?? []).map((v) => ({
    ...v,
    precio_diferencial_ars: v.precio_diferencial_ars ? Number(v.precio_diferencial_ars) : null,
    precio_diferencial_usd: v.precio_diferencial_usd ? Number(v.precio_diferencial_usd) : null,
    stock_simple_variante: v.stock_simple_variante ? Number(v.stock_simple_variante) : null,
    atributos: (v.atributos ?? {}) as Record<string, string>,
  })) as ProductoVariante[]
}

export async function listarCategorias(
  tenant_id: string
): Promise<ProductoCategoria[]> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('producto_categorias')
    .select('*')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .order('orden')
    .order('nombre')

  return (data ?? []) as ProductoCategoria[]
}

export async function listarCategoriasJerarquicas(
  tenant_id: string
): Promise<CategoriaConHijos[]> {
  const flat = await listarCategorias(tenant_id)

  const map = new Map<string, CategoriaConHijos>()
  for (const cat of flat) {
    map.set(cat.id, { ...cat, children: [] })
  }

  const roots: CategoriaConHijos[] = []
  for (const cat of map.values()) {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(cat)
    } else {
      roots.push(cat)
    }
  }

  return roots
}

export async function listarUnidadesMedida(): Promise<UnidadMedida[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('catalogo_unidades_medida')
    .select('*')
    .eq('activo', true)
    .order('slug')
  return (data ?? []) as UnidadMedida[]
}

// --- Marcas ---

export async function listarMarcas(tenant_id: string): Promise<Marca[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('producto_marcas')
    .select('*')
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .order('nombre')
  return (data ?? []) as Marca[]
}

export async function marcaPorId(
  tenant_id: string,
  id: string
): Promise<Marca | null> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('producto_marcas')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .maybeSingle()
  return (data as Marca) ?? null
}

// --- Imagenes ---

export async function imagenesDeProducto(producto_id: string): Promise<ProductoImagen[]> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('producto_imagenes')
    .select('*')
    .eq('producto_id', producto_id)
    .order('orden')
  return (data ?? []) as ProductoImagen[]
}
