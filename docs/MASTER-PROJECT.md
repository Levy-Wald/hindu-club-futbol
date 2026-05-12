# ClubCore — Master Project

> Single source of truth del proyecto. Documento de lectura obligatoria antes
> de cualquier cambio. Mantenido por el arquitecto.
>
> Última actualización: 10 de mayo de 2026.

---

## 1. Identidad y misión

**ClubCore es una plataforma SaaS multi-cliente para clubes deportivos
argentinos.** Hindu Club es el primer cliente y caso piloto de marketing.

ClubCore se construye con la disciplina de un **núcleo genérico para clubes**
— ningún dato, configuración o regla de Hindu está hardcodeada en código.
Lo que sirve a Hindu sirve, sin tocar el repo, al próximo club que llegue.

Visión a 2+ años: el núcleo CRM + ERP + PIM de ClubCore es la base para
verticalizar la plataforma a otros tipos de PyMEs argentinas (eCommerce,
country, federación, polo educativo), integrable con Kontrol.ar y otros
productos de la agencia Levy Wald CMO. Esa separación NO se construye hoy.

### Modelo de negocio

- **Hindu Club:** no paga. Sirve como caso de estudio y canal de marketing.
  Visibilidad ante 2,389 socios + entidades + proveedores + comunidad
  deportiva argentina.
- **Próximos clientes (Q3 2026 en adelante):** clubes argentinos medianos
  (Hacoaj, Nordelta, similares). Subscripción mensual SaaS.
- **Largo plazo:** verticalizar a otros segmentos PyME.

---

## 2. Modelo de capas

ClubCore se organiza en tres capas lógicas. Cada feature, tabla, server
action y componente UI pertenece a UNA capa.

### Troncal

Lo que sirve a **cualquier** organización (club, comercio, agencia, etc.).
Conceptualmente universal. Hoy lo usa solo el vertical Club Deportivo, pero
construido con nombres y semántica genéricos.

Tres pilares:

| Pilar | Cubre |
|---|---|
| **CRM** | Personas, entidades, vínculos, atributos, comunicaciones, ciclo de relación |
| **ERP** | Plan de cuentas, contabilidad, cajas, comprobantes, períodos, productos como ítems contables, cobranza, cuotas, conciliación |
| **PIM** | Productos con atributos, imágenes, categorías, variantes, combos, canales |

### Vertical

Lo que es **específico de la industria del cliente**. Hoy solo existe el
vertical **Club Deportivo**.

Cubre: equipos, padrones, asistencias deportivas, scouting, disciplinas,
categorías deportivas, federaciones, datos médicos del jugador, etc.

### Módulos paralelos

Capacidades transversales que cualquier organización puede activar:

- **RRHH** — contratos, liquidaciones, datos laborales
- **Salud / Documentos** — datos médicos, autorizaciones, contactos de emergencia
- **Plataforma** — multi-tenant, integraciones, API, comunicaciones masivas

Los módulos se activan o desactivan por tenant vía `tenant_modulos`.

### Regla de oro — Doble lente

Antes de implementar **cualquier** feature nueva, responder dos preguntas:

1. **¿Esto sirve a cualquier organización o es específico de un club?**
2. **¿Puedo construirlo sin nombrar a Hindu ni a un club específico en código?**

Si la respuesta a (1) es "cualquier organización" → vive en **Troncal**.
Si es "específico de club" → vive en **Vertical**.
Si la respuesta a (2) es "no" → la feature está mal modelada. Reformular.

---

## 3. Las capas en detalle

### 3.1 Troncal — CRM

**Concepto:** todo lo relacionado a personas, entidades y la red de relaciones
del tenant.

**Entidades centrales:**
- `personas`: individuos del ecosistema (socios, jugadores, padres, empleados,
  clientes, proveedores, etc.). Una persona puede tener múltiples roles vía
  atributos.
