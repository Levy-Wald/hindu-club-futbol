# CLAUDE.md — Contexto Operativo para IA Ejecutora

**Producto:** Hindu Club Fútbol / **Plataforma SaaS Multimodal** / Vertical CCBP
**Propietario:** Servicios cLevel SRL (CUIT en trámite IGJ)
**Organización GitHub:** Levy-Wald (grupo Servicios cLevel SRL)
**Repo:** github.com/Levy-Wald/hindu-club-futbol
**URL producción:** https://hindu-club.vercel.app
**Vercel:** serviciosclevel/hindu-club
**Supabase project:** hkoizqbptwhnepzbmjql
**Path local canónico:** /Users/yamirolw/Projects/hindu-v2
**Última actualización:** 28-may-2026

> **Nota:** Este proyecto es el piloto del SaaS Empresarial (vertical CCBP — Clubes, Countries y Barrios Privados), bundle ClubCore, cliente Hindu Club Fútbol.
> Repo migrado de `yamiro12/hindu-club-futbol` → `Levy-Wald/hindu-club-futbol` el 28-05-2026.
> `yamiro12/hindu-club-futbol-v1-legacy` es la versión 1 archivada — no tocar.

---

## Estado actual

| Campo | Valor |
|---|---|
| Tag actual | `v0.36.0-nomenclatura-f0f10` |
| Último sprint cerrado | Nomenclatura F0–F10 (ADR-064 + ADR-065) |
| Próximo sprint | **F3** — Portal Cliente |
| Roadmap | 11 fases F0–F10 (`docs/PHASES.md` + `docs/ROADMAP.md`). F0, F1 y F2 completas. Próxima: F3 Portal Cliente. |
| Score arquitectónico | **8.5/10** (post Tier 1 hardening 26-may-2026) |
| Cliente activo | Hindu Club Fútbol (2.739 personas cargadas, en validación post-F4) |
| Vertical activa | **CCBP** (Clubes, Countries y Barrios Privados) |
| Verticales catalogadas | Arq, Abog, Pub, Retail |

---

## Arquitectura — modelo conceptual canónico

**4 capas** (definidas en ADR-031, ver `docs/ARCHITECTURE.md` v3 + `docs/GLOSSARY.md`):

- **Capa 0 — Troncal:** CRM, ERP, PIM, Plataforma. Universal, siempre activa.
- **Capa 1 — Módulos:** 18 built-in, portables, declaran contrato en `module.json`.
- **Capa 2 — Verticales:** presets (CCBP, Arq, Abog, Pub, Retail). Configuración, no código.
- **Capa 3 — Conectores:** integraciones externas (Resend, MercadoPago, WhatsApp — todos mock hasta F5).

**Vocabulario canónico:** si hay ambigüedad terminológica entre dos términos, **`docs/GLOSSARY.md` gana**.

---

## Métricas técnicas (al 26-may-2026)

| Métrica | Valor |
|---|---|
| Módulos físicos en `modules/` | **29** (22 DONE, 2 PARCIAL, 4 HUÉRFANO, 1 NO UI) |
| Módulos built-in canónicos | **18** |
| Tablas Supabase | **140** (snapshot al 6-may en `DATA-MODEL.md`; auditoría 26-may registra ~169) |
| Políticas RLS | **355** (auditoría 26-may) |
| Funciones SQL | **~45** (snapshot `DATA-MODEL.md`; auditoría 26-may registra ~126) |
| Triggers | **97** (auditoría 26-may) |
| Vistas | **27** |
| LOC totales | **~128.764** |
| Archivos código | **834** |
| Tests unit passing | **137** |
| Tests E2E | Playwright (varios suites) |

> Las cifras de tablas/funciones tienen dos snapshots: `DATA-MODEL.md` (6-may) y la auditoría 26-may. La discrepancia se debe a sprints B13-B17 que sumaron tablas/funciones. Para snapshot vivo, ver Supabase directamente.

---

## Stack técnico vigente

