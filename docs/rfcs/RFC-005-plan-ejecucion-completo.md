# RFC-005 — Plan de ejecución completo a 100%

**Versión**: 1.0  
**Fecha**: 14 de mayo de 2026  
**Status**: Accepted  
**Autor**: Claude Opus (con Yair Levy Wald)  
**Path esperado en repo**: `docs/rfcs/RFC-005-plan-ejecucion-completo.md`  
**Referencias**: RFC-004, ADR-040, ADR-041, ADR-042, ADR-043, ADR-044, ADR-045, ADR-046  
**Supersedes**: parcialmente ROADMAP-MASTER v2.0 (en lo relativo a tramos faltantes para alcanzar el 100%)

---

## 1. Contexto

RFC-004 estableció la arquitectura de 4 capas y el plan oficial FASE A → E. ROADMAP-MASTER v2.0 detalló los sprints de cada fase (35-40 sprints, ~230-250h Code).

Sin embargo, ese plan responde a la pregunta "¿qué se construye?", no a "¿cómo se opera el sistema una vez construido?". Faltan tramos críticos para que el producto sea una plataforma SaaS multi-tenant real y vendible:

- **Hardening técnico** entre fases (deuda acumulada por sub-sprints fuera de plan).
- **Plataforma SaaS comercial-técnica** (multi-tenancy real, onboarding self-service, marketplace, billing interno).
- **Conectores externos** (Capa 3 oficial, declarada en ADR-040 sin detalle).
- **API pública + Agent layer** (endgame conversacional mencionado por el owner, pendiente de RFC formal).
- **Plataforma técnica madura** (observabilidad, backups, DR, multi-region, performance).
- **IA nativa** (asistentes embebidos, ML, OCR — opcional).

Adicionalmente, se ejecutaron 10 sprints fuera del plan original entre el 13-may (cierre RFC-004) y el 14-may (cierre A3.6), construyendo ERP modular avanzado que cubrió funcionalmente partes de FASE D (PIM N2/N3). Esta deuda documental requiere formalización.

Este RFC canoniza el plan de ejecución completo desde el estado actual hasta el 100% del proyecto.

---

## 2. Decisión

El plan se organiza en **13 tramos** ejecutables. Los tramos del plan oficial Drive (FASE A, B, C, D, E) se mantienen sin cambios en su contenido. Los tramos nuevos se intercalan con prefijos distintos para no romper la nomenclatura existente:

| Prefijo | Significado | Origen |
|---|---|---|
| **A, B, C, D, E** | Fases del plan oficial Drive | RFC-004 / ROADMAP-MASTER v2.0 |
| **H** | Hardening (cierre técnico entre fases) | RFC-005 (nuevo) |
| **P** | Plataforma SaaS comercial-técnica | RFC-005 (nuevo) |
| **K** | Conectores externos (Capa 3) | ADR-040 declara, RFC-005 detalla |
| **API/AG** | API pública + Agent layer | RFC-005 propuesto, requiere RFC-005a |
| **T** | Plataforma técnica madura | RFC-005 (nuevo) |
| **AI** | IA nativa (opcional) | RFC-005 (nuevo) |

### 2.1 Mapa de tramos

```
TRAMO 1   — FASE A (cerrar 4 sprints pendientes)                  [Drive]
TRAMO 2   — Hardening post-FASE-A (H1-H4)                          [RFC-005]
TRAMO 3   — FASE B vertical CCBP (B1-B6)                           [Drive]
TRAMO 4   — Hardening post-FASE-B (H5-H7)                          [RFC-005]
TRAMO 5   — FASE C Demo Hindu (C1-C5)                              [Drive]
TRAMO 6   — FASE B' eventual correcciones                          [Drive]
TRAMO 7   — FASE D Cross-vertical extra (D1-D6)                    [Drive]
TRAMO 8   — Plataforma SaaS comercial-técnica (P1-P6)              [RFC-005]
TRAMO 9   — FASE E Verticales nuevos (E1.1-E4.5)                   [Drive]
TRAMO 10  — Conectores Capa 3 (K1-K11)                             [RFC-005]
TRAMO 11  — API pública + Agent layer (API1-API6, AG1)             [Propuesto, RFC-005a]
TRAMO 12  — Plataforma técnica madura (T1-T6)                      [RFC-005]
TRAMO 13  — IA nativa opcional (AI1-AI5)                           [RFC-005]
```

