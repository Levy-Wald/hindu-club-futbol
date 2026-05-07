# MASTER-GAPS — Estado del proyecto y roadmap

Unica fuente de verdad de pendientes y progreso.
Alineado a la propuesta arquitectonica integral (ver `docs/PROPUESTA-ARQUITECTONICA.md`).

---

## Estado actual: Sprint 14a.5 COMPLETADO

Sprints 11.5-11.7 + Sprint 12 + Sprint 13 + Sprint 14a + Sprint 14a.5 completados.
Sprint 14a.5 = UI interactiva de revisión de sync (búsqueda, filtros, bulk actions, edición, aplicación parcial).
Pendiente validacion visual de Yair + configurar env vars en Vercel.

### Fixes Sprint 9 (sesion 2026-05-06)
- [x] Fix cajas: `saldo` → `saldo_actual` (columna correcta en DB)
- [x] Fix movimientos: `categorias_movimiento` → `catalogo_categorias_movimiento` (nombre real de tabla para PostgREST embed)
- [x] Fix movimientos: `activa` → `activo` (columna correcta en catalogo_categorias_movimiento)
- [x] Productos: boton "Importar" + "Descargar modelo" + filtro estado (activos/inactivos)
- [x] Cuotas: boton "Descargar modelo" en tabs Planes y Estado de cuotas
- [x] Plan de cuentas: 18 cuentas nuevas (buffet, estacionamiento, expensas, seguridad, marketing, pasarelas, hosting, diferencia cambio, intereses, mora)
- [x] RRHH Contratos/Liquidaciones: componentes client con seleccion, bulk ops (eliminar/rescindir/anular), export multi-formato
- [x] Eliminado `contrato-row-actions.tsx` (reemplazado por contratos-table.tsx)

### Cleanup Post-Sprint 11 (ejecutado por Chat)
- [x] 2 VIEWs financieras recreadas con SECURITY INVOKER (antes bypassaban RLS)
- [x] 3 funciones con search_path mutable corregidas
- [x] Modulo `rrhh_basico` activado en tenant Hindu
- [x] Bucket `private-recibos-sueldo` creado con RLS
- [x] 0 ERRORS de seguridad (advisor limpio)

### Sprint 11.1 — Datos laborales refactor (HECHO)
- [x] Decision: datos laborales son de la PERSONA, no del contrato
- [x] 3 catalogos nuevos: `catalogo_areas_trabajo` (10 seeds), `catalogo_puestos` (10 seeds), `catalogo_roles_laborales` (6 seeds)
- [x] Tabla `personas_datos_laborales` 1:1 con persona
- [x] Drop 6 columnas de `rrhh_contratos`: cuil, obra_social, sindicato, numero_legajo, area, puesto
- [x] Selector de persona con autocomplete (debounce 300ms)
- [x] Datos laborales read-only en form contrato + link "Completar ficha"
- [x] Seccion "Datos laborales" en tab Profesional del editor de persona
- [x] Catalogos gestionables desde admin Configuracion

### Mejoras post-Sprint 9 (sesion anterior)
- [x] Branding dinamico: fonts y favicon se aplican desde DB
- [x] Reordenamiento de Configuracion: checklist → plan → accesos rapidos → datos org → ubicacion → regional
- [x] Soft-delete en Equipos, Personas, Padrones, Entidades
- [x] Dropdown de acciones (tres puntos) en lista de Equipos
- [x] Proteccion financiera: personas y entidades con movimientos no se pueden eliminar

---

## Sprints COMPLETADOS

### Sprint 1 — Foundation (HECHO)
- [x] Bootstrap Next.js 16 + Tailwind 4 + shadcn/ui v4
- [x] Conexion Supabase + Migration clubcore_init
- [x] Auth magic link + Seed Hindu
- [x] Layout: sidebar + topbar + dark mode
- [x] RLS basica + Deploy Vercel

### Sprint 2 — ABM Personas + Vista Global (HECHO)
- [x] CRUD personas con todos los campos
- [x] Ficha persona en 10 tabs
- [x] Atributos, vinculos, multi-deporte, categoria sugerida por edad
- [x] Lesiones, rehabilitaciones, vehiculos

### Sprint 3 — Padrones + Importacion masiva (HECHO)
- [x] ABM padrones, personas_padrones
- [x] Importacion bulk CSV con validacion + dedupe por DNI
- [x] Comparador de padrones

### Sprint 4 — Equipos + Categorias + Horarios (HECHO)
- [x] ABM equipos con categoria, disciplina, modalidad, colores
- [x] Horarios con recurrencia
- [x] Asignaciones personas-equipos con rol

