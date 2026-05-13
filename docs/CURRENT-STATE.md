# ClubCore — Current State

> Inventario real del proyecto al cierre del último sprint. Source of truth
> para saber qué existe, qué está operativo, qué está roto, qué falta.
>
> **Code mantiene este documento.** Lo actualiza al final de cada sprint
> según R-PE6 de `PROMPT-ENVELOPE.md`.
>
> Última actualización: 13 de mayo de 2026 — Sprint FASE 5.2 cerrado.
> Inscripciones en torneos externos + CSV import. FASE 5 en curso.

---

## 0. Snapshot ejecutivo

**Estado general:** FASE 1 cerrada. FASE 2 (Comunicación) completada al 100%.
FASE 3 (Operación deportiva) completada al 100%. FASE 4 (Planificadores)
completada al 100%. **FASE 5 (Competencias) iniciada:** Sprint 5.1 cerrado.

**Ultimo sprint cerrado:** **FASE 5.2** — Inscripciones en torneos externos + CSV import.
Extensión de equipos_competencias con torneo_id FK. Atributo torneos.inscriptor.
Inscripciones CRUD en /admin/competencias/inscripciones. CSV importer para
fixture y resultados (papaparse). Pantalla import en /admin/competencias/torneos/[id]/import.

**Próximo sprint:** FASE 5.3 — Fixture auto-generador.

**Deadline operativo:** 1 jun 2026 (prueba interna Hindu) · 1 jul 2026
(full operativo + demo-ready).

**Bloqueantes:** ninguno crítico hoy.

---

## 1. Métricas globales

| Métrica | Valor |
|---|---|
| Tablas en `public` | 159 |
| Tablas con RLS habilitada | 153 (96.2%) |
| RLS policies | 376 |
| Funciones custom (`pg_proc` en public) | 134 |
| Triggers | 96 |
| VIEWs | 28 |
| Storage buckets | 6 (incl. private-utileria-fotos) |
| Migrations consolidadas | 1 (init) + incrementales por sprint |
| Páginas Next.js | 76 (8 públicas + 68 admin) |
| API routes | 17 (5 endpoints v1 + 5 internos + 7 crons) |
| Server actions | ~186 en 33 archivos |
| Componentes custom (no shadcn) | ~160 |
| Tests E2E (Playwright) | 76 specs (72 pass, 1 skip, 3 flaky pre-existing) |
| Tenants registrados | 1 (Hindu Club) |
| Personas (Hindu) | 2,390 |
| Equipos (Hindu) | 7 |
| Atributos en catálogo | 71 (con torneos.admin, torneos.cargador, torneos.inscriptor) |
| Tipos de notificación catalogados | 23 |
| Tipos de evento catalogados | 24 (+amistoso) |
| Módulos catalogados | 57 (+torneos) |
| Módulos activos en Hindu | 42+ |
| Manifiestos module.json | 26 |
| Verticales en catálogo | 4 (club_deportivo, country_deportivo, federacion_hub, polo_educativo) |

---

## 2. Estado por capa

### 2.1 Troncal — CRM

**Estado general:** Operativo. Núcleo del sistema, sin datos faltantes
significativos.

**Tablas (datos en Hindu):**

| Tabla | Rows | Notas |
|---|---|---|
| `personas` | 2,390 | 103 columnas (3 columnas de disciplina migradas a `personas_disciplinas` en Sprint 14k.6) |
| `personas_atributos` | ~2,620 | 9 atributos activos en uso (incl. suscriptor x51) |
| `personas_padrones` | 2,561 | 4 padrones |
| `personas_vinculos` | 4 | Familiares/tutores cargados manualmente |
| `personas_documentos_identidad` | 2 | Sub-uso |
| `personas_preferencias_comunicacion` | 0 | Esqueleto |
| `entidades` | 3 | Cargadas manualmente (FACCMA, AIF, etc.) |
| `entidades_representantes` | 0 | Esqueleto |
| `pre_inscripciones` | 0 | UI funcional, sin uso real |
| `solicitudes` | 0 | UI funcional, sin uso real |
| `com_plantillas` | 18 | 18 plantillas sistema (seed protegidas) |
| `com_envios` | 61 | Envíos mock (Sprint FASE 2.3, lotes masivos) |
| `com_mensajes` | 0 | Sin envíos reales |

**Rutas UI operativas:** `/admin/personas/*` (listado, ficha, importar,
historial), `/admin/externos/*`, `/admin/comunicaciones/*`,
`/admin/pre-inscripciones`.

**Server actions:** 13 personas + 6 entidades + 14 comunicaciones + 3
pre-inscripciones.

**Gaps:** envíos reales con Resend (postergado a FASE 16 por ADR-035),
pre-inscripciones públicas (postergado).

---

### 2.2 Troncal — ERP

**Estado general:** **Esqueleto cargado completo, sin operación real.**

**Tablas de configuración (cargadas en Hindu):**

| Tabla | Rows | Notas |
|---|---|---|
| `plan_cuentas` | 104 | Árbol completo (activo 23, pasivo 14, patrimonio 6, ingreso 21, egreso 40) hasta nivel 4 |
| `tipos_comprobante` | 12 | AFIP compatibles |
| `medios_pago` | 7 | Efectivo, Transferencia, Débito, Crédito, MercadoPago, Cheque, Débito Automático |
| `cajas` | 3 | Caja General, Caja Chica, Banco CC |
| `periodos_contables` | 1 | Período actual abierto |
| `config_financiera` | 1 | Mora 5% / 10 días gracia, moneda ARS |
| `centros_costo` | 7 | General, Fútbol, Administración, Mantenimiento, Eventos, Sponsors, Cuotas Sociales (Sprint 14h) |
| `catalogo_categorias_movimiento` | 21 | Cargado |
| `cotizaciones` | 1 | Tipo de cambio cargado |

**Tablas transaccionales:**

