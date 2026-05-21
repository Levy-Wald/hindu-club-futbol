# B15 — Inventario de Action Bars

> Generado: 2026-05-21 | Sprint: B15.1 (solo lectura)
> Referencia canonica: `personas/page.tsx` — botones arriba derecha alineados al titulo en `flex justify-between`.

## Resumen (actualizado B15.2 refinamiento)

| Categoria | Total |
|-----------|-------|
| OK        | 44    |
| TOCAR (B15.2 scope) | 3 |
| EXCEPCION | 10    |
| DIFERIR   | 3     |
| REDISEÑO SEPARADO | 2 |
| DUDA (thin wrappers) | 50 |
| **TOTAL** | **112** |

> Muestreo de 15 DUDAs: 80% OK, 20% TOCAR menor. No justifica B15.1b exhaustivo.

---

## OK — Action bar arriba (no tocar)

| # | Archivo | Tipo | Botones |
|---|---------|------|---------|
| 1 | `(troncal)/personas/page.tsx` | listado | DownloadTemplate, Export, Importar, +Nueva persona — header justify-between |
| 2 | `(troncal)/personas/[id]/page.tsx` | detalle | ArrowLeft, ToggleActivo, Eliminar, Historial — sticky header |
| 3 | `(troncal)/personas/[id]/historial/page.tsx` | reporte | ArrowLeft — header inline |
| 4 | `(troncal)/padrones/page.tsx` | listado | Vistas, DownloadTemplate, Comparar, +Crear — header justify-between |
| 5 | `(troncal)/padrones/[id]/page.tsx` | detalle | ArrowLeft + Agregar, Importar, Sync, Eliminar, Export — sticky header 2 filas |
| 6 | `(troncal)/padrones/[id]/sync/[runId]/page.tsx` | detalle | ArrowLeft — header inline; acciones en RunReviewClient |
| 7 | `(troncal)/padrones/[id]/sync/page.tsx` | listado | ArrowLeft + Nueva sync — header justify-between |
| 8 | `(troncal)/padrones/conflictos/page.tsx` | reporte | ArrowLeft — header inline |
| 9 | `(troncal)/entidades/page.tsx` | listado | Vistas, DownloadTemplate, Importar, Export, +Crear — header justify-between |
| 10 | `(troncal)/entidades/[id]/page.tsx` | detalle | ArrowLeft, Eliminar — sticky header |
| 11 | `(troncal)/productos/page.tsx` | listado | ProductoFormDialog — header justify-between |
| 12 | `(troncal)/productos/[id]/page.tsx` | detalle | ProductoFormDialog (Editar) en header; per-tab Agregar arriba de cada tab (via producto-detalle.tsx) |
| 13 | `(troncal)/productos/categorias/page.tsx` | listado | CategoriaFormDialog — header justify-between |
| 14 | `(troncal)/productos/marcas/page.tsx` | listado | MarcaFormDialog — header justify-between |
| 15 | `(troncal)/finanzas/cajas/page.tsx` | listado | CajaFormDialog — header justify-between |
| 16 | `(troncal)/finanzas/convenios/page.tsx` | listado | NuevoConvenioDialog — header justify-between |
| 17 | `(troncal)/finanzas/cotizaciones/page.tsx` | listado | NuevaCotizacionDialog — header justify-between |
| 18 | `(troncal)/finanzas/movimientos/page.tsx` | listado | NuevoMovimientoDialog — header justify-between |
| 19 | `(troncal)/finanzas/periodos/page.tsx` | listado | NuevoPeriodoDialog — header justify-between |
| 20 | `(troncal)/finanzas/plan-cuentas/page.tsx` | listado | CuentaFormDialog — header justify-between |
| 21 | `(troncal)/finanzas/productos-sin-cuentas/page.tsx` | listado | Editar per-row (auditoria, sin crear) |
| 22 | `(troncal)/configuracion/branding/page.tsx` | config | ArrowLeft — header inline; guardar en BrandingForm |
| 23 | `(troncal)/configuracion/espacios/page.tsx` | listado | CrearEspacioDialog — header justify-between |
| 24 | `(troncal)/configuracion/sedes/page.tsx` | listado | SedeFormDialog — header justify-between |
| 25 | `(troncal)/configuracion/sedes/[id]/page.tsx` | detalle | ArrowLeft + SedeFormDialog(edit) — header justify-between |
| 26 | `(troncal)/configuracion/usuarios/page.tsx` | config | Search + Filtro + Export en toolbar arriba (via usuarios-panel.tsx) |
| 27 | `(troncal)/configuracion/atributos-custom/page.tsx` | config | Nueva definicion en toolbar arriba (via config-panel.tsx) |
| 28 | `(troncal)/catalogos/[slug]/page.tsx` | listado | Nuevo en toolbar arriba (via catalogo-editor.tsx) |
| 29 | `(troncal)/operaciones/scouting/page.tsx` | listado | CrearScoutingDialog — header justify-between |
| 30 | `(troncal)/operaciones/scouting/[id]/page.tsx` | detalle | ArrowLeft — sticky header |
| 31 | `(modulos)/comunicaciones/envios-masivos/[loteId]/page.tsx` | detalle | ArrowLeft — header inline |
| 32 | `(modulos)/comunicaciones/automatizaciones/[jobId]/page.tsx` | detalle | ArrowLeft — header inline |
| 33 | `(modulos)/comunicaciones/plantillas/[id]/page.tsx` | detalle | Volver + Editar — header justify-between |
| 34 | `(modulos)/comunicaciones/plantillas/page.tsx` | listado | Nueva plantilla en toolbar arriba (via plantillas-client.tsx) |
| 35 | `(modulos)/concesiones/[id]/punto-venta/[pdv]/page.tsx` | detalle | Volver + Vender — header justify-between |
| 36 | `(modulos)/equipos/page.tsx` | listado | DownloadTemplate, Importar, Capitanes, Export, +Crear — header justify-between |
| 37 | `(modulos)/equipos/[id]/page.tsx` | detalle | ArrowLeft — sticky header |
| 38 | `(modulos)/equipos/capitanes/page.tsx` | listado | ArrowLeft — header inline |
| 39 | `(modulos)/rrhh/contratos/page.tsx` | listado | NuevoContratoDialog — header justify-between |
| 40 | `(modulos)/rrhh/liquidaciones/page.tsx` | listado | NuevaLiquidacionDialog — header justify-between |
| 41 | `(modulos)/planificadores/mensual/page.tsx` | dashboard | TogglePlanificador — header justify-between |
| 42 | `(modulos)/planificadores/semanal/page.tsx` | dashboard | TogglePlanificador — header justify-between |
| 43 | `proyectos/page.tsx` | listado | Nuevo proyecto — header justify-between |
| 44 | `proyectos/[id]/page.tsx` | detalle | ArrowLeft — header inline |

