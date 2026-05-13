SPRINT-PLAN — Lista operativa de sprints  
\=============================================

Versión: 2.0 (re-escrito post RFC-004)  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Path esperado en repo: docs/SPRINT-PLAN.md  
Referencias: ROADMAP-MASTER, RFC-004, MODULE-CATALOG

PROPÓSITO  
\=========

Lista operativa de todos los sprints del proyecto, con su estado, dependencias, tag esperado, costo y tema.

Sirve como tablero único para saber qué sprint corre ahora, qué viene después, qué está cerrado y dónde está la deuda.

CONVENCIONES  
\=============

ESTADO:  
\- ✅ DONE: cerrado, en producción  
\- 🔄 IN PROGRESS: en ejecución actual  
\- ⏳ NEXT: próximo a arrancar  
\- 📋 PLANNED: planificado, documentado  
\- 🚧 BLOCKED: bloqueado por dependencia  
\- 🗑️ CANCELLED: descartado o absorbido por otro sprint

COSTO: estimación en horas Code (rango)

TAG: tag de Git aplicado al cierre del sprint

HISTORIAL — FASES 1 A 5 (DEL MODELO ANTERIOR)  
\===============================================

Cerradas en producción. Reubicadas en la nueva taxonomía (RFC-004) según corresponda.

| Sprint | Tema                                            | Estado | Tag                          | Capa actual          |  
| \------ | \----------------------------------------------- | \------ | \---------------------------- | \-------------------- |  
| 1.x    | Init \+ personas \+ tenants                       | ✅      | varios                       | Troncal              |  
| 2.x    | Comunicaciones \+ plantillas                     | ✅      | varios                       | Troncal              |  
| 3.x    | Asistencias \+ pre-inscripciones                 | ✅      | varios                       | Cross-vertical       |  
| 3.4    | Visitantes externos (RFC-001)                   | ✅      | varios                       | Cross-vertical       |  
| 4.x    | Planificadores \+ entrenamientos \+ táctica       | ✅      | varios                       | Vertical CCBP        |  
| 4.5    | Acceso físico                                   | ✅      | varios                       | Cross-vertical       |  
| 4.6    | Reservas                                        | ✅      | varios                       | Cross-vertical       |  
| 5.1-5.6| Competencias y torneos (RFC-002)                | ✅      | v0.25.0-fase5-sprint6        | Vertical CCBP        |

Para detalles: ver historial git \+ cierres ejecutivos en Drive (carpeta ClubCore antigua).

FASE A — CERRAR TRONCAL MÍNIMO  
\================================

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  | Depende de  |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ | \----------- |  
| A1    | Fix Base Operativa \+ Espacios                   | ✅ DONE    | v0.27.0-fase-a-sprint-1       | 12-15h | FASE 5      |
| A2    | PIM Nivel 1                                     | ⏳ NEXT    | v0.27.0-fase-a-sprint-2       | 7-8h   | A1          |  
| A3    | Finanzas completa (resolver dup \+ 404s)         | 📋 PLANNED | v0.27.0-fase-a-sprint-3       | 8-10h  | A1          |  
| A4    | CRM avanzado (padrones \+ importadores)          | 📋 PLANNED | v0.27.0-fase-a-sprint-4       | 10h    | A1          |  
| A5    | Comunicaciones cierre (fix 404 \+ automatiz.)    | 📋 PLANNED | v0.27.0-fase-a-sprint-5       | 5h     | \-           |  
| A6    | Proyectos & Tareas (nuevo módulo troncal)       | 📋 PLANNED | v0.27.0-fase-a-sprint-6       | 12-15h | A1, A4      |

Total FASE A: \~55-62h Code.

Cierre de FASE A: tag v0.27.0-fase-a-completa \+ ARCHITECTURE.md revisado.

