# ClubCore — Roadmap Arquitectonico

> Plan maestro de construccion del producto, ordenado por dependencias
> tecnicas, sin compromiso de fechas. Las fases siguen un orden logico:
> cada una requiere lo construido en las anteriores. Dentro de una fase,
> los modulos pueden paralelizarse.
>
> Mantenido por el arquitecto. Cambios estructurales requieren aprobacion.
>
> Ultima actualizacion: 13 de mayo de 2026.

---

## 0. Como leer este documento

### Estados de cada modulo

| Simbolo | Estado |
|---|---|
| Done | Operativo con datos en produccion |
| Green | Esqueleto operativo (DB + UI + actions, sin datos reales todavia) |
| Yellow | Modelo en DB pero sin UI dedicada (tab en ficha persona o nada) |
| Orange | Catalogado conceptualmente pero sin construir |
| Red | No existe ni siquiera como concepto formal |

### Capas

Cada modulo declara su capa segun `MASTER-PROJECT.md` par.2:
**Troncal CRM** - **Troncal ERP** - **Troncal PIM** - **Módulo** - **Plataforma** - **Sistema entero**

### Dependencias

Cada fase declara que fases anteriores necesita. La regla es: nunca arrancar
una fase si sus dependencias no estan completas. Dentro de una fase, los
modulos pueden correr en paralelo (entornos multiples).

### Nota sobre servicios externos

Hindu Club Futbol no aporta credenciales hasta que se haga la demo del
producto terminado. **Todo se construye en modo mock por default.** Ver
`ARCHITECTURE.md` seccion "Servicios externos: mock / sandbox / production".

---

## FASE 0 — Fundacion (CERRADA)

**Estado:** Completa. Base sobre la que todo lo demas se apoya.

### Plataforma multi-tenant — Done

| Modulo | Estado | Notas |
|---|---|---|
| Tenants, sedes, configuracion publica | Done | 1 tenant (Hindu) con 2 sedes |
| Multi-tenant con RLS (116 tablas, 358 policies) | Done | 100% cobertura |
| Catalogo de modulos + activacion por tenant | Done | 48 modulos catalogados, 35+ activados en Hindu |
| Autenticacion (Supabase Auth) | Done | Email + magic link |
| Audit log | Done | 46k+ entradas registrando |
| API REST v1 con scopes | Done | 5 endpoints |
| Crons (vencimientos, cleanup, notificaciones, canon, apto, cuotas) | Done | 7 crons configurados |

### CRM core — Done

| Modulo | Estado | Notas |
|---|---|---|
| Personas (CRM) | Done | 2,390 personas en Hindu |
| Atributos transversales con vigencia | Done | 64 atributos catalogados |
| Vinculos familiares y de tutoria | Done | UI completa |
| Entidades + representantes | Done | 3 entidades cargadas |
| Fusion manual de personas duplicadas | Done | UI side-by-side |
| Ficha de persona con 19 secciones | Done | Tabs operativos |

### Vertical Club Deportivo — base operativa — Done

| Modulo | Estado | Notas |
|---|---|---|
| Equipos + plantel | Done | 7 equipos, 211 jugadores |
| Padrones | Done | 4 padrones, 2,561 asignaciones |
| Importadores con pipelines declarativos | Done | 3 pipelines configurados, match fuzzy |
| Cuerpo tecnico | Done | ADR-024, fuente unica personas_equipos |

### ERP esqueleto — Done

| Modulo | Estado | Notas |
|---|---|---|
| Plan de cuentas | Done | 104 cuentas estructuradas |
| Cajas, medios de pago, comprobantes | Done | 3 cajas, 7 medios, 12 tipos |
| Config financiera (mora, moneda) | Done | Cargada |
| UI de finanzas (dashboard + 8 pantallas) | Done | Operativa |

### Documentacion viva — Done

| Modulo | Estado | Notas |
|---|---|---|
| 12+ docs vivos en `/docs/` | Done | Completos al cierre FASE 1 |
| Design Tokens System | Done | ADR-018 |
| Sistema de ADRs | Done | 35 ADRs documentados (001-035) |