## TOCAR — Scope B15.2 (3 archivos)

| # | Archivo | Tipo | Botones | Problema |
|---|---------|------|---------|----------|
| 1 | `(troncal)/padrones/[id]/sync/nuevo/page.tsx` | form | Iniciar sincronizacion | Submit full-width al fondo del Card/form |
| 2 | `(troncal)/padrones/[id]/importar/_components/step-results.tsx` | wizard-resultado | Ver padron, Importar mas datos | `flex justify-between` al pie de la pagina (L78) |
| 3 | `(troncal)/finanzas/cajas/[id]/page.tsx` | detalle | Nuevo movimiento | `flex justify-end` debajo de stat cards, no en header |

### Reclasificados fuera de TOCAR (B15.2 refinamiento 2026-05-21)

| Archivo | Antes | Ahora | Motivo |
|---------|-------|-------|--------|
| `(troncal)/finanzas/page.tsx` | TOCAR | EXCEPCION | Card "Acciones rapidas" en dashboard es patron valido (Stripe/QuickBooks) |
| `(troncal)/finanzas/convenios/[id]/page.tsx` | TOCAR | EXCEPCION | CTA contextual dentro de card "Proxima cuota" |
| `(troncal)/configuracion/page.tsx` | TOCAR | DIFERIR | Botones deshabilitados en tab Avanzado — mover cuando se habiliten |
| `(troncal)/mi-cuenta/page.tsx` | TOCAR | DIFERIR | 4 botones son placeholders (solo toast.info, sin logica real) |
| `(troncal)/operaciones/eventos/[eventoId]/page.tsx` | TOCAR | REDISEÑO SEPARADO | Navegacion a sub-secciones, no action bar — requiere rediseno como tabs/cards |
| `competencias/partidos/[id]/page.tsx` | TOCAR | REDISEÑO SEPARADO | Mismo caso — navegacion hub, no action bar |

## EXCEPCION — Wizards, dialogs, FABs intencionales (no tocar)

| # | Archivo | Tipo | Justificacion |
|---|---------|------|---------------|
| 1 | `(troncal)/personas/importar/page.tsx` | wizard | Wrapper vacio; botones de navegacion de pasos viven en PersonasImportWizard |
| 2 | `(troncal)/padrones/[id]/importar/page.tsx` | wizard | Wrapper vacio; botones de pasos en ImportWizard |
| 3 | `(troncal)/entidades/importar/page.tsx` | wizard | Wrapper vacio; botones de pasos en ExternosImportWizard |
| 4 | `(troncal)/finanzas/centros-costo/[id]/page.tsx` | form-in-tab | Guardar cambios es submit de form dentro de tab Configuracion |
| 5 | `(troncal)/finanzas/suscripciones/page.tsx` | listado | Sin boton crear; solo acciones per-row (Suspender/Cancelar/Reactivar) — correcto |
| 6 | `(troncal)/cajas/page.tsx` | redirect | Redirect puro a /admin/finanzas/cajas |
| 7 | `(modulos)/comunicaciones/envios-masivos/nuevo/page.tsx` | wizard | Wrapper vacio; botones de pasos en EnvioMasivoWizard |
| 8 | `(modulos)/equipos/importar/page.tsx` | wizard | Wrapper vacio; botones de pasos en EquiposImportWizard |

