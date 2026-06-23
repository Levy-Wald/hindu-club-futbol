# CURRENT-STATE — Estado vivo del proyecto SaaS Empresarial

**Última actualización**: 2026-06-23
**Sesión que la generó**: Reconciliación Zoho ↔ doc — reapertura F1.4 padre + confirmación de cierres (Code). Cierre previo: F1.5 + F1.6 + F1.8 (01-jun)
**Fuente de verdad**: este archivo. Drive es espejo de referencia (lo sincroniza Opus).

> Este archivo se sobreescribe en cada cierre de sprint. Para histórico ver `docs/handoffs/` o Drive `_Cierre Ejecutivo/HANDOFF-YYYY-MM-DD`.

---

## 1. Snapshot ejecutivo

| Indicador | Valor |
|---|---|
| Tag git actual | `v0.40.0-menu-mundo-club` (F1.8). Previo: `v0.39.0-sidebar-data-driven` (F1.6), `v0.38.0-housekeeping-auditoria-f1` (F1.5) |
| Próximo tag esperado | `v0.41.0-actor-roles` (al cerrar F1.7) |
| Sprint activo | **F1.7 — Actor/Roles (RFC-007)**. Primera migración (actores + catalogo_roles_actor + actor_roles + backfill 2.743) **aplicada a prod y verificada** el 23-jun. En branch `feature/f1.7-actor-roles` (PR abierto). |
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

### Abierto — backlog interno (1)
- **F1.4** — SE1-T9 (padre) — Eventos & Calendario al **90%**. Pendiente: RRULE completo, flujo de invitaciones, recordatorios.
  - **Reabierto en Zoho el 23-jun-2026** (decisión Yair): se había cerrado al 100% por arrastre al completar las subtareas F1.4.1/F1.4.2/F1.4.3, pero el DoD del módulo sigue al ~90%. Vuelve a Open para no perder los pendientes. Cerrar solo cuando RRULE + invitaciones + recordatorios estén DONE.

### En desarrollo (1)
- **F1.7** — SE1-T (Actor/Roles, RFC-007). **Primera migración aplicada a prod y verificada (23-jun)**: tablas `actores` (supertipo persona XOR entidad), `catalogo_roles_actor` (13 roles seed), `actor_roles` (asignación declarativa con vigencia + scope). Backfill 1:1 OK → 2.739 actores-persona + 4 actores-entidad = 2.743 (conteos = personas/entidades vivas). RLS multi-tenant + soft-delete, advisor limpio, typecheck verde. **Pendiente (sprints incrementales, RFC-007 §9):** migración de lectura módulo-por-módulo (que las queries lean `actor_roles` en vez de inferir rol), UI, y seed de asignaciones reales. Branch `feature/f1.7-actor-roles`, PR abierto. NO requiere smoke visual (es backend).

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
| FKs cross-módulo / Finanzas trunk (**I-006**) | **Bloqueado** — pendiente de decisión de Yair. No tocar. | Bloqueado. |

> Code detecta y anota acá; Opus lo replica a Zoho como issue formal. No se toca código fuera de scope del sprint activo.

---

## 4. Próximo paso natural

**Inmediato (días)**:
1. **F1.7 — Actor/Roles**: próximo sprint (modelo de actores y roles del tenant).
2. **Barrido visual** del nuevo menú data-driven (ADR-066) área por área: confirmar rutas, labels e íconos de cada módulo en prod, y completar `ruta_bo` de los módulos que hoy quedaron sin página (no se renderizan).
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
