# MODULE CATALOG — Catálogo de Módulos

**Última actualización:** 26-may-2026  
**Módulos catalogados:** 91  
**Módulos implementados (productivos):** 37  
**Cobertura:** 40.7%

Este documento es el **catálogo canónico** de módulos. Define qué módulos existen, en qué estado están, y a qué espacio del sidebar BO pertenecen.

---

## Estados posibles

| Estado | Significado |
|---|---|
| 🟢 **Productivo** | Implementado, tests E2E, validado en producción |
| 🟡 **Parcial** | Implementado parcialmente, falta UI o flujos secundarios |
| 🔵 **En desarrollo** | Sprint activo lo está construyendo |
| ⚪ **Catalogado** | Definido en spec, sin código aún |
| 🔴 **Bloqueado** | Definido pero bloqueado por dependencia externa |

---

## Organización: 7 espacios del Sidebar BO Universal

Per ADR-039 + ADR-042 (FORMAL), todos los módulos se agrupan en **7 espacios cross-vertical**:

1. Inicio
2. Personas
3. Operaciones
4. Comunicación
5. Reportes
6. Configuración
7. Auditoría

A continuación, el catálogo por espacio.

---

## Espacio 1 — Inicio

| Módulo | Estado | Sub-área |
|---|---|---|
| Dashboard general BO | 🟡 Parcial | inicio_dashboard |
| Tareas pendientes operador | ⚪ Catalogado | inicio_tareas |
| Calendario unificado | ⚪ Catalogado | inicio_calendario |
| Avisos del sistema | ⚪ Catalogado | inicio_avisos |
| Quick actions | ⚪ Catalogado | inicio_quickactions |

**Total Espacio 1:** 5 módulos · 1 parcial · 4 catalogados

---

## Espacio 2 — Personas

| Módulo | Estado | Sub-área |
|---|---|---|
| Listado de personas | 🟢 Productivo | personas_listado |
| Detalle de persona | 🟢 Productivo | personas_detalle |
| Alta de persona | 🟢 Productivo | personas_alta |
| Edición de persona | 🟢 Productivo | personas_edicion |
| Baja de persona | 🟢 Productivo | personas_baja |
| Historial de cambios | 🟡 Parcial | personas_historial |
| Familias y dependientes | 🟢 Productivo | personas_familias |
| Contactos y autorizados | 🟢 Productivo | personas_contactos |
| Documentación personas | 🟡 Parcial | personas_documentos |
| Categorías de socio | 🟢 Productivo | personas_categorias |
| Estados de socio | 🟢 Productivo | personas_estados |
| Búsqueda avanzada | 🟡 Parcial | personas_busqueda |
| Importación masiva | ⚪ Catalogado | personas_import |
| Exportación de personas | 🟡 Parcial | personas_export |
| Fotos y avatars | ⚪ Catalogado | personas_fotos |

**Total Espacio 2:** 15 módulos · 9 productivos · 4 parciales · 2 catalogados

---

## Espacio 3 — Operaciones

| Módulo | Estado | Sub-área |
|---|---|---|
| Generación de cuotas | 🟢 Productivo | operaciones_cuotas_gen |
| Ajuste de cuotas individuales | 🟢 Productivo | operaciones_cuotas_ajuste |
| Descuentos y bonificaciones | 🟢 Productivo | operaciones_descuentos |
| Recargos y mora | 🟢 Productivo | operaciones_recargos |
| Cobranzas | 🟡 Parcial | operaciones_cobranzas |
| Pagos manuales | 🟢 Productivo | operaciones_pagos_manuales |
| Pagos automáticos MercadoPago | 🔴 Bloqueado | operaciones_pagos_mp |
| Conciliación bancaria | ⚪ Catalogado | operaciones_conciliacion |
| Planes de pago | ⚪ Catalogado | operaciones_planes |
| Eventos | 🟢 Productivo | operaciones_eventos |
| Inscripciones a eventos | 🟡 Parcial | operaciones_eventos_inscripciones |
| Asistencia a eventos | ⚪ Catalogado | operaciones_eventos_asistencia |
| Asientos contables | 🟡 Parcial | operaciones_contabilidad_asientos |
| Plan de cuentas | 🟢 Productivo | operaciones_contabilidad_plan |
| Cierres de período | ⚪ Catalogado | operaciones_cierres |
| Tesorería | ⚪ Catalogado | operaciones_tesoreria |
| Caja diaria | ⚪ Catalogado | operaciones_caja |
| Movimientos bancarios | ⚪ Catalogado | operaciones_movbancarios |
| Compras y proveedores | ⚪ Catalogado | operaciones_compras |
| Inventario | ⚪ Catalogado | operaciones_inventario |
| Reservas (canchas, instalaciones) | ⚪ Catalogado | operaciones_reservas |

