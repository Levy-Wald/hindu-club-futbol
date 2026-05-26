# 00 — Start Here

**Bienvenido al repositorio Hindu Club Fútbol / SaaS Modular Vertical (SMV) / Bundle ClubCore.**

Este archivo es el **único entry point** para cualquier persona o IA que aterrice acá sin contexto previo. Te dice por dónde empezar según tu rol.

---

## Elegí tu ruta

### Ruta A — Sos Claude Code (o cualquier IA ejecutora) y vas a arrancar un sprint

**Leé en este orden, parar al primer doc que te dé contexto suficiente:**

1. `CLAUDE.md` (raíz) — tag actual, próximo sprint, paths críticos, Drive.
2. `docs/CURRENT-STATE.md` — métricas reales del producto.
3. `docs/SPRINT-PLAN.md` — el sprint que vas a ejecutar, contextualizado en el roadmap.
4. El prompt específico del sprint — te lo pega Yair manualmente. Vive en Drive `_Sprints/` por convención.

**Reglas de oro para Code:**

- Antes de tocar código: leer `CLAUDE.md` + el prompt del sprint completo.
- Antes de commitear: typecheck + lint + build + tests deben pasar.
- Cerrar con: commit + push + tag semver + PR + smoke test producción.
- Si encontrás algo fuera del scope del sprint: **anotalo, no lo resuelvas**.
- Si la auditoría post-deploy falla: rollback inmediato, no parchear sobre la marcha.

ADR vinculantes para tu trabajo: `docs/adr/` (todos).

---

### Ruta B — Sos un dev humano nuevo en el equipo

**Plan de lectura primer día (2-3 horas total):**

1. Este archivo (`docs/00-START-HERE.md`) — 5 min.
2. `README.md` (raíz) — 10 min. Qué es el producto, cómo se levanta.
3. `docs/MASTER-PROJECT.md` — 30 min. Modelo conceptual: SMV → Bundles → Verticales → Módulos.
4. `docs/CURRENT-STATE.md` — 20 min. Qué está hecho, qué falta, dónde estamos.
5. `docs/DATA-MODEL.md` — 30 min. Las 169 tablas organizadas en capas.
6. `docs/MODULE-CATALOG.md` — 20 min. Los 91 módulos (37 productivos).
7. `docs/adr/ADR-INDEX.md` — 30 min. Lectura rápida de decisiones técnicas vinculantes.

**Setup local:** `README.md` sección "Cómo correr en local".

**Primera contribución sugerida:** elegir un Tier 4 de `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md` (deuda menor) y abrir PR.

---

### Ruta C — Sos QA externo y vas a auditar el sistema

**Plan de auditoría (1 día):**

1. `README.md` (raíz) — propuesta de valor y stack.
2. `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md` — auditoría arquitectónica más reciente.
3. `docs/audits/AUDIT-PATRONES-ARQUITECTONICOS-2026-05-26.md` — patrones.
4. `docs/audits/AUDIT-TESTING-CODEHEALTH-2026-05-26.md` — testing y code health.
5. `docs/audits/AUDIT-TS-STRICT-541-CLASIFICACION.md` — clasificación de errores TS.
6. Correr `pnpm typecheck && pnpm test && pnpm test:e2e` localmente.
7. Revisar 5 ADRs random de `docs/adr/` para validar trazabilidad de decisiones.
8. Revisar últimas 3 PRs mergeadas en GitHub.

**Smoke test producción:** https://hindu-club.vercel.app

---

### Ruta D — Sos inversor técnico evaluando el activo

**Plan de evaluación (2 horas):**

1. **Producto y modelo de negocio (15 min):**
   - `README.md` (raíz) — propuesta de valor.
   - `docs/MASTER-PROJECT.md` secciones 1-3 — visión SMV multi-vertical.

2. **Estado actual del producto (30 min):**
   - `docs/CURRENT-STATE.md` — métricas reales, qué funciona, qué falta.
   - `docs/MODULE-CATALOG.md` — 37/91 módulos. Validá que coincida con la realidad.

3. **Calidad técnica (45 min):**
   - `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md` — score 7.8/10 con deuda clasificada.
   - `docs/audits/AUDIT-TS-STRICT-541-CLASIFICACION.md` — 541 errores TS: 0% lógica, 100% mecánicos.
   - `docs/adr/` — leer 5 ADRs random para validar disciplina de decisiones.

4. **Roadmap y velocidad (15 min):**
   - `docs/SPRINT-PLAN.md` — 13 tramos, 410-470h restantes a producto comercial completo.
   - `docs/sprints/` — historial real de sprints ejecutados (validar velocidad).

