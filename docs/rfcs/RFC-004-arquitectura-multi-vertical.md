# RFC-004 — ARQUITECTURA MULTI-VERTICAL

**Status:** Accepted
**Autor:** Claude (con Yair Levy Wald)
**Fecha:** 13 de mayo de 2026
**Supersedes:** parcialmente RFC-001, en la parte donde se asumía un único vertical CCBP

**Repo path esperado:** `docs/rfcs/RFC-004-arquitectura-multi-vertical.md`

---

## 1. CONTEXTO Y MOTIVACIÓN

### 1.1 Punto de partida

El sistema fue concebido inicialmente como ClubCore v2: una solución vertical para Hindu Club Fútbol. Durante FASES 1-5 se construyó una base sólida que cubre operación deportiva completa (personas, equipos, eventos, comunicaciones, finanzas, torneos, lesiones).

Al avanzar hacia FASE 6 (operación deportiva extendida) se identificó una oportunidad estratégica más amplia: la base construida sirve, con mínimas adaptaciones, para múltiples verticales de PyMEs. Concretamente, los verticales identificados como mercado real son:

- CCBP (Clubes, Countries y Barrios Privados)
- Estudios de Arquitectura
- Estudios de Abogacía
- Agencias de Publicidad
- Retailers PyME

### 1.2 Decisión estratégica de re-arquitectura

Se decide reposicionar el producto:

- **Producto raíz:** Plataforma SaaS Multimodal (multi-vertical, multi-tenant)
- **ClubCore:** pasa a ser un bundle del vertical CCBP sobre la plataforma
- **Hindu Club Fútbol:** primer cliente piloto del vertical CCBP

### 1.3 Motivación de fondo

Mentalidad rectora: "lo mínimo viable para que un cliente opere de la noche a la mañana, y conector especializado vía marketplace después".

Esta mentalidad aplica al troncal entero, a cada vertical, y a la oferta comercial. No se busca construir el SaaS perfecto sino el SaaS funcional que cubre el 80% de los casos de PyME con el menor esfuerzo posible.

---

## 2. DECISIONES CANONIZADAS

**D1 — Taxonomía de 4 capas**
La plataforma se organiza en 4 capas: Troncal universal (Capa 0), Módulos cross-vertical (Capa 1), Verticales (Capa 2), Conectores (Capa 3).

**D2 — Troncal mínimo = 9 bloques**
El troncal contiene 9 bloques universales que cualquier negocio del mundo necesita el día 1. Ver sección 3 para el detalle.

**D3 — PIM en 3 niveles**
El bloque PIM del troncal se implementa en 3 niveles: catálogo básico (Nivel 1, troncal), listas de precios (Nivel 2, cross-vertical opcional), stock y movimientos (Nivel 3, cross-vertical opcional).

**D4 — Proyectos & Tareas en troncal**
El bloque "Proyectos & Tareas" (mini-Trello: proyectos + tareas + comentarios + adjuntos) entra al troncal porque 3 de los 5 verticales en hoja de ruta (Arq, Abog, Pub) lo viven como core.

**D5 — RRHH NO es troncal**
Patrón uniforme de la industria (SAP, Oracle, NetSuite, Odoo, Zoho, Holded): RRHH es módulo opcional, no core ERP. Se canoniza como cross-vertical Capa 1.

**D6 — Modelo modular comercial con apagados visibles**
Los módulos no contratados se renderizan en la UI con candado y CTA para activación, no se ocultan. Esto facilita upselling y transparencia comercial.

**D7 — 5 verticales reales en hoja de ruta**
Los verticales canonizados son: CCBP, Estudios de Arquitectura, Estudios de Abogacía, Agencias de Publicidad, Retailers PyME. CCBP agrupa Clubes + Countries + Barrios Privados como un solo vertical.

**D8 — Orden de ejecución A → B → C → D → E**
FASE A (cerrar troncal mínimo) → FASE B (cerrar vertical CCBP) → FASE C (demo a Hindu) → FASE D (cross-vertical extra) → FASE E (otros verticales).

