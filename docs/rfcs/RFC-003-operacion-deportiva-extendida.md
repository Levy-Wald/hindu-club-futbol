# RFC-003 — Operación deportiva extendida (FASE 6)

**Estado:** Aprobado (12-may-2026)
**Fecha:** 12 de mayo de 2026
**Autor:** Arquitecto (Claude Opus) basado en 7 decisiones de producto de Yair
**Aplica a:** ClubCore v2 — FASE 6 + satélites en FASE 11/16
**Depende de:** FASE 3 (Operación deportiva), FASE 4 (Planificadores), FASE 5 (Competencias)

---

## 1. Resumen ejecutivo

Hindu (y futuros tenants) necesitan profundizar la operación deportiva más allá de lo táctico-competitivo construido en FASE 3-5:

- **Trackear lesiones** de jugadores con notificación automática al CT y bloqueo visual (no automático) en convocatorias.
- **Hacer scouting** de jugadores propios (inferiores que pueden subir) y externos (potenciales fichajes desde otros clubes), con evaluación multidimensional (11 dimensiones).
- **Tener trayectoria completa** de cada jugador: clubes anteriores, categorías por año, premios, lesiones históricas, asistencias, cuotas pagadas — todo visible como timeline.
- **Generar reportes deportivos** (rankings de goleadores, comparativos por categoría, stats por jugador) en 3 formatos: dashboard online, PDF descargable, Excel manipulable.

**Hallazgo crítico al armar este RFC:** las 5 tablas que FASE 6 necesita **ya existen en la DB**, todas vacías. Es el mismo patrón del Sprint 2.5 (preferencias_comunicación). FASE 6 NO crea infraestructura mayor — wirea lo existente, agrega atributos al troncal personas, y construye UIs + flujos.

Estimación total: ~17-22h Code distribuidas en 4 sprints (vs ~35h si se construyera desde cero).

---

## 2. Principios rectores

### 2.1 Principio TODO es persona (canonizado como D64 → elevado a principio rector)

Origen: respuesta de Yair el 12-may-2026:

> "todos son personas, en todos los casos siempre se crea una persona, y sobre esa persona se habilitan más campos de acuerdo al módulo donde estemos. es la única forma que sea modular el sistema e independiente cada módulo contra el troncal"

**Interpretación operativa:** ningún módulo crea entidades paralelas a personas. Cualquier "perfil", "ficha", "candidato", "prospect", "observado" es UNA persona troncal con:

- Atributos del módulo correspondiente en `personas_atributos` (vía `catalogo_atributos`)
- Datos extra en tablas relacionales que cuelgan de `persona_id`
- Nunca columnas duplicadas con `personas`

**Consecuencias para FASE 6:**

- Un "scouting observado" = persona con atributo `scouting.observado` + fila en `scouting_fichas` (extensión)
- Un "rival lesionado" (si lo trackeamos) = persona con atributo `nominas_externas.activo` + fila en `personas_lesiones`
- Un "médico del club" = persona con atributo `salud.medico` + permisos correspondientes

**El sistema es 100% aditivo.** Una persona puede tener simultáneamente `equipos.dt` + `scouting.scout` + `salud.medico`. Roles no se excluyen.

### 2.2 Principio "todas las opciones" (heredado del RFC-002)

Cada función crítica de FASE 6 tiene múltiples vías de input/output. Se entregan progresivamente según factibilidad:

| Función | Vías canonizadas | Cuándo |
|---|---|---|
| Carga de lesiones | Manual / Por médico / Por kinesiólogo / App tercera / CSV / PDF | Manual+por rol en 6.1, integraciones en FASE 11 |
| Carga de scouting | Manual / Fichaje externo / Persona ya existente promovida | Todas en 6.2 |
| Trayectoria | Carga manual completa / Carga incremental por temporada / Sync federación | Manual+incremental en 6.3, sync en FASE 11 |
| Reportes | Dashboard / PDF / Excel | Las 3 en 6.4 |
| Stats avanzadas | Básicas calculadas / Mock con tag visual / Servicio real | Básicas en 6.4, real en FASE 11/16 |

---

## 3. Modelo de datos

### 3.1 Tablas existentes que se reutilizan (TODAS vacías hoy, listas para wirear)