- `entidades`: organizaciones (proveedores, sponsors, federaciones).
- `personas_atributos`: roles y características transversales con vigencia.
- `personas_vinculos`: relaciones familiares y de tutoría.
- `pre_inscripciones`: aspirantes pendientes de aprobación.

**Comunicación CRM (1:1 y segmentada):**
- `com_plantillas`, `com_envios`, `com_mensajes`
- `solicitudes`: cambios solicitados por personas, aprobaciones

**Catálogos CRM:**
- `catalogo_atributos`, `catalogo_tipos_vinculo`, `catalogo_estados_persona`,
  `catalogo_motivos_baja`, `catalogo_tipos_documento`

**Regla:** los conceptos "cliente", "proveedor", "socio" no son tablas
separadas. Son atributos sobre `personas` o `entidades`.

### 3.2 Troncal — ERP

**Concepto:** contabilidad, finanzas, cobranza, productos como ítems
económicos. Sigue el modelo argentino estándar.

**Entidades centrales:**
- `plan_cuentas`: árbol contable jerárquico (activo, pasivo, patrimonio,
  ingresos, egresos) hasta nivel 4.
- `centros_costo`: agrupación gerencial para imputación.
- `periodos_contables`: año/mes con estado abierto/cerrado.
- `config_financiera`: moneda, mora, numeración por tenant.
- `cajas` + `movimientos_caja`: registro de operaciones por caja.
- `tipos_comprobante`: catálogo AFIP-compatible.
- `medios_pago`: cómo se cobra/paga.
- `productos_servicios`: catálogo de ítems económicos del tenant.
- `cuotas_planes` + `cuotas_emitidas` + `emisiones_cuota`: motor de cobranza
  recurrente.
- `cuotas_bonificaciones`: descuentos por persona/condición.
- `convenios_pago`: planes de financiamiento.
- `cuentas_corrientes`: saldo persona/entidad.
- `cotizaciones`: tipos de cambio.

**Catálogos ERP:**
- `catalogo_categorias_movimiento`

**Suscripciones (Sprint 14e — falta crear):** tabla `suscripciones` que
relaciona persona ↔ plan ↔ vigencia. Sin esta tabla no hay cobranza recurrente.

### 3.3 Troncal — PIM

**Concepto:** modelado del producto. Hoy es el pilar más débil (tabla
`productos_servicios` existe pero no tiene atributos, categorías, variantes).

**Alcance ClubCore 2026:** mínimo viable. Productos como filas planas en
`productos_servicios` con campos básicos (código, nombre, precio, tipo).

**Alcance futuro (cuando aparezca eCommerce o segundo vertical):**
- `producto_categorias` (árbol)
- `producto_atributos` (clave-valor)
- `producto_variantes`
- `producto_imagenes`
- `producto_canales`
- `producto_combos`

**Regla:** todo lo que se vende, cobra o factura va por `productos_servicios`.
No crear tablas paralelas tipo "items_de_cuota" o "conceptos_facturables".

### 3.4 Vertical — Club Deportivo

**Concepto:** todo lo que es propio de la operación de un club deportivo.
Datos, relaciones, flujos y catálogos que no aplican a otro tipo de negocio.

**Entidades:**
- `equipos`, `equipos_competencias`, `categorias_equipo`, `canchas`
- `personas_equipos`, `personas_historial_categoria_deportiva`
- `padrones`, `personas_padrones`, `personas_historial_padron`
- `esquemas_tacticos`, `esquema_posiciones`, `partidos_detalle`
- `scouting_fichas`
- `eventos`, `evento_asistencias` (operación deportiva semanal)
- `personas_lesiones`, `personas_clubes_anteriores`, `personas_premios_logros`,
  `personas_selecciones`

**Catálogos vertical:**
- `catalogo_disciplinas`, `catalogo_roles_equipo`,
  `catalogo_niveles_competencia`, `catalogo_tipos_socio`,
  `catalogo_estados_padron`, `catalogo_tipos_talle`

