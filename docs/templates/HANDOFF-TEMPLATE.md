# HANDOFF-TEMPLATE — Plantilla para handoffs de sesión estratégica

**Versión**: 1.0
**Uso**: copiar este template, renombrar a `HANDOFF-YYYY-MM-DD — Título de la sesión`, completar.
**Cuándo crear un HANDOFF**: solo en cierres estratégicos (no en cada sesión). Criterios:

- Cierre de fase del roadmap (F0, F1, F2... completada)
- Decisión arquitectónica grande (ADR nuevo, refactor mayor, cambio de modelo)
- Sesión >2 horas con múltiples decisiones acumuladas
- Resolución de bloqueo importante
- Cambio en operating model (Killer Machine, tridente, superficies)

Para sesiones de implementación rutinaria (un sub-sprint chico, un fix), basta con commit + push + tag + actualizar CURRENT-STATE.md. No necesitan HANDOFF propio.

---

## HEADER

```
# HANDOFF — {Título corto descriptivo}
## {YYYY-MM-DD} — Cierre Ejecutivo

Sesión: {fecha y horas}
Actor principal: {Opus | Code | Yair | combinación}
Duración: {horas}
Categoría: {Cierre de fase | Decisión arquitectónica | Sesión estratégica | Resolución de bloqueo | Cambio de operating model}
```

---

## 1. Propósito de la sesión

Una o dos frases que respondan: por qué existió esta sesión y qué buscaba resolver?

Ejemplo:
> Resolver el bug del MCP de Zoho que bloqueaba el bulk load del proyecto, y dejar el sistema en estado operativo Killer Machine completo.

---

## 2. Qué se hizo (acción por acción)

Listar las acciones concretas en orden cronológico aproximado. Una sub-sección por bloque de trabajo.

### 2.1 {Bloque 1}
Detalle de lo que se hizo, decisiones tomadas, problemas encontrados, cómo se resolvieron.

### 2.2 {Bloque 2}
Detalle.

### 2.3 {Bloque N}
Detalle.

---

## 3. IDs definitivos / cambios canonizados

Si la sesión generó IDs nuevos (Zoho task IDs, milestone IDs, doc IDs en Drive, tags git), listarlos en bloque copy-pasteable.

```
{Categoría 1}:
  id_x: valor
  id_y: valor

{Categoría 2}:
  id_z: valor
```

Si la sesión canonizó decisiones (ADRs, RFCs, cambios en operating model), listar links a los docs.

---

## 4. Estado al cierre

| Indicador | Valor |
|---|---|
| Tag git generado | {tag o "n/a"} |
| Sprint cerrado | {nombre o "n/a"} |
| Sprint activo al cierre | {nombre} |
| Tareas movidas en Zoho | {cantidad y resumen} |
| ADRs creados | {lista o "n/a"} |
| Docs Drive creados/actualizados | {lista} |

---

## 5. Pendientes diferidos (no bloqueantes)

Cosas que no se hicieron en esta sesión pero que vale la pena registrar para retomar después. Cada una con:
- Qué falta
- Por qué se difirió
- Cuándo se va a retomar (estimación)

Ejemplo:
> **134 dependencias entre tareas Zoho**: no se cargaron en el bulk load por costo de calls. Se cargan a demanda cuando se trabaje cada tarea. Estimación: progresivo durante F1-F2.

---

## 6. Próximo paso natural

Qué tiene que pasar después de esta sesión. Concreto y accionable. Quién lo hace.

Inmediato (días):
1. {paso 1, quién}
2. {paso 2, quién}

Corto plazo (semanas):
1. {paso 1, quién}

Mediano plazo (meses):
1. {paso 1, quién}

---

## 7. Restricciones operativas vigentes

Recordatorio condensado de las reglas que aplican al proyecto en general (no específicas a esta sesión). Esto se incluye para que la próxima sesión Opus las tenga frescas sin tener que ir a buscarlas.

- Yair no corre dev local. Smoke testing solo en producción.
- Vercel preview URLs no se pueden smoke-testear (magic link redirige a producción).
- No cargar más data de Hindu.
- Nunca blasts contra personas reales de Hindu.
- Credenciales externas bloqueadas hasta F5.
- Pre-tag mandatorio: auditoría arquitectónica (ADR-061) + smoke funcional real.
- Sprint tagging: ningún sprint nuevo sin que el anterior esté commiteado + pusheado + taggeado.
- DONE técnico ≠ DONE visual. Nada pasa a "terminado" en Zoho sin DONE visual de Yair.
- Code escribe solo en repo+raíz. Opus escribe solo en Drive+Zoho. Yair valida todo.

---

## 8. ADRs y referencias relevantes

Lista de ADRs, RFCs, docs Drive, sprints Zoho que son contexto para esta sesión.

- **ADR-XXX**: descripción corta + link
- **HANDOFF anterior**: `_Cierre Ejecutivo/HANDOFF-YYYY-MM-DD-anterior`
- **CURRENT-STATE post-sesión**: `_Cierre Ejecutivo/CURRENT-STATE` (debería reflejar esta sesión)

---

## 9. Aprendizajes técnicos (si aplica)

Solo incluir esta sección si la sesión generó aprendizajes técnicos nuevos (gotchas de APIs, bugs descubiertos, soluciones no obvias). Bullet points concisos para que la próxima sesión Opus o Code los tenga frescos.

Ejemplo:
> - `createTaskList` con campo `Milestone` en body NO asocia milestone; requiere `updateTaskList` post.
> - Supabase JS client devuelve `null` silencioso al seleccionar columnas inexistentes (ADR-061).

---

## 10. Cómo retomar (boot context reproducible)

Sección destinada a quien arranque la próxima sesión. Debería poder, leyendo solo esto, tener todo el contexto necesario para operar.

Resumen ejecutivo:
- Estado del proyecto: {3 líneas}
- Decisiones canonizadas en esta sesión: {lista}
- Lo más urgente para próxima sesión: {1-2 ítems}

Prompt sugerido para próxima sesión:
> "Leé OPENING + CURRENT-STATE + el HANDOFF YYYY-MM-DD. Estamos en {X}. Arrancamos con {Y}."

---

Fin del HANDOFF-TEMPLATE.

---

## NOTA DE USO

Cuando completes un HANDOFF nuevo:
1. Subir el archivo a Drive `_Cierre Ejecutivo` con nombre `HANDOFF-YYYY-MM-DD — Título`.
2. Actualizar `CURRENT-STATE.md` con el estado nuevo y linkear este HANDOFF en la sección 6.
3. Si la sesión generó ADRs nuevos, asegurar que Code los espeje en repo `docs/adr/`.
4. Si la sesión cambió la nomenclatura o el operating model, actualizar OPENING.md.

El HANDOFF queda inmutable post-creación. Es registro histórico, no doc vivo.