### 2.2 Orden de dependencias

```
1 → 2 → 3 → 4 → 5 → [6?] → 7 → 8 → 9
                                   ↓
                                  10 (puede correr en paralelo con 8 y 9)
                                   ↓
                                  11 → 12 → 13
```

**Hitos críticos**:
- Tramo 5 (Demo Hindu) es **quality gate**. Si falla, vuelta a B'.
- Tramo 8 (SaaS comercial) es **prerequisito real** para Tramo 9 (sin multi-tenancy operativa, vender verticales nuevos es teórico).
- Tramo 10 (Conectores) **multiplica el valor del producto**. Mock-first vigente hasta acá.
- Tramo 11 (API) **requiere RFC-005a formal** antes de ejecutar.

---

## 3. Detalle por tramo

### TRAMO 1 — Cerrar FASE A oficial (Drive)

**Objetivo**: completar los 9 bloques del troncal universal (ADR-041) con UI funcional.

**Estado de entrada**: A1 ✅, A1.1 ✅, A2 funcionalmente OK (vista + tablas), A2.1+A2.2+A2.5+A2.6 ✅ (fuera de plan), A3.1-A3.6 ✅ (fuera de plan).

**Sprints pendientes**:

| Sprint | Tema | Costo | Estado prompt | Drift vs BD real |
|---|---|---|---|---|
| A2 v2 | Cierre formal PIM N1: smoke completo + datos demo en variantes + tag explícito `v0.27.0-fase-a-sprint-2` | 1-2h | Existe (Drive `_Sprints/`), actualizar contra BD post-A2.6 | Sí, requiere v2 |
| A4 v2 | Completar CRM avanzado: atributos_custom_definicion + atributos_custom_valores + UI vínculos completa. No rehacer padrones+importadores+import_pipelines+personas_vinculos (ya construidos). | 5-8h | Existe, actualizar contra BD (padrones y importadores ya existen) | Sí, requiere v2 |
| A5 | Comunicaciones cierre: editor plantillas expandido + com_automatizaciones + com_automatizaciones_pasos + com_variables_disponibles + workflow editor + test send | 5h | Existe, sin drift | No |
| A6 | Proyectos & Tareas: 4 tablas (proyectos, proyecto_tareas, proyecto_miembros, proyecto_comentarios) + Kanban con dnd-kit + Lista + Calendario + tab "Proyectos" en persona/entidad | 12-15h | Existe, sin drift | No |

**Subtotal**: ~23-30h Code  
**Tag de cierre**: `v0.29.0-fase-a-completa`

### TRAMO 2 — Hardening post-FASE-A (★ RFC-005)

**Objetivo**: cerrar deuda técnica acumulada por los 10 sprints fuera de plan antes de saltar a FASE B.

**Justificación arquitectónica**: A2.x y A3.1-A3.6 se ejecutaron con auditoría parcial. A2.6 tuvo drift TS↔BD detectado post-tag (hotfix v0.27.4). Tests E2E del ERP modular avanzado son cero. Documentación canónica (ARCHITECTURE, DATA-MODEL, MODULE-CATALOG) está desactualizada respecto a 163 tablas reales.

| Sprint | Tema | Costo |
|---|---|---|
| H1 | Drift check completo TS↔BD: comparar columnas reales vs Zod schemas vs queries vs UI en todos los módulos A2.x/A3.x. Reporte de discrepancias + correcciones. Auditoría arquitectónica formal pre-tag. | 3-4h |
| H2 | Tests E2E + unit tests del ERP modular: cobertura mínima happy path de A2.5 (listas precios), A2.6 (stock por depósito), A3.2 (cajas dimensionadas), A3.4 (UIs finanzas), A3.5 (reportes contables), A3.6 (conciliación bancaria). | 4-5h |
| H3 | Backfill datos demo no-Hindu: variantes de productos sintéticas, padrón demo, importadores con datos sintéticos. Sin contaminar registros reales de Hindu. | 2-3h |
| H4 | Docs canónicos v2: ARCHITECTURE.md v3 con 4 capas + 163 tablas reales, DATA-MODEL.md actualizado, MODULE-CATALOG.md con todos los módulos catalogados con capa real, ADR-INDEX completo con ADRs derivados de sub-sprints. | 3-4h |

