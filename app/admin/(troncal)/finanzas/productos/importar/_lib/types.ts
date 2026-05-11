export type ProductoFieldKey =
  | 'nombre'
  | 'tipo'
  | 'sku'
  | 'ean13'
  | 'ean14'
  | 'marca'
  | 'modelo'
  | 'color'
  | 'material'
  | 'origen'
  | 'unidad_medida'
  | 'descripcion'
  | 'descripcion_larga'
  | 'precio'
  | 'precio_compra'
  | 'moneda'
  | 'iva_venta'
  | 'iva_compra'
  | 'es_arancelado'
  | 'es_comprable'
  | 'stock_actual'
  | 'stock_minimo'
  | 'peso_kg'
  | 'instalacion'

export const PRODUCTO_FIELD_OPTIONS: { value: ProductoFieldKey; label: string; group: string }[] = [
  // Identidad
  { value: 'nombre', label: 'Nombre', group: 'Identidad' },
  { value: 'tipo', label: 'Tipo', group: 'Identidad' },
  { value: 'sku', label: 'SKU', group: 'Identidad' },
  { value: 'ean13', label: 'EAN-13', group: 'Identidad' },
  { value: 'ean14', label: 'EAN-14', group: 'Identidad' },
  { value: 'marca', label: 'Marca', group: 'Identidad' },
  { value: 'modelo', label: 'Modelo', group: 'Identidad' },
  { value: 'color', label: 'Color', group: 'Identidad' },
  { value: 'material', label: 'Material', group: 'Identidad' },
  { value: 'origen', label: 'Origen', group: 'Identidad' },
  { value: 'unidad_medida', label: 'Unidad de medida', group: 'Identidad' },
  { value: 'descripcion', label: 'Descripción', group: 'Identidad' },
  { value: 'descripcion_larga', label: 'Descripción larga', group: 'Identidad' },
  // Precios
  { value: 'precio', label: 'Precio venta', group: 'Precios' },
  { value: 'precio_compra', label: 'Precio compra', group: 'Precios' },
  { value: 'moneda', label: 'Moneda', group: 'Precios' },
  { value: 'iva_venta', label: 'IVA venta (%)', group: 'Precios' },
  { value: 'iva_compra', label: 'IVA compra (%)', group: 'Precios' },
  { value: 'es_arancelado', label: 'Vendible (si/no)', group: 'Precios' },
  { value: 'es_comprable', label: 'Comprable (si/no)', group: 'Precios' },
  // Inventario
  { value: 'stock_actual', label: 'Stock actual', group: 'Inventario' },
  { value: 'stock_minimo', label: 'Stock mínimo', group: 'Inventario' },
  { value: 'peso_kg', label: 'Peso (kg)', group: 'Inventario' },
  { value: 'instalacion', label: 'Instalación', group: 'Inventario' },
]