**Regla:** si un concepto aplica a clubes y a otra industria genéricamente
(ej: "calendario de eventos"), reformular para que viva en Troncal con
extensiones verticales.

### 3.5 Módulos paralelos

**RRHH:**
- `rrhh_contratos`, `rrhh_liquidaciones`, `personas_datos_laborales`
- Catálogos: `areas_trabajo`, `puestos`, `roles_laborales`

**Salud / Documentos personales** (módulos activables por persona):
- `personas_datos_medicos`, `personas_obra_social`, `personas_documentos_medicos`
- `personas_datos_alimentarios`, `personas_contactos_emergencia`
- `personas_credenciales_acceso`, `personas_autorizaciones`
- `personas_idiomas`, `personas_talles`, `personas_vehiculos`,
  `personas_datos_economicos`

**Plataforma (infraestructura):**
- `tenants`, `tenant_modulos`, `tenant_config_publica`, `catalogo_modulos`
- `sedes`
- `api_keys`, `api_logs`
- `user_vistas`
- `audit_log`

**Importadores (mecanismo genérico):**
- `import_pipelines`, `import_runs`, `import_rows`, `import_field_conflicts`
- Funciones SQL: `match_persona_fuzzy`, `normalize_name`, `resolver_o_crear_equipo`

---

## 4. Estrategia de construcción

### Fase actual: ClubCore vertical (mayo - julio 2026)

**Objetivo:** plataforma operativa en Hindu Club, lista para vender a otros
clubes.

**Tiempos:**
- **1 jun 2026:** mes de prueba interna en Hindu (operación real, no demo)
- **1 jul 2026:** versión completa para escalar a clubes medianos
  (Hacoaj-tier ~5-10k socios)
- **Q3 2026:** primer cliente pago

**Lo que se construye:** ver `SPRINT-PLAN.md`.

**Lo que NO se construye en esta fase:**
- PIM completo (atributos, variantes, combos, canales)
- MCP server, webhooks salientes
- App móvil propia, bot WhatsApp
- Eventos / scouting operativo completo
- Pre-inscripciones públicas
- Tests automatizados
- Refactor de capa de servicios

### Fase futura: separación del troncal (2027+)

Cuando ClubCore tenga 3+ clientes pagando y aparezca demanda concreta de otro
vertical (ej: eCommerce, country), se ejecuta la separación física:

- Reorganización de paths en `/app/` por capa
- Renombrado de tablas vertical con prefijo (`clb_*` o similar)
- Construcción de PIM completo
- Posibilidad de empaquetar verticales como módulos independientes

Esta fase NO se prepara hoy. Hoy se mantiene la **disciplina conceptual** —
no la separación física.

---

## 5. Decisiones marco

Estas decisiones rigen todo el desarrollo. Cambios requieren aprobación
del arquitecto.

### D1 — Multi-tenant disciplinado

Todo dato pertenece a un `tenant_id`. Toda query lo filtra. Toda RLS policy lo
respeta. Cero excepciones.

### D2 — No Hindu en código

Ningún identificador, configuración, nombre de equipo o lista de socios de
Hindu vive en el repo. Todo via DB + tenant. Hindu se va de mañana, ClubCore
sigue funcionando para el próximo cliente.

### D3 — Catálogos editables

Cualquier dato maestro (atributos, tipos de socio, disciplinas, etc.) se
edita desde la UI de configuración del tenant. Cero seeds hardcoded en
producción (los seeds del init son solo para arranque).

### D4 — Doble lente en cada feature

Toda feature declara su capa antes de implementarse. Ver §2 — Regla de oro.

### D5 — Documentación viva única

Los documentos vivos listados en §9 son la única fuente de verdad. Cualquier
otro .md en el repo se borra o consolida. Code lee al inicio de cada sesión,
actualiza al final.

### D6 — Modularidad por tenant

Cada módulo se activa o desactiva por tenant vía `tenant_modulos`. La UI
respeta: módulos desactivados no aparecen en el sidebar.

