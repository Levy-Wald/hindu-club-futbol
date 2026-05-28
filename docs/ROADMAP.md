ROADMAP-MASTER — Plataforma SaaS Multimodal  
\================================================

Versión: 2.0 (re-escrito post RFC-004)  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Supersedes: ROADMAP.md v1 (17 fases lineales del modelo vertical único)  
Path esperado en repo: docs/ROADMAP.md  
Referencias: RFC-004, ADR-040, ADR-041, ADR-044

CRITERIO DE ORDENAMIENTO  
\=========================

El roadmap no tiene fechas. Las fases se ordenan por DEPENDENCIAS TÉCNICAS Y COMERCIALES, no por calendario.

Una fase no se considera completa si:  
\- Sus sprints no están todos en DONE  
\- Su criterio de cierre no se cumple  
\- No hay tag en el repo correspondiente al cierre

Una fase posterior no arranca si la anterior no está completa, excepto cuando se declara paralelización explícita.

VISIÓN GENERAL  
\===============

Hay 5 fases macro. Cada una con un objetivo claro y un criterio de cierre verificable.

F1 — Cerrar troncal mínimo (objetivo: 9 bloques del troncal funcionando)
F2 — Cerrar vertical CCBP (objetivo: Hindu Club Fútbol con producto completo)
F4 — Validación Hindu (objetivo: validación end-to-end con cliente real)
F6 — Premium ERP (objetivo: nivelar capacidades para vender a otros verticales)
F8 — Abrir otros verticales (objetivo: clientes pagando en cada vertical)

F1 — CERRAR TRONCAL MÍNIMO
\================================

Objetivo: tener los 9 bloques del troncal universal (ADR-041) funcionando con UI completa, listos para soportar cualquier vertical.

Criterio de cierre:  
\- Los 9 bloques del troncal pasan smoke test funcional  
\- 0 bugs 404 conocidos en rutas troncal  
\- Sidebar reorganizado refleja taxonomía de 4 capas  
\- Tag v0.27.0-fase-a-completa

Sprints (6 sprints, costo \~55-62 horas Code):

SPRINT A1 — Fix Base Operativa  
Tema: sidebar reorganizado, planificador con creación, hub eventos, espacios genéricos, fix 8 bugs 404\.  
Capas: BD (espacios), Código, UI/UX (sidebar \+ hub eventos), Estilos  
Tag esperado: v0.27.0-fase-a-sprint-1  
Costo estimado: 12-15h  
Dependencias: F0 cerrada (vigente)

SPRINT A2 — PIM Nivel 1  
Tema: catálogo unificado con variantes \+ categorías jerárquicas \+ vista v\_productos\_catalogo \+ esqueleto inactivo de Niveles 2/3.  
Capas: BD (variantes, categorías, vista), Código, UI/UX  
Tag esperado: v0.27.0-fase-a-sprint-2  
Costo estimado: 7-8h  
Dependencias: A1

SPRINT A3 — Finanzas completa  
Tema: resolver duplicación cuotas\_\* vs fin\_cuotas\_\*, reparar 404s de movimientos/transferencias/cuotas-emitir, UI completa de finanzas.  
Capas: BD (consolidación), Código, UI/UX  
Tag esperado: v0.27.0-fase-a-sprint-3  
Costo estimado: 8-10h  
Dependencias: A1

SPRINT A4 — CRM avanzado  
Tema: UI completa de padrones, importadores universales (CSV/Excel con mapeo), vínculos personas-entidades con UI, atributos personalizados por tenant.  
Capas: BD (mejoras), Código, UI/UX  
Tag esperado: v0.27.0-fase-a-sprint-4  
Costo estimado: 10h  
Dependencias: A1

SPRINT A5 — Comunicaciones cierre  
Tema: fix 404 detalle plantilla, editor expandido, UI de automatizaciones (triggers \+ acciones), workflow editor básico.  
Capas: Código, UI/UX  
Tag esperado: v0.27.0-fase-a-sprint-5  
Costo estimado: 5h  
Dependencias: ninguna (puede correr en paralelo con A2-A4 si hay capacidad)