### UX Transversal (HECHO)
- [x] Columnas configurables, vistas guardadas por usuario
- [x] Export multi-formato: CSV, XLSX, PDF, PDF membretado
- [x] Templates descargables, SelectionBar, busqueda global Cmd+K

### Sprint 5 — Vinculos + Tutores/Padres + Bajas (HECHO)
- [x] Vinculos bidireccionales con labels humanos
- [x] Toggle Desactivar/Activar en ficha persona

### Sprint 6 — Entidades + Federaciones + Fusiones (HECHO)
- [x] Renombrado "Externos" a "Entidades"
- [x] Detalle entidad con tabs, representantes, jerarquia

### Sprint 7 — Mi Perfil + Mi Equipo + Calendario/Eventos (HECHO)
- [x] Mi Perfil, Mi Equipo, Tarjeta jugador
- [x] Calendario con recurrencia Google Calendar
- [x] ICS download, indumentaria upload, aptos medicos

### Sprint 8 — Paginas publicas + Branding + Pre-inscripcion (HECHO)
- [x] Rutas publicas, home 7 secciones, pre-inscripcion multi-step
- [x] Branding Studio (6 tabs), QR por equipo
- [x] Brand colors Hindu: Blue #3A8FC5, Gold #F2C531, Navy #1E3A5F

### Sprint 9 — Finanzas (HECHO — VALIDADO parcialmente, bugs fixeados)
- [x] Dashboard, ABM Cajas, ABM Movimientos
- [x] Productos ERP (30+ campos, 13 tipos), Import masivo
- [x] Cuotas (planes, emisiones, estado), Plan de cuentas
- [x] Mi Cuenta, Filtros avanzados

### Sprint 10 — Operaciones deportivas (HECHO — PENDIENTE_VALIDACION_VISUAL)
- [x] Operaciones semanales cross-equipo
- [x] Confirmaciones asistencia
- [x] Scouting basico (CRUD completo)
- [ ] Esquemas tacticos UI (tablas creadas, UI diferido)

### Sprint 11 — RRHH (HECHO — PENDIENTE_VALIDACION_VISUAL)
- [x] Empleados = personas con atributo `rrhh.empleado`
- [x] ABM Contratos + Liquidaciones
- [x] Liquidacion genera/anula movimiento_caja automatico
- [x] Dashboard RRHH, filtros, RLS

---

## Sprints PENDIENTES (plan revisado segun propuesta arquitectonica)

### Sprint 11.5 — Refactor Eventos (HECHO)
- [x] Tabla central `eventos` creada (absorbe `equipos_horarios`)
- [x] `partidos_detalle` satelite 1:1
- [x] VIEW `equipos_horarios` backward compat
- [x] Datos migrados de equipos_horarios → eventos
- [x] Codigo TS actualizado (queries, actions, components)
- [ ] `entrenamientos_detalle` satelite (diferido — no hay UI aun)
- [ ] VIEW `v_vencimientos_proximos` (diferido a Sprint 12+)

### Sprint 11.6 — Atributos namespacing (HECHO)
- [x] 15 atributos namespaced insertados en catalogo_atributos
- [x] personas_atributos migrados (admin_sistema → sistema.admin, etc.)
- [x] Funcion `tiene_atributo_namespace(modulo, roles[])` creada
- [x] ATRIBUTO_COLORS en UI actualizado con slugs namespaced
- [ ] Actualizar RLS policies para usar tiene_atributo_namespace (Sprint 16)

### Sprint 11.7 — Renombres finanzas (HECHO)
- [x] 10 VIEWs fin_* creadas con SECURITY INVOKER
- [x] fin_cajas, fin_movimientos, fin_productos, fin_categorias_movimiento
- [x] fin_plan_cuentas, fin_cuotas_planes, fin_cuotas_emitidas
- [x] fin_emisiones_cuota, fin_cuotas_bonificaciones, fin_producto_proveedor
- [ ] Refactor gradual del codigo para usar fin_* (Sprint 16)

