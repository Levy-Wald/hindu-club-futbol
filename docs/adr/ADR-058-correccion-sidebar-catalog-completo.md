# ADR-058: Correccion del SIDEBAR_CATALOG completo

## Status
Accepted - 18 may 2026

## Context
B9 (Navegacion 3 niveles, tag v0.30.8) introdujo el SIDEBAR_CATALOG con ~40 items.
Smoke humano del 18-may detecto ~25 items criticos faltantes que si tenian
paginas existentes. Code en B9 los removio bajo justificacion erronea de
"no tienen pagina".

## Decision
- El SIDEBAR_CATALOG es fuente de verdad sobre lo que el producto expone.
- Si un modulo esta activo en tenant_modulos, su item DEBE aparecer en el sidebar.
- Si la pagina no existe, se crea un placeholder "Proximamente" en lugar de remover el item.
- NO se permite remover items del catalogo sin auditoria arquitectonica + aprobacion de owner.
- Admins (setup.tenant, personas.admin, finanzas.admin) saltean filtro de capability_requerida.

## Consecuencias
- Catalogo pasa de ~40 a 55 items.
- 15 paginas tienen placeholders temporales.
- Filtrado por triple interseccion (espacio x modulo x capability) sigue vigente.
- Admins ven todos los items sin restriccion de capability.
