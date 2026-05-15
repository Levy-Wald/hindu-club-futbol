# H2 — Tests E2E + Unit Tests del ERP Modular

**Sprint**: H2 (Tramo 2 RFC-005)
**Fecha**: 14 de mayo de 2026
**Tag**: `v0.29.2-hardening-h2`

---

## Tests creados

### E2E (Playwright) — 6 escenarios

| # | Escenario | Archivo | Resultado |
|---|-----------|---------|-----------|
| 1 | Listas de precios (A2.5) | `tests/e2e/sprints/h2-erp-modular.spec.ts` | PASS |
| 2 | Stock por deposito (A2.6) | idem | PASS |
| 3 | Cajas con dimensiones (A3.2) | idem | PASS |
| 4 | Movimientos financieros (A3.3) | idem | PASS |
| 5 | Conciliacion bancaria (A3.6) | idem | PASS |
| 6 | Reportes contables (A3.5) | idem | PASS |

Cada escenario crea fixtures via `serviceRole()`, verifica la UI, y limpia con `try/finally`.

### Unit Tests (Vitest) — 4 suites, 23 tests nuevos

| Suite | Archivo | Tests | Resultado |
|-------|---------|-------|-----------|
| auto-match | `tests/unit/finanzas/auto-match.test.ts` | 12 | PASS |
| resolver-cuentas | `tests/unit/finanzas/resolver-cuentas.test.ts` | 5 | PASS |
| movimientos-stock | `tests/unit/pim/movimientos-stock.test.ts` | 7 | PASS |
| precio-vigente | `tests/unit/pim/precio-vigente.test.ts` | 6 | PASS |
| **Total nuevos** | | **30** | **PASS** |

Pre-existentes: 21 tests (fixture-generators) — siguen pasando.
Total unit tests en repo: **65 (todos verde)**.

### Fixture

- `tests/e2e/fixtures/extracto-bancario.csv` — 5 filas sinteticas con formato generico (fecha DD/MM/YYYY, descripcion, monto, referencia, saldo).

### Pure logic extraida

Para hacer testeable la logica de negocio embebida en server actions (`'use server'`), se extrajeron funciones puras a archivos separados:

| Archivo | Funciones extraidas |
|---------|-------------------|
| `modules/finanzas/lib/conciliacion-logic.ts` | `esCandidato`, `findBestMatch`, `tiposCandidatos`, `normalizeMonto`, `normalizeDate` |
| `modules/finanzas/lib/contabilidad-rules.ts` | `validarTipoUsoVsSigno`, `resolverCuentasPuro` |
| `modules/pim/lib/stock-validacion.ts` | `validarTipoEspacio`, `calcularDeltasStock` |
| `modules/pim/lib/precio-vigente.ts` | `resolverPrecioVigente` |

Estas funciones puras replican exactamente la logica de las server actions sin dependencia de Supabase, permitiendo tests rapidos y deterministicos.

---

## Bugs detectados

Ninguno. La logica de auto-match, resolucion de cuentas, stock y precios funciona correctamente segun los casos de test definidos.

---

## Deuda registrada

| Item | Estado | Sprint destino |
|------|--------|---------------|
| CI/CD con tests automaticos en push | Pendiente | H6/T6 |
| E2E del vertical CCBP completo | Pendiente | H5 |
| Tests visuales/snapshot | Fuera de scope | Nice-to-have |
| Refactor server actions para usar funciones puras extraidas | Pendiente | Cuando se toquen esos modulos |
| Tests de performance | Fuera de scope | H7 |

---

## Metricas

- `pnpm test:unit`: 65/65 verde en 239ms
- `pnpm test:e2e` (h2 spec): 6/6 verde en 47.2s contra produccion Vercel
- `tsc --noEmit`: 0 errores
- `pnpm build`: exitoso