FASE B — CERRAR VERTICAL CCBP  
\================================

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  | Depende de  | RFC      |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ | \----------- | \-------- |  
| B1    | Salud / Lesiones operativas                     | 📋 PLANNED | v0.28.0-fase-b-sprint-1       | 5h     | FASE A      | RFC-003  |  
| B2    | Historial / Trayectoria deportiva               | 📋 PLANNED | v0.28.0-fase-b-sprint-2       | 4h     | B1          | RFC-003  |  
| B3    | Scouting \+ 11 dimensiones                       | 📋 PLANNED | v0.28.0-fase-b-sprint-3       | 8h     | B1, B2      | RFC-003  |  
| B4    | Reportes deportivos                             | 📋 PLANNED | v0.28.0-fase-b-sprint-4       | 6h     | B3          | RFC-003  |  
| B5    | Activar Socios (suscripciones\_membresia)        | 📋 PLANNED | v0.29.0-fase-b-sprint-5       | 5h     | A6          | \-        |  
| B6    | Cuerpo Técnico \+ Diagramación visual            | 📋 PLANNED | v0.30.0-fase-b-sprint-6       | 6h     | A1, B5      | \-        |

Total FASE B: \~30h Code.

Nota: Sprint B1 ya tiene prompt detallado armado (originalmente FASE 6.1).

Cierre de FASE B: tag v0.30.0-fase-b-completa \+ ARCHITECTURE revisado.

FASE C — DEMO A HINDU  
\========================

| ID    | Tema                                            | Estado    | Duración   |  
| \----- | \----------------------------------------------- | \--------- | \---------- |  
| C1    | Reset DB de Hindu                               | 📋 PLANNED | 1 día      |  
| C2    | Carga inicial vía importadores (por Yair)       | 📋 PLANNED | 2-3 días   |  
| C3    | Operación real del staff de Hindu               | 📋 PLANNED | 5-7 días   |  
| C4    | Recopilación de feedback \+ priorización         | 📋 PLANNED | 1-2 días   |  
| C5    | Decisión binaria: aprobado o requiere B'        | 📋 PLANNED | 1 día      |

Total FASE C: \~10-14 días calendarios (no horas Code, es validación).

Cierre de FASE C: documento de validación \+ decisión escrita.

FASE D — CROSS-VERTICAL EXTRA  
\================================

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  | Depende de  |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ | \----------- |  
| D1    | Documentos / Firma digital                      | 📋 PLANNED | v0.31.0-fase-d-sprint-1       | 8h     | FASE C      |  
| D2    | Tickets / Solicitudes universalizado            | 📋 PLANNED | v0.32.0-fase-d-sprint-2       | 6h     | D1          |  
| D3    | Pricing avanzado (PIM Nivel 2\)                  | 📋 PLANNED | v0.33.0-fase-d-sprint-3       | 6h     | A2          |  
| D4    | Stock & Movimientos (PIM Nivel 3\)               | 📋 PLANNED | v0.34.0-fase-d-sprint-4       | 10h    | A2, D3      |  
| D5    | Consolidación de tablas paralelas               | 📋 PLANNED | v0.35.0-fase-d-sprint-5       | 8-10h  | D4          |  
| D6    | Espacios físicos (mapa visual generalizado)     | 📋 PLANNED | v0.36.0-fase-d-sprint-6       | 8h     | B6, A1      |

Total FASE D: \~46-48h Code.

Cierre de FASE D: tag v0.40.0-fase-d-completa.

FASE E — ABRIR OTROS VERTICALES  
\=================================

VERTICAL E1 — Estudios de Arquitectura

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ |  
| E1.1  | Mini-troncal proyectos\_obra \+ etapas            | 📋 PLANNED | v0.41.0-fase-e1-sprint-1      | 8h     |  
| E1.2  | Cronograma de obra \+ avances con fotos          | 📋 PLANNED | v0.42.0-fase-e1-sprint-2      | 6h     |  
| E1.3  | Subcontratistas \+ planos                        | 📋 PLANNED | v0.43.0-fase-e1-sprint-3      | 6h     |  
| E1.4  | Pedidos de materiales                           | 📋 PLANNED | v0.44.0-fase-e1-sprint-4      | 5h     |

Cierre vertical E1: tag v0.45.0-fase-e1-completa. Costo \~25h.