| Tabla | Rows | Estado |
|---|---|---|
| `movimientos_caja` | 4+ | Generados por fn_cobrar_cuota y fn_anular_pago (Sprint 14g) |
| `cuotas_planes` | 1 | Fondo Fútbol 2026 (Sprint 14e) |
| `cuotas_emitidas` | 51 | Emitidas via `fn_emitir_cuotas_masivas` (Sprint 14f) |
| `cuotas_bonificaciones` | 0 | Sin uso |
| `cuotas_pagos` | 2+ | Pagos registrados via fn_cobrar_cuota (Sprint 14g) |
| `emisiones_cuota` | 2 | 1 activa (51 cuotas, 2026-05) + 1 anulada (Sprint 14f) |
| `convenios_pago` | 0 | Sin uso |
| `cuentas_corrientes` | 0 | Sin uso |
| `productos_servicios` | 1 | Fondo Fútbol 2026 (Sprint 14e) |
| `producto_proveedor` | 0 | Sin uso |
| `suscripciones` | 51 | 51 activas del padrón Suscriptores (Sprint 14e) |

**Rutas UI operativas:** `/admin/finanzas/*` (dashboard, cajas, movimientos,
cuotas, productos, suscripciones, centros-costo, plan-cuentas, productos/importar).

**Server actions:** 41 (cajas, movimientos, productos, planes, cuotas,
suscripciones, convenios, períodos, cotizaciones, config).

**Gaps:**
- Centros de costo: CRUD completo (Sprint 14h) ✅
- Reportes financieros: inexistentes (15b)
- Cobranza vía MercadoPago (15d)

---

### 2.3 Troncal — PIM

**Estado general:** **Embrionario. Decisión explícita (ADR-014):** no
construir PIM completo en 2026.

**Tablas:** `productos_servicios` (36 columnas, vacía).

**Plan hasta 1 jul:** productos como filas planas (cuotas, fondos, ventas
puntuales). Sin atributos, categorías, variantes ni canales.

**Gaps (postergados a 2027+):**
- `producto_categorias` (árbol)
- `producto_atributos` (clave-valor)
- `producto_variantes`
- `producto_imagenes`
- `producto_canales`
- `producto_combos`

---

### 2.4 Módulos deportivos (preset Club Deportivo)

**Estado general:** Núcleo operativo en Hindu. Componente más desarrollado
del producto. A partir de ADR-031, estos son módulos componibles al mismo
nivel que los demás (no una "capa vertical" separada).

**Tablas (datos en Hindu):**

| Tabla | Rows | Notas |
|---|---|---|
| `equipos` | 7 | FACCMA-Primera, FACCMA-Open28 Open, FACCMA-Open28 Junior, AIF-Selección, AIF-Juveniles, AIF-Senior, AIF-Super Maxi |
| `personas_equipos` | 211 | Planteles completos cargados via Sprint 14c.1 |
| `personas_disciplinas` | 2,111 | 2,081 principales + 30 secundarias (Sprint 14k.6, ADR-026) |
| `padrones` | 4 | Hindu Global + Jugadores 2026 + Suscriptores 2026 + uno inactivo |
| `categorias_equipo` | 0 | Esqueleto |
| `canchas` | 0 | Esqueleto |
| `equipos_competencias` | 0 | Esqueleto |
| `esquemas_tacticos` | 0 | Operativo — módulo táctico (Sprint FASE 4.5) |
| `esquema_posiciones` | 0 | Operativo — posiciones por esquema (Sprint FASE 4.5) |
| `partidos_detalle` | 98 | Extendida con torneo_id + categoria_id (Sprint FASE 5.1). torneo_slug deprecated (dual-read) |
| `torneos` | 0 | 6 formatos, 5 estados, CHECK constraints (Sprint FASE 5.1) |
| `torneo_categorias` | 0 | Categorías por torneo (Sprint FASE 5.1) |
| `torneo_equipos` | 0 | Equipos inscriptos, polimórfico propio/externo (Sprint FASE 5.1) |
| `scouting_fichas` | 0 | UI funcional, sin uso |
| `eventos` | 0 | Esqueleto |
| `evento_invitados` | 0 | Polymorphic (persona/entidad/equipo), auto-poblado lazy desde plantel (Sprint FASE 3.1) |
| `evento_asistencias` | 0 | 6 estados (pendiente/presente/ausente/tarde/justificado/lesionado), upsert idempotente (Sprint FASE 3.1) |
| `catalogo_ejercicios` | 20 | 20 globales (tenant_id NULL), 7 categorías. UNIQUE(tenant_id, slug) (Sprint FASE 4.3) |
| `entrenamiento_planes` | 0 | 1:1 con evento. UNIQUE(evento_id). Objetivo, intensidad, notas DT (Sprint FASE 4.3) |
| `entrenamiento_plan_bloques` | 0 | Bloques ordenados. CHECK ejercicio_id OR nombre_personalizado. CASCADE delete (Sprint FASE 4.3) |
| `personas_historial_categoria_deportiva` | 0 | Esqueleto |
| `personas_historial_padron` | 0 | Esqueleto |
| `personas_lesiones` | 0 | Esqueleto |
| `personas_clubes_anteriores` | 0 | Esqueleto |
| `personas_premios_logros` | 0 | Esqueleto |
| `personas_selecciones` | 0 | Esqueleto |

**Rutas UI operativas:** `/admin/equipos/*` (lista, detalle, importar,
capitanes), `/admin/padrones/*` (lista, detalle, sync nuevo + legacy),
`/admin/operaciones/scouting/*`.

**Módulo migrado a `modules/equipos/`:** lib/actions.ts, lib/actions/cuerpo-tecnico.ts,
lib/actions/importar.ts, lib/queries.ts, ui/components/ (15 componentes).
Pages permanecen en `app/admin/(modulos)/equipos/` como thin wrappers.

