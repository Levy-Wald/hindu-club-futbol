# ROADMAP-LOOPS — cola ejecutable (lo que el harness agarra)

> ## ⚖️ Un dato, un lugar — el estado del LOOP vive ACÁ y solo acá
> **El `[ ]` / `[x]` de cada loop es de este doc.** Es la cola que lee el `orchestrator`: agarra el
> primer loop `[ ]` OPEN en orden de la fase activa.
> - **Por qué es así / narrativa / orden de fases →** `docs/ROADMAP.md` (no lleva checkboxes).
> - **Snapshot en prosa / issues latentes / bloqueos →** `docs/CURRENT-STATE.md`.
> - **Estado de la tarea (Open/Closed) →** Zoho LE-8 (project_id `2651844000000411004`), match por `SE1-Tnn`.
> - **Nomenclatura de fases F0–F10 →** `docs/PHASES.md`.
>
> Regla de oro: una cosa, una fuente; nada se duplica entre superficies. Al cerrar un loop → `[x]` acá
> + nota/cierre en su tarea Zoho. Al abrir/cerrar una **fase** → estado acá + Zoho + CURRENT-STATE
> (Drive lo espeja Opus, por fase, no por loop).

**Última actualización:** 2026-07-18 · tag real `v0.52.0-portal-convocatoria` · fase activa **F3**
(Portal Cliente). Generado como cola inicial del harness a partir de ROADMAP.md + PHASES.md +
CURRENT-STATE.md (24-jun).

---

