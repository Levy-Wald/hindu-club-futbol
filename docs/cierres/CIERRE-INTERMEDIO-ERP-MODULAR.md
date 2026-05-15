# Cierre Ejecutivo Intermedio — Sprints ejecutados fuera del plan original

**Fecha**: 14 de mayo de 2026  
**Período cubierto**: 13-may-2026 (cierre RFC-004) → 14-may-2026 (cierre A3.6)  
**Path esperado en repo**: `docs/cierres/CIERRE-INTERMEDIO-ERP-MODULAR.md`  
**Drive**: `_Cierre Ejecutivo/`  
**Estado al cierre**: ✅ Tags v0.27.0 → v0.28.0 en producción Vercel  
**Referencias**: RFC-004, RFC-005, ADR-040 a ADR-046

---

## 1. Contexto

El 13 de mayo de 2026 se canonizó la re-arquitectura multi-vertical (RFC-004) con el plan FASE A → E. El plan original de FASE A contemplaba 6 sprints A1-A6 con costo estimado de 55-62h Code.

Entre el 13-may y el 14-may, además del cierre de A1 oficial, se ejecutaron **10 sprints adicionales fuera del plan original**, dedicados a construir **ERP modular avanzado** que cubrió funcionalmente partes de FASE D (PIM N2 y N3) y agregó capacidades ERP no contempladas en A3 oficial.

Este documento canoniza esos 10 sprints como historial verificable y los reubica en la taxonomía vigente.

---

## 2. Alcance ejecutado

Los 10 sprints ejecutados fuera del plan original son:

| # | Sprint | Tema | Tag | Commit SHA | Costo |
|---|---|---|---|---|---|
| 1 | A1.1 | Hotfix wire creation modals + sidebar Operaciones | v0.27.1 | `53bd922` | ~2h |
| 2 | A2 ampliación | Productos +10 campos (EAN, descripciones, material, color, medida, origen, bulto, peso) | v0.27.2 | `a5ded47` | ~2h |
| 3 | A2.1 | Unificación arquitectónica productos: merge `productos_servicios`, add `tipo_uso` + contabilidad | v0.27.2 | `d843029` | ~3h |
| 4 | A2.2 | Proveedores + responsables (N:M con polimorfismo entidad/persona) | v0.27.2 | `439650e` | ~3h |
| 5 | A2.5 | Listas de precios múltiples ARS/USD con TC + precios por producto/variante con vigencia | v0.27.3 | `fa21959` | ~4h |
| 6 | A2.6 | Depósitos + stock por depósito + movimientos + integración form-lista | v0.27.4 | `eecdc12` | ~5h |
| 7 | A3.1 | Refactor `modules/finanzas` + drop 6 vistas `fin_*` huérfanas + eliminar duplicados | v0.27.5 | `d60325a` | ~3h |
| 8 | A3.2 | Cajas con dimensiones: `tipo_fiscal` (blanco/negro/mixto) + `entidad_id` + `actividad_slug` + datos bancarios + soft-delete | v0.27.6 | `a7166c3` | ~4h |
| 9 | A3.3 | Sync PIM ↔ Finanzas: auto-resolver cuentas contables según `tipo_uso` del producto al crear movimiento | v0.27.7 | `0c80416` | ~2h |
| 10 | A3.4 | UIs faltantes finanzas: plan cuentas CRUD, períodos contables, config financiera, cotizaciones, convenios, cuenta corriente persona | v0.27.8 | `f3b7e1d` | ~4h |
| 11 | A3.5 | 4 reportes contables: Libro Mayor, Balance General, Estado de Resultados, Cobranzas. 3 vistas BD + export PDF/XLSX | v0.27.9 | `3769705` | ~5h |
| 12 | A3.6 | Conciliación bancaria: importador CSV/XLSX + UI matcheo + auto-match sign-aware + reporte | v0.28.0 | `2c19e29` | ~5h |
| 13 | A2 hotfix | Fix drift TS↔BD en producto_proveedores, producto_stock_espacio, producto_movimientos_stock | v0.27.4 | `795f56d` | ~1h |

