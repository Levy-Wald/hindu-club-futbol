# Proximo Sprint: 11 — Empleados + Contratos + Liquidaciones

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-10 completos (Sprint 9 y 10 = pendiente validación visual por Yair).
**Proximo:** Sprint 11.

> **IMPORTANTE:** Sprint 10 tiene items PENDIENTE_VALIDACION_VISUAL. Yair debe validar Operaciones (Esta semana, Scouting, Asistencias, eventos avanzados) y Sprint 9 (Finanzas completo) antes de arrancar Sprint 11. Si Yair ya validó, ignorar esta nota.

---

## Que hay que hacer en Sprint 11

### Objetivo
Empleados, contratos laborales y liquidaciones: modelar relaciones laborales del club con su personal.

### Entregables

#### 1. ABM Empleados
- Persona con vínculo laboral (atributo `empleado`)
- Modalidades: relación de dependencia, monotributo, honorarios, informal
- Datos laborales: CUIL, categoría, fecha ingreso, puesto, área
- Vista lista con filtros por modalidad, estado, área

#### 2. ABM Contratos Laborales
- Vinculado a persona empleado
- Monto, frecuencia (mensual, quincenal, por evento), moneda
- Fecha inicio, fecha fin (nullable = indefinido)
- Estado: vigente, vencido, rescindido
- Historial de contratos por persona

#### 3. Liquidaciones
- Generación de liquidación mensual
- Liquidación → genera movimiento_caja automáticamente
- Estados: borrador, aprobada, pagada, anulada
- Vista de liquidaciones con filtros por período, estado, persona

#### 4. Vínculos empleado-actividad
- Un kinesiólogo puede estar en 3 equipos
- Un preparador físico puede cubrir 2 disciplinas
- Tabla junction: persona_id + equipo_id + actividad

### Tablas a crear/modificar

- `contratos_laborales` — persona_id, modalidad, monto, frecuencia, vigencia, estado
- `liquidaciones` — contrato_id, periodo, monto_bruto, deducciones, monto_neto, estado, movimiento_caja_id
- Extender `personas` o `personas_atributos` con datos laborales específicos

### Archivos relevantes
- `app/admin/personas/` — empleados son personas con atributo
- `app/admin/finanzas/movimientos/` — liquidaciones generan movimientos
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

## Sprint 10 completado (referencia)

Sprint 10 entregó operaciones deportivas avanzadas:
- Operaciones "Esta semana": vista cross-equipo semanal con navegación, filtros, agrupación por día
- Eventos avanzados: rival, notas pre/post evento en create/edit
- Asistencias: componente con estados, generar lista automática, resumen
- Scouting: CRUD completo con estrellas, estados, filtros
- Sidebar colapsable para Operaciones (Esta semana, Scouting)
- APIs: /api/operaciones/eventos, /api/asistencias/[eventoId]
- Migration: 4 tablas nuevas + 3 columnas en equipos_horarios
- Esquemas tácticos: tablas DB creadas, UI diferida

---

## Vision global

```
Sprints 1-10: ████████████████████████████████████████████████████████ HECHO
Sprint 11:    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- ESTAS ACA (empleados, contratos)
Sprint 12:    ░░░░░░░░░░░░░░░░░░ (comunicaciones)
Sprints 13-14:░░░░░░░░░░░░░░░░░░ (API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening -> HINDU LIVE)
```
