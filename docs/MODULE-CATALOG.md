MODULE-CATALOG — Mapa de módulos de la Plataforma SaaS Multimodal  
\====================================================================

Versión: 1.0  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Path esperado en repo: docs/MODULE-CATALOG.md  
Referencias: RFC-004, ADR-040 (taxonomía 4 capas), ADR-041 (troncal mínimo), ADR-045 (reclasificación cross-vertical)

PROPÓSITO  
\=========

Este documento es el mapa completo de los módulos de la plataforma, clasificados según la taxonomía de 4 capas (ADR-040). Cada módulo tiene su capa, estado actual, tablas principales, dependencias y carpeta física en el código.

Sirve como referencia única para:  
\- Entender qué módulos existen y a qué capa pertenecen  
\- Saber qué está construido, en construcción o pendiente  
\- Resolver dependencias antes de planificar un sprint  
\- Mapear cada módulo a sus tablas físicas en la DB  
\- Mapear cada módulo a su carpeta modules/ en el repo

CÓMO LEER ESTE CATÁLOGO  
\========================

CAPA: a qué capa pertenece según ADR-040  
\- TRONCAL: bloque del troncal universal (ADR-041, los 9 bloques)  
\- CROSS-VERTICAL: reutilizable entre verticales (Capa 1\)  
\- VERTICAL-CCBP: específico del vertical CCBP (Capa 2\)  
\- VERTICAL-ARQ / ABOG / PUB / RETAIL: específicos de otros verticales  
\- INTEGRACIÓN: conector con sistema externo (Capa 3\)

ESTADO: situación actual del módulo  
\- ✅ Productivo: construido y operativo con datos reales  
\- 🟡 Parcial: construido parcialmente, falta UI o features  
\- 🟠 Huérfano: existe en modules/ pero sin UI ni referencia en app/admin  
\- ⏳ Planificado: por construir en sprint futuro  
\- 🆕 A crear: aparece en RFC-004 pero no existe físicamente

SPRINT DE CIERRE: sprint donde se considera cerrado el módulo

DEPENDENCIAS: otros módulos que deben estar operativos

CAPA 0 — TRONCAL UNIVERSAL (9 BLOQUES)  
\=======================================

BLOQUE 1 — CONFIGURACIÓN DEL NEGOCIO  
─────────────────────────────────────

Módulo: configuracion  
Capa: TRONCAL  
Estado: 🟡 Parcial (DB completa, UI limitada)  
Sprint de cierre: A1 (Fix Base Operativa \+ Espacios)  
Carpeta repo: modules/configuracion/ (parcial)  
Tablas principales:  
\- tenants, tenant\_modulos, tenant\_config\_publica  
\- sedes, plan\_cuentas, centros\_costo, periodos\_contables  
\- catalogo\_modulos, catalogo\_modulos\_pricing (nueva en A1)  
\- espacios (nueva en A1, ADR-040)  
Dependencias: ninguna (es la base)

BLOQUE 2 — CRM  
──────────────

Módulo: personas  
Capa: TRONCAL  
Estado: ✅ Productivo (2.395 personas en Hindu)  
Sprint de cierre: A4 (CRM avanzado)  
Carpeta repo: modules/personas/  
Tablas principales:  
\- personas \+ 24 tablas personas\_\*  
\- catalogo\_atributos, personas\_atributos  
\- catalogo\_tipos\_talle, personas\_talles  
Dependencias: configuracion

Módulo: entidades  
Capa: TRONCAL  
Estado: 🟡 Parcial (DB completa, UI limitada)  
Sprint de cierre: A4  
Carpeta repo: modules/entidades/  
Tablas principales:  
\- entidades, entidades\_representantes  
\- vínculos personas-entidades  
Dependencias: personas

Módulo: padrones  
Capa: TRONCAL  
Estado: 🟡 Parcial (DB completa, UI muy limitada)  
Sprint de cierre: A4 (Importadores universales)  
Carpeta repo: modules/padrones/  
Tablas principales: padrones, personas\_padrones, import\_\*  
Dependencias: personas

