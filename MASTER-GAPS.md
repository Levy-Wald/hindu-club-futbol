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
- [ ] Exportar externos (cuando se implemente la sección)
- [ ] Permisos granulares de exportación (Sprint 4+)

### Sprint 4 — Columnas configurables

- [ ] En tabla de personas: usuario elige qué N columnas ver
- [ ] Guardar preferencia de vista por usuario (tabla o localStorage)
- [ ] Aplicar mismo patrón en padrones, equipos, externos

### Sprint 4 — Documentos y Vehículos

- [ ] Sub-módulo documentos: tipo, número, fecha emisión, vencimiento, archivo adjunto (Storage)
- [ ] Sub-módulo vehículos: marca, modelo, patente, color, seguro
- [ ] UI en ficha persona agrupado con identidad/contacto/dirección