**Server actions:** 16 equipos + 9 padrones + 3 padrones/importar + 2
operaciones + 3 scouting.

**Padrones detalle (Hindu):**

| Padrón | Pipeline | Personas |
|---|---|---|
| Hindu Global | (legacy, sin pipeline) | 2,361 |
| Hindu Futbol Jugadores 2026 | `jugadores_por_equipo` | 162 únicas / 211 asignaciones |
| Hindu Futbol Suscriptores 2026 | `suscriptores_por_equipo` | 51 (Sprint 14e) |

**Módulo Asistencias (Sprint FASE 3.1):**
Módulo migrado a `modules/asistencias/` con module.json, lib/ (types, queries,
actions, auto-poblar, permisos, categorias), ui/ (pantalla-asistencia,
seccion-categoria, fila-persona, sumario-asistencia, label-rol). Page en
`app/admin/(troncal)/operaciones/eventos/[eventoId]/asistencia/`. React Query
con optimistic mutations. RPC `fn_obtener_invitados_evento`.

**Módulo Planificadores (Sprint FASE 4.1 + 4.2):**
Módulo en `modules/planificadores/` con module.json, lib/ (actions, queries,
types, permisos, overlap-detector), ui/ (calendario-mensual, calendario-semanal,
toggle-planificador, modal-detalle-evento, modal-mover-recurrente, warning-overlap).
Dos vistas: mensual (react-big-calendar month + drag-and-drop) y semanal
(week con grilla 6AM-11PM + drag-and-drop + resize). Toggle Mes/Semana en
ambas pantallas. Reutiliza `moverEventoAction` para mover y redimensionar.
Permisos: tenant.admin, planificadores.editor, o roles CT del equipo.
Pages: `/admin/planificadores/mensual`, `/admin/planificadores/semanal`.

**Módulo Entrenamientos (Sprint FASE 4.3):**
Módulo en `modules/entrenamientos/` con module.json, lib/ (types, queries,
actions, permisos), ui/ (pantalla-plan, plan-header, lista-bloques-wrapper,
lista-bloques, bloque-card, modal-agregar-bloque). Plan 1:1 con evento tipo
entrenamiento (UNIQUE on evento_id). Bloques ordenados con drag-and-drop
(@dnd-kit). Catálogo de 20 ejercicios globales (tenant_id NULL) + ejercicios
custom por tenant. Permisos: tenant.admin, entrenamientos.editor, o CT del
equipo (dt, asistente_dt, preparador_fisico). Excepción AP-006: sin entrada
en sidebar, acceso solo desde detalle de evento. Page en
`app/admin/(troncal)/operaciones/eventos/[eventoId]/plan/`. 4 E2E tests.

**Módulo Amistosos (Sprint FASE 4.4):**
Módulo en `modules/amistosos/` con module.json, lib/ (types, queries,
actions, permisos), ui/ (pantalla-amistoso, header-amistoso, seccion-logistica,
seccion-nomina-rival, seccion-plantel-propio). Sin tablas nuevas — logística
en `eventos.metadata.logistica_amistoso` jsonb. Slug 'amistoso' agregado a
`catalogo_tipos_evento`. No CHECK constraint (AP-005 clear). Integra con
módulo nominas_externas para generar link de nómina del rival. Permisos:
tenant.admin o CT del equipo. Excepción AP-006: sin sidebar. Page en
`app/admin/(troncal)/operaciones/eventos/[eventoId]/amistoso/`. 3 E2E tests.

**Módulo Táctico (Sprint FASE 4.5):**
Módulo en `modules/tactica/` con module.json, lib/ (types, formaciones, queries,
actions, permisos), ui/ (pantalla-tactica, editor-tactico, selector-formacion,
cancha-visual, slot-jugador, panel-plantel, modal-asignar-jugador). SVG cancha
vertical con slots posicionados por línea (arquero=amarillo, defensa=azul,
mediocampo=verde, ataque=rojo). 5 formaciones hardcoded (4-4-2, 4-3-3, 4-2-3-1,
3-5-2, 5-3-2). Click-to-assign vía modal. Panel plantel lateral con
disponibles/asignados. Reusa tablas `esquemas_tacticos` y `esquema_posiciones`
existentes — sin tablas nuevas. Solo para eventos tipo partido/amistoso.
Permisos: tenant.admin o CT del equipo. Excepción AP-006: sin sidebar. Page en
`app/admin/(troncal)/operaciones/eventos/[eventoId]/tactica/`. 3 E2E tests.

**Módulo Reservas (Sprint FASE 4.6):**
Módulo en `modules/reservas/` con module.json, lib/ (types, helpers, queries,
actions, permisos), ui/ (pantalla-reservas, tabla-reservas, modal-nueva-reserva,
modal-detalle-reserva, badge-estado). 1 tabla nueva `reservas_canchas` con
UNIQUE(evento_id). Reserva = evento tipo='reserva' + fila en reservas_canchas.
Tarifa calculada al crear: precio_alquiler_hora * duracion_horas (D51). 5 estados
con CHECK constraint. Cliente polimórfico (persona/entidad/externo). Pantalla
/admin/reservas con tabla + filtros cancha/estado + modal crear + modal detalle
con acciones por estado. Sidebar: "Reservas" en sección Operaciones (AP-006 SÍ).
Permisos: tenant.admin o reservas.gestor. 3 E2E tests.

