# PARTE 3 — Código: estructura app

## 3.1 Sitemap completo

### Páginas públicas — `app/(public)/`

| Ruta | Archivo | Estado | Propósito |
|------|---------|--------|-----------|
| `/` | `page.tsx` | Funcional | Home con 7 secciones (hero, eventos, ligas, capitanes, staff, asociate, contacto) |
| `/equipos` | `equipos/page.tsx` | Funcional | Listado público de equipos |
| `/equipos/[id]` | `equipos/[id]/page.tsx` | Funcional | Detalle público de equipo |
| `/asociate` | `asociate/page.tsx` | Funcional | Pre-inscripción multi-step |
| `/login` | `login/page.tsx` | Funcional | Magic link login |
| `/terminos` | `terminos/page.tsx` | Funcional | Términos y condiciones |
| `/privacidad` | `privacidad/page.tsx` | Funcional | Política de privacidad |

**Layout:** `(public)/layout.tsx` — Header público + footer + branding dinámico

### Panel admin — `app/admin/`

| Ruta | Archivo | Estado | Propósito |
|------|---------|--------|-----------|
| `/admin` | `page.tsx` | Funcional | Dashboard admin (resumen) |
| `/admin/personas` | `personas/page.tsx` | Funcional | Lista personas con filtros, búsqueda, columnas configurables |
| `/admin/personas/[id]` | `personas/[id]/page.tsx` | Funcional | Ficha persona (10 tabs) |
| `/admin/personas/[id]/historial` | `personas/[id]/historial/page.tsx` | Funcional | Historial de cambios persona |
| `/admin/personas/importar` | `personas/importar/page.tsx` | Funcional | Import bulk CSV personas |
| `/admin/padrones` | `padrones/page.tsx` | Funcional | Lista de padrones |
| `/admin/padrones/[id]` | `padrones/[id]/page.tsx` | Funcional | Detalle padrón + miembros + sincronizaciones |
| `/admin/padrones/[id]/importar` | `padrones/[id]/importar/page.tsx` | Funcional | Import miembros (wizard viejo, deprecated) |
| `/admin/padrones/[id]/sync/nuevo` | `padrones/[id]/sync/nuevo/page.tsx` | Funcional | Subir archivo para sync nuevo |
| `/admin/padrones/[id]/sync/[runId]` | `padrones/[id]/sync/[runId]/page.tsx` | Funcional | Revisión de run de sync |
| `/admin/padrones/[id]/sync` | `padrones/[id]/sync/page.tsx` | Funcional | Historial de syncs del padrón |
| `/admin/padrones/comparar` | `padrones/comparar/page.tsx` | Funcional | Comparador de padrones |
| `/admin/padrones/conflictos` | `padrones/conflictos/page.tsx` | Funcional | Conflictos de padrones |
| `/admin/padrones/sincronizar` | `padrones/sincronizar/page.tsx` | **Legacy** | Sync viejo (upload + historial) |
| `/admin/padrones/sincronizar/[syncId]` | `padrones/sincronizar/[syncId]/page.tsx` | **Legacy** | Revisión sync vieja |
| `/admin/equipos` | `equipos/page.tsx` | Funcional | Lista equipos |
| `/admin/equipos/[id]` | `equipos/[id]/page.tsx` | Funcional | Detalle equipo (plantel, staff, calendario, config) |
| `/admin/equipos/capitanes` | `equipos/capitanes/page.tsx` | Funcional | Listado capitanes |
| `/admin/equipos/importar` | `equipos/importar/page.tsx` | Funcional | Import bulk equipos |
| `/admin/externos` | `externos/page.tsx` | Funcional | Lista entidades (proveedores, federaciones) |
| `/admin/externos/[id]` | `externos/[id]/page.tsx` | Funcional | Detalle entidad |
| `/admin/externos/importar` | `externos/importar/page.tsx` | Funcional | Import entidades |
| `/admin/finanzas` | `finanzas/page.tsx` | Funcional | Dashboard financiero |
| `/admin/finanzas/cajas` | `finanzas/cajas/page.tsx` | Funcional | Lista cajas |
| `/admin/finanzas/cajas/[id]` | `finanzas/cajas/[id]/page.tsx` | Funcional | Detalle caja + movimientos |
| `/admin/finanzas/movimientos` | `finanzas/movimientos/page.tsx` | Funcional | Lista movimientos |
| `/admin/finanzas/productos` | `finanzas/productos/page.tsx` | Funcional | Productos ERP |
| `/admin/finanzas/productos/importar` | `finanzas/productos/importar/page.tsx` | Funcional | Import productos (4 pasos) |
| `/admin/finanzas/cuotas` | `finanzas/cuotas/page.tsx` | Funcional | Cuotas (3 tabs: planes, emisiones, estado) |
| `/admin/finanzas/plan-cuentas` | `finanzas/plan-cuentas/page.tsx` | Funcional | Plan de cuentas jerárquico |
| `/admin/operaciones` | `operaciones/page.tsx` | Funcional | Ops semanales + asistencia |
| `/admin/operaciones/scouting` | `operaciones/scouting/page.tsx` | Funcional | Lista fichas scouting |
| `/admin/operaciones/scouting/[id]` | `operaciones/scouting/[id]/page.tsx` | Funcional | Detalle ficha scouting |
| `/admin/rrhh` | `rrhh/page.tsx` | Funcional | Dashboard RRHH |
| `/admin/rrhh/contratos` | `rrhh/contratos/page.tsx` | Funcional | Lista contratos |
| `/admin/rrhh/liquidaciones` | `rrhh/liquidaciones/page.tsx` | Funcional | Lista liquidaciones |
| `/admin/comunicaciones` | `comunicaciones/page.tsx` | Funcional | Dashboard comunicaciones |
| `/admin/comunicaciones/plantillas` | `comunicaciones/plantillas/page.tsx` | Funcional | ABM plantillas |
| `/admin/comunicaciones/envios` | `comunicaciones/envios/page.tsx` | Funcional | Listado envíos |
| `/admin/integraciones` | `integraciones/page.tsx` | Funcional | Dashboard + API Keys ABM + Logs |
| `/admin/configuracion` | `configuracion/page.tsx` | Funcional | Config tenant |
| `/admin/configuracion/branding` | `configuracion/branding/page.tsx` | Funcional | Branding Studio (6 tabs) |
| `/admin/mi-perfil` | `mi-perfil/page.tsx` | Funcional | Perfil usuario logueado |
| `/admin/mi-equipo` | `mi-equipo/page.tsx` | Funcional | Vista por rol |
| `/admin/mi-cuenta` | `mi-cuenta/page.tsx` | Funcional | Cuenta corriente personal |
| `/admin/notificaciones` | `notificaciones/page.tsx` | Funcional | Listado notificaciones |
| `/admin/pre-inscripciones` | `pre-inscripciones/page.tsx` | Funcional | Admin de pre-inscripciones |
| `/admin/cajas` | `cajas/page.tsx` | Redirect | Redirige a `/admin/finanzas/cajas` |

