# ClubCore — Prompt Envelope

> Estructura obligatoria de cada solicitud técnica a Code y formato de
> respuesta esperado. Esto es lo que conecta la documentación viva con la
> ejecución real.
>
> Mantenido por el arquitecto.
>
> Última actualización: 10 de mayo de 2026.

---

## 1. Propósito

Cada solicitud a Code tiene 3 partes:

    ┌────────────────────────────────────┐
    │  HEADER (fijo, igual siempre)      │  ← contexto + reglas
    ├────────────────────────────────────┤
    │  BODY (variable, por sprint)       │  ← spec del cambio
    ├────────────────────────────────────┤
    │  FOOTER (fijo, igual siempre)      │  ← criterios + cierre
    └────────────────────────────────────┘

El **HEADER** asegura que Code arranque cada sesión con el contexto correcto
del proyecto. El **BODY** es el spec específico del sprint. El **FOOTER**
asegura que Code cierre cada sesión actualizando la documentación viva.

Sin envelope, Code trabaja a ciegas y la documentación se desincroniza.

---

## 2. HEADER — fijo, copiar tal cual

    ═══════════════════════════════════════════════════════════════════
    CONTEXTO OBLIGATORIO — LEER ANTES DE EMPEZAR
    ═══════════════════════════════════════════════════════════════════
    Antes de tocar código, leé EN ESTE ORDEN:

    1. /docs/MASTER-PROJECT.md       (visión, capas, decisiones marco)
    2. /docs/ARCHITECTURE.md         (convenciones, patrones, anti-patrones)
    3. /docs/CURRENT-STATE.md        (estado real del proyecto hoy)
    4. /docs/SPRINT-PLAN.md          (sprint actual + próximos)
    5. /docs/GLOSSARY.md             (términos de dominio)
    6. /docs/ROADMAP.md              (roadmap por fases, sin fechas)

    Si alguno de esos archivos no existe o está vacío, parar y avisar.
    ═══════════════════════════════════════════════════════════════════
    DECLARACIÓN DE CAPA — RESPONDÉ ANTES DE EMPEZAR
    ═══════════════════════════════════════════════════════════════════
    Confirmá explícitamente:

    CAPA que toca este sprint:
      [ ] Troncal CRM
      [ ] Troncal ERP
      [ ] Troncal PIM
      [ ] Vertical Club Deportivo
      [ ] Módulo Paralelo (RRHH / Salud / Otro)
      [ ] Plataforma (multi-tenant, auth, importadores, API)
      [ ] Mixto (especificar)

    CONTEXTO: en 2-3 líneas, qué entendiste que vamos a hacer.

    CONFIRMACIÓN: declarás que vas a respetar:
    - Regla R-MT4 (no Hindu en código)
    - Regla R-MT1, R-MT2, R-MT3 (multi-tenant disciplinado)
    - Anti-patrones A1-A10 de ARCHITECTURE.md §14
    - Convenciones de naming de ARCHITECTURE.md §5

    Si el sprint rompe alguna convención de ARCHITECTURE.md, PARÁ y consultá
    al arquitecto antes de empezar.
    ═══════════════════════════════════════════════════════════════════

---

## 3. BODY — variable por sprint

El body tiene una estructura fija interna. Cada sprint completa estas
secciones:

    ═══════════════════════════════════════════════════════════════════
    SPRINT <NUMERO> — <NOMBRE CORTO>
    ═══════════════════════════════════════════════════════════════════

    OBJETIVO
    [1-2 líneas: qué queremos lograr en términos de negocio]

    ALCANCE
    [Lista corta de qué entra. Marcar explícitamente qué NO entra]

    DEPENDENCIAS
    [Qué tiene que estar previo. Si nada, decir "ninguna"]

    ═══════════════════════════════════════════════════════════════════
    PARTE 1 — <NOMBRE>
    ═══════════════════════════════════════════════════════════════════
    [Detalle técnico de la parte 1]

    ═══════════════════════════════════════════════════════════════════
    PARTE 2 — <NOMBRE>
    ═══════════════════════════════════════════════════════════════════
    [Detalle técnico de la parte 2]

    ...

    ═══════════════════════════════════════════════════════════════════
    CRITERIOS DE ACEPTACIÓN
    ═══════════════════════════════════════════════════════════════════
    1. [Criterio verificable, idealmente con query SQL o test manual]
    ...
    N. Build pasa sin warnings.
    N+1. Vercel deploy OK.
    N+2. /docs/CURRENT-STATE.md actualizado con cambios.

    ═══════════════════════════════════════════════════════════════════
    NO ESTÁ EN ESTE SPRINT
    ═══════════════════════════════════════════════════════════════════
    [Lista de cosas que el spec deliberadamente NO incluye, para que Code no
    se desvíe. Si Code piensa que algo de acá hace falta, parar y consultar]