**Subtotal**: ~12-16h Code  
**Tag de cierre**: `v0.29.5-hardening-post-fase-a`

### TRAMO 3 — FASE B vertical CCBP (Drive)

**Objetivo**: dejar el vertical CCBP 100% productivo para Hindu y vendible a otros clubes/countries/barrios privados.

| Sprint | Tema | Costo | Estado prompt |
|---|---|---|---|
| B1 | Salud / Lesiones operativas: activar personas_lesiones (tabla ya existe, 0 filas), UI carga/listado, notificación al CT, indicador LESIONADO en convocatoria | 5h | Por armar |
| B2 | Historial / Trayectoria deportiva: clubes previos, logros, trayectoria en ficha persona | 4h | Por armar |
| B3 | Scouting + 11 dimensiones: scouting_fichas (existe) + scouting_evaluaciones, UI scouter, dashboard | 8h | Por armar |
| B4 | Reportes deportivos: stats por equipo, lesionados activos, performance jugadores, comparativas | 6h | Por armar |
| B5 | Activar Socios: convertir módulo `socios` huérfano en `suscripciones_membresia` cross-vertical. UI altas/bajas, integración cobranza | 5h | Por armar |
| B6 | Cuerpo Técnico + Diagramación visual del club: UI integrada CT, módulo `diagramacion_club` con mapa 2D canchas/vestuarios/bares | 6h | Por armar |

**Subtotal**: ~34h Code  
**Tag de cierre**: `v0.30.0-fase-b-completa`

### TRAMO 4 — Hardening post-FASE-B (★ RFC-005)

**Objetivo**: cierre técnico antes de la demo a Hindu.

| Sprint | Tema | Costo |
|---|---|---|
| H5 | Tests E2E end-to-end del vertical CCBP: registro de jugador → asistencia a entrenamiento → lesión → baja temporal → alta → torneo → estadística. Smoke completo del happy path CCBP. | 3-4h |
| H6 | Smoke tests automáticos pre-deploy: suite que corre en CI antes de cada push a main, cubre los 9 bloques troncales + CCBP completo. | 2-3h |
| H7 | Performance audit: queries lentas (pg_stat_statements), índices faltantes, RLS overhead, vistas materializadas si corresponde. | 2h |

**Subtotal**: ~7-9h Code  
**Tag de cierre**: `v0.30.5-hardening-post-fase-b`

### TRAMO 5 — FASE C Demo a Hindu (Drive)

**Objetivo**: validación end-to-end del producto con cliente real en modo mock.

| Actividad | Duración |
|---|---|
| C1 | Reset DB de Hindu + backup automático pre-reset (ADR técnico). Conservar audit_log. | 1 día |
| C2 | Carga inicial vía importadores: Yair carga personas, equipos, eventos desde Excel/CSV. | 2-3 días |
| C3 | Operación real del staff de Hindu (Juan Marco Lavagno + admins): uso del sistema durante 5-7 días en condiciones reales. | 5-7 días |
| C4 | Recopilación de feedback estructurado: formulario diario + logs de errores + interviews. Priorización de bugs/mejoras. | 1-2 días |
| C5 | Decisión binaria: APROBADO para abrir FASE D-E, o requiere FASE B' (correcciones). Documento de validación firmado. | 1 día |

**Subtotal**: ~10-14 días calendarios. 0h Code (validación, no construcción).  
**Cierre**: documento `cierre-fase-c-demo-hindu.md` en Drive `_Cierre Ejecutivo/`.

### TRAMO 6 — FASE B' Correcciones eventuales (Drive)

**Objetivo**: aplicar correcciones priorizadas por C4 si C5 dice "requiere correcciones".

Solo se activa si la demo falla. Sprints variables según priorización del feedback. Tag de cierre: `v0.30.9-fase-b-prima-completa`.

