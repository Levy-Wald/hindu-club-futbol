# B15 — Inventario de Action Bars

> Generado: 2026-05-21 | Actualizado: 2026-05-21 (B15.1b inspeccion profunda)
> Referencia canonica: `personas/page.tsx` — botones arriba derecha alineados al titulo en `flex justify-between`.

## Resumen (actualizado B15.1b)

| Categoria | Total |
|-----------|-------|
| OK        | 69    |
| TOCAR ejecutado (B15.2) | 3 |
| TOCAR nuevo (B15.3 scope) | 5 |
| EXCEPCION | 43    |
| DIFERIR   | 3     |
| REDISENO SEPARADO | 2 |
| DUDA      | 0     |

> B15.1b: 63 DUDAs inspeccionadas exhaustivamente. 25 → OK, 33 → EXCEPCION, 5 → TOCAR (B15.3 scope). Cero DUDAs pendientes.

---

## OK — Action bar arriba (no tocar)

### OK originales (44)

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
| 12 | `(troncal)/productos/[id]/page.tsx` | detalle | ProductoFormDialog (Editar) en header; per-tab Agregar arriba de cada tab |
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

### OK confirmados via B15.1b (25)

| # | Archivo | Componente inspeccionado | Botones |
|---|---------|--------------------------|---------|
| 45 | `(troncal)/productos/listas-precios/page.tsx` | ListasPreciosPageClient | ListaPreciosFormDialog en header justify-between |
| 46 | `(troncal)/finanzas/centros-costo/page.tsx` | CentrosCostoClient | "Nuevo centro" en header justify-between |
| 47 | `(troncal)/finanzas/conciliacion/page.tsx` | ConciliacionClient | "Importar extracto" + "Auto-matchear" en header justify-between |
| 48 | `(troncal)/finanzas/reportes/conciliacion/page.tsx` | ConciliacionReporteClient | "Generar" en header justify-between con titulo |
| 49 | `(troncal)/club/mapa/page.tsx` | DiagramaCanvas | "Agregar espacio" en header justify-between |
| 50 | `(troncal)/integraciones/page.tsx` | IntegracionesClient | "Nueva API Key" en CardHeader justify-between |
| 51 | `(troncal)/membresias/page.tsx` | MembresiaList | "Dashboard" + "Nueva alta" en header justify-between |
| 52 | `(troncal)/mi-perfil/page.tsx` | PersonaEditor | "Exportar" + "Guardar" en sticky top action bar |
| 53 | `(troncal)/reportes-deportivos/page.tsx` | DashboardDeportivo | ExportButtons en header justify-between |
| 54 | `(modulos)/concesiones/page.tsx` | ConcesionesListClient | "Nuevo concesionario" en header justify-between |
| 55 | `(modulos)/equipos/cuerpo-tecnico/page.tsx` | CuerpoTecnicoGlobal | "Asociar persona" en header justify-between |
| 56 | `(modulos)/nominas-externas/page.tsx` | PantallaListado | "+ Generar link" en header justify-between |
| 57 | `(modulos)/notificaciones/page.tsx` | NotificacionesClient | "Marcar todas leidas" + "Archivar" en header justify-between |
| 58 | `(modulos)/pre-inscripciones/page.tsx` | PreInscripcionesClient | Sin CTA global (recibe desde formulario externo); per-row dropdown OK |
| 59 | `(modulos)/salud/page.tsx` | SaludClient | "Levantar caso" en header justify-between |
| 60 | `(modulos)/utileria/page.tsx` | DashboardUtileria | Nav buttons en header justify-between |
| 61 | `(modulos)/utileria/cargos/page.tsx` | CargosClient | Sin CTA (cargos auto-generados); "Reversar" per-row contextual |
| 62 | `(modulos)/utileria/inventario/page.tsx` | InventarioClient | "Nuevo item" en header justify-between |
| 63 | `(modulos)/utileria/kits/page.tsx` | KitsClient | "Nuevo kit" en header justify-between |
| 64 | `(modulos)/utileria/solicitudes/page.tsx` | SolicitudesClient | "Nueva solicitud" en header justify-between |
| 65 | `competencias/inscripciones/page.tsx` | InscripcionesClient | "Inscribir equipo" en header justify-between |
| 66 | `competencias/torneos/page.tsx` | TablaTorneos | "Nuevo torneo" en header justify-between |
| 67 | `competencias/torneos/[id]/page.tsx` | DetalleTorneoClient | ArrowLeft + "Posiciones" + "Generar fixture" + "Importar CSV" en header |
| 68 | `competencias/torneos/[id]/posiciones/page.tsx` | PantallaPosiciones | "Actualizar" en toolbar cerca del top |
| 69 | `reservas/page.tsx` | TablaReservas | "Nueva reserva" en header justify-between |

