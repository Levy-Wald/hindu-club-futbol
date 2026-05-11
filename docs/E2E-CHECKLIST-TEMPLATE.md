# E2E Checklist Template — ClubCore V2

> Copiar esta plantilla para cada sprint o release. Marcar cada item
> como PASS / FAIL / N/A. Todo FAIL debe tener ticket o fix antes de
> cerrar el sprint.

## 1. Build & Deploy

- [ ] `npm run build` sin errores
- [ ] `npm run lint` sin errores críticos
- [ ] Deploy a preview/staging exitoso
- [ ] No hay warnings de deprecación en consola del servidor

## 2. Auth & Seguridad

- [ ] Login funciona (email + password)
- [ ] Redirect a /login si no autenticado
- [ ] Admin layout carga sin errores
- [ ] getUser() valida contra auth server (no getSession deprecated)
- [ ] RLS policies activas en todas las tablas de negocio

## 3. Módulos Core (verificar navegación + carga)

- [ ] /admin (dashboard)
- [ ] /admin/personas (listado + detalle + tabs)
- [ ] /admin/padrones (listado + detalle)
- [ ] /admin/equipos (listado + detalle + cuerpo técnico)
- [ ] /admin/finanzas (caja + centros costo + cuotas)
- [ ] /admin/rrhh (empleados + liquidaciones)
- [ ] /admin/comunicaciones
- [ ] /admin/salud (7 tabs cargan datos)
- [ ] /admin/utileria (inventario + solicitudes + kits)
- [ ] /admin/concesiones (listado + crear)
- [ ] /admin/imports (listado + detalle run)
- [ ] /admin/configuracion

## 4. CRUD críticos

- [ ] Crear persona (campos obligatorios + opcionales)
- [ ] Editar persona (cada tab guarda correctamente)
- [ ] Soft-delete persona + restore
- [ ] Crear equipo + asignar miembros
- [ ] Asignar cuerpo técnico (modal global)
- [ ] Crear movimiento de caja
- [ ] Emitir cuotas
- [ ] Cobrar cuota
- [ ] Crear solicitud de utilería
- [ ] Crear concesionario

## 5. Flujos de importación

- [ ] Upload CSV
- [ ] Preview de matching
- [ ] Aplicar run
- [ ] Verificar datos importados

## 6. Notificaciones

- [ ] Bell icon carga sin crash
- [ ] Notificaciones se muestran en dropdown
- [ ] Mark as read funciona

## 7. Mobile / Responsive

- [ ] Navegación mobile (sidebar toggle)
- [ ] Tablas con scroll horizontal
- [ ] Modales no se cortan en pantalla chica
- [ ] Botones accesibles en mobile

## 8. Edge Cases

- [ ] Persona sin DNI (nullable numero_documento)
- [ ] Equipo sin miembros
- [ ] Concesionario sin ventas
- [ ] Cuota sin pagos
- [ ] Filtros vacíos no rompen
- [ ] Paginación en listados largos

## 9. Performance

- [ ] Listados principales cargan en <2s
- [ ] No hay N+1 queries visibles
- [ ] No hay re-renders excesivos en DevTools

## Resultado

| Categoría | PASS | FAIL | N/A |
|-----------|------|------|-----|
| Build     |      |      |     |
| Auth      |      |      |     |
| Módulos   |      |      |     |
| CRUD      |      |      |     |
| Imports   |      |      |     |
| Notif     |      |      |     |
| Mobile    |      |      |     |
| Edge      |      |      |     |
| Perf      |      |      |     |

**Firmado por:** _________________ **Fecha:** ___________