### TRAMO 7 — FASE D Cross-vertical extra (Drive, con notas)

**Objetivo**: nivelar capacidades cross-vertical antes de abrir verticales nuevos.

| Sprint | Tema | Costo | Nota |
|---|---|---|---|
| D1 | Documentos / Firma digital: módulo nuevo con upload, versionado, firma mock-first | 8h | Por armar |
| D2 | Tickets / Solicitudes universalizado: absorber `solicitudes` y `utileria_solicitudes` en módulo único, agregar SLA + routing rules | 6h | Por armar |
| D3 | Pricing avanzado (PIM N2): **YA FUNCIONAL** vía A2.5. Sprint queda como formalización + ADR explicito que cierra. | 1-2h | Cerrar como done parcial |
| D4 | Stock & Movimientos (PIM N3): **YA FUNCIONAL** vía A2.6. Sprint queda como formalización + ADR explicito. | 1-2h | Cerrar como done parcial |
| D5 | Consolidación tablas paralelas: migrar `utileria_items` + `concesion_productos` → `productos`. RIESGO ALTO. | 8-10h | Por armar, ADR pre-sprint |
| D6 | Mapa visual generalizado: generalización de B6 a `mapa_visual_espacios` cross-vertical | 8h | Por armar |

**Subtotal**: ~32-36h Code (no 46-48 porque D3+D4 ya hechos)  
**Tag de cierre**: `v0.40.0-fase-d-completa`

### TRAMO 8 — Plataforma SaaS comercial-técnica (★ RFC-005)

**Objetivo**: convertir el sistema de mono-tenant operativo (TENANT_ID hardcoded) a multi-tenant comercial real.

**Justificación arquitectónica**: ADR-043 conceptualiza el modelo modular comercial con apagados visibles pero no hay implementación. Sin estos sprints, FASE E (verticales nuevos) es teórica: no podés sumar un segundo tenant operativo.

| Sprint | Tema | Costo |
|---|---|---|
| P1 | Multi-tenancy real: `planes_comerciales` + suscripciones de tenants + límites por plan (cantidad usuarios, almacenamiento, eventos/mes). Validación RLS funciona para N tenants. | 6-8h |
| P2 | Self-service onboarding: signup tenant + wizard de configuración inicial (vertical, módulos a activar, plantillas seed) | 5-6h |
| P3 | Marketplace de módulos: `/admin/marketplace` con catálogo cross-vertical + conectores + precios + activación. Wrapper `<ModuloGuard>` implementado. | 6-8h |
| P4 | Billing interno: facturación de plataforma a tenants (qué le cobramos a cada cliente). Distinto del módulo Cobranza (qué el tenant cobra a sus clientes). | 5-6h |
| P5 | Admin global del SaaS (super-admin): panel para owner con monitoreo de todos los tenants, MRR, churn, errores cross-tenant | 4-5h |
| P6 | Tenant switching / impersonation: super-admin puede entrar como cualquier tenant para soporte. Audit log especial. | 2-3h |

**Subtotal**: ~28-36h Code  
**Tag de cierre**: `v0.41.0-saas-comercial-completa`

### TRAMO 9 — FASE E Verticales nuevos (Drive)

**Objetivo**: vender la plataforma a verticales adicionales.

| Vertical | Sprints | Costo | Cliente piloto |
|---|---|---|---|
| E1 Arquitectura | E1.1 mini-troncal + E1.2 cronograma + E1.3 subcontratistas + E1.4 materiales | ~25h | Prima del owner |
| E2 Abogacía | E2.1 casos + E2.2 audiencias+plazos + E2.3 honorarios + E2.4 documentación procesal | ~23h | Kate |
| E3 Publicidad | E3.1 cuentas + E3.2 briefings + E3.3 calendarios + E3.4 reportes | ~21h | TBD |
| E4 Retail | E4.1 sucursales + E4.2 promociones + E4.3 vidriera + E4.4 e-com sync + E4.5 fidelidad | ~35h | Pergamino |

**Subtotal**: ~104h Code  
**Tag de cierre por vertical**: `v0.45.0`, `v0.50.0`, `v0.55.0`, `v0.60.0` (uno por vertical).