> ## 🔴 GATE «CUIT SCL en trámite IGJ» — F4/F5 NO se arrancan
> **F4 (Validación Hindu) y F5 (Switch a producción) están bloqueadas** hasta que salga el CUIT de
> Servicios cLevel SRL (habilita Resend, MercadoPago, AFIP, dominios/emails Hindu). Mientras tanto rige
> **mock-first universal (ADR-035)**: los 4 seams de conector ya están cableados (`lib/connectors/{payments,messaging,calendar}` + `email-adapter.ts`); F5 = implementar el adapter real + flip de env,
> **no** reconstruir. Todo loop que "necesite" el conector real → PARÁ y escalá.
>
> ## 🔴 GATE «DONE visual de Yair» — pre-F4 el cierre lo firma Yair, no el gate técnico
> Regla DONE (ADR-064): DONE técnico (build+tests+advisors OK) ≠ `terminado`. Un módulo al 90/95%
> "DONE técnico" **no se marca `[x]` como terminado** hasta el smoke visual de Yair en producción
> (https://hindu-club.vercel.app). El harness deja el módulo en `[~]` (DONE técnico, esperando smoke) y
> avisa a Yair qué probar. Solo Yair lo pasa a `[x]`.

---

## Contrato loop-ready (las 7 casillas)
Ningún ítem entra a la cola de ejecución sin las 7 llenas. Si falta una → va a **definición, no a
ejecución** (por eso F7–F10 más abajo son goals, todavía no loops).
1. **clb-key + tabla** (Zoho `SE1-Tnn` + tabla/s Supabase que toca) · 2. **DoD observable** ·
3. **Tier + gate** · 4. **Decisiones** (todas resueltas o "ninguna") · 5. **Reuse** (stack vivo que
reusa) · 6. **Blast radius** (qué NO toca) · 7. **Superficies** (qué se toca al cerrar).

### Leyenda de estado
`[x]` terminado (DONE visual Yair) · `[~]` DONE técnico, esperando smoke · `[ ]` OPEN (a ejecutar) ·
`[·]` definición (no loop-ready) · 🔴 gate (bloqueado) · 🟡 decisión de negocio pendiente.

---

## F0 — Base / Infra · ✅ COMPLETA
Auth, tenant routing, layout/app shell, front público. Hindu en producción.
- [x] F0 completa — tag `v0.27.0` era-base. Sin loops abiertos.

## F1 — Troncal núcleo ERP+CRM · ✅ construido (cierre = smoke de Yair)
PIM, Finanzas, CRM, Eventos & Calendario, Notificaciones, Atributos Custom, Proyectos, Cobranza,
RRHH, Nóminas, Comunicaciones, Proveedores, Compras. **No quedan gaps de construcción** — resta el
DONE visual de Yair de los módulos al 90/95%.
- [x] F1.4 Eventos & Calendario — SE1-T9, 100% DONE visual (tags v0.42.x).
- [x] F1.7 Actor/Roles — SE1-T93/T95, RFC-007 + ADR-068 (tags v0.41.x). `actor_roles` 5.829 filas.
- [~] F1.3 Comunicaciones — SE1-T8, 90% DONE técnico (motor mock-first, 11 tests). **Esperando smoke.**
- [~] F1.13 Proveedores UI — SE1-T18, 90% (tag v0.44.0). **Esperando smoke.**
- [~] F1.14 Compras MVP — SE1-T19, 90% (tag v0.45.0). **Esperando smoke.**
- [ ] **F1.smoke** — Pasada de cierre/smoke de los ~10 módulos troncales al 95% (PIM, Finanzas, CRM,
      RRHH, Cobranza, Notificaciones, Atributos Custom, Proyectos, Nóminas, Proveedores). Tier 1 ·
      DoD: cada módulo con smoke OK o bug anotado · gate Yair 🔴 (es su smoke, no del harness).
- [ ] **F1.nav** — Barrido visual del menú data-driven (ADR-066) área por área: confirmar
      rutas/labels/íconos y completar `ruta_bo` de módulos sin página. SE1 (nav). Tier 1 · reusa
      `catalogo_modulos` · blast: solo columnas de nav, no lógica de módulo.

## F2 — Vertical CCBP (Hindu deportivo) · ✅ COMPLETA
Equipos, Entrenamientos, Táctica, Partidos, Asistencias, Reservas, Concesiones, Espacios, Membresías,
Salud, Lesiones, Utilería, Acceso, Pre-inscripciones, Solicitudes, Stock MVP, Scouting, etc.
- [x] F2 completa — tag `v0.30.0-fase-b-completa`. Sin loops abiertos.

## F3 — Portal Cliente (front del socio mobile) · 🟢 FASE ACTIVA
Layout PC, login socio, dashboard, perfil + dependientes, inscripción a eventos, notificaciones,
pago de cuotas. Route group `/portal/[tenant]` paralelo a `/admin`.
- [~] F3.1 Portal núcleo — SE1-T48, 95% DONE técnico (tags v0.46.0–v0.46.5): fundación, mi cuenta,
      perfil+familia, notificaciones, login-branching, mi agenda, edición de contacto self-scoped.
      **Esperando smoke.** Pendiente 5%: pago real (bloqueado F5 🔴) + DONE visual.
- [~] F3.2 Convocatoria + mensajería — confirmación DT↔jugador (`evento_convocados`, 12 tests) +
      mensajería interna (`mensaje_directo`). Tag `v0.52.0-portal-convocatoria` (commits `017c6cc5`→`cc07f9c`).
      **Esperando smoke.**
- [ ] **F3.close** — Cierre de F3: smoke de Yair del portal end-to-end (mobile 375px, Android gama
      baja) + resolver los pendientes registrados (aprobar solicitudes de cambio, hilos de mensajería,
      torneos/posiciones — ver memoria `portal-pendientes-jun24`). Tier 1 · gate Yair 🔴.
- [ ] F3.pago — Pago de cuotas real desde el portal. **🔴 BLOQUEADO F5** (MercadoPago post-CUIT). El
      botón Pagar ya consume el seam mock (`lib/connectors/payments/`); F5 = flip.

## F4 — Validación Hindu (demo real) · 🔴 BLOQUEADA (CUIT) · ciclo humano, no técnico
No se construyen features. Reset de DB, carga de datos por Yair+staff Hindu, operación real 30–60
días, curva de bugs, DONE visual de F0–F2. **Dispara F5.**
- [·] F4 — sin loops técnicos. Solo bugs críticos que bloqueen la validación se atacan como fix-loops.

## F5 — Switch a producción (conectores reales) · 🔴 BLOQUEADA (CUIT)
Salida de mocks: Resend, MercadoPago, AFIP, WhatsApp, Cloudflare R2 + Google/Outlook/CalDAV (sync) +
OAuth social. Los 4 seams ya cableados (mock-first, ADR-035) → F5 = adapter real + flip de env.
- [·] F5.email — Resend real (`email-adapter.ts`). 🔴 post-CUIT.
- [·] F5.pagos — MercadoPago real (`lib/connectors/payments/`). 🔴 post-CUIT.
- [·] F5.mensajeria — WhatsApp real (`lib/connectors/messaging/`). 🔴 post-CUIT.
- [·] F5.calendario — Google/Outlook/iCloud sync (`lib/connectors/calendar/`). 🔴 post-CUIT.
- [·] F5.oauth — Login con Google/Microsoft/Apple. 🔴 post-CUIT.

## F6 — Premium ERP · 🟡 batch zero-dep construido (esperando smoke) + resto pendiente
### Batch cero-dependencia (24-jun, DONE técnico, esperando smoke)
- [~] F6.5 BI Ejecutivo — SE1-T?, `/admin/direccion`, KPIs read-only. Tag `v0.47.0`.
- [~] F6.6 Rendición de gastos — SE1-T65, 80%, máquina de estados (9 tests). Tag `v0.48.0`.
- [~] F6.8 Planificador de Partido — SE1-T85, 80%, `/admin/convocatorias` (3 tests). Tag `v0.49.0`.
- [~] F6.9 Federaciones — SE1-T86, 70%, `/admin/federaciones` read-only. Tag `v0.50.0`.
- [~] F6.7 Consolidador de Padrones — SE1-T84, 70%, `/admin/padrones/consolidado`. Tag `v0.51.0`.
### Resto F6 (loops disponibles sin tocar CUIT — la fase premium arranca post-F4/gate de Yair)
- [ ] F6.1 Documentos / Drive del club — módulo nuevo: upload, versionado, firma mock-first. Tier 2
      (schema + RLS). Decisión 🟡: alcance de firma (mock hasta F5). Reusa Storage Supabase.
- [ ] F6.3 Pricing avanzado (PIM Nivel 2) — poblar tablas de listas/segmentos/vigencias creadas en A2.
      Tier 2 · reusa PIM · blast: no toca catálogo base.
- [ ] F6.4 Stock & Movimientos (PIM Nivel 3) — motor de movimientos + ubicaciones + vista de stock real.
      Tier 2 · reusa PIM · resuelve el diferido de F1.14 (posteo a stock).
- [ ] F6.merge-consolidador — acciones de merge en Consolidador de Padrones (hoy read-only). Cierra el
      30% de F6.7. Tier 2 (toca personas — data sensible, QA COMPLETO).

## F7 — Premium Socio · 🔴 gate producto (post-F4) · goals, no loop-ready
Salones, Tienda propia, Asambleas/Votaciones, Convenios, Encuestas/NPS, Clases con cupo+Waitlist,
Loyalty/Referidos, Patrocinadores, App móvil nativa.
- [·] F7 — 9 goals catalogados en Zoho. Se desglosan a loops cuando la fase se prioriza (post-F4).

## F8 — Verticales nuevas · 🔴 gate comercial · goals, no loop-ready
Arquitectura (F8.1), Retail (F8.2), Country (F8.3), Abogacía (F8.4), Publicidad (F8.5).
- [·] F8 — cada vertical = mini-troncal + submódulos propios. Se desglosa cuando hay cliente piloto.

## F9 — IA y Plataforma SaaS · diseño sin código
- [·] F9.1 IA embebida — sin código.
- [·] F9.2 Plataforma SaaS (marketplace, white-label, API pública, webhooks, Agent Connector) —
      SE1-T83, 30% diseño. Sin código.

## F10 — Backlog futuro / sin priorizar
- [·] F10 — Stripe, Google Document AI, Brevo, Telegram (conectores alternativos). Sin priorizar.

---

## Issues latentes loop-ready (de CURRENT-STATE §3.5 — no bloqueantes, sin fase asignada)
Estos SÍ tienen las 7 casillas y se pueden agarrar como loops sueltos entre fases:
- [ ] **I-002 / SE1-I2** — Anti-patrón `limit(500)` en `modules/pim/lib/queries.ts:426` + 3 pages de
      Finanzas. Tier 1 · DoD: triage (buscador sobre cap = bug; reporte paginado = no) + fix donde sea
      bug · blast: no toca Eventos (ya limpio).
- [ ] **I-005** — Refactor renames kebab→snake (`atributos-custom`, `diagramacion-club`,
      `historial-deportivo`, `reportes-deportivos`) + slug en catálogo + borrado del stub
      `eventos_calendario` (mover ownership ADR-042 a `eventos/module.json`). Tier 2 · **su propia
      sesión** (multi-archivo + barrido de imports) · NO tocar suelto.
- [ ] **I-007 / SE1-I7** — Inversión de capa `eventos`(troncal)→`canchas`(cross_vertical). Mitigante:
      `eventos.cancha_id` nullable. Decisión 🟡: subir espacios a troncal / aceptar soft-FK / tabla
      puente. Resolver al tocar dominio espacios o junto a I-005.
- [ ] **I-008 · Tier 3 hardening** — resto del advisor: 82 `security_definer_function_executable`
      (caso por caso — muchas son RPCs intencionales), 3 `extension_in_public` (breaking), +2 ítems de
      la mano de Yair (`public_bucket_allows_listing`, `auth_leaked_password_protection` 🟡). Tier 2 ·
      no bloqueante (single-tenant pre-F4).

---

## Próximo loop sugerido (al 18-jul)
La fase activa es **F3**. Los cierres de F1/F3/F6-batch están **gated por el smoke de Yair 🔴** (el
harness no los cierra solo). Loops que el harness SÍ puede agarrar sin gate humano ni CUIT:
**F1.nav** (barrido menú data-driven) · **I-002** (triage limit500). Todo lo demás espera smoke de
Yair, decisión de negocio 🟡, o el CUIT 🔴.
