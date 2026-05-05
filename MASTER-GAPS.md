# MASTER-GAPS — Lista de pendientes y lecciones

## Bugs encontrados y resueltos

### BUG-001: get_tenant_actual() recursión infinita en RLS
- **Sprint:** 1
- **Síntoma:** Error 500 — Postgres 54001 (stack depth exceeded)
- **Causa:** `get_tenant_actual()` era SECURITY INVOKER. Al consultar `personas`, disparaba la policy de personas que llamaba a `get_tenant_actual()` → loop infinito.
- **Fix:** Cambiar a SECURITY DEFINER + `SET search_path = public, pg_temp` + revocar acceso a anon/public, solo authenticated.
- **Lección:** Funciones helper usadas en RLS policies que consultan tablas con RLS DEBEN ser SECURITY DEFINER.

---

## Pendientes por Sprint

### Sprint 2 — Fixes UI personas (COMPLETADO)

- [x] Renombrar columna "Atributos" → "Roles" en tabla de personas
- [x] Reorganizar ficha de persona en tabs agrupadas:
  - Personal (identidad + contacto + dirección)
  - Deportivo (físico + actividad)
  - Salud (datos médicos + obra social + lesiones + rehabilitaciones)
  - Profesional (profesional + educación)
  - Club (membresía + notas)
  - Documentos
  - Roles, Vínculos, Padrones, Ficha total

### Sprint 3 — Multi-deporte y categoría por edad (COMPLETADO)

- [x] Persona puede participar en múltiples deportes (ya soportado por personas_equipos)
- [x] Mostrar en ficha de persona: todos los deportes + categorías + equipos (SeccionDeporteEquipos)
- [x] Agrupado por disciplina, muestra categoría del equipo, edad de la persona, rol, dorsal
- [ ] Categoría automática por edad (requiere configurar rangos de edad por categoría — Sprint 4)

### Sprint 3 — Salud: Lesiones y Rehabilitaciones (COMPLETADO)

- [x] Crear tabla `personas_lesiones` — migration 20260505010000
- [x] Crear tabla `personas_rehabilitaciones` — migration 20260505010000
- [x] UI en ficha de persona: sección Salud con sub-tabs (Datos médicos / Lesiones / Rehabilitación)
- [x] CRUD completo (crear + soft-delete) con historial

### Sprint 3 — Exportar datos (COMPLETADO)

- [x] Exportar persona individual (CSV/JSON con selección de campos)
- [x] Exportar personas bulk (filtros actuales + selección de campos, CSV/JSON)
- [x] Exportar padrones (CSV con miembros activos)
- [x] Exportar equipos (CSV con datos de equipos)
- [x] Exportar externos (Sprint 5 — ExportEntidadesButton)
- [ ] Permisos granulares de exportación (Sprint 6+)

### Sprint 3 — Documentacion y estandares (COMPLETADO)

- [x] Eliminar docs obsoletos (SPRINT-1-FOUNDATION-PROMPT.md, AGENTS.md)
- [x] Actualizar README.md con estado actual del proyecto
- [x] Actualizar CLAUDE.md a Sprint 3 + workflow ABM + tabla de docs
- [x] Crear docs/ARCHITECTURE.md (separacion de capas, patron de modulo, multi-tenant)
- [x] Crear docs/UI-UX.md (responsive, patrones React, shadcn v4, performance frontend)
- [x] Crear docs/DESIGN-SYSTEM.md (colores, tipografia, componentes, auditoria visual)
- [x] Crear docs/POSTGRES.md (indices, RLS, migraciones seguras, Supabase CLI)
- [x] Crear docs/WORKFLOW.md (checklists pre-feature, verificacion post-dev, ABM)
- [x] Crear docs/SKILL-CHALLENGE.md (pre-mortem adaptado al proyecto)
- [x] Consolidar AI-READY.md y PERFORMANCE.md dentro de los otros docs (eliminados)

### Sprint 4 — Columnas configurables (COMPLETADO)

- [x] En tabla de personas: usuario elige qué columnas ver (documento, email, teléfono, roles, estado)
- [x] Guardar preferencia de vista por usuario (localStorage)
- [x] Popover con checkboxes para toggle de columnas
- [x] Aplicar mismo patrón en padrones, equipos, externos (Sprint 5)

### Sprint 4 — Vehículos (COMPLETADO)

- [x] Tabla `personas_vehiculos` ya existía en DB (30 columnas, schema completo con catálogos)
- [x] RLS ya existente (4 policies SELECT/INSERT/UPDATE/DELETE)
- [x] UI CRUD completa en ficha persona (tab Documentos) — usa schema real:
  - Selects desde `catalogo_tipos_vehiculo` y `catalogo_companias_seguro`
  - Seguro con vigencia_desde/hasta, tipo cobertura, compañía por catálogo
  - Titularidad (titular/autorizado/familiar)
  - Acceso club (permite ingreso, estacionamiento, tag RFID)
- [x] Badge de estado de vigencia del seguro (vigente/por vencer/vencido)

### Sprint 4 — Categoría automática por edad (COMPLETADO)

- [x] Query `fetchCategoriasEquipo` con `edad_min` / `edad_max`
- [x] Display "Categoría sugerida por edad" en sección deportivo
- [x] Matching basado en edad de la persona vs rangos de categorías activas
- [ ] Auto-asignación a equipo por categoría (futuro — requiere reglas de negocio, solo sugerencia por ahora)

### Sprint 5 — Columnas configurables global + Export externos (COMPLETADO)

- [x] Componente genérico `GenericColumnConfig` + hook `useGenericColumnConfig` (reutilizable)
- [x] Columnas configurables en equipos (categoría, disciplina, modalidad, miembros, estado)
- [x] Columnas configurables en padrones (tipo, miembros, estado)
- [x] Columnas configurables en externos (tipo, teléfono, email, estado)
- [x] Export entidades externas a CSV (ExportEntidadesButton)
- [x] Patrón consistente: botón engranaje + popover en header de todas las tablas
