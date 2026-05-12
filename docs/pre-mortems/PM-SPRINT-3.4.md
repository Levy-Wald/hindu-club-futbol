# Pre-mortem — Sprint FASE 3.4

**Sprint:** FASE 3.4 — Padrón temporal + Nóminas externas + Niveles
+ Catálogo defaults
**Fecha:** 12 de mayo de 2026
**Regla aplicada:** R-PE9 (Pre-mortem obligatorio)
**Estado:** Ejecutado pre-sprint. Resultado: sprint cerrado verde
con 13 mitigaciones aplicadas.

## 1. Por qué se ejecutó

R-PE9 dispara pre-mortem si el sprint cumple al menos uno de los
criterios. Sprint 3.4 cumplió 4/5:
- Duración > 3 días Code (>6h)
- Toca capa Plataforma (troncal)
- Integración externa (endpoint público sin auth)
- Riesgo de regresión crítica (toca `personas` con 2.390 filas)

## 2. Escenarios de falla identificados

13 escenarios ordenados por severidad. Resumen tabular:

| # | Escenario | Severidad | Mitigado en |
|---|---|---|---|
| S1 | Abuse/DDoS endpoint público | ALTA | Rate limit + CAPTCHA + caducidad |
| S2 | Tokens enumerables → leak | ALTA | `crypto.randomBytes(32)` |
| S3 | UI form se rompe en mobile | ALTA | Mobile-first + E2E viewport 375x667 |
| S4 | Matching fuzzy impreciso | MEDIA | Threshold 0.85 + revisión admin |
| S5 | Cargador evade nivel de validación | MEDIA | Admin confirma siempre |
| S6 | Admin olvida nóminas pendientes | MEDIA | Badge en sidebar |
| S7 | Campos configurables crashean form | MEDIA | Validación server-side + defaults |
| S8 | Niveles L2-L4 sin implementación | MEDIA | activo=false en catálogo |
| S9 | Caducidad token mal calculada | BAJA | COALESCE 3 niveles |
| S10 | Race condition admins simultáneos | BAJA | UNIQUE + SELECT FOR UPDATE |
| S11 | AP-001/AP-002 olvidados | MEDIA | Verificación explícita en PARTE 1 |
| S12 | Form lento por N+1 | BAJA | Catálogo en TS, validación cliente |
| S13 | CHECK constraint con error oscuro | BAJA | Validación server-side primero |

## 3. Resultado post-sprint

Sprint 3.4 cerró verde el 12-may con tag `v0.12.0-fase3-sprint4`.
4 bugs encontrados durante implementación (resueltos en commits
de fix dentro del mismo sprint):
- createClientComponentClient deprecation
- tipo_documento case-sensitivity
- PostgREST FK join no confiable → patrón canonizado como AP-003
- Padron creation null check + retry

Adicional: descubrimiento durante validación post-sprint que falta
agregar al sidebar las entradas de los módulos nuevos → AP-006
canonizado.