---

## 4. FOOTER — fijo, copiar tal cual

    ═══════════════════════════════════════════════════════════════════
    CIERRE DE SPRINT — AL TERMINAR
    ═══════════════════════════════════════════════════════════════════

    ACTUALIZACIONES DE DOCS VIVOS (obligatorio):
    - /docs/CURRENT-STATE.md → agregar las tablas/rutas/actions nuevas o
      modificadas. Si hay tablas nuevas, indicar capa de pertenencia.
    - /docs/DECISIONS.md → agregar entrada si tomaste una decisión técnica
      nueva (formato: ADR mínimo con fecha, contexto, decisión, alternativas
      descartadas).

    NO MODIFIQUES SIN APROBACIÓN:
    - /docs/MASTER-PROJECT.md
    - /docs/ARCHITECTURE.md
    - /docs/SPRINT-PLAN.md
    - /docs/PROMPT-ENVELOPE.md
    - /docs/GLOSSARY.md
    Si necesitás cambiar alguno, parar y consultar.

    COMMIT:
    - Mensaje: "feat(<modulo>): <descripción> (Sprint <N>)"
      o "fix(<modulo>): ..." según corresponda
    - Si hay migration: incluir nombre del archivo de migration en el commit
    - Pushear a main

    VERCEL DEPLOY:
    - Verificar que el deploy haya pasado a READY antes de avisar.

    AVISO AL ARQUITECTO:
    Respondé en el chat con esta estructura:

    ─────────────────────────────────────────
    Sprint <N> — <nombre>: COMPLETADO

    COMMIT: <hash>
    DEPLOY: <deployment_id> READY

    CAMBIOS APLICADOS:
    - DB: [migrations aplicadas, en líneas]
    - Código: [archivos creados/modificados/eliminados, agrupados por capa]
    - Docs: [archivos actualizados en /docs/]

    PARA VALIDAR VISUALMENTE:
    - [Pantalla 1: URL + qué chequear]
    - [Pantalla 2: ...]

    PARA VALIDAR POR SQL (sugeridas):
    - <query 1>
    - <query 2>

    NOTAS / DECISIONES TOMADAS:
    - [Si tomaste alguna decisión técnica que no estaba en el spec, decirlo]

    PENDIENTES O RIESGOS DETECTADOS:
    - [Cosas que dejaste para sprint siguiente, o riesgos que viste]
    ─────────────────────────────────────────

    ═══════════════════════════════════════════════════════════════════

---

## 5. Reglas operativas para Code

### R-PE1 — Cero implementación sin contexto leído

Si el HEADER no se respeta (no leíste los docs vivos), no se puede arrancar.
Es la regla número uno.

### R-PE2 — Cero implementación sin declarar capa

Antes de tocar código, Code declara la capa que toca. Si está en duda, pregunta.

### R-PE3 — Pará y consultá ante cambios estructurales

Code para y consulta al arquitecto si durante el sprint detecta que:
- Necesita crear una tabla no contemplada en el spec
- Necesita cambiar un modelo existente (agregar columnas a tablas core)
- Detecta que el spec rompe una convención de ARCHITECTURE.md
- Encuentra contradicción entre el spec y MASTER-PROJECT.md o CURRENT-STATE.md
- Le falta información para decidir sin asumir

Mejor parar 10 minutos que ejecutar mal y revertir.

### R-PE4 — Idempotencia en migrations

Toda migration que se aplica debe ser idempotente o tener flag de "ya
ejecutada". Si la migration tiene `CREATE TABLE`, usar `IF NOT EXISTS`.
Si tiene `INSERT INTO` de seeds, usar `ON CONFLICT DO NOTHING` o `WHERE NOT
EXISTS`.

### R-PE5 — Build verde es requisito

No se cierra un sprint con build roto. Si el build no pasa, no se pushea.

### R-PE6 — CURRENT-STATE.md siempre actualizado

Code es responsable de mantener `CURRENT-STATE.md` sincronizado con la
realidad del repo + DB. Si el archivo está desactualizado al final de un
sprint, el sprint no está cerrado.