**D9 — ClubCore es bundle, no producto raíz**
ClubCore pasa a ser el nombre comercial del paquete que combina Troncal + Vertical CCBP + Conectores básicos. El producto raíz tiene otro nombre (por definir).

**D10 — Hindu es cliente piloto, no caso especial**
Hindu Club Fútbol es el primer cliente del vertical CCBP. No es referencia arquitectónica: la arquitectura sirve para Hindu y para cualquier otro club, country o barrio privado.

**D11 — Mock-first universal mantiene vigencia**
La ADR-035 (mock-first hasta FASE 16 inclusive, ahora reinterpretada como FASE C) se mantiene. No se contratan servicios externos pagos antes de la validación con Hindu.

---

## 3. CAPAS EN DETALLE

### 3.1 Capa 0 — Troncal universal (9 bloques)

Un bloque es troncal si lo necesita CUALQUIER negocio del mundo (PyME, unipersonal, agencia, club, retail) en su día 1.

**Bloque 1 — Configuración del negocio**
Tablas: `tenants`, `tenant_modulos`, `tenant_config_publica`, `sedes`, `plan_cuentas`, `centros_costo`, `periodos_contables`, `config_financiera`, `catalogo_modulos`.
Razón: sin configuración del negocio nada existe.

**Bloque 2 — CRM**
Tablas: `personas` (+ 24 tablas `personas_*`), `entidades`, `entidades_representantes`, `padrones`, `personas_padrones`, `import_*`.
Razón: cualquier negocio gestiona clientes, proveedores y contactos.

**Bloque 3 — ERP Finanzas básico**
Tablas: `productos_servicios`, `cajas`, `movimientos_caja`, `comprobantes`, `plan_cuentas`, `medios_pago`, `cuentas_corrientes`, `tipos_comprobante`, `cotizaciones`.
Razón: cualquier negocio factura, cobra y paga.

**Bloque 4 — PIM Nivel 1**
Tablas: `productos_servicios` (compartida con Finanzas), `productos_variantes` (nueva), `categorias_productos` (nueva).
Razón: cualquier negocio que vende algo necesita catálogo, sea producto o servicio. Un abogado tiene "honorario por consulta" como servicio; una agencia tiene "campaña básica" como servicio.

**Bloque 5 — Cobranza recurrente**
Tablas: `cuotas_emitidas` (consolidación pendiente con `fin_cuotas_emitidas`), `suscripciones`, `convenios_pago`, `cuotas_planes`.
Razón: cualquier negocio con abono, membresía o retainer lo necesita. Clubes, gimnasios, abogados, software, agencias.

**Bloque 6 — Motor de Comunicaciones**
Tablas: `com_plantillas`, `com_envios`, `com_mensajes`, `com_jobs_log`, `personas_preferencias_comunicacion`.
Canales: in-app obligatorio (incluido), email/SMS/WhatsApp opcionales vía conectores del marketplace.
Razón: cualquier negocio comunica con sus personas/clientes.

**Bloque 7 — Eventos & Calendario**
Tablas: `eventos`, `catalogo_tipos_evento`, `evento_invitados`, `evento_asistencias`.
Razón: cualquier negocio agenda algo. Club: entrenamientos/partidos. Jurídico: audiencias. Arquitectura: visitas a obra. Retail: lanzamientos. Médico: turnos.

**Bloque 8 — Proyectos & Tareas**
Tablas (nuevas, a crear en Sprint A6): `proyectos`, `proyecto_tareas`, `proyecto_comentarios`, `proyecto_adjuntos`.
UI: Kanban + Lista + Calendario (drag and drop básico, sin nada wow).
Razón: 3 de los 5 verticales en hoja de ruta (Arq, Abog, Pub) viven de proyectos como core. Los otros 2 (CCBP, Retail) los usan ocasionalmente. Es el contenedor natural que faltaba para conectar tareas, tickets y centros de costo operativos.

**Bloque 9 — Auditoría & Seguridad**
Tablas: `audit_log`, `api_keys`, `api_logs`, `abuse_blocks`, `user_vistas`.
Razón: plomería transversal indispensable.

