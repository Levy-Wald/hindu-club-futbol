---
name: close-zoho-task
description: Cierra una tarea en Zoho Projects (LE-8 SaaS Empresarial) y registra el commit/tag asociado.
arguments:
  - name: task_name
    description: "Nombre o codigo de la tarea Zoho (ej: SE1-T48, F3.1)"
    required: true
  - name: ref
    description: "Commit corto o tag que cierra la tarea (ej: cc07f9c o v0.52.0-portal-convocatoria)"
    required: true
---

Cierra la tarea "$ARGUMENTS.task_name" en Zoho Projects (LE-8) y asociala a "$ARGUMENTS.ref".

## Datos del proyecto
- Portal ID: `918690668`
- Project ID: `2651844000000411004` (LE-8 "SaaS Empresarial")
- Owner por defecto (asignatario): Yair — zpuid `2651844000000088003`

## Pasos
1. Busca la tarea por nombre/codigo "$ARGUMENTS.task_name" en LE-8 via el MCP de Zoho Projects.
2. Agrega un comentario con `Cerrado via $ARGUMENTS.ref — [fecha]` + una nota fechada de que se hizo
   (estado vivo va en la descripcion, no se cierra a ciegas).
3. Marca la tarea 100% → Closed (el proyecto opera con Open/Closed nativo; 100% = Closed automatico).

## Recorda (Regla DONE, ADR-064)
DONE tecnico ≠ terminado. Solo cerra la tarea si corresponde al estado real; si falta el DONE visual
de Yair, deja nota "esperando smoke" y NO la cierres.

## Output esperado
```
ZOHO TASK CLOSE
===============
Tarea:  $ARGUMENTS.task_name
Ref:    $ARGUMENTS.ref
Estado: CERRADA | NOTA-SIN-CERRAR | ERROR — [detalle]
```
