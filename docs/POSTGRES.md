# PostgreSQL — Schema, Funciones, RLS y Migraciones

## Schema de la base de datos

### Funciones SQL helper

| Función | Tipo | Uso |
|---------|------|-----|
| `get_tenant_actual()` | SECURITY DEFINER | Devuelve tenant_id del usuario logueado via `auth.uid()` → `personas.user_id` |
| `get_persona_actual()` | SECURITY DEFINER | Devuelve persona logueada con tenant + atributos + módulos |
| `tiene_atributo(slug)` | SECURITY DEFINER | True si la persona logueada tiene el atributo |
| `modulo_activo(slug)` | SECURITY DEFINER | True si el módulo está activo en el tenant |
| `dedupe_persona_por_dni(tenant, dni, datos)` | SECURITY DEFINER | Busca persona por DNI; si no existe, la crea |
| `trg_set_updated_at()` | Trigger function | Actualiza `updated_at = now()` en cada UPDATE |

**IMPORTANTE:** Todas las funciones usadas en RLS policies DEBEN ser `SECURITY DEFINER` con `SET search_path = public, pg_temp` (ver BUG-001).

### Triggers automáticos

- `trg_set_updated_at`: actualiza `updated_at` en cada UPDATE (en todas las tablas core)
- `trg_audit_log`: registra en `audit_log` cualquier cambio en tablas core

### Columnas estándar en tablas operacionales

```sql
id uuid PK DEFAULT gen_random_uuid()
tenant_id uuid FK NOT NULL              -- multi-tenant
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()    -- trigger auto-update
metadata jsonb DEFAULT '{}'             -- extensibilidad
deleted_at timestamptz NULL             -- soft delete (donde aplique)
```

### Grupos de tablas (68 totales)

**Core (personas):** `personas`, `personas_atributos`, `personas_vinculos`, `personas_equipos`, `personas_padrones`, `personas_datos_medicos`, `personas_documentos_identidad`, `personas_documentos_medicos`, `personas_lesiones`, `personas_rehabilitaciones`, `personas_vehiculos`, `personas_obra_social`

**Equipos:** `equipos`, `equipos_horarios`, `categorias_equipo`, `eventos`

**Padrones:** `padrones`, `personas_padrones`

**Entidades:** `entidades`, `entidades_representantes`, `sedes`, `canchas`

**Finanzas:** `cajas`, `movimientos_caja`, `plan_cuentas`, `productos_servicios`, `cuotas_planes`, `cuotas_emitidas`, `cuotas_generadas`, `cuotas_bonificaciones`, `emisiones_cuota`, `cuentas_corrientes`, `centros_costo`, `medios_pago`, `tipos_comprobante`, `periodos_contables`, `config_financiera`, `convenios_pago`, `cotizaciones`, `categorias_movimiento`

**Config/Sistema:** `tenants`, `tenant_config_publica`, `tenant_modulos`, `catalogo_modulos`, `pre_inscripciones`, `user_vistas`, `audit_log`, `solicitudes`

**Catálogos:** `catalogo_atributos`, `catalogo_disciplinas`, `catalogo_estados_padron`, `catalogo_tipos_socio`, `catalogo_roles_equipo`, `catalogo_motivos_baja`, `catalogo_tipos_vinculo`, `catalogo_niveles_competencia`, `catalogo_tipos_documento`, `catalogo_tipos_estudio`, `catalogo_obras_sociales`, `catalogo_tipos_vehiculo`, `catalogo_companias_seguro`, `catalogo_categorias_movimiento`

### Relaciones clave

```
personas ──< personas_atributos (atributo_slug → catalogo_atributos)
personas ──< personas_vinculos (persona_id ↔ persona_vinculada_id, bidireccional)
personas ──< personas_equipos (persona_id + equipo_id + rol_equipo_slug)
personas ──< personas_padrones (persona_id + padron_id)
personas ──< movimientos_caja (persona_id, opcional)
personas ──< cuotas_generadas (persona_id)
entidades ──< movimientos_caja (entidad_id, opcional)
entidades ──< entidades_representantes ──> personas
equipos ──< eventos
equipos ──< equipos_horarios
equipos ──> categorias_equipo
cajas ──< movimientos_caja
cuotas_planes ──< emisiones_cuota ──< cuotas_generadas
productos_servicios ──< movimientos_caja (producto_id, opcional)
```

---

## Índices: cuándo y cómo

| Patrón de query | Tipo de índice | Ejemplo |
|-----------------|---------------|---------|
| `WHERE col = valor` | B-tree (default) | `CREATE INDEX idx ON t (col)` |
| `WHERE col > valor` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | Compuesto | `CREATE INDEX idx ON t (a, b)` — igualdad primero |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| Series temporales | BRIN | `CREATE INDEX idx ON t USING brin (created_at)` |