## DUDA — Thin wrappers que delegan a componentes client (requiere inspeccion adicional)

Estas paginas son server shells puros que pasan data a un componente client (`*Client`, `Pantalla*`, etc.). Los botones viven dentro del componente hijo. **Requieren inspeccion del componente hijo** para clasificar definitivamente.

| # | Archivo | Tipo | Componente delegado |
|---|---------|------|---------------------|
| 1 | `(troncal)/productos/listas-precios/page.tsx` | listado | ListasPreciosPageClient |
| 2 | `(troncal)/productos/movimientos/page.tsx` | reporte | MovimientosPageClient |
| 3 | `(troncal)/padrones/comparar/page.tsx` | reporte | ComparadorUI |
| 4 | `(troncal)/finanzas/centros-costo/page.tsx` | listado | CentrosCostoClient |
| 5 | `(troncal)/finanzas/conciliacion/page.tsx` | listado | ConciliacionClient |
| 6 | `(troncal)/finanzas/config/page.tsx` | config | ConfigFinancieraForm |
| 7 | `(troncal)/finanzas/cuenta-corriente/page.tsx` | reporte | CuentaCorrienteClient |
| 8 | `(troncal)/finanzas/cuotas/page.tsx` | listado | CuotasClient (botones OK en tabs internas) |
| 9 | `(troncal)/finanzas/reportes/balance/page.tsx` | reporte | BalanceClient |
| 10 | `(troncal)/finanzas/reportes/cobranzas/page.tsx` | reporte | CobranzasClient |
| 11 | `(troncal)/finanzas/reportes/conciliacion/page.tsx` | reporte | ConciliacionReporteClient |
| 12 | `(troncal)/finanzas/reportes/estado-resultados/page.tsx` | reporte | EstadoResultadosClient |
| 13 | `(troncal)/finanzas/reportes/libro-mayor/page.tsx` | reporte | LibroMayorClient |
| 14 | `(troncal)/catalogos/page.tsx` | hub | Cards con Link (sin botones) |
| 15 | `(troncal)/club/mapa/page.tsx` | config | DiagramaCanvas |
| 16 | `(troncal)/integraciones/page.tsx` | dashboard | IntegracionesClient |
| 17 | `(troncal)/marketplace/page.tsx` | listado | Badge-styled "Activar" (no Button) |
| 18 | `(troncal)/membresias/page.tsx` | listado | MembresiaList |
| 19 | `(troncal)/membresias/dashboard/page.tsx` | dashboard | DashboardMembresias |
| 20 | `(troncal)/mi-equipo/page.tsx` | detalle | MiEquipoClient |
| 21 | `(troncal)/mi-perfil/page.tsx` | detalle | PersonaEditor (sticky header sin Button) |
| 22 | `(troncal)/reportes-deportivos/page.tsx` | reporte | DashboardDeportivo |
| 23 | `(troncal)/operaciones/page.tsx` | dashboard | SemanaOperaciones |
| 24 | `(troncal)/operaciones/eventos/[eventoId]/amistoso/page.tsx` | detalle | PantallaAmistoso |
| 25 | `(troncal)/operaciones/eventos/[eventoId]/asistencia/page.tsx` | detalle | AsistenciaWrapper |
| 26 | `(troncal)/operaciones/eventos/[eventoId]/plan/page.tsx` | detalle | PantallaPlan |
| 27 | `(troncal)/operaciones/eventos/[eventoId]/tactica/page.tsx` | detalle | PantallaTactica |
| 28 | `(modulos)/acceso/page.tsx` | hub | PantallaAcceso |
| 29 | `(modulos)/comunicaciones/page.tsx` | hub | Tabs con PlantillasTable/LotesTable/AutomatizacionesList |
| 30 | `(modulos)/comunicaciones/envios/page.tsx` | listado | EnviosClient |
| 31 | `(modulos)/comunicaciones/automatizaciones/nueva/page.tsx` | form | AutomatizacionForm |
| 32 | `(modulos)/comunicaciones/plantillas/[id]/editar/page.tsx` | form | PlantillaEditorForm |
| 33 | `(modulos)/comunicaciones/plantillas/nueva/page.tsx` | form | PlantillaEditorForm |
| 34 | `(modulos)/concesiones/page.tsx` | listado | ConcesionesListClient |
| 35 | `(modulos)/concesiones/[id]/page.tsx` | detalle | ConcesionarioDetailClient |
| 36 | `(modulos)/concesiones/[id]/punto-venta/[pdv]/vender/page.tsx` | form | VenderClient |
| 37 | `(modulos)/concesiones/reportes/page.tsx` | reporte | ReportesClient |
| 38 | `(modulos)/equipos/cuerpo-tecnico/page.tsx` | listado | CuerpoTecnicoGlobal |
| 39 | `(modulos)/nominas-externas/page.tsx` | listado | PantallaListado |
| 40 | `(modulos)/nominas-externas/[id]/page.tsx` | detalle | PantallaDetalle |
| 41 | `(modulos)/notificaciones/page.tsx` | listado | NotificacionesClient |
| 42 | `(modulos)/pre-inscripciones/page.tsx` | listado | PreInscripcionesClient |
| 43 | `(modulos)/rrhh/page.tsx` | dashboard | Ver en TOCAR #... (ya clasificado como TOCAR) |
| 44 | `(modulos)/salud/page.tsx` | hub | SaludClient |
| 45 | `(modulos)/utileria/page.tsx` | dashboard | DashboardUtileria |
| 46 | `(modulos)/utileria/cargos/page.tsx` | listado | CargosClient |
| 47 | `(modulos)/utileria/inventario/page.tsx` | listado | InventarioClient |
| 48 | `(modulos)/utileria/kits/page.tsx` | listado | KitsClient |
| 49 | `(modulos)/utileria/solicitudes/page.tsx` | listado | SolicitudesClient |
| 50 | `page.tsx` (root [tenant]) | dashboard | MiDiaGrid |
| 51 | `competencias/inscripciones/page.tsx` | listado | PantallaInscripciones |
| 52 | `competencias/partidos/page.tsx` | listado | Links solo, sin Button |
| 53 | `competencias/partidos/[id]/resultado/page.tsx` | form | PantallaCargarResultado |
| 54 | `competencias/stats/equipos/page.tsx` | reporte | PantallaStatsEquipos |
| 55 | `competencias/stats/jugadores/page.tsx` | reporte | PantallaRankingJugadores |
| 56 | `competencias/stats/jugadores/[persona_id]/page.tsx` | detalle | PantallaPerfilJugador |
| 57 | `competencias/torneos/page.tsx` | listado | PantallaListadoTorneos |
| 58 | `competencias/torneos/[id]/page.tsx` | detalle | PantallaDetalleTorneo |
| 59 | `competencias/torneos/[id]/fixture/page.tsx` | listado | PantallaFixture |
| 60 | `competencias/torneos/[id]/import/page.tsx` | wizard | PantallaImportCSV |
| 61 | `competencias/torneos/[id]/posiciones/page.tsx` | reporte | PantallaPosiciones |
| 62 | `proyectos/nuevo/page.tsx` | form | ProyectoForm |
| 63 | `reservas/page.tsx` | listado | PantallaReservas |

