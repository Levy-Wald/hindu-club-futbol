# Cierre Bloque B12.3-B12.7 — Smoke Fixes Pre-FASE C

Fecha: 19 de mayo de 2026
Tags: v0.30.14 a v0.30.17
Duración: ~7.5h Code en 1 día

## Resumen ejecutivo

Bloque de 5 sub-sprints encadenados que resolvieron problemas user-facing
detectados durante smoke testing humano post-B12. Los bugs iban desde
columnas DB mal nombradas en queries hasta wrappers de shadcn/ui que no
pasaban children a los Radix primitives.

## Tabla cronológica

| Sprint | Problema | Causa raíz | Fix | Tag | Lección |
|---|---|---|---|---|---|
| B12.3 | Sidebar incompleto, dropdown hydration, mi-cuenta 500 | Sidebar manual desactualizado, dropdown Base UI, .single() sin deleted_at | SIDEBAR_CATALOG 103 items, migración a @radix-ui, .maybeSingle() | v0.30.14 | Sidebar debe ser auditable contra filesystem |
| B12.4.1 | 7 items sidebar apuntan a 404 | Items marcados activo sin page.tsx | Audit + flag proximamente | v0.30.15 | Mantener sync estado↔filesystem |
| B12.4.2 | Items proximamente navegan a 404 | No existía patrón para items sin página | Modal ProximamenteModal | v0.30.15 | Patron modal para features futuras |
| B12.4.3 | mi-cuenta muestra "No se encontró tu perfil" | Marcado DONE sin verificar en producción | Falso DONE — fix real en B12.5 | — | NUNCA marcar DONE visual sin smoke humano |
| B12.4.4 | mi-equipo muestra equipos secuencialmente | UX confusa con N equipos | shadcn Tabs (1=directo, 2+=tabs) | v0.30.15 | — |
| B12.4.5 | Espacio "Mi Día" confuso | Nombre no intuitivo | Rename a "Inicio" + reordenar espacios | v0.30.15 | — |
| B12.5.1 | mi-cuenta query devuelve null silenciosamente | 4 columnas inexistentes: foto_url, dni, email, telefono | Mapear a columnas reales: foto_perfil_url, numero_documento, email_principal, telefono_principal | v0.30.16 | Supabase client silencia columnas inexistentes |
| B12.5.2 | Avatar dropdown sin links Mi cuenta/Mi equipo | Links faltantes | Agregar links al dropdown existente | v0.30.16 | — |
| B12.6 | Avatar NO aparece en producción | DropdownMenuTrigger wrapper desestructura children pero no lo pasa al Radix primitive | Fix wrapper + nuevo UserAvatarMenu.tsx dedicado | — | Auditar wrappers shadcn que usen render prop pattern |
| B12.7 | Items del dropdown vacíos (Mi perfil, etc.) | DropdownMenuItem mismo bug que Trigger | Agregar {children} al return sin render | v0.30.17 | Mismo bug puede propagarse a N wrappers |

## Lecciones aprendidas críticas

### 1. Patrón "falso DONE"
Code marcaba DONE sin verificar visualmente en producción cuando el
síntoma era visual/autenticado. B12.4.3 es el caso canónico: "verificado
que la query es correcta" cuando el problema real era columnas DB
inexistentes que Supabase client silenciaba.

**Regla nueva:** "DONE visual" = Yair confirma haber visto en producción.
"DONE técnico" = build + queries OK pero sin smoke humano. Code debe
distinguir explícitamente en el reporte de cierre.

### 2. Bug en wrappers shadcn v4 con render prop pattern
El proyecto usa wrappers custom en components/ui/* que agregan una prop
`render` para el patrón asChild de shadcn v4. Cuando la función
desestructura `{ children, ...props }` y la rama sin `render` pasa solo
`{...props}`, children se pierde porque fue sacado del spread.

**Afectados:** DropdownMenuTrigger (B12.6), DropdownMenuItem (B12.7).
**Auditoría:** 12 wrappers revisados, solo estos 2 tenían el bug.
**Regla nueva:** Antes de un tag importante, auditar que todos los
wrappers que desestructuran children los pasen en TODAS las ramas.

### 3. Drift TS-BD silenciado por Supabase client
Cuando una query de Supabase selecciona columnas que no existen en la
tabla, el client devuelve null sin error (no lanza excepción). Esto
hace que bugs de naming pasen build, tsc, y tests — solo fallan en
runtime con datos reales.

**Documentado en:** ADR-061

### 4. Smoke humano obligatorio post-deploy
Code no tiene sesión autenticada en producción. No puede verificar HTML
de páginas que requieren login. Todo cambio UI autenticado debe pasar
por smoke humano de Yair antes de marcar DONE visual.

## Métricas del bloque

- Commits: 12
- Tags: 4 (v0.30.14, v0.30.15, v0.30.16, v0.30.17)
- Archivos creados: 4 (ProximamenteModal, equipos-tabs, UserAvatarMenu, este cierre)
- Archivos modificados: ~15
- Bugs encontrados en producción: 8
- Bugs que build/tsc NO detectaron: 3 (columnas inexistentes, children faltantes x2)