**Costo total ejecutado fuera de plan**: ~43h Code  
**Sprints ejecutados**: 13 commits con 10 sprints lógicos diferenciables  
**Período**: ~24 horas calendarias intensivas (13-14 may)

---

## 3. Mapeo a taxonomía oficial RFC-004

Lo construido fuera de plan se reclasifica conceptualmente así:

| Sprint ejecutado | Plan oficial al que corresponde | Capa |
|---|---|---|
| A1.1 | Hotfix A1 (no es sprint nuevo, es bug fix) | Troncal |
| A2 ampliación | Parte de A2 oficial extendida | Troncal (PIM N1) |
| A2.1 | Refactor arquitectónico, parte de A2 | Troncal |
| A2.2 | Parte de A2 oficial extendida | Troncal (PIM N1) |
| **A2.5 (listas precios múltiples)** | **D3 oficial (PIM Nivel 2)** | **Cross-vertical opcional** |
| **A2.6 (stock por depósito + movimientos)** | **D4 oficial (PIM Nivel 3)** | **Cross-vertical opcional** |
| A3.1 | Parte de A3 oficial (consolidación deuda) | Troncal (Finanzas) |
| A3.2 (cajas dimensionadas) | Extensión arquitectónica del ERP, fuera del A3 oficial chico | Troncal (Finanzas) |
| A3.3 (sync PIM↔Finanzas) | Extensión funcional ERP modular, fuera del A3 oficial | Cross-bloque (PIM + Finanzas) |
| A3.4 (UIs finanzas) | Parte de A3 oficial (UI completa) | Troncal (Finanzas) |
| A3.5 (reportes contables) | NO está en A3 oficial. ERP modular avanzado. | Troncal (Finanzas) |
| A3.6 (conciliación bancaria) | NO está en A3 oficial ni en FASE D. ERP modular avanzado. | Troncal (Finanzas) |

**Conclusión clave**: A2.5 + A2.6 cubrieron funcionalmente D3 + D4 oficial. Cuando se ejecute FASE D, los sprints D3 y D4 quedan en estado PARCIAL — solo requieren formalización + ADR explícito de cierre.

---

## 4. Decisiones técnicas tomadas durante el período

### 4.1 Decisiones arquitectónicas formalizables como ADRs

Las siguientes decisiones se tomaron durante la ejecución y deberían canonizarse como ADRs nuevos (ADR-047 en adelante):

| Propuesto ADR | Tema | Justificación |
|---|---|---|
| ADR-047 | Auditoría arquitectónica vía MCP obligatoria pre-tag | A2.6 tuvo drift TS↔BD detectado post-tag, generando hotfix. Regla: cada sprint cierra con 3 checks vía MCP: FKs salientes del módulo solo a troncal/catálogo, RLS+triggers+soft-delete completos, drift TS↔BD verificable comparando columnas reales con Zod/queries/UI |
| ADR-048 | Sub-sprints como modus operandi de FASE A en adelante | Disciplina A3.1-A3.6 funcionó: rollback granular, smoke incremental, auditoría por sub-sprint. Aplica a FASE B en adelante |
| ADR-049 | Tag obligatorio antes de pasar al siguiente sprint | Sin tag intermedio el rollback a "estado limpio post-sprint-N" es costoso. Toma 30s, no se salta |
| ADR-050 | Cajas con dimensiones contables-fiscales | Una caja no es solo "cuenta de dinero" sino que tiene `tipo_fiscal` (blanco/negro/mixto), `entidad_id` (responsable), `actividad_slug` (CCBP/concesión/etc.), datos bancarios. Permite reporting fiscal correcto |
| ADR-051 | Resolución contextual de cuentas contables vía `tipo_uso` del producto | Un movimiento financiero auto-resuelve sus cuentas contables (ingreso/egreso/IVA) consultando el `tipo_uso` del producto involucrado, no por configuración manual |
| ADR-052 | Conciliación bancaria con auto-match sign-aware | El sistema sabe si un movimiento es débito o crédito independiente del signo numérico, basándose en el `tipo` del movimiento (ingreso/egreso). Esto permite matchear extractos bancarios con tolerancia configurable |

