# Modelo de datos

> Generado: 15 de mayo de 2026 (Sprint H4, Tramo 2 Hardening)
> Fuente: inventario real via MCP Supabase

Total: 140 tablas, 27 vistas, ~45 funciones SQL custom.

---

## Tablas agrupadas por familia

### Configuracion (11 tablas)

| Tabla | Descripcion |
|---|---|
| tenants | Organizaciones/clientes del sistema |
| tenant_config_publica | Configuracion publica por tenant (branding, etc.) |
| tenant_modulos | Modulos activos por tenant |
| sedes | Sedes fisicas del tenant |
| espacios | Espacios dentro de sedes (canchas, salas, depositos) |
| canchas | Canchas deportivas (legacy, migrar a espacios) |
| config_financiera | Configuracion financiera por tenant |
| periodos_contables | Periodos contables abiertos/cerrados |
| api_keys | API keys para acceso externo |
| api_logs | Log de llamadas a API |
| abuse_blocks | Bloqueos por abuso de API |

### Catalogos (30 tablas)

| Tabla | Descripcion |
|---|---|
| catalogo_areas_trabajo | Areas de trabajo para RRHH |
| catalogo_atributos | Atributos asignables a personas (roles, permisos) |
| catalogo_categorias_movimiento | Categorias de movimientos financieros |
| catalogo_companias_seguro | Companias de seguro |
| catalogo_disciplinas | Disciplinas deportivas |
| catalogo_ejercicios | Ejercicios para entrenamientos |
| catalogo_estados_padron | Estados posibles de un padron |
| catalogo_estados_persona | Estados de persona (activo, baja, etc.) |
| catalogo_modulos | Catalogo global de modulos del sistema |
| catalogo_modulos_pricing | Pricing por modulo |
| catalogo_motivos_baja | Motivos de baja de persona |
| catalogo_niveles_competencia | Niveles de competencia deportiva |
| catalogo_niveles_validacion | Niveles de validacion de datos |
| catalogo_obras_sociales | Obras sociales |
| catalogo_planes_comerciales | Planes comerciales SaaS |
| catalogo_puestos | Puestos de trabajo |
| catalogo_roles_equipo | Roles dentro de un equipo |
| catalogo_roles_laborales | Roles laborales |
| catalogo_tipos_autorizacion | Tipos de autorizacion medica |
| catalogo_tipos_documento | Tipos de documento de identidad |
| catalogo_tipos_espacio | Tipos de espacio fisico |
| catalogo_tipos_estudio | Tipos de estudio medico |
| catalogo_tipos_evento | Tipos de evento |
| catalogo_tipos_notificacion | Tipos de notificacion in-app |
| catalogo_tipos_socio | Tipos de socio/membresia |
| catalogo_tipos_talle | Tipos de talle |
| catalogo_tipos_vehiculo | Tipos de vehiculo |
| catalogo_tipos_vinculo | Tipos de vinculo entre personas |
| catalogo_unidades_medida | Unidades de medida para productos |
| tipos_comprobante | Tipos de comprobante fiscal |

### CRM — Personas (22 tablas)

| Tabla | Descripcion |
|---|---|
| personas | Tabla central de personas del sistema |
| personas_atributos | Atributos asignados a personas (roles, permisos, tags) |
| personas_autorizaciones | Autorizaciones medicas |
| personas_clubes_anteriores | Historial de clubes anteriores |
| personas_contactos_emergencia | Contactos de emergencia |
| personas_credenciales_acceso | Credenciales para acceso fisico |
| personas_datos_alimentarios | Datos alimentarios |
| personas_datos_economicos | Datos economicos |
| personas_datos_laborales | Datos laborales |
| personas_datos_medicos | Ficha medica |
| personas_disciplinas | Disciplinas deportivas de la persona |
| personas_documentos_identidad | Documentos de identidad |
| personas_documentos_medicos | Documentos medicos subidos |
| personas_equipos | Relacion persona-equipo con rol |
| personas_historial_categoria_deportiva | Historial de categorias deportivas |
| personas_historial_padron | Historial de cambios de padron |
| personas_idiomas | Idiomas que habla |
| personas_incidentes_internos | Incidentes disciplinarios |
| personas_lesiones | Registro de lesiones |
| personas_media | Archivos multimedia de la persona |
| personas_obra_social | Obra social activa |
| personas_padrones | Relacion persona-padron |
| personas_preferencias_comunicacion | Preferencias de canal de comunicacion |
| personas_premios_logros | Premios y logros |
| personas_selecciones | Selecciones nacionales |
| personas_talles | Talles de indumentaria |
| personas_vehiculos | Vehiculos registrados |
| personas_vinculos | Vinculos entre personas (padre, tutor, etc.) |