### 3.2 Capa 1 — Módulos cross-vertical

Módulos reutilizables entre múltiples verticales. Cada tenant activa los que necesita vía `tenant_modulos`.

Módulos cross-vertical canonizados:

- **Asistencias** (CCBP usa convocatorias, empresa usa presentismo, educación usa alumnos)
- **Reservas de espacios** (renombrar `reservas_canchas` a `reservas_espacios`)
- **POS / Concesiones** (renombrar a `pos`)
- **Inventario / Stock simple** (renombrar `utileria` a `inventario` en código)
- **Acceso físico** (control de entradas)
- **Pre-inscripciones / Captación digital**
- **Documentos / Firma digital** (alta prioridad, los 5 verticales lo usan)
- **Tickets / Solicitudes**
- **RRHH** (contratos, liquidaciones, roles laborales)
- **Espacios físicos** (mapa visual del local — "Diagramación de Club" generalizado)
- **Pricing avanzado** (Nivel 2 del PIM): listas de precios, segmentos, vigencias
- **Stock & Movimientos** (Nivel 3 del PIM): motor central de movimientos, ubicaciones, reportes

### 3.3 Capa 2 — Verticales

Cada vertical es un paquete: mini-troncal específico del vertical + sus submódulos propios + consume módulos cross-vertical de Capa 1.

**Vertical CCBP (Clubes, Countries y Barrios Privados):**
Mini-troncal: equipos, plantel, cuerpo técnico (rol específico), categorías deportivas, disciplinas.
Submódulos propios: planificadores deportivos, entrenamientos, táctica, amistosos, competencias/torneos, salud/lesiones, scouting, federaciones, diagramación visual del club, socios membresía.
Cross-vertical que consume: Eventos, Asistencias, Reservas, Comunicaciones, POS (buffet), Inventario (utilería), Acceso (socios), Pre-inscripciones, Documentos (autorizaciones).

**Vertical Estudios de Arquitectura (futuro):**
Mini-troncal: proyectos/obras, etapas constructivas.
Submódulos propios: cronograma de obra, avances con fotos, pedidos de materiales, subcontratistas, planos.
Cross-vertical que consume: Eventos (visitas), Reservas, Comunicaciones, Inventario (materiales), Tickets (cambios), Pre-inscripciones (leads), Documentos (contratos+planos).

**Vertical Estudios de Abogacía (futuro):**
Mini-troncal: casos/expedientes, materias/áreas de práctica.
Submódulos propios: audiencias, plazos procesales, honorarios/cuota litis, documentación procesal, poderes.
Cross-vertical que consume: Eventos (audiencias/reuniones), Reservas (salas), Comunicaciones, Documentos (alta prioridad), Tickets (consultas), Pre-inscripciones (leads).

**Vertical Agencias de Publicidad (futuro):**
Mini-troncal: cuentas/clientes, campañas activas.
Submódulos propios: briefings, calendarios editoriales, kits de marca, reportes de performance.
Cross-vertical que consume: Eventos (shootings), Reservas (salas/equipos), Comunicaciones (campañas), Documentos (contratos), Tickets (briefs), Pre-inscripciones (leads).

**Vertical Retailers PyME (futuro):**
Mini-troncal: sucursales/locales, empleados por sucursal.
Submódulos propios: promociones, listas de precios avanzadas, vidriera digital, e-commerce sync, programa de fidelidad.
Cross-vertical que consume: POS (alta prioridad), Inventario (alta prioridad), Comunicaciones (a clientes), Pre-inscripciones (programa fidelidad), Acceso (empleados), Eventos (lanzamientos), Pricing avanzado (alta prioridad), Stock & Movimientos (alta prioridad).

### 3.4 Capa 3 — Conectores (marketplace)

Integraciones con sistemas externos, vendibles como add-ons individuales.