| Capa | Tecnología |
|---|---|
| Runtime | Node.js 24.x LTS |
| Framework | **Next.js 16.2.x** (App Router + RSC) |
| UI | **React 19** + **Tailwind 4** + **shadcn v4** sobre **base-ui** (NO Radix) |
| Lenguaje | TypeScript 5.x estricto |
| Backend | Supabase (Postgres 15 + Auth + RLS + Storage + Edge Fn) |
| Tests E2E | Playwright |
| Tests unit | Vitest |
| Deploy | Vercel (auto-deploy en push a `main`) |
| Package manager | pnpm 10.x |
| CI | GitHub Actions |

---

## Killer Machine — Operating Model (ADR-064)

El proyecto opera con un **cuarteto de superficies**, cada una fuente de verdad de algo distinto:

| Superficie | Fuente de verdad de |
|---|---|
| **Zoho Projects** → LE-8 SaaS Empresarial (portal serviciosclevel, portal_id 918690668, project_id 2651844000000411004) | Tareas, estados, sprints |
| **Google Drive** → `1cZVm440-tL7qgCmqe6ONDu26qvyprj98` | Documentación larga (ADRs, RFCs, specs) |
| **Repo GitHub** → `Levy-Wald/hindu-club-futbol` | Código + docs técnicos |
| **Raíz compu** → `/Users/yamirolw/hindu-v2` | Copia local (no es fuente de verdad propia) |

**Tridente operativo:**
- **Yair**: decisión + QA humano + aprobación. Escribe en todas las superficies.
- **Opus**: especificación, ADRs, prompts. Escribe en Drive y Zoho vía MCP. NO escribe en repo.
- **Code**: implementación, código, docs técnicos. Escribe SOLO en repo. NO escribe en Drive ni Zoho.

**Regla DONE**: DONE técnico (build + tests OK) ≠ terminado. Solo DONE visual de Yair marca `terminado`.

**Nomenclatura oficial**: F0–F10 (ver `docs/PHASES.md` para tabla completa + Rosetta Stone vocabulario viejo→nuevo).

Detalle completo en `docs/OPERATING-MODEL.md`.

---

## Reglas vinculantes para cualquier IA que ejecute en este repo

### Antes de tocar código

1. Leer este `CLAUDE.md` completo.
2. Leer `docs/00-START-HERE.md` (ruta A para IA).
3. Para vocabulario, consultar `docs/GLOSSARY.md` (fuente de verdad terminológica).
4. Para arquitectura, consultar `docs/ARCHITECTURE.md` + `docs/SYSTEM-DESIGN.md`.
5. Para roadmap, consultar `docs/ROADMAP.md`.
6. Leer `docs/CURRENT-STATE.md` para entender qué cambió desde el último cierre.
7. Leer el prompt específico del sprint (lo pega Yair manualmente).
8. Confirmar branch correcto (`feature/<sprint-name>`).

### Durante el desarrollo

1. **Scope sagrado:** no resolver problemas fuera del sprint. Anotar y diferir.
2. **Migraciones SQL:** siempre con RLS habilitado al crear tablas nuevas. Ver `docs/POSTGRES.md` para patrones.
3. **Multi-tenancy:** toda query nueva debe respetar `tenant_id` via RLS.
4. **TypeScript estricto:** no agregar `any`. Si hace falta, abrir issue.
5. **Tests:** todo módulo nuevo necesita al menos un test unit y un E2E happy path. Ver `docs/E2E-TESTING.md`.
6. **i18n:** copy en español rioplatense (voseo). Inglés solo en variables de código.
7. **Performance:** Android baja gama es target obligatorio. Ver `docs/PERFORMANCE.md` para restricciones.
8. **UI:** patrones canónicos en `docs/UI-UX.md` + `docs/UI-UX-PATTERNS.md`. Sistema de diseño en `docs/DESIGN-SYSTEM.md`.

### Antes de cerrar el sprint

1. `pnpm typecheck` — sin errores nuevos.
2. `pnpm lint` — sin errores nuevos.
3. `pnpm build` — verde.
4. `pnpm test` — verde.
5. `pnpm test:e2e` — happy paths del sprint pasan.
6. Verificar producción post-deploy:
   - Visitar https://hindu-club.vercel.app y probar el flujo cambiado.
   - Confirmar que no se rompió nada previo.

### Al cerrar el sprint

