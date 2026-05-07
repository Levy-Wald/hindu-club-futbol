# Proximo Sprint: 12 — Comunicaciones + module_events

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo, estado actual
3. `docs/PROPUESTA-ARQUITECTONICA.md` — decisiones arquitectonicas firmes
4. `docs/WORKFLOW.md` — checklist pre/post desarrollo
5. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-11.7 completos. DB cleanup hecho. 0 errores seguridad.
**Pendiente:** Validacion visual de Yair para ultimos cambios.
**Proximo:** Sprint 12 (comunicaciones + module_events).

---

## Sprints recien completados (resumen)

### Sprint 11.5 — Refactor Eventos (HECHO)
- Tabla central `eventos` reemplaza `equipos_horarios`
- Satelite `partidos_detalle` 1:1
- VIEW backward compat `equipos_horarios`
- Codigo TS actualizado completo

### Sprint 11.6 — Atributos namespacing (HECHO)
- 15 atributos namespaced en catalogo (`{modulo}.{rol}`)
- Funcion `tiene_atributo_namespace(modulo, roles[])`
- personas_atributos migrados
- UI actualizado (ATRIBUTO_COLORS)

### Sprint 11.7 — VIEWs fin_* (HECHO)
- 10 VIEWs con SECURITY INVOKER apuntando a tablas existentes
- Codigo existente sigue funcionando, codigo nuevo puede usar fin_*

---

## Sprint 12 — Comunicaciones + module_events

### Objetivo
Sistema de notificaciones in-app + eventos de dominio para dispatcher centralizado.

### Entregables

1. **Migration: module_events**
   - Tabla `module_events` (eventos de dominio centralizados)
   - Columnas: id, tenant_id, event_type, entity_type, entity_id, actor_id, payload jsonb, processed boolean, created_at
   - Trigger en tablas core que inserta evento al cambiar datos
   - Indices para consultas frecuentes

2. **Migration: comunicaciones**
   - Tabla `com_notificaciones` (notificaciones in-app por persona)
   - Tabla `com_plantillas` (templates de comunicacion)
   - Tabla `com_envios` (log de envios: email, push, whatsapp)
   - RLS + triggers + indices

3. **UI: Bell icon en topbar**
   - Badge con count de no leidas
   - Dropdown con lista de notificaciones recientes
   - Marcar como leida/leidas todas
   - Link a la entidad afectada

4. **Dispatcher (server-side)**
   - Procesa module_events y genera notificaciones segun reglas
   - Configurable por tenant (que eventos generan que notificaciones)

5. **VIEW `v_vencimientos_proximos`** (diferido de Sprint 11.5)
   - Unifica vencimientos: cuotas, aptos, documentos, seguros
   - Alimenta notificaciones automaticas

6. **Opcional: Conector Resend**
   - Emails transaccionales (bienvenida, cuota vencida, etc.)

### Riesgos
- module_events puede generar mucho volumen — definir retention policy
- Notificaciones deben ser granulares por persona (no spam)

---

## Vision global

```
Sprints 1-11.7:  ████████████████████████████████████████████████████████ HECHO
Sprint 12:       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- PROXIMO (comunicaciones + module_events)
Sprint 13:       ░░░░░░░░░░░░░░ (API + MCP + webhooks)
Sprint 14:       ░░░░░░░░░░░░░░ (mantenimiento, inventario, reservas, mapa)
Sprint 15:       ░░░░░░░░░░░░░░ (shop)
Sprint 16:       ░░░░░░░░░░░░░░ (hardening → HINDU LIVE)
```