| Tabla | Columnas listas | Sprint que la activa |
|---|---|---|
| `personas_lesiones` | 19 cols: tipo_lesion, zona_corporal, gravedad, fecha_inicio, fecha_alta_medica, recuperada, restriccion_actividad, archivo_estudio_url, diagnostico_medico, tratamiento, notas, descripcion | 6.1 |
| `scouting_fichas` | 17 cols: nombre, apellido, fecha_nacimiento, posicion, club_actual, contacto, estado, observaciones, evaluacion, persona_id, scout_id | 6.2 |
| `personas_clubes_anteriores` | 13 cols: club_nombre, deporte_slug, año_desde, año_hasta, categoria, observaciones | 6.3 |
| `personas_historial_categoria_deportiva` | 9 cols: año, disciplina_slug, categoria_display, equipo_id, observacion | 6.3 |
| `personas_premios_logros` | 14 cols: premio_titulo, año, deporte_slug, lugar_obtenido, organizacion_otorgante, archivo_certificado_url, observaciones | 6.3 |

**Vistas existentes que se reutilizan en 6.4 (reportes):**

- `v_salud_lesiones`, `v_salud_alertas_faltantes`, `v_salud_autorizaciones`, `v_salud_datos_medicos`

### 3.2 Tabla nueva que se crea (única en FASE 6)

**`scouting_evaluaciones`** — Modela las 11 dimensiones de evaluación de scouting de manera relacional, permitiendo:

- Múltiples evaluaciones de la misma persona a lo largo del tiempo (track de evolución)
- Trackeo de quién evaluó cada dimensión (`scout_id`)
- Filtros y rankings eficientes por dimensión (ADR-037 cumplido: columna nativa indexable, no metadata jsonb)
- Stats agregadas por dimensión

```sql
scouting_evaluaciones (
  id uuid PK,
  tenant_id uuid NOT NULL FK,
  persona_id uuid NOT NULL FK,         -- la persona evaluada
  scout_id uuid NOT NULL FK,           -- quien evaluó
  dimension text NOT NULL CHECK IN (
    'como_juega', 'tecnica', 'tactica', 'habilidades_extra',
    'destreza_motriz', 'inteligencia_juego',
    'relacion_grupo', 'relacion_ct', 'relacion_rival',
    'relacion_arbitro', 'relacion_socios'
  ),
  valor int NOT NULL CHECK BETWEEN 1 AND 10,
  observacion text,
  fecha_evaluacion date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb,
  created_at, updated_at, deleted_at
)
```

Una persona en scouting puede tener N evaluaciones en cada dimensión a lo largo del tiempo. La última activa es la vigente.

### 3.3 Atributos nuevos en `catalogo_atributos` (creados en sprints respectivos)

| Slug | Categoría | Sprint | Para qué |
|---|---|---|---|
| `salud.medico` | operativo | 6.1 | Permiso para cargar/editar lesiones |
| `salud.kinesiologo` | operativo | 6.1 | Idem |
| `salud.cargador` | operativo | 6.1 | Carga genérica (DT, jugador autoreporte) |
| `scouting.scout` | operativo | 6.2 | Permiso para ver/editar fichas + evaluar |
| `scouting.observado` | persona | 6.2 | Marca persona como observada por scouting (todavía no fichada) |
| `historial.cargador` | operativo | 6.3 | Permiso para cargar trayectoria de otros |
| `reportes.lector` | operativo | 6.4 | Permiso para ver reportes deportivos |

### 3.4 Extensiones menores a tablas existentes

- `personas_lesiones`: agregar índice `idx_personas_lesiones_activas` WHERE `recuperada=false AND deleted_at IS NULL` para query rápida de "jugadores lesionados hoy" en convocatorias.
- `personas_premios_logros`: ya tiene `archivo_certificado_url` — solo wirear bucket de Supabase Storage para uploads.

**NO se crean otras tablas en FASE 6.**

---

## 4. Roadmap secuenciado

### 4.1 FASE 6 core (4 sprints)

| # | Sprint | Foco | Estimación | Estado |
|---|---|---|---|---|
| 6.1 | **Lesiones operativas** | Activación `personas_lesiones` + UI registro + notificación a CT/capitán/delegados + indicador visual en convocatorias + import CSV mock + 3 atributos `salud.*` | 4-5h | Pendiente |
| 6.2 | **Historial + Trayectoria** | Activación 3 tablas historial + UI carga manual + timeline visual `/admin/personas/[id]/trayectoria` + atributo `historial.cargador` | 3-4h | Pendiente |
| 6.3 | **Scouting operativo** | Activación `scouting_fichas` (extensión persona) + tabla nueva `scouting_evaluaciones` + UI ficha completa + 11 dimensiones + workflow estados + 2 atributos `scouting.*` | 5-6h | Pendiente |
| 6.4 | **Reportes deportivos** | Vistas SQL nuevas + dashboard online + generación PDF (libs: jsPDF o Puppeteer) + Excel (SheetJS) + 3 reportes mínimos: goleadores, asistencias por categoría, stats jugador | 5-7h | Pendiente |