---

## TOCAR — Ejecutado B15.2 (3 archivos, DONE)

| # | Archivo | Problema | Estado |
|---|---------|----------|--------|
| 1 | `(troncal)/padrones/[id]/sync/nuevo/page.tsx` | Submit full-width al fondo del form | DONE (v0.30.22) |
| 2 | `(troncal)/padrones/[id]/importar/_components/step-results.tsx` | Botones al pie de la pagina | DONE (v0.30.22) |
| 3 | `(troncal)/finanzas/cajas/[id]/page.tsx` | "Nuevo movimiento" debajo de stat cards | DONE (v0.30.22) |

### Reclasificados fuera de TOCAR (B15.2 refinamiento)

| Archivo | Antes | Ahora | Motivo |
|---------|-------|-------|--------|
| `(troncal)/finanzas/page.tsx` | TOCAR | EXCEPCION | Card "Acciones rapidas" en dashboard es patron valido (Stripe/QuickBooks) |
| `(troncal)/finanzas/convenios/[id]/page.tsx` | TOCAR | EXCEPCION | CTA contextual dentro de card "Proxima cuota" |
| `(troncal)/configuracion/page.tsx` | TOCAR | DIFERIR | Botones deshabilitados en tab Avanzado — mover cuando se habiliten |
| `(troncal)/mi-cuenta/page.tsx` | TOCAR | DIFERIR | 4 botones son placeholders (solo toast.info, sin logica real) |
| `(troncal)/operaciones/eventos/[eventoId]/page.tsx` | TOCAR | REDISENO SEPARADO | Navegacion a sub-secciones, no action bar — requiere rediseno como tabs/cards |
| `competencias/partidos/[id]/page.tsx` | TOCAR | REDISENO SEPARADO | Mismo caso — navegacion hub, no action bar |

---

## TOCAR — Scope B15.3 (5 archivos, 3 componentes unicos)

Detectados en inspeccion B15.1b. Todos tienen el boton primario (save/submit) al pie del formulario, sin action bar en el header.

| # | Archivo | Componente | Problema | Complejidad |
|---|---------|------------|----------|-------------|
| 1 | `(troncal)/finanzas/config/page.tsx` | ConfigFinancieraForm | "Guardar configuracion" al fondo del form multi-card | Baja — mover a header o duplicar arriba |
| 2 | `(modulos)/comunicaciones/automatizaciones/nueva/page.tsx` | AutomatizacionForm | "Guardar cambios"/"Crear automatizacion" + "Cancelar" al fondo | Baja — mover save a header, dejar cancelar |
| 3 | `(modulos)/comunicaciones/plantillas/[id]/editar/page.tsx` | PlantillaEditorForm | "Guardar cambios" + "Test send" + "Duplicar" + "Eliminar" al fondo del editor | Media — multiples acciones, decidir cuales suben al header |
| 4 | `(modulos)/comunicaciones/plantillas/nueva/page.tsx` | PlantillaEditorForm (mismo) | "Crear plantilla" al fondo | Misma correccion que #3 |
| 5 | `proyectos/nuevo/page.tsx` | ProyectoForm | "Crear proyecto" al fondo del formulario | Baja — mover submit a header |

> **Nota:** Items 3 y 4 comparten el mismo componente (`PlantillaEditorForm`). Son 3 componentes unicos a modificar.

---

## EXCEPCION — No tocar (patron valido)

### Excepciones originales (10)

