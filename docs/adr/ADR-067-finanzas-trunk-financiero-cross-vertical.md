# ADR-067 — Finanzas como trunk financiero cross-vertical

> Origen: repo (canonizado por Code en cobertura de Opus, 23-jun-2026). Espejar a Drive `_Decisiones/` cuando Opus vuelva.

**Estado**: Accepted
**Fecha**: 23-jun-2026
**Decidido por**: Yair (ratificación)
**Resuelve**: I-006 / SE1-I6
**Milestone**: F1

## Contexto

La auditoría F0+F1 (01-jun, scan de `pg_constraint`) levantó I-006: varios módulos tienen FKs salientes hacia tablas de Finanzas, lo que en una lectura estricta de la regla de capas *("un módulo solo puede tener FKs salientes hacia tablas trunk/catálogo")* parecía un acoplamiento indebido.

Verificación en prod (23-jun) — FKs cross-módulo reales hacia Finanzas:

| Origen | → Destino (Finanzas) |
|---|---|
| `cuotas_pagos`, `cuotas_emitidas` (membresías) | `cajas`, `movimientos_caja` |
| `rrhh_liquidaciones` (rrhh, cross_vertical) | `cajas`, `movimientos_caja` |
| `concesion_canones` (concesiones, cross_vertical) | `movimientos_caja` |
| `productos` (pim, troncal) | `plan_cuentas`, `centros_costo` |

**Hallazgo clave:** el módulo `finanzas` **ya está declarado `troncal`** en `catalogo_modulos`. Por lo tanto las FKs de arriba **no violan** la regla: apuntan a tablas de un módulo troncal, que es exactamente lo permitido. No había nada que arreglar — faltaba canonizar la decisión.

## Decisión

Se **ratifica Finanzas como el trunk financiero cross-vertical** de la plataforma: las tablas `cajas`, `movimientos_caja`, `plan_cuentas`, `centros_costo` (y catálogos asociados) son backbone troncal, y **cualquier módulo puede declarar FKs hacia ellas**.

Es el patrón **Stripe/Shopify**: una columna financiera única a la que todos los dominios (membresías, RRHH, concesiones, PIM, etc.) postean movimientos, sin duplicar contabilidad por módulo.

Implicancia operativa: el chequeo de auditoría de FKs debe tratar a Finanzas como destino legítimo (igual que `personas`/`entidades`/catálogos), no como violación.

## Carve-out (NO incluido en esta decisión)

`eventos` (troncal) → `canchas` (dominio espacios/reservas, `cross_vertical`) **sí** es una inversión de capa leve (una tabla troncal dependiendo de una de capa más alta). Se trata **por separado** (decisión de Yair: "revisar aparte"). Mitigante ya presente: `eventos.cancha_id` es **nullable** → es un acoplamiento blando, no estructural. Trackeado como issue propio (I-007).

## Consecuencias

- Las FKs cuotas/rrhh/concesiones/pim → Finanzas quedan **validadas**, no son deuda.
- No requiere migración ni cambio de código (ratifica la realidad del esquema).
- I-006 cerrado. Queda I-007 (eventos→canchas) como sub-issue no bloqueante.
- Futuras tablas financieras nuevas viven en Finanzas; los módulos las referencian por FK.

## Referencias

- Issue I-006 / SE1-I6 (Zoho LE-8)
- Modelo de 4 capas: ADR-031 / ADR-040
- Auditoría F0+F1 (01-jun-2026)