### CRM — Entidades (2 tablas)

| Tabla | Descripcion |
|---|---|
| entidades | Organizaciones externas (clubes, federaciones, sponsors, proveedores) |
| entidades_representantes | Representantes de entidades |

### CRM — Padrones e Imports (5 tablas)

| Tabla | Descripcion |
|---|---|
| padrones | Agrupadores de personas (socios, jugadores, etc.) |
| import_pipelines | Pipelines declarativos de importacion |
| import_runs | Ejecuciones de importacion |
| import_rows | Filas individuales procesadas |
| import_field_conflicts | Conflictos de campo detectados en enriquecimiento |

### PIM — Productos (12 tablas)

| Tabla | Descripcion |
|---|---|
| productos | Catalogo unificado de productos y servicios |
| productos_variantes | Variantes de producto (talles, colores) |
| producto_categorias | Categorias jerarquicas de productos |
| producto_categoria_links | Relacion N:M producto-categoria |
| producto_marcas | Marcas de productos |
| producto_listas_precios | Listas de precios (ARS, USD, etc.) |
| producto_precios | Precios por producto y lista |
| producto_stock_espacio | Stock por producto y espacio/deposito |
| producto_movimientos_stock | Movimientos de entrada/salida/transferencia de stock |
| producto_proveedores | Proveedores de producto (N:M polimorfismo persona/entidad) |
| producto_responsables | Responsables de producto (N:M polimorfismo) |
| producto_imagenes | Galeria de imagenes de producto |

### Finanzas (11 tablas)

| Tabla | Descripcion |
|---|---|
| cajas | Cajas con dimensiones fiscales (tipo_fiscal, entidad, actividad, bancarios) |
| movimientos_caja | Movimientos financieros (ingresos/egresos) |
| plan_cuentas | Plan de cuentas contable |
| cuentas_corrientes | Saldos de cuenta corriente por persona |
| cotizaciones | Cotizaciones de moneda (USD/ARS) |
| convenios_pago | Convenios de pago en cuotas |
| conciliacion_movimientos_bancarios | Movimientos bancarios importados para conciliacion |
| centros_costo | Centros de costo |
| medios_pago | Medios de pago disponibles |
| tipos_evento_validacion_default | Validaciones default por tipo de evento |
| user_vistas | Vistas personalizadas de tablas por usuario |

### Cobranza recurrente (5 tablas)

| Tabla | Descripcion |
|---|---|
| cuotas_planes | Planes de cuotas/suscripciones |
| emisiones_cuota | Emisiones masivas de cuotas |
| cuotas_emitidas | Cuotas individuales emitidas |
| cuotas_pagos | Pagos registrados contra cuotas |
| cuotas_bonificaciones | Bonificaciones aplicables a cuotas |
| suscripciones | Suscripciones activas de personas a planes |

### Comunicaciones (4 tablas)

| Tabla | Descripcion |
|---|---|
| com_plantillas | Plantillas de comunicacion (email, whatsapp, in-app) |
| com_envios | Envios individuales o masivos |
| com_mensajes | Mensajes individuales de un envio |
| com_jobs_log | Log de jobs de comunicacion |

### Eventos & Calendario (3 tablas)

| Tabla | Descripcion |
|---|---|
| eventos | Eventos genericos (entrenamientos, partidos, reuniones) |
| evento_asistencias | Asistencias a eventos (polimorfismo persona/entidad/equipo) |
| evento_invitados | Invitados a eventos |

### Equipos (3 tablas)

| Tabla | Descripcion |
|---|---|
| equipos | Equipos deportivos del tenant |
| categorias_equipo | Categorias de equipo (sub-8, sub-10, primera, etc.) |
| equipos_competencias | Competencias en las que participa un equipo |

### Torneos / Competencias (4 tablas)

| Tabla | Descripcion |
|---|---|
| torneos | Torneos y competencias |
| torneo_categorias | Categorias dentro de un torneo |
| torneo_equipos | Equipos inscriptos en torneo |
| torneo_partidos_eventos | Relacion partido-evento |

### Partidos (2 tablas)

| Tabla | Descripcion |
|---|---|
| partidos_detalle | Detalle de partidos (resultado, estadisticas) |
| partido_stats_jugador | Estadisticas individuales por jugador y partido |

### Entrenamientos (2 tablas)

