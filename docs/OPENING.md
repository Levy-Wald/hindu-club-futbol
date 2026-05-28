# OPENING — Cómo arrancar una sesión en el sistema SaaS Empresarial

**Versión**: 1.0
**Fuente de verdad**: este archivo. Espejo Drive en `_Cierre Ejecutivo/OPENING`.
**Canonizado por**: ADR-064 (Killer Machine Operating Model) + ADR-065 (Nomenclatura F0-F10)

---

## 1. Propósito

Este archivo enseña a cualquier participante del sistema (humano o IA) cómo arrancar una sesión sin tener que reinventar contexto. La regla madre:

> No pidas que te expliquen el proyecto. Leé OPENING + CURRENT-STATE, y si necesitás profundidad, leé el último HANDOFF. En 5 minutos sabés dónde estamos.

Después de leer este archivo, tenés que ser capaz de operar dentro de las reglas y de saber dónde buscar lo que te falta.

---

## 2. Cómo arrancar según quién sos

### 2.1 Si sos Yair Levy Wald (CEO, decisión, QA humano)

No necesitás onboarding. Sabés todo. Este archivo está acá para que cuando quieras explicarle el sistema a alguien o a otra IA, tengas la versión canónica para mostrar.

Tu flujo recurrente:
1. Abrís chat Opus o Code nuevo
2. Decís "leé CURRENT-STATE + último HANDOFF, y arrancamos con X"
3. Opus o Code te responde alineado y no tenés que reexplicar nada

### 2.2 Si sos Claude Opus (especificación, ADRs, Drive, Zoho)

Orden de lectura al arrancar:
1. Memoria propia (`userMemories` cargados automáticamente)
2. Boot prompt fijo v3.1 (en `userPreferences` de Yair)
3. Drive `_Cierre Ejecutivo/CURRENT-STATE` — leer obligatorio
4. Drive `_Cierre Ejecutivo/HANDOFF-LOG/` — último archivo por fecha
5. Drive `_Arquitectura/ADR-064` y `_Arquitectura/ADR-065` — solo si no los tenés frescos
6. Zoho Projects LE-8 "SaaS Empresarial" — para verificar estado vivo de tareas si la sesión lo requiere

Reglas duras para vos:
- Solo escribís en Drive y Zoho vía MCP. Nunca toques repo.
- Para cambios en repo, redactás prompt para Code.
- Antes de cerrar sesión estratégica, actualizás CURRENT-STATE (vía prompt a Code) y creás HANDOFF nuevo en Drive.

### 2.3 Si sos Claude Code (implementación, repo, raíz compu)

Orden de lectura al arrancar:
1. `CLAUDE.md` del repo (root)
2. `docs/CURRENT-STATE.md` — leer obligatorio
3. `docs/handoffs/` — último archivo por fecha
4. `docs/OPERATING-MODEL.md` — si no lo tenés fresco
5. `docs/PHASES.md` — para nomenclatura F0-F10
6. `git log --oneline -20` — últimos 20 commits
7. `git tag --sort=-creatordate | head -5` — últimos 5 tags

Reglas duras para vos:
- Sos el único que escribe en repo y en la raíz compu.
- Antes de tagear un sprint cerrado, actualizás `docs/CURRENT-STATE.md` con el nuevo estado.
- Pre-tag obligatorio: auditoría arquitectónica (3 checks de ADR-061) + smoke funcional real en producción.
- Nada pasa a "terminado" en Zoho sin DONE visual confirmado por Yair. Tu rol es marcar "DONE técnico, esperando smoke humano".

### 2.4 Si sos humano nuevo (dev contratado, gerente, partner)

Orden de lectura al arrancar:
1. Este archivo (OPENING.md) — entero
2. Drive `_Arquitectura/ADR-064-killer-machine-operating-model` — modelo operativo del sistema
3. Drive `_Arquitectura/ADR-065-migracion-nomenclatura-fases-rosetta-stone` — vocabulario
4. Repo `docs/PHASES.md` o Drive `_Roadmap/PHASES` — las 11 fases F0-F10
5. Repo `docs/MODULE-CATALOG.md` o equivalente — qué módulos existen
6. Drive `_Cierre Ejecutivo/CURRENT-STATE` — estado de hoy
7. Zoho LE-8 "SaaS Empresarial" — para ver las tareas vivas

Tiempo estimado de onboarding: 60-90 minutos de lectura. Después podés operar.

### 2.5 Si sos IA externa con acceso MCP (otro modelo, otro asistente)

Orden de lectura:
1. Este archivo
2. ADR-064 y ADR-065 (Drive `_Arquitectura/`)
3. `docs/PHASES.md` del repo (o Drive `_Roadmap/PHASES`)
4. `CURRENT-STATE.md` (Drive `_Cierre Ejecutivo/`)
5. Tareas activas en Zoho LE-8

