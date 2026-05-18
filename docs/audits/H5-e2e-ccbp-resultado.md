# H5 — Tests E2E vertical CCBP — Resultado

**Fecha**: 18 de mayo de 2026
**Tag**: `v0.30.1-hardening-h5`
**Suite**: `tests/e2e/sprints/h5-vertical-ccbp.spec.ts`
**Resultado**: 17/17 PASS (+ 1 auth setup)

---

## Tests ejecutados

| # | Test | Status | Tiempo |
|---|------|--------|--------|
| 1 | Crear persona desde scouting | PASS | ~150ms |
| 2 | Promover scouting -> persona del club | PASS | ~270ms |
| 3 | Asignar a equipo via personas_equipos | PASS | ~5s |
| 4 | Alta de membresia con plan de cuotas | PASS | ~4.5s |
| 5 | Generar cuota mensual | PASS | ~65ms |
| 6 | Registrar pago de cuota (mock cobranza) | PASS | ~250ms |
| 7 | Convocar a entrenamiento (evento) | PASS | ~6s |
| 8 | Registrar asistencia | PASS | ~290ms |
| 9 | Registrar lesion durante entrenamiento | PASS | ~140ms |
| 10 | Verificar lesion activa visible en pagina salud | PASS | ~4.5s |
| 11 | Inscribir equipo en torneo | PASS | ~5s |
| 12 | Cargar resultado de partido via DB | PASS | ~230ms |
| 13 | Verificar tabla de posiciones actualiza | PASS | ~5s |
| 14 | Marcar lesion como recuperada | PASS | ~250ms |
| 15 | Verificar reporte deportivo carga correctamente | PASS | ~5.5s |
| 16 | Dar baja a la suscripcion | PASS | ~460ms |
| 17 | Verificar persona queda en historico (no se elimina) | PASS | ~5s |

**Tiempo total suite**: ~48s

---

## Bugs detectados durante desarrollo de la suite

Todos corregidos in-situ (no bugs en la app, solo data constraints descubiertos):

1. **`personas.fuente_origen` CHECK constraint**: no incluye `scouting` como valor valido. Valores permitidos: `manual_admin`, `form_publico`, `excel_bulk`, `api_externa`, `webhook`, `scrapping`, `mcp`, `sync_padron_externo`. Se uso `manual_admin` para el test.
2. **`personas.tipo_documento` FK**: apunta a `catalogo_tipos_documento.slug` que usa lowercase (`dni`, no `DNI`).
3. **`scouting_fichas.estado` CHECK constraint**: estados validos son `observado`, `contactado`, `en_negociacion`, `descartado`, `incorporado` (no `promovido`).
4. **`cuotas_emitidas` columnas**: usa `monto_original`/`monto_final` (no `monto`), y requiere `fecha_emision`.
5. **`evento_invitados` auto-poblado**: cuando se navega a la pagina de asistencia, el sistema auto-puebla invitados desde plantel. Insertar manualmente puede duplicar.
6. **`tipos_lesion.slug` FK**: valores como `esguince_tobillo`, no `esguince`.
7. **`torneos.tipo` CHECK**: valores `interno`/`externo` (no `liga`). `formato` es `liga`/`eliminacion`/`grupos_playoff`/etc.

Ninguno es un bug funcional; todos son constraints de integridad correctamente aplicados.

---

## Cobertura del vertical CCBP

### Cubierto
- Ciclo de vida completo: scouting -> persona -> equipo -> membresia -> cuotas -> asistencia -> lesion -> torneo -> baja
- Integridad referencial entre tablas CCBP
- Paginas cargan sin error: equipos, membresias, salud, reportes deportivos, torneos, posiciones
- Soft-delete y estados (activa/cancelada)
- Cleanup automatico (afterAll con hard delete + sweep DEMO_E2E_*)

### No cubierto (deuda)
- Workflow completo de torneos con fixture auto-generado (N>4 equipos)
- Comunicaciones multi-paso automatizadas
- Scouting evaluaciones con radar chart (UI interaction)
- Historial deportivo / trayectoria timeline
- Diagramacion visual (SVG canvas)
- Padrones exportados
- Pre-inscripciones via formulario publico
- Tests de roles/permisos diferenciados

---

## Fixtures

- `tests/e2e/fixtures/ccbp/personas-demo.json` — 10 personas DEMO_E2E_*
- `tests/e2e/fixtures/ccbp/equipos-demo.json` — 2 equipos DEMO_E2E_*
- `tests/e2e/fixtures/ccbp/cuotas-planes-demo.json` — 1 plan mensual
- `tests/e2e/fixtures/ccbp/torneos-demo.json` — 1 torneo interno

Cleanup: `afterAll` elimina todos los datos con hard delete + sweep por prefix.
