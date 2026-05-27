# ADR-055: Arquitectura de capabilities multivertical para SaaS Modular Vertical

**Status**: Superseded by ADR-062
**Date**: 2026-05-18
**Context**: Sprint B8 (FASE B' extendido)

## Decision

Implementar un sistema de capabilities basado en tres niveles:

1. `catalogo_capabilities` (~110 capabilities) organizadas por capa: troncal, cross_vertical, vertical_ccbp, vertical_country, vertical_educativo, vertical_retail, vertical_servicios
2. `catalogo_atributos.permisos` (jsonb array de slugs de capabilities) asignado a los 73 atributos existentes
3. `personas_atributos` como tabla de asignacion (ya existia)

Flujo: persona -> personas_atributos -> catalogo_atributos.permisos -> capabilities

## Verticales

| Vertical | Estado | Atributos seedeados |
|---|---|---|
| CCBP (Hindu) | Implementado | Si |
| Country | Modelado | Si (3 atributos) |
| Educativo | Modelado | Si (3 atributos) |
| Retail | Modelado sin atributos | No (esperan primer cliente) |
| Servicios profesionales | Modelado sin atributos | No (esperan primer cliente) |

## Helpers

- SQL: `get_user_capabilities(persona_id)`, `has_capability(persona_id, cap)`, `has_any_capability(persona_id, caps[])`
- TS: `getUserCapabilities()`, `hasCapability()`, `hasAnyCapability()`, `requireCapability()`, `requireAllCapabilities()`

## Adopcion gradual

Sprint B8 aplica middleware a 5 server actions criticas como PoC. El resto de ~215 server actions adoptan el middleware en sprints futuros sin urgencia. Las acciones existentes siguen funcionando como antes.

## Como agregar un nuevo vertical

1. Crear capabilities `vertical_nuevo.*` en `catalogo_capabilities`
2. Crear atributos `vertical_nuevo` en `catalogo_atributos` con `permisos` jsonb apuntando a las capabilities
3. Asignar atributos a personas via `personas_atributos`
4. No requiere cambios al motor ni a los helpers

## Consequences

- El sistema es extensible sin cambios estructurales
- Las capabilities son granulares (read/write/delete/admin/execute/approve)
- Distincion entre capabilities sensibles (medicas, financieras) y normales
- Deuda: migrar las ~210 server actions restantes al middleware en sprints futuros