### D7 — Mecanismos genéricos, no específicos

Cuando aparece un caso de uso nuevo, primero se evalúa si existe un mecanismo
genérico que lo resuelva. Los importadores son el caso paradigmático: en vez
de construir un "importador de jugadores" y uno de "suscriptores",
construimos una plataforma de pipelines declarativos. Todo importador nuevo
es config, no código.

### D8 — Idempotencia en operaciones de escritura

Toda operación que muta DB (apply de runs, emisión de cuotas, cobros) debe
ser repetible sin generar duplicados. Hash, unique constraints, checks
explícitos.

---

## 6. Stakeholders

| Stakeholder | Rol | Responsabilidad |
|---|---|---|
| **Yair Levy Wald** | Dueño + decisor de producto | Visión, prioridades, validación final |
| **Arquitecto (Claude Opus chat)** | Diseño, planning, supervisión | Especifica sprints, mantiene docs vivos, aprueba cambios estructurales |
| **Implementador (Claude Code)** | Construcción | Ejecuta sprints según spec, actualiza `CURRENT-STATE.md`, respeta `PROMPT-ENVELOPE.md` |
| **Hindu Club** | Cliente piloto | Usa la plataforma en operación real desde 1 jun |
| **Kontrol.ar** | Producto de Levy Wald CMO | Integración futura como hub de marketing |

---

## 7. Roadmap macro

El roadmap completo está en `ROADMAP.md`. Este documento solo
declara la visión a largo plazo. No hay fechas comprometidas.

Sprint plan operativo (sprint actual + próximos 3) en `SPRINT-PLAN.md`.

---

## 8. Glosario rápido

Ver `GLOSSARY.md` para definiciones completas. Aquí los términos críticos:

- **Tenant:** instancia de cliente (un club). Aislado por RLS.
- **Capa:** Troncal / Vertical / Módulo paralelo / Plataforma.
- **Padrón:** lista nominal de personas con un propósito específico (socios,
  jugadores de un torneo, suscriptores de un fondo).
- **Pipeline (import):** receta declarativa de cómo procesar un tipo de
  archivo. Se carga en DB, no en código.
- **Atributo (persona):** rol o característica transversal con vigencia
  (jugador, socio, admin, suscriptor).
- **ClubCore:** producto SaaS.
- **Hindu Club:** primer tenant.

---

## 9. Cómo usar este documento

**Code:** leer ENTERO al inicio de cada sesión. Si tu cambio toca un concepto
no documentado acá, parar y consultar.

**Arquitecto:** actualizar cuando cambien decisiones marco, capas, estrategia.

**Yair:** leer cada vez que tengas una idea nueva de producto, antes de
pasarme la solicitud. Si tu idea no cuadra con este modelo, lo discutimos y
ajustamos el modelo.

### Documentos vivos del proyecto

| # | Documento | Propósito | Mantiene |
|---|---|---|---|
| 1 | MASTER-PROJECT.md | Visión, capas, decisiones marco | Arquitecto |
| 2 | ARCHITECTURE.md | Convenciones, patrones, anti-patrones | Arquitecto |
| 3 | CURRENT-STATE.md | Estado actual numérico, tablas por capa | Code |
| 4 | ROADMAP.md | Roadmap arquitectónico por fases, sin tiempos | Arquitecto |
| 5 | SPRINT-PLAN.md | Sprint actual + próximos 3 en cola | Arquitecto |
| 6 | DECISIONS.md | ADRs cronológicos | Arquitecto + Code |
| 7 | PROMPT-ENVELOPE.md | Header/footer de cada sprint | Arquitecto |
| 8 | GLOSSARY.md | Términos del dominio | Arquitecto |
| 9 | UI-UX.md | Estándares de diseño y UX | Arquitecto |
| 10 | PERFORMANCE.md | Objetivos y patrones de performance | Arquitecto |
| 11 | SECURITY.md | Políticas y controles de seguridad | Arquitecto |
