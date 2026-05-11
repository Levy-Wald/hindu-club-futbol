# ClubCore — Architecture Decisions

> Registro cronológico de decisiones técnicas y de producto. Cada decisión
> documentada como un ADR (Architecture Decision Record).
>
> Las decisiones marco vigentes están consolidadas en `MASTER-PROJECT.md` §5.
> Este documento mantiene la historia y el detalle de cada una.
>
> Mantenido por: arquitecto (decisiones marco) + Code (decisiones técnicas
> tomadas durante sprints).
>
> Última actualización: 10 de mayo de 2026.

---

## Formato

Toda entrada sigue esta estructura:
ADR-NNN — Título corto
Fecha: YYYY-MM-DD
Estado: Vigente | Superada por ADR-XXX | Retirada
Capa: Troncal CRM | Troncal ERP | Troncal PIM | Vertical Club Deportivo | Módulo Paralelo | Plataforma
Tomado por: Arquitecto | Code | Yair | Equipo
Contexto
[Situación que requirió la decisión]
Decisión
[Qué se resolvió]
Alternativas descartadas
[Qué se evaluó y por qué se rechazó]
Consecuencias
[Qué impacta — positivo y negativo]

Si una decisión se supera, NO se elimina su ADR. Se marca como "Superada
por ADR-XXX" y la nueva referencia el ADR anterior en su Contexto.

---

## ADR-001 — Multi-tenant disciplinado con RLS
**Fecha:** 2026-04-15 (retroactivo)
**Estado:** Vigente
**Capa:** Plataforma
**Tomado por:** Yair + Arquitecto

### Contexto
El proyecto se concibe desde el inicio como SaaS multi-cliente. Necesita
aislamiento estricto entre tenants sin acoplarse a infraestructura
compleja (no se quieren múltiples DBs por tenant).

### Decisión
Adoptar el patrón **multi-tenant disciplinado**:
- Toda tabla de negocio tiene `tenant_id` (uuid, NOT NULL).
- Todas las tablas tienen RLS habilitada.
- Policies por tenant en SELECT, INSERT, UPDATE, DELETE.
- El código de aplicación también filtra por `tenant_id` (defensa en profundidad).

### Alternativas descartadas
- **DB por tenant:** demasiada complejidad operativa para PyMEs.
- **Schema por tenant en Postgres:** problemas de migration y discovery.
- **Solo RLS sin filtro en código:** RLS es la base pero no la única
  defensa. Bug de RLS = leak de datos. El doble filtro mitiga.

### Consecuencias
- Cada query agrega `WHERE tenant_id = ?`.
- Migrations tienen que crear RLS desde la primera versión.
- Performance: tenant_id va en todos los índices compuestos.

---

## ADR-002 — Personas con atributos, no tablas de roles
**Fecha:** 2026-04-20 (retroactivo)
**Estado:** Vigente
**Capa:** Troncal CRM
**Tomado por:** Arquitecto

### Contexto
Cada persona puede tener múltiples roles que cambian en el tiempo: socio,
jugador, empleado, cliente, proveedor, padre, tutor, admin. Modelar cada
rol como tabla separada genera duplicación y rigidez.

### Decisión
**Modelo único `personas` + tabla `personas_atributos` con vigencia.**
Un atributo es un slug del catálogo `catalogo_atributos` con `categoria`
(rol_deportivo, rol_sistema, comercial, etc.). Personas pueden tener
múltiples atributos activos simultáneamente.

### Alternativas descartadas
- Tabla `clientes`, `proveedores`, `empleados` separadas: rompe la
  unicidad de identidad. Una persona que es socio Y cliente Y empleado
  estaría 3 veces.
- Flags booleanos en `personas`: no escala (1 columna por rol) y no
  permite vigencia (`activo_desde`, `activo_hasta`).

### Consecuencias
- Queries de tipo "todos los clientes" requieren JOIN a `personas_atributos`.
- Catálogo de atributos editable desde UI.
- Mismo patrón aplica a `entidades` con `entidades_atributos` (futuro si
  hace falta).

---

## ADR-003 — Imports declarativos como mecanismo genérico
**Fecha:** 2026-04-28 (retroactivo)
**Estado:** Vigente
**Capa:** Plataforma
**Tomado por:** Arquitecto

### Contexto
Aparecieron 3 casos consecutivos de imports masivos: socios desde
padrón global, jugadores por equipo, suscriptores del fondo fútbol.
Cada uno construido como código separado generaba 700+ líneas duplicadas
con bugs propios.

