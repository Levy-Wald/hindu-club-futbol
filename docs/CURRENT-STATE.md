CURRENT-STATE — Estado actual de la plataforma  
\====================================================

Versión: 2.0 (re-escrito post RFC-004, inicio de FASE A)  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Supersedes: CURRENT-STATE.md v1 (estado al cierre FASE 5 del modelo viejo)  
Path esperado en repo: docs/CURRENT-STATE.md

PROPÓSITO  
\=========

Documento de "source of truth" del estado real del proyecto. Cualquier persona, IA o empresa que entra al proyecto lee este doc primero después del RFC-004 para saber dónde estamos parados HOY.

Se actualiza al cierre de CADA sprint con métricas verificables (no estimaciones).

METADATA DEL PROYECTO  
\======================

Nombre del producto raíz: Plataforma SaaS Multimodal (provisorio, decisión H1 pendiente)  
Nombre del bundle del vertical CCBP: ClubCore  
Cliente piloto: Hindu Club Fútbol (tenant\_id 11111111-1111-1111-1111-111111111111)

Owner: Yair Levy Wald (Levy Wald CMO SRL)  
Stakeholders: Kate (socia 20%), Juan Marco Lavagno (padrón operator de Hindu)

Stack:  
\- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind v3, shadcn/ui v4  
\- Backend: Supabase (PostgreSQL \+ Auth \+ Storage \+ Realtime \+ Edge Functions)  
\- Hosting: Vercel  
\- Repo: github.com/yamiro12/hindu-club-futbol  
\- Local: /Users/yamirolw/hindu-v2  
\- Supabase project\_id: hkoizqbptwhnepzbmjql  
\- Vercel project\_id: prj\_sH5WIGNfNGo5tXxyTVvQaEfBDyBk  
\- App prod: https://hindu-club.vercel.app

ESTADO AL 13 DE MAYO DE 2026 (PRE-FASE-A)  
\==========================================

FASE CONCLUIDAS (modelo viejo):  
\- FASE 1-5: cerradas en producción  
\- Hindu en producción con 2.395 personas, 8 equipos, 280 eventos, 98 partidos, 102 cuotas, 1.381 envíos

FASE EN PLANIFICACIÓN:  
\- FASE A (Cerrar troncal mínimo): planificación completa, sprints A1-A6 documentados  
\- Próximo a ejecutar: Sprint A1 (Fix Base Operativa \+ Espacios)

FASES SIGUIENTES:  
\- FASE B (Cerrar vertical CCBP): planificada, RFC-003 vigente, B1 con prompt detallado preparado  
\- FASE C (Demo a Hindu): planificada  
\- FASE D (Cross-vertical extra): planificada  
\- FASE E (Otros verticales): planificada

MÉTRICAS DE BASE DE DATOS (verificadas vía Supabase MCP el 13 de mayo de 2026\)  
\==============================================================================

Tablas: \~161 (incluyendo torneo\_partidos\_eventos y partido\_stats\_jugador del Sprint 5.5)  
Funciones SQL: 134  
Triggers: 539  
RLS policies: 383  
Catálogos seedeados: 17+  
Migrations consolidadas: 1 (20260504220000\_clubcore\_init)

Datos productivos (tenant Hindu):  
\- personas: 2.395  
\- equipos: 8  
\- personas\_equipos: 212  
\- sedes: 2  
\- canchas: 0 (a crear en Sprint A1)  
\- eventos: 280 (182 entrenamientos \+ 98 partidos)  
\- partidos\_detalle: 98  
\- partido\_stats\_jugador: 0 (creada en 5.5, pendiente datos)  
\- cuotas\_emitidas: 102  
\- fin\_cuotas\_emitidas: 102 (duplicación pendiente resolver en A3)  
\- com\_envios: 1.381  
\- com\_plantillas: 148  
\- com\_mensajes: \~3.000+  
\- reservas\_canchas: 0  
\- pre\_inscripciones: variado  
\- utileria\_items: \~variado  
\- concesion\_productos: \~variado

ESTADO DEL CÓDIGO  
\==================

Repo: limpio, branch main al día. Último commit relevante: 19cc5dd (restructure docs RFC-004).

