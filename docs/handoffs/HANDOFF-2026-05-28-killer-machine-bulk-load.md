# HANDOFF — Killer Machine + Zoho Projects bulk load completo
## 28-may-2026 — Cierre Ejecutivo

---

## 1. Propósito de este documento

Cierre de sesión Opus tras completar el bulk load del proyecto SaaS multivertical en Zoho Projects. Este documento es boot context reproducible para próxima sesión Opus: contiene IDs definitivos, estado actual del Killer Machine, pendientes diferidos, y próximo paso natural.

Si abrís un chat Opus nuevo después de hoy, pegale esto al inicio y arrancás sin rework.

---

## 2. Qué se hizo en esta sesión

### 2.1 Resolución del bug MCP de Zoho (background)
Sesiones previas: el MCP genérico "Zoho Projects" de claude.ai devolvía error 6504 "Domain Not Available". Causa raíz descubierta: el portal de Zoho de Yair fue renombrado múltiples veces (yamiros -> levywald -> serviciosclevel) y el MCP genérico tenía cacheado un subdomain caído.

Solución (ejecutada por Yair en mcp.zoho.com): creó MCP server dedicado llamado "Projects" que apunta directo al portal real vía subdomain `projects-919162352.zohomcp.com`. URL completa del MCP: `https://projects-919162352.zohomcp.com/mcp/00b50f9443608d2795b270794d6f7f5e/message`.

### 2.2 Bulk load del proyecto SaaS multivertical
Vía MCP nuevo se cargaron en Zoho Projects:

- 1 proyecto: LE-8 "SaaS Empresarial"
- 11 phases F0-F10 (nomenclatura canónica ADR-065)
- 10 tasklists (uno por phase, F4 vacía porque es operacional humana)
- 88 tareas raíz con descripciones completas (DoD, elementos del módulo, roles, owner, alcance, etiquetas, dependencias, estado actual)
- 2 subtareas bajo F1.4 (F1.4.1 paridad eventos/planificadores en QA, F1.4.2 hotfix buscador Personas en desarrollo)
- 1 issue I-001 / SE1-I1 (buscador Personas no carga todas, vinculado a F1 vía affected_milestone, gravedad Alto)

Total: 113 entidades cargadas.

### 2.3 Distribución de tareas por phase

| Phase | Nombre | Tareas |
|-------|--------|--------|
| F0 | Base / Infra | 5 |
| F1 | Troncal núcleo ERP+CRM | 14 + 2 subtareas |
| F2 | Vertical CCBP (Hindu deportivo) | 26 |
| F3 | Portal Cliente | 1 |
| F4 | Validación Hindu (operacional humana) | 0 |
| F5 | Switch a producción (conectores reales) | 11 |
| F6 | Premium ERP | 6 |
| F7 | Premium Socio (engagement + revenue) | 9 |
| F8 | Verticales nuevas (Arquitectura/Retail/Country/Abogacía/Publicidad) | 7 |
| F9 | IA y Plataforma SaaS | 2 |
| F10 | Backlog futuro | 7 |
| **TOTAL** | | **88 raíz + 2 subtareas** |

---

## 3. IDs definitivos del proyecto en Zoho

```
portal_id:        918690668
portal_name:      serviciosclevel
project_id:       2651844000000411004
project_key:      LE-8
project_name:     SaaS Empresarial
owner_zpuid:      2651844000000088003   (Yair)
owner_zuid:       897891337             (Yair)
MCP server URL:   https://projects-919162352.zohomcp.com/mcp/00b50f9443608d2795b270794d6f7f5e/message
```

### 3.1 Milestone IDs por phase

```
F0  — Base / Infra                      2651844000000408017
F1  — Troncal núcleo ERP+CRM            2651844000000413001
F2  — Vertical CCBP (Hindu deportivo)   2651844000000414001
F3  — Portal Cliente                    2651844000000414004
F4  — Validación Hindu                  2651844000000411080
F5  — Switch a producción               2651844000000408020
F6  — Premium ERP                       2651844000000401003
F7  — Premium Socio                     2651844000000411083
F8  — Verticales nuevas                 2651844000000408023
F9  — IA y Plataforma SaaS              2651844000000401006
F10 — Backlog futuro                    2651844000000413004
```

