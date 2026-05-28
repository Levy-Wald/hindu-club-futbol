# PHASES — Fuente de verdad de fases del roadmap

> **Vigente desde**: 28-may-2026
> **Canonizado en**: ADR-065 (Drive `_Arquitectura/ADR-065-migracion-nomenclatura-fases`)
> **Estado vivo del trabajo**: Zoho Projects → proyecto "SaaS Empresarial"

Este documento define la nomenclatura **única y oficial** de fases del roadmap. Reemplaza todos los vocabularios anteriores (FASE A–E, C0, Fase 6, Fase 9, Fase 16). Cualquier documento o conversación que use el vocabulario viejo se traduce con la Rosetta Stone al final.

---

## Las once fases F0–F10

| Código | Nombre | Qué resuelve |
|---|---|---|
| **F0** | Base / Infra | Auth, Tenant routing, Layout / App Shell, Front público |
| **F1** | Troncal núcleo ERP+CRM | PIM, Finanzas, CRM, Eventos & Calendario, Notificaciones, Atributos Custom, Proyectos, Cobranza, RRHH, Nóminas externas, Comunicaciones, Proveedores (modelo + UI MVP), Compras MVP |
| **F2** | Vertical CCBP (Hindu deportivo) | Equipos, Entrenamientos, Tactica, Partidos, Asistencias, Reservas, Concesiones, Espacios, Membresías, Salud datos médicos, Lesiones, Utilería, Acceso al club, Pre-inscripciones, Solicitudes, Stock e Inventario MVP, Scouting, Diagramación club, Historial deportivo, Reportes deportivos, Disciplinas |
| **F3** | Portal Cliente (front del socio mobile) | Layout PC, login socio, dashboard, perfil + dependientes, inscripción a eventos, notificaciones al socio, pago de cuotas |
| **F4** | Validación Hindu (demo real) | Operación real de Hindu durante 30–60 días en producción; curva de bugs reales; aprobación de DONE visual de todos los módulos F0–F2 |
| **F5** | Switch a producción (conectores reales) | Salida de mocks: Resend, MercadoPago, AFIP, WhatsApp, Cloudflare R2 (core) + Google Calendar, Microsoft Outlook, iCloud/CalDAV (sync) + Login con Google/Microsoft/Apple (OAuth social) |
| **F6** | Premium ERP (ciclo completo) | Documentos / Drive del club, BI ejecutivo, Rendición de gastos, Stock mejoras, Compras mejoras, Proveedores mejoras |
| **F7** | Premium Socio (engagement y revenue) | Salones, Tienda propia, Asambleas / Votaciones, Convenios, Encuestas / NPS, Clases con cupo + Waitlist, Loyalty / Referidos, Patrocinadores, App móvil nativa |
| **F8** | Verticales nuevas (otros rubros) | Arquitectura (F8.1), Retail (F8.2), Country (F8.3), Abogacía (F8.4), Publicidad (F8.5) + Tiendanube / Shopify |
| **F9** | IA y Plataforma SaaS | IA embebida (F9.1), Plataforma SaaS — marketplace, white-label, API REST pública, Webhooks, Agent Connector (F9.2) |
| **F10** | Backlog futuro / sin priorizar | Consolidador de Padrones, Federaciones, Planificador de Partido, Stripe, Google Document AI, Brevo, Telegram |

---

## Sintaxis de tareas

- **Módulo dentro de fase**: `Fx.y — Nombre del módulo`
  Ejemplo: `F1.4 — Eventos & Calendario`
- **Sub-tarea (sprint de implementación)**: `Fx.y.z — Nombre del sub-sprint`
  Ejemplo: `F1.4.1 — A4.5 Paridad eventos/planificadores`

El sufijo histórico ("A4.5") se preserva en el nombre para trazabilidad con commits y tags git inmutables, pero el código de roadmap es el `Fx.y.z`.

---

## Vocabulario controlado de estados

`no analizado` · `analizado` · `analizado y prompteado` · `diseño sin código` · `en desarrollo` · `en qa` · `QA humano` · `revisar` · `terminado` · `eliminado` · `suspendido momentáneamente`

**Flujo correcto**: `en desarrollo → en qa (técnico) → QA humano → terminado`

**Regla DONE** (heredada, sigue vigente):
- DONE técnico = build, tests, smoke automático OK.
- DONE visual = Yair confirmó manualmente en producción.
- Una tarea pasa a `terminado` **solo** después de DONE visual.

---

## Alcance de entrega (MVP base / Mejoras / Total)

Cada módulo de F1 en adelante puede dividirse en dos entregas:
- **MVP base** — lo mínimo lanzable que habilita vender o usar
- **Mejoras** — extensiones post-MVP, no bloquean primera venta
- **Total** — módulos que no se subdividen (ya construidos completos o demasiado chicos)

Ver Zoho "SaaS Empresarial" para el alcance asignado a cada tarea.

---

## Rosetta Stone — vocabulario viejo → nuevo

| Vocabulario viejo | Vocabulario nuevo |
|---|---|
| FASE A | F1 |
| FASE B | F2 |
| FASE C / Validación Hindu | F4 |
| C0 / "Fase 6" / Portal Cliente / "pre-launch" | F3 |
| FASE D / "Cross-vertical extra" | F6 |
| FASE E genérico | F8 |
| FASE E.1 Arquitectura | F8.1 |
| FASE E.2 Retail | F8.2 |
| FASE E.3 Country | F8.3 |
| FASE E.4 Abogacía | F8.4 |
| FASE E.5 Publicidad | F8.5 |
| Fase 9 / IA embebida | F9.1 |
| Fase 16 / switch producción | F5 |
| Fase 16.1 / 16.2 / 16.3 | F5 (sub-tareas) |
| Plataforma SaaS | F9.2 |
| "Fase futura" sin priorizar | F10 |
| "base" / chasis implícito | F0 |

---

## Qué se migró y qué quedó intacto

- **Migrado** al vocabulario nuevo: docs live (este `PHASES.md`, `OPERATING-MODEL.md`, `ROADMAP.md`, `MODULE-CATALOG.md`, `CURRENT-STATE.md`, `HANDOFF.md`, `CLAUDE.md`, `SYSTEM-DESIGN.md`, `DECISIONS.md`, `GLOSSARY.md`, `RUNBOOK.md`, `templates/PROMPT-TEMPLATE.md`, `adr/ADR-INDEX.md`).
- **No tocado** — son snapshots de su época, se entienden vía Rosetta:
  - `docs/cierres/*` (cierres ejecutivos)
  - `docs/rfcs/*` (RFCs firmadas)
  - `docs/adr/ADR-001 .. ADR-063` (ADRs anteriores)
  - `docs/sprints/A*-*.md`, `docs/sprints/B-series/*` (specs de sprints pasados)
  - `docs/audits/*` (auditorías puntuales)
  - commits, tags git, nombres de archivos SQL (historia inmutable)

---

## Referencias

- ADR-064 — Killer Machine: Operating Model del cuarteto Zoho + Drive + Repo + Raíz compu
- ADR-065 — Migración a nomenclatura única F0–F10 (decisión formal)
- `docs/OPERATING-MODEL.md` — manual operativo del cuarteto
- Zoho Projects → "SaaS Empresarial" — estado vivo
- Drive raíz → `Matriz-Modulos-SMV-ClubCore-v7.xlsx` — vista inicial congelada
