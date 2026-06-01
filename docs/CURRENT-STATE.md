# CURRENT-STATE — Estado vivo del proyecto SaaS Empresarial

**Última actualización**: 2026-05-28
**Sesión que la generó**: Housekeeping post bulk load Zoho (Code)
**Fuente de verdad**: este archivo. Drive es espejo de referencia.

> Este archivo se sobreescribe en cada cierre de sprint. Para histórico ver `docs/handoffs/` o Drive `_Cierre Ejecutivo/HANDOFF-YYYY-MM-DD`.

---

## 1. Snapshot ejecutivo

| Indicador | Valor |
|---|---|
| Tag git actual | `v0.37.0-housekeeping-killer-machine` |
| Próximo tag esperado | post F1.4.2 hotfix buscador Personas |
| Sprint activo | F1.4.2 — Hotfix buscador Personas server-side |
| Sesión última cerrada | 2026-05-28 — Killer Machine + Zoho bulk load + housekeeping repo |
| Fase actual del roadmap | F1 (Troncal núcleo ERP+CRM), módulo F1.4 (Eventos & Calendario) |

---

## 2. Tareas en cada estado (snapshot Zoho LE-8)

### En desarrollo (1)
- **F1.4.2** — SE1-T21 — A4.5.1 Hotfix buscador Personas server-side (50%, owner Code)
  - Bug raíz: prefetch con `limit(500)` deja 2.239 personas fuera. Combobox client-side.
  - Issue Zoho asociado: I-001 / SE1-I1

### En QA técnico (0)
- (vacío)

### QA humano — esperando smoke de Yair (1)
- **F1.4.1** — SE1-T20 — A4.5 Paridad eventos/planificadores (90%, Round 2)

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

**Total**: 88 tareas raíz + 2 subtareas + 1 issue cargadas el 28-may-2026.

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
| Anti-patrón `limit(500)` residual | Sigue vivo en `modules/pim/lib/queries.ts` y en 3 pages de Finanzas. Mismo patrón que el bug raíz de F1.4.2 (prefetch tope 500 + filtrado client-side), pero fuera del módulo Eventos. **NO es F1.4.2** (Eventos ya está limpio: `buscarPersonasEvento` server-side + dialog con debounce, sin `limit(500)` residual). | Detectado 01-jun-2026 (Code). Pendiente de materializar como issue en Zoho (Opus) + asignar a sprint. No tocar ahora. |

> Code detecta y anota acá; Opus lo replica a Zoho como issue formal. No se toca código fuera de scope del sprint activo.

---

## 4. Próximo paso natural

**Inmediato (días)**:
1. Code completa F1.4.2 hotfix buscador (50% -> 100%).
2. Code marca DONE técnico, pushea, avisa a Yair.
3. Yair smoke-testea crear-evento con búsqueda completa en `hindu-club.vercel.app`.
4. Opus mueve F1.4.2 a "terminado" en Zoho, cierra issue I-001.
5. Opus mueve F1.4.1 a "terminado" si el smoke de paridad también pasa.

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
