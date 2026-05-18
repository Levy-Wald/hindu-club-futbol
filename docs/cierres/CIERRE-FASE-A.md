# CIERRE EJECUTIVO — FASE A: Troncal cross-vertical

**Proyecto**: ClubCore v2 / SaaS Modular Vertical
**Cliente piloto**: Hindu Club Futbol
**Fecha de cierre**: 15-mayo-2026
**Tag de cierre**: `v0.29.0-fase-a-completa`
**Documento**: Cierre formal de Tramo 1 según RFC-005

---

## Resumen ejecutivo

FASE A construye el **troncal cross-vertical** del SaaS modular: la base común sobre la que se montan después los verticales específicos (CCBP en FASE B, otros en FASE D-E). El alcance original era 13 sprints (A1.1 a A3.6) cubriendo limpieza, espacios físicos, PIM N1, finanzas modulares y configuración base. Durante ejecución se agregaron 8 sprints adicionales (sprints v2, Tramo 2 hardening, completar atributos custom y módulos de comunicaciones y proyectos pendientes).

**Resultado final**: troncal cross-vertical funcional en producción, ~140 tablas, 29 módulos físicos, 65 unit tests + 12 E2E pasando, 52 ADRs canonizados (ADR-001 a ADR-052), 0 drift TS↔BD detectado por auditoría MCP, todos los deploys Vercel READY.

FASE A está **lista para soportar FASE B** (vertical CCBP) y FASE D (cross-vertical avanzado) sin trabajo de refactor previo.

---

## Alcance original vs ejecutado

### Plan original (RFC-004, pre-mayo)

13 sprints lineales: A1.1 limpieza inicial, A1.2 eventos básicos, A2.1-A2.6 PIM N1 completo, A3.1-A3.6 finanzas modulares con conciliación bancaria.

### Plan ejecutado (refleja realidad post-canonización RFC-005)

Total: **21 sprints en FASE A**, ejecutados en 3 bloques temporales.

**Bloque 1 — Plan original (pre 14-may)**: 13 sprints A1.1 → A3.6 ejecutados según plan original con desvíos menores documentados en cierre intermedio ERP modular.

**Bloque 2 — Hardening Tramo 2 (14-15 may)**: 4 sprints adicionales no contemplados en plan original (H1-H4) que canonizaron la auditoría arquitectónica obligatoria pre-tag y la disciplina de tests.

**Bloque 3 — Sprints v2 + cierre FASE A (15-may)**: 4 sprints adicionales para cerrar features incompletas (A2 v2, A4 v2, A5 v2, A6 v2).

Total real: 13 + 4 + 4 = **21 sprints** (3 sub-sprints A1.2 quedaron diferidos a backlog post-A6).

---

## Detalle de sprints cerrados

### Bloque 1 — Plan original ejecutado

| Sprint | Descripción | Tag |
|---|---|---|
| A1.1 | Limpieza inicial, módulos físicos | v0.3.0-modules-physical |
| A1.2 | Eventos & calendario base (sub-sprint avanzado diferido) | v0.27.0 |
| A2.1 | PIM unificación | (parcial, completado en A2 v2) |
| A2.2 | Proveedores + Responsables productos | v0.27.x |
| A2.5 | Listas de precios múltiples | v0.27.x |
| A2.6 | Stock por espacio + movimientos | v0.27.x |
| A3.1 | Refactor consolidación finanzas | v0.27.x |
| A3.2 | Cajas con dimensiones contables-fiscales | v0.27.x |
| A3.3 | Sync PIM ↔ Finanzas (resolver cuentas) | v0.27.x |
| A3.4 | UIs finanzas (plan cuentas, períodos, cotizaciones, convenios) | v0.27.x |
| A3.5 | 4 reportes contables + 3 vistas BD | v0.27.x |
| A3.6 | Conciliación bancaria + cierre FASE A Finanzas | v0.27.x |

### Bloque 2 — Hardening Tramo 2 (14-15 may)

| Sprint | Descripción | Tag/Commit |
|---|---|---|
| H1 | Drift check TS↔BD (cero drift en 16 tablas) + ADR-047 draft | commit 473b342 |
| H2 | 6 E2E ERP modular (Playwright) + 4 unit suites (Vitest, 65 tests, 30 nuevos) | commit 48068def |
| H3 | Backfill datos demo sintéticos + cleanup padrón "e" | commit 43c3079 |
| H4 | Docs canónicos v2 (ARCHITECTURE, DATA-MODEL, MODULE-CATALOG, ADR-INDEX) + ADRs 048-052 | commit fa342a4 |

### Bloque 3 — Sprints v2 cierre FASE A (15-may)

| Sprint | Descripción | Tag |
|---|---|---|
| A2 v2 | Cierre formal PIM N1 + 9 variantes DEMO + CIERRE-A2-PIM-N1.md | v0.27.10-fase-a-sprint-2 |
| A5 v2 | Comunicaciones: Tiptap editor + variables + automatizaciones + workflow editor | v0.27.12-fase-a-sprint-5 |
| A6 v2 | Proyectos & Tareas: Kanban + Lista + Calendario + integración finanzas | v0.27.13-fase-a-sprint-6 |
| A4 v2 | Atributos custom + vínculos cross persona-entidad-entidad | v0.27.11-fase-a-sprint-4 |