| Tabla | Descripcion |
|---|---|
| entrenamiento_planes | Planes de entrenamiento |
| entrenamiento_plan_bloques | Bloques dentro de un plan de entrenamiento |

### Tactica (2 tablas)

| Tabla | Descripcion |
|---|---|
| esquemas_tacticos | Esquemas tacticos de equipo |
| esquema_posiciones | Posiciones dentro de un esquema tactico |

### Salud (tablas dentro de personas_*)

Las tablas de salud estan integradas en la familia de personas:
`personas_datos_medicos`, `personas_lesiones`, `personas_autorizaciones`,
`personas_documentos_medicos`, `personas_contactos_emergencia`,
`personas_obra_social`, `personas_datos_alimentarios`.

### Concesiones (6 tablas)

| Tabla | Descripcion |
|---|---|
| concesionarios | Concesionarios del tenant |
| concesion_puntos_venta | Puntos de venta del concesionario |
| concesion_productos | Productos del concesionario |
| concesion_ventas | Ventas registradas |
| concesion_venta_items | Items de cada venta |
| concesion_canones | Canones mensuales calculados |

### Utileria (6 tablas)

| Tabla | Descripcion |
|---|---|
| utileria_items | Items de utileria |
| utileria_solicitudes | Solicitudes de utileria |
| utileria_solicitud_items | Items de cada solicitud |
| utileria_kits | Kits predefinidos |
| utileria_kit_items | Items dentro de un kit |
| utileria_cargos_reposicion | Cargos por reposicion de items |

### RRHH (2 tablas)

| Tabla | Descripcion |
|---|---|
| rrhh_contratos | Contratos laborales |
| rrhh_liquidaciones | Liquidaciones de sueldo |

### Nominas externas (2 tablas)

| Tabla | Descripcion |
|---|---|
| nominas_externas | Nominas externas importadas |
| nomina_externa_items | Items de cada nomina |

### Acceso (1 tabla)

| Tabla | Descripcion |
|---|---|
| acceso_logs | Logs de acceso fisico |

### Reservas (1 tabla)

| Tabla | Descripcion |
|---|---|
| reservas_canchas | Reservas de canchas/espacios |

### Pre-inscripciones (1 tabla)

| Tabla | Descripcion |
|---|---|
| pre_inscripciones | Pre-inscripciones digitales |

### Notificaciones (1 tabla)

| Tabla | Descripcion |
|---|---|
| notificaciones | Notificaciones in-app |

### Scouting (1 tabla)

| Tabla | Descripcion |
|---|---|
| scouting_fichas | Fichas de scouting |

### Solicitudes (1 tabla)

| Tabla | Descripcion |
|---|---|
| solicitudes | Solicitudes genericas |

### Auditoria (1 tabla)

| Tabla | Descripcion |
|---|---|
| audit_log | Log de auditoria universal |

---

## Vistas (27)

| Vista | Descripcion |
|---|---|
| import_pending_teams_v | Equipos pendientes de resolver en imports |
| v_balance_cuentas | Reporte Balance de cuentas contables |
| v_centros_costo_stats | Estadisticas por centro de costo |
| v_concesion_ventas_mensuales | Ventas mensuales por concesionario |
| v_concesionarios_resumen | Resumen de concesionarios con totales |
| v_cuenta_corriente_persona | Saldo de cuenta corriente por persona |
| v_cuerpo_tecnico | Cuerpo tecnico consolidado |
| v_cuotas_completas | Cuotas con datos de plan, persona y pagos |
| v_cuotas_resumen_periodo | Resumen de cuotas por periodo |
| v_estado_cobranzas | Estado general de cobranzas |
| v_estado_financiero_entidad | Estado financiero por entidad |
| v_estado_financiero_persona | Estado financiero por persona |
| v_libro_mayor | Reporte Libro Mayor contable |
| v_notificaciones_no_leidas_por_persona | Notificaciones no leidas agrupadas |
| v_personas_disciplinas_vigentes | Disciplinas vigentes por persona |
| v_personas_equipos_vigentes | Equipos vigentes por persona |
| v_producto_precios_actuales | Precios actuales de productos |
| v_producto_stock_total | Stock total consolidado por producto |
| v_productos_catalogo | Vista puente PIM N1 cross-modules |
| v_salud_alertas_faltantes | Alertas de datos de salud faltantes |
| v_salud_autorizaciones | Autorizaciones medicas vigentes |
| v_salud_contactos_emergencia | Contactos de emergencia |
| v_salud_datos_medicos | Datos medicos consolidados |
| v_salud_lesiones | Lesiones activas |
| v_salud_obra_social | Obra social por persona |
| v_salud_vehiculos | Vehiculos registrados |
| v_vencimientos_proximos | Vencimientos proximos (cuotas, documentos, etc.) |