**Módulo Torneos (Sprint FASE 5.1):**
Módulo en `modules/torneos/` con module.json, lib/ (types, formatos,
criterios-desempate, queries, actions, permisos), ui/ (pantalla-listado,
tabla-torneos, filtros-torneos, badge-estado-torneo, modal-nuevo-torneo,
pantalla-detalle, detalle-torneo-client, tab-datos-generales, tab-categorias,
tab-equipos-inscriptos, modal-agregar-categoria, modal-agregar-equipo).
3 tablas nuevas (torneos, torneo_categorias, torneo_equipos) con RLS.
6 formatos (liga, eliminacion, grupos_playoff, suizo, triangular, cuadrangular).
5 estados (planificado, inscripcion, en_curso, finalizado, cancelado).
Equipos polimórficos (propio con equipo_id o externo con nombre libre).
Wizard 3 pasos para crear torneo. Detalle con 3 tabs (datos/categorías/equipos).
partidos_detalle extendida con torneo_id + categoria_id (dual-read, torneo_slug
deprecated). Migration retroactiva no-op (todos 98 partidos con slug NULL).
Sidebar: nueva sección "Competencias > Torneos" en Club Deportivo.
Atributos torneos.admin, torneos.cargador, torneos.inscriptor. RFC-002.
Pages: `/admin/competencias/torneos`, `/admin/competencias/torneos/[id]`,
`/admin/competencias/torneos/[id]/import`, `/admin/competencias/inscripciones`.
Sprint 5.2: Inscripciones CRUD para torneos externos. CSV importer (papaparse)
para fixture y resultados con validación por fila. equipos_competencias extendida
con torneo_id FK. Sidebar: Competencias > Inscripciones.
7 E2E tests (4 Sprint 5.1 + 3 Sprint 5.2).

**Gaps:** scouting con uso real (postergado), fixture automático (Sprint 5.3),
tabla de posiciones (Sprint 5.4), carga de resultados (Sprint 5.5).

---

### 2.5 Módulos transversales

**RRHH:**

| Tabla | Rows | Estado |
|---|---|---|
| `rrhh_contratos` | 0 | UI esqueleto, Sprint 15c |
| `rrhh_liquidaciones` | 0 | UI esqueleto, Sprint 15c |
| `personas_datos_laborales` | 0 | Tab en ficha persona |

Rutas: `/admin/rrhh/contratos`, `/admin/rrhh/liquidaciones`.

**Salud / Datos sensibles personales:**

| Tabla | Rows | Estado |
|---|---|---|
| `personas_datos_medicos` | 0 | Esqueleto, módulo activado en Hindu |
| `personas_obra_social` | 0 | Esqueleto |
| `personas_documentos_medicos` | 0 | Esqueleto |
| `personas_datos_alimentarios` | 0 | Esqueleto |
| `personas_contactos_emergencia` | 0 | Módulo activado |
| `personas_autorizaciones` | 0 | Módulo activado |
| `personas_credenciales_acceso` | 0 | Módulo activado (acceso) |
| `personas_idiomas` | 0 | Esqueleto |
| `personas_talles` | 0 | Esqueleto |
| `personas_vehiculos` | 0 | Módulo activado (vehículos) |
| `personas_datos_economicos` | 0 | Esqueleto |
| `personas_documentos_identidad` | 2 | Documentos cargados manualmente |

---

### 2.6 Plataforma

**Multi-tenant + auth:**

| Tabla | Rows | Estado |
|---|---|---|
| `tenants` | 1 | Hindu |
| `tenant_modulos` | 35+ | Módulos activados en Hindu |
| `tenant_config_publica` | 1 | Branding Hindu |
| `catalogo_modulos` | 49 | Catálogo completo (incl. torneos) |
| `sedes` | 2 | Hindu tiene 2 sedes |
| `api_keys` | 0 | Sin keys generadas |
| `api_logs` | 0 | Sin uso de API externa |
| `user_vistas` | 0 | Sin uso |
| `audit_log` | 46,175 | Activamente registrando |

**Importadores (mecanismo genérico):**

| Tabla | Rows | Estado |
|---|---|---|
| `import_pipelines` | 3 | `jugadores_por_equipo`, `suscriptores_por_equipo`, `padron_socios` |
| `import_runs` | 2 | Runs aplicados |
| `import_rows` | 281 | Filas procesadas históricamente |
| `import_field_conflicts` | 0 | Sin conflictos pendientes |

**Funciones SQL custom críticas:**
- `match_persona_fuzzy(tenant_id, apellido, nombre, threshold)` — matching por tokens
- `normalize_name(text)` — normalización (lowercase, unaccent, sin apóstrofes)
- `resolver_o_crear_equipo(tenant_id, nombre, disciplina_slug)`
- Funciones de audit log
- Funciones de validación de RLS

**API REST v1:** 5 endpoints (`/api/v1/personas` GET+POST, `/api/v1/personas/[id]`
GET+PATCH, `/api/v1/equipos` GET). Sin uso externo real.

**Crons:** 4 (`dispatch-vencimientos` diario 9AM, `cleanup-api-logs`
domingo 3AM, `cleanup-notificaciones` diario, `calcular-canon-mensual`
dia 6 de cada mes 8AM). `CRON_SECRET` configurada en Vercel (verificada Sprint 2.4-FIX).

**Legacy a deprecar (Sprint 14d):**
- `padron_syncs` (1 row)
- `padron_sync_diffs` (2,361 rows)
- `/app/admin/padrones/sincronizar/*`
- `/lib/padron-sync/*`
- 10 VIEWs `fin_*`

---

## 3. Datos cargados en Hindu Club (tenant piloto)

**Tenant ID:** `11111111-1111-1111-1111-111111111111`

**Estructura:**
- 2 sedes
- 35+ módulos activados
- Branding básico configurado

**Personas:** 2,390
- Atributos activos en uso: jugador (211), socio (alta cantidad), suscriptor (51),
  tenant.staff, tenant.admin_padron, sistema.admin

**Padrones:**
- Hindu Global: 2,361
- Hindu Futbol Jugadores 2026: 162 únicas / 211 asignaciones a equipos
- Hindu Futbol Suscriptores 2026: 51 (Sprint 14e aplicado)
- 1 padrón inactivo (residual)

