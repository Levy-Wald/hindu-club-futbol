# SPRINT-PLAN v2.1 — Lista operativa de sprints

**Versión**: 2.1 (post RFC-005)  
**Fecha**: 14 de mayo de 2026  
**Status**: Accepted  
**Path esperado en repo**: `docs/SPRINT-PLAN.md`  
**Referencias**: RFC-004, RFC-005, ROADMAP-MASTER v2.0, MODULE-CATALOG  
**Supersedes**: SPRINT-PLAN v2.0 (13 de mayo de 2026)

---

## Propósito

Lista operativa de todos los sprints del proyecto, con su estado, dependencias, tag aplicado o esperado, costo y tema. Sirve como tablero único para saber qué sprint corre ahora, qué viene después, qué está cerrado y dónde está la deuda.

Esta versión 2.1 incorpora:
- Sprints ejecutados fuera del plan original entre 13-may y 14-may (A1.1, A2 expansiones, A3.1-A3.6).
- Los 13 tramos canonizados en RFC-005 hasta el 100% del proyecto.
- Estado real verificado vía MCP Supabase + Vercel al 14-may-2026.

---

## Convenciones

**Estado**:
- ✅ DONE — cerrado, en producción con tag
- 🔄 IN PROGRESS — en ejecución actual
- ⏳ NEXT — próximo a arrancar
- 📋 PLANNED — planificado, documentado
- 🚧 BLOCKED — bloqueado por dependencia
- 🗑️ CANCELLED — descartado o absorbido por otro sprint
- 💡 PROPOSED — propuesto, requiere RFC formal antes de ejecutar

**Costo**: estimación en horas Code (rango orientativo, sujeto a ajuste pre-sprint)  
**Tag**: tag de Git aplicado o esperado al cierre  

---

## Historial — FASES 1 a 5 (modelo anterior)

Cerradas en producción. Reubicadas en la taxonomía RFC-004 según corresponda.

| Sprint | Tema | Estado | Tag | Capa actual |
|---|---|---|---|---|
| 1.x | Init + personas + tenants | ✅ | varios | Troncal |
| 2.x | Comunicaciones + plantillas | ✅ | varios | Troncal |
| 3.x | Asistencias + pre-inscripciones | ✅ | varios | Cross-vertical |
| 3.4 | Visitantes externos (RFC-001) | ✅ | varios | Cross-vertical |
| 4.1 | Planificador mensual | ✅ | v0.14.0 | Vertical CCBP |
| 4.2 | Planificador semanal | ✅ | v0.15.0 | Vertical CCBP |
| 4.3 | Entrenamientos | ✅ | v0.16.0 | Vertical CCBP |
| 4.4 | Amistosos | ✅ | v0.17.0 | Vertical CCBP |
| 4.5 | Acceso físico | ✅ | v0.18.0 | Cross-vertical |
| 4.6 | Reservas de canchas | ✅ | v0.19.0 | Cross-vertical |
| 5.1 | Modelo torneos + wizard | ✅ | v0.20.0 | Vertical CCBP |
| 5.2 | Inscripciones externas + CSV | ✅ | v0.21.0 | Vertical CCBP |
| 5.3 | Fixture auto-generador | ✅ | v0.22.0 | Vertical CCBP |
| 5.4 | Tabla posiciones | ✅ | v0.23.0 | Vertical CCBP |
| 5.5 | Carga resultados | ✅ | v0.24.0 | Vertical CCBP |
| 5.6 | Stats dashboards | ✅ | v0.25.0 | Vertical CCBP |

---

## TRAMO 1 — FASE A (Cerrar troncal mínimo) — ✅ DONE

### Ejecutado al 14-may

