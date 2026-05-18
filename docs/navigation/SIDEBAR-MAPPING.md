# Sidebar Mapping — Viejo a Nuevo (B9)

## Mapeo de entradas del sidebar viejo al nuevo sistema de 4 espacios

| Entrada vieja | Sección vieja | Espacio nuevo | Grupo nuevo | Item ID |
|---|---|---|---|---|
| Inicio | Troncal | Mi Día | Principal | home |
| Personas | Troncal | Operación | CRM | personas |
| Entidades | Troncal | Operación | CRM | entidades |
| Proyectos | Troncal | Operación | Proyectos | proyectos |
| Productos | Troncal | Gestión | PIM | productos |
| Calendario (Operaciones) | Troncal | Mi Día | Principal | mi-agenda |
| Planificador | Troncal | Operación | Op. deportiva | entrenamientos |
| Sedes | Troncal > Config | Setup | Configuración | sedes |
| Espacios | Troncal > Config | Setup | Configuración | espacios-config |
| Atributos custom | Troncal > Config | Setup | Configuración | atributos-custom |
| Marketplace | Troncal > Config | Setup | Configuración | modulos |
| General | Troncal > Config | Setup | Configuración | tenant |
| Dashboard Finanzas | Troncal > Finanzas | Gestión | Finanzas | finanzas |
| Cajas | Troncal > Finanzas | Operación | Atención al socio | caja |
| Movimientos | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Cuotas | Troncal > Finanzas | Operación | Atención al socio | cobranzas |
| Suscripciones | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Centros de costo | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Plan de cuentas | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Periodos | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Cotizaciones | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Convenios | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Cuenta corriente | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Conciliacion | Troncal > Finanzas | Gestión | Finanzas | conciliacion |
| Config finanzas | Troncal > Finanzas | (sub-page de Finanzas) | — | — |
| Reportes contables (5) | Troncal > Finanzas | Gestión | Finanzas | reportes-contables |
| Comunicaciones Dashboard | Troncal > Com. | Operación | Atención al socio | comunicaciones |
| Plantillas | Troncal > Com. | (sub-page de Comunicaciones) | — | — |
| Envíos | Troncal > Com. | (sub-page de Comunicaciones) | — | — |
| Reservas | Cross-vertical | Operación | Servicios al socio | reservas |
| POS / Concesiones | Cross-vertical | Operación | Servicios al socio | concesiones |
| Utilería | Cross-vertical | Operación | Servicios al socio | utileria |
| Acceso | Cross-vertical | Operación | Servicios al socio | acceso |
| Pre-inscripciones | Cross-vertical | Operación | Pre-inscripciones | pre-inscripciones |
| Nóminas externas | Cross-vertical | Operación | Servicios al socio | nominas-externas |
| RRHH Dashboard | Cross-vertical > RRHH | Gestión | RRHH | rrhh |
| Contratos | Cross-vertical > RRHH | (sub-page de RRHH) | — | — |
| Liquidaciones | Cross-vertical > RRHH | (sub-page de RRHH) | — | — |
| Equipos | CCBP | Operación | Op. deportiva | plantel |
| Cuerpo Técnico | CCBP | (sub-page de Equipos) | — | — |
| Padrones | CCBP | Operación | Op. deportiva | padrones |
| Salud | CCBP | Operación | Op. deportiva | salud |
| Scouting | CCBP | Operación | Op. deportiva | scouting |
| Reportes Deportivos | CCBP | Gestión | Reportes deportivos | reportes-deportivos |
| Membresías | CCBP | Operación | Atención al socio | membresias |
| Mapa del Club | CCBP | Setup | Vertical | mapa-club |
| Torneos | CCBP > Competencias | Operación | Op. deportiva | torneos |
| Inscripciones | CCBP > Competencias | (sub-page de Torneos) | — | — |
| Estadísticas | CCBP > Competencias | Gestión | Reportes deportivos | estadisticas |
| Mi perfil | Personal | (User menu) | — | — |
| Mi equipo | Personal | (User menu) | — | — |
| Mi cuenta | Personal | (User menu) | — | — |
| Notificaciones | Personal | Mi Día | Principal | notificaciones |