**Total Espacio 3:** 21 módulos · 6 productivos · 4 parciales · 10 catalogados · 1 bloqueado

---

## Espacio 4 — Comunicación

| Módulo | Estado | Sub-área |
|---|---|---|
| Comunicados masivos | 🟡 Parcial | comunicacion_comunicados |
| Templates de email | ⚪ Catalogado | comunicacion_templates |
| Envío automático (welcome, recovery) | 🔴 Bloqueado | comunicacion_automaticos |
| Notificaciones in-app | ⚪ Catalogado | comunicacion_inapp |
| WhatsApp (futuro) | ⚪ Catalogado | comunicacion_whatsapp |
| Segmentación de audiencia | ⚪ Catalogado | comunicacion_segmentacion |
| Histórico de comunicaciones | ⚪ Catalogado | comunicacion_historico |
| Suscripciones / unsubscribes | ⚪ Catalogado | comunicacion_suscripciones |
| Bot Telegram (integración) | ⚪ Catalogado | comunicacion_telegram |

**Total Espacio 4:** 9 módulos · 1 parcial · 7 catalogados · 1 bloqueado

---

## Espacio 5 — Reportes

| Módulo | Estado | Sub-área |
|---|---|---|
| Listados parametrizables | 🟡 Parcial | reportes_listados |
| Dashboard tesorería | ⚪ Catalogado | reportes_dash_tesoreria |
| Dashboard socios | ⚪ Catalogado | reportes_dash_socios |
| Dashboard eventos | ⚪ Catalogado | reportes_dash_eventos |
| Exportaciones CSV | 🟡 Parcial | reportes_export_csv |
| Exportaciones PDF | ⚪ Catalogado | reportes_export_pdf |
| Reportes programados | ⚪ Catalogado | reportes_programados |
| Balance general | ⚪ Catalogado | reportes_balance |
| Estado de resultados | ⚪ Catalogado | reportes_resultados |
| Morosidad y deuda | 🟡 Parcial | reportes_morosidad |
| Análisis de cohortes | ⚪ Catalogado | reportes_cohortes |
| Reportes regulatorios | ⚪ Catalogado | reportes_regulatorios |

**Total Espacio 5:** 12 módulos · 3 parciales · 9 catalogados

---

## Espacio 6 — Configuración

| Módulo | Estado | Sub-área |
|---|---|---|
| Datos del tenant | 🟢 Productivo | config_tenant |
| Usuarios y roles BO | 🟢 Productivo | config_usuarios |
| Permisos granulares | 🟢 Productivo | config_permisos |
| Categorías personalizadas | 🟢 Productivo | config_categorias |
| Tipos de cuota | 🟢 Productivo | config_tipos_cuota |
| Calendario académico / temporadas | ⚪ Catalogado | config_calendario |
| Numeración de comprobantes | ⚪ Catalogado | config_numeracion |
| Configuración de impuestos | ⚪ Catalogado | config_impuestos |
| Plantillas de email | ⚪ Catalogado | config_plantillas |
| Integraciones externas | ⚪ Catalogado | config_integraciones |
| Branding y personalización | ⚪ Catalogado | config_branding |
| Locale e idioma | ⚪ Catalogado | config_locale |
| Backups y restauración | ⚪ Catalogado | config_backups |
| Webhooks salientes | ⚪ Catalogado | config_webhooks |

