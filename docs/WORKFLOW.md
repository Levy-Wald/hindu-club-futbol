# Workflow de desarrollo

## Prompt base (inicio de sesion)

Al comenzar cualquier sesion de trabajo, el agente debe:

1. Leer `CLAUDE.md` (cargado automaticamente)
2. Leer `MASTER-GAPS.md` para contexto de pendientes
3. Leer `NEXT-SPRINT.md` para saber que hacer ahora
4. Leer docs relevantes segun la tarea:
   - Cambios de UI → `docs/UI-UX.md` + `docs/DESIGN-SYSTEM.md`
   - Paginas publicas → `docs/BRAND-DESIGN-SYSTEM.md`
   - Cambios de DB/queries → `docs/POSTGRES.md`
   - Cambios de estructura → `docs/ARCHITECTURE.md`
   - Nuevos modulos → `docs/ARCHITECTURE.md` + `docs/PROPUESTA-ARQUITECTONICA.md`
   - Decisiones arquitectonicas → `docs/PROPUESTA-ARQUITECTONICA.md`
   - Pre-mortem de plan → `docs/SKILL-CHALLENGE.md`
   - Estado de seguridad DB → `docs/REPORTE-CLEANUP-POST-SPRINT11.md`

## Checklist pre-feature (SaaS)

Antes de implementar cualquier feature nueva:

- [ ] Necesita migracion? (nueva tabla o columna)
- [ ] Necesita RLS? (si toca la DB, que policies aplican)
- [ ] Es multi-tenant? (tiene `tenant_id`?)
- [ ] Scope: persona, equipo, padron, o tenant?
- [ ] Afecta auth/permisos? (necesita atributo nuevo?)
- [ ] Tiene exportacion? (estandar en todos los modulos)
- [ ] Tiene eliminacion? (soft-delete con AlertDialog, proteccion financiera)
- [ ] Tiene upload de archivos? (specs de formato/peso/dimensiones visibles)
- [ ] Patron de modulo existente aplica? (queries/actions/components)
- [ ] Tabla nueva usa prefijo de modulo? (ver convencion en PROPUESTA-ARQUITECTONICA.md)

## Durante el desarrollo

- Seguir el patron de modulo existente (queries, actions, components).
- No inventar patrones nuevos sin justificacion documentada.
- Si algo no encaja en los patrones existentes, documentarlo.
- Commits atomicos: una funcionalidad = un commit.
- Server Components por defecto. `'use client'` solo con: useState, useEffect, onClick, onChange.
- `Promise.all` para queries independientes en paralelo.
- Select solo columnas necesarias en listas (no `select('*')`).
- shadcn v4: usar `render` prop, NO `asChild`.

## Verificacion post-desarrollo

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
Reportar errores de tipo. Arreglar los criticos.

### 3. Seguridad rapida
Verificar que no haya:
- `console.log` en codigo de produccion
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
- [ ] No hay `any` sin justificacion
- [ ] Server Components donde se pueda, Client solo donde se necesita
- [ ] Mutations con `revalidatePath`
- [ ] UI responsive (mobile + desktop)
- [ ] Estados vacios manejados
- [ ] Toasts de feedback
- [ ] Migraciones siguen checklist de `docs/POSTGRES.md`
- [ ] RLS policies si hay tablas nuevas
- [ ] Eliminacion con AlertDialog + proteccion financiera si aplica
- [ ] Uploads con specs visibles
- [ ] MASTER-GAPS actualizado

## Al finalizar (ABM de docs)

Despues de completar trabajo significativo:

1. **MASTER-GAPS.md** — Marcar items completados, agregar nuevos si surgieron.
2. **NEXT-SPRINT.md** — Actualizar si cambia el proximo paso.
3. **docs/** — Si se establecio un patron nuevo o se tomo una decision arquitectonica, documentarla.
4. **README.md** — Si se agrego un modulo nuevo o cambio la estructura, actualizarlo.

## Documentos de referencia

| Documento | Cuando consultarlo |
|-----------|-------------------|
| `CLAUDE.md` | Siempre (se carga automaticamente) |
| `MASTER-GAPS.md` | Inicio de sesion, fin de sesion |
| `NEXT-SPRINT.md` | Inicio de sesion |
| `docs/PROPUESTA-ARQUITECTONICA.md` | Decisiones de diseno, nuevos modulos, convenciones |
| `docs/REPORTE-CLEANUP-POST-SPRINT11.md` | Estado de seguridad de la DB |
| `docs/ARCHITECTURE.md` | Estructura de capas, patron de modulo |
| `docs/POSTGRES.md` | Migraciones, RLS, indices |
| `docs/UI-UX.md` | Patrones React, responsive, shadcn v4 |
| `docs/DESIGN-SYSTEM.md` | Colores, tipografia, componentes |
| `docs/BRAND-DESIGN-SYSTEM.md` | Paginas publicas, branding |
| `docs/SKILL-CHALLENGE.md` | Pre-mortem antes de planes complejos |

## Reglas de sprint

- Sprint = 1 funcionalidad bien terminada.
- No avanzar al siguiente sprint sin validacion de Yair.
- Marcar `PENDIENTE_VALIDACION_VISUAL` en lo que no se pudo probar end-to-end.
- Cada sprint cierra con: codigo + UI + RLS + docs actualizados.

## Deploy

1. `pnpm build` local (verificar que compila)
2. `git push origin main` (Vercel auto-deploys desde main)
3. Verificar en `hindu-club.vercel.app` que el deploy fue exitoso
4. Si hay cambios de DB: aplicar migrations via Supabase dashboard o CLI

## Preparacion para conexion externa

### API REST (Sprint 13+)
- Route handlers en `app/api/v1/` que llaman las mismas query functions.
- Autenticacion via API key (tabla `api_keys` con tenant_id).
- Rate limiting por key.

### MCP Server (Sprint 13+)
- Queries en `_lib/queries.ts` son funciones puras → se wrappean como MCP tools sin refactor.
- Actions en `_actions.ts` son mutations autocontenidas.

### Webhooks (Sprint 13+)
- Triggered desde server actions despues de mutations exitosas.
- Eventos: persona_creada, cuota_pagada, movimiento_registrado, etc.

### WhatsApp Business (Sprint 16+)
- Ventana de 24hs: mensajes fuera de ventana requieren templates aprobados por Meta.
- Numeros en formato E.164: +54 para Argentina.