| ID | Tema | Estado | Tag | Costo | Notas |
|---|---|---|---|---|---|
| A1 | Fix Base Operativa + Espacios | ✅ DONE | v0.27.0 | 12-15h | + tabla `espacios` + sidebar 4 capas |
| A1.1 | Hotfix wire creation modals + sidebar Operaciones | ✅ DONE | v0.27.1 | 2h | Botones de creación con onClick reales |
| A2 (parte 1) | Catálogo productos + variantes + categorías + marcas + galería + modos operación | ✅ DONE | v0.27.2 | 4h | |
| A2 (parte 2) | Ampliar productos +10 campos (EAN, descripciones, material, color, medida, origen, bulto, peso) | ✅ DONE | v0.27.2 | 2h | |
| A2.1 | Unificación productos: merge productos_servicios + tipo_uso + contabilidad | ✅ DONE | v0.27.2 | 3h | Fix FKs a movimientos_caja y cuotas_planes |
| A2.2 | Proveedores + responsables (N:M con polimorfismo) | ✅ DONE | v0.27.2 | 3h | producto_proveedores + producto_responsables |
| A2.5 | Listas precios múltiples ARS/USD con TC | ✅ DONE | v0.27.3 | 4h | **Funcionalmente cubre D3 (PIM N2 oficial)** |
| A2.6 | Depósitos + stock por depósito + movimientos | ✅ DONE | v0.27.4 | 5h | **Funcionalmente cubre D4 (PIM N3 oficial)**. Hotfix drift TS↔BD post-tag. |
| A3.1 | Refactor modules/finanzas + drop 6 vistas fin_* huérfanas | ✅ DONE | v0.27.5 | 3h | Consolida en modules/finanzas, drop fin_categorias_movimiento, elimina /finanzas/productos/ duplicado |
| A3.2 | Cajas con dimensiones (tipo_fiscal, entidad, actividad, datos bancarios) | ✅ DONE | v0.27.6 | 4h | + soft-delete + 7 columnas dimensionales |
| A3.3 | Sync PIM ↔ Finanzas (cuentas auto-resueltas según tipo_uso) | ✅ DONE | v0.27.7 | 2h | Helper resolverCuentasMovimiento |
| A3.4 | UIs faltantes: plan cuentas CRUD, períodos, config financiera, cotizaciones, convenios, cuenta corriente | ✅ DONE | v0.27.8 | 4h | |
| A3.5 | 4 reportes contables (Libro Mayor, Balance, EERR, Cobranzas) + 3 vistas BD + export PDF/XLSX | ✅ DONE | v0.27.9 | 5h | |
| A3.6 | Conciliación bancaria: importador CSV/XLSX + UI matcheo + auto-match sign-aware + FK reversa + reporte | ✅ DONE | v0.28.0 | 5h | Consolidación cuotas_emitidas vs fin_cuotas_emitidas resuelta (solo cuotas_emitidas existe) |

### Cerrado — Sprints v2 FASE A

| ID | Tema | Estado | Tag esperado | Costo | Notas |
|---|---|---|---|---|---|
| A2 v2 | Cierre formal PIM N1: smoke + datos demo en variantes + tag explícito | ✅ DONE | v0.27.10-fase-a-sprint-2 | <1h | Cierre administrativo, 9 variantes demo cargadas |
| A4 v2 | Completar CRM: atributos_custom_definicion + atributos_custom_valores + vinculos_cross + UI vínculos entidades | ✅ DONE | v0.27.11-fase-a-sprint-4 | 3h | 3 tablas nuevas, config page, tabs en persona + entidad |
| A5 | Comunicaciones cierre: Tiptap editor + variables sidebar + test send + versionado plantillas + automatizaciones CRUD + workflow editor dnd-kit | ✅ DONE | v0.27.12-fase-a-sprint-5 | 3h | 4 tablas nuevas, @tiptap/react, dnd-kit, isomorphic-dompurify |
| A6 | Proyectos & Tareas: 4 tablas + Kanban + Lista + Calendario + tab Proyectos en persona + comentarios + miembros + presupuesto | ✅ DONE | v0.27.13-fase-a-sprint-6 | 3h | dnd-kit, react-big-calendar, fn_presupuesto_consumido |

**Costo restante FASE A**: 0 — todos los sprints DONE
**Tag de cierre FASE A**: `v0.29.0-fase-a-completa` (aplicado 17-may-2026)

---

## TRAMO 2 — Hardening post-FASE-A (★ RFC-005)

