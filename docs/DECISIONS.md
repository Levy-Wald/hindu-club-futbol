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
> Última actualización: 11 de mayo de 2026.

---

## Formato

Toda entrada sigue esta estructura:
ADR-NNN — Título corto
Fecha: YYYY-MM-DD
Estado: Vigente | Superada por ADR-XXX | Retirada
Capa: Troncal CRM | Troncal ERP | Troncal PIM | Módulo | Plataforma | Sistema entero
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

## PRE-MORTEM Sprint 14d.5 — Design Tokens System
**Fecha:** 2026-05-10
**Capa:** Plataforma (UI)
**Duración estimada:** 4-5 días
**Tomado por:** Arquitecto

### Escenario hipotético
"Estamos a 1 semana del cierre del Sprint 14d.5 y FALLÓ. El refactor
no terminó / introdujo regresiones visuales que Hindu detectó durante
el mes de prueba / atrasó el roadmap 1 semana extra / Code interpretó
mal el alcance y tocó cosas que no debía."

### Por qué pudo haber fallado

1. **Regresión visual sutil no detectada en review casual.**
   Probabilidad: ALTA · Impacto: MEDIO
   Un componente cambió de `bg-blue-500` a `bg-primary`, pero el
   primario del sistema es un azul ligeramente distinto. En review
   no se nota; los usuarios sí lo notan.
   Mitigación: review pantalla por pantalla obligatorio en criterios
   de aceptación. Comparación side-by-side antes/después de cada
   carpeta refactorizada.

2. **Sprint se estira más de los 5 días estimados.**
   Probabilidad: ALTA · Impacto: ALTO
   105 componentes es solo una estimación. Hex codes en clases
   dinámicas, casos especiales, decisiones de producto durante el
   refactor pueden multiplicar el tiempo.
   Mitigación: alcance dividido en fases por carpeta. Build verde
   entre cada fase. Si día 5 sin terminar, parar y evaluar (no
   acumular deuda silenciosa).

3. **Branding del tenant Hindu deja de funcionar después del refactor.**
   Probabilidad: MEDIA · Impacto: ALTO
   El sistema de aplicar `tenant_config_publica.colores_primarios`
   sobrescribe CSS vars. Si el refactor cambia los nombres o la
   estrategia, Hindu pierde su branding.
   Mitigación: criterio de aceptación explícito "branding del tenant
   sigue funcionando". Validación manual con Hindu antes de cerrar.

4. **Hex codes en clases dinámicas (template literals) no detectados.**
   Probabilidad: MEDIA · Impacto: MEDIO
   `<div className={\`bg-${color}-${shade}\`}>` no lo detecta el grep
   simple. Quedan colores hardcoded escondidos.
   Mitigación: grep regex específico para template literals tipo
   `\`bg-\${...}\``. Revisión manual de cualquier match.

5. **Modo oscuro se rompe.**
   Probabilidad: MEDIA · Impacto: MEDIO
   Cada refactor de componente debería validarse en ambos modos. Es
   fácil olvidarlo.
   Mitigación: criterio de aceptación explícito "modo oscuro
   funciona". Toggle obligatorio en review por carpeta.

6. **Code interpreta mal el spec y refactoriza demasiado.**
   Probabilidad: BAJA · Impacto: ALTO
   Code podría cambiar layouts, estructura o componentes en lugar de
   solo tokens. Eso rompe la promesa de "visual idéntico".
   Mitigación: §NO ESTÁ EN ESTE SPRINT del spec lo dice explícito.
   Si Code detecta caso ambiguo, parar y consultar (R-PE3).

7. **Conflictos por valores arbitrarios que requieren decisión.**
   Probabilidad: MEDIA · Impacto: BAJO
   "Este `p-[13px]` raro, ¿a qué token corresponde, 12 o 16?"
   Mitigación: regla por default — redondear hacia el más cercano de
   la escala (12 si <14, 16 si >=14). Si genera regresión visual
   inaceptable, levantarlo como excepción.

8. **CSS vars agregan overhead de performance.**
   Probabilidad: MUY BAJA · Impacto: BAJO
   CSS vars son nativas, no agregan overhead medible.
   Mitigación: criterio de aceptación incluye "Lighthouse Performance
   mobile no baja". Si baja, investigar.

9. **Conflicto con cambios paralelos en otros sprints.**
   Probabilidad: BAJA · Impacto: MEDIO
   Si Yair empieza otro entorno en paralelo (como dijo), pueden
   chocar.
   Mitigación: Sprint 14d.5 corre solo, sin trabajo paralelo en
   componentes hasta que cierre.

10. **Componentes shadcn ya tienen tokens, pero wrappers propios los
    sobrescriben con hardcoded.**
    Probabilidad: MEDIA · Impacto: BAJO
    Confusión sobre dónde está el valor real.
    Mitigación: priorizar wrappers propios primero. Documentar caso
    a caso si shadcn nativo necesita override.

### Top 3 riesgos (por prob × impacto)

1. **Sprint se estira más de 5 días** → Mitigación obligatoria:
   refactor por carpeta con build verde entre cada una. Stop &
   evaluate en día 5.

2. **Regresión visual sutil no detectada** → Mitigación obligatoria:
   review pantalla por pantalla, side-by-side, registrado en commit
   message con qué carpetas se validaron.

3. **Branding del tenant Hindu se rompe** → Mitigación obligatoria:
   validación manual de branding Hindu como último paso antes de
   cerrar sprint. Si rompe, no se cierra.

### Ajustes al spec del sprint

Basado en este pre-mortem, ajustes obligatorios al spec original:

- **Parte 3 (Refactor) se ejecuta en FASES, una carpeta a la vez:**
  1. `/components/` (atómicos primero)
  2. `/app/admin/personas/`
  3. `/app/admin/equipos/`
  4. `/app/admin/padrones/`
  5. `/app/admin/externos/`
  6. `/app/admin/finanzas/`
  7. `/app/admin/rrhh/`
  8. `/app/admin/comunicaciones/`
  9. `/app/admin/operaciones/`
  10. `/app/admin/configuracion/` + resto

  Build verde + review visual obligatorio después de cada fase.

- **Parte 2 (Auditoría) suma grep de template literals:**
  ```bash
  grep -rE "(bg|text|border)-\\\${" app/ components/ \
    --include="*.tsx" --include="*.ts"
  ```
  Toda match se revisa manualmente.

- **Criterio de aceptación 6 expandido:** "Sitio visualmente idéntico
  al estado previo al sprint" incluye:
  - Validación en modo claro Y oscuro
  - Validación de branding del tenant Hindu activo
  - Comparación side-by-side de las 10 carpetas principales

- **Stop & evaluate en día 5:** si al día 5 el sprint no terminó,
  Code reporta al arquitecto con: % completado, qué queda, qué se
  encontró que no estaba estimado. Decisión conjunta: seguir,
  pausar, o reducir alcance.

### Indicadores tempranos de falla

Señales que disparan alerta durante la ejecución:

- Día 2: si la auditoría inicial (Parte 2) reporta > 1000 hex codes
  o > 2000 color names → el alcance es mucho mayor de lo estimado,
  evaluar.
- Día 3: si no se completó al menos /components/ + 2 carpetas de
  /admin/ → atraso real, ajustar.
- Cualquier momento: si un componente refactorizado rompe modo
  oscuro → parar la carpeta entera, revisar metodología.
- Cualquier momento: si Hindu (tenant de prueba activo) pierde su
  branding visualmente → rollback inmediato del último cambio,
  investigar.
- Cualquier momento: si build se rompe y no se puede reparar en < 30
  minutos → revertir al último build verde.

