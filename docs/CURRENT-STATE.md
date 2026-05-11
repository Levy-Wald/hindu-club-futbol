# ClubCore — Current State

> Inventario real del proyecto al cierre del último sprint. Source of truth
> para saber qué existe, qué está operativo, qué está roto, qué falta.
>
> **Code mantiene este documento.** Lo actualiza al final de cada sprint
> según R-PE6 de `PROMPT-ENVELOPE.md`.
>
> Última actualización: 11 de mayo de 2026 — Sprint 14k.8 completado.
> Sprints 14d a 14k.8 cerrados. FASE 1 oficialmente cerrada.

---

## 0. Snapshot ejecutivo

**Estado general:** FASE 1 cerrada. Plataforma con base operativa completa
para Hindu Club Futbol: suscripciones, cuotas, cobranza, centros de costo,
salud, utileria, cuerpo tecnico, notificaciones in-app, concesiones.

**Ultimo sprint cerrado:** **14k.8** — Estabilización final FASE 1.
Fix utilería 'use server' export, concesiones silent submit, salud persona
search, migración getSession→getUser (seguridad), ADRs 028-030, E2E checklist
template. FASE 1 oficialmente cerrada con producción validada end-to-end.

**Deadline operativo:** 1 jun 2026 (prueba interna Hindu) · 1 jul 2026
(full operativo + demo-ready).

**Bloqueantes:** ninguno crítico hoy.

---

## 1. Métricas globales

| Métrica | Valor |
|---|---|
| Tablas en `public` | 116 |
| Tablas con RLS habilitada | 116 (100%) |
| RLS policies | 355 |
| Funciones custom (`pg_proc` en public) | 126 |
| Triggers | 97 |
| VIEWs | 28 |
| Storage buckets | 6 (incl. private-utileria-fotos) |
| Migrations consolidadas | 1 (init) + incrementales por sprint |
| Páginas Next.js | 64 (7 públicas + 57 admin) |
| API routes | 12 (5 endpoints v1 + 3 internos + 4 crons) |
| Server actions | ~160 en 26 archivos |
| Componentes custom (no shadcn) | ~115 |
| Tests | 0 |
| Tenants registrados | 1 (Hindu Club) |
| Personas (Hindu) | 2,389 |
| Equipos (Hindu) | 7 |
| Atributos en catálogo | 64 (con columna `capa` clasificatoria) |
| Tipos de notificación catalogados | 23 |
| Módulos catalogados | 36 |
| Módulos activos en Hindu | 25 |

---

## 2. Estado por capa

### 2.1 Troncal — CRM

**Estado general:** Operativo. Núcleo del sistema, sin datos faltantes
significativos.

**Tablas (datos en Hindu):**

| Tabla | Rows | Notas |
|---|---|---|
| `personas` | 2,389 | 103 columnas (3 columnas de disciplina migradas a `personas_disciplinas` en Sprint 14k.6) |
| `personas_atributos` | ~2,620 | 9 atributos activos en uso (incl. suscriptor x51) |
| `personas_padrones` | 2,561 | 4 padrones |
| `personas_vinculos` | 4 | Familiares/tutores cargados manualmente |
| `personas_documentos_identidad` | 2 | Sub-uso |
| `personas_preferencias_comunicacion` | 0 | Esqueleto |
| `entidades` | 3 | Cargadas manualmente (FACCMA, AIF, etc.) |
| `entidades_representantes` | 0 | Esqueleto |
| `pre_inscripciones` | 0 | UI funcional, sin uso real |
| `solicitudes` | 0 | UI funcional, sin uso real |
| `com_plantillas` | 18 | Plantillas base cargadas |
| `com_envios` | 0 | Sin envíos reales (Resend pendiente) |
| `com_mensajes` | 0 | Sin envíos reales |

**Rutas UI operativas:** `/admin/personas/*` (listado, ficha, importar,
historial), `/admin/externos/*`, `/admin/comunicaciones/*`,
`/admin/pre-inscripciones`.

**Server actions:** 13 personas + 6 entidades + 9 comunicaciones + 3
pre-inscripciones.