BLOQUE 3 — ERP FINANZAS BÁSICO  
───────────────────────────────

Módulo: finanzas  
Capa: TRONCAL  
Estado: 🟡 Parcial (4 páginas 404, dup cuotas\_\* vs fin\_cuotas\_\*)  
Sprint de cierre: A3 (Finanzas completa)  
Carpeta repo: modules/finanzas/  
Tablas principales:  
\- productos\_servicios, cajas, movimientos\_caja, comprobantes  
\- plan\_cuentas, medios\_pago, cuentas\_corrientes  
\- tipos\_comprobante, cotizaciones  
Dependencias: configuracion, personas, entidades  
Deuda: duplicación cuotas\_emitidas vs fin\_cuotas\_emitidas (resolver A3)

BLOQUE 4 — PIM NIVEL 1  
───────────────────────

Módulo: pim  
Capa: TRONCAL (Nivel 1\)  
Estado: 🆕 A crear (Sprint A2)  
Sprint de cierre: A2 (PIM Nivel 1\)  
Carpeta repo: modules/pim/ (a crear)  
Tablas principales:  
\- productos\_servicios (existente, compartida con Finanzas)  
\- productos\_variantes (nueva, Sprint A2)  
\- categorias\_productos (nueva, jerárquica, Sprint A2)  
\- v\_productos\_catalogo (vista UNION ALL, ADR-046)  
Dependencias: finanzas (comparte productos\_servicios)

BLOQUE 5 — COBRANZA RECURRENTE  
───────────────────────────────

Módulo: cobranza  
Capa: TRONCAL  
Estado: ✅ Productivo (102 cuotas emitidas en Hindu)  
Sprint de cierre: A3 (parte de Finanzas)  
Carpeta repo: modules/cuotas/, modules/suscripciones/  
Tablas principales:  
\- cuotas\_emitidas, cuotas\_planes (consolidación pendiente con fin\_\*)  
\- suscripciones, convenios\_pago  
Dependencias: finanzas, personas

BLOQUE 6 — MOTOR DE COMUNICACIONES  
───────────────────────────────────

Módulo: comunicaciones  
Capa: TRONCAL  
Estado: ✅ Productivo (1.381 envíos, 148 plantillas)  
Sprint de cierre: A5 (Comunicaciones cierre — fix 404 plantilla, automatizaciones)  
Carpeta repo: modules/comunicaciones/  
Tablas principales:  
\- com\_plantillas, com\_envios, com\_mensajes  
\- com\_jobs\_log, personas\_preferencias\_comunicacion  
Dependencias: personas  
Sub-bloque: notificaciones (in-app obligatorio, parte del motor)

BLOQUE 7 — EVENTOS & CALENDARIO  
────────────────────────────────

Módulo: eventos  
Capa: TRONCAL  
Estado: 🟡 Parcial (DB OK, planificador roto, hub /eventos/\[id\] da 404\)  
Sprint de cierre: A1 (Fix Base Operativa)  
Carpeta repo: modules/eventos/, modules/planificadores/, modules/eventos\_calendario/ (huérfano)  
Tablas principales:  
\- eventos, catalogo\_tipos\_evento, evento\_invitados, evento\_asistencias  
Dependencias: configuracion, personas, espacios (nueva en A1)

BLOQUE 8 — PROYECTOS & TAREAS  
──────────────────────────────

Módulo: proyectos  
Capa: TRONCAL  
Estado: 🆕 A crear (Sprint A6)  
Sprint de cierre: A6 (Proyectos & Tareas)  
Carpeta repo: modules/proyectos/ (a crear)  
Tablas principales (nuevas, Sprint A6):  
\- proyectos, proyecto\_tareas, proyecto\_comentarios, proyecto\_adjuntos  
Dependencias: personas, finanzas (proyecto\_id en movimientos), eventos (deadline crea evento)