1. Commit con mensaje semántico: `feat(scope): descripción`.
2. Push a branch.
3. Tag semver: `vX.Y.Z-<descripcion>`.
4. PR a `main` con descripción completa (qué hace, qué tocó, qué quedó pendiente).
5. Avisar a Yair en chat con link del PR + checklist de validaciones.
6. Si el sprint generó un nuevo componente operativo, actualizar `docs/RUNBOOK.md`.
7. Si se canonizó una decisión, agregar ADR en `docs/adr/` (numeración correlativa).

---

## Documentación canónica — paths críticos

| Path | Qué contiene |
|---|---|
| `docs/00-START-HERE.md` | Entry point único |
| **`docs/ARCHITECTURE.md`** | **Canónico v3 (Sprint H4)** |
| **`docs/SYSTEM-DESIGN.md`** | **Diseño de sistema v2.0 (post RFC-004)** |
| **`docs/ROADMAP.md`** | **Roadmap v2.0 (fases F0–F10)** |
| **`docs/PHASES.md`** | **Fases F0–F10 + Rosetta Stone vocabulario viejo→nuevo** |
| **`docs/OPERATING-MODEL.md`** | **Manual operativo del cuarteto Zoho + Drive + Repo + Raíz** |
| **`docs/GLOSSARY.md`** | **Vocabulario canónico (este documento gana ante ambigüedad)** |
| `docs/MODULE-CATALOG.md` | Catálogo de módulos físicos |
| `docs/DATA-MODEL.md` | Modelo de datos por familia |
| `docs/POSTGRES.md` | Schema SQL, funciones, RLS, migraciones |
| `docs/SECURITY.md` | Políticas y controles de seguridad |
| `docs/PERFORMANCE.md` | Objetivos y restricciones (Android baja gama) |
| `docs/UI-UX.md` + `UI-UX-PATTERNS.md` | Estándares de interfaz |
| `docs/DESIGN-SYSTEM.md` | Tokens, componentes base |
| `docs/BRAND-PLATFORM.md` | Marca del producto raíz |
| `docs/RUNBOOK.md` | Manual operativo en producción |
| `docs/API.md` | API REST v1 |
| `docs/E2E-TESTING.md` | Setup tests E2E |
| `docs/SYSTEM-PROMPTS.md` | Specs formales de agentes IA del sistema |
| `docs/VISUAL-GALLERY.md` | Índice de capturas visuales |
| `docs/MENORES-TUTORES.md` | Spec de negocio (menores + tutores) |
| `docs/CURRENT-STATE.md` | Estado actual concreto |
| `docs/CONVENTIONS.md` | Convenciones operativas (tags, versionado Drive, etc.) |
| `docs/HANDOFF.md` | Checklist de continuidad entre sesiones IA |
| `docs/DECISIONS.md` | ADR-001 a ADR-046 consolidados |
| `docs/adr/` | ADRs individuales (ADR-047+) |
| `docs/rfcs/` | RFC-001 a RFC-005 |
| `docs/audits/` | Auditorías técnicas |
| `docs/cierres/` | Cierres ejecutivos de fases |
| `docs/sprints/` | Historial sprints A1-A6 + B-series |
| `docs/templates/` | Templates (RFC, post-mortem, prompt, E2E checklist) |

### Drive del proyecto

**Drive raíz:**  
`https://drive.google.com/drive/folders/1cZVm440-tL7qgCmqe6ONDu26qvyprj98`

**Carpetas principales:**

- `_Arquitectura/` — RFCs y documentos arquitectónicos
- `_Auditorias/` — auditorías técnicas
- `_Cierre Ejecutivo/` — cierres de fases
- `_Decisiones/` — ADRs subidos como copia desde repo
- `_Materiales-Comerciales/` — pitch, propuestas
- `_Roadmap/` — ROADMAP v2.0, post-B17, deuda técnica
- `_Sprints/` — prompts de sprints
- `_Verticales/` — documentación específica por vertical
- `_Archivo/` — material histórico

**Documentos ejecutivos vivos en raíz Drive:**

- `00-MASTER-INDEX-v2.2.md`
- `BOOT-CONTINUIDAD-26-MAY-2026-v3.md`
- `COMO-SEGUIMOS-v1.1.md`
- `CURRENT-STATE-v3.2-26-MAY-2026.md`