---

## ADR-018 — Design Tokens System
**Fecha:** 2026-05-10
**Estado:** Vigente
**Capa:** Plataforma (UI)
**Tomado por:** Arquitecto

### Contexto
Los componentes usaban colores hardcodeados (hex como `#3A8FC5`, Tailwind
names como `green-600`). Esto impedía: (a) branding por tenant, (b) dark
mode consistente, (c) cambios de look sin tocar 100+ archivos.

### Decisión
Crear un sistema de tokens CSS centralizado:
- **Fuente única:** `/styles/tokens.css` define todos los tokens visuales.
- **Tailwind v4:** `globals.css` los registra vía `@theme inline`.
- **Escalas semánticas:** `brand-*`, `gold-*`, `success-*`, `warning-*`,
  `error-*`, `info-*`, `neutral-*` reemplazan colores raw.
- **Branding runtime:** El root layout inyecta `--primary-500` y
  `--accent-gold-500` desde `tenant_config_publica` en un `<style>` tag.
- **Theme swap:** Crear un archivo en `/styles/themes/` y importarlo
  después de `tokens.css` para cambiar el look completo.

### Reglas derivadas
1. Cero hex codes en componentes (excepciones: color pickers, dinámicos
   de equipo, bibliotecas externas).
2. Cero nombres de color Tailwind raw (green, red, blue, gray, etc.).
3. Toda clase de color usa tokens semánticos registrados en `@theme inline`.

### Alternativas descartadas
- CSS-in-JS tokens (styled-components): agrega runtime, no usa Tailwind.
- Tailwind config file: proyecto usa Tailwind v4 CSS-native, no hay
  `tailwind.config.ts`.

### Consecuencias
- Branding por tenant funciona con solo 2 CSS variables.
- Cambiar paleta completa = editar 1 archivo (`tokens.css`).
- Componentes son agnósticos al color real.

---

## ADR-019 — Suscripciones como entidad propia, no como atributo
**Fecha:** 2026-05-10
**Estado:** Decidido
**Capa:** Troncal ERP + Vertical Club
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto
Hindu Club opera el "Fondo Fútbol 2026", un sistema donde socios pagan una
cuota mensual para sostener la disciplina. Existe ya un atributo
`suscriptor` que se agrega via pipeline desde el padrón importado.

El atributo `suscriptor` indica QUIÉN es suscriptor, pero no responde:
- ¿A qué plan está suscripto? (puede haber múltiples planes en el futuro)
- ¿Desde cuándo? (fecha de inicio)
- ¿Hasta cuándo? (vigencia)
- ¿Con qué monto pactado? (puede diferir del monto del plan por bonificación)
- ¿Estado? (activa, pausada, dada de baja con motivo)
- ¿Quién la dio de alta y cuándo?

Esta información no se puede modelar limpiamente en un atributo
booleano.

### Decisión
Crear tabla `suscripciones` como entidad propia con relación N:N entre
`personas` y `cuotas_planes`, con metadata de la suscripción (vigencia,
monto acordado, estado, motivo de baja).

