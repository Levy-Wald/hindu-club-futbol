# PostgreSQL — Patrones y Migraciones

## Indices: cuando y como

| Patron de query | Tipo de indice | Ejemplo |
|-----------------|---------------|---------|
| `WHERE col = valor` | B-tree (default) | `CREATE INDEX idx ON t (col)` |
| `WHERE col > valor` | B-tree | `CREATE INDEX idx ON t (col)` |
| `WHERE a = x AND b > y` | Compuesto | `CREATE INDEX idx ON t (a, b)` — igualdad primero, rango despues |
| `WHERE jsonb @> '{}'` | GIN | `CREATE INDEX idx ON t USING gin (col)` |
| Series temporales | BRIN | `CREATE INDEX idx ON t USING brin (created_at)` |

### Indice parcial (ahorra espacio)
```sql
CREATE INDEX idx ON personas (email) WHERE deleted_at IS NULL;
```

### Indice covering (evita ir a la tabla)
```sql
CREATE INDEX idx ON personas (numero_documento) INCLUDE (nombre, apellido);
```

## RLS optimizada

Wrappear `auth.uid()` en SELECT para evitar re-evaluacion por fila:
```sql
-- MAL: se evalua por cada fila
CREATE POLICY pol ON personas USING (tenant_id = get_tenant_actual());

-- BIEN: se evalua una vez
CREATE POLICY pol ON personas USING (tenant_id = (SELECT get_tenant_actual()));
```

Recordar BUG-001: funciones helper en RLS que consultan tablas con RLS DEBEN ser SECURITY DEFINER.

## Paginacion por cursor (para listas grandes)

```sql
-- O(1) sin importar la pagina
SELECT * FROM personas
WHERE id > $last_id
ORDER BY id
LIMIT 20;

-- vs OFFSET que es O(n) — evitar en listas grandes
```

## Queries de auditoria

```sql
-- FK sin indice (causa JOINs lentos)
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

- [ ] Columnas nuevas son nullable O tienen DEFAULT (nunca NOT NULL sin default en tabla existente)
- [ ] Indices creados con `CONCURRENTLY` (no bloquea escrituras)
- [ ] Backfill de datos es migracion separada del cambio de schema
- [ ] Migracion es idempotente (`IF NOT EXISTS`, `IF EXISTS`)
- [ ] Rollback documentado en comentario del archivo

### Agregar columna de forma segura

```sql
-- BIEN: nullable, no lockea
ALTER TABLE personas ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- BIEN: con default (Postgres 11+ es instantaneo)
ALTER TABLE personas ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- MAL: NOT NULL sin default = reescribe toda la tabla, lockea
ALTER TABLE personas ADD COLUMN rol TEXT NOT NULL;
```

### Crear indice sin downtime

```sql
-- MAL: bloquea escrituras
CREATE INDEX idx_personas_email ON personas (email);

-- BIEN: no bloquea (no puede ir dentro de una transaccion)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personas_email ON personas (email);
```

### Renombrar columna (expand-contract)

Nunca renombrar directo en produccion:

1. Migracion 1: Agregar columna nueva (nullable)
2. Migracion 2: Backfill datos de vieja a nueva
3. Deploy: app lee/escribe ambas columnas
4. Migracion 3: Dropear columna vieja

### Eliminar columna

1. Primero: remover todas las referencias en el codigo
2. Deploy sin la columna en el codigo
3. Despues: migracion que dropea la columna

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

### Convencion de nombres de migracion

```
supabase/migrations/
  20260504220000_clubcore_init.sql
  20260504222811_fixes_seed_hindu.sql
  20260504230000_seed_hindu.sql
  20260505010000_lesiones_rehabilitaciones.sql
```

Formato: `YYYYMMDDHHMMSS_descripcion_corta.sql`

---

## Supabase CLI — Comandos utiles

```bash
# Generar tipos TypeScript desde la DB remota
supabase gen types typescript --linked > lib/database.types.ts

# Ver diferencias entre local y remoto
supabase db diff -f nombre_migracion

# Preview de migracion sin aplicar
supabase db push --dry-run

# Auditar indices no usados
supabase inspect db unused-indexes --linked

# Ver bloat de tablas
supabase inspect db bloat --linked

# Ver estado de migraciones
supabase migration list
```