SPRINT A6 — Proyectos & Tareas  
Tema: 4 tablas nuevas, UI listado \+ 3 vistas (kanban/lista/calendario), modal de tarea, tab "Proyectos" en ficha persona/entidad, integraciones a Personas/Finanzas/Eventos.  
Capas: BD (4 tablas), Código, UI/UX (kanban drag-drop), Estilos  
Tag esperado: v0.27.0-fase-a-sprint-6  
Costo estimado: 12-15h  
Dependencias: A1, A4 (personas/entidades pulidas para tab "Proyectos")

F2 — CERRAR VERTICAL CCBP
\================================

Objetivo: dejar el vertical CCBP 100% productivo para Hindu y vendible a otros clubes/countries/barrios privados.

Criterio de cierre:  
\- Todos los submódulos del vertical CCBP del MODULE-CATALOG están en estado Productivo  
\- Hindu Club Fútbol puede operar end-to-end en modo mock  
\- Tag v0.30.0-fase-b-completa

Sprints (6 sprints, costo \~30 horas Code):

SPRINT B1 — Salud / Lesiones operativas  
Tema: activar tabla personas\_lesiones, UI de carga y listado, notificación automática al CT, indicador "LESIONADO" en convocatoria. Prompt ya armado (originalmente FASE 6.1, retomado en F2).  
Capas: BD (atributos \+ plantillas), Código, UI/UX, Estilos  
Tag esperado: v0.28.0-fase-b-sprint-1  
Costo estimado: 5h  
Dependencias: F1 cerrada  
RFC: RFC-003

SPRINT B2 — Historial / Trayectoria deportiva  
Tema: historial de clubes previos, logros deportivos, trayectoria visible en ficha persona.  
Capas: BD, Código, UI/UX  
Tag esperado: v0.28.0-fase-b-sprint-2  
Costo estimado: 4h  
Dependencias: B1  
RFC: RFC-003

SPRINT B3 — Scouting \+ 11 dimensiones  
Tema: scouting\_fichas y scouting\_evaluaciones, 11 dimensiones de evaluación, UI de scouter, dashboard de scouting.  
Capas: BD, Código, UI/UX  
Tag esperado: v0.28.0-fase-b-sprint-3  
Costo estimado: 8h  
Dependencias: B1, B2  
RFC: RFC-003

SPRINT B4 — Reportes deportivos  
Tema: dashboard de stats por equipo, lesionados activos, performance de jugadores, comparativas.  
Capas: Código (queries agregadas), UI/UX (gráficos)  
Tag esperado: v0.28.0-fase-b-sprint-4  
Costo estimado: 6h  
Dependencias: B3 (necesita scouting), módulos productivos previos  
RFC: RFC-003

SPRINT B5 — Activar Socios (suscripciones de membresía)  
Tema: convertir módulo huérfano "socios" en módulo cross-vertical "suscripciones\_membresia". UI de altas, bajas, estados de socio, integración con cobranza.  
Capas: BD (ajustes), Código, UI/UX  
Tag esperado: v0.29.0-fase-b-sprint-5  
Costo estimado: 5h  
Dependencias: A6 (proyectos), cobranza productiva

SPRINT B6 — Cuerpo Técnico \+ Diagramación visual  
Tema: UI integrada de cuerpo técnico en evento (no solo vía rol\_equipo\_slug), módulo nuevo "diagramacion\_club" con mapa visual 2D de canchas \+ vestuarios \+ bares \+ accesos sobre espacios\_fisicos.  
Capas: BD (espacios\_layout), Código, UI/UX (drag-drop mapa), Estilos, Galería (screenshots del mapa)  
Tag esperado: v0.30.0-fase-b-sprint-6  
Costo estimado: 6h  
Dependencias: A1 (espacios), B1-B5

PARALELIZACIÓN: B1-B4 pueden correr secuencialmente. B5 y B6 pueden correr en paralelo si hay capacidad.

F4 — VALIDACIÓN HINDU
\========================

Objetivo: validación end-to-end del producto completo con Hindu Club Fútbol en modo mock.