| ID | Tema | Estado | Tag esperado | Costo | Depende de |
|---|---|---|---|---|---|
| H1 | Drift check TS↔BD en todos los módulos A2.x/A3.x | ✅ DONE | v0.29.1-hardening-h1 | <1h | Cero drift, 16 tablas auditadas, ADR-047 draft |
| H2 | Tests E2E + unit tests del ERP modular | ✅ DONE | v0.29.2-hardening-h2 | <1h | 6 E2E + 30 unit tests, 0 bugs |
| H3 | Backfill datos demo sintéticos | ✅ DONE | v0.29.3-hardening-h3 | <1h | 7 productos, 20 variantes, 20 precios, 20 stock, 30 movs, 26 cotiz, 5 convenios, 20 conciliacion |
| H4 | Docs canónicos v2 (ARCHITECTURE v3, DATA-MODEL, MODULE-CATALOG, ADR-INDEX, ADRs 047-052) | ✅ DONE | v0.29.5-hardening-post-fase-a | <1h | ARCHITECTURE v3, DATA-MODEL, MODULE-CATALOG, ADR-INDEX, 6 ADRs, cierre Tramo 2 |

**Subtotal**: ~12-16h Code  
**Tag de cierre**: `v0.29.5-hardening-post-fase-a`

---

## TRAMO 3 — FASE B (Cerrar vertical CCBP) — ✅ DONE

| ID | Tema | Estado | Tag esperado | Costo | RFC |
|---|---|---|---|---|---|
| B1 | Salud / Lesiones operativas | ✅ DONE | v0.28.1-fase-b-sprint-1 | 5h | RFC-003 |
| B2 | Historial / Trayectoria deportiva | ✅ DONE | v0.28.2-fase-b-sprint-2 | 4h | RFC-003 |
| B3 | Scouting + 11 dimensiones | ✅ DONE | v0.28.3-fase-b-sprint-3 | 8h | RFC-003 |
| B4 | Reportes deportivos | ✅ DONE | v0.28.4-fase-b-sprint-4 | 6h | RFC-003 |
| B5 | Activar Socios (suscripciones_membresía cross-vertical) | ✅ DONE | v0.29.0-fase-b-sprint-5 | 5h | — |
| B6 | Cuerpo Técnico + Diagramación visual del club | ✅ DONE | v0.30.0-fase-b-completa | 6h | — |

**Subtotal**: ~34h Code
**Tag de cierre**: `v0.30.0-fase-b-completa` (aplicado 18-may-2026)
**Costo restante FASE B**: 0 — todos los sprints DONE

---

## TRAMO 4 — Hardening post-FASE-B (★ RFC-005) ✅ DONE

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| H5 | Tests E2E end-to-end CCBP completo | ✅ DONE | v0.30.1-hardening-h5 | 3-4h |
| H6 | Smoke tests automáticos pre-deploy en CI | ✅ DONE | v0.30.2-hardening-h6 | 2-3h |
| H7 | Performance audit | ✅ DONE | v0.30.5-hardening-post-fase-b | 2h |

**Subtotal**: ~7-9h Code
**Tag de cierre**: `v0.30.5-hardening-post-fase-b` (aplicado 18-may-2026)
**Cierre formal**: `v0.30.5-tramo-4-cierre-formal`

---

## TRAMO 5 — FASE C Demo Hindu

| ID | Tema | Estado | Duración |
|---|---|---|---|
| C1 | Reset DB de Hindu + backup pre-reset | 📋 PLANNED | 1 día |
| C2 | Carga inicial vía importadores (por Yair) | 📋 PLANNED | 2-3 días |
| C3 | Operación real del staff de Hindu | 📋 PLANNED | 5-7 días |
| C4 | Recopilación feedback + priorización | 📋 PLANNED | 1-2 días |
| C5 | Decisión binaria: aprobado / requiere B' | 📋 PLANNED | 1 día |

**Duración**: ~10-14 días calendarios (no Code)  
**Cierre**: documento `cierre-fase-c-demo-hindu.md` en Drive `_Cierre Ejecutivo/`.

---

## TRAMO 6 — FASE B' Correcciones eventuales

Solo se activa si C5 dice "requiere correcciones". Sprints variables según priorización de feedback. Tag de cierre: `v0.30.9-fase-b-prima-completa`.

---

## TRAMO 7 — FASE D Cross-vertical extra