VERTICAL E2 — Estudios de Abogacía

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ |  
| E2.1  | Mini-troncal casos / expedientes                | 📋 PLANNED | v0.46.0-fase-e2-sprint-1      | 6h     |  
| E2.2  | Audiencias \+ plazos procesales                  | 📋 PLANNED | v0.47.0-fase-e2-sprint-2      | 6h     |  
| E2.3  | Honorarios / cuota litis                        | 📋 PLANNED | v0.48.0-fase-e2-sprint-3      | 5h     |  
| E2.4  | Documentación procesal \+ poderes                | 📋 PLANNED | v0.49.0-fase-e2-sprint-4      | 6h     |

Cierre vertical E2: tag v0.50.0-fase-e2-completa. Costo \~23h.

VERTICAL E3 — Agencias de Publicidad

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ |  
| E3.1  | Mini-troncal cuentas / campañas                 | 📋 PLANNED | v0.51.0-fase-e3-sprint-1      | 6h     |  
| E3.2  | Briefings                                       | 📋 PLANNED | v0.52.0-fase-e3-sprint-2      | 5h     |  
| E3.3  | Calendarios editoriales                         | 📋 PLANNED | v0.53.0-fase-e3-sprint-3      | 5h     |  
| E3.4  | Reportes de performance                         | 📋 PLANNED | v0.54.0-fase-e3-sprint-4      | 5h     |

Cierre vertical E3: tag v0.55.0-fase-e3-completa. Costo \~21h.

VERTICAL E4 — Retailers PyME

| ID    | Tema                                            | Estado    | Tag esperado                  | Costo  |  
| \----- | \----------------------------------------------- | \--------- | \----------------------------- | \------ |  
| E4.1  | Mini-troncal sucursales \+ empleados             | 📋 PLANNED | v0.56.0-fase-e4-sprint-1      | 6h     |  
| E4.2  | Promociones \+ listas de precios                 | 📋 PLANNED | v0.57.0-fase-e4-sprint-2      | 8h     |  
| E4.3  | Vidriera digital / catálogo público             | 📋 PLANNED | v0.58.0-fase-e4-sprint-3      | 6h     |  
| E4.4  | eCommerce sync (Tiendanube/Shopify)             | 📋 PLANNED | v0.59.0-fase-e4-sprint-4      | 10h    |  
| E4.5  | Programa de fidelidad                           | 📋 PLANNED | v0.60.0-fase-e4-sprint-5      | 5h     |

Cierre vertical E4: tag v0.61.0-fase-e4-completa. Costo \~35h.

RESUMEN DE COSTOS POR FASE  
\============================

| Fase   | Sprints | Costo Code estimado | Calendario aprox. |  
| \------ | \------- | \------------------- | \----------------- |  
| FASE A | 6       | 55-62h              | \-                 |  
| FASE B | 6       | 30h                 | \-                 |  
| FASE C | 5 (no técnicos) | 0h Code     | 10-14 días        |  
| FASE D | 6       | 46-48h              | \-                 |  
| FASE E | 17 (4 verticales) | 100-110h  | \-                 |  
| TOTAL  | 35-40 sprints | 230-250h Code | \-                 |

SPRINT EN CURSO  
\=================

Sprint actual: NINGUNO. Próximo a arrancar: A1 (Fix Base Operativa \+ Espacios).

Bloqueantes para arrancar A1: ninguno. Solo armar el prompt SPRINT-A1-PROMPT.

DEUDA REGISTRADA  
\==================

Cosas planificadas pero no urgentes ahora:

| Deuda                                              | Sprint donde se resuelve |  
| \-------------------------------------------------- | \------------------------ |  
| Renombre físico modules/utileria → inventario      | D5                       |  
| Renombre físico modules/concesiones → pos          | D5                       |  
| Renombre físico modules/reservas → reservas\_espacios| D5                      |  
| Consolidación cuotas\_\* vs fin\_cuotas\_\*             | A3                       |  
| Consolidación 3 tablas paralelas de productos      | D5                       |  
| Módulo huérfano: disciplinas                       | TBD                      |  
| Módulo huérfano: proveedores (¿absorber en entidades?) | TBD                  |  
| Módulo huérfano: talles (¿es necesario?)           | TBD                      |  
| Nombre del producto raíz (no "ClubCore")           | post FASE C              |

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 2.0.  
Próxima revisión: al cierre de cada sprint (Code actualiza Tag \+ Estado).  
