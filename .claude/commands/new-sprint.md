---
name: new-sprint
description: Scaffoldea un nuevo sprint/tasklist en Zoho Projects (LE-8) con tareas Fx.y.
arguments:
  - name: phase
    description: "Codigo de fase.modulo (ej: F3.2, F6.7)"
    required: true
  - name: tasks
    description: "Lista de sub-tareas separadas por pipe (ej: 'Layout PC|Login socio|Dashboard')"
    required: true
---

Crea un nuevo tasklist en Zoho Projects (LE-8) para "$ARGUMENTS.phase".

## Datos del proyecto
- Portal ID: `918690668`
- Project ID: `2651844000000411004` (LE-8 "SaaS Empresarial")
- Asignatario por defecto: Yair — zpuid `2651844000000088003`

## Convencion de nombres (PHASES.md)
- Tasklist: `$ARGUMENTS.phase — [nombre del modulo]`
- Sub-tareas: `$ARGUMENTS.phase.1`, `$ARGUMENTS.phase.2`, … con el nombre descriptivo despues del codigo.
- Cada tarea con la coordenada `[[clb-key: BPEnn.Snn.Fnn]]` en la descripcion si aplica.

## Pasos
1. Crea el tasklist en LE-8.
2. Parsea "$ARGUMENTS.tasks" separando por `|`.
3. Crea cada sub-tarea `$ARGUMENTS.phase.N — [nombre]`, asignada a Yair, estado no-analizado/analizado.
4. Reporta.

## Output esperado
```
NEW SPRINT — $ARGUMENTS.phase
=============================
Tasklist: [nombre] — CREADO | ERROR
Tareas:
  $ARGUMENTS.phase.1 — [nombre] — CREADA
  ...
RESULTADO: OK | PARCIAL | FAIL
```