El atributo `suscriptor` se mantiene como marca rápida ("esta persona
tiene al menos una suscripción activa"), pero la fuente de verdad
operacional es la tabla `suscripciones`.

### Alternativas evaluadas
1. **Atributo + JSON metadata** — descartado. Difícil de querear, no hay
   integridad referencial con `cuotas_planes`.
2. **Solo cuotas emitidas, sin suscripciones** — descartado. No permite
   distinguir "suscripto pero todavía no le emití cuota este mes" vs
   "no suscripto". Se necesita el concepto de suscripción activa
   independiente de la emisión.
3. **Suscripción dentro de `cuotas_planes`** — descartado. Un plan tiene
   N suscripciones; mezclar las dos cosas rompe normalización.

### Consecuencias
**Positivas:**
- Modelo limpio que escala a múltiples planes por persona
- Permite trazabilidad histórica (alta, baja, motivo)
- Permite reportes precisos: "cuántos suscriptos al plan X tengo hoy"
- Habilita emisión de cuotas con join directo (suscripcion → plan → monto)

**Negativas:**
- Sumar una tabla más al modelo
- Necesidad de mantener sincronizado el atributo `suscriptor` con la
  existencia de al menos 1 suscripción activa (vía trigger)

### Implementación
Ver Sprint 14e (Parte 3 - Migration y Parte 5 - Trigger de sincronización).

---

## PRE-MORTEM Sprint 14e — Modelo de Suscripciones
**Fecha:** 2026-05-10
**Capa:** Troncal ERP + Vertical Club
**Duración estimada:** sin estimar (R-PE9 aplica por capa crítica + migración de datos)
**Tomado por:** Arquitecto

### Escenario hipotético
"Estamos a 1 semana del cierre del Sprint 14e y FALLÓ. La tabla
suscripciones quedó con datos inconsistentes, el pipeline no aplicó
correctamente las 57 suscripciones del padrón, o el modelo no escala
para los próximos sprints (emisión de cuotas, cobranza)."

### Por qué pudo haber fallado

1. **Sincronización atributo `suscriptor` ↔ tabla `suscripciones` se rompe.**
   Probabilidad: ALTA · Impacto: ALTO
   Si el trigger no maneja todos los casos (alta, baja, modificación de
   vigencia, persona con múltiples suscripciones), queda el atributo
   marcando "suscriptor" cuando no hay suscripciones activas, o viceversa.
   Mitigación: trigger compuesto AFTER INSERT/UPDATE/DELETE en
   suscripciones que recalcula el atributo en cada operación. Test
   manual con casos: alta única, alta doble, baja con otra activa, baja
   total.

2. **El pipeline re-aplicado crea suscripciones DUPLICADAS** (la persona ya
   tiene suscripción activa al mismo plan y se le agrega otra).
   Probabilidad: ALTA · Impacto: ALTO
   Mitigación: la acción `crear_suscripcion` debe ser idempotente con
   UNIQUE constraint en (tenant_id, persona_id, plan_id, fecha_baja IS NULL).
   Si existe suscripción activa, no crear duplicada; actualizar metadata
   si difiere.

3. **57 suscripciones aplicadas con monto incorrecto** porque el plan se
   cargó con valor placeholder y nadie reemplazó.
   Probabilidad: MEDIA · Impacto: ALTO
   Mitigación: NO aplicar el run hasta que Yair confirme monto real del
   Fondo Fútbol. Spec marca placeholders explícitos. Validación pre-apply
   en UI: "estás por crear 57 suscripciones con monto $X, confirmás?"

4. **Migration falla por nombre de función trigger incorrecto.**
   Probabilidad: MEDIA · Impacto: MEDIO
   Code-generated migrations usan `set_updated_at()` cuando el schema usa
   `trg_set_updated_at`.
   Mitigación: revisar manualmente toda referencia a funciones en la
   migration ANTES de aplicarla. Recordatorio en el spec.

5. **RLS bloquea el SELECT del usuario admin** porque la política está
   mal escrita.
   Probabilidad: MEDIA · Impacto: ALTO
   Mitigación: copiar la estructura de RLS exacta de
   `cuotas_planes` que ya funciona. Test con usuario admin Hindu antes
   de cerrar sprint.

6. **El UI tab no muestra suscripciones porque hay ambigüedad de FK** (la
   misma persona aparece como suscriptor y como `dado_de_alta_por`).
   Probabilidad: MEDIA · Impacto: MEDIO
   Mitigación: usar FK hints explícitos en queries PostgREST
   (`!persona_id`, `!dado_de_alta_por`). Aprendido en Sprint 14a.9.

7. **Re-aplicar el run crea personas duplicadas** porque match fuzzy
   detecta como nueva una persona que ya está en el padrón principal.
   Probabilidad: MEDIA · Impacto: ALTO
   Mitigación: el run ya tiene match resuelto (manual o automático). Solo
   queda APLICAR. No re-correr matching. Pre-condición del sprint:
   matching del run está cerrado.

8. **Trigger de sincronización entra en loop infinito** porque al
   actualizar el atributo dispara otro trigger que toca suscripciones.
   Probabilidad: BAJA · Impacto: ALTO
   Mitigación: trigger usa `pg_trigger_depth()` para no recursionar.
   Patrón conocido del schema.

9. **Performance del listado global se degrada** con joins anidados
   (suscripcion → plan → producto → persona → atributos).
   Probabilidad: BAJA · Impacto: BAJO
   Mitigación: crear vista `v_suscripciones_completas` con todos los joins
   pre-resueltos. Índices compuestos. Paginación en UI.

10. **El sprint se cierra con tabla creada pero suscripciones reales
    NO aplicadas** porque Yair no tuvo los datos del Fondo Fútbol a
    tiempo.
    Probabilidad: ALTA · Impacto: BAJO
    Mitigación: aceptar esto como caso válido. El sprint cierra con
    modelo + UI + pipeline ampliado. La aplicación del run es Parte 10,
    "operacional" y puede quedar pendiente sin bloquear el sprint.

### Top 3 riesgos (por prob × impacto)

1. **Sincronización atributo ↔ tabla se rompe** → Mitigación obligatoria:
   trigger AFTER en suscripciones con tests manuales de los 4 casos.

2. **Pipeline crea suscripciones duplicadas al re-aplicar** → Mitigación
   obligatoria: UNIQUE constraint parcial (WHERE fecha_baja IS NULL) +
   acción `crear_suscripcion` idempotente con UPSERT.

3. **57 suscripciones aplicadas con monto incorrecto** → Mitigación
   obligatoria: NO aplicar run sin confirmación explícita de monto real.
   Validación pre-apply en UI con preview de monto.

### Ajustes al spec del sprint

- Parte 3 (Migration) suma UNIQUE PARTIAL INDEX y nombre de función
  trigger verificado.
- Parte 4 (Pipeline) suma acción `crear_suscripcion` con UPSERT.
- Parte 5 (Apply rule executor) implementa idempotencia explícita.
- Parte 6 (Carga inicial producto+plan) usa placeholders marcados.
- Parte 7 (UI ficha persona) usa FK hints PostgREST.
- Parte 10 (Re-aplicar run) requiere CONFIRMACIÓN de monto real antes de
  ejecutar.

### Indicadores tempranos de falla

- Migration falla en `apply_migration`: revisar nombre de función trigger.
- Build falla: revisar imports y FK hints.
- En run preview: si aparecen >57 suscripciones a crear, es duplicación.
- Tras run apply: si COUNT(suscripciones activas) ≠ COUNT(personas con
  atributo `suscriptor`), trigger está roto.
- Performance del listado global > 2 segundos: falta vista o índice.

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
## ADR-020 — Emisión de cuotas como evento atómico con rollback

**Fecha:** 2026-05-10
**Estado:** Decidido
**Capa:** Troncal ERP
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto

Hindu necesita emitir cuotas mensuales del Fondo Fútbol a 57 suscriptores
en una sola operación. Pero esta operación es transaccional y compleja:
- Si falla a la mitad, no puede quedar a medias (50 emitidas + 7
  pendientes)
- Si hay error de monto, debe haber forma de revertir TODO el lote
- Es responsable de generar movimientos contables (cuenta de deudores)
- Debe ser idempotente (re-ejecutar el mismo período no duplica)

### Decisión

Modelar la emisión como una entidad propia (`emisiones_cuota`) que
agrupa cuotas emitidas en un solo evento. La emisión se ejecuta en una
función SQL atómica que:
1. Crea el registro en `emisiones_cuota` (header del lote)
2. Inserta N filas en `cuotas_emitidas` linkeadas con `emision_id`
3. Genera movimientos contables (cuenta debe = deudores; cuenta haber = ingreso)
4. Actualiza `cuentas_corrientes` con saldo deudor

Si cualquier paso falla, ROLLBACK completo. La anulación de un lote
revierte todas las cuotas + movimientos asociados.

### Alternativas evaluadas

1. **Sin tabla `emisiones_cuota`, solo `cuotas_emitidas` con metadata** —
   descartado. Anulación de lote completo sería compleja de implementar.
2. **Emisión en cliente con loop de inserts** — descartado. Sin
   atomicidad, sin idempotencia, sin rollback.
3. **Emisión vía Edge Function asincrónica** — descartado por ahora.
   Para 57 cuotas no se justifica complejidad.

### Consecuencias

**Positivas:**
- Atomicidad garantizada
- Rollback completo de lotes errados
- Auditoría: quién emitió qué lote y cuándo
- Idempotencia: re-emitir mismo período no duplica

**Negativas:**
- Función SQL larga (~150 líneas) requiere review cuidadoso
- Performance: para 57 cuotas no hay problema. Para 5000+ habría que
  evaluar batching.

---

## PRE-MORTEM Sprint 14f — Emisión de Cuotas

**Fecha:** 2026-05-10
**Capa:** Troncal ERP
**Tomado por:** Arquitecto

### Escenario hipotético

"Hindu intentó emitir las cuotas del mes y algo salió mal. O se
emitieron con monto incorrecto, o se duplicaron, o el movimiento
contable quedó inconsistente, o se emitieron a personas que no son
suscriptoras."

### Por qué pudo haber fallado

1. **Emisión a personas que NO son suscriptoras del plan.**
   Prob: MEDIA · Impacto: ALTO.
   Mitigación: función SQL valida suscripción activa al plan.

2. **Re-emitir mismo período crea cuotas duplicadas.**
   Prob: ALTA · Impacto: ALTO.
   Mitigación: UNIQUE parcial en cuotas_emitidas + idempotencia.

3. **Bonificaciones aplicadas incorrectamente.**
   Prob: MEDIA · Impacto: ALTO.
   Mitigación: prioridad en tabla, aplicación ordenada.

4. **Movimiento contable huérfano.**
   Prob: BAJA · Impacto: ALTO.
   Mitigación: transacción SQL atómica.

5. **Timeout en emisiones grandes (5000+).**
   Prob: BAJA · Impacto: MEDIO.
   Mitigación: función directa por ahora, batching futuro.

6. **Saldo cuenta corriente desincronizado.**
   Prob: MEDIA · Impacto: ALTO.
   Mitigación: trigger de recálculo + test ciclo completo.

7. **Período mal interpretado.**
   Prob: BAJA · Impacto: MEDIO.
   Mitigación: formato estricto YYYY-MM + validación.

8. **Anulación no anula cuotas YA PAGADAS.**
   Prob: MEDIA · Impacto: BAJO.
   Mitigación: estado 'anulada_parcial' + UI clara.

9. **Fecha vencimiento incorrecta (día 31 en febrero).**
   Prob: MEDIA · Impacto: BAJO.
   Mitigación: LEAST(día_plan, último_día_mes).

10. **Notificación in-app no se dispara.**
    Prob: ALTA · Impacto: BAJO.
    Mitigación: skip silencioso si tabla no existe.

### Top 3 riesgos

1. Re-emitir duplica → UNIQUE parcial obligatorio.
2. Emisión a no-suscriptores → JOIN con suscripciones activas.
3. Saldo desincronizado → trigger + test ciclo completo.

---

## ADR-021 — Tabla `cuotas_pagos` como detalle de cobranza, separada de `cuotas_emitidas`

**Fecha:** 2026-05-11
**Estado:** Decidido
**Capa:** Troncal ERP
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto

Una cuota emitida (`cuotas_emitidas`) puede cobrarse de varias formas:

- **Pago total único:** efectivo, una sola operación, cuota queda pagada.
- **Pago parcial único:** la persona paga $5000 de $10000, queda en estado
  `parcial`.
- **Pagos parciales múltiples:** persona paga $3000 + $3000 + $4000 en 3
  operaciones distintas. Cada pago tiene su medio, fecha, monto, comprobante.

`cuotas_emitidas` tiene un solo `fecha_pago` y un solo `movimiento_id`,
lo que no escala a múltiples pagos por cuota. Hay que separar.

### Decisión

Crear tabla `cuotas_pagos` con la relación 1:N: una cuota tiene N pagos.
Cada pago tiene su propio movimiento contable. La cuota actualiza su
estado en función de la suma de pagos:

- Suma de pagos < monto_final → estado `parcial`
- Suma de pagos = monto_final → estado `pagada`
- Suma de pagos > monto_final → no permitido (constraint)

El campo `cuotas_emitidas.fecha_pago` se mantiene como **fecha del primer
pago** (compatibilidad). El campo `movimiento_id` queda obsoleto.

### Alternativas evaluadas

1. **Mantener solo 1 pago por cuota** — descartado. No permite pagos
   parciales detallados.
2. **Pagos como movimientos directos sin tabla intermedia** — descartado.
   Hace difícil cancelar un pago específico.
3. **JSON en `cuotas_emitidas.metadata.pagos`** — descartado. Sin
   integridad referencial.

### Consecuencias

**Positivas:**
- Modelo limpio que soporta todos los casos de cobranza reales
- Trazabilidad completa: quién cobró, cuándo, con qué medio, cuánto
- Anulación de pago individual sin tocar la cuota
- Habilita planes de pago internos (convenios, FASE 6)

**Negativas:**
- Tabla adicional, joins más largos para queries simples
- Trigger de sincronización entre `cuotas_pagos` y `cuotas_emitidas.estado`

---

## PRE-MORTEM Sprint 14g — Cobranza Manual

**Fecha:** 2026-05-11
**Capa:** Troncal ERP
**Tomado por:** Arquitecto

### Escenario hipotético

"Hindu cobró 30 cuotas durante el mes. Al revisar reportes, los números
no cuadran: cuentas corrientes desactualizadas, cuotas marcadas pagadas
sin movimiento de caja correspondiente, o doble cobro de la misma cuota."

### Por qué pudo haber fallado

1. **Cobranza duplicada de la misma cuota.**
   Prob: ALTA · Impacto: ALTO.
   Mitigación: función SQL con check de idempotencia (5min window) +
   UI loading state bloquea doble click.

2. **Estado de cuota no se sincroniza al cancelar pago.**
   Prob: ALTA · Impacto: ALTO.
   Mitigación: trigger AFTER en `cuotas_pagos` recalcula estado
   cada vez desde cero.

3. **Movimiento contable no se genera al cobrar.**
   Prob: MEDIA · Impacto: ALTO.
   Mitigación: `fn_cobrar_cuota` crea movimiento en misma transacción.

4. **Pago parcial supera monto de la cuota.**
   Prob: BAJA · Impacto: MEDIO.
   Mitigación: constraint CHECK + validación en UI.

5. **Anulación de pago no anula movimiento de caja.**
   Prob: MEDIA · Impacto: ALTO.
   Mitigación: `fn_anular_pago` crea movimiento reverso (no borra).

6. **Cobranza de cuota anulada.**
   Prob: BAJA · Impacto: ALTO.
   Mitigación: función valida estado != 'anulada'.

### Top 3 riesgos

1. Cobranza duplicada → idempotencia en función + loading state.
2. Sincronización estado cuota ↔ pagos rota → trigger AFTER recalcula.
3. Anulación deja movimiento huérfano → movimiento reverso obligatorio.

---

## ADR-022 — Vista Global de Salud como módulo read-only con permisos por atributo

**Fecha:** 2026-05-11
**Estado:** Decidido
**Capa:** Vertical Club Deportivo
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto

Los datos de salud (lesiones, datos médicos, obra social, autorizaciones,
contactos de emergencia, vehículos) están dispersos en la ficha de cada
persona. Para operaciones del club (partidos, entrenamientos, emergencias)
se necesita una vista consolidada que cruce todas las personas.

Estos datos son sensibles y requieren control de acceso diferenciado.

### Decisión

Crear módulo `/admin/salud` con 7 vistas read-only alimentadas por SQL
views (`v_salud_*`). El acceso se controla por atributos:

- `staff_acceso_total_salud` / admin → todo + exportar
- `staff_medico` → lesiones, datos médicos, obra social, contactos (sin exportar)
- Staff regular → lesiones, autorizaciones, contactos, vehículos (nivel básico)

Cada acceso se registra en `audit_log` con acción `salud.*`.

No se permite edición desde este módulo — la edición se hace en la ficha
de cada persona.

### Alternativas descartadas

1. **Edición directa desde vista global** — descartado. Viola principio
   de fuente única (ficha persona). Duplicaría lógica de validación.
2. **Sin audit log** — descartado. Datos sensibles requieren trazabilidad.
3. **Permisos por rol en tabla propia** — descartado. Atributos ya son
   el mecanismo de roles del sistema (D7).

### Consecuencias

- 7 SQL views para consultas eficientes
- 3 nuevos atributos en catálogo (staff_medico, staff_responsable_menores,
  staff_acceso_total_salud)
- `lib/permisos/salud.ts` centraliza lógica de permisos
- Audit log en cada acceso a tab

---

## PRE-MORTEM Sprint 14i — Vista Global de Salud

**Fecha:** 2026-05-11
**Capa:** Vertical Club Deportivo
**Tomado por:** Arquitecto

### Escenario hipotético

"El módulo de Salud se desplegó pero nadie puede acceder porque los
atributos no están asignados, o las views fallan porque las tablas
subyacentes no tienen datos, o el audit log genera overhead visible."

### Por qué pudo haber fallado

1. **Views referencian columnas que no existen.**
   Prob: ALTA · Impacto: ALTO.
   Mitigación: verificar cada view contra schema real antes de crear.
   Ya corregido: `personas.activo` → `deleted_at IS NULL`,
   `tipo_vehiculo` → `tipo_vehiculo_slug`, `acceso_autorizado` →
   `permite_ingreso_club`.

2. **Atributos no asignados a ningún usuario → nadie ve nada.**
   Prob: ALTA · Impacto: MEDIO.
   Mitigación: asignar atributos a Yair como parte del sprint.

3. **Audit log INSERT falla por constraint y rompe la consulta.**
   Prob: MEDIA · Impacto: ALTO.
   Mitigación: audit log es fire-and-forget (sin await del resultado
   en path crítico).

4. **Performance de views con muchos joins en tablas vacías.**
   Prob: BAJA · Impacto: BAJO.
   Mitigación: LIMIT 200-300 en cada query. Hindu tiene <200 personas.

### Top 3 riesgos

1. Views con columnas incorrectas → verificar contra schema.
2. Sin atributos asignados → INSERT en sprint.
3. Audit log bloqueante → fire-and-forget.

---

## ADR-023 — Utilería como inventario propio con flujo operativo de préstamo

**Fecha:** 2026-05-11
**Estado:** Decidido
**Capa:** Módulo Paralelo Utilería + Vertical Club + Troncal ERP
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto

Hindu Club tiene un vestuarista ("El Miga") que centraliza la utilería
de todas las disciplinas. Los DT, Capitanes y SubCapitanes solicitan
materiales para partidos, entrenamientos, amistosos y torneos. Si algo
no vuelve en 1 semana, se prorratea el costo de reposición entre el
plantel del equipo via cargo adicional a la próxima cuota.

### Decisión

6 tablas principales:
1. `utileria_items` — Catálogo del inventario (únicos o agregados)
2. `utileria_kits` — Plantillas de kit por equipo y tipo evento
3. `utileria_kit_items` — Detalle de items por kit
4. `utileria_solicitudes` — Solicitudes con flujo de 7 estados y snapshot de plantel
5. `utileria_solicitud_items` — Items por solicitud con tracking de cantidades
6. `utileria_cargos_reposicion` — Cargos prorrateados, reversibles

Funciones SQL: `fn_generar_cargos_reposicion` y `fn_reversar_cargo_reposicion`.
Trigger `sync_stock_utileria` mantiene stock sincronizado.

### Alternativas descartadas

1. Usar `productos_servicios` para items + `movimientos_caja` para préstamos —
   no es modelo de venta, es de préstamo.
2. Cargo individual al jugador en lugar de prorrateo — Hindu confirma
   responsabilidad colectiva del plantel.

### Consecuencias

- 6 tablas + 1 bucket storage + 6 atributos + 2 funciones SQL + 1 trigger
- 5 pantallas UI (/admin/utileria/*)
- Cargos reversibles si el item aparece
- Integración futura con emisión de cuotas

---

## PRE-MORTEM Sprint 14j — Utilería

**Fecha:** 2026-05-11
**Capa:** Módulo Paralelo + Vertical + ERP
**Tomado por:** Arquitecto

### Top 3 riesgos

1. **Cargos duplicados al re-marcar no-devuelto** — Mitigación: UNIQUE
   parcial en `utileria_cargos_reposicion(solicitud_item_id) WHERE estado != 'reversado'`.
2. **Cargo a personas no-plantel-de-momento** — Mitigación: snapshot del
   plantel guardado en `utileria_solicitudes.plantel_snapshot`.
3. **Stock desactualizado** — Mitigación: trigger `sync_stock_utileria`
   recalcula en cada INSERT/UPDATE/DELETE de solicitud_items.

---

## ADR-024 — Cuerpo Técnico desde personas_equipos, sin atributos paralelos

**Fecha:** 2026-05-11
**Estado:** Decidido
**Capa:** Vertical Club Deportivo
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto

Los roles de staff en equipos (DT, preparador físico, kinesiólogo, etc.)
se modelaban en dos lugares simultáneamente:
1. `personas_equipos.rol_equipo_slug` (tabla existente con 13 roles en
   `catalogo_roles_equipo`)
2. Atributos paralelos (`deportivo.dt`, `deportivo.capitan`,
   `deportivo.delegado`, `deportivo.preparador_fisico`)

Los atributos duplicaban información ya presente en `personas_equipos` y
no aportaban contexto de equipo (un DT puede dirigir múltiples equipos).

### Decisión

1. **Fuente única:** `personas_equipos.rol_equipo_slug` es la fuente de
   verdad para roles de equipo (deportivos y staff).
2. **Eliminar atributos redundantes:** Se borran los 4 atributos
   `deportivo.*` del catálogo (verificado: 0 asignaciones existentes).
3. **UNIQUE constraint:** Roles de liderazgo único (`dt`, `capitan`,
   `manager`) tienen UNIQUE INDEX parcial por equipo. `subcapitan`
   admite múltiples (caso real: AIF Selección tiene 2).
4. **Vistas SQL:** `v_personas_equipos_vigentes` y `v_cuerpo_tecnico`
   centralizan la lógica de "vigente = activo AND (fecha_fin IS NULL OR
   fecha_fin >= CURRENT_DATE)".
5. **Funciones SQL:** `fn_persona_tiene_rol_equipo` y
   `fn_equipos_donde_puede_solicitar_utileria` reemplazan queries ad-hoc.
6. **UI:** Tab "Cuerpo Técnico" en detalle de equipo + página global
   `/admin/equipos/cuerpo-tecnico`.

### Alternativas descartadas

1. **Mantener atributos como cache** — descartado. Doble fuente de verdad
   sin beneficio real; los queries van directo a `personas_equipos`.
2. **Tabla separada `cuerpo_tecnico`** — descartado. `personas_equipos`
   ya tiene toda la estructura necesaria con `rol_equipo_slug`.

### Consecuencias

- 4 atributos eliminados del catálogo
- `lib/permisos/utileria.ts` refactorizado: usa `fn_equipos_donde_puede_solicitar_utileria` RPC
- 2 vistas + 2 funciones SQL nuevas
- 1 UNIQUE INDEX parcial (dt, capitan, manager por equipo)
- Tab nuevo en equipo detalle + página global

---

## PRE-MORTEM Sprint 14k.5 — Cuerpo Técnico

**Fecha:** 2026-05-11
**Capa:** Vertical Club Deportivo
**Tomado por:** Arquitecto

### Top 3 riesgos

1. **UNIQUE INDEX con CURRENT_DATE en predicate falla por IMMUTABLE** —
   Ya ocurrió. Mitigación: usar `fecha_fin IS NULL` como proxy de
   "vigente sin fecha de fin". Vencimiento por fecha se maneja en views.
2. **Datos existentes violan UNIQUE** — Ya ocurrió: 2 subcapitanes en
   AIF Selección. Mitigación: excluir `subcapitan` del UNIQUE constraint.
3. **RPC `fn_equipos_donde_puede_solicitar_utileria` retorna formato
   inesperado** — Mitigación: cast explícito en TypeScript.

---

- **D-PENDING-06:** Internacionalización (i18n) — postergada.
- **D-PENDING-07:** Acceso de jugadores via app móvil o PWA.
- **D-PENDING-08:** Plan de cuentas estándar argentino como template
  reusable (Sprint 15e).
- **D-PENDING-09:** Conector con Kontrol.ar (cuando exista).
- **D-PENDING-10:** Auth con JWT real con claims de tenant (Sprint 17b).

> **Actualización 2026-05-11 (ADR-031):** Este ADR se redactó cuando se
> usaba la distinción "módulo paralelo / vertical club". A partir de
> ADR-031, todos los módulos están al mismo nivel jerárquico. La referencia
> a "vertical Club" en este ADR se entiende como "módulo equipos" (o el
> módulo correspondiente). Funcionalmente no cambia nada.

---

## ADR-025 — Concesiones como módulo separado del plan de cuentas del tenant

**Fecha:** 2026-05-11
**Estado:** Decidido
**Capa:** Módulo Paralelo + Troncal ERP
**Decisores:** Arquitecto + Yair Levy Wald

### Contexto

Muchos clubes tienen espacios comerciales operados por terceros: kiosko
del vestuario, parrilla del club house, cantina del salón social,
tienda de merchandising, gimnasio independiente. Cada uno es un negocio
del concesionario, no del club.

Hindu tiene como primer caso al vestuarista (El Miga), que opera el
kiosko del vestuario: compra mercadería, vende a socios, cobra a su
MercadoPago personal. Hindu acuerda no cobrarle canon mientras el
arreglo sea informal, pero quiere empezar a cobrar 5% sobre ventas
eventualmente.

El problema: el club necesita visibilidad operativa del negocio
(productos, stock, ventas) sin que esas operaciones impacten su plan
de cuentas. Solo el canon (la comisión mensual) impacta su contabilidad.

### Decisión

Crear módulo `concesiones` con modelo de 6 tablas:

1. `concesionarios` — Persona o entidad que opera N puntos de venta.
   Vinculado a `personas` o `entidades` del sistema. Tiene credenciales
   MP propias (encriptadas) y porcentaje de canon acordado.

2. `concesion_puntos_venta` — Espacios físicos donde el concesionario
   opera. Vinculados a `sedes` del tenant. Un concesionario puede tener
   varios PDV.

3. `concesion_productos` — Catálogo del concesionario (lo que vende:
   bebidas, comida, accesorios). Stock controlado, precios configurables.
   **NO se vincula a `productos_servicios` del club** (modelo separado).

4. `concesion_ventas` — Cada transacción registrada. Genera link de
   pago MP al concesionario directamente. NO genera `movimientos_caja`
   en el plan de cuentas del club.

5. `concesion_venta_items` — Items de cada venta (productos vendidos,
   con cantidad y precio unitario).

6. `concesion_canones` — Cálculo mensual del canon a pagar al club.
   SÍ genera `movimientos_caja` (ingreso del club) y `cuotas_emitidas`
   al concesionario.

### Aislamiento financiero

- **Ventas del concesionario**: registradas operativamente, NO afectan
  plan de cuentas del club. NO se generan `movimientos_caja`.
- **Stock del concesionario**: controlado en `concesion_productos`,
  separado de utilería e inventario del club.
- **Canon mensual**: SÍ genera `movimientos_caja` del club (ingreso
  por concepto "comisiones concesiones") + cuota emitida al
  concesionario que debe pagar al club.

### Alternativas descartadas

1. **Modelar concesionario como producto del club**: descartado. Sus
   ventas no son del club, no deben sumar al plan de cuentas.

2. **No modelar nada y solo registrar el canon manual**: descartado.
   Sin visibilidad operativa, el club no puede auditar el canon
   reportado.

3. **Modelar el concesionario como tenant separado**: descartado.
   Over-engineering. Un concesionario chico no necesita su propio
   tenant; el club quiere visibilidad consolidada.

4. **Compartir tablas con utilería (`utileria_items` mixto con
   productos vendibles)**: descartado. Confunde inventario interno con
   stock de venta. Modelo separado.

### Consecuencias

**Positivas:**
- Aislamiento financiero claro
- Visibilidad operativa para el club
- Escalable a múltiples concesionarios y PDVs
- Habilita cobro automático de canon (con plata real cuando MP esté
  conectado en FASE 7)
- Reutilizable para tenants futuros

**Negativas:**
- Modelo separado (6 tablas + canon)
- Credenciales MP del concesionario en DB (encriptadas)
- En modo mock por default, links de pago simulados

---

## PRE-MORTEM Sprint 14j.2 — Módulo Concesiones

**Fecha:** 2026-05-11
**Capa:** Módulo Paralelo + Troncal ERP
**Duración estimada:** sin estimar (R-PE9 aplica)
**Tomado por:** Arquitecto

### Escenario hipotético

"Hindu intentó usar el módulo de concesiones y algo salió mal. Las
ventas del Miga se mezclaron con el plan de cuentas del club, o el
canon se calculó mal, o las credenciales MP del Miga quedaron expuestas
en logs o queries, o el link de pago se generó pero apuntaba al MP del
club por error."

### Por qué pudo haber fallado

1. **Ventas del concesionario generaron `movimientos_caja` en plan de
   cuentas del club.** Probabilidad: ALTA · Impacto: ALTO
   Mitigación: NO existe ningún hook desde `concesion_ventas` a
   `movimientos_caja`. Las únicas inserciones relacionadas con
   concesiones vienen del cálculo de canon.

2. **Credenciales MP del concesionario expuestas en logs o queries
   públicas.** Probabilidad: MEDIA · Impacto: ALTO
   Mitigación: función `fn_obtener_mp_credenciales` con SECURITY
   DEFINER que registra acceso en `audit_log`.

3. **Stock del concesionario se descuenta dos veces en venta
   concurrente.** Probabilidad: MEDIA · Impacto: MEDIO
   Mitigación: stock manual por ahora; vista para stock efectivo.

4. **Canon se calcula sobre ventas anuladas.**
   Probabilidad: MEDIA · Impacto: MEDIO
   Mitigación: función de cálculo filtra `estado = 'confirmada'`.
   Período de gracia: canon se calcula día 6 del mes siguiente.

5. **Concesionario sin credenciales MP genera link de pago hacia
   ningún lado.** Probabilidad: ALTA · Impacto: BAJO
   Mitigación: si `mp_modo = 'mock'`, retornar link simulado.

6. **Canon falla si concesionario cambió de porcentaje a mitad de
   mes.** Probabilidad: BAJA · Impacto: MEDIO
   Mitigación: snapshot `canon_porcentaje_aplicado` en cada venta.

7. **Sin concesionario activo, las pantallas tiran error 500.**
   Probabilidad: ALTA · Impacto: BAJO
   Mitigación: empty states amigables en todas las pantallas.

### Top 3 riesgos (por prob × impacto)

1. **Ventas del concesionario impactan plan de cuentas del club** →
   NO crear hooks desde `concesion_ventas` a `movimientos_caja`.
2. **Credenciales MP expuestas** → función de acceso con SECURITY
   DEFINER + audit log.
3. **Canon calculado sobre ventas anuladas** → filtro
   `estado = 'confirmada'` + período de gracia de 5 días.

> **Actualización 2026-05-11 (ADR-031):** Este ADR se redactó cuando se
> usaba la distinción "módulo paralelo / vertical club". A partir de
> ADR-031, todos los módulos están al mismo nivel jerárquico. La referencia
> a "módulo paralelo" en este ADR se entiende como "módulo concesiones".
> Funcionalmente no cambia nada.

---

## ADR-026 — Disciplinas como módulo paralelo, no campos de personas
**Fecha:** 2026-05-11
**Estado:** Vigente
**Capa:** Troncal CRM + Vertical Club
**Tomado por:** Arquitecto + Yair

### Contexto
`personas` (tabla troncal CRM) contiene 3 columnas con datos del vertical
Club Deportivo:
- `deporte_principal_slug` TEXT
- `deportes_secundarios` TEXT[]
- `años_practica_deporte_principal` INTEGER

Esta contaminación viola el principio de capas: troncal universal CRM
debe servir a cualquier vertical. A futuro, una persona puede practicar
múltiples disciplinas con vigencia distinta. Aplica el mismo patrón que
ADR-024 (fuente única de verdad en tabla relación con vigencia).

### Decisión
Crear tabla `personas_disciplinas` (capa vertical Club):
- 1:N entre persona y disciplinas que practica
- 1 disciplina marcada `es_principal = true` por persona vigente
- Vigencia con `fecha_inicio` + `fecha_fin`
- `años_practica` por disciplina específica
- `nivel_competencia_slug` opcional

Migrar los registros existentes a la tabla nueva, luego eliminar las 3
columnas viejas de `personas`.

Decisión paralela: agregar `catalogo_atributos.capa` con clasificación
arquitectónica estandarizada (`troncal_crm`, `troncal_erp`,
`troncal_plataforma`, `modulo_paralelo`, `vertical_club`, etc.).

### Alternativas descartadas
- **Postergar a FASE 17:** costo crece exponencialmente con cada sprint.
- **Mantener columnas + tabla paralela:** dualidad de fuentes de verdad.

### Consecuencias
**Positivas:** troncal CRM limpio, disciplinas con vigencia, múltiples
disciplinas por persona, clasificación arquitectónica de atributos.
**Negativas:** refactor de pipeline de importación, refactor de UI ficha,
2 migrations (agregar + dropear).

### Pre-mortem

**Top 3 riesgos:**
1. Pipeline rompe al setear columna dropeada → Update pipeline ANTES de drop.
2. Migración pierde data → Transacción + COUNT validation.
3. UI rompe por columnas faltantes → Refactor componentes ANTES de drop.

**Indicadores de falla:**
- `SELECT COUNT(*) FROM personas_disciplinas WHERE es_principal=true` ≠ cantidad original
- `grep deporte_principal_slug` en código → debe ser 0 antes del DROP

> **Actualización 2026-05-11 (ADR-031):** Este ADR se redactó cuando se
> usaba la distinción "módulo paralelo / vertical club". A partir de
> ADR-031, todos los módulos están al mismo nivel jerárquico. La referencia
> a "Troncal CRM + Vertical Club" en este ADR se entiende como "módulo
> disciplinas". Funcionalmente no cambia nada.

---

## ADR-027 — Cuerpo Tecnico ligado a competencia / entidad organizadora

**Fecha:** 2026-05-11
**Estado:** Aceptado, implementacion pendiente (FASE 5)
**Capa:** Vertical Club Deportivo

### Contexto

Modelo actual: `personas_equipos` tiene (tenant_id, persona_id,
equipo_id, rol_equipo_slug, vigencia). Esto asume que una persona
tiene UN rol en UN equipo durante un periodo.

La realidad operativa de los clubes es mas rica: un mismo "Plantel
Futbol Senior" puede tener distintos cuerpos tecnicos segun en que
competencia juega:

- Plantel Senior en Torneo AIF: DT Juan, Asistente Pedro, Kine Luis
- Plantel Senior en Copa Federal: DT Juan, Asistente Roberto, Kine
  Mariana
- Plantel Senior en Torneo Interno Hindu: DT Carlos (suplente),
  Asistente Pedro

Una persona puede participar en uno o varios equipos y cuerpos
tecnicos simultaneamente, con roles distintos por contexto.

### Decision

En FASE 5 (Competencias, Torneos, Ligas, Federaciones), refactorizar
para soportar la dimension de competencia/entidad organizadora.

**Opciones a evaluar en FASE 5:**

A. Agregar `competencia_id` opcional a `personas_equipos`. Si NULL,
   aplica a "todos los contextos" del equipo (modo simple actual).
   Si tiene valor, aplica solo a esa competencia.

B. Crear tabla nueva `personas_equipos_competencias` (m:m entre
   `personas_equipos` y `competencias`). Mas limpio pero mas tablas.

C. Replantear: `equipos` se vuelve plantel + agregar `formaciones`
   por competencia con su propio cuerpo tecnico. Mas cercano al
   modelo real pero mayor refactor.

Decision especifica se toma en FASE 5 cuando ya tengamos:
- `competencias` y `equipos_competencias` con uso real
- Casos concretos de Hindu en AIF + Copa + Torneo Interno
- Volumen de data que permita evaluar costo de cada opcion

### No implementar ahora

Sprint 14k.7 NO incluye este refactor. La UI de Cuerpo Tecnico que se
construye ahora opera bajo el modelo simple (1 rol por equipo
independiente de competencia) y se extendera en FASE 5.

### Trazabilidad

Cuando se aborde en FASE 5, este ADR se actualiza con la opcion
elegida y se referencia desde el Sprint correspondiente.

---

## ADR-034 — Descripción genérica en personas_lesiones para carga por roles no-médicos

**Fecha:** 2026-05-11
**Estado:** Vigente
**Capa:** Vertical Club Deportivo
**Tomado por:** Code + Arquitecto

### Contexto

La tabla `personas_lesiones` tiene `diagnostico_medico` (campo técnico
para profesionales de salud) y `notas` (campo operativo). Pero los DTs
y staff no-médico necesitan registrar lesiones con una descripción
libre sin llenar campos clínicos.

Sprint 14k.9 descubrió que la columna `descripcion` ya existe en la
tabla pero no estaba mapeada correctamente en la acción
`levantarCasoSalud` (columnas con nombres incorrectos impedían el
INSERT).

### Decisión

- `descripcion` (text, nullable): campo genérico para carga por
  cualquier rol con permiso `puede_ver_lesiones`
- `diagnostico_medico` (text, nullable): campo técnico, solo editable
  por staff médico
- `notas` (text, nullable): campo operativo libre

La acción `levantarCasoSalud` usa `descripcion` como campo principal.
Los campos `diagnostico_medico` y `tratamiento` se llenan después por
personal médico desde la ficha de la persona.

### Consecuencias

- DTs pueden levantar casos desde `/admin/salud` sin conocimiento médico
- El registro inicial tiene tipo + zona + gravedad + descripción libre
- El detalle clínico se completa luego por staff médico

---

## ADR-028 — PIM unificado: productos, servicios y suscripciones bajo un solo catálogo

**Fecha:** 2026-05-11
**Estado:** Aceptado, implementación pendiente (FASE 13)
**Capa:** Troncal PIM
**Tomado por:** Arquitecto

### Contexto

El sistema tiene tres catálogos de "cosas vendibles" que evolucionaron
por separado:
- `productos_servicios` (troncal ERP): productos físicos y servicios
  del club
- `cuotas_planes` (troncal ERP): planes de suscripción recurrente
- `concesion_productos` (módulo concesiones): catálogo del concesionario

Esto genera duplicación de lógica de precios, categorías, stock y
descuentos. A futuro (shop, e-commerce, marketplace) se necesita un
catálogo unificado.

### Decisión

En FASE 13 (PIM — Product Information Management), unificar bajo un
solo catálogo `pim_productos` con `tipo` discriminador:
- `tipo = 'producto'` → item físico con stock
- `tipo = 'servicio'` → sin stock
- `tipo = 'suscripcion'` → recurrente con periodicidad
- `tipo = 'concesion'` → item de concesionario (aislado financieramente)

Tabla `pim_precios` separada con vigencia temporal. Tabla
`pim_categorias` jerárquica. Vista `v_pim_catalogo_activo` como
interfaz principal.

### Alternativas descartadas

1. **Mantener catálogos separados** — descartado a largo plazo. Impide
   shop unificado y reportes cruzados.
2. **Unificar ahora (Sprint 14k.8)** — descartado. Refactor demasiado
   grande para el cierre de FASE 1.

### Consecuencias

FASE 13 incluirá migración de datos de los 3 catálogos al modelo PIM.
Hasta entonces, cada módulo mantiene su catálogo propio sin cambios.

---

## ADR-029 — Dashboard Salud con métricas agregadas y alertas

**Fecha:** 2026-05-11
**Estado:** Aceptado, implementación pendiente (FASE 6)
**Capa:** Vertical Club Deportivo
**Tomado por:** Arquitecto

### Contexto

El módulo Salud actual (ADR-022) es read-only con 7 tabs de listados.
Para operaciones reales del club se necesitan métricas agregadas:
- Lesiones activas por equipo/disciplina
- Certificados médicos próximos a vencer
- Personas sin obra social declarada
- Alertas de menores sin autorización vigente

### Decisión

En FASE 6 (Dashboards Operativos), agregar al módulo Salud:
1. Dashboard con cards de métricas (COUNT queries sobre views existentes)
2. Alertas configurables por umbral (ej: "certificado vence en <30 días")
3. Export CSV por tab (ya preparado en permisos: `puede_exportar`)
4. Integración con `eventos` para notificaciones automáticas de vencimiento

### Alternativas descartadas

1. **Implementar ahora** — descartado. FASE 1 cierra con vista read-only
   funcional. Métricas agregan complejidad sin urgencia operativa.

### Consecuencias

Las views `v_salud_*` ya creadas servirán como base. Se agregarán
funciones SQL de agregación sobre ellas. El modelo de permisos (ADR-022)
ya soporta el nivel de acceso requerido.

---

## ADR-030 — Soft-delete uniforme: `deleted_at` como único mecanismo

**Fecha:** 2026-05-11
**Estado:** Vigente
**Capa:** Plataforma
**Tomado por:** Arquitecto + Code

### Contexto

El sistema usa dos mecanismos de "borrado lógico" inconsistentemente:
- `deleted_at` (timestamptz, nullable): patrón correcto en `personas`,
  `equipos`, y tablas recientes
- `activo` (boolean): patrón legacy en `sedes`, `concesionarios`,
  `cuotas_planes`

Esto causó bugs reales:
- Salud buscaba `.eq('activo', true)` en `personas` (columna inexistente)
- Queries mixtas que filtran por `activo` en unas tablas y `deleted_at`
  en otras

### Decisión

1. **Patrón único:** `deleted_at IS NULL` = activo, `deleted_at IS NOT
   NULL` = borrado lógico. Toda tabla nueva DEBE usar este patrón.
2. **Migración gradual:** tablas con `activo` boolean se migran
   progresivamente (agregar `deleted_at`, poblar, deprecar `activo`).
   No es urgente: se hace tabla por tabla cuando se toca el módulo.
3. **Queries:** usar `.is('deleted_at', null)` en lugar de
   `.eq('activo', true)`. Views SQL usan `WHERE deleted_at IS NULL`.
4. **Función helper:** `fn_soft_delete(table, id)` que setea
   `deleted_at = NOW()` con audit trail.

### Alternativas descartadas

1. **Mantener ambos mecanismos** — descartado. Fuente de bugs demostrada.
2. **Hard delete** — descartado. Violad D12 (soft delete everywhere).
3. **Migrar todo de golpe** — descartado. Demasiadas tablas, riesgo alto.

### Consecuencias

**Positivas:**
- Consistencia en queries
- Un solo patrón para RLS policies
- Timestamp de borrado (cuándo se borró, no solo "está borrado")
- Restore trivial: `UPDATE SET deleted_at = NULL`

**Negativas:**
- Periodo de coexistencia con `activo` en tablas legacy
- Cada migración de tabla requiere verificar todas las queries

---

## ADR-031 — Arquitectura: Troncal + Módulos componibles + Verticales como presets

**Fecha:** 2026-05-11
**Estado:** Aceptado
**Capa:** Sistema entero
**Tomado por:** Arquitecto

### Contexto

ClubCore se planteó originalmente como SaaS multi-tenant para clubes
deportivos. La visión real es más amplia: plataforma abierta sobre la cual
cualquier organización (club, country, federación, polo educativo, gimnasio,
retail) puede operar, con un núcleo común (troncal) y un set componible de
módulos.

Los módulos pueden ser:
- Built-in: construidos por nosotros (salud, equipos, concesiones...)
- Third-party adapter: conectores a software existente (Zoho CRM, SAP, HubSpot)
- Custom: que el propio cliente o un dev externo construye

### Decisión

Adoptar arquitectura de tres capas:

**Capa 1 — Troncal universal (obligatorio, siempre activo)**

Sirve a cualquier tenant. Concepto cargado UNA SOLA VEZ.
Sub-capas: CRM (personas, entidades, padrones, import),
ERP (productos, cuotas, cajas, plan_cuentas),
Plataforma (tenants, sedes, audit, API keys, módulos).

**Capa 2 — Módulos (componibles, activables por tenant)**

Todos los módulos al mismo nivel jerárquico. Cada uno es self-contained,
declara su contrato (module.json), es portable y reemplazable por adapters
externos. Hay 18 módulos built-in.

**Capa 3 — Verticales (presets de combinación de módulos)**

Un vertical no es código: es metadata que define qué módulos se activan
por default al onboarding de un tenant de ese tipo.

Verticales canónicos: club_deportivo, country_deportivo, federacion_hub,
polo_educativo, gym_studio (futuro), retail_b2b (futuro).

### Principios derivados (no negociables)

1. Una sola fuente de verdad por concepto (troncal lo posee)
2. Módulos portables: copiar carpeta = mover módulo
3. Comunicación entre módulos solo via eventos o API pública
4. Verticales son metadata, no código
5. Reemplazabilidad por adapters externos
6. Schema enforcement automático (sin esto el sistema degrada a monolito)

### Consecuencias

- Sprint 15a: manifiestos, ADRs, schema audit, datos DB, MDs actualizados
- Sprint 15b: migración física a /modules/<slug>/, tests E2E
- FASE 11: API pública + sistema de eventos
- FASE 13: marketplace + SDK custom modules

---

## ADR-032 — Visión Plataforma Abierta

**Fecha:** 2026-05-11
**Estado:** Aceptado como destino, construcción gradual
**Capa:** Sistema entero — largo plazo
**Tomado por:** Arquitecto

### Decisión

ClubCore evoluciona hacia plataforma abierta con:
- API REST + GraphQL pública sobre troncal con auth per-tenant (FASE 11)
- Bus de eventos para comunicación inter-módulos (FASE 11)
- Webhooks bidireccionales con sistemas externos (FASE 11)
- Adapter pattern para reemplazar módulos built-in por third-party (FASE 11+)
- Marketplace UI para descubrir e instalar módulos (FASE 13)
- SDK para que devs externos construyan módulos custom (FASE 13+)

### Hoy

Adoptamos los principios y la estructura física que hacen viable esa
construcción gradual. No construimos las capas avanzadas todavía, pero
toda decisión arquitectónica las contempla como destino.

### Reglas que aseguran la viabilidad

- Cada módulo declara module.json con contrato (qué lee, escribe, emite,
  consume, requiere)
- Tablas con prefijo de módulo o listadas explícitamente en owns_tables
- Módulos no se importan entre sí directamente
- Troncal no depende de módulos
- ESLint enforce reglas de acoplamiento

---

## ADR-033 — E2E Tests obligatorios como criterio de cierre de sprint

**Fecha:** 2026-05-11
**Estado:** Aceptado
**Capa:** Calidad / proceso
**Tomado por:** Arquitecto

### Contexto

Sprints 14k.7, 14k.8 y 14k.9 cerraron con "build green" pero introdujeron
bugs en runtime que se descubrieron solo al testear manualmente en producción.
"Build green" no es métrica suficiente.

### Decisión

A partir de Sprint 15b, ningún sprint cierra sin:
1. Build verde
2. ESLint sin errores
3. Tests E2E pasando para los flows afectados por el sprint
4. Smoke test manual de Yair en producción con checklist firmado

Si un sprint construye o modifica una pantalla, debe agregar/actualizar
el test E2E correspondiente.

### Stack

- Playwright para tests E2E
- Carpeta /tests/e2e/<modulo>/ con un .spec.ts por flujo crítico
- CI bloquea merge si tests fallan

---

## Convenciones de este documento

- Los ADRs son **inmutables** una vez publicados. Si una decisión cambia,
  se crea un ADR nuevo que supera al anterior.
- Numeración correlativa (ADR-001, ADR-002, ...) sin saltos.
- Code agrega ADRs técnicos al final del sprint (formato R-PE6 de
  PROMPT-ENVELOPE.md).
- Arquitecto revisa ADRs de Code antes de cerrar sprint.