| # | Archivo | Tipo | Justificacion |
|---|---------|------|---------------|
| 1 | `(troncal)/personas/importar/page.tsx` | wizard | Wrapper vacio; botones de navegacion de pasos en PersonasImportWizard |
| 2 | `(troncal)/padrones/[id]/importar/page.tsx` | wizard | Wrapper vacio; botones de pasos en ImportWizard |
| 3 | `(troncal)/entidades/importar/page.tsx` | wizard | Wrapper vacio; botones de pasos en ExternosImportWizard |
| 4 | `(troncal)/finanzas/centros-costo/[id]/page.tsx` | form-in-tab | Guardar cambios es submit de form dentro de tab Configuracion |
| 5 | `(troncal)/finanzas/suscripciones/page.tsx` | listado | Sin boton crear; solo acciones per-row (Suspender/Cancelar/Reactivar) |
| 6 | `(troncal)/cajas/page.tsx` | redirect | Redirect puro a /admin/finanzas/cajas |
| 7 | `(modulos)/comunicaciones/envios-masivos/nuevo/page.tsx` | wizard | Wrapper vacio; botones de pasos en EnvioMasivoWizard |
| 8 | `(modulos)/equipos/importar/page.tsx` | wizard | Wrapper vacio; botones de pasos en EquiposImportWizard |
| 9 | `(troncal)/finanzas/page.tsx` | dashboard | Card "Acciones rapidas" patron valido (Stripe/QuickBooks) |
| 10 | `(troncal)/finanzas/convenios/[id]/page.tsx` | detalle | CTA contextual dentro de card "Proxima cuota" |

### Excepciones confirmadas via B15.1b (33)

| # | Archivo | Componente | Justificacion |
|---|---------|------------|---------------|
| 11 | `(troncal)/productos/movimientos/page.tsx` | MovimientosPageClient | Read-only: log de movimientos de stock sin ningun boton de accion |
| 12 | `(troncal)/padrones/comparar/page.tsx` | ComparadorUI | Herramienta de analisis: selectores de modo + bulk-action bar contextual (aparece solo al seleccionar filas) |
| 13 | `(troncal)/finanzas/cuenta-corriente/page.tsx` | CuentaCorrienteClient | Read-only: visor de cuenta corriente sin botones de accion |
| 14 | `(troncal)/finanzas/cuotas/page.tsx` | CuotasClient | Multi-tab: cada tab gestiona su propio header con botones correctamente posicionados |
| 15 | `(troncal)/finanzas/reportes/balance/page.tsx` | BalanceClient | Reporte: "Generar" es trigger de consulta dentro del panel de filtros |
| 16 | `(troncal)/finanzas/reportes/cobranzas/page.tsx` | CobranzasClient | Reporte: "Buscar" es trigger de consulta dentro del panel de filtros |
| 17 | `(troncal)/finanzas/reportes/estado-resultados/page.tsx` | EstadoResultadosClient | Reporte: "Generar" dentro del panel de filtros |
| 18 | `(troncal)/finanzas/reportes/libro-mayor/page.tsx` | LibroMayorClient | Reporte: "Buscar" dentro del panel de filtros |
| 19 | `(troncal)/catalogos/page.tsx` | (inline) | Hub: cards con Links de navegacion, sin botones de accion |
| 20 | `(troncal)/marketplace/page.tsx` | (inline) | Badge-styled "Activar" CTAs dentro de cada card de modulo, no boton page-level |
| 21 | `(troncal)/membresias/dashboard/page.tsx` | DashboardMembresias | Read-only: dashboard analitico sin botones de accion |
| 22 | `(troncal)/mi-equipo/page.tsx` | MiEquipoClient | Export en CardHeader contextual; Save dentro de Dialog; sin CTA page-level |
| 23 | `(troncal)/operaciones/page.tsx` | SemanaOperaciones | Controles de navegacion de calendario (semana anterior/siguiente), no CRUD actions |
| 24 | `(troncal)/operaciones/eventos/[eventoId]/amistoso/page.tsx` | PantallaAmistoso | Server assembler: delega a sub-secciones, sin botones page-level propios |
| 25 | `(troncal)/operaciones/eventos/[eventoId]/asistencia/page.tsx` | PantallaAsistencia | Per-row toggles presencia/ausencia — patron de toma de asistencia |
| 26 | `(troncal)/operaciones/eventos/[eventoId]/plan/page.tsx` | PantallaPlan | Server assembler: delega interacciones a ListaBloquesWrapper |
| 27 | `(troncal)/operaciones/eventos/[eventoId]/tactica/page.tsx` | PantallaTactica | Auto-save: editor tactico guarda automaticamente en cada interaccion |
| 28 | `(modulos)/acceso/page.tsx` | PantallaAcceso | Kiosk/scanner UI: "Nueva busqueda" aparece contextualmente despues del resultado |
| 29 | `(modulos)/comunicaciones/page.tsx` | (inline tabs) | Hub multi-tab: cada tab delega acciones a sub-componentes |
| 30 | `(modulos)/comunicaciones/envios/page.tsx` | EnviosClient | Read-only: log de envios; solo filtro reset y per-row "Reenviar" contextual |
| 31 | `(modulos)/concesiones/[id]/page.tsx` | ConcesionarioDetailClient | Multi-tab detail: cada tab tiene sus acciones propias correctamente posicionadas |
| 32 | `(modulos)/concesiones/[id]/punto-venta/[pdv]/vender/page.tsx` | VenderClient | POS/carrito: "Confirmar venta" al fondo del carrito es patron e-commerce estandar |
| 33 | `(modulos)/concesiones/reportes/page.tsx` | ReportesClient | Read-only: dashboard analitico sin botones de accion |
| 34 | `(modulos)/nominas-externas/[id]/page.tsx` | PantallaDetalle | Review workflow: botones confirmar/rechazar per-item dentro de cada card |
| 35 | `(modulos)/rrhh/page.tsx` | (inline) | Dashboard con Card "Acciones rapidas" — mismo patron que finanzas/page.tsx (EXCEPCION validada) |
| 36 | `page.tsx` (root [tenant]) | MiDiaGrid | Dashboard: grilla de widgets personalizada, sin botones de accion |
| 37 | `competencias/partidos/page.tsx` | (inline) | Links-only: listado de partidos como cards navegables, sin botones |
| 38 | `competencias/partidos/[id]/resultado/page.tsx` | PantallaCargarResultado | Wizard 3 pasos: botones de paso al pie de cada step es patron wizard estandar |
| 39 | `competencias/stats/equipos/page.tsx` | PantallaStatsEquipos | Read-only: estadisticas con filtro Select, sin botones de accion |
| 40 | `competencias/stats/jugadores/page.tsx` | PantallaRankingJugadores | Read-only: ranking con filtros Select, sin botones de accion |
| 41 | `competencias/stats/jugadores/[persona_id]/page.tsx` | PantallaPerfilJugador | Read-only: perfil de jugador con solo back-nav al top |
| 42 | `competencias/torneos/[id]/fixture/page.tsx` | PantallaFixture | Workflow generar-y-confirmar: botones secuenciales contextuales, no CRUD simple |
| 43 | `competencias/torneos/[id]/import/page.tsx` | PantallaImportCSV | Import wizard: boton importar aparece condicionalmente post-upload/preview |