---

## Funciones SQL custom relevantes (~45)

### Funciones de negocio (`fn_*`)

| Funcion | Descripcion |
|---|---|
| fn_actualizar_cuenta_corriente | Recalcula saldo de cuenta corriente |
| fn_actualizar_saldo_caja | Actualiza saldo de una caja |
| fn_anular_emision | Anula una emision de cuotas |
| fn_anular_pago | Anula un pago |
| fn_aplicar_mora | Aplica mora a cuotas vencidas |
| fn_calcular_canon_concesion | Calcula canon mensual de concesionario |
| fn_calcular_monto_neto | Calcula monto neto de movimiento |
| fn_chequear_rate_limit | Verifica rate limit de API |
| fn_cobrar_canon_concesion | Registra cobro de canon |
| fn_cobrar_cuota | Registra pago de cuota |
| fn_crear_notificacion | Crea notificacion in-app con dedup |
| fn_emitir_cuotas_masivas | Emision masiva de cuotas (returns TABLE) |
| fn_equipos_donde_puede_solicitar_utileria | Equipos habilitados para solicitud |
| fn_generar_cargos_reposicion | Genera cargos de reposicion |
| fn_limpieza_notificaciones_old | Cron: archiva/limpia notificaciones viejas |
| fn_numerar_movimiento | Auto-numera movimientos de caja |
| fn_obtener_mp_credenciales | Obtiene credenciales MP con audit |
| fn_persona_tiene_rol_equipo | Verifica si persona tiene rol en equipo |
| fn_registrar_venta_concesion | Registra venta de concesionario (SECURITY DEFINER) |
| fn_reversar_cargo_reposicion | Reversa un cargo de reposicion |
| fn_validar_api_key | Valida API key + scopes |
| fn_vencer_cuotas | Marca cuotas como vencidas |

### Funciones de matching y normalizacion

| Funcion | Descripcion |
|---|---|
| match_persona_fuzzy | Matching fuzzy por tokens (nombre, documento) |
| normalize_name | Normaliza nombre (lowercase, unaccent) |
| dedupe_persona_por_dni | Deduplicacion por DNI |

### Funciones de resolucion

| Funcion | Descripcion |
|---|---|
| get_persona_actual | Obtiene persona del usuario logueado |
| get_persona_fk_references | Lista FKs que referencian a una persona |
| get_tenant_actual | Obtiene tenant actual |
| generar_numero_comprobante | Genera numero de comprobante fiscal |
| resolver_o_crear_equipo | Resuelve equipo existente o crea nuevo |
| obtener_entidades_invitadas_evento | Entidades invitadas a un evento |
| obtener_equipos_invitados_evento | Equipos invitados a un evento |
| obtener_invitados_evento_con_roles | Invitados con roles a un evento |

### Funciones de permisos

| Funcion | Descripcion |
|---|---|
| es_admin_sistema | Verifica si es admin del sistema |
| es_admin_tenant | Verifica si es admin del tenant |
| es_menor_de_edad | Verifica si persona es menor |
| modulo_activo | Verifica si modulo esta activo para tenant |
| tiene_atributo | Verifica si persona tiene un atributo |
| tiene_atributo_namespace | Verifica atributo con namespace |
| puede_operar_comunicaciones | Permiso para operar comunicaciones |
| puede_operar_finanzas | Permiso para operar finanzas |
| puede_operar_rrhh | Permiso para operar RRHH |
| verificar_acceso_persona | Verifica acceso de persona |
| filtrar_personas_por_preferencias_comunicacion | Filtra personas por preferencias |

### Funciones de sincronizacion

| Funcion | Descripcion |
|---|---|
| sync_atributo_suscriptor | Sync atributo suscriptor al emitir cuotas |
| sync_estado_cuota_desde_pagos | Sync estado de cuota al registrar pago |
| sync_stock_utileria | Sync stock de utileria |
| calcular_tabla_posiciones | Calcula tabla de posiciones de torneo |
| validar_suma_pagos_cuota | Valida que pagos no excedan monto |

### Triggers

| Funcion | Descripcion |
|---|---|
| trg_set_updated_at | Trigger universal para updated_at |
| trg_audit_log_personas | Audit log para cambios en personas |
| trg_audit_log_tenants | Audit log para cambios en tenants |
| trg_categorias_no_ciclo | Previene ciclos en categorias jerarquicas |