BLOQUE 9 — AUDITORÍA & SEGURIDAD  
─────────────────────────────────

Módulo: auditoria  
Capa: TRONCAL  
Estado: ✅ Productivo  
Sprint de cierre: ya cerrado  
Carpeta repo: lib/audit/, modules/api\_keys/  
Tablas principales:  
\- audit\_log, api\_keys, api\_logs, abuse\_blocks, user\_vistas  
Dependencias: ninguna (plomería transversal)

CAPA 1 — MÓDULOS CROSS-VERTICAL  
\================================

Módulo: asistencias  
Capa: CROSS-VERTICAL (reclasificado por ADR-045)  
Estado: ✅ Productivo (FASE 3 cerrada)  
Sprint de cierre: ya cerrado, integración con salud en B1  
Carpeta repo: modules/asistencias/  
Tablas principales: evento\_asistencias (compartida con eventos)  
Verticales que lo usan: CCBP (convocatorias), Retail (turnos empleados), Educación (clases)  
Dependencias: eventos, personas

Módulo: reservas  
Capa: CROSS-VERTICAL (reclasificado por ADR-045)  
Estado: ✅ Productivo (FASE 4.6 cerrada)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/reservas/ (renombre físico a reservas\_espacios diferido a FASE D)  
Tablas principales: reservas\_canchas (renombre a reservas\_espacios diferido)  
Verticales que lo usan: CCBP (canchas), Abog (salas), Coworking (oficinas)  
Dependencias: configuracion (espacios), personas

Módulo: pos  
Capa: CROSS-VERTICAL (reclasificado por ADR-045)  
Estado: 🟡 Parcial (FASE 4.X parcial)  
Sprint de cierre: parcial; consolidación en D5  
Carpeta repo: modules/concesiones/ (renombre físico a pos diferido a FASE D)  
Tablas principales: concesionarios, concesion\_productos, concesion\_ventas, concesion\_venta\_items  
Verticales que lo usan: CCBP (buffet), Retail (caja), Restaurant (comanda)  
Dependencias: personas, finanzas, pim

Módulo: inventario  
Capa: CROSS-VERTICAL (reclasificado por ADR-045)  
Estado: ✅ Productivo (utilería de Hindu activa)  
Sprint de cierre: ya cerrado, consolidación con pim en D5  
Carpeta repo: modules/utileria/ (renombre físico a inventario diferido a FASE D)  
Tablas principales: utileria\_items, utileria\_kits, utileria\_kit\_items, utileria\_solicitudes, utileria\_solicitud\_items, utileria\_cargos\_reposicion  
Verticales que lo usan: CCBP (utilería), Retail (stock), Arq (materiales)  
Dependencias: personas, equipos (en CCBP), pim

Módulo: acceso  
Capa: CROSS-VERTICAL (reclasificado por ADR-045)  
Estado: ✅ Productivo (FASE 4.5 cerrada)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/acceso/  
Tablas principales: acceso\_logs, personas\_credenciales\_acceso  
Verticales que lo usan: CCBP (socios), Empresa (empleados), Edificio (visitantes)  
Dependencias: personas

Módulo: pre\_inscripciones  
Capa: CROSS-VERTICAL (reclasificado por ADR-045)  
Estado: ✅ Productivo (FASE 3.4 cerrada, RFC-001)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/pre\_inscripciones/  
Tablas principales: pre\_inscripciones  
Verticales que lo usan: CCBP (socios nuevos), Estudios (leads), Retail (programa fidelidad)  
Dependencias: personas

Módulo: suscripciones\_membresia  
Capa: CROSS-VERTICAL  
Estado: 🟠 Huérfano (module existe vacío)  
Sprint de cierre: B5 (Activar Socios)  
Carpeta repo: modules/socios/ (renombre conceptual diferido a FASE D)  
Tablas principales: a definir en B5 (extendiendo personas \+ atributos)  
Verticales que lo usan: CCBP (socios), Coworking (miembros), Gym (abonos), SaaS (clientes)  
Dependencias: personas, cobranza

