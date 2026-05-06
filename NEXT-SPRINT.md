# Proximo Sprint: 11.5 / 12 — Eventos refactor + Comunicaciones

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-11 completos (Sprints 9, 10, 11 = pendiente validacion visual por Yair).
**Proximo:** Sprint 11.5 (refactor eventos) luego Sprint 12 (comunicaciones).

> **IMPORTANTE:** Yair debe validar Sprints 9 (Finanzas), 10 (Operaciones) y 11 (RRHH) antes de arrancar. Si ya valido, ignorar esta nota.

---

## Sprint 11.5 — Refactor Eventos (acordado en propuesta arquitectonica)

### Objetivo
Renombrar `equipos_horarios` → `eventos` + crear tabla satelite `partidos_detalle`.

### Entregables

1. Migration: `ALTER TABLE equipos_horarios RENAME TO eventos`
2. Agregar columnas: `modulo_origen text DEFAULT 'equipos'`, `entidad_origen_id uuid`
3. CREATE VIEW `equipos_horarios` apuntando a `eventos` WHERE `modulo_origen = 'equipos'` (backward compat lectura)
4. Crear tabla `partidos_detalle` (1:1 con eventos donde tipo='partido')
   - equipo_id, rival_texto, rival_entidad_id FK, condicion (local/visitante/neutral)
   - torneo_slug, marcador_local, marcador_visitante, convocatoria_cerrada
   - alineacion_esquema_id FK a esquemas_tacticos
5. Actualizar todas las mutaciones en codigo TS que referencian `equipos_horarios` → `eventos`
6. RLS + triggers en tablas nuevas

### Solo si Sprint 11 no rompio nada

---

## Sprint 12 — Comunicaciones + Notificaciones

### Objetivo
Mensajeria intra-club, notificaciones in-app, VIEW de vencimientos.

### Entregables

1. Bell icon en topbar con notificaciones
2. Tabla `notificaciones` (persona_id, titulo, mensaje, leida, tipo, referencia_id)
3. VIEW `v_vencimientos_proximos` (aptos medicos, contratos, documentos)
4. Envios masivos por padron/equipo (seleccion → enviar mensaje)
5. Conector Resend para emails transaccionales (opcional)

---

## Sprint 11 completado (referencia)

Sprint 11 entrego RRHH completo:
- Empleados = personas con atributo `rrhh.empleado` (no tabla separada)
- Atributos namespaceados: `rrhh.empleado`, `rrhh.admin`, `rrhh.consulta`
- ABM Contratos: 6 modalidades, 5 frecuencias, estados, rescision, soft-delete
- ABM Liquidaciones: flujo borrador → aprobada → pagada, genera movimiento_caja
- Dashboard RRHH con 4 tarjetas de resumen
- Sidebar colapsable con sub-items (Dashboard, Contratos, Liquidaciones)
- Filtros URL-synced en contratos y liquidaciones
- RLS con `puede_operar_rrhh()` + politica _own
- Tablas: rrhh_contratos, rrhh_liquidaciones (prefijo rrhh_ segun convencion)

---

## Vision global

```
Sprints 1-11:  ████████████████████████████████████████████████████████████ HECHO
Sprint 11.5:   ▓▓▓▓▓▓▓▓▓▓ <- PROXIMO (refactor eventos)
Sprint 12:     ░░░░░░░░░░░░░░░░░░ (comunicaciones)
Sprint 13:     ░░░░░░░░░░░░░░░░░░ (API + MCP + webhooks)
Sprint 14:     ░░░░░░░░░░░░░░░░░░ (mantenimiento, inventario, reservas)
Sprint 15:     ░░░░░░░░░░░░░░░░░░ (shop + conectores)
Sprint 16:     ░░░░░░░░░░░░░░░░░░ (hardening -> HINDU LIVE)
```