**Equipos:** 7 (fútbol) con 211 jugadores cargados
- FACCMA-PRIMERA (38)
- FACCMA-OPEN 28 OPEN (24)
- FACCMA-OPEN 28 JUNIOR (30)
- AIF-SELECCION (31)
- AIF-JUVENILES (30)
- AIF-SENIOR (28, fusion)
- AIF-SUPER MAXI (30, fusion)

**Finanzas Hindu:**
- Plan de cuentas: 104 cuentas (template estándar)
- Período contable abierto
- 3 cajas configuradas
- Config financiera completa
- 1 producto (Fondo Fútbol 2026), 1 plan, 51 suscripciones activas
- 51 cuotas vencidas por $510.000 (período 2026-05)
- 7 centros de costo, 3 entidades (FACCMA, AIF, +1)

**Entidades:** 3 (FACCMA, AIF, una más residual)

---

## 4. Catálogos

### Globales (compartidos por todos los tenants)

| Catálogo | Items | Editable desde UI |
|---|---|---|
| `catalogo_modulos` | 48 | No (solo admin sistema) |
| `catalogo_atributos` | 61 | Sí |
| `catalogo_disciplinas` | 17 | Sí |
| `catalogo_tipos_documento` | 8 | Sí |
| `catalogo_tipos_vinculo` | 23 | Sí |
| `catalogo_motivos_baja` | 10 | Sí |
| `catalogo_estados_persona` | 8 | Sí |
| `catalogo_estados_padron` | 4 | Sí |
| `catalogo_tipos_socio` | 7 | Sí |
| `catalogo_roles_equipo` | 13 | Sí |
| `catalogo_roles_laborales` | 6 | Sí |
| `catalogo_niveles_competencia` | 6 | Sí |
| `catalogo_areas_trabajo` | 10 | Sí |
| `catalogo_puestos` | 10 | Sí |
| `catalogo_obras_sociales` | 16 | Sí |
| `catalogo_tipos_evento` | 23 | Indirecto |
| `catalogo_tipos_estudio` | 14 | Sí |
| `catalogo_tipos_autorizacion` | 11 | Indirecto |
| `catalogo_companias_seguro` | 11 | Indirecto |
| `catalogo_tipos_vehiculo` | 10 | Indirecto |
| `catalogo_tipos_talle` | 20 | Indirecto |
| `catalogo_categorias_movimiento` | 21 | Indirecto |
| `catalogo_ejercicios` | 20 | No (global seed, tenant custom via code) |
| `catalogo_planes_comerciales` | 3 | Sí |

**Sin UI CRUD (gaps detectados):** `tipos_vehiculo`, `companias_seguro`,
`tipos_evento_personal`, `indumentaria` (referenciado pero sin tabla).

### Por tenant

`plan_cuentas`, `centros_costo`, `medios_pago`, `tipos_comprobante`, `cajas`,
`config_financiera`, `periodos_contables`, `cotizaciones` — todos
inicializados en Hindu.

---

## 5. Integraciones

| Integración | Estado | Próximo sprint |
|---|---|---|
| API REST v1 | Operativa, sin uso externo real | — |
| Resend (email) | Mock-first (ADR-035). `RESEND_API_KEY` no configurada | FASE 16 |
| MercadoPago | Mock-first (ADR-035). Sin credenciales empresa | FASE 16 |
| Zoho CRM | Catalogada (`conector_zoho_crm`), no construida | Q3+ |
| MCP Server | Catalogado (`mcp_server`), no construido | Q3+ |
| Webhooks salientes | No construidos | Q3+ |
| Kontrol.ar | Futuro hub de agencia | 2027+ |

---

## 6. Deuda técnica activa

| Item | Severidad | Sprint planeado |
|---|---|---|
| ~~Documentación viva no existe~~ | ~~Alta~~ | ✅ Sprint 14d |
| ~~Legacy `padron_syncs` activo~~ | ~~Alta~~ | ✅ Sprint 14d |
| ~~10 VIEWs `fin_*` sin uso~~ | ~~Media~~ | ✅ Sprint 14d |
| ~~3 atributos duplicados~~ | ~~Media~~ | ✅ Sprint 14d |
| `RESEND_API_KEY` no configurada en Vercel | Alta | FASE 16 (ADR-035, mock-first) |
| ~~`CRON_SECRET` no configurada en Vercel (crons expuestos)~~ | ~~Alta~~ | ✅ Sprint FASE 2.4-FIX (verificado via 401 en producción) |
| `lib/imports/actions.ts` 530+ líneas monolíticas | Media | 17a |
| 4 catálogos sin UI CRUD | Media | Backlog menor |
| `padron_socios` pipeline no documentado en specs previos | Baja | 14d (consolidar) |
| 53 atributos en catálogo sin uso real | Baja | Q3 — cleanup |
| `personas` 103 columnas (mezcla CRM/salud/deportivo, 3 migradas en 14k.6) | Media | 2027 (al separar troncal) |
| `D3` capa de servicios pura no implementada | Baja | Postergado |
| `D6` `module_events` no implementado | Baja | Postergado |
| ~~0 tests automatizados~~ | ~~Media~~ | ✅ Sprint 15c: 27 E2E specs (26 pass, 1 skip) |
| 1 TODO en código (`comunicaciones/_actions.ts:216`) | Baja | FASE 2.2 (ResendAdapter) |
| Permission slugs underscore en 3 módulos (salud, concesiones, utileria). Canonizado en ADR-036 | Media | FASE 15 (audit unificado) |
| Naming inconsistente en com_jobs_log (finished_at vs ended_at, errores vs error_message, personas_encontradas vs total_personas_evaluadas) | Baja | FASE 15 |
| Persona E2E aparece intermitentemente soft-deleted entre sprints. Causa raíz no identificada. Workaround: restore manual cuando ocurre | Baja | Investigar cuando reaparezca |
| ~~Métricas de DB en CURRENT-STATE.md históricamente desincronizadas (anotaba 117 tablas, son 145)~~ | ~~Baja~~ | ✅ Sprint DOCS-1 (sincronizado a valores reales) |
| com_jobs_log acumula rows de E2E sin cleanup. Cada ejecución de E2E del 2.4-FIX y 2.5 deja 1-3 rows que nunca se borran | Baja | FASE 15 (agregar DELETE de com_jobs_log al try/finally de los E2E) |
| Dedup de 7 días en triggers puede colisionar con tests E2E en parallel workers. Mitigación actual: pre-cleanup (commit a3f00ed). Riesgo teórico en prod si E2E corre durante ventana de cron | Baja | FASE 15 (evaluar excluir envíos E2E del dedup por flag en metadata) |

