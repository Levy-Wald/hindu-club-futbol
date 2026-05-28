# Catalogo de modulos

> Generado: 26 de mayo de 2026 (post audit + module catalog sync)
> Total: 37 modulos fisicos en `modules/`

---

## Modulos del troncal (Capa 0)

| Modulo | Bloque troncal | Tablas principales | Estado |
|---|---|---|---|
| pim | PIM N1 | productos, productos_variantes, producto_categorias, producto_categoria_links, producto_marcas, producto_imagenes | DONE |
| finanzas | ERP Finanzas | cajas, movimientos_caja, plan_cuentas, cuentas_corrientes, cotizaciones, convenios_pago, conciliacion_movimientos_bancarios, config_financiera, periodos_contables, centros_costo | DONE |
| comunicaciones | Motor Comunicaciones | com_plantillas, com_envios, com_mensajes, com_jobs_log | PARCIAL (~60%) |
| eventos_calendario | Eventos & Calendario | eventos, evento_asistencias, evento_invitados | DONE |
| notificaciones | Auditoria & Seguridad | notificaciones | DONE |
| atributos-custom | Plataforma | atributos_custom_definicion, atributos_custom_valores, vinculos_cross | DONE |
| eventos | Plataforma | UI backbone (ADR-042) — tablas en eventos_calendario | DONE |
| proyectos | Plataforma | proyectos, proyecto_tareas, proyecto_miembros, proyecto_comentarios | DONE |

**Nota**: CRM (personas, entidades, padrones, imports) vive en troncal (`app/admin/(troncal)/`) sin modulo en `modules/`. Cobranza recurrente (cuotas, emisiones, suscripciones) tambien esta en troncal. Proyectos & Tareas — en produccion en Capa 0 Troncal (modulo proyectos).

---

## Modulos cross-vertical (Capa 1)

| Modulo | Tablas principales | Estado |
|---|---|---|
| asistencias | evento_asistencias (compartida con eventos) | DONE |
| reservas | reservas_canchas | DONE |
| concesiones | concesionarios, concesion_puntos_venta, concesion_productos, concesion_ventas, concesion_venta_items, concesion_canones | DONE |
| utileria | utileria_items, utileria_solicitudes, utileria_solicitud_items, utileria_kits, utileria_kit_items, utileria_cargos_reposicion | DONE (deuda: consolidar en productos D5) |
| acceso | acceso_logs, personas_credenciales_acceso | DONE |
| pre_inscripciones | pre_inscripciones | DONE |
| rrhh | rrhh_contratos, rrhh_liquidaciones | DONE |
| nominas_externas | nominas_externas, nomina_externa_items | DONE |
| espacios | espacios | DONE |
| solicitudes | solicitudes | DONE |
| membresias | suscripciones, v_resumen_membresias, v_socios_activos | DONE |
| socios | suscripciones (compartida con cobranza) | HUERFANO hasta B5 (convertir en suscripciones_membresia) |
| proveedores | producto_proveedores (compartida con PIM) | HUERFANO (posible absorcion en entidades) |

---

## Modulos del vertical CCBP (Capa 2)

| Modulo | Tablas principales | Estado |
|---|---|---|
| equipos | equipos, categorias_equipo, personas_equipos, equipos_competencias | DONE |
| entrenamientos | entrenamiento_planes, entrenamiento_plan_bloques | DONE |
| amistosos | (usa eventos + partidos_detalle) | DONE |
| tactica | esquemas_tacticos, esquema_posiciones | DONE |
| competencias | (namespace compartido con torneos) | DONE |
| torneos | torneos, torneo_categorias, torneo_equipos, torneo_partidos_eventos | DONE |
| partidos | partidos_detalle, partido_stats_jugador | DONE |
| planificadores | (usa eventos + calendario) | DONE |
| salud | personas_datos_medicos, personas_lesiones, personas_autorizaciones, personas_documentos_medicos, personas_contactos_emergencia, personas_obra_social | DONE (UI parcial, B1 completa) |
| scouting | scouting_fichas | NO UI (tabla existe, B3 construye UI) |
| diagramacion-club | diagramacion_club, espacios, sedes | DONE |
| historial-deportivo | persona_logros, persona_trayectoria_clubes | DONE |
| reportes-deportivos | v_comparativa_equipos, v_performance_jugadores, v_stats_equipo | DONE (read-only por diseno) |
| salud-lesiones | personas_lesiones, tipos_lesion, v_personas_lesionadas_activas | DONE |
| disciplinas | personas_disciplinas, catalogo_disciplinas | HUERFANO (sin UI conectada) |
| talles | personas_talles, catalogo_tipos_talle | HUERFANO (validar uso post F4) |

---

## Resumen por estado

| Estado | Cantidad | Modulos |
|---|---|---|
| DONE | 30 | pim, finanzas, eventos_calendario, notificaciones, atributos-custom, eventos, proyectos, asistencias, reservas, concesiones, utileria, acceso, pre_inscripciones, rrhh, nominas_externas, espacios, solicitudes, membresias, equipos, entrenamientos, amistosos, tactica, competencias, torneos, partidos, planificadores, diagramacion-club, historial-deportivo, reportes-deportivos, salud-lesiones |
| PARCIAL | 2 | comunicaciones (~60%), salud (UI parcial) |
| HUERFANO | 4 | socios, proveedores, disciplinas, talles |
| NO UI | 1 | scouting (tabla existe) |

---

## Modulos huerfanos / deuda

| Modulo | Razon | Accion |
|---|---|---|
| disciplinas | Sin UI conectada | Decidir si absorber en equipos o mantener standalone |
| proveedores | Posible duplicado con entidades | Decidir absorcion en entidades |
| talles | Necesidad incierta | Validar uso post F4 |
| socios | Huerfano hasta B5 | Convertir en suscripciones_membresia (B5) |

Los 6 modulos que estaban sin module.json (atributos-custom, diagramacion-club, historial-deportivo, membresias, reportes-deportivos, salud-lesiones) fueron formalizados el 26-may-2026 con module.json v0.1.0 basado en evidencia del codigo.

---

## Dependencias entre modulos

| Modulo | Depende de |
|---|---|
| asistencias | eventos_calendario |
| reservas | espacios |
| concesiones | pim (productos), finanzas (cajas) |
| utileria | equipos |
| partidos | equipos, eventos_calendario |
| torneos | equipos, competencias |
| planificadores | eventos_calendario, equipos |
| entrenamientos | equipos, eventos_calendario |
| amistosos | equipos, eventos_calendario, partidos |
| salud | (solo troncal: personas) |
| salud-lesiones | salud, equipos |
| scouting | equipos |
| comunicaciones | (solo troncal: personas) |
| finanzas | pim (productos para tipo_uso → cuentas) |
| eventos | eventos_calendario (tablas), equipos, notificaciones |
| proyectos | (solo troncal: personas) |
| membresias | (solo troncal: personas, suscripciones) |
| historial-deportivo | (solo troncal: personas) |
| diagramacion-club | espacios |
| reportes-deportivos | equipos, partidos |