**Gaps:** envíos reales (Sprint 15a — Resend), pre-inscripciones públicas
(postergado).

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

### 2.4 Vertical — Club Deportivo

**Estado general:** Núcleo operativo en Hindu. Componente más desarrollado
del producto.

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
| `esquemas_tacticos` | 0 | Esqueleto |
| `esquema_posiciones` | 0 | Esqueleto |
| `partidos_detalle` | 0 | Esqueleto |
| `scouting_fichas` | 0 | UI funcional, sin uso |
| `eventos` | 0 | Esqueleto |
| `evento_asistencias` | 0 | Esqueleto |
| `personas_historial_categoria_deportiva` | 0 | Esqueleto |
| `personas_historial_padron` | 0 | Esqueleto |
| `personas_lesiones` | 0 | Esqueleto |
| `personas_clubes_anteriores` | 0 | Esqueleto |
| `personas_premios_logros` | 0 | Esqueleto |
| `personas_selecciones` | 0 | Esqueleto |

**Rutas UI operativas:** `/admin/equipos/*` (lista, detalle, importar,
capitanes), `/admin/padrones/*` (lista, detalle, sync nuevo + legacy),
`/admin/operaciones/scouting/*`.

**Server actions:** 16 equipos + 9 padrones + 3 padrones/importar + 2
operaciones + 3 scouting.

**Padrones detalle (Hindu):**

| Padrón | Pipeline | Personas |
|---|---|---|
| Hindu Global | (legacy, sin pipeline) | 2,361 |
| Hindu Futbol Jugadores 2026 | `jugadores_por_equipo` | 162 únicas / 211 asignaciones |
| Hindu Futbol Suscriptores 2026 | `suscriptores_por_equipo` | 51 (Sprint 14e) |

**Gaps:** eventos/asistencias operativos (postergado), scouting con uso real
(postergado), partidos cargados (postergado).

---

### 2.5 Módulos paralelos

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
| `tenant_modulos` | 25 | Módulos activados en Hindu |
| `tenant_config_publica` | 1 | Branding Hindu |
| `catalogo_modulos` | 36 | Catálogo completo |
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

**Crons:** 2 (`dispatch-vencimientos` diario 9AM, `cleanup-api-logs`
domingo 3AM). `CRON_SECRET` pendiente de configurar en Vercel.

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
- 17 módulos activados
- Branding básico configurado

**Personas:** 2,389
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
| `catalogo_modulos` | 34 | No (solo admin sistema) |
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
| Resend (email) | No configurada (`RESEND_API_KEY` falta) | 15a |
| MercadoPago | No integrada | 15d |
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
| `RESEND_API_KEY` no configurada en Vercel | Alta | 15a |
| `CRON_SECRET` no configurada en Vercel (crons expuestos) | Alta | 15a o antes |
| `lib/imports/actions.ts` 530+ líneas monolíticas | Media | 17a |
| 4 catálogos sin UI CRUD | Media | Backlog menor |
| `padron_socios` pipeline no documentado en specs previos | Baja | 14d (consolidar) |
| 53 atributos en catálogo sin uso real | Baja | Q3 — cleanup |
| `personas` 103 columnas (mezcla CRM/salud/deportivo, 3 migradas en 14k.6) | Media | 2027 (al separar troncal) |
| `D3` capa de servicios pura no implementada | Baja | Postergado |
| `D6` `module_events` no implementado | Baja | Postergado |
| 0 tests automatizados | Media | Sprint 17c |
| 1 TODO en código (`comunicaciones/_actions.ts:216`) | Baja | 15a (resolverá al integrar Resend) |

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

- **Capa:** siempre etiquetada (Troncal CRM/ERP/PIM, Vertical Club Deportivo,
  Módulo paralelo, Plataforma).
- **Estado de tabla:** rows reales en DB del tenant Hindu (no estimaciones).
- **Estado de UI:** "operativa" (funciona y se usa), "funcional sin uso real"
  (existe pero no se ejercita), "esqueleto" (placeholder, sin lógica
  completa), "pendiente" (no existe).
- **Decimales en counts:** usar números enteros exactos, no aproximaciones.
- **Verificación:** Code valida por SQL antes de escribir números acá.
