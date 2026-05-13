# RFC-002 — Sistema de competencias y torneos

**Estado:** Aprobado (12-may-2026)
**Fecha:** 12 de mayo de 2026
**Autor:** Arquitecto (Claude Opus) basado en 5 decisiones de producto de Yair
**Aplica a:** ClubCore v2 — FASE 5 + satélites en FASE 11/16

---

## 1. Resumen ejecutivo

Hindu (y futuros tenants) necesitan:

- Organizar **torneos internos** (entre sus propias categorías o invitando clubes)
- Participar en **torneos externos** (FACCMA, AIF, APDCC)
- Cargar resultados con **detalle completo** (goles por jugador, tarjetas, cambios, minutos)
- Calcular **tabla de posiciones** propia + sincronizar con oficial cuando se pueda
- Ver **estadísticas básicas y avanzadas** (xG, mapas de calor)

Hoy hay 98 partidos cargados en `partidos_detalle` con resultados básicos pero sin modelo formal de torneo (campo `torneo_slug` es texto libre).

Este RFC establece el modelo de datos formal, las 6 piezas de FASE 5 y los satélites que se entregan por FASE 11 (conectores) y FASE 16 (servicios externos reales).

---

## 2. Principio rector — "Todas las opciones"

Canonizado a partir de respuestas de Yair el 12-may-2026:

> "todos tienen apps o webs con o sin api, hay que hacer siempre todas las opciones para todo, indistintamente como sea, incluyendo scrapping"

> "tienen que tener todas las opciones"

**Interpretación operativa:** ningún flujo se entrega con UNA sola vía. Cada función crítica (input de fixture, carga de resultados, tabla de posiciones, etc.) tiene múltiples vías disponibles que el usuario elige según su contexto.

**Cómo se decanta esto:**

| Función | Vías canonizadas | Cuándo se entrega cada vía |
|---------|-----------------|---------------------------|
| Input de fixture | Manual / CSV / API / Scraping | Manual+CSV en FASE 5 / API en FASE 16 / Scraping en FASE 11 |
| Input de resultados | Manual / CSV import | Manual en FASE 5 / CSV en FASE 5.7 (satélite) |
| Tabla de posiciones | Cálculo propio / Sync oficial / Vista comparativa | Propio en FASE 5.4 / Sync en FASE 11.x |
| Stats avanzadas | Básicas calculadas / xG mock / Mapas de calor | Básicas en FASE 5.6 / Avanzadas mock-first |

Lo que **NO** se hace: descartar opciones. Lo que **SÍ** se hace: entregarlas en el sprint donde es factible (sin bloquearse por infra que aún no existe).

---

## 3. Modelo de datos

### 3.1 Tablas nuevas (FASE 5)

#### `torneos`

Modelo formal de competencia. Reemplaza el texto libre actual.

- `id`, `tenant_id`, `slug`, `nombre`, `descripcion`
- `tipo`: `'interno'` | `'externo'`
- `formato`: `'liga'` | `'eliminacion'` | `'grupos_playoff'` | `'suizo'` | `'triangular'` | `'cuadrangular'`
- `federacion_id` (FK `entidades`) — NULL para internos
- `temporada`: text (e.g., `'2026 Apertura'`)
- `fecha_inicio`, `fecha_fin`
- `estado`: `'planificado'` | `'inscripcion'` | `'en_curso'` | `'finalizado'` | `'cancelado'`
- `nivel_competencia_slug` (FK `catalogo_niveles_competencia`)
- `criterios_desempate`: jsonb (config flexible)
- `metadata`: jsonb (config custom del formato)
- `activo`, `created_at`, `updated_at`

#### `torneo_categorias`

Un torneo puede tener varias categorías (e.g., Sub-13, Sub-15, Primera).

- `id`, `tenant_id`, `torneo_id` (FK)
- `slug`, `nombre` (e.g., `'sub-15'`, `'Sub-15'`)
- `orden`, `num_equipos_max`
- `metadata` jsonb

#### `torneo_equipos`

Qué equipos participan en qué categoría del torneo. Polimórfico: equipo propio (FK `equipos`) O equipo externo (texto + entidad opcional).

- `id`, `tenant_id`, `torneo_id`, `categoria_id` (nullable)
- `equipo_id` (FK `equipos`) — NULL si es equipo externo
- `equipo_externo_nombre` — NULL si equipo propio
- `equipo_externo_entidad_id` (FK `entidades`) — opcional
- `posicion_final` (después del torneo)
- `puntos_finales`, `goles_a_favor_finales`, etc.
- `metadata` jsonb

#### `torneo_partidos_eventos`

Eventos granulares de un partido (goles, asistencias, tarjetas, cambios).

