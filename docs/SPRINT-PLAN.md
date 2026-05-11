# ClubCore — Sprint Plan

> Roadmap operativo de sprints hasta el primer cliente pago. Cada sprint
> tiene fecha, capa, objetivo, alcance y criterios.
>
> Mantenido por el arquitecto.
>
> Última actualización: 10 de mayo de 2026.

---

## 1. Visión del roadmap

Estamos en sprint **14c** completado (10 may 2026). Hindu Club tiene cargados
los padrones de socios, jugadores y suscriptores. Falta convertir esa data
en operación real (cobranza, comunicación, reportes) y dejar la plataforma
en estado **demo-ready** para vender a otros clubes.

### Hitos macro

| Fecha | Hito |
|---|---|
| **1 jun 2026** | Mes de prueba interna en Hindu: operación real de finanzas del fondo fútbol |
| **1 jul 2026** | Full operativo + demo-ready para escalar a Hacoaj, Nordelta, similares |
| **Q3 2026** | Primer cliente pago |
| **Q4 2026** | Tercer cliente / estabilización |
| **Q1 2027** | Evaluación de separación troncal según demanda |

### Ritmo

Sprints semanales: domingo a sábado.
1 sprint = 1 spec a Code = 1-3 commits = 1 deploy a Vercel.
Validaciones visuales/SQL antes de cerrar el sprint.

### Reglas para todos los sprints

- Toda solicitud sigue `PROMPT-ENVELOPE.md`.
- Toda implementación respeta `ARCHITECTURE.md`.
- Capa explícita declarada al inicio de cada sprint.
- `CURRENT-STATE.md` actualizado al cerrar.

---

## 2. Plan ejecutivo — 8 sprints hasta 1 jul

| # | Semana | Fecha | Capa principal | Objetivo |
|---|---|---|---|---|
| **14d** | 1 | 12-18 may | Plataforma | Fundación documental + deprecar legacy padrones + reorganizar UI por capas |
| **14e** | 2 | 19-25 may | Troncal ERP | Modelo de suscripciones + plan Fondo Fútbol 2026 cargado + emisión cuotas |
| **14f** | 3 | 26 may - 1 jun | Troncal ERP + UI | Cobranza manual + UX cleanup crítica + estabilización |
| | | **1 jun → PRUEBA INTERNA HINDU** | | Hindu opera la plataforma. Bug fixes según se detecten |
| **15a** | 4 | 2-8 jun | Módulo paralelo (Comunicaciones) | Resend configurado + comunicaciones masivas reales |
| **15b** | 5 | 9-15 jun | Troncal ERP | Reportes financieros básicos: balance, ingresos, deudores |
| **15c** | 6 | 16-22 jun | Módulo paralelo (RRHH) | RRHH operativo: contratos y liquidaciones cargables |
| **15d** | 7 | 23-29 jun | Plataforma (Integración) | MercadoPago + cobranza automática + conciliación básica |
| **15e** | 8 | 30 jun - 6 jul | Plataforma (Onboarding) | Wizard de onboarding tenant + branding por tenant |
| | | **1 jul → FULL OPERATIVO + DEMO-READY** | | |

---

## 3. Detalle por sprint

### Sprint 14d — Fundación documental + cleanup legacy
**Semana 1 — 12-18 may** · Capa: Plataforma

**Objetivo.** Dejar la base documental viva creada y consumible por Code en
cada sesión. Deprecar legacy `padron_syncs`. Reorganizar UI por capas.

**Alcance.**
- Crear 7 docs vivos en `/docs/` (placeholders, contenido lo provee arquitecto)
- Eliminar `.md` obsoletos en raíz (AUDIT-*, NEXT-SPRINT, MASTER-GAPS, README viejo)
- Actualizar `CLAUDE.md` para apuntar a los docs vivos
- Drop tablas `padron_syncs`, `padron_sync_diffs` + código relacionado (730 líneas)
- Drop 10 views `fin_*` sin uso
- Cleanup atributos duplicados (admin_sistema / sistema.admin, etc.)
- Reorganización del sidebar UI por capas (sin mover paths físicos)

**Dependencias previas.** Sprint 14c.2 aplicado (padrón Suscriptores creado).

**Entregables.**
- Migration drops aplicada en DB
- `/docs/` con 7 archivos (vacíos esperando contenido del arquitecto)
- Sidebar mostrando secciones agrupadas por capa
- Commit + Vercel deploy READY