### TRAMO 10 — Conectores Capa 3 (★ RFC-005)

**Objetivo**: enchufar servicios externos reales reemplazando mocks selectivamente por tenant.

**Justificación arquitectónica**: ADR-040 declara Capa 3 = Conectores integrados como add-ons vendibles vía marketplace. ADR-035 establece mock-first universal hasta validación. Este tramo construye los conectores reales y el mecanismo de switch mock ↔ real por tenant.

| Sprint | Conector | Reemplaza mock de | Costo |
|---|---|---|---|
| K1 | Resend (transaccional email) | `com_envios` canal email | 5h |
| K2 | WhatsApp Business API (Wassenger/BAPI/Meta direct) | `com_envios` canal whatsapp | 8h |
| K3 | MercadoPago (cobros + suscripciones AR) | `cuotas_pagos` ARS | 6h |
| K4 | AFIP (facturación electrónica AR) | `tipos_comprobante` con CAE | 8h |
| K5 | Stripe (cobros internacionales USD/EUR) | `cuotas_pagos` USD | 5h |
| K6 | Google Calendar / Outlook (sync bidireccional) | `eventos` calendario externo | 5h |
| K7 | Tiendanube / Shopify (e-commerce sync) | productos + stock + ventas | 8h |
| K8 | Storage: Cloudflare R2 (alternativa Supabase Storage) | uploads de imágenes, docs | 3h |
| K9 | OCR + Document AI (Google Document AI) | upload manual D1 | 4h |
| K10 | Sales Layer / Plytix / Akeneo (PIM enterprise sync) | PIM N1+N2+N3 | 6h |
| K11 | Slack / Discord / Microsoft Teams (notificaciones internas) | `notificaciones` canal externo | 4h |

**Subtotal**: ~62h Code  
**Tags**: `v0.42.0-conector-resend`, `v0.42.1-conector-whatsapp`, etc.

Cada conector tiene su ADR específico + flag `activo_por_tenant` + UI en marketplace.

### TRAMO 11 — API pública + Agent layer (★ RFC-005, PROPUESTO)

**Status**: PROPUESTO. Requiere RFC-005a formal antes de ejecutar.

**Justificación**: el owner mencionó endgame conversacional (WhatsApp + voz + bots externos conectándose como clientes API). Esto requiere arquitectura formal independiente.

| Sprint | Tema | Costo estimado |
|---|---|---|
| API1 | Auth API: OAuth2 + JWT por tenant + scopes granulares + rate limit por API key | 6h |
| API2 | API REST pública v1: endpoints de los 9 bloques troncales (CRUD básico + queries) | 12h |
| API3 | Webhooks salientes: eventos del sistema (`evento.creado`, `pago.recibido`, `lesion.registrada`) → endpoints externos del cliente | 6h |
| API4 | Capability catalog: spec OpenAPI 3.1 + descubrible vía `/api/v1/capabilities` + versionado de spec | 4h |
| API5 | SDKs oficiales: TypeScript + Python con tipos generados de OpenAPI spec | 6h |
| API6 | Docs viva tipo Stripe/Twilio: Mintlify o similar, con playground + ejemplos por endpoint | 5h |
| AG1 | Agent Connector: punto de entrada `/api/v1/agents` para bots externos del cliente → traducción declarativa a API interna + memory context por sesión | 8h |

**Subtotal estimado**: ~47h Code  
**Pre-requisito**: RFC-005a aprobado.

### TRAMO 12 — Plataforma técnica madura (★ RFC-005)

**Objetivo**: operar con SLA de producción cuando hay clientes pagando en múltiples verticales.

| Sprint | Tema | Costo |
|---|---|---|
| T1 | Observability: Sentry (errors) + structured logs (Pino/Winston → log aggregator) + métricas (Grafana Cloud o similar) + alertas críticas | 6h |
| T2 | Backups + DR: pg_dump automático diario + retención 30d + replica read-only + plan de recuperación documentado con RTO/RPO | 5h |
| T3 | Multi-region: replica Supabase EU/US para latencia internacional + edge functions en Cloudflare | 8h |
| T4 | Performance: query optimization + indexes + caching layer (Redis o Cloudflare KV) + CDN para assets | 8h |
| T5 | Seguridad: pentesting externo + SOC2 readiness checklist si aplica + threat modeling + GDPR/LGPD compliance básico | 6h |
| T6 | CI/CD endurecido: tests regresión automáticos pre-deploy + canary deploys + rollback automático en errores 500 spike | 5h |