### Decisión
Construir una **plataforma de imports declarativa**:
- `import_pipelines`: receta (parser, field_mappings, apply_rules).
- `import_runs`: corrida de un archivo.
- `import_rows`: cada fila con su match y apply status.
- Parsers reusables (`agrupado_por_grupo.ts`).
- Apply rules como tipos enumerados (`enriquecer_persona`,
  `agregar_atributo`, `crear_persona_nueva`, `insertar_personas_equipos`).
- Match fuzzy con función SQL `match_persona_fuzzy`.

Agregar un import nuevo = 1 INSERT en `import_pipelines` + (opcional)
parser nuevo.

### Alternativas descartadas
- Mantener cada import como código separado: ya generó 730 líneas
  legacy en `padron_syncs`.
- Usar libraría externa (algún SaaS de imports): vendor lock-in,
  costo, no se adapta al modelo de personas con atributos.

### Consecuencias
- Costo inicial alto (Sprint 14c.0).
- Costo marginal de cada import nuevo: bajo (config + parser si hace falta).
- Sistema legacy `padron_syncs` queda en deprecación (eliminado en
  Sprint 14d — ver ADR-007).

---

## ADR-004 — Match fuzzy tolerante a apóstrofes y acentos
**Fecha:** 2026-05-03 (retroactivo)
**Estado:** Vigente
**Capa:** Plataforma
**Tomado por:** Arquitecto

### Contexto
El matching fuzzy original concatenaba apellido + nombre y comparaba con
similitud trigram. Casos como "D'AMICO MANUEL" vs "D Amico Manuel" fallaban
sistemáticamente. Apellidos con apóstrofes argentinos (D'Amico, O'Brien)
son frecuentes.