**Criterios de aceptación.**
- Build pasa sin referencias a `padron_syncs`
- Hindu Global, Jugadores y Suscriptores padrones siguen accesibles
- Sidebar con secciones CRM | ERP | Club Deportivo | Plataforma
- Archivos `.md` obsoletos eliminados

**NO entra.**
- Renombrado de tablas físicas
- Cambio de paths en `/app/`
- Construcción de wizard de onboarding (14e en adelante)

**Riesgo principal.** Romper el padrón Hindu Global al eliminar
`padron_syncs`. Mitigación: validar SQL antes y después de la migration.

---

### Sprint 14e — Suscripciones + plan Fondo Fútbol 2026
**Semana 2 — 19-25 may** · Capa: Troncal ERP

**Objetivo.** Hindu debe poder generar cuotas mensuales del Fondo Fútbol
contra los 57 suscriptores del padrón.

**Alcance.**
- Tabla `suscripciones` (persona ↔ plan ↔ vigencia)
- Producto "Fondo Fútbol 2026" cargado en `productos_servicios`
- Plan en `cuotas_planes` apuntando al producto
- Modificar pipeline `suscriptores_por_equipo` para crear row en `suscripciones`
- Re-aplicar run existente del padrón Suscriptores (genera 57 suscripciones)
- UI mínima: tab "Suscripciones" en ficha de persona
- UI mínima: listado de suscripciones activas por plan

**Dependencias previas.** Sprint 14d aplicado. Padrón Suscriptores con 57
personas.

**Entregables.**
- Migration `add_suscripciones_table`
- Seed con producto y plan
- Pipeline actualizado
- UI suscripciones funcional

**Criterios de aceptación.**
- `SELECT COUNT(*) FROM suscripciones WHERE activo=true` → 57 (después de
  re-aplicar el run del padrón Suscriptores)
- Tab "Suscripciones" en `/admin/personas/[id]` muestra las activas
- Lavagno tiene suscripción activa al plan "Fondo Fútbol 2026"
- Build + deploy OK

**NO entra.**
- Emisión real de cuotas (es 14f o parte 2)
- Cobranza
- MercadoPago
- Bonificaciones

**Riesgo principal.** Sobre-modelar la tabla suscripciones. Mantener mínima:
persona_id, plan_id, fecha_inicio, fecha_fin, activo, monto_acordado (si
difiere del plan), metadata.

---

### Sprint 14f — Emisión + cobranza manual + UX cleanup
**Semana 3 — 26 may - 1 jun** · Capa: Troncal ERP + UI

**Objetivo.** Hindu emite la primera tanda de cuotas del fondo fútbol y
puede registrar cobros manuales. Pulida la UX detectada como rota en sprints
14a-14c.

**Alcance.**
- Emisión masiva de cuotas mes a mes desde suscripciones (acción
  `emitirCuotasMasivas` ya existe — usarla)
- UI de cobranza manual: marcar cuota como pagada con medio de pago, fecha,
  monto
- Generación de movimiento_caja al cobrar cuota
- Cuenta corriente persona se actualiza
- UX cleanup global:
  - Botoneras siempre arriba (regla absoluta)
  - Barras de progreso con etapas en uploads y applies largos
  - Mensajes de error específicos (no genéricos)
  - Mobile: tablas con scroll horizontal correcto, no zoom
- Eventos zombie de imports: botón "Cancelar run" en pantalla de revisión
  para limpiar runs en estado revisando

**Dependencias previas.** Sprint 14e.

**Entregables.**
- 57 cuotas emitidas para junio 2026
- UI de cobranza funcional
- Movimientos de caja generados al cobrar
- UX cleanup aplicado a pantallas críticas (padrones, imports, finanzas)

**Criterios de aceptación.**
- `SELECT COUNT(*) FROM cuotas_emitidas WHERE periodo='2026-06'` → 57
- Cobrar 1 cuota desde UI → genera movimiento_caja + actualiza
  cuenta_corriente
- Botoneras arriba en padrones, personas, finanzas, equipos
- Run de imports zombie: se puede cancelar desde UI sin SQL
- Build + deploy OK

**NO entra.**
- Cobranza automática (es Sprint 15d con MercadoPago)
- Reportes financieros (es Sprint 15b)
- Bonificaciones
- Convenios de pago

**Riesgo principal.** El sprint mezcla dos focos (emisión + UX). Si se
estira, priorizar emisión + cobranza y dejar UX para Sprint 15a.

**Final de Sprint 14f = Hindu listo para mes de prueba interna (1 jun).**