Operás con las mismas reglas que los humanos: respetar dueño de cada superficie (Zoho para tareas, Drive para docs, Repo para código), respetar DONE visual, no inventar datos.

---

## 3. Reglas operativas obligatorias (condensadas de ADR-064)

### 3.1 Las cuatro superficies y sus dueños de escritura

- **Zoho Projects** — fuente de verdad de tareas, estados, sprints, issues. Escriben: Opus (vía MCP) y Yair (UI).
- **Google Drive** — fuente de verdad de docs largos: ADRs, manuales, handoffs. Escriben: Opus (vía MCP) y Yair (UI).
- **Repo GitHub** — código + docs técnicos junto al código. Escribe: solo Code.
- **Raíz compu** (`/Users/yamirolw/hindu-v2`) — copia local del repo. Sincroniza con `git pull` y `git push` por Code.

### 3.2 Tridente humano-IA

- **Yair** — decide, valida, smoke-testea en producción.
- **Opus** — especifica, redacta ADRs/handoffs, opera Drive y Zoho.
- **Code** — implementa, opera repo y raíz.

### 3.3 Flow de estados Zoho

```
en desarrollo -> en qa (técnico) -> QA humano -> terminado
```

Nada pasa a "terminado" sin DONE visual confirmado por Yair en `hindu-club.vercel.app`.

### 3.4 Disciplina de cierre de sprint

- Code commitea + pushea + tagea (ningún sprint sin tag).
- Code actualiza `docs/CURRENT-STATE.md`.
- Opus mueve tareas correspondientes en Zoho.
- Si fue sesión estratégica: Opus crea `HANDOFF-YYYY-MM-DD.md` en Drive `_Cierre Ejecutivo`.

### 3.5 Prohibiciones absolutas

- Code no escribe en Drive ni Zoho.
- Opus no escribe en repo ni raíz.
- Nadie crea tareas Zoho sin que Yair haya pedido el sprint o el módulo.
- Nadie marca DONE sin validación humana cuando el síntoma reportado es visual o autenticado.
- Nadie usa nomenclatura vieja (FASE A-E, RTS, PBS, SPRINT-PLAN v3.0) como vocabulario activo. Solo F0-F10 (ADR-065).

---

## 4. Mapa rápido del sistema

```
Producto:     SaaS multivertical multitenant ERP+CRM+vertical
Piloto:       Hindu Club Fútbol (tenant 11111111-1111-1111-1111-111111111111)
Producción:   https://hindu-club.vercel.app
Tag actual:   ver CURRENT-STATE.md

Stack:        Next.js 16.2.x + Supabase + Vercel + Tailwind 4 + shadcn v4 + base-ui
Repo:         github.com/Levy-Wald/hindu-club-futbol
Raíz local:   /Users/yamirolw/hindu-v2

Zoho:         portal serviciosclevel
              project LE-8 "SaaS Empresarial"
              portal_id 918690668
              project_id 2651844000000411004

Drive root:   1cZVm440-tL7qgCmqe6ONDu26qvyprj98
  _Arquitectura:      1Z3uOrycHCe0GVdYBoLf1dETfBGDqIWZB
  _Roadmap:           1dBJcure2nbnmpezeSYF691hyZPNnogaD
  _Cierre Ejecutivo:  1MSr1Foh_2iRo0jUKC76qwX-9-GM1B-ty
  _Decisiones:        1-TL74xGh0oBsEp3CkiTsBKs3FzmnzvBx
```

---

## 5. Links de arranque rápido

- **CURRENT-STATE**: Drive `_Cierre Ejecutivo/CURRENT-STATE` (Doc) o Repo `docs/CURRENT-STATE.md`
- **Último HANDOFF**: Drive `_Cierre Ejecutivo/HANDOFF-YYYY-MM-DD` (Doc más reciente) o Repo `docs/handoffs/`
- **ADR-064** (Killer Machine): Drive `_Arquitectura/ADR-064-killer-machine-operating-model`
- **ADR-065** (Nomenclatura F0-F10): Drive `_Arquitectura/ADR-065-migracion-nomenclatura-fases-rosetta-stone`
- **PHASES**: Repo `docs/PHASES.md` o Drive `_Roadmap/PHASES`
- **Zoho proyecto**: https://projects.zoho.com/portal/serviciosclevel#zp/projects/2651844000000411004/

---

## 6. Cuándo modificar este archivo

OPENING.md es casi inmutable. Cambia cuando:
- Se agrega un rol nuevo al sistema (ej: nuevo tipo de IA con MCP, nuevo dev humano)
- Cambia una regla operativa de ADR-064
- Cambia la nomenclatura de ADR-065
- Cambia la estructura de superficies (ej: se agrega una 5a superficie)

Para todo lo demás (estado del trabajo, tareas, sprints, bloqueos), actualizar CURRENT-STATE.md, no este archivo.

---

Fin de OPENING.