---

## FASE 1 — Base operativa Hindu (CERRADA 2026-05-11)

**Objetivo.** Hindu Club puede emitir y cobrar cuotas reales del Fondo
Futbol. Operacion financiera basica funcionando con UI usable. Notificaciones,
salud, utileria, concesiones operativas.

**Depende de.** FASE 0.

**Tag:** `v0.1.0-fase1-cierre`

### Modulos completados

| Sprint | Modulo | Estado | ADR |
|---|---|---|---|
| 14d | Cleanup + docs base | Done | — |
| 14d.5 | Design Tokens System | Done | ADR-018 |
| 14e | Suscripciones + plan Fondo Futbol | Done | ADR-019 |
| 14f | Emision de cuotas | Done | ADR-020 |
| 14g | Cobranza manual | Done | ADR-021 |
| 14h | Centros de costo UI | Done | — |
| 14i | Vista Global de Salud | Done | ADR-022 |
| 14j | Utileria del club | Done | ADR-023 |
| 14k.5 | Cuerpo Tecnico | Done | ADR-024 |
| 14k | Notificaciones in-app | Done | — |
| 14j.2 | Concesiones genericas | Done | ADR-025 |

### Metricas operativas Hindu al cierre

- 2,390 personas, 7 equipos, 211 jugadores
- 51 suscripciones activas, 51 cuotas vencidas ($510k)
- 7 centros de costo
- 23 tipos de notificacion, 4 crons
- 3 entidades (FACCMA, AIF, +1)

---

## FASE 2 — Comunicacion (CERRADA 2026-05-12)

**Objetivo.** Motor de comunicacion completo: plantillas, envios masivos,
recordatorios automaticos, preferencias por persona. Todo en modo mock
hasta FASE 16 (ADR-035).

**Depende de.** FASE 1.

**Tag:** `v0.8.0` (5 sprints completados)

### Modulos

| # | Modulo | Estado | Tag |
|---|---|---|---|
| 2.1 | Motor de comunicacion core (mock-first) | Done | v0.4.0 |
| 2.2 | Editor de plantillas + variables | Done | v0.5.0 |
| 2.3 | Envios masivos con segmentacion | Done | v0.6.0 |
| 2.4 | Cron de vencimientos + recordatorios automaticos | Done | v0.7.0 |
| 2.5 | Preferencias de canales por persona | Done | v0.8.0 |

---

## FASE 3 — Operacion deportiva (CERRADA 2026-05-12)

**Objetivo.** Operacion diaria del club: tomar asistencia en entrenamientos
y partidos, controlar quien entra al club, nóminas externas.

**Depende de.** FASE 2 (alertas por ausencias), FASE 1 (validacion pago).

**Tag:** `v0.13.0` (5 sprints completados)

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 3.1 | Control de asistencias operativo (mobile) | Done |
| 3.2 | Asistencia extendida a entidades y equipos | Done |
| 3.3 | Módulo acceso MVP (guardia mobile-first) | Done |
| 3.4 | Nóminas externas (RFC-001) | Done |
| 3.5 | Integración acceso ↔ padrón temporal | Done |

---

## FASE 4 — Planificadores (~5 sprints)

**Objetivo.** Toda la operacion deportiva planificada: entrenamientos,
amistosos, tacticas, reservas de canchas.

**Depende de.** FASE 3 (asistencias), FASE 2 (convocatorias), FASE 1
(cobro de reservas).

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 4.1 | Planificador mensual (calendario) | Done |
| 4.2 | Planificador semanal (grilla drag & drop + resize) | Done |
| 4.3 | Organizador de entrenamientos | Done |
| 4.4 | Organizador de partido amistoso | Done |
| 4.5 | Organizador tactico (SVG cancha, click-to-assign, 5 formaciones) | Done |
| 4.6 | Reservas de canchas (tabla nueva, tarifa calculada, 5 estados, sidebar) | Done |

---

## FASE 5 — Competencias, Torneos, Ligas, Federaciones (CERRADA 2026-05-13)