**Subtotal**: ~38h Code  
**Tag de cierre**: `v0.70.0-plataforma-madura`

### TRAMO 13 — IA nativa (★ RFC-005, opcional)

**Objetivo**: capas de inteligencia embebidas en el producto.

| Sprint | Tema | Costo |
|---|---|---|
| AI1 | Asistente embebido por vertical: chat in-app vía Claude API o OpenRouter, con contexto del tenant + RAG sobre documentación | 8h |
| AI2 | Auto-clasificación de tickets (D2) con ML simple (embeddings + clustering) | 5h |
| AI3 | Sugerencias de scouting (B3): embeddings de jugadores + recomendaciones por similitud | 6h |
| AI4 | Análisis predictivo de churn de socios (B5): ML simple sobre histórico de pagos/asistencias | 5h |
| AI5 | OCR de documentos (D1) con Document AI: extracción automática de campos de PDF/imagen | 4h |

**Subtotal**: ~28h Code  
**Tag de cierre**: `v0.80.0-ia-nativa`

---

## 4. Resumen ejecutivo

| Tramo | Tipo | Sprints | Costo Code | Status |
|---|---|---|---|---|
| 1 | Cerrar FASE A | 4 | 23-30h | Pendiente |
| 2 ★ | Hardening post-A | 4 | 12-16h | Pendiente |
| 3 | FASE B | 6 | 34h | Pendiente |
| 4 ★ | Hardening post-B | 3 | 7-9h | Pendiente |
| 5 | FASE C Demo | 5 | 0h Code (10-14 días) | Pendiente |
| 6 | FASE B' eventual | variable | variable | Condicional |
| 7 | FASE D | 6 (2 ya hechos) | 32-36h | Parcial |
| 8 ★ | SaaS comercial | 6 | 28-36h | Pendiente |
| 9 | FASE E | 17 | 104h | Pendiente |
| 10 ★ | Conectores Capa 3 | 11 | 62h | Pendiente |
| 11 ★ | API + Agent | 7 | 47h | Propuesto |
| 12 ★ | Plataforma madura | 6 | 38h | Pendiente |
| 13 ★ | IA nativa | 5 | 28h | Pendiente |
| **TOTAL** | | **~80 sprints** | **~415-490h Code** | |

Las horas son rangos estimados sujetos a ajuste pre-sprint según auditoría arquitectónica.

---

## 5. Alternativas consideradas

### 5.1 Mantener solo el plan oficial Drive (FASE A-E sin tramos extra)

**Descartada porque**:
- Saltar de FASE D directo a FASE E (verticales nuevos) sin tramo SaaS comercial-técnico significa abrir verticales sin multi-tenancy real operativa.
- Sin tramo Conectores Capa 3, el sistema queda en mock-first indefinido y no hay valor real para clientes finales.
- Sin tramo Plataforma técnica madura, operar SLA de producción con N clientes es inviable.
- Sin tramo Hardening entre fases, la deuda técnica se compone exponencialmente.

### 5.2 Hacer todos los tramos ★ después de FASE E

**Descartada porque**:
- Tramo 8 (SaaS comercial) es **prerequisito** de Tramo 9, no posterior.
- Tramo 10 (Conectores) bloquea validación real con clientes que no aceptan mock indefinido.
- Tramo 12 (Plataforma madura) tiene componentes (backups, observability) que deben existir desde el primer cliente real.

### 5.3 Construir Tramo 11 (API + Agent) ahora

**Descartada porque**:
- Requiere RFC-005a formal que no existe.
- Sin clientes pagando y sin datos reales, optimizar para integraciones externas es prematuro.
- Mejor: incluirlo como propuesto y dejar la decisión de activación para después del Tramo 9.

---

## 6. Consecuencias

### 6.1 Positivas