Criterio de cierre:  
\- Reset de DB realizado  
\- Yair y staff de Hindu cargan datos desde cero usando importadores y UI  
\- Workflow operativo real de Hindu corre durante una semana sin bloqueantes  
\- Lista de bugs/mejoras recibida y priorizada  
\- Decisión binaria: producto APROBADO para servicios externos (F6-F8) o requiere F2' (correcciones)

Actividades (no son sprints técnicos):  
\- Reset de DB del proyecto Hindu  
\- Yair descarga templates de importación (personas, equipos, eventos, etc.)  
\- Yair carga datos de Hindu desde Excel/CSV vía importadores universales  
\- Staff de Hindu (Juan Marco Lavagno \+ admins) prueba el sistema durante 5-7 días  
\- Yair y arquitecto recopilan feedback diario  
\- Cierre formal con documento de validación

NO se construyen features nuevas en F4. Solo bugs críticos si bloquean validación.

F6 — PREMIUM ERP
\================================

Objetivo: nivelar los módulos cross-vertical que más demandan los 5 verticales en hoja de ruta, antes de abrir el primero.

Criterio de cierre:  
\- Documentos / Firma operativa (los 5 verticales lo usan)  
\- Pricing avanzado (Nivel 2 del PIM) operativo  
\- Stock & Movimientos (Nivel 3 del PIM) operativo  
\- Consolidación de tablas paralelas resuelta  
\- Tag v0.40.0-fase-d-completa

Sprints (6 sprints, costo estimado \~40-50h):

SPRINT D1 — Documentos / Firma digital  
Tema: módulo nuevo de documentos con upload, versionado, firma digital mock-first (después conector externo).  
Capas: BD, Código, UI/UX, Integración (conector mock)  
Tag esperado: v0.31.0-fase-d-sprint-1  
Costo estimado: 8h

SPRINT D2 — Tickets / Solicitudes universalizado  
Tema: absorber solicitudes y utileria\_solicitudes en un módulo unificado "tickets" cross-vertical.  
Capas: BD (refactor), Código, UI/UX  
Tag esperado: v0.32.0-fase-d-sprint-2  
Costo estimado: 6h

SPRINT D3 — Pricing avanzado (PIM Nivel 2\)  
Tema: listas de precios con segmentos y vigencias, reglas de aplicación, resolución contextual de precio.  
Capas: BD (poblar tablas creadas en A2), Código, UI/UX  
Tag esperado: v0.33.0-fase-d-sprint-3  
Costo estimado: 6h

SPRINT D4 — Stock & Movimientos (PIM Nivel 3\)  
Tema: motor central de movimientos de stock, ubicaciones físicas, vista de stock real.  
Capas: BD, Código, UI/UX, integraciones espejo desde utilería y POS  
Tag esperado: v0.34.0-fase-d-sprint-4  
Costo estimado: 10h

SPRINT D5 — Consolidación de tablas paralelas  
Tema: migrar utileria\_items y concesion\_productos a productos\_servicios extendida. Eliminar duplicación cuotas\_\* vs fin\_cuotas\_\*. Renombre físico de carpetas modules/utileria → modules/inventario y modules/concesiones → modules/pos.  
Capas: BD (refactor mayor), Código (renombres masivos)  
Tag esperado: v0.35.0-fase-d-sprint-5  
Costo estimado: 8-10h  
Riesgo: alto (refactor mayor de datos productivos)

SPRINT D6 — Espacios físicos (mapa visual)  
Tema: generalizar "Diagramación de Club" como módulo cross-vertical "Mapa visual de espacios" para que también sirva a retail (vidrieras), coworking (oficinas), eventos.  
Capas: BD (espacios\_layout), Código, UI/UX (drag-drop)  
Tag esperado: v0.36.0-fase-d-sprint-6  
Costo estimado: 8h  
Dependencias: B6 (versión CCBP-específica, ahora generalizada)

F8 — ABRIR OTROS VERTICALES
\=================================

Objetivo: vender la plataforma a verticales adicionales y validar la arquitectura multi-vertical con clientes reales.

