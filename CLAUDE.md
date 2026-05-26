# CLAUDE.md — Contexto Operativo para IA Ejecutora

**Producto:** Hindu Club Fútbol / SaaS Modular Vertical (SMV) / Bundle ClubCore  
**Propietario:** Servicios cLevel SRL (CUIT en trámite IGJ)  
**Repo:** github.com/yamiro12/hindu-club-futbol  
**URL producción:** https://hindu-club.vercel.app  
**Última actualización:** 26-may-2026

---

## Estado actual

| Campo | Valor |
|---|---|
| Tag actual | `v0.30.24.1-docs-reorg` |
| Último sprint cerrado | Reorganización física de docs (PR #7) |
| Próximo sprint | **B18** — Sidebar Back Office universal (7 espacios cross-vertical) |
| Fase actual | **B** — Backend Multi-tenant + UI Operativa (~90% completa) |
| Score arquitectónico | **7.8/10** (auditoría 26-may-2026) |
| Cliente activo | Hindu Club Fútbol (2.390 socios cargados, en validación post-FASE 15) |

---

## Métricas técnicas reales

| Métrica | Valor |
|---|---|
| Tablas Supabase | **169** |
| Políticas RLS | **355** |
| Funciones SQL | **126** |
| Triggers | **97** |
| LOC totales | **~128.764** |
| Archivos código | **834** |
| Módulos catalogados | **91** |
| Módulos implementados | **37** |
| ADRs vigentes | ADR-001 a ADR-061 (consolidados + individuales) |
| RFCs | RFC-001 a RFC-005 |
| Tests unit passing | **137** |
| Tests E2E | Playwright (varios suites) |

---

## Reglas vinculantes para cualquier IA que ejecute en este repo

### Antes de tocar código

1. Leer este `CLAUDE.md` completo.
2. Leer `docs/00-START-HERE.md` (ruta A para IA).
3. Leer `docs/CURRENT-STATE.md` para entender qué cambió.
4. Leer el prompt específico del sprint (lo pega Yair manualmente).
5. Confirmar que el branch correcto está creado (`feature/<sprint-name>`).

### Durante el desarrollo

1. **Scope sagrado:** no resolver problemas fuera del sprint. Anotar y diferir.
2. **Migraciones SQL:** siempre con RLS habilitado al crear tablas nuevas.
3. **Multi-tenancy:** toda query nueva debe respetar `tenant_id` via RLS.
4. **TypeScript estricto:** no agregar `any`. Si hace falta, abrir issue.
5. **Tests:** todo módulo nuevo necesita al menos un test unit y un E2E happy path.
6. **i18n:** copy en español rioplatense (voseo). Inglés solo en variables de código.

### Antes de cerrar el sprint

1. `pnpm typecheck` — sin errores nuevos.
2. `pnpm lint` — sin errores nuevos.
3. `pnpm build` — verde.
4. `pnpm test` — verde.
5. `pnpm test:e2e` — happy paths del sprint pasan.
6. Verificar producción post-deploy:
   - Visitar https://hindu-club.vercel.app y probar el flujo cambiado.
   - Confirmar que no se rompió nada que funcionaba antes.

### Al cerrar el sprint

1. Commit con mensaje semántico: `feat(scope): descripción`.
2. Push a branch.
3. Tag semver: `vX.Y.Z-<descripcion>`.
4. PR a `main` con descripción completa (qué hace, qué tocó, qué quedó pendiente).
5. Avisar a Yair en el chat con el link del PR + checklist de validaciones.

---

## Paths críticos

### Documentación canónica

| Path | Qué contiene |
|---|---|
| `docs/00-START-HERE.md` | Entry point único |
| `docs/MASTER-PROJECT.md` | Modelo conceptual completo |
| `docs/CURRENT-STATE.md` | Estado actual del producto |
| `docs/SPRINT-PLAN.md` | Roadmap estratégico (13 tramos) |
| `docs/DATA-MODEL.md` | 169 tablas en capas |
| `docs/MODULE-CATALOG.md` | 91 módulos catalogados |
| `docs/DECISIONS.md` | ADR-001 a ADR-046 consolidados |
| `docs/adr/` | ADRs individuales (ADR-047+) |
| `docs/rfcs/` | RFC-001 a RFC-005 |
| `docs/audits/` | Auditorías técnicas |
| `docs/cierres/` | Cierres ejecutivos de fases |
| `docs/sprints/` | Historial sprints A1-A6 + B-series |
| `docs/templates/` | Templates (RFC, post-mortem, prompt, E2E checklist, skill challenge) |

### Drive del proyecto

**Drive raíz del proyecto SMV/ClubCore/Hindu:**  
`https://drive.google.com/drive/folders/1cZVm440-tL7qgCmqe6ONDu26qvyprj98`

**Estructura del Drive (carpetas raíz):**

- `_Arquitectura/` — RFCs y documentos arquitectónicos
- `_Auditorias/` — auditorías técnicas
- `_Cierre Ejecutivo/` — cierres de fases
- `_Decisiones/` — ADRs subidos como copia desde repo
- `_Materiales-Comerciales/` — pitch, propuestas
- `_Roadmap/` — SPRINT-PLAN v3.0, ROADMAP post-B17, PLAN-DEUDA-TECNICA
- `_Sprints/` — prompts de sprints (Fase B, Fase C, etc.)
- `_Verticales/` — documentación específica por vertical
- `_Archivo/` — material histórico

**Documentos ejecutivos vivos en raíz Drive:**

- `00-MASTER-INDEX-v2.2.md`
- `BOOT-CONTINUIDAD-26-MAY-2026-v3.md`
- `COMO-SEGUIMOS-v1.1.md`
- `CURRENT-STATE-v3.2-26-MAY-2026.md`

---

## Stack técnico vigente

| Capa | Tecnología | Notas |
|---|---|---|
| Runtime | Node.js 20 | LTS |
| Framework | Next.js 14 | App Router, RSC, Edge |
| Lenguaje | TypeScript 5.x | `strict: true` (con 541 errores clasificados, 0% lógica) |
| Backend | Supabase | Postgres 15 + Auth + RLS + Edge Fn |
| UI | React 18 + Tailwind 3.x + shadcn/ui 4.x | |
| Tests E2E | Playwright | |
| Tests unit | Vitest | 1 suite preexistente con alias `@/` roto |
| Deploy | Vercel | Auto-deploy en push a `main` |
| Package manager | pnpm 9.x | |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

---

## Decisiones arquitectónicas vinculantes (ADRs clave)

| ADR | Decisión |
|---|---|
| ADR-039 | Sidebar Back Office Universal — 7 espacios cross-vertical |
| ADR-042 (FORMAL) | Nav Universal arquitectura definitiva |
| ADR-048 | Roles y permisos multi-tenant |
| ADR-052 | Auditoría inmutable de operaciones críticas |
| ADR-058 | Estrategia de migraciones SQL versionadas |
| ADR-061 | Estrategia de degradación graceful en Edge Functions |

Lista completa: `docs/DECISIONS.md` (consolidado) + `docs/adr/` (individuales).

---

## Bloqueantes activos

| Bloqueante | Impacta | ETA estimada |
|---|---|---|
| CUIT SCL en trámite IGJ | Pre-launch productivo, F4 Zoho, Sprint 9 | Depende IGJ |
| Resend (transactional email) | Confirmaciones, recovery de password | Setup post-CUIT |
| MercadoPago integración | Cuotas con cobro automático | Setup post-CUIT |
| CUIT Hindu Club | Facturación Hindu | Cliente |
| Dominios Hindu | Email + portal cliente para Hindu | Cliente |

**Mientras tanto:** ADR-035 mock-first universal vigente. Smoke tests contra mocks, no contra producción real.

---

## Reglas estrictas de operación

### Datos productivos (CRÍTICO)

- **NUNCA** correr smoke tests, blasts, ni queries destructivas contra las **2.390 personas reales de Hindu** cargadas en Supabase.
- **NUNCA** pedir más datos al usuario hasta que pase la FASE 15 de validación.
- Usar `tenant_id` de prueba (`tenant_demo_xxx`) para tests.

### Sincronización local ↔ GitHub ↔ Drive

- **Local ↔ GitHub:** manual (git add + commit + push) o vía Code al cierre de sprint.
- **GitHub ↔ Drive:** **no es automático**. Algunos docs viven en ambos (ej. ADRs), otros en uno solo.
- **Después de cada merge a main:** Yair corre `git checkout main && git pull origin main` en su local para sincronizar.

### Token MCP Vercel

- Token actual configurado para sesión Yair tiene scope a team `team_clOmQCObDDN8okRHBc4wRhZ9`.
- Sesión Claude Code: pendiente reconfigurar con token full-account scope.
- Mientras tanto, Code declara estado "no verificado" per ADR-039 cuando llama Vercel MCP.

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
