# ADR-060 — Sidebar catalog con 3 capas y estado

**Estado:** ACCEPTED
**Fecha:** 2026-05-18
**Sprint:** B12

## Contexto

El sidebar catalog original (B9/B11) tenia 55 items sin clasificacion por capa arquitectonica ni indicacion de estado de implementacion. Esto dificultaba:
- Saber que items pertenecen a la vertical CCBP vs troncal vs cross-vertical
- Distinguir paginas reales de placeholders
- Filtrar items por vertical cuando el tenant no tiene esa vertical activa

## Decision

Cada `SidebarItem` ahora incluye:

- **`capa`**: `'troncal' | 'cross_vertical' | 'vertical_ccbp'` — alineado con `catalogo_capabilities.capa`
- **`estado`**: `'activo' | 'proximamente'` — indica si la pagina tiene funcionalidad real o es placeholder

### Clasificacion por capa

| Capa | Ejemplos | Criterio |
|------|----------|----------|
| troncal | Personas, Finanzas, Setup, PIM | Core del SaaS, todos los tenants |
| cross_vertical | Acceso, Reservas, RRHH, Concesiones, Asistencias | Compartido entre verticales |
| vertical_ccbp | Equipos, Competencias, Salud, Scouting, Entrenamientos | Exclusivo Club/Country/Barrio/Polo |

### Clasificacion por estado

- **activo**: Pagina construida con funcionalidad real
- **proximamente**: Placeholder con componente `PlaceholderProximamente`. El item aparece en sidebar con badge "Pronto" y opacidad reducida

### Componente PlaceholderProximamente

Componente reutilizable en `components/placeholder-proximamente.tsx` que reemplaza los 15 placeholders ad-hoc de B11. Recibe `titulo` y `descripcion` opcional.

## Consecuencias

- El sidebar muestra visualmente que items estan en desarrollo (badge "Pronto")
- Futuro filtro por vertical puede excluir items `vertical_ccbp` para tenants no-CCBP
- Admin bypass (B12 PARTE 1) aplica sobre `userAttributes`, no sobre capabilities
- No se removieron items — los 55 originales se mantienen con metadata adicional