Categorías:
- **Comunicación:** Resend, SendGrid (email); BAPI, Twilio (WhatsApp); Twilio, Infobip (SMS)
- **Pago:** MercadoPago, Stripe, Modo
- **Fiscal:** AFIP (Argentina), DIAN, SII, SAT según país
- **eCommerce:** Tiendanube, Shopify, WooCommerce
- **Apps deportivas:** Catapult, Polar, Strava, federaciones (FACCMA, AIF)
- **Acceso físico:** lectores QR, biométricos, torniquetes
- **Genéricos:** Webhooks (in/out), API REST, MCP, Playwright, n8n/Zapier

---

## 4. MAPEO DEL SISTEMA ACTUAL A LAS CAPAS

### 4.1 Módulos hoy clasificados como "deportivos" que deben reclasificarse a cross-vertical (Capa 1):

- `asistencias` → Capa 1 cross-vertical
- `eventos_calendario` → Capa 1 cross-vertical
- `reservas` (`reservas_canchas`) → Capa 1 cross-vertical (renombrar a `reservas_espacios` en código)
- `acceso` → Capa 1 cross-vertical
- `pre_inscripciones` → Capa 1 cross-vertical
- `utileria` → Capa 1 cross-vertical (renombrar a `inventario`)
- `concesiones` → Capa 1 cross-vertical (renombrar a `pos`)
- `notificaciones` → sub-bloque del Motor de Comunicaciones (Capa 0)
- `socios` → Capa 1 cross-vertical "Suscripciones de membresía" (sirve a club, coworking, gym, cualquier negocio con membresía)

### 4.2 Módulos que se mantienen en Vertical CCBP (Capa 2):

`equipos`, `planificadores`, `entrenamientos`, `tactica`, `amistosos`, `competencias`, `lesiones` (cuando se construya), `scouting` (cuando se construya), `federaciones`, `diagramacion_club` (futuro).

### 4.3 Tablas paralelas que requieren consolidación (deuda técnica, no se resuelve en FASE A):

- `productos_servicios` vs `utileria_items` vs `concesion_productos`
- `cuotas_emitidas` vs `fin_cuotas_emitidas`
- `cuotas_planes` vs `fin_cuotas_planes`

Resolución: vista unificada `v_productos_catalogo` en Sprint A2. Consolidación física en FASE D.

---

## 5. IMPLICACIONES TÉCNICAS

### 5.1 Tablas nuevas a crear

**Sprint A2 (PIM Nivel 1):**
- `productos_variantes` (1:N con `productos_servicios`)
- `categorias_productos` (jerárquica con `parent_id`)
- `listas_precios` (vacía, para Nivel 2 futuro)
- `precios_por_lista` (vacía, para Nivel 2 futuro)
- `stock_ubicaciones` (vacía, para Nivel 3 futuro)
- `stock_movimientos` (vacía, para Nivel 3 futuro)
- Vista `v_productos_catalogo` (UNION ALL de las 3 tablas paralelas)

**Sprint A1 (Fix Base Operativa):**
- `espacios` (genérica, no atada a canchas) — sirve para canchas, salas, vestuarios, bares, oficinas, locales

**Sprint A6 (Proyectos & Tareas):**
- `proyectos`
- `proyecto_tareas`
- `proyecto_comentarios`
- `proyecto_adjuntos`

### 5.2 Modificaciones a tablas existentes

`catalogo_modulos`:
- Agregar columna `capa` (enum: `troncal` / `cross_vertical` / `vertical` / `integracion`)
- Agregar columna `slug_vertical` (nullable, FK a verticales para módulos de Capa 2)
- Agregar columna `requires_modulos` (array de slugs, módulos requeridos para activar este)

### 5.3 Renombres en código (búsqueda y reemplazo)

- `modules/utileria/` → `modules/inventario/` (deferido a FASE D)
- `modules/concesiones/` → `modules/pos/` (deferido a FASE D)
- `modules/reservas/` tabla `reservas_canchas` → `reservas_espacios` (deferido a FASE D)

Nota: los renombres físicos se deferean a FASE D para no romper el código existente durante FASE A y B. En el corto plazo se mantienen los nombres antiguos y la clasificación se aplica solo en `catalogo_modulos.capa`.

### 5.4 UI