## Sub-pages accesibles vía navegación interna (nivel 3)

Las siguientes sub-pages del sidebar viejo NO aparecen como items del sidebar nuevo.
Se acceden navegando dentro del módulo (tabs, links internos, breadcrumbs):

- Finanzas: Movimientos, Suscripciones, Centros de costo, Plan de cuentas, Periodos, Cotizaciones, Convenios, Cuenta corriente, Config, Productos sin cuentas
- Comunicaciones: Plantillas, Envíos
- RRHH: Contratos, Liquidaciones
- Productos: Categorías, Marcas, Listas de precios, Movimientos stock
- Competencias: Inscripciones
- Equipos: Cuerpo técnico, Importar, Capitanes

## Correcciones de URL realizadas

| Item | URL del prompt | URL real | Motivo |
|---|---|---|---|
| home | `/` | `/admin` | La raíz del admin es /admin |
| mi-agenda | `/mi-agenda` | `/admin/operaciones` | No existe /mi-agenda, el calendario está en operaciones |
| mis-tareas | `/mis-tareas` | `/admin/proyectos` (soon) | No existe página standalone de tareas |
| notificaciones | `/notificaciones` | `/admin/notificaciones` | Faltaba prefix /admin |
| personas | `/personas` | `/admin/personas` | Faltaba prefix /admin |
| entidades | `/entidades` | `/admin/entidades` | Faltaba prefix /admin |
| cobranzas | `/admin/cobranzas` | `/admin/finanzas/cuotas` | La página de cuotas está bajo finanzas |
| caja | `/admin/caja` | `/admin/finanzas/cajas` | La página de cajas está bajo finanzas |
| plantel | `/equipos` | `/admin/equipos` | Faltaba prefix /admin |
| torneos | `/admin/torneos` | `/admin/competencias/torneos` | Los torneos están bajo competencias |
| estadisticas | `/admin/estadisticas` | `/admin/competencias/stats/jugadores` | Las stats están bajo competencias |
| reportes-contables | `/admin/finanzas/reportes` | `/admin/finanzas/reportes/libro-mayor` | No existe index de reportes |
| usuarios | `/setup/usuarios` | `/admin/configuracion/usuarios` | Corrección confirmada por Yair |
| atributos-custom | `/configuracion/atributos-custom` | `/admin/configuracion/atributos-custom` | Faltaba prefix /admin |
| modulos | `/setup/modulos` | `/admin/marketplace` | La página de módulos es el marketplace |
| tenant | `/setup/tenant` | `/admin/configuracion` | La config general del tenant es /admin/configuracion |
| integraciones | `/setup/integraciones` | `/admin/integraciones` | Faltaba prefix /admin |

## Items del prompt B9 removidos (sin página existente)

| Item prompt | Motivo |
|---|---|
| vinculos | No existe página de vínculos cruzados |
| asistencias (standalone) | Se accede via eventos, href redirigido a /admin/operaciones con badge:soon |
| partidos (standalone) | Se accede via torneos/competencias |
| tienda | No existe /admin/tienda |
| solicitudes (genérico) | Solicitudes está en /admin/utileria/solicitudes, no genérico |
| auditoria | No existe /admin/auditoria |
| planes | No existe /setup/planes |
| catalogos | No existe /setup/catalogos |

## Items del sidebar viejo agregados al nuevo (no estaban en prompt)

| Item | Espacio | Grupo | Motivo |
|---|---|---|---|
| padrones | Operación | Op. deportiva | Existía en sidebar viejo, tiene página |
| nominas-externas | Operación | Servicios al socio | Existía en sidebar viejo, tiene página |
| sedes | Setup | Configuración | Existía en sidebar viejo, tiene página |
| espacios-config | Setup | Configuración | Existía en sidebar viejo, tiene página |
| dashboard-socios | Gestión | Dashboards | Existía en sidebar viejo, tiene página (/admin/membresias/dashboard) |
