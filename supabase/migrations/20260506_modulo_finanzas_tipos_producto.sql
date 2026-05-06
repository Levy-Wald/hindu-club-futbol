-- ---------------------------------------------------------------------------
-- Migración: Extensión de tipos y columnas en productos_servicios
-- Módulo:    Finanzas
-- Fecha:     2026-05-06
-- Autor:     ClubCore / Yair Levy Wald
--
-- Cambios:
--   1. Amplía el CHECK constraint de `tipo` para incluir:
--        'insumo', 'activo', 'gasto'
--      (lista completa: producto, servicio, cuota, actividad, alquiler,
--                       insumo, activo, gasto)
--   2. Agrega columna `es_comprable` (boolean, NOT NULL, DEFAULT false):
--        indica si el ítem puede aparecer en órdenes de compra / compras.
--   3. Agrega columna `deleted_at` (timestamptz, NULL):
--        soft-delete — registro lógicamente eliminado cuando NOT NULL.
--
-- Idempotencia:
--   - DROP CONSTRAINT IF EXISTS antes de ADD CONSTRAINT
--   - Columnas agregadas con bloque DO $$ IF NOT EXISTS $$
-- ---------------------------------------------------------------------------

-- 1. Reemplazar CHECK constraint de `tipo`
--    PostgreSQL genera el nombre automático "productos_servicios_tipo_check"
--    cuando el constraint se define inline (sin nombre explícito).
--    Lo dropeamos y re-creamos con la lista ampliada.

ALTER TABLE productos_servicios
  DROP CONSTRAINT IF EXISTS productos_servicios_tipo_check;

ALTER TABLE productos_servicios
  ADD CONSTRAINT productos_servicios_tipo_check
    CHECK (tipo IN (
      'producto',
      'servicio',
      'cuota',
      'actividad',
      'alquiler',
      'insumo',
      'activo',
      'gasto'
    ));

-- 2. Agregar columna `es_comprable` si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'productos_servicios'
      AND column_name  = 'es_comprable'
  ) THEN
    ALTER TABLE productos_servicios
      ADD COLUMN es_comprable boolean NOT NULL DEFAULT false;

    COMMENT ON COLUMN productos_servicios.es_comprable IS
      'Indica si el ítem puede figurar en órdenes/registros de compra (egresos)';
  END IF;
END;
$$;

-- 3. Agregar columna `deleted_at` (soft delete) si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'productos_servicios'
      AND column_name  = 'deleted_at'
  ) THEN
    ALTER TABLE productos_servicios
      ADD COLUMN deleted_at timestamptz;

    COMMENT ON COLUMN productos_servicios.deleted_at IS
      'Soft delete: cuando NOT NULL el registro se considera eliminado lógicamente';
  END IF;
END;
$$;