Sidebar reorganizado en Sprint A1, agrupando por:
- **Troncal** (Configuración, CRM, Finanzas, Productos, Comunicaciones, Calendario, Proyectos)
- **Vertical CCBP** (Equipos, Planificadores, Entrenamientos, Competencias, Scouting)
- **Cross-vertical activos** (Asistencias, Reservas, POS, Inventario, Acceso, Pre-inscripciones, Documentos, Tickets)
- **Marketplace** (módulos disponibles para activar)

---

## 6. PLAN DE EJECUCIÓN (A → E)

### FASE A — Cerrar troncal mínimo

**Objetivo:** tener los 9 bloques del troncal funcionando con UI completa.

**Sprint A1 — Fix Base Operativa (12-15 h)**
- Sidebar reorganizado por capas
- Planificador con creación de eventos (selectable + onSelectSlot + botón "+ Nuevo evento")
- Página hub `/eventos/[id]/page.tsx` con tabs (Info/CT/Asistencia/Plan/Táctica/Amistoso)
- Tabla `espacios` genéricos + UI CRUD
- Sedes/Canchas CRUD
- Selector "Sede → Espacio" en eventos y reservas
- Reparar 8 bugs 404 identificados
- Ocultar Scouting (lo activa Sprint B3)

**Sprint A2 — PIM Nivel 1 (~7 h)**
- Crear `productos_variantes`
- Crear `categorias_productos` jerárquica
- Crear vista `v_productos_catalogo`
- UI catálogo unificado con filtros + variantes inline
- Crear tablas vacías de Niveles 2/3 (`listas_precios`, `stock_movimientos`, etc.)
- Toggles en `tenant_modulos` para "pricing_avanzado" y "stock_movimientos"

**Sprint A3 — Finanzas completa (8-10 h)**
- Resolver duplicación `cuotas_*` vs `fin_cuotas_*`
- Reparar 404s de finanzas (emitir cuotas, nuevo movimiento, nueva transferencia)
- UI completa de transferencias y movimientos
- Integración con plan de cuentas

**Sprint A4 — CRM avanzado (~10 h)**
- UI completa de padrones
- Importadores universales (CSV/Excel con mapeo)
- Vínculos entre personas y entidades con UI
- Atributos personalizados por tenant

**Sprint A5 — Comunicaciones cierre (~5 h)**
- Reparar 404 de detalle de plantilla
- Editor de plantilla expandido
- UI de automatizaciones (triggers + acciones)
- Workflow editor básico

**Sprint A6 — Proyectos & Tareas (12-15 h)**
- Tablas `proyectos`, `proyecto_tareas`, `proyecto_comentarios`, `proyecto_adjuntos`
- UI listado de proyectos con filtros
- Detalle de proyecto con 3 vistas (Kanban / Lista / Calendario)
- Modal de tarea con asignación, comentarios, adjuntos
- Tab "Proyectos" en ficha persona y entidad
- Integraciones a Personas, Finanzas (`proyecto_id` en movimientos), Eventos (deadline crea evento)

**Costo total FASE A:** ~55-62 horas Code.

### FASE B — Cerrar vertical CCBP

**Objetivo:** dejar el vertical CCBP 100% productivo para Hindu y vendible a otros clubes.

- Sprint B1 — Lesiones operativas (FASE 6.1 ya preparada)
- Sprint B2 — Historial + Trayectoria deportiva (FASE 6.2)
- Sprint B3 — Scouting + 11 dimensiones (FASE 6.3)
- Sprint B4 — Reportes deportivos (FASE 6.4)
- Sprint B5 — Activar módulo Socios (membresía CCBP)
- Sprint B6 — Cuerpo Técnico integrado al evento + Diagramación visual del club

**Costo total FASE B:** ~30 horas Code.

### FASE C — Demo a Hindu

**Objetivo:** validación end-to-end del producto completo en modo mock con Hindu Club Fútbol.

Actividades:
- Reset de DB
- Yair y staff de Hindu cargan datos desde cero
- Workflow real de Hindu durante una semana
- Sin nuevas features