**Layouts:**
- `app/layout.tsx` — Root layout (fonts, theme provider)
- `app/admin/layout.tsx` — Sidebar + topbar + auth check
- `app/admin/finanzas/layout.tsx` — Sub-layout finanzas
- `app/admin/rrhh/layout.tsx` — Sub-layout RRHH

### API Routes — `app/api/`

| Ruta | Método(s) | Propósito |
|------|-----------|-----------|
| `/api/auth/callback` | GET | Supabase auth callback (magic link) |
| `/api/v1/personas` | GET, POST | API REST: listar/crear personas |
| `/api/v1/personas/[id]` | GET, PATCH | API REST: detalle/editar persona |
| `/api/v1/equipos` | GET | API REST: listar equipos |
| `/api/asistencias/[eventoId]` | GET/POST | Asistencias por evento |
| `/api/notificaciones` | GET | Listar notificaciones del usuario |
| `/api/notificaciones/leer` | POST | Marcar notificaciones como leídas |
| `/api/operaciones/eventos` | GET | Eventos para ops semanales |
| `/api/cron/dispatch-vencimientos` | GET | Cron: despacha alertas de vencimientos (9 AM UTC diario) |
| `/api/cron/cleanup-api-logs` | GET | Cron: limpia api_logs > 90 días (domingos 3 AM) |

## 3.2 Server actions por módulo

### Personas — `app/admin/personas/_actions.ts`
- `crearPersona(formData)` — Crear persona con dedupe por DNI
- `editarPersona(id, formData)` — Editar persona
- `eliminarPersona(id)` — Soft-delete con protección financiera
- `buscarPersonas(query)` — Búsqueda por nombre/DNI
- `asignarAtributo(personaId, slug)` — Agregar atributo
- `revocarAtributo(personaId, slug)` — Desactivar atributo
- (más funciones de vínculos, documentos, equipos, etc.)

### Personas Import — `app/admin/personas/importar/_actions.ts`
- `importarPersonas(formData)` — Import masivo CSV

### Padrones — `app/admin/padrones/_actions.ts`
- `crearPadron(formData)` — Crear padrón
- `editarPadron(id, formData)` — Editar padrón
- `eliminarPadron(id)` — Soft-delete padrón
- `agregarMiembro(padronId, personaId, datos)` — Agregar persona a padrón
- `quitarMiembro(padronId, personaId)` — Quitar miembro