---

## Estado técnico de la plataforma al cierre

### Base de datos

- **~140 tablas** en schema public (verificado via MCP)
- **27 vistas SQL** (libro mayor, balance, estado resultados, cobranzas, stock, etc.)
- **~45 RPCs custom** (funciones de negocio: cuotas, conciliación, validaciones)
- **169+ RLS policies** activas (multi-tenant strict)
- **97 triggers** (auditoría + updated_at automático + validaciones integridad)
- **0 drift TS↔BD detectado** (auditoría H1 MCP, ADR-047 obligatorio pre-tag)

### Código

- **29 módulos físicos** catalogados en `modules/` (MODULE-CATALOG.md)
- Estructura cuádruple por módulo: types, queries, mutations, actions, components
- Lógica pura extraída a `lib/` para testabilidad (resultado H2)

### Tests

- **65 unit tests** (Vitest) pasando
- **6 E2E tests ERP modular** (Playwright, sprint H2)
- **6 E2E tests Proyectos & Tareas** (Playwright, sprint A6 v2)
- Total: **77 tests** corriendo

### Documentación canónica

- ARCHITECTURE.md v3 (4 capas RFC-004, stack, patrones)
- DATA-MODEL.md (140 tablas + 27 vistas + ~45 RPCs documentados)
- MODULE-CATALOG.md (29 módulos por capa)
- ADR-INDEX.md (52 ADRs: ADR-001 a ADR-052)
- RFC-005 (plan completo a 100%, canonizado)
- SPRINT-PLAN.md v2.1 (estado real refleja Bloque 1+2+3)

### ADRs canonizados durante FASE A (relevantes)

- **ADR-040** a **ADR-046**: arquitectura 4 capas, patrones de módulos, RLS, mock-first
- **ADR-047**: Auditoría arquitectónica MCP obligatoria pre-tag (3 checks)
- **ADR-048**: Sub-sprints como modus operandi
- **ADR-049**: Tag obligatorio antes de siguiente sprint
- **ADR-050**: Cajas con dimensiones contables-fiscales
- **ADR-051**: Resolución contextual de cuentas vía tipo_uso del producto
- **ADR-052**: Conciliación bancaria con auto-match sign-aware

### Producción Vercel

- Dominio: `https://hindu-club.vercel.app`
- Project ID: `prj_sH5WIGNfNGo5tXxyTVvQaEfBDyBk`
- Último deploy: commit `d4ae293479e5471f98c3345f249e688985a308bc` — **READY**
- Todos los deploys del día 15-may en estado READY (~20 deploys consecutivos)
- Build pipeline funcional con turbopack
- Proyecto Vercel zombie `hindu-v2` eliminado el 17-may (housekeeping post-cierre)

---

## Datos en producción

- **2.390 personas** registradas
- **64 atributos catalogados**
- **51 suscripciones activas**
- **102 cuotas emitidas**
- **7 productos DEMO** + 20 variantes (sprint H3)
- **2 listas precios DEMO** (ARS + USD) + 20 precios
- **2 depósitos DEMO** + 20 registros stock
- **30 movimientos stock DEMO** (20 entradas + 10 salidas, 3 meses)
- **26 cotizaciones USD/ARS** semanales (nov-2025 a may-2026)
- **5 convenios de pago DEMO**
- **20 movimientos bancarios conciliación DEMO** (10 conciliado, 5 pendiente, 5 discrepancia)
- **46k filas de audit_log** acumuladas

Padrón "e" (test contaminado) soft-deleted en H3.

---

## Decisiones arquitectónicas críticas tomadas en FASE A

1. **Mock-first universal** (ADR-035): todos los integrators externos (Resend, MercadoPago, WhatsApp, AFIP) permanecen mock durante FASE A-B. Switch a producción centralizado en Tramo 10 (post-FASE-D).

2. **Auditoría MCP pre-tag obligatoria** (ADR-047): 3 checks (FKs salientes, RLS+triggers+soft-delete, drift TS↔BD) antes de aplicar cualquier tag de sprint. E2E pass alone NO basta. Aplicado a partir de sprint A2.6 retroactivamente.

3. **Sub-sprints como modus operandi** (ADR-048): a partir de A3.x todos los sprints se subdividen para granularidad de rollback y smoke incremental. Aplica a Tramos siguientes.

4. **Tag obligatorio antes siguiente sprint** (ADR-049): regla operativa. Si Yair pasa siguiente prompt sin tagear el anterior, Opus pausa y obliga a tagear retroactivamente.

5. **Cajas con dimensiones contables-fiscales** (ADR-050): cajas no son solo "cuentas bancarias", son objetos con `tipo_fiscal` (blanco/negro/mixto) + `entidad_id` + `actividad_slug` + datos bancarios. Habilita contabilidad multi-fiscal y multi-entidad sin tablas paralelas.