---

## 7. Sprints completados (cronológico)

Historial referenciado en commits del repo. Listado resumido:

- **Sprints anteriores a 14a** (consolidados): infraestructura base,
  multi-tenant, RLS, módulos, personas, equipos, finanzas esqueleto, UI base.
- **14a.7, 14a.8, 14a.9** — Padrones (cleanup, fusión, errores).
- **14c.0** — Plataforma de imports declarativa (tablas, parsers,
  match fuzzy).
- **14c.0.1** — Fix matching: tokenización + apóstrofes.
- **14c.1** — Pipeline `jugadores_por_equipo`.
- **14c.1.1** — Bug: DNI nullable.
- **14c.1.2** — Bug: split apellido compuesto.
- **14c.1.3** — Bug B: equipos pendientes en cadena.
- **14c.2** — Pipeline `suscriptores_por_equipo` (setup; E2E pendiente).
- **14d** — Living docs system (12 docs actualizados/creados).
- **14d.5** — Design Tokens System: `/styles/tokens.css` como fuente
  única de tokens, refactor de ~80 archivos para eliminar hex codes y
  color names hardcodeados, branding runtime via CSS vars (ADR-018).
- **14e** — Suscripciones: tabla `suscripciones` con RLS + sync trigger
  `sync_atributo_suscriptor`, producto + plan "Fondo Fútbol 2026",
  acción executor `crear_suscripcion`, 51 suscripciones activas,
  tab "Suscripciones" en ficha persona, página global
  `/admin/finanzas/suscripciones` (ADR-019).
- **14f** — Emisión de cuotas: `fn_emitir_cuotas_masivas`, 51 cuotas
  emitidas periodo 2026-05, UI emisión masiva + anulación (ADR-020).
- **14g** — Cobranza manual: `fn_cobrar_cuota`, `fn_anular_pago`,
  tabla `cuotas_pagos`, UI de cobro + anulación (ADR-021).
- **14h** — Centros de costo: CRUD completo, 7 centros cargados en Hindu,
  vista stats, asignación a movimientos.
- **14i** — Vista Global de Salud: 7 tabs read-only (lesiones, datos
  médicos, obra social, autorizaciones, emergencia, documentos médicos,
  alimentación), permisos por atributo, audit log (ADR-022).
- **14j** — Utilería del club: inventario, kits, solicitudes con flujo
  aprobación, cargos de reposición prorrateados, plantel snapshot,
  storage privado (ADR-023).
- **14k.5** — Cuerpo Técnico: refactor permisos, roles desde
  `personas_equipos.rol_equipo_slug` como fuente única (ADR-024).
- **14k** — Notificaciones in-app: tabla `notificaciones`, bell icon
  con badge, dropdown, pantalla completa, helper `crearNotificacion`,
  23 tipos, dedup 24h, cron limpieza, hooks en cuotas y suscripciones.
- **14j.2** — Concesiones genéricas: 6 tablas, 4 funciones SQL, 2 vistas,
  4 pantallas (listado, detalle 6 tabs, POS tablet, reportes), cron
  canon mensual, 4 tipos notificación, aislamiento financiero (ADR-025).
- **14k.6** — Limpieza arquitectónica pre-FASE 2: ADR-026 disciplinas como
  tabla dedicada `personas_disciplinas` (2,111 filas migradas), columna `capa`
  en `catalogo_atributos` (7 capas, 64 atributos clasificados), DROP de 3
  columnas legacy de `personas`, vista `v_personas_disciplinas_vigentes`,
  nuevo componente `SeccionDisciplinas` en ficha persona, refactor de ~12
  archivos para eliminar referencias a columnas viejas.
- **14k.7** — Hotfixes FASE 1 + UI completion: ErrorBoundary en bell icon
  (degradación graceful), concesiones crear con fecha inicio, cuerpo técnico
  CRUD global (asociar persona a equipo + desvincular), vista salud con
  links a personas y acción "Levantar caso", ARCHITECTURE.md §10 principio
  migraciones destructivas, ADR-027 cuerpo técnico ligado a competencia
  (postergado FASE 5).
- **14k.8** — Estabilización: fix utileria 'use server' export, concesiones
  silent submit, salud persona search, migración getSession→getUser (25
  ocurrencias en 17 archivos), ADRs 028-030, E2E checklist template.
- **14k.9** — Cierre real FASE 1: fix concesiones hydration, fix utilería
  hydration (ClientOnly wrapper), fix salud completo (columnas incorrectas
  en 7 tabs), ADR-034 (descripcion en lesiones).
- **15a** — Foundation Declarativa: ADRs 031-033 (arquitectura 3 capas,
  visión plataforma, E2E tests obligatorios), 18 manifiestos module.json,
  catalogo_modulos extendido con incluye_modulos/portable/replaceable,
  11 módulos nuevos catalogados, vertical club_deportivo (17 módulos),
  schema audit automatizado, ESLint rule no-cross-module-imports,
  todos los MDs actualizados. Tag `v0.2.0-foundation-declared`.
- **15b** — Migración física de módulos: 18 módulos movidos a
  `modules/` con estructura canónica (module.json, lib/, ui/),
  exports unificados, sub-rutas migradas. Tag `v0.3.0-modules-physical`.