### Padrones Import (legacy) — `app/admin/padrones/[id]/importar/_actions.ts`
- Importación vieja de miembros de padrón

### Padrones Sync (legacy) — `app/admin/padrones/sincronizar/_actions.ts`
- `subirArchivoSync(formData)` — Upload + procesamiento sync viejo
- `aplicarSyncBatch(syncId, diffIds)` — Aplicar diffs
- `editarDiff(id, datos)` — Editar diff individual

### Padrones Comparar — `app/admin/padrones/comparar/_actions.ts`
- `compararPadrones(ids)` — Comparar dos padrones

### Imports (nuevo) — `lib/imports/actions.ts`
- `iniciarImportRun(pipelineSlug, formData, padronId)` — Crea run, parsea archivo
- `procesarMatching(runId)` — Ejecuta matching fuzzy
- `reprocesarMatching(runId, soloSinMatch)` — Re-procesa matching
- `resolverCandidato(rowId, decision, opciones)` — Resolver fila individual
- `resolverBulk(runId, matchStatus, decision)` — Resolver en bulk
- `aplicarRun(runId)` — Ejecutar apply_rules
- `obtenerRuns(filtros)` — Listar runs
- `obtenerRun(runId)` — Detalle de un run con filas

### Equipos — `app/admin/equipos/_actions.ts`
- `crearEquipo(formData)` — Crear equipo
- `editarEquipo(id, formData)` — Editar equipo
- `eliminarEquipo(id)` — Soft-delete equipo
- `asignarPersonaEquipo(personaId, equipoId, rol)` — Asignar persona

### Equipos Import — `app/admin/equipos/importar/_actions.ts`
- Import masivo equipos

### Entidades — `app/admin/externos/_actions.ts`
- `crearEntidad(formData)` — Crear entidad
- `editarEntidad(id, formData)` — Editar
- `eliminarEntidad(id)` — Soft-delete con protección financiera

### Finanzas — `app/admin/finanzas/_actions.ts`
- `crearCaja(formData)` — Crear caja
- `editarCaja(id, formData)` — Editar caja
- `toggleCaja(id)` — Activar/desactivar caja

### Finanzas Movimientos — `app/admin/finanzas/movimientos/_actions.ts`
- `crearMovimiento(formData)` — Crear movimiento
- `anularMovimiento(id)` — Anular movimiento

### Finanzas Productos — `app/admin/finanzas/productos/_actions.ts`
- `crearProducto(formData)` — Crear producto ERP
- `editarProducto(id, formData)` — Editar
- `toggleProducto(id)` — Activar/desactivar

### Finanzas Cuotas — `app/admin/finanzas/cuotas/_actions.ts`
- `crearPlanCuota(formData)` — Crear plan
- `emitirCuotas(planId, datos)` — Emitir cuotas masivas
- `registrarPago(cuotaId, datos)` — Registrar pago

### RRHH — `app/admin/rrhh/_actions.ts`
- `crearContrato(formData)` — Crear contrato
- `editarContrato(id, formData)` — Editar
- `rescindirContrato(id)` — Rescindir contrato
- `crearLiquidacion(formData)` — Crear liquidación (genera movimiento_caja)
- `anularLiquidacion(id)` — Anular (anula movimiento_caja)

### Comunicaciones — `app/admin/comunicaciones/_actions.ts`
- `crearPlantilla(formData)` — Crear plantilla
- `editarPlantilla(id, formData)` — Editar
- `enviarMensaje(datos)` — Enviar mensaje
- `enviarPrueba(plantillaId)` — Enviar prueba (stub)

### Configuración — `app/admin/configuracion/_actions.ts`
- `guardarConfigTenant(formData)` — Guardar config tenant

### Configuración Branding — `app/admin/configuracion/branding/_actions.ts`
- `guardarBranding(formData)` — Guardar branding (6 tabs)

### Integraciones — `app/admin/integraciones/_actions.ts`
- `crearApiKey(formData)` — Crear API key
- `revocarApiKey(id)` — Revocar key

### Operaciones — `app/admin/operaciones/_actions.ts`
- `generarAsistencias(eventoId)` — Generar asistencias para equipo
- `registrarAsistencia(datos)` — Registrar asistencia individual

### Scouting — `app/admin/operaciones/scouting/_actions.ts`
- `crearFichaScouting(formData)` — Crear ficha
- `editarFichaScouting(id, formData)` — Editar
- `eliminarFichaScouting(id)` — Hard-delete (datos temporales)

### Mi Perfil — `app/admin/mi-perfil/_actions.ts`
- `actualizarPerfil(formData)` — Editar perfil propio

