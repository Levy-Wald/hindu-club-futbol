# Proximo Sprint: 11.5 — Refactor Eventos

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo, estado actual
3. `docs/PROPUESTA-ARQUITECTONICA.md` — decisiones arquitectonicas firmes
4. `docs/REPORTE-CLEANUP-POST-SPRINT11.md` — estado de la DB post-cleanup
5. `docs/WORKFLOW.md` — checklist pre/post desarrollo
6. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-11.1 completos. Bugs Sprint 9 fixeados. Cleanup de seguridad hecho.
**Pendiente:** Validacion visual de Yair para Sprints 9, 10, 11.
**Proximo:** Sprint 11.5 (refactor eventos) — NO arrancar sin validacion de Yair.

---

## Sprint 11.5 — Refactor Eventos (acordado en propuesta arquitectonica)

### Objetivo
Crear tabla central `eventos` que reemplaza `equipos_horarios`. Separar en satelites por dominio.

### Entregables

1. **Migration principal:**
   - Crear tabla `eventos` con schema completo (ver seccion 6 de PROPUESTA-ARQUITECTONICA.md)
   - Crear `entrenamientos_detalle` (1:1 con evento tipo entrenamiento)
   - Crear `partidos_detalle` (1:1 con evento tipo partido)
   - Renombrar `catalogo_tipos_evento_personal` → `catalogo_tipos_evento` + agregar tipos faltantes
   - Copiar datos de `equipos_horarios` → `eventos` + satelites
   - Copiar `personas_eventos_personales` → `eventos` con dominio='personas'
   - Crear VIEW `equipos_horarios` para backward compat
   - RLS + triggers + indices

2. **VIEW `v_vencimientos_proximos`:**
   - Unifica vencimientos de: cuotas, aptos medicos, autorizaciones, documentos, seguros, tarjetas acceso, obra social
   - Para dashboards y alertas

3. **Actualizacion de codigo TS:**
   - Todas las referencias a `equipos_horarios` → `eventos`
   - FKs de `esquemas_tacticos` y `evento_asistencias` ya apuntan a IDs que estaran en `eventos`

### Riesgos
- Backup antes de ejecutar
- Test exhaustivo — 2 tablas dependen de `equipos_horarios.id`
- Probar en branch si es posible

---

## Sprint 11.6 — Atributos namespacing

### Objetivo
Migrar atributos existentes a convencion `{slug}.{rol}`.

### Entregables
1. Crear funcion `tiene_atributo_namespace(p_modulo text, p_roles text[])`
2. Insertar nuevos atributos namespaced en `catalogo_atributos`
3. Migrar asignaciones en `personas_atributos` con SQL update
4. Mantener viejos como aliases con `metadata = {"deprecated": true}` durante 1 sprint

---

## Sprint 11.7 — Renombres finanzas (fin_*)

### Objetivo
Renombrar tablas de finanzas con prefijo para consistencia modular.

### Entregables
1. ALTER TABLE + CREATE VIEW para cada tabla de finanzas
2. Codigo nuevo usa `fin_*`, codigo viejo sigue funcionando via VIEW
3. Refactor gradual en sprints siguientes

---

## Sprint 12 — Comunicaciones + module_events

### Objetivo
Sistema de notificaciones in-app + eventos de dominio.

### Entregables
1. Crear tabla `module_events` (eventos de dominio centralizados)
2. Bell icon en topbar con notificaciones
3. Tabla `com_mensajes` (notificaciones in-app)
4. Tabla `com_plantillas` (plantillas de comunicacion)
5. Dispatcher que toma eventos y los publica por canal
6. Conector Resend para emails transaccionales (opcional)

---

## Vision global

```
Sprints 1-11.1:  ████████████████████████████████████████████████ HECHO
Sprint 9 bugs:   ████ FIXEADO
Sprint 11.5:     ▓▓▓▓▓▓▓▓▓▓ <- PROXIMO (refactor eventos)
Sprint 11.6:     ░░░░░░░░ (atributos namespacing)
Sprint 11.7:     ░░░░░░░░ (renombres finanzas)
Sprint 12:       ░░░░░░░░░░░░░░ (comunicaciones + module_events)
Sprint 13:       ░░░░░░░░░░░░░░ (API + MCP + webhooks)
Sprint 14:       ░░░░░░░░░░░░░░ (mantenimiento, inventario, reservas, mapa)
Sprint 15:       ░░░░░░░░░░░░░░ (shop)
Sprint 16:       ░░░░░░░░░░░░░░ (hardening → HINDU LIVE)
```
