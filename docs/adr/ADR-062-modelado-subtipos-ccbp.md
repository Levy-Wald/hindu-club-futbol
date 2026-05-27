# ADR-062: Modelado de subtipos CCBP

**Status**: Accepted
**Date**: 2026-05-27
**Supersedes**: ADR-055 (capabilities multivertical)
**Context**: Sprint A4.5 / Cierre jornada 27-may-2026

## Contexto

ADR-055 definió la arquitectura de capabilities multivertical con ~110 capabilities organizadas por capa. Con la experiencia acumulada en sprints B8-B17 y la consolidación del vertical CCBP como piloto activo, se necesita refinar el modelado de subtipos específicos de CCBP (clubes deportivos, countries, barrios privados) que comparten la misma infraestructura pero difieren en configuración de módulos y atributos.

## Decisión

1. **Subtipos CCBP como configuración, no código**: los tres subtipos (club deportivo, country, barrio privado) se diferencian exclusivamente por:
   - Preset de módulos habilitados en `catalogo_modulos`
   - Preset de atributos seedeados en `catalogo_atributos`
   - Capabilities específicas activadas por vertical

2. **Capabilities refinadas**: se mantiene el modelo de 3 niveles de ADR-055 (catalogo_capabilities → catalogo_atributos.permisos → personas_atributos) pero se reorganizan las capabilities `vertical_ccbp.*` en sub-namespaces:
   - `ccbp.deportivo.*` — disciplinas, planificadores, competencias
   - `ccbp.country.*` — lotes, expensas, amenities
   - `ccbp.barrio.*` — accesos, seguridad, áreas comunes

3. **Helpers existentes se mantienen**: `get_user_capabilities()`, `has_capability()`, `has_any_capability()` no requieren cambios — los sub-namespaces son strings que el motor ya soporta.

4. **Migración gradual**: Hindu Club (subtipo deportivo) ya está en producción. Los subtipos country y barrio se activan cuando llegue el primer cliente de cada tipo.

## Consecuencias

- ADR-055 queda superseded en la parte de modelado vertical; la arquitectura base de capabilities se preserva
- Nuevos subtipos CCBP se agregan sin cambios estructurales (solo seed data)
- El catálogo de capabilities crece por subtipo pero el motor es el mismo