**Objetivo.** Sistema completo de gestion de competencias: torneos
internos organizados por el club, participacion en ligas externas
(FACCMA, AIF), fixture, resultados, tabla de posiciones, stats.

**Depende de.** FASE 4 (planificadores y eventos).

**Tag:** `v0.25.0` (6 sprints completados)

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 5.1 | Torneos internos (creador con formatos: liga, eliminacion, grupos+playoff, suizo, triangular, cuadrangular) | Done |
| 5.2 | Inscripciones externas + CSV import | Done |
| 5.3 | Fixture auto-generador (6 algoritmos TS, preview + confirm, 21 unit tests vitest) | Done |
| 5.4 | Tabla de posiciones (SQL function + UI con selector categoría + highlight propio) | Done |
| 5.5 | Carga resultado detallada (2 tablas, wizard 3 pasos, stats idempotentes) | Done |
| 5.6 | Stats jugador/equipo: 3 dashboards, stats avanzadas mock, sidebar Estadísticas | Done |

**Nota:** "Torneo Interno" = competencia organizada por el propio club
(Hindu como entidad organizadora), distinta de torneos organizados por
federaciones externas. Ver GLOSSARY.md.

---

## FASE 6 — Operacion deportiva extendida (~5 sprints)

**Objetivo.** Profundizar la operacion deportiva: lesiones, scouting,
historial, reportes deportivos.

**Depende de.** FASE 5.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 6.1 | Lesiones operativas | Yellow |
| 6.2 | Scouting operativo | Yellow |
| 6.3 | Historial categorias + selecciones + premios + clubes | Yellow |
| 6.4 | Reportes deportivos (stats, rankings, comparativos) | Red |

---

## FASE 7 — Finanzas avanzadas (~8 sprints) — mock/sandbox/production

**Objetivo.** Cobranza automatizada, reportes profesionales, conciliacion.
Todo en modo mock hasta demo.

**Depende de.** FASE 1 (base financiera), FASE 2 (avisos por email).

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 7.1 | MercadoPago integracion (mock -> sandbox -> production) | Orange |
| 7.2 | Cobranza automatica (cron + link MP + email) | Red |
| 7.3 | Conciliacion bancaria basica (CSV import) | Red |
| 7.4 | Reportes financieros (balance, deudores, cash flow) | Red |
| 7.5 | Convenios de pago UI | Yellow |
| 7.6 | Comprobantes (PDF con membrete, numeracion) | Yellow |
| 7.7 | Presupuestos por centro de costo | Yellow |
| 7.8 | Cuotas recurrentes automatizadas (cron emisor) | Red |
| 7.9 | Bonificaciones avanzadas / Becas | Yellow |

---

## FASE 8 — RRHH operativo (~3 sprints)

**Objetivo.** Hindu puede gestionar empleados: entrenadores, personal
administrativo, mantenimiento.

**Depende de.** FASE 7 (cuentas contables para imputar sueldos).

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 8.1 | Contratos UI completa | Green |
| 8.2 | Datos laborales | Yellow |
| 8.3 | Liquidaciones con movimiento de caja | Green |
| 8.4 | Reportes RRHH | Red |

---

## FASE 9 — IA aplicada (~8 sprints)

**Objetivo.** ClubCore se diferencia por aprovechar IA de forma profunda.

**Depende de.** FASE 0 (modelo de datos solido para RAG).

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 9.1 | Infraestructura LLM + RAG (pgvector) | Red |
| 9.2 | Asistente conversacional admin (widget chat) | Red |
| 9.3 | Autocompletados inteligentes | Red |
| 9.4 | Generacion de plantillas | Red |
| 9.5 | Busqueda semantica (Cmd+K global) | Red |
| 9.6 | Predicciones (riesgo baja, lesion, cobranza) | Red |
| 9.7 | Analisis de imagenes (DNI, carnet) | Red |
| 9.8 | Voice-to-text para staff | Red |

---

## FASE 10 — Bot WhatsApp (~9 sprints)

**Objetivo.** Acceso de socios y staff por WhatsApp sin app, sin login.