Módulos en \`modules/\` (17 con código):  
\- ✅ Productivos: personas, equipos, comunicaciones, finanzas (parcial), cuotas, suscripciones, competencias, partidos, asistencias, reservas, acceso, pre\_inscripciones, entrenamientos, tactica, amistosos, utileria, planificadores  
\- 🟠 Huérfanos: socios, disciplinas, eventos\_calendario, proveedores, talles  
\- 🆕 A crear (FASE A): pim, proyectos, espacios

Páginas con 404 conocidos (a resolver en FASE A):  
\- /admin/operaciones/eventos/\[eventoId\] (Sprint A1)  
\- /admin/competencias/partidos/\[id\] (Sprint A1, hub falta)  
\- /admin/comunicaciones/plantillas/\[id\] (Sprint A5)  
\- /admin/concesiones/\[id\]/punto-venta/\[pdv\] (Sprint A1 o A3)  
\- /admin/entidades (Sprint A1, link existe, ruta es /externos)  
\- /admin/finanzas/cuotas/emitir (Sprint A3)  
\- /admin/finanzas/movimientos/nuevo (Sprint A3)  
\- /admin/finanzas/transferencias/nueva (Sprint A3)

Bugs UX confirmados (a resolver en FASE A):  
\- Planificador no permite creación de eventos (selectable \+ onSelectSlot faltan, Sprint A1)  
\- Sidebar mezcla técnico/operativo (Sprint A1)  
\- Scouting visible en sidebar pero no construido (Sprint A1: ocultar hasta B3)

ESTADO DE LA DOCUMENTACIÓN  
\============================

Repo /docs/ (al cierre del commit 19cc5dd):

Vigente (productivo):  
\- /docs/rfcs/RFC-001 a RFC-004 (4 RFCs)  
\- /docs/DECISIONS.md (ADR-001 a ADR-046, 46 ADRs)  
\- /docs/PROMPT-TEMPLATE.md (formato canónico, 18 bloques)  
\- /docs/MODULE-CATALOG.md (mapa de \~30 módulos por capa)  
\- /docs/ROADMAP.md (v2, FASE A→E)  
\- /docs/SPRINT-PLAN.md (v2, A1-A6, B1-B6, C, D, E)  
\- /docs/MASTER-MODEL-CCBP.md (renombrado, D1-D60 reglas de negocio)  
\- /docs/ARCHITECTURE.md (vigente, pendiente expansión con 4 capas)  
\- /docs/GLOSSARY.md (vigente, pendiente expansión con términos nuevos)  
\- /docs/DATA-MODEL.md (vigente, pendiente actualización con tablas nuevas)  
\- /docs/UI-UX.md (vigente, complementado por UI-UX-PATTERNS.md futuro)  
\- /docs/DESIGN-SYSTEM.md (vigente, expandido en Tanda 2 a aplicar)  
\- /docs/RUNBOOK.md (vigente, pendiente addendum protocolo cierre)  
\- /docs/SYSTEM-DESIGN.md (vigente, pendiente actualización con 4 capas)  
\- /docs/API.md, PERFORMANCE.md, SECURITY.md, POSTGRES.md, E2E-TESTING.md (vigentes intactos)  
\- /docs/MENORES-TUTORES.md, POST-MORTEM-TEMPLATE.md, RFC-TEMPLATE.md, SKILL-CHALLENGE.md, SYSTEM-PROMPTS.md (vigentes)  
\- /docs/E2E-CHECKLIST-TEMPLATE.md (vigente)  
\- /docs/pre-mortems/PM-SPRINT-3.4.md (histórico)  
\- /docs/verticales/ccbp/BRAND-CCBP-HINDU.md (movido, vigente)

Archivado en /docs/archive/ (no eliminado):  
\- PROPUESTA-ARQUITECTONICA.md  
\- REPORTE-CLEANUP-POST-SPRINT11.md  
\- PROMPT-ENVELOPE-v1.md (reemplazado por PROMPT-TEMPLATE.md)  
\- ROADMAP-v1.md (reemplazado por v2)  
\- SPRINT-PLAN-v1.md (reemplazado por v2)

Pendiente de incorporar (Tandas 2-4 del plan de re-documentación):  
\- BRAND-PLATFORM.md (Tanda 2\)  
\- DESIGN-SYSTEM.md v2 (Tanda 2\)  
\- VISUAL-GALLERY.md (Tanda 2\)  
\- UI-UX-PATTERNS.md (Tanda 2\)  
\- ARCHITECTURE-ADDENDUM (Tanda 3, append a ARCHITECTURE.md)  
\- GLOSSARY-ADDENDUM (Tanda 3, append a GLOSSARY.md)  
\- RUNBOOK-ADDENDUM (Tanda 3, append a RUNBOOK.md)  
\- SYSTEM-DESIGN.md v2 (Tanda 3, reemplazo)  
\- SPRINT-A1 a SPRINT-A6 prompts (Tanda 4\)

ESTADO DEL DRIVE (Plataforma SaaS Multimodal)  
\==============================================

Carpeta raíz: 6\_SaaS\_Troncal\_Multimodal  
Estructura:  
\- 00 \- MASTER INDEX (entrada general)  
\- \_Arquitectura/ (RFCs, ARCHITECTURE, DATA-MODEL, MODULE-CATALOG, BRAND, DESIGN, UI/UX, VISUAL)  
\- \_Roadmap/ (ROADMAP-MASTER, SPRINT-PLAN)  
\- \_Decisiones/ (ADRs bundle)  
\- \_Sprints/ (prompts ejecutables sprint por sprint)  
\- \_Cierre Ejecutivo/ (cierres post-sprint, futuro)  
\- \_Verticales/ (linkers a docs por vertical, futuro)

Drive carpeta vieja ClubCore (vertical CCBP histórico): vigente, mantiene cierres de FASES 1-5 y RFCs vigentes.

ESTADO DEL DEPLOY  
\==================

Vercel:  
\- Project ID: prj\_sH5WIGNfNGo5tXxyTVvQaEfBDyBk  
\- Team ID: team\_clOmQCObDDN8okRHBc4wRhZ9  
\- Último deploy READY: \~confirmar vía MCP en Sprint A1 PARTE 1  
\- URL prod: https://hindu-club.vercel.app  
\- Estado: operativo

Supabase:  
\- Project ID: hkoizqbptwhnepzbmjql  
\- Estado: operativo  
\- DB activa, RLS aplicado, mock-first vigente

PROTOCOLO MOCK-FIRST (ADR-035, vigente hasta FASE C)  
\======================================================

Servicios externos pagos NO contratados aún:  
\- Resend (email): mocked  
\- BAPI (WhatsApp): mocked  
\- MercadoPago: mocked  
\- AFIP: mocked  
\- Cualquier conector del marketplace: mocked

Yair NO tiene credenciales operativas de:  
\- CUIT / datos fiscales de Hindu Club Fútbol  
\- Dominios propios de Hindu  
\- Emails oficiales de Hindu

Cualquier sprint que requiera credenciales externas está bloqueado o se mockea.

REGLAS OPERATIVAS VIGENTES  
\============================

1\. Mock-first universal (ADR-035) hasta FASE C aprobada.  
2\. Reportar vía MCP, no CLI local (ADR-039). Code reporta vía Supabase MCP, GitHub MCP, Vercel MCP.  
3\. Soft-delete vía deleted\_at (ADR-030). No DELETE real.  
4\. Permission slugs en dot-notation (ADR-036). Match exacto contra catálogo.  
5\. Columnas nativas indexables \> metadata jsonb (ADR-037).  
6\. E2E con fixture \+ cleanup obligatorio try/finally (ADR-038).  
7\. No cargar más data productiva de Hindu hasta FASE C.  
8\. No tests masivos contra personas reales de Hindu.

PRÓXIMOS PASOS INMEDIATOS  
\==========================

1\. Cerrar el commit grande de re-documentación (Tandas 1 a 4 \+ addendums).  
2\. Ejecutar Sprint A1 — Fix Base Operativa \+ Espacios.  
3\. Continuar FASE A sprint por sprint hasta cerrarla.  
4\. Cerrar FASE B.  
5\. FASE C — Demo a Hindu.

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 2.0.  
Próxima revisión: al cierre del Sprint A1.

Quien actualiza este doc: Claude Code en el cierre de cada sprint (PROMPT-TEMPLATE PARTE 10.1). El arquitecto verifica vía MCP.  