Resultado esperado: producto demostrable y operable que valida el approach mock-first.

### FASE D — Cross-vertical extra

**Objetivo:** nivelar los módulos cross-vertical que más demandan los 5 verticales.

Sprints (orden por prioridad):
- D1 — Documentos / Firma digital (5/5 verticales lo usan)
- D2 — Tickets / Solicitudes universalizado
- D3 — Pricing avanzado (Nivel 2 del PIM)
- D4 — Stock & Movimientos (Nivel 3 del PIM)
- D5 — Consolidación de tablas paralelas (`productos_servicios` + `utileria_items` + `concesion_productos`)
- D6 — Espacios físicos (mapa visual generalizado)

### FASE E — Abrir otros verticales

**Objetivo:** vender la plataforma a verticales adicionales.

Orden comercial sugerido:
- E1 — Estudios de Arquitectura (cliente prima de Yair)
- E2 — Estudios de Abogacía (cliente Kate, esposa de Yair)
- E3 — Agencias de Publicidad
- E4 — Retailers PyME (cliente Pergamino)

Cada vertical implica:
- Mini-troncal específico (tablas + UI)
- Submódulos propios
- Activación de cross-vertical relevantes
- Onboarding y data inicial

---

## 7. DESVIACIONES INTENCIONALES

### 7.1 No se consolidan las 3 tablas paralelas de productos en FASE A

Razón: alto riesgo de romper utileria y concesiones funcionando. Se mitiga con vista unificada `v_productos_catalogo`. Consolidación física se difiere a FASE D.

### 7.2 No se renombran físicamente los modules/ en FASE A

Razón: el cambio de clasificación es semántico, no físico. Renombrar `modules/utileria/` a `modules/inventario/` implica refactor masivo de imports. Se aplica solo via `catalogo_modulos.capa` por ahora.

### 7.3 No se construye Pricing avanzado ni Stock & Movimientos en FASE A

Razón: ningún cliente actual lo requiere para operar. Se canoniza la arquitectura (tablas vacías preparadas) pero la implementación se difiere a FASE D según demanda real.

### 7.4 No se cambia el nombre del producto raíz en este RFC

Razón: decisión comercial pendiente. "ClubCore" sigue siendo nombre del bundle del vertical CCBP. El producto raíz se renombrará cuando Yair tome la decisión comercial.

---

## 8. REFERENCIAS

### 8.1 ADRs derivados (a canonizar en sesión siguiente)

- ADR-040 — Taxonomía de 4 capas
- ADR-041 — Definición de troncal mínimo (9 bloques)
- ADR-042 — PIM en 3 niveles
- ADR-043 — Modelo modular comercial con apagados visibles
- ADR-044 — Orden de ejecución A → B → C → D → E
- ADR-045 — Reclasificación de módulos deportivos a cross-vertical
- ADR-046 — Vista `v_productos_catalogo` como puente temporal

### 8.2 RFCs vigentes que se mantienen

- RFC-001 — Canonización inicial (sigue válido)
- RFC-002 — Competencias y torneos (sigue válido, ahora reubicado como vertical CCBP)
- RFC-003 — Operación deportiva extendida (sigue válido, ahora FASE B)

### 8.3 Documentos a producir derivados de este RFC

- `ROADMAP-MASTER.md` (Sesión 2)
- `SPRINT-PLAN.md` (Sesión 2)
- `MODULE-CATALOG.md` (Sesión 2)
- `ARCHITECTURE.md` actualizado (Sesión 3)
- `DATA-MODEL.md` actualizado (Sesión 3)
- `GLOSSARY.md` actualizado (Sesión 3)
- `SPRINT-A1-PROMPT.md` a `SPRINT-A6-PROMPT.md` (Sesiones 4-5)

---

## 9. APROBACIÓN

Este RFC se considera aceptado tras validación verbal de Yair Levy Wald en chat con Claude el 13 de mayo de 2026.

Próximo paso: committear al repo (`docs/rfcs/RFC-004-arquitectura-multi-vertical.md`) vía Claude Code.

---

*Fin del RFC-004*