- **15c** — E2E Tests Verdes: fix playwright.config.ts (sin webServer),
  usuario E2E dedicado (e2e-test@levywald.com), 16 tests pasan + 1 skip,
  test:e2e devuelto a validate:all, docs/E2E-TESTING.md.
  Tag `v0.3.1-e2e-greenlit`.
- **FASE 2.1** — Motor de Comunicación (Mock-First): adapter pattern
  (ComunicacionAdapter + MockAdapter + factory), renderTemplate() mustache,
  enviarComunicacion() public API, page con 2 tabs (Plantillas + Envios),
  probarPlantilla() wired to adapter, fix envios sub-page FK columns,
  module.json v2 con exports_api.
- **FASE 2.2** — Editor CRUD de Plantillas: PlantillaEditorForm con preview
  en tiempo real, auto-detección de variables {{mustache}}, permisos por
  atributo (comunicaciones.admin/editor), protección plantillas del sistema,
  server actions (crear, actualizar, softDelete, duplicar, toggleActiva),
  parser de variables con sincronización automática, 7 E2E tests.
- **FASE 2.3** — Envíos Masivos con Segmentación MVP: wizard de envío masivo
  (plantilla + canal + segmento), segmentos todos_activos y equipo, preview
  con conteo de destinatarios, bulk insert en batches de 500 vía
  MockAdapter.enviarMasivo(), lotes agrupados por metadata.lote_id, tab
  "Envíos masivos" con historial, detalle de lote, API route preview-segmento,
  11 E2E tests comunicaciones.
- **Sprint FASE 2.4** — Cron de vencimientos + recordatorios automáticos.
  3 cron jobs (apto_vence_7d, cuota_vence_7d, cuota_vencida_7d) con
  service role, dedup 7d via columnas nativas origen_modulo_slug +
  origen_entidad_id, segmento personas_ids_directos, tabla com_jobs_log,
  tab "Automatizaciones". Tag v0.7.0. 30/1/0 E2E (interim).
- **Sprint FASE 2.4-FIX** — Corrección semántica + canonización.
  Default 'comunicaciones' eliminado en motor de envíos, dot-notation
  en permission checks (módulo comunicaciones), E2E real con fixture +
  cleanup. Tag v0.7.1. 31/1/0 E2E.
- **Sprint FASE 2.5** — Preferencias de comunicación por persona.
  Activación de tabla personas_preferencias_comunicacion existente +
  categoria_contenido en com_plantillas (35 plantillas activas
  categorizadas: 14 transaccional + 21 eventos_club) + función RPC
  filtrar_personas_por_preferencias_comunicacion + UI admin
  /personas/[id] tab Comunicaciones. Tag v0.8.0.
  Cierra FASE 2 al 100%. 33/1/0 E2E.
- **Sprint FASE 3.1** — Control de asistencias operativo (mobile).
  Tabla `evento_invitados` polymorphic con CHECK exactly_one_not_null,
  reclasificación de 10 roles staff → cuerpo_tecnico(6) + comision_delegados(4),
  `evento_asistencias` extendida a 6 estados + FK a evento_invitados,
  RPC `fn_obtener_invitados_evento`, auto-poblado lazy desde plantel,
  verificación permisos (admin/CT), React Query con optimistic mutations,
  UI mobile-first (sumario 6 chips + secciones colapsables + botones touch),
  módulo activado en catálogo + tenant Hindu. 2 E2E tests.
  Tag v0.9.0. 35/1/0 E2E.
- **Sprint DOCS-5** — Blindar envelope contra falsos reportes de
  produccion. Canonizacion en 4 docs vivos (CLAUDE.md, PROMPT-ENVELOPE.md,
  SYSTEM-PROMPTS.md, DECISIONS.md) de la regla "verificacion de
  produccion via MCP real, nunca via CLI local". Origen: patron observado
  2 veces (Sprint 2.4-FIX y Sprint 3.1) donde Code reporto "Vercel
  ERROR" sobre deploys que estaban READY. Nueva regla R-PE10 + ADR-039
  formalizan la solucion estructural.
- **Sprint 3.1 — fixes post-E2E (commits 917476e + b2d8147):** durante
  validación E2E contra producción se detectaron 2 bugs reales: filtro
  `deleted_at` en `personas_atributos` (columna inexistente — bug de
  permisos silencioso) y `upsert + onConflict` con partial unique index
  (500 server error en auto-poblado). Ambos fixes aplicados, E2E
  re-corridos contra prod, 3 tests passed. Canonizados como AP-001 y
  AP-002 en RUNBOOK.
- **Sprint DOCS-6** — Canonización aprendizajes Sprint 3.1. Agregado al
  RUNBOOK: sección "Niveles de verificación de un sprint" (4 niveles
  acumulativos: build → deploy → funcional MCP → E2E real). Sección
  "Anti-patrones detectados en producción" iniciada con AP-001 (asumir
  deleted_at) y AP-002 (upsert con partial unique index). Catálogo
  acumulativo para sprints futuros.
- **Sprint DOCS-1** — Sincronización del sistema documental +
  canonización post-FASE 2. ADRs 036, 037, 038 canonizados. WORKFLOW.md
  eliminado. Sistema documental alineado con realidad de DB + repo.
  Tag v0.8.1.
- **Sprint DOCS-2** — Manual operativo + templates de post-mortem y RFC.
  Creados docs/RUNBOOK.md (20 escenarios), docs/POST-MORTEM-TEMPLATE.md
  y docs/RFC-TEMPLATE.md. Lista de docs vivos actualizada de 11 a 14.
  Tag v0.8.2.
