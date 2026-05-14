export type ProductoTipo = 'producto' | 'servicio'

export type ModoOperacion = 'venta' | 'alquiler' | 'prestamo' | 'gratis'

export type Producto = {
  id: string
  tenant_id: string
  sku: string | null
  nombre: string
  descripcion: string | null
  tipo: ProductoTipo
  precio_base_ars: number | null
  precio_base_usd: number | null
  stock_simple: number | null
  unidad_medida_slug: string | null
  imagen_url: string | null
  marca_id: string | null
  modos_disponibles: ModoOperacion[]
  activo: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ProductoConCategorias = Producto & {
  categorias: { id: string; nombre: string; slug: string }[]
  variantes_count: number
  marca_nombre: string | null
}

export type ProductoVariante = {
  id: string
  producto_id: string
  sku_variante: string | null
  nombre_variante: string
  precio_diferencial_ars: number | null
  precio_diferencial_usd: number | null
  stock_simple_variante: number | null
  atributos: Record<string, string>
  imagen_url: string | null
  activo: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ProductoCategoria = {
  id: string
  tenant_id: string
  nombre: string
  slug: string
  parent_id: string | null
  orden: number
  descripcion: string | null
  activo: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type CategoriaConHijos = ProductoCategoria & {
  children: CategoriaConHijos[]
}

export type UnidadMedida = {
  slug: string
  nombre: string
  abreviatura: string | null
  tipo: string
  activo: boolean
}

export type Marca = {
  id: string
  tenant_id: string
  nombre: string
  slug: string
  descripcion: string | null
  logo_url: string | null
  sitio_web: string | null
  activo: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ProductoImagen = {
  id: string
  producto_id: string
  url: string
  alt_text: string | null
  orden: number
  es_principal: boolean
  created_at: string
}

export type CatalogoProductoRow = {
  origen: 'pim'
  id_origen: string
  tenant_id: string
  sku: string | null
  nombre: string
  descripcion: string | null
  tipo: string
  precio_ars: number | null
  stock: number | null
  unidad_medida_slug: string | null
  imagen_url: string | null
  marca_id: string | null
  marca_nombre: string | null
  modos_disponibles: ModoOperacion[]
  activo: boolean
  created_at: string
}
