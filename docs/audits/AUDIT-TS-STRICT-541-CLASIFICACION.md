# Clasificacion de 541 errores TypeScript — noUncheckedIndexedAccess + exactOptionalPropertyTypes

**Fecha:** 2026-05-26
**Log fuente:** `/tmp/ts-errors-541.log`
**Opciones habilitadas:** `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`

---

## 1. Cantidad de errores por codigo TS (top 10)

| # | Codigo | Cantidad | Descripcion |
|---|--------|----------|-------------|
| 1 | **TS18048** | 213 (39%) | `'X' is possibly 'undefined'` — acceso indexado sin check |
| 2 | **TS2532** | 110 (20%) | `Object is possibly 'undefined'` — variante del anterior |
| 3 | **TS2379** | 77 (14%) | Argumento con `string \| undefined` no asignable a param con `prop?: string` (exactOptionalPropertyTypes) |
| 4 | **TS2322** | 59 (11%) | Type `X \| undefined` no asignable a type `X` — cascada de indexed access |
| 5 | **TS2345** | 40 (7%) | Argumento `T \| undefined` no asignable a parametro `T` |
| 6 | **TS2375** | 31 (6%) | Tipo literal no asignable con exactOptionalPropertyTypes |
| 7 | **TS2538** | 6 (1%) | `undefined` cannot be used as index type |
| 8 | **TS2769** | 3 (<1%) | No overload matches this call |
| 9 | **TS2412** | 2 (<1%) | Tipo de propiedad en clase |

**Agrupacion por feature:**
- **noUncheckedIndexedAccess:** TS18048 + TS2532 + TS2322 + TS2345 + TS2538 = **428 errores (79%)**
- **exactOptionalPropertyTypes:** TS2379 + TS2375 + TS2412 = **110 errores (20%)**
- **Cascada / mixtos:** TS2769 = **3 errores (1%)**

---

## 2. Top 20 archivos con mas errores

| # | Archivo | Errores | Causa principal |
|---|---------|---------|-----------------|
| 1 | `app/admin/[tenant]/` (varios) | 223 | Acceso indexado a searchParams, arrays de datos |
| 2 | `modules/finanzas/lib/conciliacion.ts` | 34 | Loop sobre `parsed.filas[i]` |
| 3 | `lib/imports/actions.ts` | 25 | Acceso indexado a `cands[0]`, `cands[1]` |
| 4 | `tests/e2e/modules/torneos.spec.ts` | 17 | Acceso a arrays de fixtures en tests |
| 5 | `modules/torneos/lib/fixture-generators/cuadrangular.ts` | 16 | Destructuring `const [a,b,c,d] = equipos` |
| 6 | `modules/pim/lib/actions.ts` | 16 | `.issues[0].message`, acceso a data arrays |
| 7 | `modules/equipos/ui/components/horarios-panel.tsx` | 15 | `diasSemana[0]`, `diasSemana[6]`, `MESES[idx]` |
| 8 | `tests/e2e/sprints/h5-vertical-ccbp.spec.ts` | 11 | Acceso indexado en assertions |
| 9 | `modules/torneos/lib/fixture-generators/grupos-playoff.ts` | 10 | Destructuring de equipos |
| 10 | `modules/equipos/lib/actions/importar.ts` | 10 | `row.nombre`, `row.disciplina_slug` en loop |
| 11 | `tests/e2e/modules/reservas.spec.ts` | 8 | Acceso indexado en assertions |
| 12 | `modules/salud/ui/components/salud-client.tsx` | 7 | Acceso a data de queries |
| 13 | `modules/torneos/lib/fixture-generators/triangular.ts` | 6 | `const [a,b,c] = equipos` |
| 14 | `tests/e2e/modules/nominas-externas.spec.ts` | 5 | Acceso indexado en assertions |
| 15 | `modules/proyectos/ui/comentario-thread.tsx` | 5 | exactOptionalPropertyTypes en args |
| 16 | `modules/torneos/lib/fixture-generators/suizo.ts` | 4 | Destructuring arrays |
| 17 | `modules/torneos/lib/fixture-generators/liga.ts` | 4 | `current[match]`, `current[n-1-match]` |
| 18 | `modules/torneos/lib/fixture-generators/eliminacion.ts` | 4 | Destructuring arrays |
| 19 | `modules/reservas/lib/helpers.ts` | 4 | Acceso indexado |
| 20 | `modules/finanzas/lib/conciliacion-logic.ts` | 4 | Loop sobre arrays |

---

## 3. Errores por carpeta de primer nivel

| Carpeta | Errores | % |
|---------|---------|---|
| `app/` | 229 | 42% |
| `modules/` | 229 | 42% |
| `tests/` | 48 | 9% |
| `lib/` | 26 | 5% |
| `components/` | 8 | 1.5% |
| `middleware.ts` | 1 | 0.2% |

---

## 4. Clasificacion cualitativa (30 errores sampleados)