### 4.2 Decisiones de implementación

- **Función SQL canónica**: `trg_set_updated_at()` (NO `set_updated_at()`). Detectado durante A3.2.
- **PostgREST FK ambiguity**: cuando hay múltiples FKs entre tablas (ej. `personas_atributos` → `personas`), requerir hints explícitos en queries.
- **base-ui nested button**: usar prop `render` en lugar de `asChild` (Radix) para evitar errores de hydration con buttons anidados.
- **Migración con descripción no-SQL**: `supabase_migrations.schema_migrations.statements` puede contener array descriptivo, no requiere SQL exacto para que `supabase migration list` muestre sync.

---

## 5. Deuda detectada durante el período

| Deuda | Origen | Mitigación |
|---|---|---|
| Drift TS↔BD en producto_proveedores, producto_stock_espacio, producto_movimientos_stock | A2.6 ejecutado sin auditoría pre-tag completa | Hotfix aplicado en v0.27.4 (commit `795f56d`). Regla ADR-047 implementada para futuro |
| Tests E2E del ERP modular A2.5/A2.6/A3.x: ZERO | Sprints ejecutados con velocidad, sin tests | Plan: Tramo 2 H2 |
| `productos_variantes` con 0 filas en producción Hindu | UI construida pero sin datos demo | Plan: A2 v2 + Tramo 2 H3 |
| Padrón "e" en BD Hindu (probable test contaminado) | Test sin cleanup, contamina datos productivos | Plan: Tramo 2 H3 limpieza |
| ARCHITECTURE.md / DATA-MODEL.md / MODULE-CATALOG.md desactualizados vs 163 tablas reales | Sprints ejecutados sin actualización paralela de docs | Plan: Tramo 2 H4 |
| Cierres ejecutivos por sprint no documentados (este es el primer cierre intermedio) | Velocidad de ejecución prioritaria | Resuelto en este documento + protocolo RFC-005 para futuro |
| Consolidación `cuotas_emitidas` vs `fin_cuotas_emitidas` | Deuda del modelo anterior | ✅ Resuelta: solo `cuotas_emitidas` existe en BD (verificado vía MCP 14-may) |

---

## 6. Métricas BD al cierre A3.6

Verificadas vía MCP Supabase el 14-may-2026:

| Métrica | Valor | Cambio vs pre-FASE-A |
|---|---|---|
| Tablas públicas | 163 | +6 nuevas (productos, productos_variantes, producto_categorias, producto_categoria_links, producto_marcas, producto_listas_precios, producto_precios, producto_stock_espacio, producto_movimientos_stock, producto_proveedores, producto_responsables, producto_imagenes, espacios, cotizaciones, convenios_pago, periodos_contables, config_financiera, conciliacion_movimientos_bancarios) |
| Vistas | 27 | +6 nuevas (v_producto_precios_actuales, v_producto_stock_total, v_libro_mayor, v_balance_cuentas, v_estado_cobranzas, v_centros_costo_stats) |
| Triggers | 130 | +33 |
| RPCs custom | ~30-40 | sin cambio significativo |
| Filas audit_log | 46.624 | +alta actividad |
| Personas tenant Hindu | 2.390 | sin cambio (no carga de datos reales) |
| Atributos catalogados | 64 | sin cambio |
| Padrones | 5 | sin cambio |
| Import pipelines | 3 | sin cambio |
| Cuotas emitidas | 102 | sin cambio |
| Suscripciones activas | 51 | sin cambio |

---

## 7. Estado de las fases al cierre

### FASE A — Cerrar troncal mínimo: PARCIAL