- Plan completo y verificable desde el estado actual hasta el 100% del proyecto.
- Tramos arquitectónicos críticos que faltaban (multi-tenancy real, conectores, observabilidad) ahora están planificados con ADRs derivados.
- Nomenclatura compatible con el plan oficial: nada se rompe, solo se agrega.
- Cada tramo tiene criterio de cierre verificable con tag de Git.
- El owner puede tomar decisiones de negocio sin ambigüedad sobre qué viene técnicamente.

### 6.2 Negativas

- El costo Code total casi se duplica respecto a ROADMAP-MASTER v2.0 (415-490h vs 230-250h). Las horas son orientativas.
- Requiere disciplina arquitectónica adicional: cada tramo ★ tiene ADRs propios que hay que mantener.
- Tramo 11 (API + Agent) requiere RFC-005a futuro.

### 6.3 Mitigaciones

- Los tramos ★ son independientes: si presupuesto o tiempo escasea, se pueden diferir (Tramo 12 IA es claramente opcional).
- Los Hardening (H1-H7) son acotados: 12-16h y 7-9h respectivamente.
- Tramo 10 (Conectores) se ejecuta sprint por sprint según demanda real: no se hacen los 11 de golpe.

---

## 7. Plan operativo de cierre

Al cierre de cada tramo:
1. Tag en Git con nomenclatura definida arriba.
2. Documento de cierre en Drive `_Cierre Ejecutivo/` con métricas, deuda detectada, ADRs derivados.
3. SPRINT-PLAN.md actualizado en repo + reflejo en Drive.
4. ARCHITECTURE.md / MODULE-CATALOG.md / DATA-MODEL.md actualizados si corresponde.
5. Auditoría arquitectónica vía MCP (FKs salientes, RLS+triggers+soft-delete, drift TS↔BD) pre-tag.

---

## 8. Referencias

- RFC-004 — Arquitectura Multi-Vertical (define las 4 capas + plan A-E)
- ADR-040 — Taxonomía de 4 capas
- ADR-041 — Troncal mínimo de 9 bloques
- ADR-042 — PIM en 3 niveles
- ADR-043 — Modelo modular comercial con apagados visibles
- ADR-044 — Orden de ejecución A → B → C → D → E
- ADR-045 — Reclasificación de módulos deportivos a cross-vertical
- ADR-046 — Vista v_productos_catalogo como puente temporal
- ROADMAP-MASTER v2.0 — Plataforma SaaS Multimodal
- SPRINT-PLAN v2.0 — Lista operativa de sprints (será reemplazado por v2.1 al canonizar este RFC)

---

## 9. Aprobación

- Owner: Yair Levy Wald
- Arquitecto externo: Claude Opus
- Fecha de canonización: 14 de mayo de 2026

---

## Apéndice A — Tabla maestra de tramos y sprints