### R-PE7 — Comunicación asíncrona estructurada

Mensajes a Yair siguen el formato del punto 4 (CIERRE DE SPRINT). Sin
formato libre. Sin "todo OK!" sin detalle.

### R-PE8 — Lectura de docs vivos completa

Code lee TODOS los docs listados en CLAUDE.md §instrucciones antes de
arrancar cualquier sprint. Si un doc no existe o está vacío, Code lo
reporta al arquitecto. No se arranca con contexto parcial.

### R-PE9 — Pre-mortem obligatorio para sprints de alto riesgo

Antes de arrancar implementación, el arquitecto realiza un pre-mortem
documentado cuando el sprint cumple AL MENOS UNA de:

- Duración estimada > 3 días
- Toca capa Plataforma (auth, multi-tenant, imports, API)
- Introduce integración externa (Resend, MercadoPago, etc.)
- Refactor que afecta > 50 archivos
- Riesgo de regresión visual o de datos crítica
- Operaciones sobre datos productivos de un tenant activo

El pre-mortem se publica como entrada en DECISIONS.md con la plantilla
del §7 — Caso D ANTES de pegar el spec a Code. Code lo lee como parte
del HEADER del sprint y aplica las mitigaciones obligatorias.

Para sprints menores (bug fix, feature acotada < 3 días, capa no
crítica) el pre-mortem se omite.

Code no puede arrancar un sprint que requiere pre-mortem si el
pre-mortem no está publicado.

---

## 6. Ejemplo completo — un pedido envuelto

Asumiendo Sprint 14e (Suscripciones + plan Fondo Fútbol):

    ═══════════════════════════════════════════════════════════════════
    CONTEXTO OBLIGATORIO — LEER ANTES DE EMPEZAR
    ═══════════════════════════════════════════════════════════════════
    Antes de tocar código, leé EN ESTE ORDEN:

    1. /docs/MASTER-PROJECT.md
    2. /docs/ARCHITECTURE.md
    3. /docs/CURRENT-STATE.md
    4. /docs/SPRINT-PLAN.md
    5. /docs/GLOSSARY.md

    ═══════════════════════════════════════════════════════════════════
    DECLARACIÓN DE CAPA — RESPONDÉ ANTES DE EMPEZAR
    ═══════════════════════════════════════════════════════════════════
    Confirmá:
    - CAPA: Troncal ERP (creamos tabla suscripciones y modificamos pipeline)
    - CONTEXTO: vamos a modelar persona ↔ plan ↔ vigencia para que el padrón
      de suscriptores aplique impacto financiero real.
    - CONFIRMACIÓN: respetás R-MT1 a R-MT5 + anti-patrones A1-A10.

    ═══════════════════════════════════════════════════════════════════
    SPRINT 14e — Suscripciones + plan Fondo Fútbol 2026
    ═══════════════════════════════════════════════════════════════════

    OBJETIVO
    Hindu Club debe poder generar cuotas mensuales del Fondo Fútbol contra
    los 57 suscriptores cargados en Sprint 14c.2.

    ALCANCE
    - Tabla suscripciones
    - Producto "Fondo Fútbol 2026" en productos_servicios
    - Plan en cuotas_planes referenciando el producto
    - Modificar pipeline suscriptores_por_equipo para crear row en suscripciones
    - UI mínima para ver suscripciones activas por persona

    DEPENDENCIAS
    - 14c.2 aplicado (padrón Suscriptores con 57 personas y atributo suscriptor)

    ═══════════════════════════════════════════════════════════════════
    PARTE 1 — MIGRATION
    ═══════════════════════════════════════════════════════════════════
    [... spec técnico detallado ...]

    ═══════════════════════════════════════════════════════════════════
    CRITERIOS DE ACEPTACIÓN
    ═══════════════════════════════════════════════════════════════════
    1. Tabla suscripciones existe con RLS habilitada.
    2. Producto "Fondo Fútbol 2026" cargado en productos_servicios.
    3. Plan cargado en cuotas_planes apuntando al producto.
    4. Pipeline suscriptores_por_equipo modificado: al aplicar run, también
       inserta row en suscripciones.
    5. Re-aplicar el run existente del padrón Suscriptores crea las 57
       suscripciones.
    6. UI: en ficha de persona, tab "Suscripciones" muestra las activas.
    7. Build pasa.
    8. /docs/CURRENT-STATE.md actualizado.

    ═══════════════════════════════════════════════════════════════════
    NO ESTÁ EN ESTE SPRINT
    ═══════════════════════════════════════════════════════════════════
    - Emisión real de cuotas (eso es 14e parte 2 o 14f)
    - Cobranza
    - MercadoPago
    - Reportes financieros

    ═══════════════════════════════════════════════════════════════════
    CIERRE DE SPRINT — AL TERMINAR
    ═══════════════════════════════════════════════════════════════════
    [... footer fijo, ver §4 ...]