---

### MES DE PRUEBA INTERNA HINDU — junio 2026

Entre el 1 jun y el 1 jul, Hindu opera la plataforma para finanzas reales
del fondo fútbol. En paralelo se ejecutan los sprints 15a-15e.

Los bugs y huecos que detecte Hindu durante este mes entran como fixes
intra-sprint o como Sprint 15-bug-fixes si son grandes.

---

### Sprint 15a — Resend + comunicaciones masivas
**Semana 4 — 2-8 jun** · Capa: Módulo paralelo (Comunicaciones)

**Objetivo.** Emails reales saliendo de la plataforma: avisos de vencimiento
de cuotas, recibos de pago, comunicados generales.

**Alcance.**
- Configurar `RESEND_API_KEY` en Vercel (acción manual del arquitecto/Yair)
- Configurar dominio de envío en Resend (configurar SPF, DKIM, DMARC)
- Integrar Resend en `lib/comunicaciones/email.ts`
- Modificar cron `/api/cron/dispatch-vencimientos` para que envíe emails
  reales
- Crear plantillas:
  - "Vencimiento próximo cuota"
  - "Recibo de pago"
  - "Comunicado general"
- UI de envío masivo: seleccionar segmento (atributo, padrón, equipo) +
  plantilla + previsualización + envío
- Tracking de envíos en `com_envios` con estado (enviado, abierto, rebotado)
- Webhook Resend para tracking de eventos (Sprint 15d puede heredarlo)

**Dependencias previas.** Sprint 14f. Hindu tiene cuotas emitidas con
fechas de vencimiento reales.

**Entregables.**
- Resend operativo
- 3 plantillas funcionales
- UI de envío masivo
- Cron de vencimientos envía emails reales

**Criterios de aceptación.**
- Email de prueba llega a la casilla de Yair
- Envío masivo a un segmento de 10 personas: 10 emails recibidos
- `com_envios` registra cada envío con estado
- Cron diario corre y envía recordatorios

**NO entra.**
- WhatsApp (futuro)
- SMS (futuro)
- Campañas drip / secuencias automatizadas
- A/B testing de plantillas

**Riesgo principal.** Configuración DNS del dominio puede demorar. Yair
debe iniciar trámite con su DNS provider al menos 3-5 días antes.

---

### Sprint 15b — Reportes financieros básicos
**Semana 5 — 9-15 jun** · Capa: Troncal ERP

**Objetivo.** Hindu puede ver balance mensual, ingresos y egresos por
categoría, deudores, recaudación por equipo/torneo.

**Alcance.**
- Pantalla `/admin/finanzas/reportes` con cards de filtros (período,
  centro de costo, categoría)
- Reporte: Balance del mes (ingresos - egresos = resultado)
- Reporte: Ingresos por concepto (cuotas, ventas, otros)
- Reporte: Egresos por categoría
- Reporte: Cuenta corriente persona (deudor con detalle)
- Reporte: Recaudación por centro de costo (equipo, torneo)
- Export CSV / XLSX de todos los reportes
- UI mínima para crear/editar centros de costo (gap C4 del CURRENT-STATE)
- Asignación de centro de costo a movimientos (dropdown)

**Dependencias previas.** Sprint 14f con cuotas emitidas y al menos algunas
cobradas (durante mes de prueba).

**Entregables.**
- 5 reportes funcionales con filtros y export
- UI CRUD de centros de costo
- Movimientos asignables a centros de costo

**Criterios de aceptación.**
- Reportes muestran datos reales de Hindu junio 2026
- Filtros por período funcionan
- Export descarga archivo correctamente
- Centros de costo se pueden crear/editar/desactivar

**NO entra.**
- Reportes contables formales (libro diario, mayor, balance general
  con cuentas — futuro Q3)
- Presupuestos vs ejecutado (Sprint 17+)
- Reportes consolidados multi-tenant
- Gráficos avanzados / dashboards interactivos

**Riesgo principal.** Datos insuficientes en junio (poca operación) para
que los reportes sean significativos. Mitigación: cargar al menos
movimientos de prueba representativos durante el mes de prueba.

---

### Sprint 15c — RRHH operativo
**Semana 6 — 16-22 jun** · Capa: Módulo paralelo (RRHH)

**Objetivo.** Hindu puede cargar contratos de empleados (entrenadores,
personal administrativo) y liquidar sueldos del mes.

**Alcance.**
- UI de contratos: crear, editar, rescindir contratos
  (`/admin/rrhh/contratos`)