### Sprint 12 — Comunicaciones + Notificaciones (HECHO)
- [x] 3 tablas com_* (plantillas, mensajes, envíos) + RLS + triggers + indices
- [x] VIEW v_vencimientos_proximos (9 fuentes: cuotas, aptos, autorizaciones, DNI, pasaporte, seguro, tarjeta, obra social, convenios)
- [x] Función puede_operar_comunicaciones() + atributo comunicaciones.admin
- [x] 18 plantillas seed Hindu (email + inapp)
- [x] lib/comunicaciones/email.ts (Resend) + notificar.ts (notificarPersona)
- [x] /admin/comunicaciones dashboard + plantillas ABM + envíos listado
- [x] Bell dropdown en topbar (polling 60s) + /admin/notificaciones
- [x] API routes: /api/notificaciones, /api/notificaciones/leer
- [x] Cron dispatcher vencimientos (/api/cron/dispatch-vencimientos, 9 AM UTC)
- [x] vercel.json con cron config
- [x] Sidebar collapsible para Comunicaciones
- [ ] Configurar RESEND_API_KEY + CRON_SECRET en Vercel env vars (Yair)
- [ ] module_events (eventos de dominio) — diferido a Sprint 13+

### Sprint 13 — API REST + API Keys (HECHO)
- [x] Tablas api_keys + api_logs + RLS + indices + triggers
- [x] Funciones fn_validar_api_key() + fn_chequear_rate_limit()
- [x] Atributo api.admin + modulo api_publica activado
- [x] lib/api/auth.ts (hash, validate, generate, log) + scopes.ts + helpers.ts
- [x] API endpoints: GET/POST /api/v1/personas, GET/PATCH /api/v1/personas/:id, GET /api/v1/equipos
- [x] Auth via Bearer token (SHA-256 hash, prefix identification)
- [x] Rate limiting via DB (count api_logs in last 60s)
- [x] /admin/integraciones dashboard + API Keys ABM + Logs viewer
- [x] Cron cleanup-api-logs (domingos 3 AM, retiene 90 dias)
- [x] Sidebar: Integraciones con icono Plug
- [ ] Configurar SUPABASE_SERVICE_ROLE_KEY en Vercel env vars (Yair)
- [ ] Webhooks salientes — diferido a Sprint 14+
- [ ] MCP server — diferido a Sprint 14+
- [ ] Esquemas tacticos UI — diferido
- [ ] docs/API.md documentacion — PENDIENTE_VALIDACION_VISUAL

### Sprint 14a — Sync de padrones (HECHO)
- [x] Tablas padron_syncs + padron_sync_diffs + RLS + triggers + indices
- [x] 6 columnas nuevas en personas_padrones (categoria_club, actividad_club, etc.)
- [x] Atributos padron.admin + padron.consulta
- [x] Parsers: Excel serial dates, split APELLIDO Y NOMBRE, categorías Hindu
- [x] Procesador: genera diffs (altas/bajas/cambios/rechazados) sin aplicar
- [x] /admin/padrones/sincronizar: upload Excel + historial de syncs
- [x] /admin/padrones/sincronizar/[syncId]: revisión con tabs + aplicar + rollback
- [x] Botón "Sincronizar" en /admin/padrones
- [x] Hash de archivo para idempotencia (no procesa el mismo archivo 2 veces)
- [ ] Importador por equipo (jugadores/suscriptores sin DNI) — Sprint 14b
- [ ] VIEW v_jugadores_elegibles — Sprint 16

### Sprint 14a.5 — UI interactiva de revisión de sync (HECHO)
- [x] Columnas estado_revision, revisado_at, razon_descarte en padron_sync_diffs
- [x] Búsqueda por nombre, DNI, socio, categoría, actividad
- [x] Filtro por estado de revisión (pendiente/aprobado/editado/descartado/pospuesto)
- [x] Ordenamiento por columnas clickeables
- [x] Paginación (50 por página)
- [x] Selección individual y múltiple (página + todos filtrados)
- [x] Acciones bulk: Aprobar, Descartar, Posponer, Reset
- [x] Edición individual con dialog (todos los campos)
- [x] Aplicación parcial (solo aprobados/editados)
- [x] Barra de progreso de revisión
- [x] Export CSV por tab
- [x] Server actions: actualizarEstadoRevision, editarDiff

### Sprint 14b+ — Pendiente
- [ ] Importador por equipo (/admin/equipos/sincronizar-jugadores)
- [ ] Modulo mantenimiento_instalaciones (mant_*)
- [ ] Modulo mapa_instalaciones (map_*)
- [ ] Modulo inventario_productos (inv_*)
- [ ] Modulo reservas_espacios (res_*)
- [ ] Conectores iniciales

### Sprint 15 — Shop completo
- [ ] Modulo ecommerce_shop (shop_*)
- [ ] Catalogo publico + checkout
- [ ] Conector MercadoPago

### Sprint 16 — Hardening + Hindu LIVE
- [ ] Audit log consultable en UI
- [ ] Tests E2E (Playwright)
- [ ] Performance audit
- [ ] Clasificar 24 funciones SECURITY DEFINER
- [ ] Cleanup atributos viejos (drop aliases deprecated)
- [ ] Onboarding masivo padron Hindu
- [ ] **Hindu Club V2 LIVE**