---

## Decisiones arquitectónicas clave (ADRs)

| ADR | Decisión |
|---|---|
| **ADR-031** | **Modelo de 4 capas: Troncal / Módulos / Verticales / Conectores** |
| ADR-035 | Mock-first universal (no smoke tests contra producción Hindu) |
| ADR-039 | Sidebar BO Universal — 7 espacios cross-vertical |
| ADR-040, 041, 044 | Reorganización modular post-RFC-004 |
| ADR-042 (FORMAL) | Nav Universal arquitectura definitiva |
| ADR-048 | Roles y permisos multi-tenant |
| ADR-052 | Auditoría inmutable de operaciones críticas |
| ADR-058 | Migraciones SQL versionadas + reversibles |
| ADR-061 | Drift TS-BD silenciado Supabase |
| ADR-062 | Modelado subtipos CCBP (supersedes ADR-055) |
| ADR-063 | Modelo invitados, notificaciones, control acceso, asistencias eventos |
| ADR-064 | Killer Machine: Operating Model del cuarteto |
| ADR-065 | Migración nomenclatura fases F0–F10 (Rosetta Stone) |

Lista completa: `docs/DECISIONS.md` (consolidado ADR-001 a ADR-046) + `docs/adr/` (individuales).

---

## RFCs vigentes

| RFC | Tema |
|---|---|
| RFC-001 a RFC-003 | (ver `docs/rfcs/`) |
| **RFC-004** | **Reorganización modular en 4 capas — supersedes modelo vertical único** |
| RFC-005 | (ver `docs/rfcs/`) |

---

## Bloqueantes activos

| Bloqueante | Impacta | ETA estimada |
|---|---|---|
| CUIT SCL en trámite IGJ | Pre-launch productivo, F4 Zoho | Depende IGJ |
| Resend (transactional email) | Confirmaciones, recovery de password | Setup post-CUIT (F5) |
| MercadoPago integración | Cuotas con cobro automático | Setup post-CUIT (F5) |
| CUIT Hindu Club | Facturación Hindu | Cliente debe gestionar |
| Dominios Hindu | Email + portal cliente para Hindu | Cliente debe gestionar |

**Mientras tanto:** ADR-035 mock-first universal vigente. Smoke tests contra mocks, no contra producción real.

---

## Reglas estrictas de operación

### Datos productivos (CRÍTICO)

- **NUNCA** correr smoke tests, blasts, ni queries destructivas contra las **2.390 personas reales de Hindu** cargadas en Supabase.
- **NUNCA** pedir más datos al usuario hasta que pase F4 (Validación Hindu).
- Usar `tenant_id` de prueba (`tenant_demo_xxx`) para tests.

### Sincronización local ↔ GitHub ↔ Drive

- **Local ↔ GitHub:** manual (git add + commit + push) o vía Code al cierre de sprint.
- **GitHub ↔ Drive:** **no es automático**. Algunos docs viven en ambos (ej. ADRs), otros en uno solo.
- **Después de cada merge a main:** correr `git checkout main && git pull origin main` en local para sincronizar.

---

## Convenciones de naming

- **Sprints:** letra + número (`A1`, `A2`, ..., `B17`, `B18`, ..., `C0`, `C1`, ...).
- **Branches:** `feature/<descripción-corta>` (`feature/b18-sidebar-universal`).
- **Tags:** `v<major>.<minor>.<patch>-<descripcion>` (`v0.30.25-b18-sidebar-universal`).
- **PRs:** título idéntico al tag, descripción explica qué se hizo + qué se validó.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- **ADRs:** `ADR-NNN-titulo-corto.md` en `docs/adr/`.
- **RFCs:** `RFC-NNN-titulo-corto.md` en `docs/rfcs/`.

---

## Contacto humano

**Yair Ricardo Levy Wald** — CEO Servicios cLevel SRL, owner del producto.  
Email: yair@levywald.com  
Tel: +54 9 11 5014 8932

**Para urgencias técnicas de Code:** parar y avisar via PR comment o chat. **No improvisar fuera de scope.**