---

## DIFERIR — Pendiente activacion de feature (no tocar ahora)

| # | Archivo | Motivo |
|---|---------|--------|
| 1 | `(troncal)/configuracion/page.tsx` | Botones deshabilitados en tab Avanzado — mover cuando se habiliten |
| 2 | `(troncal)/mi-cuenta/page.tsx` | 4 botones son placeholders (solo toast.info, sin logica real) |

---

## REDISENO SEPARADO — Requiere rediseno de layout (no es action bar simple)

| # | Archivo | Motivo |
|---|---------|--------|
| 1 | `(troncal)/operaciones/eventos/[eventoId]/page.tsx` | Navegacion a sub-secciones, no action bar — requiere rediseno como tabs/cards |
| 2 | `competencias/partidos/[id]/page.tsx` | Mismo caso — navegacion hub, no action bar |

---

## DUDA — Todas resueltas

> Cero DUDAs pendientes. Las 63 entradas del inventario B15.1 fueron inspeccionadas exhaustivamente en B15.1b (2026-05-21).

---

## Historial de inspecciones

### B15.1 (2026-05-21) — Inventario inicial
- 112 paginas auditadas
- 63 clasificadas como DUDA (thin wrappers que delegan a componentes client)
- 6 DUDAs resueltas inmediatamente y movidas a OK

### B15.1 muestreo (2026-05-21) — 15 componentes
- 80% OK, 20% TOCAR menor en muestra de 15

### B15.1b (2026-05-21) — Inspeccion profunda exhaustiva
- 63 DUDAs inspeccionadas: componente hijo leido, botones localizados
- Resultado: 25 OK, 33 EXCEPCION, 5 TOCAR (B15.3 scope)
- Categorias EXCEPCION mas frecuentes: read-only (11), report/query pattern (4), multi-tab (4), wizard (4), hub/nav-only (4), auto-save/kiosk/POS (3), server assembler (3)