---

## Bugs conocidos y resueltos

### BUG-001: get_tenant_actual() recursion infinita en RLS
- **Sprint:** 1 — **Fix:** SECURITY DEFINER + SET search_path

### BUG-002: cajas.saldo no existe
- **Sprint:** 9 — **Fix:** columna es `saldo_actual`, no `saldo`

### BUG-003: movimientos FK categorias_movimiento no encontrada
- **Sprint:** 9 — **Fix:** tabla real es `catalogo_categorias_movimiento`

### BUG-004: VIEWs financieras con SECURITY DEFINER
- **Sprint:** 11 — **Fix:** recreadas con `security_invoker=true`

---

## Decisiones tecnicas tomadas

1. **shadcn v4 usa `render` prop**, no `asChild`
2. **searchParams en Next.js 16** es `Promise<Record<string, string | undefined>>`
3. **Exports usan dynamic import** para bundle chico
4. **Vistas se guardan en DB** (tabla `user_vistas`)
5. **Trigger updated_at** se llama `trg_set_updated_at()`
6. **Tutores/Bajas** no son modulos del menu — son atributos/estados
7. **UX unificado**: nombres clickeables → detalle, acciones en DropdownMenu
8. **Calendario/Eventos** reemplaza "Horarios": eventos con fecha real
9. **Recurrencia estilo Google Calendar**: genera filas individuales por fecha
10. **Pre-inscripcion publica** permite insercion anonima (RLS INSERT WITH CHECK true)
11. **Finanzas como modulo independiente** bajo `/admin/finanzas/`
12. **Producto ERP completo**: 13 tipos, 30+ campos
13. **Proveedores = Entidades** con `es_proveedor = true`
14. **Soft-delete con proteccion financiera**
15. **Branding dinamico**: fonts y favicon de DB
16. **Scouting hard-delete**: datos temporales
17. **Prefijo `rrhh_` en tablas nuevas**: convencion acordada
18. **Atributos namespaceados** desde Sprint 11: formato `{modulo}.{rol}`
19. **Empleado = persona + atributo**: no hay tabla `rrhh_empleados`
20. **Liquidacion → movimiento_caja**: cascada controlada en server action
21. **Datos laborales en persona, no en contrato**: tabla `personas_datos_laborales` 1:1
22. **Capa de servicios pura** (D3): inquebrantable desde proximos sprints — UI/API/MCP/Bot consumen lo mismo
23. **Tabla `eventos` central** (D4): absorbera `equipos_horarios` en Sprint 11.5
24. **module_events** (D6): eventos de dominio para dispatcher centralizado
25. **Storage paths predecibles**: `{bucket}/{tenant_id}/{module_slug}/{entity_id}/{filename}`

---

## DB stats actuales

```
Tablas:        90
Columnas:      1416
Funciones:     66
RLS Policies:  277
FKs:           210
Buckets:       5
Migrations:    16+ archivos (11 registradas en schema_migrations)
ERRORS seguridad: 0
```

---

## Arquitectura modular (referencia)

```
TRONCO (siempre activo, sin prefijo)
|- Personas + Atributos + Vinculos
|- Padrones multiples
|- Equipos + Categorias
|- Eventos (Sprint 11.5)
|- Audit log + Auth + Storage + RLS
|- module_events (Sprint 12)

MODULOS VENDIBLES (activables por tenant)
|- Finanzas (fin_*): cajas, movimientos, cuotas, productos, plan cuentas
|- RRHH (rrhh_*): contratos, liquidaciones
|- Operaciones (ops_*): scouting, esquemas tacticos
|- Comunicaciones (com_*): mensajes, plantillas, envios
|- Mantenimiento (mant_*): ordenes, planes
|- Reservas (res_*): reservas, reglas
|- Shop (shop_*): pedidos, carrito, envios
|- Inventario (inv_*): movimientos
|- Mapa (map_*): zonas
|- Disciplinas: futbol, hockey, padel, tenis...
|- Verticales: country, federacion, escuela
|- Canales: bot_whatsapp, app_movil, api_publica, mcp_server
|- Conectores: zoho, mercadopago, atc_sports, ondepor, stripe, resend
```

---

**Ultima actualizacion:** 2026-05-07
**Proximo:** Validacion visual de Yair → Sprint 14 (Mantenimiento + Mapa + Inventario + Reservas)
**Instrucciones:** ver `NEXT-SPRINT.md`
**Owner:** Yair Levy Wald
