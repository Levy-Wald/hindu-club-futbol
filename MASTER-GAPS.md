# MASTER-GAPS — Lista de pendientes y lecciones

## Bugs encontrados y resueltos

### BUG-001: get_tenant_actual() recursión infinita en RLS
- **Sprint:** 1
- **Síntoma:** Error 500 — Postgres 54001 (stack depth exceeded)
- **Causa:** `get_tenant_actual()` era SECURITY INVOKER. Al consultar `personas`, disparaba la policy de personas que llamaba a `get_tenant_actual()` → loop infinito.
- **Fix:** Cambiar a SECURITY DEFINER + `SET search_path = public, pg_temp` + revocar acceso a anon/public, solo authenticated.
- **Lección:** Funciones helper usadas en RLS policies que consultan tablas con RLS DEBEN ser SECURITY DEFINER.

## Pendientes

_(vacío por ahora)_