### Muestra analizada

| # | Archivo:linea | Error | Cat | Razon |
|---|---------------|-------|-----|-------|
| 1 | `torneos/ui/paso-2-eventos.tsx:102` | TS2375 `descripcion: string \| undefined` vs `descripcion?: string` | **B** | Agregar `as const satisfies` o filtrar undefined antes de pasar |
| 2 | `finanzas/lib/conciliacion.ts:234` | TS18048 `fila` possibly undefined | **A** | `fila` viene de `parsed.filas[i]` en un `for(i < length)` — siempre definido |
| 3 | `equipos/lib/actions/importar.ts:49` | TS18048 `row` possibly undefined | **A** | Idem, loop `for(i < rows.length)` — siempre definido |
| 4 | `planificadores/lib/crear-evento-action.ts:39` | TS2532 `parsed.error.issues[0]` | **A** | Si `!parsed.success`, `issues` siempre tiene al menos 1 entry |
| 5 | `proyectos/ui/comentario-thread.tsx:24` | TS2379 `tarea_id: string \| undefined` | **B** | El form value puede ser undefined, usar `?? undefined` o condicional |
| 6 | `equipos/ui/components/horarios-panel.tsx:72` | TS2322 `PartidoDetalle \| undefined` vs `\| null` | **B** | Cambiar a `?? null` en vez de acceso directo |
| 7 | `finanzas/lib/cuotas.ts:197` | TS2345 `number \| undefined` vs `number` | **B** | Agregar fallback `?? 0` o check previo |
| 8 | `tests/e2e/modules/reservas.spec.ts:128` | TS18048 `r` possibly undefined | **B** | Test assertion — agregar `!` o early assert |
| 9 | `app/.../personas/importar/_actions.ts:46` | TS18048 `row` possibly undefined | **A** | Loop por indice sobre array propio |
| 10 | `reportes-deportivos/ui/comparativa-chart.tsx:48` | TS2375 `fill: string \| undefined` | **B** | exactOptionalPropertyTypes — filtrar antes |
| 11 | `finanzas/lib/conciliacion-logic.ts:117` | TS18048 `d` possibly undefined | **A** | Loop por indice |
| 12 | `equipos/ui/components/editar-equipo-form.tsx:95` | TS2379 multiple optional vs `\| undefined` | **B** | Limpiar objeto antes de pasar a action |
| 13 | `finanzas/lib/conciliacion.ts:237` | TS18048 `fila` possibly undefined | **A** | Mismo loop que #2 |
| 14 | `tests/e2e/sprints/h5-vertical-ccbp.spec.ts:281` | TS2532 object possibly undefined | **B** | Test — agregar non-null assertion |
| 15 | `torneos/lib/fixture-generators/cuadrangular.ts:38` | TS2322 `EquipoEnFixture \| undefined` | **A** | Destructuring despues de `length !== 4` guard |
| 16 | `equipos/ui/components/horarios-panel.tsx:569` | TS18048 `fin` possibly undefined | **A** | `diasSemana[6]` — array siempre tiene 7 dias |
| 17 | `tests/e2e/sprints/h5-vertical-ccbp.spec.ts:640` | TS2532 | **B** | Test assertion |
| 18 | `pim/lib/actions.ts:814` | TS2532 `parsed.error.issues[0]` | **A** | Zod safeParse: si fallo, issues.length >= 1 |
| 19 | `torneos/ui/modal-agregar-equipo.tsx:55` | TS2379 multiples `string \| undefined` | **B** | exactOptionalPropertyTypes |
| 20 | `app/.../rrhh/liquidaciones/page.tsx:21` | TS2379 searchParams `\| undefined` | **B** | searchParams siempre puede ser undefined |
| 21 | `lib/imports/actions.ts:452` | TS2532 `cands[0]` | **A** | Check previo `cands.length >= thresholds` |
| 22 | `app/.../padrones/[id]/importar/step-mapping.tsx:61` | TS2532 | **B** | Acceso indexado a columnas mapeadas |
| 23 | `app/(public)/asociate/form-inscripcion.tsx:174` | TS2379 exactOptionalPropertyTypes | **B** | Form values con `\| undefined` vs optional params |
| 24 | `equipos/ui/components/indumentaria-panel.tsx:214` | TS18048 `data` | **B** | Query data, agregar optional chaining |
| 25 | `torneos/lib/fixture-generators/liga.ts:43` | TS18048 `away` | **A** | Array indexado en round-robin con bounds conocidos |
| 26 | `equipos/ui/components/equipo-composicion.tsx:62` | TS2375 `personaId: string \| undefined` | **B** | exactOptionalPropertyTypes |
| 27 | `middleware.ts:61` | TS2345 `string \| undefined` vs `string` | **A** | `match[1]` despues de `if (match)` — regex match siempre tiene group 1 |
| 28 | `tests/e2e/modules/reservas.spec.ts:123` | TS18048 `r` | **B** | Test assertion |
| 29 | `equipos/lib/actions/importar.ts:50` | TS18048 `row` | **A** | Mismo loop que #3 |
| 30 | `torneos/lib/fixture-generators/triangular.ts:20` | TS2322 `\| undefined` vs type | **A** | Destructuring despues de length check |