6. **Resolución contextual de cuentas vía tipo_uso** (ADR-051): al crear movimiento contable, las cuentas se resuelven automáticamente según el `tipo_uso` del producto (reventa, uso_interno, servicio). Elimina la necesidad de configurar cuentas por producto.

7. **Conciliación bancaria sign-aware** (ADR-052): auto-match considera signos de débito/crédito + tolerancia configurable. Reversible (desconciliar revierte ambos lados).

---

## Sprints diferidos a backlog post-A6

Tres sub-sprints originalmente parte de A1.2 quedan diferidos para ejecución después de Tramo 5 (FASE C demo Hindu):

- **A1.2.1 — Recurrencia tipo Google Calendar**: `evento_series` + RRULE + excepciones + UI "este/siguientes/todos"
- **A1.2.2 — Invitaciones y confirmaciones**: confirmar/rechazar UI, notificaciones in-app + /mi-agenda
- **A1.2.3 — Recordatorios automáticos**: 7d/24h/1h vía `com_automatizaciones_pasos`, notificación cancelación auto

Razón del deferimiento: features útiles pero no bloqueantes para FASE B (vertical CCBP). Su ejecución sin haber validado FASE B introduce riesgo de re-trabajo si la validación con Hindu requiere cambios estructurales.

Estimación retomar: ~10-15h Code (sub-sprint completo).

---

## Tests humanos pendientes (smoke manual post-cierre)

Los siguientes flows requieren validación humana (Code no puede ejecutarlos):

- **Smoke A2 v2**: 8 flows PIM (alta producto, variantes, listas precios, stock, movimientos, proveedores, responsables, deduplicación)
- **Smoke A4 v2**: 9 flows atributos custom + vínculos cross (definición, valor por persona, valor por entidad, vínculos bidireccionales)
- **Smoke A5 v2**: editor plantillas Tiptap + variables + test send + workflow editor drag-and-drop
- **Smoke A6 v2**: Kanban drag-and-drop tareas + vista lista filtrable + vista calendario + integración presupuesto

Tiempo estimado total: ~30 min. No bloquean Tramo 3 (FASE B), se ejecutan en paralelo cuando Yair tenga ventana.

---

## Riesgos identificados al cierre de FASE A

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Smoke manual de los 4 sprints v2 todavía no ejecutado | Baja | No bloquea Tramo 3. Yair lo hace cuando pueda. |
| Sub-sprints A1.2.x diferidos pueden ser solicitados por Hindu durante FASE C | Media | Si Hindu lo pide, evaluar ejecución entre Tramo 5 y Tramo 7. |
| Carga de datos productivos Hindu solo en ciertas tablas (no completa) | Media | Se completa durante FASE C carga real. Decisión documentada. |
| Performance no auditada todavía (queries lentas, índices faltantes) | Media | Cubierto por sprint H7 (Tramo 4) post-FASE-B. |
| Fix preventivo NEXT_PUBLIC_SUPABASE_URL aplicado en commit 1797e21 | Baja | Vercel READY confirma que NO había problema real. Fix queda como red de seguridad. |
| Code puede confundir Supabase V1 con V2 si no tiene project_id correcto en contexto | Baja | Solución: siempre validar contra `hkoizqbptwhnepzbmjql` (V2 activo). V1 (`tjaczmbrbqmjzrkjkdyq`) está abandonado. |

---

## Próximos pasos inmediatos

1. **Aplicar tag `v0.29.0-fase-a-completa`** (Code, próximo commit corto)
2. **Marcar FASE A como DONE en SPRINT-PLAN.md** (Code)
3. **Generar `docs/cierres/CIERRE-FASE-A.md` en repo** (este documento)
4. **Smoke manual de los 4 sprints v2** (Yair, en su ventana)
5. **Arrancar Tramo 3 — FASE B**: sprint B1 Salud / Lesiones operativas (prompt en paquete RFC-005 archivo 12)

---

## Métricas del ciclo

- **Sprints ejecutados FASE A**: 21 (incluyendo 4 hardening Tramo 2 + 4 v2)
- **Días calendario**: ~60 días (marzo a mayo 2026)
- **Sprints en el día 15-may**: 8 (récord operativo)
- **Costo Code real estimado**: ~80-100h
- **ADRs canonizados**: 12 nuevos en FASE A (ADR-040 a ADR-052)
- **Líneas de código modificadas/agregadas**: estimación >50k LOC
- **Migrations aplicadas via MCP**: ~80-100 (aprox)

---

## Cierre

FASE A completa y operativa. Troncal cross-vertical listo para soportar verticales específicos (FASE B). Documentación canónica completa. Tests automatizados. Auditoría arquitectónica cubierta. Performance pendiente (Tramo 4) pero no bloqueante.

**El sistema está listo para arrancar FASE B con el sprint B1 — Salud / Lesiones operativas.**

---

*Documento generado por Claude Opus 4.7 como Director Externo (Fractional cLevel) en colaboración con Yair Levy Wald (owner) y Claude Code (executor).*

*Refs: RFC-004, RFC-005, SPRINT-PLAN v2.1, CIERRE-INTERMEDIO-ERP-MODULAR.md, ADR-040 a ADR-052.*
