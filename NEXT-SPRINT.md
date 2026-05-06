# Proximo Sprint: 10 — Operaciones deportivas avanzadas

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-9 completos (Sprint 9 = Finanzas mini-ERP, pendiente validación visual).
**Proximo:** Sprint 10.

---

## Que hay que hacer en Sprint 10

### Objetivo
Operaciones deportivas avanzadas: eventos con asistencia, esquemas tácticos, operación semanal del club, scouting básico.

### Entregables

#### 1. Eventos avanzados (entrenamientos, partidos, viajes)
- Eventos ya existen (Sprint 7), pero necesitan:
  - Tipo de evento: entrenamiento, partido_amistoso, partido_oficial, viaje, reunion, otro
  - Rival y sede (para partidos)
  - Citación con hora y lugar
  - Notas del DT pre/post evento

#### 2. Confirmaciones de asistencia
- Cada persona citada puede: confirmar, rechazar, sin respuesta
- Vista para DT: quiénes confirmaron, quiénes no
- Integración futura con bot WA (Sprint 16+)

#### 3. Esquemas tácticos (disciplina_futbol)
- Formación (4-3-3, 4-4-2, etc.)
- Posición de cada jugador en el esquema
- Titulares vs suplentes
- Pelotas paradas (corners, tiros libres)
- Visual: cancha con jugadores posicionados

#### 4. Operaciones semanales
- Vista "Esta semana": próximos eventos de todos los equipos del club
- Filtro por equipo/disciplina
- Para dirigentes/managers: panorama general del club

#### 5. Scouting básico
- Ficha de jugador externo (persona sin vínculo con el club)
- Notas de observación
- Estado: observado, contactado, en_negociacion, descartado, incorporado
- Si se incorpora → crear persona en el club

### Tablas a crear/modificar

- `eventos` — agregar campos: tipo_evento, rival, sede, notas_pre, notas_post
- `evento_asistencias` — persona_id, evento_id, estado (confirmado/rechazado/pendiente), nota
- `esquemas_tacticos` — equipo_id, evento_id (opcional), formacion, notas
- `esquema_posiciones` — esquema_id, persona_id, posicion, es_titular
- `scouting_fichas` — persona externa, equipo interesado, estado, observaciones

### Archivos relevantes
- `app/admin/equipos/[id]/_components/` — calendario y eventos ya existen
- `app/admin/mi-equipo/` — vista de equipo para DT/capitanes
- `supabase/migrations/` — agregar migration numerada

---

## Reglas importantes

1. **Verificar schema existente** antes de crear migrations
2. **shadcn v4 usa `render` prop**, NO `asChild`
3. **TENANT_ID hardcodeado** = `'11111111-1111-1111-1111-111111111111'`
4. **Verificar build**: `pnpm build`
5. **PENDIENTE_VALIDACION_VISUAL** si no probaste visualmente
6. **Actualizar MASTER-GAPS.md** al terminar

---

## Sprint 9 completado (referencia)

Sprint 9 entregó el módulo Finanzas completo:
- Dashboard, Cajas, Movimientos, Productos (ERP 30+ campos), Cuotas (planes/emisiones/estado), Plan de Cuentas, Mi Cuenta
- Import masivo de productos (wizard 4 pasos)
- 13 tipos de producto (producto, servicio, cuota, actividad, alquiler, insumo, activo, gasto, locker, cochera, expensa, multa, consumo)
- UX estándar: búsqueda, filtros, checkboxes, SelectionBar, export multi-formato
- Migrations aplicadas en producción

---

## Vision global

```
Sprints 1-9:  ████████████████████████████████████████████████ HECHO
Sprint 10:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- ESTAS ACA (operaciones deportivas)
Sprint 11:    ░░░░░░░░░░░░░░░░░░ (empleados, contratos)
Sprints 12-14:░░░░░░░░░░░░░░░░░░ (comunicaciones, API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening -> HINDU LIVE)
```