| Bloque | Estado al cierre A3.6 |
|---|---|
| 1. Configuración del negocio | ✅ Sólido (con A3.2-A3.4 dimensiones agregadas) |
| 2. CRM (personas/entidades/vínculos/padrones/importadores) | ⚠️ Padrones+importadores+vínculos OK. Falta atributos custom (A4 v2) |
| 3. ERP Finanzas básico | ✅ Sólido (+ERP modular avanzado A3.2 a A3.6) |
| 4. PIM Nivel 1 | ✅ Funcionalmente cerrado (+N2 anticipado vía A2.5, +N3 anticipado vía A2.6). Falta cierre formal A2 v2 |
| 5. Cobranza recurrente | ✅ Operativo (cuotas + suscripciones + convenios) |
| 6. Motor de Comunicaciones | ⚠️ Parcial (~60%). Falta editor expandido + automatizaciones (A5) |
| 7. Eventos & Calendario | ⚠️ Parcial. Pendiente A1.2 backlog post-A6 |
| 8. Proyectos & Tareas | ❌ No existe. Pendiente A6 |
| 9. Auditoría & Seguridad | ⚠️ Parcial. Audit log activo con 46k filas. Falta consolidación de API keys + abuse blocks |

**Falta cerrar FASE A**: A2 v2 + A4 v2 + A5 + A6 (~23-30h Code)

### FASE D — Cross-vertical extra: PARCIAL

| Sprint | Estado |
|---|---|
| D1 Documentos / Firma | Pendiente |
| D2 Tickets | Pendiente |
| D3 Pricing N2 | ✅ Funcionalmente cubierto por A2.5 (queda formalización) |
| D4 Stock N3 | ✅ Funcionalmente cubierto por A2.6 (queda formalización) |
| D5 Consolidación tablas paralelas | Pendiente, riesgo alto |
| D6 Mapa visual generalizado | Pendiente |

---

## 8. Próximos pasos (post-cierre intermedio)

Según RFC-005 — Plan de ejecución completo a 100%:

1. **Tramo 1 (continuar)**: A2 v2 → A4 v2 → A5 → A6 para cerrar FASE A oficial.
2. **Tramo 2 (Hardening post-A)**: H1 (drift check) → H2 (tests E2E ERP modular) → H3 (backfill datos demo) → H4 (docs canónicos v2).
3. **Canonizar ADRs 047-052** derivados de este cierre intermedio durante Tramo 2 H4.
4. Continuar FASE B → FASE C → FASE D (con D3+D4 como formalización) según RFC-005.

---

## 9. Tags Git verificables

Todos los tags del período están READY en producción Vercel (`hindu-club.vercel.app`).

```
v0.25.0-fase5-sprint6        Cierre FASE 5 (pre-período)
v0.27.0                       A1 Fix Base Operativa + Espacios
v0.27.1                       A1.1 Hotfix wire creation modals
v0.27.2                       A2 + A2.1 + A2.2 (paquete)
v0.27.3                       A2.5 Listas precios múltiples
v0.27.4                       A2.6 Stock por depósito + movimientos (+ hotfix drift)
v0.27.5                       A3.1 Refactor modules/finanzas
v0.27.6                       A3.2 Cajas con dimensiones
v0.27.7                       A3.3 Sync PIM↔Finanzas
v0.27.8                       A3.4 UIs finanzas faltantes
v0.27.9                       A3.5 4 reportes contables
v0.28.0                       A3.6 Conciliación bancaria
```

**Verificación**: `git tag -l "v0.27.*"` y `git tag -l "v0.28.0"` desde repo `yamiro12/hindu-club-futbol`.

---

## 10. Aprobación y firma

- **Owner**: Yair Levy Wald
- **Arquitecto externo**: Claude Opus
- **Ejecutor**: Claude Code
- **Fecha de canonización del cierre**: 14 de mayo de 2026
- **Próximo cierre ejecutivo**: al cerrar Tramo 1 (FASE A completa) con tag `v0.29.0-fase-a-completa`.

**Fin del cierre ejecutivo intermedio.**
