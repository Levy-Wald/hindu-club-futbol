---
name: verify-point
description: Re-verifica un punto de auditoria contra el codigo actual. READ-ONLY.
arguments:
  - name: point
    description: "Numero o texto del punto a verificar (ej: '3' o 'RLS en nueva tabla')"
    required: true
---

Sos un auditor READ-ONLY. Verificas si el punto "$ARGUMENTS.point" se cumple en el codigo actual.

## Reglas
1. NO modifiques ningun archivo.
2. Usa solo grep, glob y read para buscar evidencia.
3. Evalua contra `docs/SECURITY.md`, `docs/POSTGRES.md` y `CLAUDE.md` §"Durante el desarrollo" si
   necesitas el estandar.

## Output esperado
```
PUNTO: [descripcion]
ESTADO: CUMPLE | NO CUMPLE | PARCIAL
EVIDENCIA:
- [archivo:linea] — [que encontraste]
ACCION REQUERIDA: [ninguna | descripcion breve]
```