> **Nota:** 6 DUDAs fueron resueltas via inspeccion del componente hijo y reclasificadas como OK:
> `productos/[id]` (producto-detalle.tsx), `configuracion/usuarios` (usuarios-panel.tsx),
> `catalogos/[slug]` (catalogo-editor.tsx), `finanzas/cuotas` (cuotas-client.tsx parcial),
> `comunicaciones/plantillas` (plantillas-client.tsx), `configuracion/atributos-custom` (config-panel.tsx).
> Esas 6 ya figuran en la lista OK arriba. Los 57 restantes siguen como DUDA.

---

## Muestreo DUDA (15 componentes hijos inspeccionados)

| Veredicto | Cantidad | % |
|-----------|----------|---|
| OK        | 12       | 80% |
| TOCAR menor | 3      | 20% |

TOCAR menores encontrados (no incluidos en B15.2, agrupar en polish futuro):
- `productos/movimientos/MovimientosPageClient` — h1 sin boton (posible read-only intencional)
- `concesiones/[id]/ConcesionarioDetailClient` — solo back arrow, acciones dentro de tabs
- `pre-inscripciones/PreInscripcionesClient` — h1 solo, acciones per-row en tabla

**Conclusion:** 80% OK en muestra. No justifica B15.1b exhaustivo para los 42 restantes.

## Notas para B15.2

- Scope final: 3 archivos (TOCAR #1, #2, #3).
- Hallazgo de Yair (step-results.tsx "Ver padron" abajo) incluido como TOCAR #2.
- 2 paginas hub requieren REDISEÑO SEPARADO (eventos, partidos) — fuera de B15.
- 3 paginas DIFERIR hasta que sus features se activen (configuracion avanzado, mi-cuenta placeholders).
