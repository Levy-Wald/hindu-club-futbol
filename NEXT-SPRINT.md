# Proximo Sprint: 14 — Mantenimiento + Inventario + Reservas + Mapa

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo, estado actual
3. `docs/PROPUESTA-ARQUITECTONICA.md` — decisiones arquitectonicas firmes
4. `docs/WORKFLOW.md` — checklist pre/post desarrollo
5. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-13 completos. DB cleanup hecho. 0 errores seguridad.
**Pendiente:** Validacion visual de Yair para ultimos cambios + configurar env vars en Vercel.
**Proximo:** Sprint 14 (Mantenimiento + Inventario + Reservas + Mapa).

---

## Sprints recien completados (resumen)

### Sprint 12 — Comunicaciones + Notificaciones (HECHO)
- 3 tablas com_* + VIEW v_vencimientos_proximos
- Bell dropdown + /admin/comunicaciones + /admin/notificaciones
- Cron dispatcher vencimientos (9 AM UTC)
- 18 plantillas seed Hindu

### Sprint 13 — API REST + API Keys (HECHO)
- Tablas api_keys + api_logs + funciones de validacion
- 5 endpoints: GET/POST /personas, GET/PATCH /personas/:id, GET /equipos
- Auth Bearer token + rate limiting + request logging
- /admin/integraciones (dashboard + keys ABM + logs viewer)
- Cron cleanup-api-logs (domingos 3 AM, retiene 90 dias)

---

## Sprint 14 — Mantenimiento + Inventario + Reservas + Mapa

### Objetivo
4 modulos operativos nuevos para gestion de instalaciones, inventario, reservas y mapa.

### Entregables

1. **Migration: mantenimiento (mant_*)**
   - Tabla `mant_ordenes` (ordenes de trabajo)
   - Tabla `mant_planes` (planes de mantenimiento preventivo)
   - RLS + triggers + indices

2. **Migration: inventario (inv_*)**
   - Tabla `inv_items` (items del inventario)
   - Tabla `inv_movimientos` (entradas/salidas)
   - RLS + triggers + indices

3. **Migration: reservas (res_*)**
   - Tabla `res_espacios` (canchas, salones, etc.)
   - Tabla `res_reservas` (reservas de espacios)
   - Tabla `res_reglas` (horarios disponibles, precios)
   - RLS + triggers + indices

4. **Migration: mapa (map_*)**
   - Tabla `map_zonas` (zonas del predio)
   - RLS + triggers + indices

5. **UI para cada modulo**
   - Dashboard, listados, ABM basico
   - Sidebar sections

### Riesgos
- 4 modulos en un sprint puede ser mucho — priorizar mantenimiento y reservas
- Mapa puede necesitar integracion con leaflet/mapbox

---

## Vision global

```
Sprints 1-13:    ████████████████████████████████████████████████████████████ HECHO
Sprint 14:       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- PROXIMO (mantenimiento, inventario, reservas, mapa)
Sprint 15:       ░░░░░░░░░░░░░░ (shop)
Sprint 16:       ░░░░░░░░░░░░░░ (hardening → HINDU LIVE)
```