| ID | Tema | Estado | Tag esperado | Costo | Nota |
|---|---|---|---|---|---|
| D1 | Documentos / Firma digital | 📋 PLANNED | v0.31.0-fase-d-sprint-1 | 8h | Versionado + audit trail |
| D2 | Tickets / Solicitudes universalizado | 📋 PLANNED | v0.32.0-fase-d-sprint-2 | 6h | SLA + routing rules |
| D3 | Pricing avanzado (PIM N2) | 🔄 PARCIAL | v0.33.0-fase-d-sprint-3 | 1-2h | **Ya funcional vía A2.5**, queda formalización |
| D4 | Stock & Movimientos (PIM N3) | 🔄 PARCIAL | v0.34.0-fase-d-sprint-4 | 1-2h | **Ya funcional vía A2.6**, queda formalización |
| D5 | Consolidación tablas paralelas (utileria_items + concesion_productos → productos) | 📋 PLANNED | v0.35.0-fase-d-sprint-5 | 8-10h | Riesgo alto, ADR pre-sprint |
| D6 | Mapa visual generalizado (mapa_visual_espacios cross-vertical) | 📋 PLANNED | v0.40.0-fase-d-completa | 8h | Generalización B6 |

**Subtotal**: ~32-36h Code  
**Tag de cierre**: `v0.40.0-fase-d-completa`

---

## TRAMO 8 — Plataforma SaaS comercial-técnica (★ RFC-005)

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| P1 | Multi-tenancy real (planes_comerciales + suscripciones + límites) | 📋 PLANNED | v0.40.1-saas-p1 | 6-8h |
| P2 | Self-service onboarding (signup + wizard + plantillas seed por vertical) | 📋 PLANNED | v0.40.2-saas-p2 | 5-6h |
| P3 | Marketplace de módulos (UI + ModuloGuard wrapper) | 📋 PLANNED | v0.40.3-saas-p3 | 6-8h |
| P4 | Billing interno (plataforma cobra a tenants) | 📋 PLANNED | v0.40.4-saas-p4 | 5-6h |
| P5 | Admin global super-admin (panel monitoreo MRR/churn cross-tenant) | 📋 PLANNED | v0.40.5-saas-p5 | 4-5h |
| P6 | Tenant impersonation (super-admin entra como cualquier tenant para soporte) | 📋 PLANNED | v0.41.0-saas-comercial-completa | 2-3h |

**Subtotal**: ~28-36h Code  
**Tag de cierre**: `v0.41.0-saas-comercial-completa`

---

## TRAMO 9 — FASE E Verticales nuevos

### Vertical E1 — Estudios de Arquitectura

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| E1.1 | Mini-troncal proyectos_obra + etapas | 📋 PLANNED | v0.41.1-fase-e1-sprint-1 | 8h |
| E1.2 | Cronograma de obra + avances con fotos | 📋 PLANNED | v0.42.0-fase-e1-sprint-2 | 6h |
| E1.3 | Subcontratistas + planos | 📋 PLANNED | v0.43.0-fase-e1-sprint-3 | 6h |
| E1.4 | Pedidos de materiales | 📋 PLANNED | v0.44.0-fase-e1-sprint-4 | 5h |

**Cierre E1**: `v0.45.0-vertical-arq-completa`. Costo ~25h.

### Vertical E2 — Estudios de Abogacía

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| E2.1 | Mini-troncal casos / expedientes | 📋 PLANNED | v0.46.0-fase-e2-sprint-1 | 6h |
| E2.2 | Audiencias + plazos procesales | 📋 PLANNED | v0.47.0-fase-e2-sprint-2 | 6h |
| E2.3 | Honorarios / cuota litis | 📋 PLANNED | v0.48.0-fase-e2-sprint-3 | 5h |
| E2.4 | Documentación procesal + poderes | 📋 PLANNED | v0.49.0-fase-e2-sprint-4 | 6h |

**Cierre E2**: `v0.50.0-vertical-abog-completa`. Costo ~23h.

### Vertical E3 — Agencias de Publicidad

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| E3.1 | Mini-troncal cuentas / campañas | 📋 PLANNED | v0.51.0-fase-e3-sprint-1 | 6h |
| E3.2 | Briefings | 📋 PLANNED | v0.52.0-fase-e3-sprint-2 | 5h |
| E3.3 | Calendarios editoriales | 📋 PLANNED | v0.53.0-fase-e3-sprint-3 | 5h |
| E3.4 | Reportes de performance | 📋 PLANNED | v0.54.0-fase-e3-sprint-4 | 5h |

**Cierre E3**: `v0.55.0-vertical-pub-completa`. Costo ~21h.

