VISUAL-GALLERY — Índice de capturas visuales de la plataforma  
\==================================================================

Versión: 1.0  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Path esperado en repo: docs/VISUAL-GALLERY.md  
Referencias: PROMPT-TEMPLATE.md (PARTE 7), DESIGN-SYSTEM.md

PROPÓSITO  
\=========

Este documento es el índice central de capturas visuales de cada pantalla productiva de la plataforma. Sirve como:

\- Referencia visual para cualquier persona, equipo o IA que entra al proyecto y necesita entender cómo se ve cada pantalla  
\- Histórico visual de la evolución de cada pantalla a lo largo de sprints  
\- Source de validación visual en sprints futuros: si una pantalla se modifica, comparar antes/después  
\- Material para materiales comerciales: landing pages, decks de venta, casos de éxito

NO contiene los archivos de imagen directamente. Es un INDEX que apunta a paths del Drive en \`\_Cierre Ejecutivo/sprint-\[ID\]/screenshots/\` o \`\_Verticales/\[vertical\]/galeria/sprint-\[ID\]/\`.

PROTOCOLO DE ACTUALIZACIÓN (referencia PROMPT-TEMPLATE PARTE 7\)  
\================================================================

Al cierre de cada sprint, Code:

1\. Captura screenshots de cada pantalla NUEVA o MODIFICADA usando Playwright (page.screenshot()).  
2\. Sube los screenshots al Drive en la carpeta correspondiente:  
   \- Pantallas de troncal o cross-vertical: Drive \`\_Cierre Ejecutivo/sprint-\[ID\]/screenshots/\`  
   \- Pantallas de vertical específico: Drive \`\_Verticales/\[vertical\]/galeria/sprint-\[ID\]/\`  
3\. Agrega una entrada en este documento con el path del screenshot.  
4\. Si la pantalla ya existía y solo se modificó, agrega un nuevo screenshot bajo el mismo módulo con anotación "Modificado en Sprint \[ID\]".

Convenciones de naming de screenshots:  
\- Formato: \`\[modulo\]-\[pantalla\]-\[estado\].png\`  
\- Ejemplos:  
  \- \`pim-catalogo-default.png\`  
  \- \`pim-catalogo-empty.png\`  
  \- \`pim-catalogo-error.png\`  
  \- \`pim-producto-detalle.png\`  
  \- \`pim-producto-modal-creacion.png\`

Resolución estándar:  
\- Desktop: 1440x900  
\- Tablet: 768x1024  
\- Mobile: 375x812

ESTRUCTURA DEL ÍNDICE  
\======================

Las entradas se organizan por CAPA según MODULE-CATALOG:

1\. Capa Troncal (configuración, CRM, finanzas, PIM, cobranza, comunicaciones, eventos, proyectos, auditoría)  
2\. Capa Cross-vertical (asistencias, reservas, pos, inventario, acceso, pre-inscripciones, etc.)  
3\. Vertical CCBP (equipos, planificadores, entrenamientos, competencias, salud, scouting, etc.)  
4\. Verticales futuros (Arq, Abog, Pub, Retail)  
5\. Pantallas de plataforma (login, marketplace, settings, ayuda)

ÍNDICE  
\=======

CAPA TRONCAL  
─────────────

BLOQUE 1 — CONFIGURACIÓN DEL NEGOCIO

Pantalla: /admin/configuracion/tenant  
Estado: ⏳ Pendiente captura (existe en parcial)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/configuracion/sedes  
Estado: ⏳ Pendiente captura (se construye en Sprint A1)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/configuracion/espacios  
Estado: 🆕 A crear en Sprint A1  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/marketplace  
Estado: 🆕 A crear en Sprint A1 o A2  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 2 — CRM

Pantalla: /admin/personas  
Estado: ✅ Productivo (necesita screenshot histórico)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/personas/\[id\]  
Estado: ✅ Productivo  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/entidades  
Estado: 🟡 Parcial (se completa en Sprint A4)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/padrones  
Estado: 🟡 Parcial (se completa en Sprint A4)  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 3 — ERP FINANZAS

Pantalla: /admin/finanzas/cajas  
Estado: ✅ Productivo (necesita screenshot histórico)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/finanzas/movimientos  
Estado: 🟡 Parcial (se completa en Sprint A3)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/finanzas/movimientos/nuevo  
Estado: ❌ 404 actualmente (se crea en Sprint A3)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/finanzas/cuotas  
Estado: ✅ Productivo  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/finanzas/cuotas/emitir  
Estado: ❌ 404 actualmente (se crea en Sprint A3)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/finanzas/transferencias  
Estado: 🟡 Parcial  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/finanzas/transferencias/nueva  
Estado: ❌ 404 actualmente (se crea en Sprint A3)  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 4 — PIM

Pantalla: /admin/productos  
Estado: 🆕 A crear en Sprint A2  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/productos/\[id\]  
Estado: 🆕 A crear en Sprint A2  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/productos/categorias  
Estado: 🆕 A crear en Sprint A2  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 5 — COBRANZA RECURRENTE

Pantalla: /admin/cobranza/suscripciones  
Estado: ✅ Productivo  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 6 — COMUNICACIONES

Pantalla: /admin/comunicaciones/plantillas  
Estado: ✅ Productivo  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/comunicaciones/plantillas/\[id\]  
Estado: ❌ 404 actualmente (se crea en Sprint A5)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/comunicaciones/envios  
Estado: ✅ Productivo  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/comunicaciones/automatizaciones  
Estado: 🟡 Parcial (se completa en Sprint A5)  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 7 — EVENTOS Y CALENDARIO

Pantalla: /admin/operaciones/planificador  
Estado: 🟡 ROTO (no permite creación; se fixea en Sprint A1)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/operaciones/eventos/\[id\]  
Estado: ❌ 404 actualmente (se crea hub en Sprint A1)  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/operaciones/eventos/\[id\]/asistencia  
Estado: ✅ Productivo  
Sprint del último screenshot: \-  
Path Drive: \-

BLOQUE 8 — PROYECTOS Y TAREAS

Pantalla: /admin/proyectos  
Estado: 🆕 A crear en Sprint A6  
Sprint del último screenshot: \-  
Path Drive: \-

Pantalla: /admin/proyectos/\[id\]  
Estado: 🆕 A crear en Sprint A6 (vista Kanban / Lista / Calendario)  
Sprint del último screenshot: \-  
Path Drive: \-

CAPA CROSS-VERTICAL  
────────────────────

Asistencias, Reservas, POS/Concesiones, Inventario, Acceso, Pre-inscripciones: pantallas productivas, necesitan screenshots históricos en próxima captura masiva.

Documentos/Firma, Tickets, Pricing avanzado, Stock & Movimientos: a crear en FASE D.

VERTICAL CCBP  
──────────────

Equipos, Planificadores, Entrenamientos, Táctica, Amistosos, Competencias: pantallas productivas, necesitan screenshots históricos.

Salud, Historial, Scouting, Reportes deportivos: a crear en FASE B (Sprints B1-B4).

Socios membresía: a crear en Sprint B5.

Cuerpo Técnico operativo \+ Diagramación del Club: a crear en Sprint B6.

VERTICALES FUTUROS  
───────────────────

Vertical Arq (FASE E1): pantallas por crear.  
Vertical Abog (FASE E2): pantallas por crear.  
Vertical Pub (FASE E3): pantallas por crear.  
Vertical Retail (FASE E4): pantallas por crear.

PANTALLAS DE PLATAFORMA  
────────────────────────

Pantalla: /auth/login  
Estado: ✅ Productivo (necesita screenshot histórico)  
Sprint del último screenshot: \-

Pantalla: /admin (dashboard inicial)  
Estado: ✅ Productivo (necesita screenshot histórico)  
Sprint del último screenshot: \-

CAPTURA INICIAL MASIVA  
\========================

En Sprint A1 (Fix Base Operativa), se incluye una tarea adicional: capturar screenshot histórico de TODAS las pantallas productivas existentes (estado ✅ Productivo) y poblar este índice con sus paths.

Esto sienta la línea base visual del estado de la plataforma a inicio de FASE A, contra la cual se compararán los cambios futuros.

CUÁNDO SE ACTUALIZA  
\====================

Automático al cierre de CADA sprint (Code, vía protocolo PROMPT-TEMPLATE PARTE 10).

Manual cuando:  
\- Se descubre una pantalla productiva sin screenshot todavía  
\- Se diseña un mockup en Figma o Drive antes de construir  
\- Se modifica una pantalla significativamente fuera de un sprint

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 1.0.  
Próxima revisión: al cierre de Sprint A1 (captura inicial masiva).  