**Depende de.** FASE 1, FASE 2, FASE 9 (idealmente IA conversacional).

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 10.1 | Infraestructura WA Business API (mock) | Orange |
| 10.2 | Identificacion usuario por telefono | Red |
| 10.3 | Bot framework (intents + sesiones) | Red |
| 10.4 | Comandos basicos (/mis-cuotas, /pagar, /mi-equipo) | Red |
| 10.5 | Notificaciones push reales por WA | Red |
| 10.6 | Comandos avanzados (padres, coach, admin) | Red |
| 10.7 | Integracion con IA conversacional | Red |

---

## FASE 11 — Plataforma + integraciones (~6 sprints)

**Objetivo.** Convertir ClubCore en plataforma abierta con conectores.

**Depende de.** FASE 0 (API REST), demas fases para tener que integrar.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 11.1 | Marketplace de conectores (UI mejorada) | Orange |
| 11.2 | MCP Server | Orange |
| 11.3 | Webhooks salientes | Red |
| 11.4 | Conector Zoho CRM | Orange |
| 11.5 | API REST v2 (extender endpoints) | Green |
| 11.6 | SDKs cliente (JS, Python) | Red |

---

## FASE 12 — Onboarding tenant + branding (~5 sprints)

**Objetivo.** Crear tenant nuevo en < 1 hora con catálogos, plan de cuentas
template y branding. Listo para vender.

**Depende de.** FASE 1-11 con modulos estables.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 12.1 | Wizard creacion tenant (6 pasos) | Red |
| 12.2 | Templates de plan de cuentas | Red |
| 12.3 | Seleccion de modulos con preview | Red |
| 12.4 | Branding por tenant runtime mejorado | Green |
| 12.5 | Multi-sede operativo | Yellow |

---

## FASE 13 — Modulos complementarios (~6 sprints)

**Objetivo.** Completar el alcance con modulos que enriquecen la operacion.

**Depende de.** FASE 1-8.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 13.1 | Sponsors / contratos comerciales | Red |
| 13.2 | Inventario fisico | Red |
| 13.3 | Mantenimiento de instalaciones | Red |
| 13.4 | Documentos del tenant | Red |
| 13.5 | Galeria multimedia | Red |
| 13.6 | Calendario academico | Red |

---

## FASE 14 — Frontends publicos (~4 sprints)

**Objetivo.** Caras publicas del tenant: socios, aspirantes, visitantes.

**Depende de.** FASE 1-13.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 14.1 | Pre-inscripciones publicas (landing personalizable) | Yellow |
| 14.2 | Paginas publicas del tenant | Red |
| 14.3 | Member portal (/mi-cuenta) | Red |
| 14.4 | PWA instalable | Red |

---

## FASE 15 — Calidad / Seguridad / Performance (~5 sprints)

**Objetivo.** Endurecer la plataforma para produccion a escala.
Deuda tecnica detectada a lo largo de las fases anteriores se resuelve aqui.

**Depende de.** Producto razonablemente estable (FASE 1-12 minimo).

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 15.1 | Tests automatizados (vitest, integracion, RLS) | Red |
| 15.2 | Auditoria de seguridad | Red |
| 15.3 | Performance tuning (EXPLAIN, bundle, Lighthouse) | Red |
| 15.4 | Rate limiting + WAF | Red |
| 15.5 | Disaster recovery + Backups | Red |

---

**DEMO A HINDU** — Producto 100% demostrable en modo mock.
Hindu valida y decide si aporta credenciales reales.

---

## FASE 16 — Conexion servicios externos reales (~5 sprints + Resend ex-FASE 2.2)

**Objetivo.** Pasar de mock a produccion para cada servicio externo que
Hindu decida activar. Incluye ResendAdapter (ex FASE 2.2, movido por ADR-035).

**Depende de.** Demo aprobada. Credenciales del tenant disponibles.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 16.1 | ResendAdapter (sandbox + production switch) | Red |
| 16.2 | MercadoPago production (credenciales empresa) | Red |
| 16.3 | WhatsApp Business API production | Red |
| 16.4 | AFIP facturacion electronica | Red |
| 16.5 | Otros conectores segun demanda | Red |

