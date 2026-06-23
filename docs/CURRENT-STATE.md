# CURRENT-STATE — Estado vivo del proyecto SaaS Empresarial

**Última actualización**: 2026-06-23
**Sesión que la generó**: Reconciliación Zoho ↔ doc — reapertura F1.4 padre + confirmación de cierres (Code). Cierre previo: F1.5 + F1.6 + F1.8 (01-jun)
**Fuente de verdad**: este archivo. Drive es espejo de referencia (lo sincroniza Opus).

> Este archivo se sobreescribe en cada cierre de sprint. Para histórico ver `docs/handoffs/` o Drive `_Cierre Ejecutivo/HANDOFF-YYYY-MM-DD`.

---

## 1. Snapshot ejecutivo

| Indicador | Valor |
|---|---|
| Tag git actual | `v0.45.0-compras-mvp` (F1.14 — Compras MVP). Previo: `v0.44.0-proveedores-ui`, `v0.43.3-tier2-rls-dataholes`, `v0.43.2-tier2-views-rls`, `v0.43.1-comunicaciones-cierre`, `v0.43.0-tutores`, serie F1.4 v0.42.x, serie F1.7 v0.41.x |
| F1.13 Proveedores UI (23-jun) | **DONE técnico (90%), esperando smoke.** Gestor `/admin/proveedores` (un proveedor = entidad tipo='proveedor'; reutiliza entidades + cuentas_corrientes + producto_proveedores). Lista con saldo CC + #productos, alta/edición/baja, ficha con tabs Info/Cuenta corriente/Productos/Compras (ahora lista OCs reales). Sidebar data-driven completado. SE1-T18 → 90%. |
| F1.14 Compras MVP (23-jun) | **DONE técnico (90%), esperando smoke.** Ciclo `solicitud → OC → recepción → factura` en `/admin/compras`. 6 tablas nuevas (compras_solicitudes/ordenes_compra/oc_items/compras_recepciones + items), RLS tenant, numero correlativo por secuencia, subtotal generado. Recepción parcial/total recalcula estado de la OC. Sin aprobaciones multinivel (MVP). Posteo a stock = diferido a F6 (PIM). SE1-T19 → 90%. |
| Próximo tag esperado | sin definir (smoke de Yair de los módulos F1; o Tier 3 hardening si se prioriza) |
| Pasada de cierre F1 — seguridad (23-jun) | Vía Supabase advisor. **(1)** 31 vistas con `SECURITY DEFINER` que bypasseaban RLS → `security_invoker=on` (`v0.43.2`). **(2)** 3 tablas de datos con RLS `USING(true)` disfrazada de "tenant_isolation" (`acceso_logs`, `nominas_externas`, `nomina_externa_items`) → tenant-scoped (`v0.43.3`); seguro porque todos los paths usan service-role. **Resultado: 0 ERRORs de seguridad** (eran 31). Quedan 125 WARNs de menor severidad = **Tier 3 backlog** (ver §3.5). |
| Sprint activo | ninguno — **F1.4 Eventos** + **F1.7 Actor/Roles** CERRADOS; **F1.3 Comunicaciones DONE técnico** (esperando smoke). Convergiendo para cerrar F1 troncal. |
| F1.3 Comunicaciones (23-jun) | Estaba marcado 50% pero el motor mock-first ya estaba ~90% hecho y funcionando. Cierre: drift reconciliado (`com_jobs_log`+`com_plantilla_versiones` capturadas a migraciones), **fix RLS hardcode** de com_jobs_log (DEFAULT_TENANT_ID → get_tenant_actual), 11 unit tests. SE1-T8 → 90% DONE técnico, esperando smoke. Adapters reales = F5. |
| Flujo de deploy | **Commit directo a `main`** (pre-F4, nadie usa prod) — sin ramas/PRs/preview. `typecheck`+`build` verdes antes de pushear. Ver memoria `flujo-commit-directo-main`. |
| Higiene git (23-jun) | Auditoría deploy: todo el trabajo confirmado en prod (main = deployment prod; PRs #13-24 merged; 7 migraciones F1.7 aplicadas). **8 ramas viejas borradas** (solo queda `main`). La rama `sprint-5` (obsoleta, 382 commits atrás) tenía la vieja página de Tutores → **rearmada fresca** (`v0.43.0`); el resto de su contenido ya estaba en prod por el refactor multi-tenant. |
| Sesión última cerrada | 2026-06-01 — F1.5 housekeeping + F1.6 sidebar data-driven + F1.8 árbol de menú ADR-066 |
| Fase actual del roadmap | F1 (Troncal núcleo ERP+CRM) |
| Navegación | **Data-driven desde `catalogo_modulos`** (RFC-006 v2 + ADR-066). El sidebar BO ya no es hardcodeado. |

---

## 2. Tareas en cada estado (snapshot Zoho LE-8)

### Terminado — DONE visual Yair 01-jun-2026 (3)
- **F1.4.1** — SE1-T20 — A4.5 Paridad eventos/planificadores. Smoke OK.
- **F1.4.2** — SE1-T21 — Buscador Personas en crear-evento. Smoke OK. **I-001 / SE1-I1 resuelto.**
  - **Causa raíz real** (corrige el diagnóstico inicial): contrato del `Combobox` — solo emitía `onChange` al tipear con `allowCreate=true`, y Personas usa `allowCreate=false`, así que la búsqueda server-side nunca se disparaba. **NO era el `limit(500)`** (el backend siempre estuvo OK). Fix: prop `onInputChange` (commit `d832da8`).
  - Bonus del mismo commit: vista Agenda del calendario legible (puntos de color sobre fondo blanco en vez de fondo pleno).
- **F1.4.3** — SE1-T91 (nuevo) — Mi Calendario: alcance personal (responsable ∪ equipo donde juega ∪ invitado) + admin (`eventos.admin`) ve todos los del tenant. Commit `abb40dd`. **Scope surgido durante el smoke, fuera del F1.4.2 original.**

### Terminado — DONE visual Yair 01-jun-2026 (navegación + housekeeping)
- **F1.5** — Housekeeping auditoría F0+F1. Tag `v0.38.0-housekeeping-auditoria-f1`.
  - SE1-I3: capa NULL en `catalogo_modulos` (9 filas CCBP) corregida (migración + seed/init alineados).
  - SE1-I4: `modules/finanzas/module.json` creado (shape troncal, sin overlap).
  - SE1-I5: NO incluido — el stub `eventos_calendario` no es rm seguro (owner ADR-042); diferido a **I-005**.
- **F1.6** — Sidebar BO **data-driven** desde `catalogo_modulos` (RFC-006). Tag `v0.39.0-sidebar-data-driven` (merge `10053d6`).
  - Migraciones: columnas `ruta_bo/icono/capability_requerida/sidebar_subitems` + población.
  - Filtros server-side: (a) módulo activo (troncal siempre), (b) capability (admin ve todo).
  - Items core no-módulo (Inicio, Mi perfil, Personas, admin Config) viven en código (`sidebar-data.ts`).
- **F1.8** — Árbol de menú **ADR-066** (áreas por mundo-del-club). Tag `v0.40.0-menu-mundo-club` (merge `73cb5d1`).
  - CHECK + reasignación: `comercial`/`operaciones`/`comunicacion` reemplazan `recursos`/`marketing`. 91 módulos, 0 huérfanos.
  - Orden áreas: inicio, personas, actividad, comercial, operaciones, finanzas, comunicacion, configuracion.
  - **Pricing queda en Finanzas** (decisión Yair, no se movió a Comercial).

### Terminado — F1.4 Eventos & Calendario (DONE visual Yair, 23-jun) ✅
- **F1.4** — SE1-T9 **CERRADO 100%**. Los 3 pendientes que lo tenían al 90% cerrados vía loop autónomo (tags v0.42.0/1/2, additivos, sin migración; 76 unit tests + typecheck + build verdes), validados por Yair en prod:
  - **Recurrencia** (v0.42.0): motor que genera los eventos hijos de la serie (`modules/eventos/lib/recurrencia.ts`, 14 tests).
  - **Invitaciones UI** (v0.42.1): `PanelInvitacionesPendientes` en `/mi-calendario` (Aceptar/Rechazar in-app) + estado en el modal.
  - **Recordatorios** (v0.42.2): input en el dialog + cron horario `/api/cron/recordatorios-eventos` → notificación in-app (dedup 24h, sin tabla de log).
  - **Scope out** (F5 conectores): sync Google/Outlook/iCloud (stub a propósito). Limitación MVP: dedup 24h → un recordatorio efectivo por evento/persona en esa ventana.

### En desarrollo (0)
- (vacío)

### Terminado — F1.7 completo (Actor/Roles, RFC-007 + ADR-068) — 23-jun
- **Modelo Actor + Roles 100% del scope de SE1-T93/T95.** `actores` (persona XOR entidad, 2.743), `catalogo_roles_actor` (20 roles), `actor_roles` (**5.829 filas**, 10 roles poblados con scope), vista `v_actores_roles`. Todo en prod, paridad verificada en cada paso.
  - Roles: socio (2.348 global + 3.054 scoped por padrón = 2.731 actores), jugador (165 global + 202 scoped por equipo/disciplina), suscriptor 51, dirigente 2, utilero 2, proveedor 1, capitan 1, comision_directiva 1, representante_federacion 1, medico 1.
  - Scope dimensions: `disciplina_slug`/`equipo_id`/`sede_id`/`padron_id`. Decisión B (global + scoped) para jugador y socio.
  - **2 read-swaps en `/admin/personas` validados por Yair en prod:** filtro "por Rol" + columna que muestra roles desde `v_actores_roles` (y "Atributo" ya solo permisos/flags).
  - **Único pendiente (gated, futuro):** deprecar los role-atributos de `personas_atributos` — recién cuando TODOS los módulos lean `actor_roles` (hoy solo personas). Coexistencia mientras tanto (ADR-068). NO bloquea.
- Tags: v0.41.0 (estructura) → v0.41.1–8 (roles + scope + read-swaps).

### Terminado — F1.7 estructura (PR #13 merged + tag v0.41.0, 23-jun)
- **F1.7** — SE1-T93 (Actor/Roles, RFC-007). Tablas `actores` (supertipo persona XOR entidad), `catalogo_roles_actor` (13 roles seed), `actor_roles` (asignación declarativa con vigencia + scope). Backfill 1:1 → **2.743 actores** (2.739 persona + 4 entidad = personas/entidades vivas). RLS multi-tenant + soft-delete, advisor limpio, typecheck verde, aplicado a prod y verificado. Mergeado y taggeado por decisión de Yair (sin UI → no requiere smoke visual).
  - **Decisiones de fondo canonizadas (23-jun):** **ADR-067** (Finanzas = trunk financiero, resuelve I-006) + **ADR-068** (frontera B: atributos = permisos dot-notation/flags; `actor_roles` = roles de negocio persona+entidad).
  - **Piloto incremental hecho (23-jun, aplicado a prod + paridad OK):** seed de roles `jugador` (165, espejo del atributo) y `proveedor` (1 entidad; camino persona-proveedor habilitado) en `actor_roles`, + vista canónica de lectura **`v_actores_roles`** (security_invoker, respeta RLS). Hallazgo: el sistema de atributos ya se usaba fuerte como roles (`socio_padron`=2347, `jugador`=165, `suscriptor`=51).
  - **Roles migrados a `actor_roles` (prod, paridad OK) — 10 roles, 2.775 filas:** `socio`=2.348, `jugador`=367 (165 global + 202 scoped por equipo/disciplina; 166 actores distintos), `suscriptor`=51, `dirigente`=2, `utilero`=2, `proveedor`=1, `capitan`=1, `comision_directiva`=1, `representante_federacion`=1, `medico`=1. Catálogo `catalogo_roles_actor`=20 roles. Vista `v_actores_roles`=2.775. Trackeado en **SE1-T95**.
  - **Decisiones resueltas (Yair, 23-jun, en ADR-068):** scope jugador = ambos (global + scoped por roster); clasificación ambiguos = oficios→rol (`medico`/`utilero`), accesos→permiso (`admin_concesiones`/`staff_acceso_total_salud`/dot-notation quedan atributos), `staff` genérico queda atributo.
  - **Primer read-swap hecho (v0.41.5, en prod):** filtro "por Rol" en `/admin/personas` que lee de `v_actores_roles` server-side (additivo, junto al de Atributo). Una página real ya consume `actor_roles`. Patrón probado.
  - **Pendiente incremental (RFC-007 §9):** más read-swaps en otros módulos/pages (con smoke), socio→scope padrón (evaluar columna/metadata), deprecar role-atributos migrados (coexistencia mientras tanto, ADR-068).

### Analizado, listo para arrancar (86)
- Distribución por phase:
  - F0 Base/Infra: 5 tareas
  - F1 Troncal restantes (sin contar F1.4.x): 13 tareas
  - F2 Vertical CCBP: 26 tareas
  - F3 Portal Cliente: 1 tarea
  - F5 Switch producción: 11 tareas
  - F6 Premium ERP: 6 tareas
  - F7 Premium Socio: 9 tareas
  - F8 Verticales nuevas: 7 tareas
  - F9 IA y Plataforma SaaS: 2 tareas
  - F10 Backlog futuro: 7 tareas

### Diseño sin código (2)
- **F9.2** — SE1-T83 — Plataforma SaaS (30%)
- **F10.2** — SE1-T85 — Planificador de Partido (30%)

### Operacional humana (0 técnicas)
- F4 — Validación Hindu — no tiene tareas técnicas, es ciclo de validación con cliente piloto

### Deployadas pero pendientes de smoke (no confirmadas DONE visual)
- Features de **Personas** del 28-may: ficha total / export y **Mi Tarjeta**. Están en producción pero Yair todavía no las validó visualmente → **no contar como terminado** hasta el smoke.

**Total**: carga base 88 tareas raíz + 2 subtareas + 1 issue (28-may) **+ SE1-T91 (F1.4.3) + SE1-I2 (I-002)** creadas 01-jun.

---

## 3. Bloqueos vigentes

| Bloqueo | Impacto | Resolución |
|---|---|---|
| Credenciales Resend, MercadoPago, AFIP, dominios Hindu, emails Hindu | F5 (switch a producción) bloqueado | Mock-first activo. Switch real al arrancar F4 con Yair coordinando con Hindu. |
| Smoke real con personas Hindu prohibido | No se pueden lanzar campañas reales hasta F4 | Datos sintéticos. F4 es el momento. |
| No carga adicional de data Hindu | Yair ya cargó todo lo disponible | Resto se carga durante F4 con el equipo de Hindu directo. |
| Sync repo->Drive manual | Opus replica vía MCP, no es automático | TODO post-F4. |

---

## 3.5. Issues latentes (no bloqueantes, sin asignar a sprint)

| Issue | Detalle | Estado |
|---|---|---|
| Anti-patrón `limit(500)` residual (**I-002 / SE1-I2**) | Cap de 500 filas en `modules/pim/lib/queries.ts:426` + 3 pages de Finanzas. Misma *forma* que I-001 pero defecto sin confirmar (buscador sobre cap → bug; reporte paginado → no es bug). Eventos ya limpio. | Trackeado en Zoho (triage). Asignar a F1/F6 según triage. |
| Refactor renames + ownership (**I-005**) | Rename de dirs kebab→snake (`atributos-custom`, `diagramacion-club`, `historial-deportivo`, `reportes-deportivos`) + alineación de slug en catálogo, **y** borrado del stub `eventos_calendario` (que es el owner declarativo ADR-042 de las tablas de eventos: requiere mover ownership a `eventos/module.json` + limpiar `depends_on` en asistencias/planificadores/partidos + slug en nav). Refactor multi-archivo con barrido de imports + build. | Diferido a su propia sesión. No tocar suelto. |
| FKs cross-módulo / Finanzas trunk (**I-006**) | **RESUELTO (23-jun)**: Yair ratificó Finanzas como trunk financiero cross-vertical (ya era `troncal`; las FKs cuotas/rrhh/concesiones/pim→Finanzas son legales, patrón Stripe/Shopify). Canonizado en **ADR-067**. | **Cerrado.** |
| Inversión de capa eventos→canchas (**I-007 / SE1-I7**) | Carve-out de I-006: `eventos` (troncal) → `canchas` (cross_vertical) es inversión leve. Mitigante: `eventos.cancha_id` es **nullable** (soft-FK). Opciones: subir espacios a troncal / aceptar soft-FK / tabla puente. | Open, no bloqueante. Resolver al tocar dominio espacios o junto a I-005. |
| Tier 3 hardening seguridad (**I-008**) | Resto del advisor de Supabase tras la pasada F1 (ERRORs ya en 0). **125 WARNs**: 82 `*_security_definer_function_executable` (funciones SECURITY DEFINER con EXECUTE a anon/authenticated — revisar caso por caso: muchas son RPCs intencionales del cliente, no blanquear a ciegas), 36 `function_search_path_mutable` (agregar `SET search_path` — sistémico pero hay que validar que ninguna función dependa del search_path), 3 `extension_in_public` (mover extensiones a schema propio — riesgoso/breaking), 1 `public_bucket_allows_listing` (**Yair**: ¿bucket público listable intencional?), 1 `auth_leaked_password_protection` (**Yair**: toggle en dashboard Supabase Auth). Los 2 `rls_policy_always_true` restantes (`api_logs`, `pre_inscripciones_insert_anon`) son INSERT anónimos by-design (RFC-001) → **no son holes**. | Open, no bloqueante (single-tenant pre-F4). Sprint propio antes de F4/multi-cliente real. 2 ítems son de la mano de Yair (no código). |

> Code detecta y anota acá; Opus lo replica a Zoho como issue formal. No se toca código fuera de scope del sprint activo.

---

## 4. Próximo paso natural

**Inmediato (días)** — _F1.7 Actor/Roles CERRADO 23-jun (v0.41.8). Convergir para cerrar F1 troncal:_
1. ~~**Cerrar los gaps de F1**~~ **HECHO (técnico):** F1.3 Comunicaciones, F1.4 Eventos, F1.7 Actor/Roles, F1.13 Proveedores UI (v0.44.0), F1.14 Compras MVP (v0.45.0) — todos DONE técnico. **No quedan gaps de construcción en F1**; resta el smoke/DONE visual de Yair de los módulos al 90% + la pasada visual del menú data-driven (punto 3).
2. **Pasada de cierre/smoke** de los ~10 módulos troncales al 95% (PIM, Finanzas, CRM, RRHH, Cobranza, Notificaciones, Atributos Custom, Proyectos, Nóminas, Proveedores-modelo).
3. **Barrido visual** del menú data-driven (ADR-066) área por área: confirmar rutas/labels/íconos y completar `ruta_bo` de módulos sin página.
3. ~~Opus refleja en Zoho: F1.5/F1.6/F1.8 → Closed; cerrar I-001~~ **HECHO (verificado 23-jun)**: tareas F1.4.x/F1.6/F1.8 en Closed 100%, e **I-001 (SE1-I1), I-003 (SE1-I4 housekeeping), I-004** ya están formalmente Closed (`is_closed_type=true`). El estado Closed de issues sí quedó configurado.
4. Triage de **I-002** (limit500 PIM+Finanzas) — sigue Open. Programar **I-005** (renames + stub ownership) — sigue Open. **I-006** sigue Open/bloqueado esperando decisión de Yair.
5. Yair smoke de las features de Personas del 28-may (ficha total/export + Mi Tarjeta) → confirmar o devolver.

> **Nota Zoho — estados custom**: el proyecto NO tiene configurado el workflow de estados custom (en desarrollo / qa / qa humano / etc.). Se opera con **Open/Closed** nativo (100% → Closed automático). Los sub-estados viven embebidos en la descripción de cada tarea.

**Corto plazo (semanas)**:
1. Auditoría módulo por módulo de las tareas en estado "analizado" en F0 + F1 + F2. Decidir prioridad de ataque.

**Mediano plazo (meses)**:
1. Completar tareas F0, F1, F2 hasta llegar a F4 (validación Hindu real).
2. F4 dispara F5 (switch a producción con credenciales reales).

---

## 5. Identifiers críticos (referencia rápida)

```
Zoho proyecto:   LE-8 "SaaS Empresarial"
Zoho URL:        https://projects.zoho.com/portal/serviciosclevel#zp/projects/2651844000000411004/
portal_id:       918690668
project_id:      2651844000000411004
owner zpuid:     2651844000000088003 (Yair)

Supabase:        hkoizqbptwhnepzbmjql
Vercel:          prj_sH5WIGNfNGo5tXxyTVvQaEfBDyBk (team team_clOmQCObDDN8okRHBc4wRhZ9)
Repo:            github.com/Levy-Wald/hindu-club-futbol
Raíz local:      /Users/yamirolw/hindu-v2
Producción:      https://hindu-club.vercel.app

Tenant Hindu:    11111111-1111-1111-1111-111111111111
Yair persona_id: 3d2d5902-9c10-4154-8086-316b0fbe081e
E2E user:        e2e-test@levywald.com / Hindu2026!
```

---

## 6. Links a docs relacionados

- **Último HANDOFF**: `docs/handoffs/HANDOFF-2026-05-28-killer-machine-bulk-load.md`
- **OPENING**: `docs/OPENING.md`
- **ADR-064**: `docs/adr/ADR-064-killer-machine-operating-model.md`
- **ADR-065**: `docs/adr/ADR-065-migracion-nomenclatura-fases-rosetta-stone.md`
- **PHASES**: `docs/PHASES.md`

---

## 7. Quién actualiza este archivo

- **Code** lo actualiza después de cada commit que cierre un sprint (parte del flow pre-tag).
- **Opus** lo actualiza vía prompt a Code o vía edición directa de la copia Drive cuando hay cambios estratégicos (ej: nueva fase iniciada, bloqueo nuevo, decisión grande).
- **Yair** lo lee al arrancar cualquier sesión. Si encuentra discrepancia con la realidad de Zoho o producción, levanta la mano.

Regla: si la última actualización es de hace más de 7 días y hubo actividad, está desactualizado. Pedirle a Code que lo refresque.

---

Fin de CURRENT-STATE.
