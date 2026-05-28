SYSTEM-DESIGN — Diseño de sistema de la Plataforma SaaS Multimodal  
\======================================================================

Versión: 2.0 (re-escrito post RFC-004)  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Supersedes: SYSTEM-DESIGN.md v1 (asumía vertical único)  
Path esperado en repo: docs/SYSTEM-DESIGN.md  
Referencias: RFC-004, ADR-040, ARCHITECTURE.md \+ ARCHITECTURE-ADDENDUM

PROPÓSITO  
\=========

Este documento describe el diseño técnico de sistema de la plataforma a alto nivel: capas, flujos, integraciones, multi-tenancy, seguridad.

Es el complemento de ARCHITECTURE.md (que tiene convenciones técnicas y patrones) y de MODULE-CATALOG.md (que tiene el mapa de módulos). Acá se ve el sistema desde la perspectiva de "qué hace el sistema cuando..." en vez de "qué módulos existen".

VISIÓN GENERAL DEL SISTEMA  
\============================

La Plataforma SaaS Multimodal es un sistema multi-tenant que soporta múltiples verticales sobre un troncal universal. Los componentes principales son:

\`\`\`  
┌─────────────────────────────────────────────────────────────┐  
│  Cliente (Next.js \+ React, server-side rendered)           │  
│  \- app/admin/\* (paneles administrativos por capa)          │  
│  \- app/(public)/\* (landings, formularios públicos)         │  
└────────────────────────┬────────────────────────────────────┘  
                         │  
                         ↓  
┌─────────────────────────────────────────────────────────────┐  
│  Server Actions (Next.js, server-side)                      │  
│  \- Validan permisos                                          │  
│  \- Llaman a queries y mutations Supabase                    │  
│  \- Gestionan transacciones                                  │  
└────────────────────────┬────────────────────────────────────┘  
                         │  
                         ↓  
┌─────────────────────────────────────────────────────────────┐  
│  Supabase                                                   │  
│  \- PostgreSQL (datos, RLS, funciones, triggers)             │  
│  \- Auth (sesiones, JWT)                                     │  
│  \- Storage (archivos, imágenes, documentos)                 │  
│  \- Edge Functions (cron jobs, webhooks entrantes)           │  
└────────────────────────┬────────────────────────────────────┘  
                         │  
                         ↓  
┌─────────────────────────────────────────────────────────────┐  
│  Conectores externos (Capa 3, mock-first hasta F5)     │  
│  \- Email (Resend), WhatsApp (BAPI), SMS                    │  
│  \- Pago (MercadoPago, Stripe)                              │  
│  \- Fiscal (AFIP)                                            │  
│  \- eCommerce (Tiendanube, Shopify)                         │  
│  \- Apps deportivas (Catapult, Strava, FACCMA, AIF)         │  
│  \- Genéricos (Webhooks, MCP, Playwright, n8n)              │  
└─────────────────────────────────────────────────────────────┘  
\`\`\`

MULTI-TENANCY  
\==============

El sistema soporta múltiples tenants (clientes) en una misma instancia. Cada tenant es completamente aislado a nivel de datos vía Row Level Security (RLS) de PostgreSQL.

Implementación:  
\- Tabla \`tenants\` con un registro por cliente  
\- Cada tabla relevante tiene una columna \`tenant\_id\` (UUID, FK a tenants)  
\- Cada tabla tiene una RLS policy que filtra por \`current\_setting('app.current\_tenant\_id')\`  
\- El JWT del usuario contiene el tenant\_id; el server lo setea en cada request

Reglas:  
\- Un usuario pertenece a UN tenant (en esta versión inicial; multi-tenant per user es FASE futura)  
\- Datos de un tenant NUNCA son visibles para otro tenant  
\- Excepciones: catálogos globales (catalogo\_modulos, catalogo\_tipos\_evento, catalogo\_atributos, etc.) que son compartidos

ACTIVACIÓN DE MÓDULOS POR TENANT  
\==================================

Cada tenant activa los módulos que necesita. La taxonomía de 4 capas se aplica así:

\- Troncal (Capa 0): activado por default para TODOS los tenants  
\- Cross-vertical (Capa 1): activable individualmente vía marketplace (ADR-043)  
\- Vertical (Capa 2): el tenant declara qué vertical es (CCBP, Arq, Abog, Pub, Retail) y se activan los módulos del vertical  
\- Conectores (Capa 3): activables individualmente vía marketplace

Tablas:  
\- \`catalogo\_modulos\`: maestro de módulos con capa, slug, pricing, descripción  
\- \`tenant\_modulos\`: relación tenant ↔ módulo con estado activo/inactivo

Comportamiento UI cuando un módulo no está activo:  
\- Las pantallas del módulo se renderizan con candado (patrón "apagado visible", ADR-043)  
\- El usuario puede ver descripción \+ precio \+ CTA "Activar ahora"  
\- Click en activar abre flow de contratación (mock-first en desarrollo)

CICLO DE VIDA DE UNA REQUEST  
\==============================

Para una request típica de admin:

1\. Usuario hace click en UI (ej. "+Nueva persona")  
2\. Next.js renderiza la pantalla server-side, incluyendo data preload vía queries  
3\. Usuario completa form y hace submit  
4\. Form submission llama a Server Action (Next.js)  
5\. Server Action:  
   \- Lee el JWT del usuario  
   \- Setea \`app.current\_tenant\_id\` en la sesión PG  
   \- Verifica permisos vía catalogo\_atributos \+ personas\_atributos (ADR-036 dot-notation)  
   \- Ejecuta validación Zod del input  
   \- Llama a insert/update vía supabase-js  
6\. RLS de PostgreSQL filtra/permite la operación según tenant \+ permisos  
7\. Triggers de PG actualizan tablas relacionadas (auditoría, estadísticas, etc.)  
8\. Server Action retorna éxito o error  
9\. UI muestra toast (sonner) y refresca data

SISTEMA DE PERMISOS  
\====================

Permisos basados en atributos en dot-notation (ADR-036).

Modelo:  
\- Tabla \`catalogo\_atributos\`: maestro de slugs (ej. salud.admin, finanzas.cargador, comunicaciones.editor)  
\- Tabla \`personas\_atributos\`: relación persona ↔ atributo con vigencia  
\- Tabla \`tenant\_atributos\`: opcionalmente algunos atributos a nivel de tenant

Reglas:  
\- Slug en dot-notation: \[modulo\].\[rol\]  
\- Permission check en código matchea EXACTO el slug del catálogo  
\- Atributo "tenant.admin" es super-admin del tenant (acceso total)  
\- Atributo "platform.admin" es super-admin de la plataforma (acceso a todos los tenants, solo Yair y arquitecto)

PATRÓN DE DATOS  
\================

Modelo central: TODO ES PERSONA (D64 del RFC-003).

Cualquier humano vinculado al sistema (socio, empleado, jugador, médico, abogado, cliente, proveedor) se modela como una fila en la tabla \`personas\`. Lo que cambia es:  
\- Sus atributos (qué roles tiene)  
\- Sus vínculos (a qué entidades pertenece)  
\- Sus datos asociados (tablas personas\_\*)

Entidades (empresas, organizaciones, clubes, proveedores) tienen su tabla aparte: \`entidades\`.

Relación persona ↔ entidad: vínculos N:M con metadata (rol en la entidad, fecha desde/hasta).

FLUJO DE COMUNICACIONES  
\========================

El motor de comunicaciones (bloque 6 del troncal) gestiona todos los mensajes salientes del sistema.

Flow:  
1\. Algún módulo (salud, cobranza, asistencias, etc.) dispara un evento  
2\. El módulo llama a \`enviarComunicacionMasiva()\` del módulo comunicaciones  
3\. La función crea registros en com\_envios (un envío) y com\_mensajes (uno por destinatario)  
4\. Triggers PG schedulan los mensajes en com\_jobs\_log  
5\. Edge Function (cron, mock-first) lee jobs pendientes y dispara al conector (Resend, BAPI, etc.)  
6\. Conector responde con success/failure  
7\. Edge Function actualiza estado del job y del mensaje

Canales soportados:  
\- In-app (siempre activo, parte del troncal)  
\- Email (vía conector Resend en producción, mocked en desarrollo)  
\- SMS (vía conector Twilio/Infobip)  
\- WhatsApp (vía conector BAPI)

Reglas:  
\- Cada mensaje tiene un canal y un origen (módulo \+ entidad\_id)  
\- Dedup por origen\_modulo\_slug \+ origen\_entidad\_id \+ canal en una ventana temporal (7 días default)  
\- Mensajes con categoria\_contenido='transaccional' ignoran las preferencias de opt-out del usuario

FLUJO DE PAGO Y COBRANZA  
\==========================

(Mock-first hasta F5, después se activan conectores reales)

Cobranza recurrente (bloque 5 del troncal):  
1\. Tenant configura plan de cobranza: monto, periodicidad, día de cobro  
2\. Edge Function (cron) genera cuotas mensualmente  
3\. Comunicación masiva notifica a los pagadores (vía motor de comunicaciones)  
4\. Pagador paga vía link (mock o real MercadoPago/Stripe)  
5\. Webhook del proveedor de pago marca la cuota como cobrada  
6\. Triggers PG actualizan cuenta corriente del pagador

FLUJO DE EVENTOS Y CALENDARIO  
\===============================

Bloque 7 del troncal.

Cualquier "cosa con fecha" se modela como evento:  
\- Entrenamientos (vertical CCBP)  
\- Partidos (vertical CCBP)  
\- Audiencias (vertical Abog, futuro)  
\- Visitas a obra (vertical Arq, futuro)  
\- Lanzamientos (vertical Retail, futuro)

Tabla \`eventos\` con:  
\- tipo (FK a catalogo\_tipos\_evento, slug que indica el vertical y subtipo)  
\- fecha\_inicio / fecha\_fin  
\- sede\_id \+ espacio\_id (FK al espacio físico, troncal)  
\- responsable\_persona\_id  
\- equipo\_id (opcional, si aplica al vertical)  
\- proyecto\_id (opcional, si pertenece a un proyecto)

Invitados (evento\_invitados) y Asistencias (evento\_asistencias) son cross-vertical, vinculados al evento.

STORAGE  
\========

Supabase Storage gestiona archivos:  
\- \`private-fotos-personales\` (5MB max por archivo): fotos de perfil de personas  
\- \`private-documentos\` (10MB max por archivo): documentos médicos, autorizaciones, planos, contratos  
\- Buckets futuros según necesidad por vertical

RLS de storage:  
\- Solo personas autenticadas del mismo tenant pueden acceder a archivos del tenant  
\- Archivos privados requieren signed URLs (expiración 1 hora default)

SEGURIDAD  
\==========

Capas de seguridad:

1\. Auth: Supabase Auth (JWT, refresh tokens, OAuth opcional)  
2\. RLS: filtrado por tenant\_id en todas las tablas  
3\. Permission checks: en server actions, contra catalogo\_atributos  
4\. Validación input: Zod schema en cada server action  
5\. Audit log: tabla audit\_log registra todas las operaciones críticas  
6\. Rate limiting: tabla abuse\_blocks bloquea IPs/personas abusivas  
7\. API keys: para integraciones externas, scoped a operaciones específicas

Ver docs/SECURITY.md para detalles completos.

PERFORMANCE  
\============

Estrategias:  
\- Server-side rendering con preload de data crítica  
\- Lazy loading de módulos no críticos  
\- Índices PG en columnas de queries frecuentes  
\- Vista materializadas para reportes pesados (futuro F2 reportes deportivos)  
\- Cache de Next.js para queries no-cambiantes

Ver docs/PERFORMANCE.md para detalles.

OBSERVABILIDAD  
\================

Logs:  
\- audit\_log (PG): operaciones críticas  
\- api\_logs (PG): requests vía API REST  
\- com\_jobs\_log (PG): mensajes salientes  
\- Vercel logs: errores de runtime Next.js  
\- Supabase logs: errores PG, RLS violations, RPC errors

Métricas:  
\- Conteo de personas, eventos, envíos por tenant  
\- Performance de queries lentas  
\- Errores 5xx por endpoint

Alertas (post F4):  
\- Webhooks a Slack para errores críticos  
\- Resumen diario al admin del tenant

INTEGRACIONES CON CONECTORES  
\==============================

Patrón general (mock-first):

1\. Módulo necesita llamar a servicio externo  
2\. Llama a adapter wrapper (lib/connectors/\[nombre\].ts)  
3\. Adapter chequea modo (mock vs real) según variable de entorno  
4\. En modo mock: simula response success, agrega entrada en mock\_log  
5\. En modo real: llama a la API externa con credenciales del tenant  
6\. Adapter retorna response unificada

Tablas de conectores:  
\- \`tenant\_conectores\`: qué conectores tiene activos cada tenant  
\- \`conector\_credenciales\`: credenciales encriptadas por tenant (mock-first hasta F5)  
\- \`conector\_logs\`: histórico de llamadas a conectores

DECISIONES PENDIENTES  
\======================

Hito H1 — Nombre del producto raíz  
Hito H2 — Pricing del marketplace de módulos  
Hito H3 — Materiales de venta por vertical

Mock-first se levanta gradualmente desde F5 en adelante, conector por conector según contrate Yair.

ROADMAP RESUMIDO  
\=================

F1 (en curso planificación, próximo Sprint A1)
F2 (post F1)
F4 (Validación Hindu, post F2)
F6 (Premium ERP, post F4)
F8 (Otros verticales, post F6)

Ver docs/ROADMAP.md y docs/SPRINT-PLAN.md para detalle.

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 2.0.  
Próxima revisión: al cierre de F1.  