### Pre-inscripciones — `app/admin/pre-inscripciones/_actions.ts`
- `aprobarPreInscripcion(id)` — Aprobar
- `rechazarPreInscripcion(id, motivo)` — Rechazar

### Asociate (público) — `app/(public)/asociate/_actions.ts`
- `submitPreInscripcion(formData)` — Submit pre-inscripción pública

## 3.3 Componentes UI

### Componentes shadcn/ui base (`components/ui/`)

| Componente | Archivo |
|-----------|---------|
| AlertDialog | `alert-dialog.tsx` |
| Avatar | `avatar.tsx` |
| Badge | `badge.tsx` |
| Button | `button.tsx` |
| Card | `card.tsx` |
| Checkbox | `checkbox.tsx` |
| Command | `command.tsx` |
| Dialog | `dialog.tsx` |
| DropdownMenu | `dropdown-menu.tsx` |
| Input | `input.tsx` |
| Label | `label.tsx` |
| Popover | `popover.tsx` |
| Progress | `progress.tsx` |
| Select | `select.tsx` |
| Separator | `separator.tsx` |
| Sheet | `sheet.tsx` |
| Switch | `switch.tsx` |
| Table | `table.tsx` |
| Tabs | `tabs.tsx` |
| Textarea | `textarea.tsx` |
| Tooltip | `tooltip.tsx` |
| Sonner (toasts) | `sonner.tsx` |

### Componentes custom del proyecto (`components/ui/`)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| VistasPanel | `vistas-panel.tsx` | Columnas configurables + vistas guardadas |
| SelectionBar | `selection-bar.tsx` | Barra de selección para export parcial |
| ExportFormatSelector | `export-format-selector.tsx` | Selector formato export (CSV/XLSX/PDF) |
| ColumnConfigGeneric | `column-config-generic.tsx` | Config columnas genérica |
| DownloadTemplateButton | `download-template-button.tsx` | Botón descarga template |
| InputGroup | `input-group.tsx` | Input con label y error |

### Componentes layout (`components/layout/`)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| Sidebar | `sidebar.tsx` | Sidebar colapsable con secciones |
| Topbar | `topbar.tsx` | Barra superior con usuario + búsqueda |
| MobileNav | `mobile-nav.tsx` | Navegación mobile |
| GlobalSearch | `global-search.tsx` | Búsqueda global Cmd+K |
| ThemeToggle | `theme-toggle.tsx` | Toggle dark/light mode |
| NotificacionesDropdown | `notificaciones-dropdown.tsx` | Bell dropdown notificaciones |

### Componentes auth (`components/auth/`)

| Componente | Archivo | Propósito |
|-----------|---------|-----------|
| LoginForm | `login-form.tsx` | Formulario de login |
| MagicLinkForm | `magic-link-form.tsx` | Formulario magic link |

## 3.4 Hooks y utilidades

### Lib utilities

| Path | Propósito |
|------|-----------|
| `lib/utils.ts` | `cn()` (class merger), helpers generales |
| `lib/tenant.ts` | TENANT_ID constante + helpers tenant |
| `lib/supabase/server.ts` | `createClient()` server-side |
| `lib/supabase/client.ts` | `createClient()` client-side |
| `lib/supabase/middleware.ts` | Middleware helpers |
| `lib/export/formats.ts` | Export a CSV, XLSX, PDF, PDF membretado |
| `lib/export/template.ts` | Templates descargables |
| `lib/search/global-search.ts` | Búsqueda global cross-módulo |
| `lib/vinculos/labels.ts` | Labels humanos para vínculos |
| `lib/vistas/actions.ts` | CRUD vistas guardadas |
| `lib/vistas/column-defs.ts` | Definiciones de columnas por módulo |
| `lib/api/auth.ts` | Hash, validate, generate API keys |
| `lib/api/helpers.ts` | Helpers API (pagination, response) |
| `lib/api/scopes.ts` | Definición de scopes |
| `lib/comunicaciones/email.ts` | Envío emails vía Resend |
| `lib/comunicaciones/notificar.ts` | `notificarPersona()` |
| `lib/imports/actions.ts` | Server actions de importación (nuevo) |
| `lib/imports/parsers/agrupado-por-grupo.ts` | Parser para XLSX agrupados por headers |
| `lib/padron-sync/parsers.ts` | Parsers del sistema viejo de sync |
| `lib/padron-sync/processor.ts` | Procesador del sistema viejo |
| `middleware.ts` | Auth middleware (protege `/admin/*`) |

### Hooks

No hay archivos de hooks custom dedicados. Los hooks inline son:
- `useDebounce` — usado inline en componentes de búsqueda
- `useVistasColumns` — concepto documentado pero implementado inline