### 3.2 Tasklist IDs

```
Tareas F0   2651844000000414007
Tareas F1   2651844000000413007
Tareas F2   2651844000000411095
Tareas F3   2651844000000411104
Tareas F5   2651844000000411105
Tareas F6   2651844000000411112
Tareas F7   2651844000000414028
Tareas F8   2651844000000414031
Tareas F9   2651844000000408081
Tareas F10  2651844000000414036
```

### 3.3 Task IDs críticos para referencia futura

```
F1.4  Eventos & Calendario (padre de subtareas)   2651844000000411089
  +-- F1.4.1 Paridad eventos/planificadores         2651844000000408039  (en qa)
  +-- F1.4.2 Hotfix buscador Personas server-side   2651844000000408041  (en desarrollo)
I-001 Buscador Personas crear-evento (SE1-I1)      2651844000000408084
```

### 3.4 URLs útiles

```
Proyecto:    https://projects.zoho.com/portal/serviciosclevel#zp/projects/2651844000000411004/
Issue I-001: https://projects.zoho.com/portal/serviciosclevel#zp/projects/2651844000000411004/bugs/2651844000000408084
```

---

## 4. Killer Machine — estado actual

### 4.1 Arquitectura operativa (ADR-064)

Cuarteto:
- **Zoho Projects** — verdad operativa de tareas, estados, issues
- **Google Drive** — docs largos, ADRs, handoffs, decisiones canonizadas
- **Repo GitHub** — código + docs técnicos en `/docs/`
- **Raíz compu** — `/Users/yamirolw/hindu-v2`

### 4.2 Tridente humano-IA

- **Yair** — decisión, QA humano, smoke tests visuales en producción
- **Opus** — especificación, ADRs, prompts, escritura en Drive + Zoho vía MCP, nunca toca repo
- **Code** — todo desarrollo, escritura en repo + raíz, smoke técnico pre-tag

### 4.3 Flow de estados (Zoho)

```
en desarrollo -> en qa (técnico) -> QA humano (Yair revisa) -> terminado
```

Regla dura: nada pasa a "terminado" sin DONE visual confirmado por Yair en producción `hindu-club.vercel.app`. Code marca "DONE técnico, esperando smoke humano" y no tagea hasta confirmación.

---

## 5. Stack técnico actual

```
Frontend:    Next.js 16.2.x, Tailwind 4, shadcn v4, base-ui
Backend:     Supabase (project hkoizqbptwhnepzbmjql)
Hosting:     Vercel (prj_sH5WIGNfNGo5tXxyTVvQaEfBDyBk, team team_clOmQCObDDN8okRHBc4wRhZ9)
Repo:        github.com/Levy-Wald/hindu-club-futbol
Producción:  hindu-club.vercel.app
Tag actual:  v0.37.0-housekeeping-killer-machine
```

Tenant pilot Hindu Club Fútbol: UUID `11111111-1111-1111-1111-111111111111`.
Yair persona_id Supabase: `3d2d5902-9c10-4154-8086-316b0fbe081e`.
E2E user: `e2e-test@levywald.com` / `Hindu2026!`

---

## 6. Pendientes diferidos (no bloqueantes)

1. **134 dependencias entre tareas** — no se cargaron en bulk por costo de calls. CSV de referencia disponible. Se pueden cargar dedicado o ir agregándolas a demanda cuando se trabaje cada tarea.

2. **Severity del issue I-001** — quedó en "Ninguno" porque no pasé el severity_id correcto. La info "Gravedad: Alto" está en la descripción del issue. Fix: descubrir severity_ids del portal vía API y `updateIssue`.

3. **Sub-estados custom** ("QA humano", "revisar", "analizado", "en qa", "en desarrollo", "diseño sin código", "suspendido momentáneamente") — embebidos como `Estado actual: X` al final de cada descripción. Se pueden materializar como custom statuses reales en Project Settings -> Status Workflow, después script de `updateTask` masivo.

4. **Duración en horas** de las 2 subtareas (F1.4.1: 4h, F1.4.2: 2h) — quedó en descripción porque Zoho rechazó el formato `{value, type}` en duration. Se arregla cuando descubramos el formato correcto.