### Índice parcial (ahorra espacio)
```sql
CREATE INDEX idx ON personas (email) WHERE deleted_at IS NULL;
```

### Índice covering (evita ir a la tabla)
```sql
CREATE INDEX idx ON personas (numero_documento) INCLUDE (nombre, apellido);
```

## RLS optimizada

Wrappear `auth.uid()` en SELECT para evitar re-evaluación por fila:
```sql
-- MAL: se evalúa por cada fila
CREATE POLICY pol ON personas USING (tenant_id = get_tenant_actual());

-- BIEN: se evalúa una vez
CREATE POLICY pol ON personas USING (tenant_id = (SELECT get_tenant_actual()));
```

**BUG-001:** Funciones helper en RLS que consultan tablas con RLS DEBEN ser SECURITY DEFINER. Si no → recursión infinita.

## Paginación por cursor (para listas grandes)

```sql
SELECT * FROM personas
WHERE id > $last_id
ORDER BY id
LIMIT 20;
```

## Queries de auditoría

```sql
-- FK sin índice (causa JOINs lentos)
SELECT conrelid::regclass, a.attname
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  );

-- Tablas con bloat
SELECT relname, n_dead_tup, last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

---

## Migraciones seguras

### Checklist antes de aplicar

- [ ] Columnas nuevas son nullable O tienen DEFAULT
- [ ] Índices creados con `CONCURRENTLY`
- [ ] Backfill de datos es migración separada del cambio de schema
- [ ] Migración es idempotente (`IF NOT EXISTS`, `IF EXISTS`)
- [ ] Rollback documentado en comentario del archivo

### Agregar columna de forma segura

```sql
-- BIEN: nullable, no lockea
ALTER TABLE personas ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- BIEN: con default (Postgres 11+ es instantáneo)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- MAL: NOT NULL sin default = reescribe toda la tabla, lockea
ALTER TABLE personas ADD COLUMN rol TEXT NOT NULL;
```

### Crear índice sin downtime

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personas_email ON personas (email);
```

### Renombrar columna (expand-contract)

1. Migración 1: Agregar columna nueva (nullable)
2. Migración 2: Backfill datos de vieja a nueva
3. Deploy: app lee/escribe ambas columnas
4. Migración 3: Dropear columna vieja

### Batch updates para datos grandes

```sql
DO $$
DECLARE
  batch_size INT := 5000;
  rows_updated INT;
BEGIN
  LOOP
    UPDATE personas
    SET campo_nuevo = transformacion(campo_viejo)
    WHERE id IN (
      SELECT id FROM personas
      WHERE campo_nuevo IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    );
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;
    COMMIT;
  END LOOP;
END $$;
```

### Convención de nombres

Formato: `YYYYMMDD[HHMMSS]_descripcion_corta.sql`

```
supabase/migrations/
  20260504220000_clubcore_init.sql           # Sprint 1
  20260504222811_fixes_seed_hindu.sql         # Sprint 1
  20260504230000_seed_hindu.sql              # Sprint 1
  20260505010000_lesiones_rehabilitaciones.sql # Sprint 2
  20260505020000_user_vistas.sql             # UX
  20260505100000_entidades_representantes.sql # Sprint 6
  20260505200000_sprint7_solicitudes_indumentaria.sql # Sprint 7
  20260505210000_equipo_torneo.sql           # Sprint 7
  20260505220000_eventos_calendario.sql      # Sprint 7
  20260505_sprint8_public_pages.sql          # Sprint 8
  20260506_modulo_finanzas.sql               # Sprint 9
  20260506_modulo_finanzas_seed.sql          # Sprint 9
  20260506_modulo_finanzas_tipos_producto.sql # Sprint 9
  20260506_modulo_finanzas_producto_erp.sql  # Sprint 9
  20260506_branding_campos_extra.sql         # Sprint 9
```

---

## Supabase CLI — Comandos útiles

```bash
# Generar tipos TypeScript desde la DB remota
supabase gen types typescript --linked > lib/database.types.ts

# Ver diferencias entre local y remoto
supabase db diff -f nombre_migracion

# Preview de migración sin aplicar
supabase db push --dry-run

# Auditar índices no usados
supabase inspect db unused-indexes --linked

# Ver estado de migraciones
supabase migration list

# Proyecto Supabase correcto (v2):
# Project ref: hkoizqbptwhnepzbmjql
# NO usar: tjaczmbrbqmjzrkjkdyq (ese es v1, schema distinto)
```
