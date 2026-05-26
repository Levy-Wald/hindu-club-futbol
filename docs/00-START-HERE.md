# 00 — Start Here

**Bienvenido al repositorio Hindu Club Fútbol / Plataforma SaaS Multimodal / Vertical CCBP.**

Este archivo es el **único entry point** para cualquier persona o IA que aterrice acá sin contexto previo. Te dice por dónde empezar según tu rol.

---

## Antes que nada — vocabulario canónico

Cuando hay ambigüedad terminológica entre dos términos parecidos, **`docs/GLOSSARY.md` gana**. Si encontrás contradicciones entre docs, GLOSSARY es la fuente de verdad.

**Conceptos clave que vas a encontrar:**

- **Plataforma SaaS Multimodal** = el producto raíz.
- **Capa** = una de las 4 categorías lógicas (Troncal / Módulos / Verticales / Conectores). Ver ADR-031.
- **Troncal** = Capa 0. Universal, obligatoria. CRM, ERP, PIM, Plataforma.
- **Módulo** = Capa 1. Componible. 18 built-in. Declara contrato en `module.json`.
- **Vertical** = Capa 2. Preset de módulos por sector. NO es código, es configuración. CCBP es la activa.
- **Conector** = Capa 3. Integración externa (Resend, MercadoPago, WhatsApp).
- **CCBP** = Clubes, Countries y Barrios Privados (vertical activa).
- **Tenant** = cliente con datos aislados via RLS. Hindu Club es el tenant productivo.

---

## Elegí tu ruta

### Ruta A — Sos Claude Code (o cualquier IA ejecutora) y vas a arrancar un sprint

**Leé en este orden, parar al primer doc que te dé contexto suficiente:**

1. `CLAUDE.md` (raíz) — tag actual, próximo sprint, paths críticos, Drive.
2. `docs/GLOSSARY.md` — vocabulario canónico.
3. `docs/ARCHITECTURE.md` — modelo conceptual v3.
4. `docs/CURRENT-STATE.md` — qué cambió recientemente.
5. `docs/ROADMAP.md` — donde estamos en el roadmap de 17 fases.
6. El prompt específico del sprint — te lo pega Yair manualmente. Vive en Drive `_Sprints/`.

**Reglas de oro para Code:**

- Antes de tocar código: leer `CLAUDE.md` + el prompt del sprint completo.
- Antes de commitear: typecheck + lint + build + tests deben pasar.
- Cerrar con: commit + push + tag semver + PR + smoke test producción.
- Si encontrás algo fuera del scope del sprint: **anotalo, no lo resuelvas**.
- Si la auditoría post-deploy falla: rollback inmediato, no parchear sobre la marcha.

Documentos vinculantes para tu trabajo: todos los ADRs en `docs/adr/` + `docs/DECISIONS.md`.

---

### Ruta B — Sos un dev humano nuevo en el equipo

**Plan de lectura primer día (~3 horas):**

1. Este archivo (`docs/00-START-HERE.md`) — 5 min.
2. `README.md` (raíz) — 10 min. Qué es el producto, cómo se levanta.
3. `docs/GLOSSARY.md` — 20 min. Vocabulario canónico (obligatorio para no perderte después).
4. `docs/ARCHITECTURE.md` — 30 min. Modelo conceptual completo, las 4 capas, convenciones.
5. `docs/SYSTEM-DESIGN.md` — 30 min. Cómo opera el sistema (auth, multi-tenancy, módulos, sidebar, API).
6. `docs/ROADMAP.md` — 20 min. Las 17 fases, dónde estamos, qué falta.
7. `docs/MODULE-CATALOG.md` — 20 min. Módulos físicos y su estado.
8. `docs/DATA-MODEL.md` + `docs/POSTGRES.md` — 40 min. Modelo de datos + schema SQL.
9. `docs/UI-UX.md` + `docs/UI-UX-PATTERNS.md` — 30 min. Estándares de interfaz.
10. `docs/adr/ADR-INDEX.md` — 20 min. Decisiones técnicas vinculantes.

**Setup local:** `README.md` sección "Cómo correr en local".

**Setup tests E2E:** `docs/E2E-TESTING.md`.

**Primera contribución sugerida:** elegir un Tier 4 de `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md` (deuda menor) y abrir PR.

---

### Ruta C — Sos QA externo y vas a auditar el sistema

**Plan de auditoría (1 día):**