5. **Repo->Drive sync automático** — sigue manual. Opus sube vía Google Drive MCP cuando hace falta. TODO post-F4.

---

## 7. Próximo paso natural

Cuando Code termine F1.4.2 (hotfix buscador Personas server-side):

1. Code marca DONE técnico
2. Push + deploy Vercel
3. Yair hace smoke humano del crear-evento con búsqueda completa
4. Si OK: Opus mueve F1.4.2 en Zoho de "en desarrollo" -> "terminado", cierra issue I-001 (SE1-I1)
5. Tag retroactivo si no se hizo
6. Avanzar con el siguiente módulo según prioridad

A mediano plazo, el resto de los DONE visuales (mayoría de F0-F2 que están en estado "QA humano" 80-95%) van validándose módulo por módulo en sesiones de validación con Yair, moviendo cada tarea por el workflow Zoho.

---

## 8. Restricciones operativas vigentes (no olvidar)

- **Yair no corre dev local.** Smoke testing solo sobre producción `hindu-club.vercel.app`. Nunca sugerir `npm run dev`, localhost, `.env.local`.
- **Vercel preview URLs no se pueden smoke-testear** por Yair: magic link auth redirige a producción.
- **No cargar más data de Hindu.** Yair ya cargó todo lo disponible. Resto al ciclo de validación real.
- **NUNCA blasts/smoke contra personas reales de Hindu.** Datos sintéticos o esperar validación.
- **Credenciales externas bloqueadas** (Resend, MercadoPago, AFIP CUIT Hindu, dominios Hindu, emails Hindu): mock-first activo, switch a producción en F5.
- **Pre-tag mandatorio cada sub-sprint:** auditoría arquitectónica 3 checks (FKs solo a troncal/catálogo, RLS+triggers+soft-delete completos, drift TS<->BD), + smoke funcional real de cada modal/CRUD nuevo (no solo happy path).
- **Sprint tagging:** ningún sprint nuevo arranca sin que el anterior esté commiteado, pusheado y taggeado.

---

## 9. ADRs canonizados relevantes

- **ADR-035** Mock-first architecture (Resend/MercadoPago/WhatsApp/AFIP en mock hasta F5)
- **ADR-061** Supabase JS client devuelve null silencioso al seleccionar columnas inexistentes
- **ADR-064** Killer Machine Operating Model (Zoho+Drive+Repo+Raíz + tridente)
- **ADR-065** Nomenclatura F0-F10 (reemplaza FASE A-E vieja, RFC-005 v2.0 y SPRINT-PLAN v3.0)

Drive folders:
```
Root:               1cZVm440-tL7qgCmqe6ONDu26qvyprj98
_Arquitectura:      1Z3uOrycHCe0GVdYBoLf1dETfBGDqIWZB
_Roadmap:           1dBJcure2nbnmpezeSYF691hyZPNnogaD
_Cierre Ejecutivo:  1MSr1Foh_2iRo0jUKC76qwX-9-GM1B-ty
_Decisiones:        1-TL74xGh0oBsEp3CkiTsBKs3FzmnzvBx
```

---

## 10. Aprendizajes técnicos Zoho MCP (para próxima sesión)

- `getAllPortals` devuelve portal_id real sin parámetros; usarlo primero al conectar nuevo MCP de Zoho
- `createTaskList` con campo `Milestone` en body NO asocia milestone (queda en "None"); requiere `updateTaskList` post con `milestone.id`
- `createPhase` rechaza `flag: "Internal"` mayúscula; omitir el campo
- `createTask` priority debe ser lowercase (`high`/`medium`/`low`/`none`)
- `createTask` requiere `tasklist.id` obligatorio (no se puede crear directo bajo phase/milestone)
- `createTask` duration con formato `{value, type}` a veces es rechazada con `INVALID_PARAMETER_VALUE`; fallback: omitir y poner duración en descripción
- Rate limit Zoho API: 100 calls/2min
- Prefix automático: `SE1-TN` (tasks), `SE1-IN` (issues), donde N es secuencial dentro del proyecto

---

Fin del handoff.
