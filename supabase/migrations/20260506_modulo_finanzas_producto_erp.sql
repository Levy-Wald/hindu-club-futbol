-- ---------------------------------------------------------------------------
-- Migración: Producto ERP completo + tabla producto_proveedor
-- Módulo:    Finanzas
-- Fecha:     2026-05-06
--
-- Cambios:
--   1. Tipos expandidos: locker, cochera, expensa, multa, consumo
--   2. Campos ERP: sku, ean13, ean14, marca, modelo, color, material,
--      origen, unidad_medida, descripcion_larga, precio_compra,
--      iva_compra, iva_venta, stock_actual, stock_minimo, peso_kg,
--      cupo_maximo, instalacion
--   3. Unique indexes para SKU y EAN13 por tenant
--   4. Tabla producto_proveedor (muchos a muchos con entidades)
-- ---------------------------------------------------------------------------

-- 1. Constraint de tipo expandido
ALTER TABLE productos_servicios DROP CONSTRAINT IF EXISTS productos_servicios_tipo_check;
ALTER TABLE productos_servicios ADD CONSTRAINT productos_servicios_tipo_check
  CHECK (tipo IN (
    'producto','servicio','cuota','actividad','alquiler',
    'insumo','activo','gasto',
    'locker','cochera','expensa','multa','consumo'
  ));

-- 2. Campos ERP identidad + precios + stock
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='sku') THEN
    ALTER TABLE productos_servicios ADD COLUMN sku text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='ean13') THEN
    ALTER TABLE productos_servicios ADD COLUMN ean13 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='ean14') THEN
    ALTER TABLE productos_servicios ADD COLUMN ean14 text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='marca') THEN
    ALTER TABLE productos_servicios ADD COLUMN marca text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='modelo') THEN
    ALTER TABLE productos_servicios ADD COLUMN modelo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='color') THEN
    ALTER TABLE productos_servicios ADD COLUMN color text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='material') THEN
    ALTER TABLE productos_servicios ADD COLUMN material text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='origen') THEN
    ALTER TABLE productos_servicios ADD COLUMN origen text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='unidad_medida') THEN
    ALTER TABLE productos_servicios ADD COLUMN unidad_medida text NOT NULL DEFAULT 'unidad';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='descripcion_larga') THEN
    ALTER TABLE productos_servicios ADD COLUMN descripcion_larga text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='precio_compra') THEN
    ALTER TABLE productos_servicios ADD COLUMN precio_compra numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='iva_compra') THEN
    ALTER TABLE productos_servicios ADD COLUMN iva_compra numeric(5,2) DEFAULT 21.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='iva_venta') THEN
    ALTER TABLE productos_servicios ADD COLUMN iva_venta numeric(5,2) DEFAULT 21.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='stock_actual') THEN
    ALTER TABLE productos_servicios ADD COLUMN stock_actual numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='stock_minimo') THEN
    ALTER TABLE productos_servicios ADD COLUMN stock_minimo numeric(12,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='peso_kg') THEN
    ALTER TABLE productos_servicios ADD COLUMN peso_kg numeric(8,3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='cupo_maximo') THEN
    ALTER TABLE productos_servicios ADD COLUMN cupo_maximo int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos_servicios' AND column_name='instalacion') THEN
    ALTER TABLE productos_servicios ADD COLUMN instalacion text;
  END IF;
END;
$$;

-- 3. Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_sku_tenant
  ON productos_servicios(tenant_id, sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_ean13_tenant
  ON productos_servicios(tenant_id, ean13) WHERE ean13 IS NOT NULL AND deleted_at IS NULL;

-- 4. Tabla producto_proveedor
CREATE TABLE IF NOT EXISTS producto_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos_servicios(id) ON DELETE CASCADE,
  entidad_id uuid NOT NULL REFERENCES entidades(id) ON DELETE CASCADE,
  codigo_proveedor text,
  precio_proveedor numeric(12,2),
  moneda_proveedor text DEFAULT 'ARS',
  es_proveedor_principal boolean DEFAULT false,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, producto_id, entidad_id)
);

CREATE INDEX IF NOT EXISTS idx_producto_proveedor_tenant ON producto_proveedor(tenant_id);
CREATE INDEX IF NOT EXISTS idx_producto_proveedor_producto ON producto_proveedor(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_proveedor_entidad ON producto_proveedor(entidad_id);

-- 5. Comentarios
COMMENT ON COLUMN productos_servicios.precio IS 'Precio de venta sin impuestos (precio base)';
COMMENT ON COLUMN productos_servicios.precio_compra IS 'Precio de compra sin impuestos';
COMMENT ON COLUMN productos_servicios.iva_compra IS 'Alicuota IVA compra (ej: 21.00, 10.50, 0)';
COMMENT ON COLUMN productos_servicios.iva_venta IS 'Alicuota IVA venta (ej: 21.00, 10.50, 0)';
COMMENT ON COLUMN productos_servicios.stock_actual IS 'Stock actual (solo para tipos con inventario)';
COMMENT ON COLUMN productos_servicios.stock_minimo IS 'Stock minimo de alerta';
COMMENT ON COLUMN productos_servicios.cupo_maximo IS 'Cupo maximo (actividades, servicios con capacidad)';
COMMENT ON COLUMN productos_servicios.unidad_medida IS 'unidad, kg, litro, metro, hora, m2';