- `id`, `tenant_id`, `partido_evento_id` (FK `eventos`)
- `minuto`: int (0-90+)
- `tipo`: `'gol'` | `'asistencia'` | `'tarjeta_amarilla'` | `'tarjeta_roja'` | `'cambio_entra'` | `'cambio_sale'` | `'penal_atajado'` | `'penal_errado'` | `'autogol'`
- `persona_id` (FK `personas`) — quien hizo la acción
- `equipo_id` (FK `equipos`) — qué equipo
- `persona_relacionada_id` — para asistencias (quien dio el pase), cambios (quien sale/entra)
- `descripcion`, `metadata` jsonb
- `created_at`

#### `partido_stats_jugador`

Stats agregadas por jugador por partido. Calculadas o cargadas manualmente.

- `id`, `tenant_id`, `partido_evento_id`, `persona_id`
- `minutos_jugados`
- `goles`, `asistencias`
- `tarjetas_amarillas`, `tarjetas_rojas`
- `tiros`, `tiros_al_arco`
- `pases`, `pases_completados`
- `duelos_ganados`, `faltas_recibidas`, `faltas_cometidas`
- `xg`: numeric (Expected Goals, opcional)
- `metadata` jsonb (custom stats)
- `created_at`, `updated_at`

### 3.2 Tablas existentes que se reutilizan

| Tabla | Uso en FASE 5 |
|-------|---------------|
| `eventos` | Partido = evento con `tipo_evento_slug` IN (`'partido'`, `'torneo'`, `'amistoso'`) |
| `partidos_detalle` | Se EXTIENDE: agregar `torneo_id` (FK) + `categoria_id` (FK). Migration del actual `torneo_slug` |
| `equipos_competencias` | Sigue válido: relación equipo↔federación con `torneo_nombre` + `categoria_externa` |
| `catalogo_niveles_competencia` | Sigue válido: 6 niveles ya definidos |
| `esquemas_tacticos` + `esquema_posiciones` | Sigue válido: alineación del partido (Sprint 4.5) |
| `entidades` | Federaciones (FACCMA, AIF, APDCC) son entidades |

### 3.3 Migration cuidadosa de `torneo_slug` → `torneo_id`

`partidos_detalle` tiene 98 filas productivas con `torneo_slug` como texto libre. Migration:

1. Agregar columnas `torneo_id` (nullable) y `categoria_id` (nullable) a `partidos_detalle`.
2. Crear torneos retroactivos basados en valores distintos de `torneo_slug` actual:

```sql
INSERT INTO torneos (tenant_id, slug, nombre, tipo, estado, ...)
SELECT DISTINCT tenant_id, torneo_slug, INITCAP(REPLACE(torneo_slug,'_',' ')),
       'externo', 'finalizado', ...
FROM partidos_detalle
WHERE torneo_slug IS NOT NULL;
```

3. `UPDATE partidos_detalle` para setear `torneo_id` basado en el slug.
4. **NO BORRAR `torneo_slug` aún.** Mantener ambos hasta validar. Sprint 5.x futuro lo deprecia.

Esta migration vale como pre-mortem incorporado porque toca data productiva.

---

## 4. Roadmap secuenciado

### FASE 5 core (6 sprints)

| # | Sprint | Foco | Estimación |
|---|--------|------|------------|
| 5.1 | Modelo + creador interno | Tablas + creador con 6 formatos + migration `torneo_slug`→`torneo_id` | 5-6h |
| 5.2 | Participación externos | UI para inscribir equipos en FACCMA/AIF/APDCC, manual + CSV import | 4-5h |
| 5.3 | Fixture auto-generador | Generador por formato (liga round-robin, eliminación bracket, grupos+playoff, suizo, triangular, cuadrangular) | 5-6h |
| 5.4 | Tabla de posiciones | Vista materializada o función SQL + criterios desempate configurables + UI | 3-4h |
| 5.5 | Resultados detallados | Form completo: goles, asistencias, tarjetas, cambios, minutos jugados | 5-7h |
| 5.6 | Stats por jugador y equipo | Básicas en MVP, avanzadas mock (xG, posesión); UI con dashboards | 4-5h |

**Total FASE 5 core: ~26-33h Code.**

### Satélites — FASE 11 / FASE 16

| # | Satélite | Depende de | Cuándo |
|---|----------|-----------|--------|
| 5.7 | Import CSV fixture externos | FASE 5.3 | FASE 5 o FASE 11 |
| 5.8 | Scraping FACCMA/AIF web | Infra Playwright server-side | FASE 11 |
| 5.9 | API integración federaciones | Credenciales + endpoint público | FASE 11 o FASE 16 |
| 5.10 | Sync tabla posiciones oficial | 5.4 + 5.8/5.9 | FASE 11 |
| 5.11 | Datos avanzados xG real | Modelo ML o servicio externo | FASE 11 o FASE 16 |

---

## 5. Decisiones canonizadas (D43-D60)