---

## 7. Casos especiales

### Caso A — Bug fix puntual (no sprint completo)

Para fixes pequeños (1-3 archivos, sin tablas nuevas), envelope reducido:

    HEADER reducido:
    "Bug fix sobre X. Leé CURRENT-STATE.md sección Y antes de tocar.
    Capa afectada: Z. Confirmá que el fix no rompe convenciones."

    BODY: descripción del bug + reproducción + fix esperado

    FOOTER reducido:
    "Avisá con commit hash + deploy + lo que validaste."

No requiere actualizar CURRENT-STATE.md si el modelo no cambia.

### Caso B — Investigación / spike

Para tareas exploratorias sin código de producción:

    HEADER:
    "Tarea exploratoria. Leé MASTER-PROJECT.md y ARCHITECTURE.md.
    NO toques código de producción. Solo escribís reporte."

    BODY: pregunta a investigar

    FOOTER:
    "Devolvé reporte en este formato:
    1. Hallazgos
    2. Opciones evaluadas
    3. Recomendación
    4. Riesgos"

### Caso C — Spike que se convierte en sprint

Si durante una exploración aparece que hay que implementar algo, parar y
volver al flujo normal con envelope completo.

### Caso D — Pre-mortem antes de sprint de alto riesgo

Cuando aplica R-PE9, el arquitecto publica este bloque en DECISIONS.md
ANTES de pegar el spec del sprint a Code.

**Plantilla:**

```
## PRE-MORTEM Sprint <N> — <nombre>
**Fecha:** YYYY-MM-DD
**Capa:** <capa>
**Duración estimada:** <días>
**Tomado por:** Arquitecto

### Escenario hipotético
"Estamos a 1 semana del cierre y el sprint FALLÓ. <descripción de
cómo se ve el fracaso>"

### Por qué pudo haber fallado

1. **<razón concreta>**
   Probabilidad: ALTA / MEDIA / BAJA · Impacto: ALTO / MEDIO / BAJO
   <explicación breve>
   Mitigación: <acción concreta>

2. **<razón concreta>**
   [...]

(mínimo 5, ideal 8-12)

### Top 3 riesgos (por prob × impacto)

1. **<riesgo más crítico>** → Mitigación obligatoria: <acción>
2. **<segundo>** → Mitigación obligatoria: <acción>
3. **<tercero>** → Mitigación obligatoria: <acción>

### Ajustes al spec del sprint
<Qué se cambió en el alcance o en el plan basado en este pre-mortem.
Los criterios de aceptación se actualizan para incluir las
mitigaciones.>

### Indicadores tempranos de falla
<Qué señales miramos durante la ejecución que indicarían que estamos
yendo hacia el escenario hipotético. Cuándo dispara cada alerta.>
```

Code lee este pre-mortem como parte del HEADER del sprint y aplica
todas las mitigaciones obligatorias en su implementación. Si durante
el sprint aparece un indicador temprano de falla, Code para y consulta.

---

## 8. Anti-patrones del envelope

### AE1 — Pedidos sin envelope

Solicitudes en lenguaje libre sin estructura. Genera improvisación y desync.

### AE2 — Body sin "NO ESTÁ EN ESTE SPRINT"

Si no decís qué NO está, Code va a inventar features que no se pidieron.

### AE3 — Criterios de aceptación blandos

"Que funcione bien" no es criterio. Tiene que ser verificable (query SQL,
test manual con pasos, métrica concreta).

### AE4 — Code respondiendo "todo OK" sin detalle

La respuesta debe seguir la estructura del §4. Si Yair tiene que preguntar
"qué cambió?", el sprint no está cerrado.

### AE5 — Saltarse el HEADER "porque ya leíste antes"

Cada sesión es independiente. Code puede tener contexto fresco o no. El
HEADER se aplica siempre.

---

## 9. Versionado del envelope

Si en algún momento hay que cambiar la estructura del envelope, se actualiza
este documento con bump de versión + nota en DECISIONS.md.

Versión actual: **1.0** (10 may 2026)
