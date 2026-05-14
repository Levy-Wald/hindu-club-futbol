export type ProductoTipo = 'producto' | 'servicio'

export type ModoOperacion = 'venta' | 'alquiler' | 'prestamo' | 'gratis'

export type TipoUso = 'reventa' | 'uso_interno_consumible' | 'uso_interno_bien_uso' | 'servicio'

export type Producto = {
  id: string
  tenant_id: string
  sku: string | null
  nombre: string
  /** @deprecated Usar descripcion_corta + descripcion_larga */
  descripcion: string | null
  descripcion_corta: string | null
  descripcion_larga: string | null
  tipo: ProductoTipo
  tipo_uso: TipoUso | null
  precio_base_ars: number | null
  precio_base_usd: number | null
  stock_simple: number | null
  unidad_medida_slug: string | null
  imagen_url: string | null
  marca_id: string | null
  modos_disponibles: ModoOperacion[]
  ean13: string | null
  ean14: string | null
  material: string | null
  color: string | null
  medida_tamano: string | null
  origen_pais: string | null
  cantidad_por_bulto: number | null
  peso_kg: number | null
  // Financial / accounting
  cuenta_ingreso_id: string | null
  cuenta_egreso_id: string | null
  categoria_movimiento_id: string | null
  centro_costo_id: string | null
  es_arancelado: boolean
  es_comprable: boolean
  iva_compra: number | null
  iva_venta: number | null
  precio_compra: number | null
  stock_minimo: number | null
  cupo_maximo: number | null
  instalacion: string | null
  moneda: string
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
  talle_id: string | null
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

export type RolResponsable =
  | 'general'
  | 'compras'
  | 'stock'
  | 'marketing'
  | 'product_owner'
  | 'qa'
  | 'logistica'
  | 'ventas'

export type ProductoProveedor = {
  id: string
  producto_id: string
  entidad_id: string | null
  persona_id: string | null
  es_principal: boolean
  codigo_proveedor: string | null
  plazo_entrega_dias: number | null
  moneda_compra: string | null
  precio_proveedor: number | null
  notas: string | null
  created_at: string
  updated_at: string
  // Resolved
  nombre_proveedor: string
}

export type ProductoResponsable = {
  id: string
  producto_id: string
  persona_id: string | null
  atributo_slug: string | null
  rol: RolResponsable
  notas: string | null
  created_at: string
  updated_at: string
  // Resolved
  nombre_responsable: string
}

export type TipoLista = 'compra' | 'costo' | 'venta'

export type ListaPrecios = {
  id: string
  tenant_id: string
  slug: string
  nombre: string
  descripcion: string | null
  tipo: TipoLista
  moneda: string
  activa: boolean
  es_default: boolean
  orden: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type PrecioProducto = {
  id: string
  producto_id: string
  variante_id: string | null
  lista_id: string
  precio: number
  moneda: string
  fecha_vigencia_desde: string | null
  fecha_vigencia_hasta: string | null
  notas: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
  // Resolved
  lista_slug?: string
  lista_nombre?: string
  lista_tipo?: TipoLista
  variante_nombre?: string | null
}

export type TipoMovimiento = 'entrada' | 'salida' | 'transferencia' | 'ajuste'

export type StockEspacio = {
  id: string
  producto_id: string
  variante_id: string | null
  espacio_id: string
  cantidad: number
  stock_minimo: number | null
  stock_maximo: number | null
  created_at: string
  updated_at: string
  // Resolved
  espacio_nombre?: string
  variante_nombre?: string | null
}

export type MovimientoStock = {
  id: string
  producto_id: string
  variante_id: string | null
  tipo: TipoMovimiento
  cantidad: number
  espacio_origen_id: string | null
  espacio_destino_id: string | null
  motivo: string | null
  referencia_tabla: string | null
  referencia_id: string | null
  realizado_por_persona_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  // Resolved
  producto_nombre?: string
  variante_nombre?: string | null
  espacio_origen_nombre?: string | null
  espacio_destino_nombre?: string | null
  realizado_por_nombre?: string | null
}

export type CatalogoProductoRow = {
  origen: 'pim'
  id_origen: string
  tenant_id: string
  sku: string | null
  nombre: string
  descripcion: string | null
  tipo: string
  tipo_uso: TipoUso | null
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