### Producto (decididas por Yair)

- **D43:** Hindu organiza torneos internos + participa en externos por igual. Modelo soporta ambos.
- **D44:** Todas las vías de input de fixture (manual, CSV, API, scraping) — se entregan progresivamente.
- **D45:** Detalle de partido = stats avanzadas. No solo resultado final.
- **D46:** Tabla de posiciones con todas las vías (propio + sync oficial + comparativa).
- **D47:** Migrar `torneo_slug` (texto) a FK `torneo_id`. Vale el costo de tocar 98 filas.

### Técnicas (Arquitecto)

- **D48:** 6 formatos de torneo soportados: liga (round-robin), eliminación (bracket), grupos+playoff (mixto), suizo (rotativo), triangular (3 equipos), cuadrangular (4 equipos).
- **D49:** Tabla `torneos` separada de `equipos_competencias`. Esta última se mantiene para relación equipo↔federación con metadata externa.
- **D50:** `torneo_partidos_eventos` granular por minuto. Permite reconstruir el partido evento por evento.
- **D51:** `partido_stats_jugador` agregada por partido. Stats globales se calculan SUM/AGGREGATE sobre esta tabla.
- **D52:** Criterios de desempate configurables por torneo. Default: puntos → diferencia de gol → goles a favor → enfrentamiento directo. Yair puede cambiar por torneo.
- **D53:** Vista materializada `vw_tabla_posiciones` o función SQL que recalcula on-demand. Decisión final en Sprint 5.4.
- **D54:** Fixture auto-generado en TS (algoritmos), persistido como eventos + `partidos_detalle`. Nada de hardcoded.
- **D55:** Permisos: `torneos.admin` (crear/editar torneos), `torneos.cargador` (cargar resultados solamente). Reusa `tenant.admin` para todo.
- **D56:** Sidebar: nueva sección "Competencias" en Club Deportivo (jerarquía: Competencias → Torneos / Tabla posiciones / Resultados).
- **D57:** Stats avanzadas (xG, mapas de calor) mock-first hasta FASE 11/16. UI preparada, datos placeholder.
- **D58:** Carga de resultados detallada en pantalla dedicada `/admin/competencias/partidos/[id]/resultado` (no tab de evento — flujo intensivo).
- **D59:** Listado de torneos en `/admin/competencias/torneos`.
- **D60:** Migration de `torneo_slug` es la PARTE 2 del Sprint 5.1 con pre-mortem incorporado por tocar 98 filas productivas.

---

## 6. Riesgos y mitigaciones

| # | Riesgo | Mitigación |
|---|--------|-----------|
| R1 | Migration de `torneo_slug` corrompe 98 partidos productivos | Pre-mortem en Sprint 5.1, mantener columna vieja, dual-read durante 2 sprints |
| R2 | Criterios de desempate confusos para usuarios | Default sensato por país (Argentina), configuración avanzada solo en modo experto |
| R3 | Auto-generador de fixture falla en formatos complejos | Tests unitarios exhaustivos por formato + fallback a fixture manual |
| R4 | Carga de resultados detallada es UI muy compleja | Form en pasos: marcador → eventos por equipo → revisión → confirmar |
| R5 | Stats avanzadas mock confunden a usuarios | Tag visual "datos mock — disponible en FASE 16" en cada widget afectado |
| R6 | Scraping de FACCMA bloqueado por anti-bot | FASE 11 con infra dedicada, headers correctos, rate limit, fallback a manual |

---

## 7. Glosario nuevo

- **Torneo:** competencia formal con formato, equipos y fixture. Puede ser interno u externo.
- **Categoría del torneo:** división dentro de un torneo (Sub-13, Primera, etc.).
- **Equipo del torneo:** equipo (propio o externo) inscripto en una categoría.
- **Evento de partido** (`torneo_partidos_eventos`): acción granular durante el partido (gol, tarjeta, cambio) con minuto exacto.
- **Stat agregada:** total de una métrica para un jugador en un partido (`partido_stats_jugador`).
- **Tabla de posiciones:** ranking calculado de equipos en una categoría según criterios de desempate.
- **Criterios de desempate:** orden de prioridad para resolver empates en puntos (Argentina default: puntos → diferencia de gol → GF → enfrentamiento directo).

---

## 8. Próximos pasos

1. **Sprint 5.1:** modelo + creador interno + migration cuidadosa (próximo a armar)
2. **Sprint 5.2 a 5.6:** en cadena (~26-33h Code total)
3. **Validación visual** del sistema completo post-FASE 5 (recordatorio)
4. **Decisiones de Yair postergadas:** cuándo arrancar FASE 9 (IA), si adelantamos antes de FASE 6

**Aprobación:** este RFC se considera aprobado al merge en main durante el Sprint 5.1. Si Yair quiere cambios estructurales antes, este RFC se actualiza primero.