| Tramo | Sprint | Tema | Costo | Tag esperado |
|---|---|---|---|---|
| 1 | A2 v2 | Cierre formal PIM N1 | 1-2h | v0.27.10-fase-a-sprint-2 |
| 1 | A4 v2 | Atributos custom + UI vínculos | 5-8h | v0.27.11-fase-a-sprint-4 |
| 1 | A5 | Comunicaciones cierre | 5h | v0.27.12-fase-a-sprint-5 |
| 1 | A6 | Proyectos & Tareas | 12-15h | v0.29.0-fase-a-completa |
| 2 | H1 | Drift check TS↔BD | 3-4h | v0.29.1-hardening-h1 |
| 2 | H2 | Tests E2E ERP modular | 4-5h | v0.29.2-hardening-h2 |
| 2 | H3 | Backfill datos demo | 2-3h | v0.29.3-hardening-h3 |
| 2 | H4 | Docs canónicos v2 | 3-4h | v0.29.5-hardening-post-fase-a |
| 3 | B1 | Salud / Lesiones | 5h | v0.28.1-fase-b-sprint-1 |
| 3 | B2 | Historial deportivo | 4h | v0.28.2-fase-b-sprint-2 |
| 3 | B3 | Scouting | 8h | v0.28.3-fase-b-sprint-3 |
| 3 | B4 | Reportes deportivos | 6h | v0.28.4-fase-b-sprint-4 |
| 3 | B5 | Activar Socios | 5h | v0.29.0-fase-b-sprint-5 |
| 3 | B6 | CT + Diagramación | 6h | v0.30.0-fase-b-completa |
| 4 | H5 | E2E CCBP completo | 3-4h | v0.30.1-hardening-h5 |
| 4 | H6 | Smoke tests CI | 2-3h | v0.30.2-hardening-h6 |
| 4 | H7 | Performance audit | 2h | v0.30.5-hardening-post-fase-b |
| 5 | C1-C5 | Demo Hindu | 10-14 días | (no Code, doc de cierre) |
| 7 | D1 | Documentos + Firma | 8h | v0.31.0-fase-d-sprint-1 |
| 7 | D2 | Tickets universalizado | 6h | v0.32.0-fase-d-sprint-2 |
| 7 | D3 | Pricing N2 formalización | 1-2h | v0.33.0-fase-d-sprint-3 |
| 7 | D4 | Stock N3 formalización | 1-2h | v0.34.0-fase-d-sprint-4 |
| 7 | D5 | Consolidación tablas paralelas | 8-10h | v0.35.0-fase-d-sprint-5 |
| 7 | D6 | Mapa visual generalizado | 8h | v0.40.0-fase-d-completa |
| 8 | P1 | Multi-tenancy real | 6-8h | v0.40.1-saas-p1 |
| 8 | P2 | Self-service onboarding | 5-6h | v0.40.2-saas-p2 |
| 8 | P3 | Marketplace módulos | 6-8h | v0.40.3-saas-p3 |
| 8 | P4 | Billing interno | 5-6h | v0.40.4-saas-p4 |
| 8 | P5 | Admin global super-admin | 4-5h | v0.40.5-saas-p5 |
| 8 | P6 | Tenant impersonation | 2-3h | v0.41.0-saas-comercial-completa |
| 9 | E1.1-E1.4 | Estudios Arquitectura | 25h | v0.45.0-vertical-arq-completa |
| 9 | E2.1-E2.4 | Estudios Abogacía | 23h | v0.50.0-vertical-abog-completa |
| 9 | E3.1-E3.4 | Agencias Publicidad | 21h | v0.55.0-vertical-pub-completa |
| 9 | E4.1-E4.5 | Retailers PyME | 35h | v0.60.0-vertical-retail-completa |
| 10 | K1-K11 | Conectores Capa 3 | 62h total | v0.42.x-conector-* |
| 11 | API1-AG1 | API + Agent layer | 47h | v0.50.0-api-publica |
| 12 | T1-T6 | Plataforma madura | 38h | v0.70.0-plataforma-madura |
| 13 | AI1-AI5 | IA nativa | 28h | v0.80.0-ia-nativa |

---

## Apéndice B — Glosario de prefijos

| Prefijo | Significado | Ejemplo |
|---|---|---|
| `A` | Sprint del troncal mínimo (FASE A) | A2, A4 |
| `B` | Sprint del vertical CCBP (FASE B) | B1, B3 |
| `C` | Actividad de validación con cliente (FASE C, no Code) | C1, C5 |
| `D` | Sprint cross-vertical (FASE D) | D1, D6 |
| `E1.x` | Sprint vertical Arquitectura (FASE E1) | E1.2 |
| `E2.x` | Sprint vertical Abogacía (FASE E2) | E2.3 |
| `E3.x` | Sprint vertical Publicidad (FASE E3) | E3.4 |
| `E4.x` | Sprint vertical Retail (FASE E4) | E4.5 |
| `H` | Sprint de Hardening técnico | H1, H5 |
| `P` | Sprint de Plataforma SaaS comercial | P1, P4 |
| `K` | Sprint de Conector Capa 3 | K1 (Resend), K3 (MercadoPago) |
| `API` | Sprint de API pública | API2 |
| `AG` | Sprint de Agent layer | AG1 |
| `T` | Sprint de plataforma técnica madura | T1, T4 |
| `AI` | Sprint de IA nativa | AI1, AI5 |

**Fin del RFC-005.**