- UI de liquidaciones: crear liquidación mensual por empleado, aprobar,
  pagar (`/admin/rrhh/liquidaciones`)
- Liquidación genera asiento contable: movimiento de caja egreso + asiento
  en plan de cuentas (cuenta "Sueldos y jornales")
- Datos laborales completos en ficha de persona
- Catálogos editables: áreas, puestos, roles laborales

**Dependencias previas.** Sprint 15b (centros de costo creados para imputar
sueldos por área).

**Entregables.**
- 2 pantallas UI operativas (contratos, liquidaciones)
- Generación automática de movimiento al pagar liquidación
- Integración con plan de cuentas existente

**Criterios de aceptación.**
- Crear contrato para empleado de Hindu
- Generar liquidación de junio 2026, aprobarla, pagarla
- Movimiento de caja egreso generado correctamente
- Tab "Datos laborales" en ficha de persona muestra contrato activo

**NO entra.**
- Cálculo automático de aportes patronales / cargas sociales
- Recibos de sueldo PDF (formato AFIP)
- Integración con AFIP / declaraciones juradas
- Vacaciones, licencias, ausentismo

**Riesgo principal.** Tentación de meter cálculo automático argentino
(SUSS, jubilación, etc.). Quedan fuera: requiere actuario o servicio
externo. ClubCore solo registra el resultado, no calcula.

---

### Sprint 15d — MercadoPago + cobranza automática
**Semana 7 — 23-29 jun** · Capa: Plataforma (Integración)

**Objetivo.** Personas pueden pagar cuotas online vía MercadoPago. Los
cobros se concilian automáticamente.

**Alcance.**
- Integración con MercadoPago Checkout Pro o equivalente
- Generación de link de pago por cuota
- Envío del link por email (plantilla nueva)
- Webhook de MercadoPago para confirmar pagos
- Conciliación automática: pago confirmado → cuota cobrada + movimiento
  de caja generado
- UI: estado de cobranza por persona (pendiente, link enviado, pagado,
  vencido)
- Configuración MercadoPago por tenant en `/admin/integraciones`

**Dependencias previas.** Yair debe tener cuenta MercadoPago empresa para
Hindu con credenciales API.

**Entregables.**
- Integración MercadoPago funcional
- Webhook configurado
- 1 cobro de prueba completo end-to-end (link → pago real → conciliación)

**Criterios de aceptación.**
- Cuota emitida → genera link MP → email enviado a persona
- Persona paga → webhook actualiza cuota a cobrada + movimiento caja
- UI muestra estado actualizado
- Tenant configura sus credenciales MP desde panel

**NO entra.**
- Otros gateways (Stripe, dLocal — futuro)
- Pagos recurrentes automáticos (suscripción MP — Q3)
- Conciliación bancaria avanzada
- Devoluciones

**Riesgo principal.** Webhook puede demorar en configurar correctamente
en MP. Buffer: arrancar configuración el lunes mismo del sprint.

---

### Sprint 15e — Onboarding tenant + branding
**Semana 8 — 30 jun - 6 jul** · Capa: Plataforma (Onboarding)

**Objetivo.** Crear un tenant nuevo (otro club) en menos de 1 hora con
catálogos base, plan de cuentas y módulos preseleccionados. Branding
configurable por tenant. Lista para demos a Hacoaj, Nordelta, similares.

**Alcance.**
- Wizard `/admin/tenants/nuevo` (acceso solo super-admin):
  - Paso 1: datos del tenant (nombre, slug, dominio, tipo)
  - Paso 2: selección de módulos a activar (default: ClubCore standard)
  - Paso 3: catálogos base (selección de disciplinas, tipos de socio, etc.)
  - Paso 4: plan de cuentas (template estándar argentino, importable)
  - Paso 5: usuario admin inicial + envío de invitación
  - Paso 6: branding inicial (logo, colores primarios)
- Pantalla `/admin/configuracion/branding` mejorada:
  - Logo, favicon, paleta de colores
  - Dominios y subdominios
  - Preview en vivo de cómo se ve la plataforma
- Aplicación de branding en topbar, sidebar, login del tenant
- Templates pre-armados de plan de cuentas (al menos: club deportivo estándar)

**Dependencias previas.** Sprints 14d-15d. Plataforma estable.

**Entregables.**
- Wizard funcional para crear tenant en < 1 hora
- Branding por tenant aplicado a UI
- 1 tenant de prueba creado end-to-end ("ClubDemo" o similar)