5. **Riesgos (15 min):**
   - `docs/audits/` Tier 1 acciones — deuda crítica (~4-6h fix).
   - Sección "Bloqueantes legales" en `docs/CURRENT-STATE.md` — dependencia de CUIT SCL.

**Preguntas que respondés con esto:**

- ¿Es producto real o vaporware? → Mirá `hindu-club.vercel.app` + datos de Hindu cargados.
- ¿Hay deuda técnica oculta? → Auditoría declara 7.8/10 con 14 acciones documentadas.
- ¿El roadmap es realista? → SPRINT-PLAN tiene horas estimadas validadas contra historial real.
- ¿Hay dependencias críticas? → CUIT SCL en trámite IGJ (legal, no técnico).
- ¿Puede escalar a otros clientes? → Arquitectura multi-tenant nativa (no retrofit).

---

## Mapa de carpetas del repo

```
hindu-v2/
├── app/                       # Rutas Next.js (BO + Portal Cliente)
├── components/                # UI compartida
├── modules/                   # 37 módulos productivos
├── lib/                       # Utilidades + clientes Supabase
├── tests/                     # E2E (Playwright) + unit (Vitest)
├── supabase/                  # Migraciones + Edge Functions
├── docs/
│   ├── 00-START-HERE.md       # ESTE ARCHIVO
│   ├── MASTER-PROJECT.md      # Modelo conceptual
│   ├── CURRENT-STATE.md       # Estado actual
│   ├── SPRINT-PLAN.md         # Roadmap estratégico
│   ├── DATA-MODEL.md          # 169 tablas
│   ├── MODULE-CATALOG.md      # 91 módulos catalogados
│   ├── DECISIONS.md           # ADRs consolidados (ADR-001 a ADR-046)
│   ├── adr/                   # ADRs individuales (047+)
│   ├── rfcs/                  # RFCs (5 documentos)
│   ├── audits/                # Auditorías arquitectónicas
│   ├── cierres/               # Cierres ejecutivos de fases
│   ├── sprints/               # Historial sprints A + B-series
│   ├── pre-mortems/           # Análisis pre-ejecución
│   ├── navigation/            # Especificación Nav Universal
│   ├── templates/             # Templates de RFC, post-mortem, etc.
│   ├── verticales/ccbp/       # Documentación específica ClubCore
│   └── archive/               # Documentación histórica
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
| Idioma: **español** rioplatense | Documentación, commits, comentarios, copy. Código en inglés. |
| Voseo | Documentación operativa. Documentos formales (legal, propuestas) usan tuteo. |
| Commits: `tipo(scope): mensaje` | `feat(modules): agrega módulo eventos`, `fix(rls): corrige policy en tabla X`. |
| Branches: `feature/<descripción>` | `feature/docs-reorg`, `feature/b18-sidebar-universal`. |
| Tags: `v<sprint>.<subsprint>-<descripcion>` | `v0.30.24.1-docs-reorg`, `v0.30.25-b18-sidebar-universal`. |
| ADRs: numeración correlativa | `ADR-001`, `ADR-002`, ... formato canónico en `docs/templates/`. |
| RFCs: numeración correlativa | `RFC-001` a `RFC-005`. |

---

## Cuando algo no esté claro

1. Buscá en `docs/` con `grep -r "<keyword>" docs/`.
2. Buscá en GitHub Issues cerrados (historial de problemas resueltos).
3. Mirá `docs/cierres/` por si el tema fue resuelto en algún cierre ejecutivo.
4. Si nada de eso resuelve: anotalo como hallazgo nuevo en un PR, no lo resuelvas solo.

**Para Code específicamente:** si el prompt del sprint no contempla algo, **parar y avisar a Yair**. No improvisar fuera de scope.

---

## Lo que NO está en este repo

- **Datos productivos** (socios reales de Hindu, transacciones, etc.) — viven en Supabase, accesibles via dashboard.
- **Secretos de producción** — en Vercel Project Settings.
- **Roadmap estratégico cross-proyecto** (SCL holding, Fractional cLevel, Kontrol.ar) — en Google Drive del grupo SCL.
- **Documentación legal / fiscal** — en Drive SCL.
- **Métricas de uso de producción** — en Supabase logs + Vercel Analytics.

---

**Última actualización:** 26-may-2026 — Post Paso 2 (docs content update).  
**Tag asociado:** próximo `v0.30.24.2-docs-sync`.