**Total FASE 6 core:** ~17-22h Code.

**Orden ejecutado y razón:** 6.1 → 6.2 → 6.3 → 6.4

- 6.1 primero: impacta operación inmediata (DT necesita ver quién está lesionado en próxima convocatoria)
- 6.2 segundo: carga estática base que después alimenta scouting (historial de jugadores) y reportes
- 6.3 tercero: workflow más complejo, se beneficia del timeline de trayectoria ya armado
- 6.4 último: necesita data cargada de los otros 3 sprints

### 4.2 Satélites FASE 11 / FASE 16

| # | Satélite | Depende de | Cuándo |
|---|---|---|---|
| 6.5 | Import masivo de lesiones via CSV/PDF/API | 6.1 | FASE 11 |
| 6.6 | Stats avanzadas reales (xG, mapas de calor, posesión) | 6.4 + 5.6 | FASE 11 o FASE 16 |
| 6.7 | Sync historial automático con federaciones | 6.2 | FASE 11 |
| 6.8 | App externa para autoreporte de lesiones (jugador desde móvil) | 6.1 + FASE 10 (WhatsApp) o FASE 12 (portal del socio) | FASE 12+ |

---

## 5. Decisiones canonizadas (D61-D75)

### Producto (decididas por Yair el 12-may-2026)

**D61** — Lesiones se cargan por todas las vías (jugador, médico, kinesiólogo, app tercera, CSV, PDF). Vías se entregan progresivamente. Manual+rol en 6.1, resto en FASE 11.

**D62** — Lesión NO bloquea automáticamente convocatoria. Notifica al DT, cuerpo técnico, capitán y delegados. El DT ve indicador visual "LESIONADO" en la lista de convocatoria pero decide si convocarlo. La decisión es humana, nunca automatizada.

**D63** — Scouting cubre dos casos: jugadores internos (inferiores que pueden subir a Primera) y jugadores externos (potenciales fichajes desde otros clubes). Mismo flujo y modelo para ambos. La diferencia es semántica, no técnica.

**D64** — TODO es una persona. Sin excepciones. Cualquier "ficha", "candidato", "observado", "rival", "perfil" se materializa como persona troncal + atributos. Este principio se eleva a rector del RFC-003 y se aplica retroactivamente a interpretar el resto del proyecto. **Es la base de la modularidad del sistema.**

**D65** — Scouting tiene evaluación multidimensional con 11 dimensiones definidas por Yair: cómo juega, técnica, táctica, habilidades extra, destreza motriz, inteligencia para el juego, relación con grupo / CT / rival / árbitro / socios. Cada dimensión se evalúa de 1 a 10.

**D66** — Trayectoria del jugador se visualiza como timeline con stats. Pantalla dedicada `/admin/personas/[id]/trayectoria` que une 5 fuentes: clubes anteriores, categorías por año, premios, lesiones históricas, y asistencias/cuotas.

**D67** — Reportes deportivos entregan 3 formatos por igual: dashboard online (queryable, filtros, interactivo), PDF descargable (compartible vía mail/WhatsApp), Excel manipulable (para análisis por el dueño/CT).

### Técnica (Arquitecto)

**D68** — Lesiones disparan notificación automática vía módulo `comunicaciones_masivas` con `categoria_contenido='transaccional'` (no respeta opt-out, es obligatoria por su naturaleza operativa). Destinatarios: personas con atributos `equipos.dt`, `equipos.asistente`, `equipos.preparador_fisico`, `equipos.medico`, `equipos.kinesiologo`, `equipos.delegado`, y la persona con `es_capitan=true` en el `personas_equipos` del equipo del lesionado.

**D69** — El sistema de atributos es ADITIVO. Una persona puede tener simultáneamente `equipos.dt` + `scouting.scout` + `salud.medico`. Los roles nunca se excluyen mutuamente. Permisos se computan por OR sobre todos los atributos activos de la persona.

