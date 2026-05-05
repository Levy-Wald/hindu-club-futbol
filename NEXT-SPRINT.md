# Proximo Sprint: 7 — Mi Perfil + Mi Equipo (vista jugador)

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. `docs/MENORES-TUTORES.md` — spec de menores/tutores (aplica a este sprint)
5. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-6 completos + UX transversal.
**Proximo:** Sprint 7.

---

## Que hay que hacer en Sprint 7

### Objetivo
Vistas personales para el usuario logueado: su perfil, sus equipos, y para tutores vista de hijos.

### Entregables

#### 1. Pagina /mi-perfil
- Datos personales del user logueado (read + edit limitado)
- Mis equipos (donde estoy asignado)
- Mis padrones
- Mis documentos medicos (upload a storage privado)

#### 2. Pagina /mi-equipo
- Vista segun rol del usuario (jugador, DT, staff)
- Jugador: ve su equipo, plantel, horarios, proximo entrenamiento
- DT/Staff: ve equipos que dirige, planteles, horarios
- Widgets: proxima actividad, referentes del equipo

#### 3. Vista de hijos para tutores
- Si el usuario tiene atributo padre_tutor, ver fichas de hijos
- Puede ver datos del hijo, equipo, horarios, documentos
- Puede editar datos del hijo (con limitaciones)
- Ver docs/MENORES-TUTORES.md para spec completo

#### 4. Vehiculos heredados (spec de menores)
- Al vincular padre->hijo, vehiculos del padre se auto-asignan
- Hijo ve vehiculos como "Vehiculo de [Padre]" (read-only)
- Requiere campo propietario_id y tipo en personas_vehiculos

#### 5. Validacion "menor necesita tutor"
- Menor sin tutor vinculado -> estado pendiente_revision
- No puede estar activo en equipo sin tutor

### Archivos relevantes
- `app/admin/personas/[id]/page.tsx` — ficha persona
- `app/admin/equipos/[id]/page.tsx` — detalle equipo
- `docs/MENORES-TUTORES.md` — spec completo

---

## Reglas importantes

1. **Verificar schema** antes de crear migrations
2. **shadcn v4 usa `render` prop**, NO `asChild`
3. **searchParams en Next.js 16** es `Promise<Record<string, string | undefined>>`
4. **TENANT_ID hardcodeado** = `'11111111-1111-1111-1111-111111111111'`
5. **Verificar build**: `pnpm build`
6. **PENDIENTE_VALIDACION_VISUAL** si no probaste visualmente
7. **Actualizar MASTER-GAPS.md** al terminar

---

## Vision global

```
Sprints 1-6:  ████████████████████████████████ HECHO
Sprint 7:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- ESTAS ACA (mi perfil, mi equipo)
Sprint 8:     ░░░░░░░░░░░░░░░░░░ (landing, branding, pre-inscripcion)
Sprints 9-11: ░░░░░░░░░░░░░░░░░░ (cajas, operaciones, empleados)
Sprints 12-14:░░░░░░░░░░░░░░░░░░ (comunicaciones, API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening -> HINDU LIVE)
```