**Criterios de aceptación.**
- Crear tenant nuevo desde wizard: completa en < 60 min
- Tenant nuevo accede a su panel con su branding aplicado
- Hindu sigue funcionando sin alteración
- Plan de cuentas template carga correctamente

**NO entra.**
- Self-service público (un club que se registra solo) — Q3
- Billing automático por tenant — Q3
- Multi-dominio con SSL gestionado — depende de Vercel config

**Riesgo principal.** Que el wizard no contemple un caso real al onboardear
Hacoaj/Nordelta. Mitigación: validar wizard con un tenant de prueba antes
del 1 jul.

**Final de Sprint 15e = ClubCore demo-ready para escalar.**

---

## 4. Post 1 julio — roadmap macro (sin compromiso semana a semana)

### Julio - septiembre 2026

- **Sprint 16a — Documentos y autorizaciones digitales.** Subida de
  documentos personales, autorizaciones de imagen, contratos firmados.
- **Sprint 16b — Comunicaciones avanzadas.** Segmentación, secuencias,
  WhatsApp si aparece demanda.
- **Sprint 16c — Eventos y asistencias operativos.** Hindu opera la
  agenda semanal de entrenamientos y partidos.
- **Sprint 16d — Primer cliente pago.** Onboarding asistido + estabilización.

### Octubre - diciembre 2026

- **Sprint 17a — Deprecación legacy completa.** Eliminar imports viejos
  de personas, padrones. Refactor `lib/imports/actions.ts`.
- **Sprint 17b — Auth multi-tenant real.** Migrar de TENANT_ID hardcoded
  a JWT con claims de tenant.
- **Sprint 17c — Tests automatizados (mínimo coverage).** Imports,
  finanzas, RLS.
- **Sprint 17d — Pre-inscripciones públicas.** Landing por tenant.

### 2027

- Evaluación de separación troncal según demanda
- Modelo PIM completo si aparece eCommerce o segundo vertical
- MCP server + webhooks salientes
- App móvil propia o PWA

---

## 5. Qué NO está en el roadmap hasta julio 2026

Decisión explícita: estas cosas se postergan para que el deadline sea
viable.

- PIM completo (atributos, variantes, combos, canales)
- MCP server
- Webhooks salientes
- App móvil propia
- Bot WhatsApp
- Eventos / Asistencias / Scouting operativo
- Pre-inscripciones públicas con landings
- Tests automatizados
- Refactor capa servicios (D3 de PROPUESTA-ARQUITECTONICA)
- Multi-disciplina compleja, federaciones inter-club
- Internacionalización
- API GraphQL
- Workflow engine / automatizaciones
- Marketplace de módulos

Si durante el desarrollo aparece la tentación de adelantar alguna de estas,
parar y consultar arquitecto.

---

## 6. Riesgos globales del roadmap

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Hindu detecta bugs grandes en junio | Alta | Alto | Sprint 15a-15e tienen alcance acotado, hay margen para fixes |
| Configuración Resend tarda > 1 semana | Media | Medio | Iniciar trámite DNS lunes 25 may |
| MercadoPago integración compleja | Media | Alto | Yair gestiona credenciales y permisos antes de Sprint 15d |
| UX cleanup en 14f desborda al sprint | Alta | Medio | Priorizar emisión + cobranza, UX puede pasar a 15a |
| Suscripciones / cuotas tienen bugs sutiles | Alta | Alto | Tests manuales exhaustivos antes del 1 jun |
| Code se desincroniza de docs vivos | Media | Alto | Footer del envelope obliga a actualizar CURRENT-STATE |
| Capacidad del arquitecto (vos) | Baja | Alto | Paralelización con 2 entornos o un colaborador si hace falta |
| Cambios de scope mid-sprint | Media | Alto | Regla: cambios de scope se documentan en DECISIONS.md, no informales |

---

## 7. Cómo se actualiza este documento

- Cuando se completa un sprint, se marca como ✅ y se mueve a sección
  "Sprints completados" abajo (a crearse cuando haya el primero).
- Si se detectan cambios de prioridad real, se ajusta el plan y se agrega
  entrada en `DECISIONS.md` explicando por qué.
- El arquitecto es responsable de mantener este doc al día.
- Code NO modifica este doc. Solo lo consulta.

---

## 8. Sprints completados

(Se irá poblando a medida que se cierren sprints. Formato esperado:
fecha cierre, commit hash, deploy id, notas relevantes.)

— Aún no hay sprints cerrados bajo este plan formal —
