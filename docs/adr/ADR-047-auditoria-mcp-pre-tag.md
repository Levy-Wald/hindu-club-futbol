# ADR-047 — Auditoria MCP obligatoria pre-tag

**Status**: Accepted
**Fecha**: 14 de mayo de 2026
**Contexto**: Sprint H1 (Tramo 2 RFC-005)

## Problema

Durante la ejecucion acelerada de 10 sprints entre 13-may y 14-may (A1.1 a A3.6), se detecto drift TS-BD en Sprint A2.6 que requirio hotfix post-tag. La causa: no se verifico via MCP que las columnas del codigo coincidieran con las de la BD antes de tagear.

## Decision

Antes de aplicar un tag de cierre de sprint, Code DEBE ejecutar una auditoria MCP minima de 3 checks:

### Check 1 — Columnas

Para cada tabla nueva o modificada en el sprint:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = '<tabla>'
ORDER BY ordinal_position;
```

Comparar contra los tipos/interfaces TypeScript del modulo. Si hay discrepancia, corregir antes de tagear.

### Check 2 — RLS y policies

```sql
SELECT relrowsecurity FROM pg_class WHERE relname = '<tabla>';
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = '<tabla>';
```

Toda tabla operativa debe tener RLS habilitado y al menos una policy de tenant (directa o via FK-through).

### Check 3 — Trigger updated_at

```sql
SELECT trigger_name, action_statement
FROM information_schema.triggers
WHERE event_object_table = '<tabla>';
```

Verificar que usa `trg_set_updated_at()` (NO `set_updated_at()`). Excepciones: tablas log/media inmutables.

## Consecuencias

- Agrega 2-5 minutos por sprint antes del tag.
- Elimina hotfixes post-tag por drift.
- Alineado con ADR-039 (verificacion produccion via MCP).

## Anti-patron relacionado

AP-007: Tagear sin verificar drift TS-BD via MCP. Detectado en A2.6, corregido con hotfix `795f56d`.