- **Sprint DOCS-3** — System Prompt Specs unificados.
  Creado docs/SYSTEM-PROMPTS.md con specs formales de Opus (Arquitecto)
  y Code (Implementador), reglas de seguridad inviolables S-1 a S-7
  aplicables a todo agente IA, roadmap de 8 agentes futuros de FASE 9
  con template canónico de role spec, protocolo de testeo y regresión
  de system prompts. Lista de docs vivos actualizada de 14 a 15.
  Tag v0.8.3.
- **Sprint DOCS-4** — System Design unificado.
  Creado docs/SYSTEM-DESIGN.md con vista completa del sistema: 14 secciones,
  8 diagramas Mermaid (componentes, capas, auth, envío masivo, cron, import,
  cobranza), multi-tenancy, dependencias externas, seguridad, performance,
  escalabilidad y deuda arquitectónica. Lista de docs vivos de 15 a 16.
  Tag v0.8.4.

- **Sprint FASE 4.3** — Organizador de entrenamientos.
  Módulo `entrenamientos` con 3 tablas (catalogo_ejercicios, entrenamiento_planes,
  entrenamiento_plan_bloques), 20 ejercicios globales seed, plan 1:1 con evento,
  bloques ordenados con @dnd-kit drag-and-drop, catálogo + libre, permisos CT.
  Excepción AP-006: sin sidebar, acceso desde detalle de evento.
  Tag v0.16.0. 59/1/0 E2E.
- **Sprint FASE 4.4** — Organizador de amistosos.
  Módulo `amistosos` sin tablas nuevas. Logística en eventos.metadata jsonb.
  Slug 'amistoso' en catalogo_tipos_evento. Integración con nominas_externas
  para nómina del rival. 4 secciones: header, logística, nómina rival, plantel.
  AP-005 clear (no CHECK constraint). AP-006 excepción documentada.
  Tag v0.17.0. 63 E2E (58 pass, 1 skip, 4 flaky pre-existing).
- **Sprint FASE 4.5** — Organizador táctico.
  Módulo `tactica` sin tablas nuevas. SVG cancha visual con 5 formaciones
  hardcoded (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2), slots por línea con
  colores, selector de formación, modal de asignación click-to-assign, panel
  plantel lateral. Reusa esquemas_tacticos + esquema_posiciones existentes.
  Solo para eventos tipo partido/amistoso. AP-006 excepción documentada.
  Tag v0.18.0. 66 E2E (61 pass, 1 skip, 4 flaky pre-existing).
- **Sprint FASE 4.6** — Reservas de canchas. **FASE 4 CERRADA.**
  Módulo `reservas` con 1 tabla nueva (reservas_canchas). Reserva = evento
  tipo='reserva' + fila con tarifa calculada (D51). 5 estados con CHECK.
  Cliente polimórfico (persona/entidad/externo). Pantalla /admin/reservas
  con tabla + filtros + modales crear/detalle. Sidebar con "Reservas" en
  Operaciones (AP-006 SÍ, tiene pantalla propia). Atributo reservas.gestor.
  Tag v0.19.0. 69 E2E (65 pass, 1 skip, 3 flaky pre-existing).
- **Sprint FASE 5.1** — Modelo de torneos + creador interno.
  Módulo `torneos` con 3 tablas nuevas (torneos, torneo_categorias,
  torneo_equipos) + extensión partidos_detalle (torneo_id, categoria_id).
  6 formatos con CHECK. 5 estados. Equipos polimórficos (propio/externo).
  Migration retroactiva no-op (98 partidos con torneo_slug NULL).
  Wizard 3 pasos, detalle 3 tabs. Sidebar "Competencias > Torneos".
  Atributos torneos.admin + torneos.cargador. RFC-002.
  Tag v0.20.0. 73 E2E (69 pass, 1 skip, 3 flaky pre-existing).
- **Sprint FASE 5.2** — Inscripciones en torneos externos + CSV import.
  equipos_competencias extendida con torneo_id FK. Atributo torneos.inscriptor.
  Inscripciones CRUD (/admin/competencias/inscripciones). CSV importer
  (papaparse) para fixture y resultados con validación por fila y error
  reporting. Pantalla import en /admin/competencias/torneos/[id]/import.
  Sidebar: Inscripciones bajo Competencias.
  Tag v0.21.0. 76 E2E (72 pass, 1 skip, 3 flaky pre-existing).

---

## 8. Cómo Code actualiza este documento

Al cerrar cada sprint, Code:

1. Agrega/modifica filas en las tablas relevantes según los cambios:
   - Si creó tabla → agregarla en su capa con row count, estado.
   - Si modificó datos significativos en Hindu → actualizar §3.
   - Si resolvió deuda técnica → mover el item de §6 a §7 con sprint cerrado.
   - Si descubrió deuda nueva → agregar en §6.
2. Actualiza §0 Snapshot ejecutivo: sprint completado, próximo sprint,
   estado general.
3. Actualiza §1 Métricas globales si los números cambiaron.
4. Actualiza §7 Sprints completados con entrada del sprint cerrado.
5. Actualiza la fecha de "Última actualización" al inicio del doc.

**Code NO modifica §8 (esta sección) ni introduce nuevas secciones top-level
sin aprobación del arquitecto.**

Cualquier inconsistencia que detecte entre la realidad y este documento debe
ser corregida o reportada al arquitecto antes de cerrar sprint.

---

## 9. Convenciones de este documento

- **Capa:** siempre etiquetada (Troncal CRM/ERP/PIM, Módulo, Plataforma).
  ADR-031: 3 capas (Troncal, Módulos, Verticales como presets).
- **Estado de tabla:** rows reales en DB del tenant Hindu (no estimaciones).
- **Estado de UI:** "operativa" (funciona y se usa), "funcional sin uso real"
  (existe pero no se ejercita), "esqueleto" (placeholder, sin lógica
  completa), "pendiente" (no existe).
- **Decimales en counts:** usar números enteros exactos, no aproximaciones.
- **Verificación:** Code valida por SQL antes de escribir números acá.