### Vertical E4 — Retailers PyME

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| E4.1 | Mini-troncal sucursales + empleados | 📋 PLANNED | v0.56.0-fase-e4-sprint-1 | 6h |
| E4.2 | Promociones + listas de precios (consume Pricing N2) | 📋 PLANNED | v0.57.0-fase-e4-sprint-2 | 8h |
| E4.3 | Vidriera digital / catálogo público | 📋 PLANNED | v0.58.0-fase-e4-sprint-3 | 6h |
| E4.4 | eCommerce sync (Tiendanube/Shopify, consume conector K7) | 📋 PLANNED | v0.59.0-fase-e4-sprint-4 | 10h | 
| E4.5 | Programa de fidelidad | 📋 PLANNED | v0.60.0-vertical-retail-completa | 5h |

**Cierre E4**: `v0.60.0-vertical-retail-completa`. Costo ~35h.

**Subtotal FASE E**: ~104h Code

---

## TRAMO 10 — Conectores Capa 3 (★ RFC-005)

Pueden ejecutarse en paralelo con Tramo 8 o Tramo 9 según demanda real. No es necesario hacer los 11 de corrido.

| ID | Conector | Reemplaza mock | Tag esperado | Costo |
|---|---|---|---|---|
| K1 | Resend (email transaccional) | `com_envios` email | v0.42.0-conector-resend | 5h |
| K2 | WhatsApp Business API | `com_envios` whatsapp | v0.42.1-conector-whatsapp | 8h |
| K3 | MercadoPago (cobros AR) | `cuotas_pagos` ARS | v0.42.2-conector-mercadopago | 6h |
| K4 | AFIP (facturación electrónica AR) | `tipos_comprobante` con CAE | v0.42.3-conector-afip | 8h |
| K5 | Stripe (cobros internacionales) | `cuotas_pagos` USD | v0.42.4-conector-stripe | 5h |
| K6 | Google Calendar / Outlook | `eventos` calendario externo | v0.42.5-conector-calendar | 5h |
| K7 | Tiendanube / Shopify | productos + stock + ventas | v0.42.6-conector-ecommerce | 8h |
| K8 | Cloudflare R2 (storage alternativo) | uploads | v0.42.7-conector-r2 | 3h |
| K9 | Google Document AI (OCR) | upload manual D1 | v0.42.8-conector-ocr | 4h |
| K10 | Sales Layer / Plytix / Akeneo (PIM enterprise) | PIM N1+N2+N3 | v0.42.9-conector-pim-ent | 6h |
| K11 | Slack / Discord / Teams (notif internas) | `notificaciones` externo | v0.42.10-conector-chatops | 4h |

**Subtotal**: ~62h Code  
Cada conector tiene su ADR + flag `activo_por_tenant`.

---

## TRAMO 11 — API pública + Agent layer (★ RFC-005, PROPUESTO)

**Status**: 💡 PROPOSED. Requiere RFC-005a formal antes de ejecutar.

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| API1 | Auth API (OAuth2 + JWT + scopes + rate limit) | 💡 PROPOSED | v0.50.0-api-publica-auth | 6h |
| API2 | API REST pública v1 (endpoints 9 bloques troncales) | 💡 PROPOSED | v0.50.1-api-publica-v1 | 12h |
| API3 | Webhooks salientes | 💡 PROPOSED | v0.50.2-api-publica-webhooks | 6h |
| API4 | Capability catalog (OpenAPI 3.1 + `/capabilities`) | 💡 PROPOSED | v0.50.3-api-publica-catalog | 4h |
| API5 | SDKs oficiales TypeScript + Python | 💡 PROPOSED | v0.50.4-api-publica-sdk | 6h |
| API6 | Docs viva tipo Stripe/Twilio | 💡 PROPOSED | v0.50.5-api-publica-docs | 5h |
| AG1 | Agent Connector (bots externos → API interna) | 💡 PROPOSED | v0.51.0-agent-layer | 8h |

**Subtotal estimado**: ~47h Code  
**Pre-requisito**: RFC-005a aprobado.

---

## TRAMO 12 — Plataforma técnica madura (★ RFC-005)

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| T1 | Observability (Sentry + structured logs + métricas + alertas) | 📋 PLANNED | v0.65.0-observability | 6h |
| T2 | Backups + DR | 📋 PLANNED | v0.66.0-backups-dr | 5h |
| T3 | Multi-region (replicas EU/US) | 📋 PLANNED | v0.67.0-multi-region | 8h |
| T4 | Performance + caching | 📋 PLANNED | v0.68.0-performance | 8h |
| T5 | Seguridad + pentesting + SOC2 readiness | 📋 PLANNED | v0.69.0-security | 6h |
| T6 | CI/CD endurecido + canary deploys | 📋 PLANNED | v0.70.0-plataforma-madura | 5h |