1. `README.md` (raíz) — propuesta de valor y stack.
2. `docs/ARCHITECTURE.md` + `docs/SYSTEM-DESIGN.md` — modelo conceptual.
3. `docs/SECURITY.md` — políticas de seguridad y RLS.
4. `docs/PERFORMANCE.md` — restricciones y objetivos.
5. `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md` — auditoría arquitectónica reciente.
6. `docs/audits/AUDIT-PATRONES-ARQUITECTONICOS-2026-05-26.md` — patrones.
7. `docs/audits/AUDIT-TESTING-CODEHEALTH-2026-05-26.md` — testing y code health.
8. `docs/audits/AUDIT-TS-STRICT-541-CLASIFICACION.md` — clasificación de errores TS.
9. Correr `pnpm typecheck && pnpm test && pnpm test:e2e` localmente.
10. Revisar 5 ADRs random de `docs/adr/` para validar trazabilidad de decisiones.
11. Revisar últimas 3 PRs mergeadas en GitHub.

**Smoke test producción:** https://hindu-club.vercel.app

**Runbook de incidentes:** `docs/RUNBOOK.md` (1.575 líneas, manual operativo completo).

---

### Ruta D — Sos inversor técnico evaluando el activo

**Plan de evaluación (2-3 horas):**

1. **Producto y modelo de negocio (20 min):**
   - `README.md` (raíz) — propuesta de valor.
   - `docs/ARCHITECTURE.md` — modelo conceptual de 4 capas.
   - `docs/BRAND-PLATFORM.md` — visión de marca y verticales.

2. **Estado actual del producto (30 min):**
   - `docs/CURRENT-STATE.md` — qué funciona hoy, qué falta, qué está bloqueado.
   - `docs/MODULE-CATALOG.md` — módulos implementados.
   - `docs/ROADMAP.md` — 17 fases, dependencias.

3. **Calidad técnica (60 min):**
   - `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md` — score 7.8/10 con deuda clasificada.
   - `docs/audits/AUDIT-TS-STRICT-541-CLASIFICACION.md` — 541 errores TS: 0% lógica, 100% mecánicos.
   - `docs/SECURITY.md` — políticas, RLS, auditoría.
   - `docs/PERFORMANCE.md` — restricciones y benchmarks.
   - `docs/adr/` — leer 5 ADRs random para validar disciplina de decisiones.

4. **Operación productiva (15 min):**
   - `docs/RUNBOOK.md` — manual operativo (mostrar madurez).
   - `docs/E2E-TESTING.md` — disciplina de testing.

5. **Roadmap y velocidad (15 min):**
   - `docs/ROADMAP.md` v2.0 — fases ordenadas por dependencias.
   - `docs/sprints/` — historial real de sprints (validar velocidad).

6. **Riesgos (15 min):**
   - `docs/audits/` Tier 1 acciones — deuda crítica (~4-6h fix).
   - `CLAUDE.md` sección "Bloqueantes activos" — dependencia CUIT SCL.

**Preguntas que respondés con esto:**

- ¿Es producto real o vaporware? → Mirá `hindu-club.vercel.app` + datos reales de Hindu.
- ¿Hay deuda técnica oculta? → Auditoría declara 7.8/10 con 14 acciones documentadas.
- ¿Es escalable a otras verticales? → 4 capas con presets por vertical. CCBP productivo, Arq/Abog/Pub/Retail catalogados.
- ¿Hay dependencias críticas? → CUIT SCL en trámite IGJ (legal, no técnico).
- ¿La arquitectura es retrofit o nativa? → Multi-tenant + RLS nativo desde commit 1. Modelo modular en `ADR-031`.

---

## Mapa de carpetas del repo

