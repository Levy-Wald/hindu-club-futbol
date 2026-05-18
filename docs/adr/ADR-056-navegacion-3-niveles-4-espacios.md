# ADR-056: Navegación de 3 niveles con 4 espacios para SaaS Modular Vertical

**Status**: Accepted
**Date**: 2026-05-18
**Context**: Sprint B9 (FASE B' extendido)

## Decision

Implementar navegación de 3 niveles:

1. **Nivel 1 — Top bar (Espacios)**: 4 botones en la barra superior que representan modos de trabajo
2. **Nivel 2 — Sidebar (Módulos)**: sidebar lateral dinámico filtrado por triple intersección
3. **Nivel 3 — Tabs + Breadcrumbs**: navegación interna de cada módulo

## Los 4 espacios

| Espacio | Propósito | Frecuencia |
|---|---|---|
| Mi Día | Lo que el usuario atiende hoy | Cada visita |
| Operación | Trabajo diario/semanal (data entry, registros) | Diaria |
| Gestión | Visualización, decisión, reportes | Semanal |
| Setup | Configuración del tenant, usuarios, catálogos | Mensual o ad-hoc |

## Filtrado triple intersección

```
sidebar_items_visibles = SIDEBAR_CATALOG.filter(item =>
  item.espacio == espacio_activo
  AND (item.modulo_slug ∈ tenant_modulos_activos OR !item.modulo_slug)
  AND (item.capability_requerida ∈ user_capabilities OR !item.capability_requerida)
  AND (item.vertical_filter ∩ tenant_verticales ≠ ∅ OR !item.vertical_filter)
)
```

## Cmd+K Command Palette

Búsqueda global con `cmdk` (librería de Vercel). Cmd+K (Mac) / Ctrl+K (Windows) abre palette con todos los items del catálogo.

## Aplicación

Este sistema de navegación es universal para el SaaS Modular Vertical y funciona idéntico en cualquier vertical (CCBP, Country, Educativo, Retail, Servicios).

## Consequences

- El sidebar viejo fue reemplazado completamente (sin modo compat)
- ~40 items mapeados en SIDEBAR_CATALOG para Hindu (47 módulos activos)
- Sub-pages de módulos (Finanzas sub-items, RRHH sub-items, etc.) se navegan internamente
- Espacios visibles según capabilities del usuario
- Estado del espacio activo persistido en cookie