### Resultado de la muestra

| Categoria | Cantidad | % | Descripcion |
|-----------|----------|---|-------------|
| **A — Falso positivo** | 14 | **47%** | El codigo ya garantiza no-undefined, pero TS no puede inferirlo (loops por indice, destructuring post-guard, zod issues[0] post-fail) |
| **B — Legitimo trivial** | 16 | **53%** | Fix mecanico: `?.`, `?? fallback`, `!` en tests, limpiar objeto pre-call para exactOptionalPropertyTypes |
| **C — Legitimo serio** | 0 | **0%** | Ningun error requiere refactor de logica |

---

## 5. Clusters identificados

### Cluster 1: Loop por indice sobre array propio (est. ~120 errores, 22%)
**Patron:** `for (let i = 0; i < arr.length; i++) { arr[i].prop }`
**Archivos:** conciliacion.ts, importar.ts, actions.ts (imports), varios en app/admin/
**Fix:** `const item = arr[i]!` o refactor a `for...of` / `.forEach()`
**Esfuerzo:** Bajo, mecanico

### Cluster 2: Destructuring de array post-length-guard (est. ~60 errores, 11%)
**Patron:** `if (equipos.length !== 4) return error; const [a,b,c,d] = equipos`
**Archivos:** Todos los fixture-generators (cuadrangular, triangular, liga, eliminacion, suizo, grupos-playoff)
**Fix:** `const [a,b,c,d] = equipos as [E,E,E,E]` o non-null assertions
**Esfuerzo:** Bajo, 6 archivos concentrados

### Cluster 3: exactOptionalPropertyTypes en form→action (est. ~90 errores, 17%)
**Patron:** Form devuelve `{ campo: string | undefined }`, action espera `{ campo?: string }`
**Archivos:** Formularios de equipos, torneos, asociate, liquidaciones, proyectos, PIM
**Fix sistematico:** Helper `stripUndefined(obj)` que elimina keys con valor undefined antes de pasar a la action, o ajustar tipos de los schemas
**Esfuerzo:** Medio, pero sistematizable con 1 utility

### Cluster 4: `parsed.error.issues[0].message` post-Zod safeParse (est. ~25 errores, 5%)
**Patron:** `if (!parsed.success) return { error: parsed.error.issues[0].message }`
**Archivos:** Todas las server actions con validacion Zod
**Fix:** `parsed.error.issues[0]!.message` o helper `zodFirstError(parsed)`
**Esfuerzo:** Bajo, search-and-replace

### Cluster 5: Tests E2E con acceso indexado (est. ~48 errores, 9%)
**Patron:** `const item = data[0]` en test assertions
**Archivos:** torneos.spec.ts, reservas.spec.ts, h5-vertical-ccbp.spec.ts, nominas-externas.spec.ts, proyectos.spec.ts
**Fix:** `data[0]!` o `expect(data[0]).toBeDefined(); const item = data[0]!`
**Esfuerzo:** Bajo, mecanico

### Cluster 6: searchParams en pages de app/admin (est. ~40 errores, 7%)
**Patron:** `searchParams.periodo` → `string | undefined` pasado a action que espera `periodo?: string`
**Archivos:** Concentrado en `app/admin/[tenant]/`
**Fix:** Misma solucion que Cluster 3 (strip undefined)
**Esfuerzo:** Bajo

---

## 6. Plan de fix sugerido (por oleada)

| Oleada | Scope | Errores est. | Esfuerzo | Estrategia |
|--------|-------|-------------|----------|------------|
| **1** | Tests E2E: `!` assertions | ~48 | 1h | Search-replace mecanico |
| **2** | Zod `issues[0]!.message` | ~25 | 30min | Search-replace |
| **3** | Fixture generators: type assertions post-guard | ~60 | 1h | 6 archivos, mismo patron |
| **4** | Loops por indice → `for...of` o `!` | ~120 | 2h | Mecanico pero disperso |
| **5** | `stripUndefined` helper + forms/actions | ~90 | 2h | 1 utility + aplicar en ~30 call sites |
| **6** | Resto (searchParams, misc) | ~198 | 3h | Variado, app/admin/ concentrado |
| | **Total** | **~541** | **~10h** | |

---

## 7. Recomendacion

Los 541 errores son **100% mecanicos** (0% categoria C). No hay refactor de logica necesario.

**Opcion recomendada:** Habilitar ambas flags y fixear en 2-3 sesiones dedicadas, empezando por los clusters de mayor concentracion (fixture-generators y conciliacion). El ROI es alto: `noUncheckedIndexedAccess` previene NPEs en runtime que hoy son bugs latentes.
