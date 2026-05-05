# Proximo Sprint: 8 — Páginas públicas + Branding + Pre-inscripción

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-7 completos + UX transversal.
**Proximo:** Sprint 8.

---

## Que hay que hacer en Sprint 8

### Objetivo
Páginas públicas de equipos/club, branding configurable por tenant, y flujo de pre-inscripción online.

### Entregables

#### 1. Páginas públicas /equipos/[id] (sin auth)
- Vista pública de equipo: nombre, categoría, disciplina, torneo, foto, plantel
- Solo datos que el admin marcó como públicos
- SEO friendly (metadata, og:image)
- Diseño responsive, mobile-first

#### 2. Branding Studio
- Configuración visual del tenant: logo, colores primario/secundario, nombre visible
- Preview en vivo de cómo se ve
- Se guarda en tabla `tenants` (campos: logo_url, color_primario, color_secundario, nombre_display)
- Se aplica a páginas públicas y exports PDF membretado

#### 3. Form pre-inscripción pública
- Form público accesible sin login
- Campos configurables por tenant (nombre, apellido, DNI, email, teléfono, disciplina, categoría, mensaje)
- Crea registro en tabla `pre_inscripciones` con estado `pendiente`
- Flujo admin: revisar, aprobar (crea persona), rechazar (con motivo)
- Estados: pendiente, aprobada, rechazada, vencida

#### 4. Tabla pre_inscripciones
- Migration con campos: datos del form, estado, motivo_rechazo, persona_id (si aprobada), reviewed_by, reviewed_at
- RLS por tenant

### Archivos relevantes
- `app/(public)/` — rutas sin auth
- `app/admin/` — panel admin
- `lib/export/template.ts` — ya usa branding para PDF membretado
- `components/layout/sidebar.tsx` — menú admin

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
Sprints 1-7:  ████████████████████████████████████ HECHO
Sprint 8:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- ESTAS ACA (landing, branding, pre-inscripcion)
Sprints 9-11: ░░░░░░░░░░░░░░░░░░ (cajas, operaciones, empleados)
Sprints 12-14:░░░░░░░░░░░░░░░░░░ (comunicaciones, API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening -> HINDU LIVE)
```
