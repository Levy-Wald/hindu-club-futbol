# Cierre Tramo 2 — Hardening post-FASE-A

> Fecha: 15 de mayo de 2026
> Tag: `v0.29.5-hardening-post-fase-a`
> Sprints: H1 + H2 + H3 + H4

---

## Resumen ejecutivo

El Tramo 2 (Hardening post-FASE-A) ejecuto 4 sprints de consolidacion sobre los 13 sprints de FASE A (A1 a A3.6). Objetivo: asegurar que la base construida es solida antes de arrancar FASE B.

---

## Sprints ejecutados

### H1 — Drift check TS-BD + auditoria arquitectonica

- **Tag**: `v0.29.1-hardening-h1`
- 16 tablas auditadas (productos, finanzas, conciliacion)
- Cero drift no documentado al cierre
- 16/16 tablas con RLS habilitado
- 16/16 tablas con policy tenant
- 16/16 tablas con deleted_at (o equivalente)
- 16/16 tablas con trigger trg_set_updated_at
- 0 FKs cruzadas no canonizadas
- ADR-047 borrador creado

### H2 — Tests E2E + unit tests del ERP modular

- **Tag**: `v0.29.2-hardening-h2`
- 6 tests E2E nuevos (Playwright)
- 30 unit tests nuevos (Vitest)
- Generadores de fixtures para productos, finanzas, conciliacion
- 0 bugs detectados en tests

### H3 — Backfill datos demo sinteticos

- **Tag**: `v0.29.3-hardening-h3`
- Padron "e" soft-deleted (confirmado test contaminado)
- 7 productos DEMO creados
- 20 variantes DEMO
- 20 precios en 2 listas (ARS + USD)
- 20 stock en 2 depositos
- 30 movimientos de stock
- 26 cotizaciones USD/ARS (semanales, 6 meses)
- 5 convenios de pago
- 20 movimientos bancarios para conciliacion (10 conciliado, 5 pendiente, 5 discrepancia)
- Script cleanup: `scripts/seed-demo-h3-cleanup.sql`

### H4 — Docs canonicos v2 + ADRs 047-052

- **Tag**: `v0.29.5-hardening-post-fase-a`
- ARCHITECTURE.md reescrito a v3 (4 capas, stack, patrones, convenciones)
- DATA-MODEL.md creado: 140 tablas + 27 vistas + ~45 RPCs custom
- MODULE-CATALOG.md creado: 29 modulos fisicos catalogados por capa
- 6 ADRs canonizados (047-052)
- ADR-INDEX.md creado con 52 ADRs listados

---

## Metricas de salida

| Metrica | Valor |
|---|---|
| Tablas BD | 140 |
| Vistas | 27 |
| Funciones SQL custom | ~45 |
| Modulos fisicos | 29 |
| ADRs documentados | 52 |
| Tests E2E totales | ~96 specs |
| Unit tests totales | ~51 specs |
| Drift no documentado | 0 |

---

## Estado de salida

- BD consolidada y auditada
- Tests instalados para modulos criticos
- Datos demo disponibles para reportes y smoke tests
- Documentacion canonica actualizada
- Listo para arrancar FASE B (Tramo 3)

---

## Siguiente

**Tramo 3 — FASE B** (Cerrar vertical CCBP):
- B1: Salud / Lesiones operativas
- B2: Historial / Trayectoria deportiva
- B3: Scouting + 11 dimensiones
- B4: Reportes deportivos
- B5: Activar Socios (suscripciones_membresia)
- B6: Cuerpo Tecnico + Diagramacion visual