Módulo: rrhh  
Capa: CROSS-VERTICAL  
Estado: 🟡 Parcial (DB OK, UI limitada)  
Sprint de cierre: FASE D (no FASE A; opcional cross-vertical)  
Carpeta repo: modules/rrhh/  
Tablas principales: rrhh\_contratos, rrhh\_liquidaciones, catalogo\_puestos, catalogo\_roles\_laborales  
Verticales que lo usan: CCBP, Arq, Abog, Pub, Retail (todos los 5\)  
Dependencias: personas, finanzas

Módulo: documentos\_firma  
Capa: CROSS-VERTICAL (alta prioridad — los 5 verticales lo usan)  
Estado: 🆕 A crear (FASE D, Sprint D1)  
Sprint de cierre: D1  
Carpeta repo: modules/documentos/ (a crear)  
Tablas principales: documentos (nueva), firmas\_digitales (nueva)  
Verticales que lo usan: CCBP, Arq (contratos+planos), Abog (contratos), Pub (contratos), Retail (contratos proveedor)  
Dependencias: personas, entidades, almacenamiento

Módulo: tickets\_solicitudes  
Capa: CROSS-VERTICAL  
Estado: 🟡 Parcial (existe \`solicitudes\` y \`utileria\_solicitudes\` parcial)  
Sprint de cierre: D2 (Tickets universalizado)  
Carpeta repo: modules/tickets/ (a crear), absorbe solicitudes existente  
Tablas principales: solicitudes (existente), tickets (nueva)  
Verticales que lo usan: todos (consultas clientes, briefs agencias, cambios obra, soporte)  
Dependencias: personas, proyectos (opcional)

Módulo: pricing\_avanzado  
Capa: CROSS-VERTICAL (PIM Nivel 2, ADR-042)  
Estado: 🆕 A crear (FASE D, Sprint D3)  
Sprint de cierre: D3  
Carpeta repo: modules/pricing/ (a crear)  
Tablas principales: listas\_precios, precios\_por\_lista, listas\_precios\_reglas (esqueleto vacío creado en A2)  
Verticales que lo usan: Retail (alta prioridad), CCBP (cancha precio diferenciado), Pub (retainer)  
Dependencias: pim Nivel 1

Módulo: stock\_movimientos  
Capa: CROSS-VERTICAL (PIM Nivel 3, ADR-042)  
Estado: 🆕 A crear (FASE D, Sprint D4)  
Sprint de cierre: D4  
Carpeta repo: modules/stock/ (a crear)  
Tablas principales: stock\_ubicaciones, stock\_movimientos, stock\_lotes (esqueleto vacío creado en A2)  
Verticales que lo usan: Retail (alta prioridad), CCBP (utilería), POS (buffet)  
Dependencias: pim Nivel 1, configuracion (espacios)

Módulo: espacios\_fisicos  
Capa: CROSS-VERTICAL  
Estado: 🆕 A crear (Sprint A1 base \+ FASE D mapa visual)  
Sprint de cierre: A1 (tablas base \+ CRUD), D6 (mapa visual)  
Carpeta repo: modules/espacios/ (a crear)  
Tablas principales: espacios (nueva, genérica), espacios\_layout (mapa visual, D6)  
Verticales que lo usan: CCBP (canchas+vestuarios+bares), Retail (sucursales+vidrieras), Coworking (salas+oficinas)  
Dependencias: configuracion

CAPA 2 — VERTICAL CCBP  
\=======================

Mini-troncal del vertical CCBP:

Módulo: equipos  
Capa: VERTICAL-CCBP (mini-troncal)  
Estado: ✅ Productivo (8 equipos en Hindu)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/equipos/  
Tablas principales: equipos, personas\_equipos, categorias\_equipo  
Dependencias: personas, configuracion (sedes)

Módulo: disciplinas  
Capa: VERTICAL-CCBP (mini-troncal)  
Estado: 🟠 Huérfano (module existe vacío)  
Sprint de cierre: TBD (no urgente para Hindu mono-disciplina)  
Carpeta repo: modules/disciplinas/  
Tablas principales: catalogo\_disciplinas, personas\_disciplinas  
Dependencias: personas

Módulo: cuerpo\_tecnico  
Capa: VERTICAL-CCBP (mini-troncal)  
Estado: 🟡 Parcial (modelo OK vía rol\_equipo\_slug, UI integrada falta)  
Sprint de cierre: B6  
Carpeta repo: distribuido en modules/equipos/, modules/personas/  
Tablas principales: personas\_equipos.rol\_equipo\_slug (ADR-024)  
Dependencias: equipos, personas

Submódulos del vertical CCBP:

Módulo: planificadores\_deportivos  
Capa: VERTICAL-CCBP (submódulo)  
Estado: 🟡 Parcial (calendario sí, creación de evento desde calendario NO)  
Sprint de cierre: A1 (fix con eventos genérico)  
Carpeta repo: modules/planificadores/  
Tablas principales: usa eventos (cross-vertical)  
Dependencias: eventos

Módulo: entrenamientos  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ✅ Productivo (FASE 4 cerrada)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/entrenamientos/  
Tablas principales: entrenamiento\_planes, entrenamiento\_plan\_bloques, catalogo\_ejercicios  
Dependencias: equipos, eventos

Módulo: tactica  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ✅ Productivo (FASE 4 cerrada)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/tactica/  
Tablas principales: esquemas\_tacticos, esquema\_posiciones  
Dependencias: equipos

Módulo: amistosos  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ✅ Productivo (FASE 4 cerrada)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/amistosos/  
Tablas principales: usa eventos con tipo amistoso  
Dependencias: eventos, equipos

Módulo: competencias  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ✅ Productivo (FASE 5 cerrada, RFC-002, 98 partidos)  
Sprint de cierre: ya cerrado  
Carpeta repo: modules/competencias/, modules/partidos/  
Tablas principales: torneos, torneo\_categorias, torneo\_equipos, partidos\_detalle, partido\_stats\_jugador, equipos\_competencias, torneo\_partidos\_eventos  
Dependencias: equipos, eventos

Módulo: salud  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ⏳ Planificado (RFC-003, FASE 6.1 \= Sprint B1)  
Sprint de cierre: B1  
Carpeta repo: modules/salud/ (a crear)  
Tablas principales: personas\_lesiones (existe vacía), personas\_datos\_medicos, personas\_documentos\_medicos, personas\_autorizaciones, catalogo\_obras\_sociales, personas\_obra\_social  
Dependencias: personas, comunicaciones, asistencias

Módulo: historial\_trayectoria  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ⏳ Planificado (RFC-003, FASE 6.2 \= Sprint B2)  
Sprint de cierre: B2  
Carpeta repo: modules/trayectoria/ (a crear)  
Tablas principales: personas\_historial\_clubes, personas\_logros\_deportivos  
Dependencias: personas, equipos

Módulo: scouting  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ⏳ Planificado (RFC-003, FASE 6.3 \= Sprint B3)  
Sprint de cierre: B3  
Carpeta repo: modules/scouting/ (a crear)  
Tablas principales: scouting\_fichas, scouting\_evaluaciones (nueva)  
Dependencias: personas, equipos

Módulo: reportes\_deportivos  
Capa: VERTICAL-CCBP (submódulo)  
Estado: ⏳ Planificado (RFC-003, FASE 6.4 \= Sprint B4)  
Sprint de cierre: B4  
Carpeta repo: modules/reportes/ (a crear)  
Tablas principales: lectura sobre partidos\_detalle, entrenamiento\_planes, personas\_lesiones, etc.  
Dependencias: competencias, salud, equipos

Módulo: federaciones  
Capa: VERTICAL-CCBP (submódulo)  
Estado: 🟡 Parcial (FASE 5.2 parcial)  
Sprint de cierre: TBD  
Carpeta repo: modules/federaciones/  
Tablas principales: a verificar  
Dependencias: entidades (FACCMA, AIF como entidades externas)

Módulo: diagramacion\_club  
Capa: VERTICAL-CCBP (submódulo)  
Estado: 🆕 A crear (Sprint B6)  
Sprint de cierre: B6  
Carpeta repo: modules/diagramacion/ (a crear)  
Tablas principales: usa espacios \+ espacios\_layout (cross-vertical D6)  
Dependencias: configuracion (espacios)

CAPA 2 — VERTICALES FUTUROS (no construidos hoy)  
\=================================================

Vertical Estudios de Arquitectura (futuro, FASE E1):  
\- Mini-troncal: proyectos\_obra, etapas\_construccion  
\- Submódulos: cronograma\_obra, avances\_obra, pedidos\_materiales, subcontratistas, planos  
\- Cross-vertical que usa: eventos (visitas), reservas, comunicaciones, inventario (materiales), tickets, pre\_inscripciones, documentos\_firma

Vertical Estudios de Abogacía (futuro, FASE E2):  
\- Mini-troncal: casos\_expedientes, materias\_practica  
\- Submódulos: audiencias, plazos\_procesales, honorarios\_cuota\_litis, documentacion\_procesal, poderes  
\- Cross-vertical que usa: eventos, reservas, comunicaciones, documentos\_firma (alta prioridad), tickets, pre\_inscripciones

Vertical Agencias de Publicidad (futuro, FASE E3):  
\- Mini-troncal: cuentas\_clientes, campanas\_activas  
\- Submódulos: briefings, calendarios\_editoriales, kits\_marca, reportes\_performance  
\- Cross-vertical que usa: eventos (shootings), reservas (salas/equipos), comunicaciones (alta prioridad), documentos\_firma, tickets (briefs), pre\_inscripciones

Vertical Retailers PyME (futuro, FASE E4):  
\- Mini-troncal: sucursales\_locales, empleados\_por\_sucursal  
\- Submódulos: promociones, vidriera\_digital, ecommerce\_sync, programa\_fidelidad  
\- Cross-vertical que usa: pos (alta prioridad), inventario (alta prioridad), comunicaciones (alta prioridad), pre\_inscripciones (fidelidad), acceso (empleados), eventos (lanzamientos), pricing\_avanzado (alta prioridad), stock\_movimientos (alta prioridad)

CAPA 3 — CONECTORES (MARKETPLACE)  
\==================================

Categorías de conectores disponibles (mock-first, ADR-035 vigente hasta FASE C):

Comunicación:  
\- Resend, SendGrid (email)  
\- BAPI, Twilio (WhatsApp)  
\- Twilio, Infobip (SMS)

Pago:  
\- MercadoPago, Stripe, Modo

Fiscal:  
\- AFIP (Argentina), DIAN (Colombia), SII (Chile), SAT (México)

eCommerce:  
\- Tiendanube, Shopify, WooCommerce

Apps deportivas (vertical CCBP):  
\- Catapult, Polar, Strava  
\- Federaciones: FACCMA, AIF (Argentina)

Acceso físico:  
\- Lectores QR, biométricos, torniquetes

Genéricos (todos los verticales):  
\- Webhooks (in/out)  
\- API REST (ya implementado, ver docs/API.md)  
\- MCP (Model Context Protocol)  
\- Playwright (automation web)  
\- n8n / Zapier

VISTA POR ESTADO  
\================

✅ Productivo (módulos cerrados y operativos):  
\- personas, equipos, comunicaciones, finanzas (parcial), cobranza, asistencias, reservas, inventario (utilería), acceso, pre\_inscripciones, entrenamientos, tactica, amistosos, competencias, auditoria

🟡 Parcial (necesita completar en FASE A):  
\- configuracion (Sprint A1), entidades (A4), padrones (A4), finanzas (A3), eventos (A1), comunicaciones (A5), pos (D5), cuerpo\_tecnico (B6), planificadores (A1), rrhh (D), federaciones (TBD)

🟠 Huérfano (existe en modules/ sin UI ni referencia):  
\- socios → reclasificar como suscripciones\_membresia (Sprint B5)  
\- disciplinas (TBD)  
\- eventos\_calendario (Sprint A1, fusionar con eventos)  
\- proveedores (TBD, posible absorber en entidades)  
\- talles (cubierto por personas\_talles, evaluar si module/ tiene contenido)

⏳ Planificado (RFCs aprobados, sprints definidos):  
\- salud (Sprint B1, RFC-003)  
\- historial\_trayectoria (Sprint B2, RFC-003)  
\- scouting (Sprint B3, RFC-003)  
\- reportes\_deportivos (Sprint B4, RFC-003)

🆕 A crear (sin código todavía):  
\- pim (Sprint A2)  
\- proyectos (Sprint A6)  
\- espacios\_fisicos (Sprint A1)  
\- diagramacion\_club (Sprint B6)  
\- documentos\_firma (Sprint D1)  
\- tickets\_solicitudes (Sprint D2)  
\- pricing\_avanzado (Sprint D3)  
\- stock\_movimientos (Sprint D4)

MAPEO REPO ↔ CONCEPTO  
\======================

Algunos módulos tienen un nombre físico (carpeta modules/) distinto al conceptual. Esto es deuda intencional: el renombre físico se difiere a FASE D para no romper imports masivos.

| Nombre físico (modules/) | Nombre conceptual | Capa | Cuándo se renombra físicamente |  
| \------------------------ | \----------------- | \---- | \------------------------------ |  
| modules/utileria/        | inventario        | Cross-vertical | FASE D (Sprint D5)             |  
| modules/concesiones/     | pos               | Cross-vertical | FASE D (Sprint D5)             |  
| modules/reservas/        | reservas\_espacios | Cross-vertical | FASE D                         |  
| modules/socios/          | suscripciones\_membresia | Cross-vertical | FASE D                  |  
| modules/eventos\_calendario/ | (fusionar con eventos) | Troncal | Sprint A1                      |

En tanto, MODULE-CATALOG referencia siempre el nombre conceptual, con nota del nombre físico actual.

DEPENDENCIAS CRÍTICAS (GRAFO RESUMIDO)  
\=======================================

configuracion (base, no depende de nada)  
  ↓  
personas  
  ↓  
entidades, eventos, espacios\_fisicos  
  ↓  
finanzas, comunicaciones, pim, equipos (CCBP)  
  ↓  
cobranza, asistencias, reservas, pos, inventario, acceso, pre\_inscripciones, suscripciones\_membresia  
  ↓  
proyectos (depende de muchos)  
  ↓  
Submódulos VERTICAL-CCBP (salud, scouting, etc.)

RESUMEN NUMÉRICO  
\=================

Total módulos catalogados: \~30

Por capa:  
\- Troncal (Capa 0): 9 bloques  
\- Cross-vertical (Capa 1): \~13 módulos  
\- Vertical CCBP (Capa 2): \~12 submódulos (mini-troncal \+ submódulos)  
\- Verticales futuros (Arq, Abog, Pub, Retail): \~5 cada uno (no construidos)  
\- Integraciones (Capa 3): \~20 conectores (marketplace)

Por estado:  
\- Productivo: 15  
\- Parcial: 11  
\- Huérfano: 5  
\- Planificado/A crear: 10+

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 1.0.  
Próxima revisión: al cierre de Sprint A1 (cuando se actualice el estado de los módulos tocados).  