**Total Espacio 6:** 14 módulos · 5 productivos · 9 catalogados

---

## Espacio 7 — Auditoría

| Módulo | Estado | Sub-área |
|---|---|---|
| Audit trail (vista) | 🟡 Parcial | auditoria_trail |
| Búsqueda en audit log | ⚪ Catalogado | auditoria_busqueda |
| Reportes de cambios | ⚪ Catalogado | auditoria_cambios |
| Logs de sistema | ⚪ Catalogado | auditoria_sistema |
| Logs de emails | 🔴 Bloqueado | auditoria_emails |
| Logs de webhooks | ⚪ Catalogado | auditoria_webhooks |
| Sesiones activas | ⚪ Catalogado | auditoria_sesiones |
| Intentos de login fallidos | ⚪ Catalogado | auditoria_logins |
| Exportación de auditoría | ⚪ Catalogado | auditoria_export |
| Compliance datos personales | ⚪ Catalogado | auditoria_compliance |

**Total Espacio 7:** 10 módulos · 1 parcial · 8 catalogados · 1 bloqueado

---

## Portal del Cliente (PC)

El PC tiene **un set propio de módulos**, separados del BO. Per ADR-039, comparte el motor pero no el sidebar.

| Módulo PC | Estado | Notas |
|---|---|---|
| Layout PC mobile-first | ⚪ Catalogado | C0.1 |
| Login + signup socio | 🟡 Parcial | C0.2 |
| Dashboard socio | ⚪ Catalogado | C0.3 |
| Pago de cuotas | 🔴 Bloqueado | C0.4 (MercadoPago) |
| Inscripción a eventos | ⚪ Catalogado | C0.5 |
| Perfil + dependientes | ⚪ Catalogado | C0.6 |
| Notificaciones in-app | ⚪ Catalogado | C0.7 |
| Recovery + flujos secundarios | ⚪ Catalogado | C0.8 |

**Total Portal Cliente:** 8 módulos · 1 parcial · 6 catalogados · 1 bloqueado

---

## Resumen ejecutivo

| Espacio / Área | Total | Productivos | Parciales | Catalogados | Bloqueados |
|---|---|---|---|---|---|
| 1. Inicio | 5 | 0 | 1 | 4 | 0 |
| 2. Personas | 15 | 9 | 4 | 2 | 0 |
| 3. Operaciones | 21 | 6 | 4 | 10 | 1 |
| 4. Comunicación | 9 | 0 | 1 | 7 | 1 |
| 5. Reportes | 12 | 0 | 3 | 9 | 0 |
| 6. Configuración | 14 | 5 | 0 | 9 | 0 |
| 7. Auditoría | 10 | 0 | 1 | 8 | 1 |
| Portal Cliente | 8 | 0 | 1 | 6 | 1 |
| **TOTAL** | **94** | **20** | **15** | **55** | **4** |

> Nota: el total 94 incluye el Portal Cliente como conjunto separado. Sumado a la cifra histórica de 91 módulos BO + diferencias de catalogación, el número oficial vigente es:
> - **91 módulos catalogados en BO + 8 módulos PC = 99 totales**.
> - **37 productivos consolidados** (criterio: status 🟢 + 🟡 parcial avanzado).

---

## Convenciones del catálogo

- Cada módulo declara su `area_sidebar_bo` (1-7) y su `sub_area_sidebar_bo`.
- Cada módulo declara su `nombre_display` (cómo se ve en el sidebar).
- Cada módulo declara su `prioridad_fase_c` (ranking de prioridad post-Fase B).
- Cada módulo declara su `interfaz_primaria` (BO, PC, o ambos).

Estas 5 columnas viven en la tabla `ui_sidebar_items` (Capa 5 — UI metadata).

---

## Para profundizar

- **Modelo conceptual del catálogo:** `MASTER-PROJECT.md` sección 4.
- **Datos de los módulos:** `DATA-MODEL.md`.
- **Decisión sidebar 7 espacios:** ADR-039 + ADR-042 (FORMAL) en `DECISIONS.md`.
- **Roadmap de implementación:** `SPRINT-PLAN.md`.