Criterio de cierre por vertical:  
\- Mini-troncal del vertical operativo  
\- Submódulos propios productivos  
\- Cross-vertical activos integrados  
\- Primer cliente real del vertical operando

Verticales en orden comercial sugerido:

VERTICAL F8.1 — Estudios de Arquitectura (cliente piloto: prima de Yair)  
Sprints: F8.1.1 (mini-troncal proyectos\_obra), F8.1.2 (cronograma \+ avances), F8.1.3 (subcontratistas \+ planos), F8.1.4 (pedidos materiales)
Tag al cierre: v0.45.0-f8-1-completa  
Costo estimado: 25-30h

VERTICAL F8.4 — Estudios de Abogacía (cliente piloto: Kate, esposa de Yair)
Sprints: F8.4.1 (mini-troncal casos), F8.4.2 (audiencias \+ plazos), F8.4.3 (honorarios), F8.4.4 (documentación procesal)
Tag al cierre: v0.50.0-f8-4-completa  
Costo estimado: 20-25h

VERTICAL F8.5 — Agencias de Publicidad
Sprints: F8.5.1 (mini-troncal cuentas), F8.5.2 (briefings), F8.5.3 (calendarios editoriales), F8.5.4 (reportes performance)
Tag al cierre: v0.55.0-f8-5-completa  
Costo estimado: 20-25h

VERTICAL F8.2 — Retailers PyME (cliente piloto: Pergamino)
Sprints: F8.2.1 (mini-troncal sucursales), F8.2.2 (promociones \+ listas de precios), F8.2.3 (vidriera digital), F8.2.4 (ecommerce sync), F8.2.5 (programa fidelidad)
Tag al cierre: v0.60.0-f8-2-completa  
Costo estimado: 30-40h

Cada vertical es independiente. Pueden correr en paralelo si hay capacidad.

HITOS COMERCIALES (no técnicos)  
\================================

Independientes del orden de fases, hay decisiones comerciales pendientes:

H1 — Nombre del producto raíz  
Estado: pendiente  
Hoy: "ClubCore" referencia al vertical CCBP, no a la plataforma.  
Decisión esperada: post F4, antes de F6.

H2 — Pricing del marketplace de módulos  
Estado: pendiente  
Necesario para que ADR-043 (modelo modular comercial) funcione comercialmente.  
Decisión esperada: post F4.

H3 — Materiales de venta por vertical  
Estado: pendiente  
Sales decks, landing pages, casos de éxito.  
Decisión esperada: durante F8, conforme se abre cada vertical.

REGLAS DE EJECUCIÓN  
\====================

1\. Mock-first universal (ADR-035) vigente hasta F4. Cualquier sprint que requiera servicio externo pago se difiere o se mockea.

2\. Reportes vía MCP, no CLI local (ADR-039). Code reporta vía Supabase MCP, GitHub MCP, Vercel MCP.

3\. Cada sprint cierra con docs vivos actualizados (PROMPT-TEMPLATE PARTE 10): CURRENT-STATE, SPRINT-PLAN, GLOSSARY, ROADMAP, DATA-MODEL, MODULE-CATALOG, VISUAL-GALLERY.

4\. Cada sprint cierra con cierre ejecutivo en Drive \`\_Cierre Ejecutivo/\`.

5\. Cada FASE cierra con cierre ejecutivo en Drive \+ ARCHITECTURE.md revisado \+ ADRs nuevos si los hay.

6\. No se contratan servicios pagos hasta validación de F4 aprobada.

7\. No se carga más data productiva de Hindu durante F1 y F2. La carga es F4.

ESTADO ACTUAL (al 13 de mayo de 2026\)  
\======================================

F0 (Base / Infra del modelo viejo): CERRADA (Hindu en producción).
F1: planificada, sprints documentados, pendiente arrancar Sprint A1.
F2: parcialmente preparada (RFC-003 \+ prompt 6.1 listo, ahora será B1).
F4–F8: planificación futura.

Próximo paso: ejecutar Sprint A1.

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 2.0.  
Próxima revisión: al cierre de cada fase.  