**D70** — Indicador visual "LESIONADO" en convocatoria se implementa en módulo asistencias (existente) leyendo `personas_lesiones.recuperada=false AND deleted_at IS NULL`. La query se ejecuta on-demand al renderizar la lista; no requiere caché.

**D71** — Scouting agrega atributo `scouting.observado` a la persona troncal (no a `scouting_fichas`). La tabla `scouting_fichas` queda como "datos adicionales del módulo scouting sobre la persona" (extensión 1:1 vinculada por `persona_id`).

**D72** — Evaluaciones de scouting viven en tabla relacional `scouting_evaluaciones` (NO en `metadata jsonb` de `scouting_fichas`). Razón: cumple ADR-037 (data filtrable en columnas nativas indexables). Permite múltiples evaluaciones temporales por persona+dimensión y ranking eficiente.

**D73** — Trayectoria visual = pantalla server-component `/admin/personas/[id]/trayectoria` que ejecuta 5 queries en paralelo y une los resultados como eventos ordenados por fecha. El timeline es client-component reactivo. Si una persona NO tiene data, mostrar empty state con CTA "Cargar trayectoria".

**D74** — Generación PDF en backend con `puppeteer-core` + `@sparticuz/chromium` (Vercel-compatible) o alternativa más liviana (pdfmake, pdf-lib). Generación Excel con `xlsx` (SheetJS) ya disponible en Artifacts y compatible Node. Decisión final del approach en pre-mortem del Sprint 6.4.

**D75** — Permisos de FASE 6: aditivos sobre el tenant. `tenant.admin` siempre puede todo (override). Resto de atributos son granulares por función. Mismo patrón que módulos previos.

---

## 6. Riesgos y mitigaciones

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Notificación de lesión llega a personas equivocadas (ej. delegado de OTRO equipo) | Filtro estricto en query: `equipos.dt/etc` Y `personas_equipos.equipo_id = (equipo del jugador lesionado)`. Test E2E con 2 equipos y verifica que solo el equipo correcto recibe. |
| R2 | Carga de lesión por error bloquea visualmente al jugador y el DT no convoca | Mitigación parcial (D62): el DT puede convocar igual. Mitigación adicional: log de cambios de estado de lesión, capacidad de marcar "recuperada" rápido (1 click). |
| R3 | Timeline de trayectoria pesado para personas con mucha historia | Paginación virtual del timeline (10 eventos visibles, infinite scroll). Queries en paralelo con LIMIT. |
| R4 | Generación PDF de reporte tarda > 10s en serverless | Background job vía `com_jobs_log` (existente) + notificación in-app cuando está listo. PDF queda en Supabase Storage con URL temporal. |
| R5 | Scouting con 11 dimensiones es UX overload | Form en pasos (cómo juega + técnica/táctica en paso 1, físico en paso 2, relaciones en paso 3). Scout puede guardar parcial y completar después. |
| R6 | Migración o cleanup E2E borra `personas_lesiones` de jugadores reales | Mismo patrón del 5.2: fixture E2E con `[fixture]` tag en metadata, cleanup solo borra rows con ese tag. Test contra DB productiva no contamina. |
| R7 | xG y stats avanzadas mock confunden a usuarios | Tag visual `[Mock — disponible en FASE 11]` en cada widget afectado. ADR-035 (mock-first universal). |
| R8 | Reportes Excel se generan mal por encoding (acentos, caracteres especiales) | UTF-8 explícito + tests con nombres argentinos típicos (Pérez, Núñez, García). |

---

## 7. Glosario nuevo

- **Lesión activa:** fila en `personas_lesiones` con `recuperada=false AND deleted_at IS NULL`. Persona aparece bloqueada visualmente en convocatorias.
- **Recuperación:** transición de `recuperada=false → true` con `fecha_alta_medica` seteada. Saca el indicador visual.
- **Restricción de actividad:** flag dentro de la lesión (`restriccion_actividad`) que indica si la persona NO puede entrenar (vs solo no jugar partidos). Texto libre describe la restricción.
- **Ficha de scouting:** sinónimo de `scouting_fichas` (extensión persona). NUNCA es entidad paralela a persona.
- **Persona observada:** persona con atributo `scouting.observado`. Está en seguimiento pero no fichada formalmente.
- **Persona fichada (scouting):** persona observada que pasa a tener atributos de club (ej. `equipos.jugador`). El atributo `scouting.observado` queda en histórico (no se borra).
- **Evaluación de scouting:** fila en `scouting_evaluaciones` con dimensión + valor 1-10 + scout que la firmó. Múltiples por persona+dimensión a lo largo del tiempo.
- **Dimensión de scouting:** una de las 11 categorías de evaluación definidas por Yair (D65).
- **Trayectoria de un jugador:** unión cronológica de 5 fuentes (clubes anteriores, categorías, premios, lesiones, asistencias) renderizada como timeline.
- **Reporte deportivo:** documento generado a partir de queries SQL sobre data de FASE 3-5-6, entregado en 3 formatos (dashboard / PDF / Excel).
- **Scout:** persona con atributo `scouting.scout`. Puede ser externa o también miembro del CT (atributo aditivo).