**Subtotal**: ~38h Code  
**Tag de cierre**: `v0.70.0-plataforma-madura`

---

## TRAMO 13 — IA nativa (★ RFC-005, opcional)

| ID | Tema | Estado | Tag esperado | Costo |
|---|---|---|---|---|
| AI1 | Asistente embebido por vertical (Claude API + RAG) | 📋 PLANNED | v0.75.0-ai-asistente | 8h |
| AI2 | Auto-clasificación tickets (D2) con ML | 📋 PLANNED | v0.76.0-ai-tickets | 5h |
| AI3 | Sugerencias scouting (B3) con embeddings | 📋 PLANNED | v0.77.0-ai-scouting | 6h |
| AI4 | Análisis predictivo churn socios (B5) | 📋 PLANNED | v0.78.0-ai-churn | 5h |
| AI5 | OCR documentos (D1) con Document AI | 📋 PLANNED | v0.80.0-ia-nativa | 4h |

**Subtotal**: ~28h Code  
**Tag de cierre**: `v0.80.0-ia-nativa`

---

## Resumen de costos por tramo

| Tramo | Sprints | Costo Code | Calendario aprox |
|---|---|---|---|
| 1 — Cerrar FASE A | 4 pendientes | 23-30h | — |
| 2 — Hardening post-A | 4 | 12-16h | — |
| 3 — FASE B CCBP | 6 | 34h | — |
| 4 — Hardening post-B | 3 | 7-9h | — |
| 5 — FASE C Demo | 5 actividades | 0h Code | 10-14 días |
| 6 — FASE B' eventual | variable | variable | — |
| 7 — FASE D Cross-vertical | 6 (D3+D4 parciales) | 32-36h | — |
| 8 — SaaS comercial | 6 | 28-36h | — |
| 9 — FASE E Verticales | 17 (4 verticales) | 104h | — |
| 10 — Conectores Capa 3 | 11 | 62h | — |
| 11 — API + Agent | 7 propuestos | 47h | — |
| 12 — Plataforma madura | 6 | 38h | — |
| 13 — IA nativa | 5 | 28h | — |
| **TOTAL** | **~80 sprints** | **~415-490h Code** | — |

---

## Sprint en curso

**Tramo 2 cerrado**: H4 DONE. Tag `v0.29.5-hardening-post-fase-a`.

**Próximo a arrancar**: Tramo 3 — FASE B sprint B1 (Salud / Lesiones operativas).

**Estado BD verificado al 14-may-2026 vía MCP**:
- 163 tablas públicas
- 27 vistas (incluye `v_productos_catalogo`, `v_libro_mayor`, `v_balance_cuentas`, `v_estado_cobranzas`, `v_cuenta_corriente_persona`)
- 130 triggers
- ~30-40 RPCs custom + 99 utilitarias (citext, gtrgm)
- 46.624 filas en `audit_log`
- 2.390 personas, 64 atributos catalogados, 5 padrones, 3 import_pipelines, 102 cuotas emitidas, 51 suscripciones activas

---

## Deuda registrada

Cosas planificadas pero no urgentes ahora:

| Deuda | Sprint donde se resuelve |
|---|---|
| Renombre físico modules/utileria → inventario | D5 |
| Renombre físico modules/concesiones → pos | D5 |
| Renombre físico modules/reservas → reservas_espacios | D5 |
| Consolidación 3 tablas paralelas de productos | D5 |
| Módulo huérfano: disciplinas | TBD |
| Módulo huérfano: proveedores (¿absorber en entidades?) | TBD |
| Módulo huérfano: talles (¿es necesario?) | TBD |
| Nombre del producto raíz (no "ClubCore") | post FASE C |
| ~~Padrón "e" en Hindu~~ | ✅ Resuelto en H3 (soft-delete activo=false) |
| ~~`productos_variantes` con 0 filas~~ | ✅ Resuelto en A2 v2 + H3 (29 filas) |

---

## Última actualización

14 de mayo de 2026. Versión 2.1.

Próxima revisión: al cierre de cada tramo (mínimo) o al cierre de cada FASE (canónico).

**Fin del SPRINT-PLAN v2.1.**
