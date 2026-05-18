# ADR-057 — Navegacion universal con acciones condicionales

**Estado:** Aceptado
**Fecha:** 2026-05-18
**Sprint:** B10

## Contexto

El sistema tiene una unica navegacion para todos los usuarios.
No existe un "modo admin" vs "modo usuario". La diferencia entre
un administrador y un usuario regular es la **visibilidad de
acciones** condicionada por capabilities.

## Decision

1. **UNA sola navegacion** — Todos los usuarios ven la misma
   estructura de sidebar/spaces. Los items se filtran por
   capabilities (ya implementado en B9 con `filterItems`).

2. **Acciones condicionales por capability** — Los botones de
   accion (crear, editar, eliminar, importar, exportar) se
   envuelven en `<CapabilityGate>`, un componente cliente que
   lee del `CapabilitiesContext`.

3. **Mi perfil = /personas/[id]** — No existe una pagina
   separada de "Mi perfil". El avatar en TopBar navega a
   `/admin/personas/{personaId}`, la misma ficha de persona,
   con acciones condicionadas por capabilities.

4. **Dashboard dinamico (Mi Dia)** — Los widgets del dashboard
   se filtran por `shouldShowWidget()` que evalua atributos y
   capabilities del usuario. Cada usuario ve solo los widgets
   relevantes a su rol.

5. **Capabilities validadas contra catalogo** — Todos los slugs
   usados en `CapabilityGate` y widget conditions deben existir
   en `catalogo_capabilities`. ADR-036 (dot-notation) aplica.

## Consecuencias

- Un solo codebase de navegacion para mantener
- Los capabilities determinan que ve cada usuario, no rutas separadas
- Nuevas acciones requieren un capability en el catalogo antes de usarse
- El dashboard se auto-adapta a cada perfil sin configuracion manual