---

## 8. Próximos pasos

1. **Committear este RFC** al repo en `docs/rfcs/RFC-003-operacion-deportiva-extendida.md` (sprint micro previo al 6.1, igual que se hizo con RFC-002).
2. **Sprint 6.1:** Lesiones operativas (próximo a armar)
3. **Sprints 6.2 a 6.4** en cadena (~17-22h Code total)
4. **Validación visual del sistema completo post-FASE 6** (recordatorio)
5. **Decisiones futuras de Yair postergadas:** cuándo arrancar FASE 7 (Finanzas avanzadas) vs adelantar FASE 8 (RRHH operativo) o FASE 9 (IA aplicada)

**Aprobación:** este RFC se considera aprobado al merge en main durante el sprint micro de canonización. Si Yair quiere cambios estructurales antes, este RFC se actualiza primero.

---

## Anexo A — Mapeo decisiones de Yair → ADRs canonizados

Para trazabilidad. Yair respondió 4 bloques de preguntas el 12-may-2026 (12:30 ART). Cada respuesta se canoniza en al menos una decisión.

| Bloque | Pregunta original | Respuesta de Yair | Canonizado como |
|---|---|---|---|
| 1.1 | ¿Quién carga la lesión? | "el jugador, el médico, el kinesiólogo, una app tercera que ingeste, por csv, pdf... ya sabes como me gusta" | D61 |
| 1.2 | ¿La lesión bloquea automáticamente la convocatoria? | "le avisa al DT, cuerpo técnico, capitán y delegados por notificaciones. el DT lo tiene en la lista, puede decidir si convocarlo o no, pero tiene que saber que está lesionado" | D62, D68, D70 |
| 1.3 | ¿Subir estudios médicos? | "sí, todo como te dije antes" | D61 (vías), implementación en 6.1 |
| 2.1 | ¿Scouting interno o externo? | "ambos" | D63 |
| 2.2 | Workflow ficha + campos extra | "es una persona, con lo cual hay que cargar la ficha completa. agregar comentarios sobre cómo juega, técnica, táctica, habilidades extra, destreza motriz, inteligencia para el juego, relación con grupo / CT / rival / árbitro / socios" | D65, D71, D72 |
| 2.3 | ¿Ficha separada o transforma en persona? | "no, acordate que todos son personas, en todos los casos siempre se crea una persona, y sobre esa persona se habilitan más campos de acuerdo al módulo donde estemos. es la única forma que sea modular el sistema e independiente cada módulo contra el troncal" | D64 (elevado a principio rector) |
| 3.1 | ¿Historial manual o incremental? | "de ambas maneras, se puede ir completando de a poco o todo junto" | Implementación en 6.2 con ambos flujos |
| 3.2 | ¿Visualización trayectoria? | "está bueno un timeline visual con stats" | D66, D73 |
| 4.1 | ¿3 reportes mínimos? | "sí, esos que mencionas están bien" (rankings goleadores, comparativo asistencias categoría, stats jugador) | Implementación en 6.4 |
| 4.2 | ¿Formato preferido reportes? | "los 3" (dashboard, PDF, Excel) | D67, D74 |
| Transv.1 | Orden de sprints | "lo manejás vos, vos sos el arquitecto" | Orden 6.1 → 6.2 → 6.3 → 6.4 (§4.1) |
| Transv.2 | Relación troncal-modular | "acordate la relación entre lo troncal y lo modular. que hay datos en personas; roles y permisos de acuerdo al usuario, etc..." | D64, D69, D75 |
| Scouts | ¿Atributo dedicado o CT? | "si todo puede ser posible" | D69 (modelo aditivo) |