### Decisión
- Función `normalize_name` quita apóstrofes (´`'ʼ), acentos, lowercase,
  trim.
- Función `match_persona_fuzzy` tokeniza por palabra y compara token a
  token, no string concatenado.
- Heurística de split apellido/nombre: primer token de 1 letra se considera
  parte del apellido compuesto ("D Amico Manuel" → apellido = "D Amico").

### Alternativas descartadas
- Pedirle al operador que limpie el archivo antes de subirlo: traslada
  el problema al usuario y no escala.
- Match exacto solamente: pierde 80% de los casos con datos sucios.

### Consecuencias
- Match resuelve apóstrofes y variantes de capitalización.
- Threshold low bajado a 0.60 para tolerar más diferencias.
- Casos extremos (ej: "Los Pilares (Matias Lombardo)" como persona)
  siguen requiriendo revisión manual.

---

## ADR-005 — DNI nullable en personas
**Fecha:** 2026-05-04 (retroactivo)
**Estado:** Vigente
**Capa:** Troncal CRM
**Tomado por:** Arquitecto

### Contexto
Las planillas reales de Hindu Club tenían jugadores sin DNI cargado
(menores que aún no lo tramitaron, casos antiguos sin documentación).
La constraint `numero_documento NOT NULL` impedía cargar el padrón.

### Decisión
`personas.numero_documento` pasa a NULLABLE. Se mantiene unique constraint
parcial (`WHERE numero_documento IS NOT NULL`).

### Alternativas descartadas
- Cargar DNIs ficticios: pollutes data integrity.
- Bloquear la carga hasta tener DNI: imposible operativamente.

### Consecuencias
- Algunos matches requieren depender solo de nombre + apellido (peor
  precisión).
- Cuando aparezca el DNI real, se actualiza la persona vía
  `enriquecer_persona`.

---

## ADR-006 — Modelo de capas: Troncal / Vertical / Módulo Paralelo / Plataforma
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Plataforma (aplica a todo)
**Tomado por:** Yair + Arquitecto

### Contexto
ClubCore se está construyendo sin disciplina explícita de capas. Aparece
deuda conceptual: tablas mezclan conceptos genéricos (personas, plan de
cuentas) con específicos de club (equipos, padrones). Sin clarificar, el
costo de verticalizar a futuro crece exponencialmente.

Yair plantea visión a 2+ años: el núcleo CRM + ERP + PIM como base para
verticalizar a otros PyMEs argentinas (eCommerce, country, federación,
polo educativo) e integrarse con Kontrol.ar de la agencia.

### Decisión
Adoptar el **modelo de capas explícito**:
- **Troncal:** CRM, ERP, PIM. Sirve a cualquier organización.
- **Vertical:** específico de la industria (hoy solo Club Deportivo).
- **Módulo Paralelo:** capacidad transversal opcional (RRHH, Salud, etc.).
- **Plataforma:** infraestructura transversal (multi-tenant, auth,
  imports, API).

Regla operativa **Doble Lente**: antes de implementar cualquier feature,
declarar la capa que toca. Si la feature sirve a cualquier organización,
va en Troncal con nombres genéricos. Si es club-específica, va en Vertical.

NO se construye la separación física hoy. Se mantiene la disciplina
conceptual en docs + revisión de cada sprint.

### Alternativas descartadas
- **Construir el troncal desde cero ahora:** trabajo titánico, sin clientes
  pagos, deadline 1 jul imposible. Decisión Yair: ClubCore primero, troncal
  recién en 2027 si hay demanda real.
- **No separar nunca:** acumula deuda conceptual; cuando aparezca el
  segundo vertical (eCommerce, country) el costo de refactor es enorme.

### Consecuencias
- Toda feature nueva declara capa antes de implementarse.
- `CURRENT-STATE.md` lista cada tabla con su capa.
- Sidebar UI agrupa por capa (Sprint 14d).
- Costo conceptual de la disciplina: bajo. Costo de no tenerla: alto a
  futuro.

---

## ADR-007 — Documentación viva única en /docs/
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Plataforma
**Tomado por:** Arquitecto + Yair

### Contexto
Hasta Sprint 14c el proyecto acumuló 19 archivos `.md` (CLAUDE.md,
MASTER-GAPS.md, NEXT-SPRINT.md, README, AUDIT-*) en estados de
desincronización. Code y arquitecto trabajaban con visiones distintas
del proyecto. Bugs recurrentes por falta de fuente única de verdad.

### Decisión
Consolidar toda la documentación viva en **7 archivos canónicos en
`/docs/`**:
1. MASTER-PROJECT.md
2. CURRENT-STATE.md
3. ARCHITECTURE.md
4. SPRINT-PLAN.md
5. DECISIONS.md (este archivo)
6. PROMPT-ENVELOPE.md
7. GLOSSARY.md

Reglas:
- Code lee al inicio de cada sesión.
- Code actualiza solo `CURRENT-STATE.md` y agrega entradas en
  `DECISIONS.md`.
- Arquitecto mantiene los otros 5.
- Cualquier otro `.md` se elimina o se consolida.

### Alternativas descartadas
- **Wiki externa (Notion, Confluence):** acceso indirecto, no versionado
  con código, Code no puede consultar.
- **README único:** demasiado denso, no separable por responsabilidad.
- **No documentar formalmente:** seguimos perdiendo sprints en
  re-explicar contexto.

### Consecuencias
- `PROMPT-ENVELOPE.md` obliga a Code a leer al iniciar y actualizar al
  cerrar.
- Mantenimiento: ~30 min por sprint para mantener todo al día.
- Sprint 14d ejecuta la limpieza inicial.

---

## ADR-008 — Deprecación de legacy padron_syncs
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Plataforma
**Tomado por:** Arquitecto

### Contexto
El sistema legacy `padron_syncs` + `padron_sync_diffs` convive con el
nuevo `import_pipelines` desde Sprint 14c. Genera:
- 730 líneas de código legacy en `sincronizar/_actions.ts`.
- 30+ refs en código.
- Dos pantallas UI duplicadas (`/admin/padrones/sincronizar/*`).
- Confusión sobre qué sistema usar.
- Mantenimiento doble de bugs.

### Decisión
Eliminar completamente el sistema legacy en Sprint 14d:
- DROP TABLE `padron_syncs` CASCADE
- DROP TABLE `padron_sync_diffs` CASCADE
- Eliminar `/app/admin/padrones/sincronizar/*`
- Eliminar `lib/padron-sync/*`
- Validar que padrones existentes siguen accesibles vía nuevo sistema.

### Alternativas descartadas
- **Mantener legacy "por si acaso":** acumula deuda. Si se vuelve a
  necesitar diff-based, se reconstruye más limpio.
- **Marcar como deprecated sin eliminar:** medio fix, sigue confundiendo.

### Consecuencias
- -730 líneas de código.
- Posible pérdida del histórico de syncs ejecutados (run
  `cf744892-c7c2-4ed0-b5b0-90a5824923a7` ya no es consultable). Aceptable.
- Sprint 14d incluye verificación de que padrones siguen funcionando.

---

## ADR-009 — Drop de views fin_* sin uso
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Troncal ERP
**Tomado por:** Arquitecto

### Contexto
En Sprint 11.7 se crearon 10 views con prefijo `fin_*` como
backward-compat. El código nunca migró a usarlas; sigue referenciando
los nombres originales (`movimientos_caja`, `productos`, etc.). Las
views son overhead inútil.

### Decisión
Drop de las 10 views en Sprint 14d:
fin_cajas, fin_movimientos, fin_productos, fin_cuotas, fin_planes,
fin_bonificaciones, fin_cuentas, fin_movimientos_cuenta, fin_convenios,
fin_cuotas_convenio.

### Alternativas descartadas
- Migrar código a usar las views: doble trabajo, las tablas funcionan
  perfecto.

### Consecuencias
- -10 objetos en DB.
- Code valida que no haya referencias en código antes de ejecutar.

---

## ADR-010 — Sprint plan compactado a 8 sprints hasta 1 jul
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Plataforma (planning)
**Tomado por:** Yair + Arquitecto

### Contexto
Plan original: 10-17 sprints para completar ClubCore con MercadoPago,
onboarding tenant, RRHH y comunicaciones. Yair establece deadline duro:
1 jun prueba interna Hindu, 1 jul full operativo + demo-ready.

### Decisión
Roadmap compactado a 8 sprints semanales (`SPRINT-PLAN.md`):
- 14d-14f: fundación, suscripciones, cobranza
- 15a-15e: Resend, reportes, RRHH, MercadoPago, onboarding tenant

Yair acepta paralelizar con segundo entorno o colaborador si el ritmo
no alcanza.

### Alternativas descartadas
- **Plan más conservador (12 sprints):** no cumple deadline de
  marketing de Hindu.
- **Eliminar features (RRHH, onboarding) para llegar:** rompe el caso
  de uso real de Hindu y el objetivo demo-ready.

### Consecuencias
- Sprints semanales sin buffer entre cada uno.
- Hindu detecta bugs durante mes de prueba (1 jun - 1 jul) → fixes
  paralelos.
- Lista explícita de "lo que NO entra hasta 1 jul" en
  `SPRINT-PLAN.md` §5.

---

## ADR-011 — Suscripciones como tabla separada, no atributo
**Fecha:** 2026-05-10
**Estado:** Vigente (a aplicar en Sprint 14e)
**Capa:** Troncal ERP
**Tomado por:** Arquitecto

### Contexto
Los suscriptores del Fondo Fútbol 2026 ya están marcados con el atributo
`suscriptor` (Sprint 14c.2). Pero para generar cuotas se necesita modelo
explícito que relacione persona ↔ plan financiero ↔ vigencia.

### Decisión
Crear tabla `suscripciones`:
suscripciones (
id uuid PK,
tenant_id uuid NOT NULL,
persona_id uuid NOT NULL REFERENCES personas,
plan_id uuid NOT NULL REFERENCES cuotas_planes,
fecha_inicio date NOT NULL,
fecha_fin date NULL,
activo boolean NOT NULL DEFAULT true,
monto_acordado numeric NULL,  -- si difiere del plan
metadata jsonb DEFAULT '{}',
created_at, updated_at
)

El atributo `suscriptor` se mantiene como **marcador CRM** (segmentación,
reportes, búsquedas).
La suscripción es el **vínculo financiero ERP** que dispara emisión de
cuotas.

### Alternativas descartadas
- **Usar solo el atributo:** no sirve para generar cuotas — un atributo
  no tiene plan asociado.
- **Modelar dentro de `cuotas_planes` como JSON de inscritos:** rompe
  normalización, query imposible.
- **Inscripciones en `personas_padrones`:** mezcla un concepto vertical
  (padrón) con uno financiero (suscripción).

### Consecuencias
- Pipeline `suscriptores_por_equipo` se modifica en Sprint 14e: aplica
  atributo + crea suscripción.
- Emisión de cuotas (Sprint 14e parte 2) toma suscripciones activas y
  genera `cuotas_emitidas`.
- Bajas: se setea `activo=false` + `fecha_fin`. NO se borra.

---

## ADR-012 — Resend como provider de email
**Fecha:** 2026-05-10
**Estado:** Vigente (a aplicar en Sprint 15a)
**Capa:** Módulo Paralelo (Comunicaciones)
**Tomado por:** Arquitecto

### Contexto
La plataforma necesita envío transaccional (recibos, vencimientos) y
masivo (comunicados). Hoy `lib/comunicaciones/email.ts` es stub.

### Decisión
Adoptar **Resend** como provider único:
- Stack moderno (API simple, buen DX).
- Pricing accesible para volúmenes PyME.
- Webhook nativo para tracking (eventos delivered, opened, bounced).
- Compatible con dominios custom por tenant (futuro).

### Alternativas descartadas
- **SendGrid:** UX complejo, pricing menos amigable a escalas chicas.
- **AWS SES:** requiere más configuración, soporte de bouncing manual.
- **Postmark:** sólido pero más caro.
- **SMTP propio:** mantenimiento + reputación = pesadilla.

### Consecuencias
- Sprint 15a configura RESEND_API_KEY en Vercel.
- DNS de dominio de envío debe configurarse 3-5 días antes (SPF, DKIM,
  DMARC).
- Por tenant en el futuro: cada cliente puede usar su dominio.

---

## ADR-013 — MercadoPago como primer integrador de cobros
**Fecha:** 2026-05-10
**Estado:** Vigente (a aplicar en Sprint 15d)
**Capa:** Plataforma (Integración)
**Tomado por:** Arquitecto + Yair

### Contexto
Para que Hindu opere cobranza real, las personas necesitan poder pagar
online. El mercado argentino exige MercadoPago como gateway dominante.

### Decisión
Integrar MercadoPago Checkout Pro como primer gateway:
- Generación de link de pago por cuota.
- Webhook de confirmación.
- Conciliación automática contra `cuotas_emitidas`.
- Credenciales por tenant en `/admin/integraciones`.

### Alternativas descartadas
- **Stripe:** no domina mercado argentino, restricciones bancarias.
- **dLocal:** mejor para multi-país, overkill para Hindu hoy.
- **Cobranza manual exclusiva:** corta el flujo, mata el caso de uso.

### Consecuencias
- Yair gestiona credenciales MP empresa para Hindu antes del Sprint
  15d.
- Pagos recurrentes automáticos (suscripción MP) quedan postergados a
  Q3 — primero validamos el flujo manual de link por cuota.
- Devoluciones quedan fuera del alcance 2026.

---

## ADR-014 — No construir PIM completo en 2026
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Troncal PIM
**Tomado por:** Arquitecto + Yair

### Contexto
La capa PIM (Product Information Management) está conceptualmente
declarada en el modelo troncal, pero hoy `productos_servicios` es una
tabla plana. PIM completo implica atributos, categorías jerárquicas,
variantes, imágenes, combos, canales — un sub-producto entero.

Hindu Club no necesita PIM. Necesita 2-3 productos cargados a mano:
"Cuota Hindu Mensual", "Fondo Fútbol 2026", quizás algún cobro puntual.

### Decisión
**Posponer construcción de PIM** hasta que aparezca demanda real:
- Segundo vertical (eCommerce, retail).
- O cliente actual con catálogo de productos > 50 ítems.

Hoy: productos como filas planas en `productos_servicios` con campos
básicos (código, nombre, precio, tipo, activo).

### Alternativas descartadas
- **Construir PIM mínimo en Sprint 14e:** distrae del foco (suscripciones).
- **Modelo intermedio con atributos JSON:** se contamina el modelo de
  futuro.

### Consecuencias
- Productos de Hindu se cargan manualmente o vía Excel simple.
- Cuando aparezca el caso real, se construye PIM como sprint dedicado.
- ARCHITECTURE.md §3.3 documenta el alcance pospuesto.

---

## ADR-015 — Postergar MCP server y webhooks salientes
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Plataforma (Integración)
**Tomado por:** Arquitecto

### Contexto
MCP (Model Context Protocol) server y webhooks salientes están declarados
en docs antiguos como features a construir. Permitirían:
- MCP: que el arquitecto opere la plataforma desde el chat directamente.
- Webhooks: notificar a sistemas externos cuando ocurren eventos
  (Zoho CRM, etc.).

Ninguna de las dos es bloqueante para el flujo Hindu → 1 jul.

### Decisión
**Posponer ambas a Q3 2026** o después. La API REST v1 con 5 endpoints
cubre el caso de uso de lectura externa. Para escritura masiva, los
pipelines de imports cubren los casos actuales.

### Alternativas descartadas
- Construir MCP server: sprint dedicado, no aporta a Hindu hoy.
- Webhooks salientes: sin sistemas consumidores reales identificados.

### Consecuencias
- Integraciones futuras (Zoho, Kontrol.ar) tienen que esperar.
- La API REST v1 sigue como único punto de integración externo.

---

## ADR-016 — Cleanup de atributos duplicados
**Fecha:** 2026-05-10
**Estado:** Vigente (a aplicar en Sprint 14d)
**Capa:** Troncal CRM
**Tomado por:** Arquitecto

### Contexto
Durante Sprints 14a-14b se introdujo nomenclatura jerárquica para
atributos administrativos (`sistema.admin`, `tenant.admin`,
`padron.admin`). Sin embargo quedaron los originales (`admin_sistema`,
`admin_tenant`, `admin_padron`) en el catálogo, sin personas asignadas
pero generando confusión.

### Decisión
Eliminar los duplicados old-style en Sprint 14d:
1. Verificar que no tengan personas asignadas (en `personas_atributos`).
2. Si las tienen, migrar al nuevo (UPDATE de slug).
3. DELETE en `catalogo_atributos`.

Convención adoptada: atributos jerárquicos usan punto como separador
(`sistema.admin`, `tenant.admin`, `padron.admin`).

### Alternativas descartadas
- Mantener ambos como alias: genera ambigüedad en queries futuras.

### Consecuencias
- Catálogo de atributos queda con 58 entradas (vs 61).
- Nueva convención `<scope>.<rol>` documentada en GLOSSARY.

---

## ADR-017 — Reorganización del sidebar UI por capas (sin mover paths)
**Fecha:** 2026-05-10
**Estado:** Vigente (a aplicar en Sprint 14d)
**Capa:** Plataforma (UI)
**Tomado por:** Arquitecto

### Contexto
El sidebar actual lista módulos sin agrupación. A medida que crece,
es difícil para el usuario y para el desarrollador identificar qué
es CRM vs ERP vs Vertical.

### Decisión
Reorganizar el sidebar con headers de sección por capa:
- (Personal): Mi perfil, Mi equipo, Mi cuenta
- (Vista general): Dashboard
- CRM: Personas, Entidades, Comunicaciones, Pre-inscripciones
- ERP: Finanzas, RRHH
- Club Deportivo: Equipos, Padrones, Operaciones
- Plataforma: Integraciones, Configuración

**NO mover paths físicos en `/app/`.** La organización por carpetas
se reevalúa en sprint posterior si hay valor.

### Alternativas descartadas
- Mover carpetas físicas: rompe links existentes, no aporta a
  funcionalidad inmediata.
- No agrupar: pierde la oportunidad de comunicar la arquitectura al
  usuario.

### Consecuencias
- UI más legible.
- Módulos desactivados (vía `tenant_modulos`) se ocultan dentro de su
  sección.

---

## Decisiones pendientes (sin ADR aún)

Estas requieren decisión próximamente. Se convierten en ADR cuando se
toman:

- **D-PENDING-01:** Estrategia de pricing y módulos pagos (Q3 cuando
  aparezca primer cliente pago).
- **D-PENDING-02:** Separación física troncal/vertical (2027+ según
  demanda).
- **D-PENDING-03:** Estrategia de tests automatizados.
- **D-PENDING-04:** Manejo de migraciones de datos entre tenants.
- **D-PENDING-05:** Estrategia de backups y restore.
- **D-PENDING-06:** Internacionalización (i18n) — postergada.
- **D-PENDING-07:** Acceso de jugadores via app móvil o PWA.
- **D-PENDING-08:** Plan de cuentas estándar argentino como template
  reusable (Sprint 15e).
- **D-PENDING-09:** Conector con Kontrol.ar (cuando exista).
- **D-PENDING-10:** Auth con JWT real con claims de tenant (Sprint 17b).

---

## Convenciones de este documento

- Los ADRs son **inmutables** una vez publicados. Si una decisión cambia,
  se crea un ADR nuevo que supera al anterior.
- Numeración correlativa (ADR-001, ADR-002, ...) sin saltos.
- Code agrega ADRs técnicos al final del sprint (formato R-PE6 de
  PROMPT-ENVELOPE.md).
- Arquitecto revisa ADRs de Code antes de cerrar sprint.
