# PARTE 8 — Deuda técnica y bugs conocidos

## 8.1 TODOs y FIXMEs en código

| Path | Línea | Comentario |
|------|-------|------------|
| `app/admin/comunicaciones/_actions.ts` | 216 | `TODO: Implementar envio real de email de prueba cuando el servicio de email este configurado.` |

**Total:** 1 TODO encontrado. Sin FIXMEs, XXX ni HACKs.

## 8.2 Sistemas legacy que conviven con sistemas nuevos

### 1. Import de padrones: legacy vs nuevo

| Aspecto | Legacy (Sprint 14a) | Nuevo (Sprint 14c) |
|---------|---------------------|---------------------|
| **Tablas** | `padron_syncs`, `padron_sync_diffs` | `import_pipelines`, `import_runs`, `import_rows` |
| **Código** | `lib/padron-sync/parsers.ts`, `processor.ts` | `lib/imports/actions.ts`, `parsers/` |
| **UI** | `/admin/padrones/sincronizar/` | `/admin/padrones/[id]/sync/` |
| **Acciones** | `subirArchivoSync`, `aplicarSyncBatch` | `iniciarImportRun`, `procesarMatching`, `aplicarRun` |
| **Funcionalidad** | Diffs (altas/bajas/cambios), rollback | Match fuzzy, apply rules engine, revisión per-row |
| **Estado** | Funciona pero no se usa activamente | En uso activo |

**Riesgo:** Ambos sistemas escriben en las mismas tablas destino (`personas`, `personas_padrones`, `personas_equipos`). No hay conflicto de datos pero sí confusión de UX (dos flujos distintos).

**Recomendación:** Deprecar completamente el sistema legacy. Las rutas `/admin/padrones/sincronizar/*` deberían redireccionar.

### 2. Import de personas: viejo wizard vs nuevo pipeline

| Aspecto | Viejo | Nuevo |
|---------|-------|-------|
| **UI** | `/admin/padrones/[id]/importar/` | `/admin/padrones/[id]/sync/nuevo` |
| **Código** | `app/admin/padrones/[id]/importar/_actions.ts` | `lib/imports/actions.ts` |
| **Estado** | Existe pero redirige | En uso |

### 3. Nombres de tablas financieras: originales vs VIEWs fin_*

| Original | VIEW | Código usa |
|----------|------|-----------|
| `cajas` | `fin_cajas` | Original |
| `movimientos_caja` | `fin_movimientos` | Original |
| `productos_servicios` | `fin_productos` | Original |
| `plan_cuentas` | `fin_plan_cuentas` | Original |
| `cuotas_planes` | `fin_cuotas_planes` | Original |
| `cuotas_emitidas` | `fin_cuotas_emitidas` | Original |
| `emisiones_cuota` | `fin_emisiones_cuota` | Original |
| `cuotas_bonificaciones` | `fin_cuotas_bonificaciones` | Original |
| `catalogo_categorias_movimiento` | `fin_categorias_movimiento` | Original |

**Riesgo:** Ninguno funcional (las VIEWs apuntan a las tablas). Pero el código no usa las VIEWs, haciendo el rename inútil hasta que se refactoree.

### 4. Nombres de atributos: viejos vs namespaced

Los atributos viejos (`admin_sistema`, `admin_tenant`, `staff`, etc.) fueron migrados a namespaced (`sistema.admin`, `tenant.admin`, etc.) en Sprint 11.6. El código UI usa los nuevos slugs. Las RLS policies **aún no fueron actualizadas** para usar `tiene_atributo_namespace()` — están diferidas a Sprint 16.

## 8.3 Bugs conocidos no resueltos

### Bugs abiertos:

1. **PENDIENTE_VALIDACION_VISUAL — Run ef766503:** Tiene 211 filas en `pendiente_revision_equipo` + 7 equipos con `requiere_revision=false`. Necesita re-apply después del fix de Bug B (Sprint 14c.1.3). El operador debe clickear "Re-aplicar" en la UI.

2. **RESEND_API_KEY no configurada:** El envío de emails es un stub. Si se intenta enviar un email de prueba, falla silenciosamente.

3. **CRON_SECRET no configurada en Vercel:** Los cron endpoints no están protegidos contra invocaciones externas.

4. **SUPABASE_SERVICE_ROLE_KEY no configurada en Vercel:** Las API routes v1 que la necesitan no funcionan en producción.

### Bugs resueltos (referencia):

| Bug | Sprint | Fix |
|-----|--------|-----|
| BUG-001: get_tenant_actual() recursión RLS | 1 | SECURITY DEFINER + SET search_path |
| BUG-002: cajas.saldo no existe | 9 | Columna es `saldo_actual` |
| BUG-003: FK categorias_movimiento no encontrada | 9 | Tabla real es `catalogo_categorias_movimiento` |
| BUG-004: VIEWs financieras SECURITY DEFINER | 11 | Recreadas con SECURITY INVOKER |
| normalize_name apóstrofes | 14c.1.1 | Strip de `´'ʼ` etc. antes de unaccent |
| splitApellidoNombre 1-letter prefix | 14c.1.1 | Tokens[0].length === 1 → 2 tokens como apellido |
| personas.numero_documento NOT NULL | 14c.1.2 | ALTER DROP NOT NULL |
| aplicarRun no reintenta fallados | 14c.1.2 | Filtro incluye 'fallado' |
| insertar_personas_equipos stale requiere_revision | 14c.1.3 | Check directo en DB en vez de confiar en return |

## 8.4 Tests

**No hay tests automatizados.** No hay archivos de test, no hay configuración de testing framework, no hay Playwright ni Jest.

Coverage estimado: **0%**.

Esto es un gap conocido y está planificado para Sprint 16 (Hardening + Tests E2E con Playwright).

## 8.5 Deuda técnica adicional

1. **TENANT_ID hardcodeado:** `'11111111-1111-1111-1111-111111111111'` usado en queries server-side. Funciona para single-tenant pero debe reemplazarse por `get_tenant_actual()` para multi-tenant real.

2. **Capa de servicios pura (D3) no implementada:** La propuesta arquitectónica dice que todo módulo debe tener `lib/modulos/{slug}/services.ts`. Ningún módulo lo tiene — el código hace `supabase.from('...')` directo en pages y actions. Esto se documentó como "inquebrantable desde Sprint 11.5" pero nunca se implementó.

3. **module_events (D6) no implementada:** La tabla de eventos de dominio no existe. No hay dispatcher centralizado. Cada notificación se maneja ad-hoc.

4. **MCP Server no implementado:** Declarado en Sprint 13 pero no se construyó. Solo la API REST existe.

5. **Webhooks no implementados:** Declarados en Sprint 13 pero no se construyeron.

6. **Schema types no generados:** No se ejecuta `supabase gen types typescript` regularmente. Los tipos se infieren ad-hoc de las queries.

7. **Esquemas tácticos sin UI:** Las tablas `esquemas_tacticos` y `esquema_posiciones` fueron creadas pero la UI fue diferida indefinidamente.

8. **Documentación desactualizada:**
   - CLAUDE.md tabla de sprints dice "11.5 PROXIMO" cuando estamos en 14c.2
   - MASTER-GAPS no refleja Sprint 14c.0-14c.2
   - NEXT-SPRINT apunta a Sprint 14 (Mantenimiento) que nunca se ejecutó
   - README dice 86 tablas, real ~90+