```
hindu-club-futbol/
├── app/                       # Rutas Next.js (BO + Portal Cliente)
├── components/                # UI compartida
├── modules/                   # Módulos físicos (Capa 1)
├── lib/                       # Utilidades + clientes Supabase
├── tests/                     # E2E (Playwright) + unit (Vitest)
├── supabase/                  # Migraciones + Edge Functions
├── docs/
│   ├── 00-START-HERE.md           # ESTE ARCHIVO
│   ├── ARCHITECTURE.md            # Canónico v3
│   ├── SYSTEM-DESIGN.md           # v2.0 post RFC-004
│   ├── ROADMAP.md                 # v2.0 (17 fases)
│   ├── GLOSSARY.md                # Vocabulario canónico (gana ante ambigüedad)
│   ├── CURRENT-STATE.md           # Estado actual
│   ├── MODULE-CATALOG.md          # Catálogo de módulos
│   ├── DATA-MODEL.md              # Modelo de datos por familia
│   ├── POSTGRES.md                # Schema SQL + RLS + funciones
│   ├── SECURITY.md                # Políticas y controles
│   ├── PERFORMANCE.md             # Objetivos Android baja gama
│   ├── UI-UX.md                   # Estándares interfaz
│   ├── UI-UX-PATTERNS.md          # Patrones reusables
│   ├── DESIGN-SYSTEM.md           # Tokens + componentes
│   ├── BRAND-PLATFORM.md          # Marca producto raíz
│   ├── RUNBOOK.md                 # Manual operativo (1.575 líneas)
│   ├── API.md                     # API REST v1
│   ├── E2E-TESTING.md             # Setup tests E2E
│   ├── SYSTEM-PROMPTS.md          # Specs agentes IA
│   ├── VISUAL-GALLERY.md          # Índice capturas
│   ├── MENORES-TUTORES.md         # Spec menores + tutores
│   ├── DECISIONS.md               # ADR-001 a ADR-046 consolidados
│   ├── adr/                       # ADRs individuales (047+)
│   ├── rfcs/                      # RFC-001 a RFC-005
│   ├── audits/                    # Auditorías técnicas
│   ├── cierres/                   # Cierres ejecutivos de fases
│   ├── sprints/                   # Historial sprints A1-A6 + B-series
│   ├── pre-mortems/               # Análisis pre-ejecución
│   ├── navigation/                # Especificación Nav Universal
│   ├── templates/                 # Templates (RFC, post-mortem, prompt)
│   ├── verticales/ccbp/           # Documentación específica CCBP
│   └── archive/                   # Documentación histórica
├── CLAUDE.md                  # Contexto para IA ejecutora
├── README.md                  # Vista general del producto
├── package.json
├── tsconfig.json
├── next.config.ts
├── middleware.ts
└── ... (configs)
```

---

## Convenciones del proyecto

| Convención | Donde aplica |
|---|---|
| Idioma: **español rioplatense** (voseo) | Documentación, commits, comentarios, copy. Código en inglés. |
| Commits: `tipo(scope): mensaje` | `feat(modules): agrega módulo eventos`, `fix(rls): corrige policy en tabla X`. |
| Branches: `feature/<descripción>` | `feature/docs-reorg`, `feature/b18-sidebar-universal`. |
| Tags: `v<sprint>.<subsprint>-<descripcion>` | `v0.30.24.2-docs-sync`, `v0.30.25-b18-sidebar-universal`. |
| ADRs: numeración correlativa | `ADR-001`, `ADR-002`, ... formato canónico en `docs/templates/`. |
| RFCs: numeración correlativa | `RFC-001` a `RFC-005`. |
| Mobile-first real | Toda UI nace pensada para Android baja gama. `docs/UI-UX.md`. |

---

## Cuando algo no esté claro

1. Buscá en `docs/GLOSSARY.md` (vocabulario canónico).
2. Buscá en `docs/` con `grep -r "<keyword>" docs/`.
3. Buscá en GitHub Issues cerrados (historial de problemas resueltos).
4. Mirá `docs/cierres/` por si el tema fue resuelto en algún cierre ejecutivo.
5. Mirá `docs/RUNBOOK.md` si es un problema operativo.
6. Si nada de eso resuelve: anotalo como hallazgo nuevo en un PR, no lo resuelvas solo.

**Para Code específicamente:** si el prompt del sprint no contempla algo, **parar y avisar a Yair**. No improvisar fuera de scope.

---

## Lo que NO está en este repo

- **Datos productivos** (socios reales de Hindu, transacciones, etc.) — viven en Supabase, accesibles via dashboard.
- **Secretos de producción** — en Vercel Project Settings.
- **Roadmap estratégico cross-proyecto** (SCL holding, Fractional cLevel, Kontrol.ar) — en Google Drive del grupo SCL.
- **Documentación legal / fiscal** — en Drive SCL.
- **Métricas de uso de producción** — en Supabase logs + Vercel Analytics.

---

**Última actualización:** 26-may-2026 — Post PR #9 (docs alignment con sistema canónico de 17 docs).  
**Tag asociado:** próximo `v0.30.24.3-docs-alignment`.
