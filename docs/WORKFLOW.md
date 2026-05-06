# Workflow de desarrollo

## Prompt base (inicio de sesión)

Al comenzar cualquier sesión de trabajo, el agente debe:

1. Leer `CLAUDE.md` (cargado automáticamente)
2. Leer `MASTER-GAPS.md` para contexto de pendientes
3. Leer docs relevantes según la tarea:
   - Cambios de UI → `docs/UI-UX.md` + `docs/DESIGN-SYSTEM.md`
   - Páginas públicas → `docs/BRAND-DESIGN-SYSTEM.md`
   - Cambios de DB/queries → `docs/POSTGRES.md`
   - Cambios de estructura → `docs/ARCHITECTURE.md`
   - Nuevos módulos → `docs/ARCHITECTURE.md`
   - Pre-mortem de plan → `docs/SKILL-CHALLENGE.md`
   - Menores/tutores → `docs/MENORES-TUTORES.md`

## Checklist pre-feature (SaaS)

Antes de implementar cualquier feature nueva:

- [ ] Necesita migración? (nueva tabla o columna)
- [ ] Necesita RLS? (si toca la DB, qué policies aplican)
- [ ] Es multi-tenant? (tiene `tenant_id`?)
- [ ] Scope: persona, equipo, padrón, o tenant?
- [ ] Afecta auth/permisos? (necesita atributo nuevo?)
- [ ] Tiene exportación? (estándar en todos los módulos)
- [ ] Tiene eliminación? (soft-delete con AlertDialog, protección financiera)
- [ ] Tiene upload de archivos? (specs de formato/peso/dimensiones visibles)
- [ ] Patrón de módulo existente aplica? (queries/actions/components)

## Durante el desarrollo

- Seguir el patrón de módulo existente (queries, actions, components).
- No inventar patrones nuevos sin justificación documentada.
- Si algo no encaja en los patrones existentes, documentarlo.
- Commits atómicos: una funcionalidad = un commit.
- Server Components por defecto. `'use client'` solo con: useState, useEffect, onClick, onChange.
- `Promise.all` para queries independientes en paralelo.
- Select solo columnas necesarias en listas (no `select('*')`).
- shadcn v4: usar `render` prop, NO `asChild`.

## Verificación post-desarrollo

Correr antes de entregar:

### 1. Build
```bash
pnpm build
```
Si falla, PARAR y arreglar antes de continuar.

### 2. Tipos
```bash
npx tsc --noEmit
```
Reportar errores de tipo. Arreglar los críticos.

### 3. Seguridad rápida
Verificar que no haya:
- `console.log` en código de producción
- Keys o tokens hardcodeados
- `SUPABASE_SERVICE_ROLE_KEY` expuesto en client components
- Inputs de usuario sin sanitizar en queries

### 4. Diff review
```bash
git diff --stat
```
Revisar cada archivo modificado por cambios no intencionales.

## Checklist pre-entrega

- [ ] `pnpm build` sin errores
- [ ] No hay `any` sin justificación
- [ ] Server Components donde se pueda, Client solo donde se necesita
- [ ] Mutations con `revalidatePath`
- [ ] UI responsive (mobile + desktop)
- [ ] Estados vacíos manejados
- [ ] Toasts de feedback
- [ ] Migraciones siguen checklist de `docs/POSTGRES.md`
- [ ] RLS policies si hay tablas nuevas
- [ ] Eliminación con AlertDialog + protección financiera si aplica
- [ ] Uploads con specs visibles
- [ ] MASTER-GAPS actualizado

## Al finalizar (ABM de docs)

Después de completar trabajo significativo:

1. **MASTER-GAPS.md** — Marcar items completados, agregar nuevos si surgieron.
2. **docs/** — Si se estableció un patrón nuevo o se tomó una decisión arquitectónica, documentarla.
3. **README.md** — Si se agregó un módulo nuevo o cambió la estructura, actualizarlo.

## Reglas de sprint

- Sprint = 1 funcionalidad bien terminada.
- No avanzar al siguiente sprint sin validación de Yair.
- Marcar `PENDIENTE_VALIDACION_VISUAL` en lo que no se pudo probar end-to-end.
- Cada sprint cierra con: código + UI + RLS + docs actualizados.

## Deploy

1. `pnpm build` local (verificar que compila)
2. `git push origin main` (Vercel auto-deploys desde main)
3. Verificar en `hindu-club.vercel.app` que el deploy fue exitoso
4. Si hay cambios de DB: aplicar migrations via Supabase dashboard o CLI

## Preparación para conexión externa

### API REST (Sprint 13+)
- Route handlers en `app/api/v1/` que llaman las mismas query functions.
- Autenticación via API key (tabla `api_keys` con tenant_id).
- Rate limiting por key.

### MCP Server (Sprint 13+)
- Queries en `_lib/queries.ts` son funciones puras → se wrappean como MCP tools sin refactor.
- Actions en `_actions.ts` son mutations autocontenidas.

### Webhooks (Sprint 13+)
- Triggered desde server actions después de mutations exitosas.
- Eventos: persona_creada, cuota_pagada, movimiento_registrado, etc.

### WhatsApp Business (Sprint 16+)
- Ventana de 24hs: mensajes fuera de ventana requieren templates aprobados por Meta.
- Números en formato E.164: +54 para Argentina.