---

## FASE 17 — Verticales adicionales (2027+)

**Objetivo.** Expandir ClubCore mas alla del vertical Club Deportivo.

**Depende de.** ClubCore estable con 3+ clientes pagos.

### Modulos

| # | Modulo | Estado |
|---|---|---|
| 17.1 | Vertical Country deportivo | Orange |
| 17.2 | Vertical Federacion Hub | Orange |
| 17.3 | Vertical Polo educativo | Orange |
| 17.4 | Vertical eCommerce | Orange |
| 17.5 | Separacion fisica troncal (refactor 2027) | Red |

---

## Mapa de dependencias

```
FASE 0 (Fundacion) -----> FASE 1 (Base operativa Hindu) [CERRADA]
|
+---> FASE 2 (Comunicacion)
|         |
|         +---> FASE 3 (Asistencias + Acceso)
|                   |
|                   +---> FASE 4 (Planificadores)
|                             |
|                             +---> FASE 5 (Competencias) [NUEVA]
|                                       |
|                                       +---> FASE 6 (Op. deportiva ext.)
|
+---> FASE 7 (Finanzas avanzadas)
          |
          +---> FASE 8 (RRHH)

FASE 0 -----> FASE 9 (IA aplicada)
|
+---> FASE 10 (Bot WhatsApp)
     (necesita FASE 2 + FASE 9)

FASE 0 -----> FASE 11 (Plataforma + integraciones)
|
+---> FASE 12 (Onboarding tenant)
     (necesita FASE 1-11 estables)

FASE 1-8  --> FASE 13 (Modulos complementarios)
FASE 1-13 --> FASE 14 (Frontends publicos)
FASE 1-14 --> FASE 15 (Calidad / seguridad / performance)

--- DEMO A HINDU ---

FASE 15 ----> FASE 16 (Conexion servicios externos reales)
FASE 16 ----> FASE 17 (Verticales adicionales, 2027+)
```

---

## Reglas operativas del roadmap

### Como se ejecuta una fase

1. Antes de arrancar fase X, validar que las fases dependientes esten
   completas.
2. Dentro de una fase, modulos pueden correr en paralelo.
3. Cada modulo arranca con su propio sprint segun `PROMPT-ENVELOPE.md`.
4. Sprints de alto riesgo (R-PE9) requieren pre-mortem.
5. Cada modulo cerrado actualiza `CURRENT-STATE.md`.

### Como se sube de fase

Una fase se considera **cerrada** cuando:
- Todos los modulos criticos estan en estado Done o Green.
- Validacion operativa real (Hindu o tenant de prueba usa el modulo).
- No hay regresiones detectadas.
- `CURRENT-STATE.md` refleja el estado real.

### Como se agregan modulos nuevos

1. Identificar en que fase encaja segun dependencias.
2. ADR en `DECISIONS.md` justificando.
3. Agregar entrada al roadmap en la fase correspondiente.
4. Si rompe la logica de fases, re-evaluar.

### Cuello de botella biologico

Items que no aceleran con paralelizacion deben arrancarse con anticipacion:

| Item | Fase | Cuando arrancar |
|---|---|---|
| DNS Resend (SPF/DKIM/DMARC) | FASE 16 | Despues de demo aprobada (ADR-035) |
| Credenciales MercadoPago empresa | FASE 16 | Despues de demo |
| Aprobacion WhatsApp Business API | FASE 16 | Despues de demo |
| Verificacion de dominio de tenant | FASE 12 | Caso por caso |

---

## Convenciones de mantenimiento

- Este documento se actualiza al cerrar cada fase o al introducir cambios
  estructurales.
- Estados de modulos se actualizan en cada sprint relevante.
- Cambios al orden de fases requieren ADR.
- `SPRINT-PLAN.md` refleja sprint actual + proximos 3 en cola.
- `MASTER-PROJECT.md` par.7 (Roadmap macro) apunta a este documento.
