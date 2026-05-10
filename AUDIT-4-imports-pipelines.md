# PARTE 4 — Imports y pipelines (estado actual)

## 4.1 Pipelines configurados

Hay **dos sistemas** de importación que conviven:

### Sistema nuevo (import_pipelines) — Sprint 14c+

Tabla `import_pipelines` con config JSONB.

| Slug | Nombre | Parser | Modo | Estado |
|------|--------|--------|------|--------|
| `jugadores_por_equipo` | Jugadores por equipo | `xlsx_grupos` (headers de grupo en filas) | match_fuzzy + apply_rules | En uso |
| `padron_socios` | Padrón de socios | — | — | Configurado, sin descripción |
| `suscriptores_por_equipo` | Suscriptores por equipo | `xlsx_grupos` | match_fuzzy + apply_rules | Configurado, pendiente test E2E |

#### Config `jugadores_por_equipo`:
```json
{
  "formato_origen": "xlsx_grupos",
  "header_regex": "plantel|equipo|grupo",
  "campo_monto": null,
  "match_rules": [
    {"field": "numero_documento", "weight": 1.0},
    {"field": "nombre_apellido", "weight": 0.8, "fuzzy": true}
  ],
  "apply_rules": [
    {
      "trigger": {"match_status": ["exacto", "probable"]},
      "actions": [
        {"type": "insertar_personas_padrones"},
        {"type": "insertar_personas_equipos"}
      ]
    },
    {
      "trigger": {"match_status": ["sin_match"], "decision": "crear_nueva"},
      "actions": [
        {"type": "crear_persona_nueva"},
        {"type": "insertar_personas_padrones"},
        {"type": "insertar_personas_equipos"}
      ]
    }
  ]
}
```

#### Config `suscriptores_por_equipo`:
```json
{
  "formato_origen": "xlsx_grupos",
  "header_regex": "suscriptos",
  "grupo_sin_equipo": "Aportan sin equipo",
  "campo_monto": "monto",
  "match_rules": [
    {"field": "numero_documento", "weight": 1.0},
    {"field": "nombre_apellido", "weight": 0.8, "fuzzy": true}
  ],
  "apply_rules": [
    {
      "trigger": {"match_status": ["exacto", "probable"]},
      "actions": [
        {"type": "insertar_personas_padrones"},
        {"type": "asignar_atributo", "atributo_slug": "suscriptor"}
      ]
    },
    {
      "trigger": {"match_status": ["sin_match"], "decision": "crear_nueva"},
      "actions": [
        {"type": "crear_persona_nueva"},
        {"type": "insertar_personas_padrones"},
        {"type": "asignar_atributo", "atributo_slug": "suscriptor"}
      ]
    }
  ]
}
```

**Diferencia clave:** suscriptores NO ejecuta `insertar_personas_equipos` y sí ejecuta `asignar_atributo`.

### Sistema viejo (padron_syncs) — Sprint 14a

- Flujo: upload Excel → generar diffs (altas/bajas/cambios) → revisar → aplicar
- Procesador: `lib/padron-sync/processor.ts`
- UI: `/admin/padrones/sincronizar/`
- Estado: **Legacy, reemplazado** por el nuevo sistema. Sigue funcionando pero no se usa para imports nuevos.

## 4.2 Parsers implementados

| Path | Tipo | Estado |
|------|------|--------|
| `lib/imports/parsers/agrupado-por-grupo.ts` | XLSX con filas de grupo (header_regex match) | Estable |
| `lib/padron-sync/parsers.ts` | Excel con auto-detección de headers | Legacy |

### Parser `agrupado-por-grupo.ts`:
1. Lee XLSX con `xlsx` library
2. Detecta filas de "grupo" via regex configurable (`header_regex`)
3. Dentro de cada grupo, detecta fila de header (busca "nombre", "apellido", "dni", etc.)
4. Parsea filas de datos hasta el siguiente grupo
5. Para cada fila: split apellido/nombre, normalización, extracción DNI
6. Devuelve array de `ImportRow` con `grupo`, `datos_raw`, `datos_parseados`

## 4.3 Apply rules (acciones soportadas)

| Tipo de acción | Propósito | Sprint |
|---------------|-----------|--------|
| `crear_persona_nueva` | Crea persona en `personas` | 14c.1 |
| `insertar_personas_padrones` | Inserta en `personas_padrones` con `origen_alta: 'import_run'` | 14c.1.1 |
| `insertar_personas_equipos` | Resuelve/crea equipo + inserta en `personas_equipos` | 14c.1 |
| `asignar_atributo` | Asigna atributo de `catalogo_atributos` a persona | 14c.2 |

### Flujo de un run completo:
1. **Upload**: archivo → parser → `import_rows` con `match_status: 'pendiente'`
2. **Matching**: para cada row → `match_persona_fuzzy()` → `match_status: exacto|probable|sin_match`
3. **Revisión**: UI muestra candidatos, operador puede: aceptar, crear nueva, buscar manual, descartar
4. **Aplicar**: evaluación de `apply_rules` por row → ejecución secuencial de acciones
5. **Resultado**: `apply_status: aplicado|fallado|pendiente_revision_equipo`

### Matching fuzzy (`match_persona_fuzzy`):
- Input: tenant_id, apellido, nombre, DNI (opcional)
- Pre-filtro: GIN trigram index (`similarity > 0.3`)
- Scoring: tokens del input comparados contra tokens de cada candidato
- Score 1.0 = match exacto por DNI
- Score >= 0.7 = probable
- Score < 0.7 = sin_match
- Normalización: `normalize_name()` (strip acentos, apóstrofes, lowercase, collapse whitespace)

## 4.4 Runs históricos

- **Total runs:** ~5-10 (tenant Hindu)
- **Último run aplicado:** Run `ef766503` (jugadores_por_equipo, ~230 filas)
- **Estados de runs:** revisando, matching, aplicando, aplicado, fallado
- **Pendiente:** Test E2E del pipeline `suscriptores_por_equipo` con `suscriptores_por_equipo_v2.xlsx`
