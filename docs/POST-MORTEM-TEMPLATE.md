# Post-Mortem Template — ClubCore

> Template para análisis post-incidente. Usar cuando ocurra cualquier
> incidente productivo que afecte usuarios reales, datos, o disponibilidad
> del sistema.
>
> Una vez completado, guardar en `docs/post-mortems/<YYYY-MM-DD>-<slug>.md`.
>
> Para incidentes que canonicen un nuevo patrón, agregar también un ADR
> en `docs/DECISIONS.md`.

---

## Cómo usar este template

1. Copiar este archivo a `docs/post-mortems/<YYYY-MM-DD>-<slug-corto>.md`.
2. Llenar todas las secciones. Las marcadas con [obligatorio] son non-negotiable.
3. El autor del post-mortem es quien lideró la mitigación.
4. Compartir con stakeholders dentro de 48h del cierre del incidente.
5. Si el incidente expone un patrón general, canonizar como ADR.

---

## Header [obligatorio]

| Campo | Valor |
|---|---|
| **ID del incidente** | INC-YYYY-MM-DD-NN (correlativo dentro del día) |
| **Título** | <una frase descriptiva, ej: "Crons no ejecutaron por CRON_SECRET rotado mal"> |
| **Fecha del incidente** | YYYY-MM-DD |
| **Hora detección** | HH:MM ART |
| **Hora resolución** | HH:MM ART |
| **Duración total** | <horas:minutos> |
| **Severidad** | Crítica / Alta / Media / Baja |
| **Autor del post-mortem** | <nombre> |
| **Estado** | Borrador / Revisado / Cerrado |

### Definición de severidades

| Severidad | Criterio |
|---|---|
| Crítica | Sistema caído. Sin acceso. Pérdida de datos. Impacto a TODOS los usuarios |
| Alta | Funcionalidad core rota. Workaround complicado. Impacto a >50% de usuarios |
| Media | Funcionalidad secundaria rota. Workaround viable. Impacto a <50% de usuarios |
| Baja | Bug cosmético o experiencia degradada. Sin impacto operativo material |

---

## Resumen ejecutivo [obligatorio]

<Un párrafo de 3-5 líneas. Tiene que poderse leer en 30 segundos
y entender qué pasó, a quién afectó, qué se hizo. Sin tecnicismos.>

---

## Línea de tiempo [obligatorio]

Cronología exacta de eventos. Formato: `HH:MM ART | <evento>`.

| Hora ART | Evento |
|---|---|
| 09:00 | Cron job `<slug>` ejecutó normalmente |
| 09:15 | Primer usuario reporta no haber recibido recordatorio |
| 09:30 | Detección: query MCP confirma 0 envíos generados |
| 09:35 | Investigación: revisión de logs Vercel + com_jobs_log |
| 10:00 | Causa identificada: CRON_SECRET rotado sin actualizar Vercel env vars |
| 10:15 | Mitigación aplicada: secret actualizado en Vercel + redeploy |
| 10:45 | Verificación: re-ejecución manual del trigger exitoso |
| 11:00 | Cierre: confirmado que todos los usuarios recibieron el envío con delay de 2h |

---

## Impacto cuantificado [obligatorio]

| Métrica | Valor |
|---|---|
| Usuarios afectados | <número exacto o estimación> |
| Tenants afectados | <Hindu / otros> |
| Tiempo de funcionalidad caída | <minutos/horas> |
| Datos perdidos | <si aplica, qué exactamente> |
| Costo financiero | <si aplica, ej. emails no enviados, ventas perdidas> |
| Otros sistemas afectados | <si hubo efecto dominó> |

---

## Causa raíz [obligatorio]

### Síntoma observable

<Qué se vio desde afuera. Ej: "Los crons ejecutaron pero no enviaron emails.">

### Causa próxima

<Qué falló técnicamente. Ej: "Los cron endpoints rechazaron las requests
de Vercel con 401 porque el header Authorization no coincidía con
el secret esperado.">

### Causa raíz (los 5 porqués)

1. **¿Por qué falló?**
   <respuesta>
2. **¿Por qué eso?**
   <respuesta>
3. **¿Por qué eso?**
   <respuesta>
4. **¿Por qué eso?**
   <respuesta>
5. **¿Por qué eso?**
   <respuesta final, debería ser una causa sistémica o de proceso>

### Causa sistémica

<Una frase. Ej: "Rotación de secrets sin checklist documentado de
verificación post-rotación.">

---

## Detección

| Pregunta | Respuesta |
|---|---|
| ¿Cómo se descubrió? | <métrica automática / reporte de usuario / verificación manual / etc.> |
| ¿Cuánto tiempo pasó entre el incidente y la detección? | <minutos/horas> |
| ¿Había alerta automática que debería haber disparado? | Sí/No. Si sí, ¿por qué no disparó? |
| ¿Cómo podríamos haber detectado más rápido? | <propuesta de mejora> |

---

## Mitigación inmediata aplicada

<Qué se hizo para resolver el incidente. Comandos exactos, queries
exactas, deploys hechos.>

```bash
# Ejemplo
vercel env add CRON_SECRET production
# valor: <nuevo secret>
vercel deploy --prod
```

---

## Acciones correctivas a largo plazo

| # | Acción | Responsable | Sprint planeado | Estado |
|---|---|---|---|---|
| 1 | <Acción concreta y medible> | Arquitecto | FASE 15 | Pendiente |
| 2 | <Acción concreta y medible> | Code | <Sprint> | Pendiente |
| ... | ... | ... | ... | ... |

Las acciones se mueven a `CURRENT-STATE.md` §6 (deuda técnica) hasta
estar completadas.

---

## Lecciones canonizadas

### Si emerge un patrón general, canonizar como ADR

- Si la solución es un patrón replicable → ADR nuevo en `docs/DECISIONS.md`.
- Si modifica una regla operativa → actualizar `docs/RUNBOOK.md`.
- Si afecta un proceso → actualizar `docs/WORKFLOW.md` o equivalente.

### Lecciones específicas de este incidente

1. <Lección concreta. Ej: "Rotación de secrets requiere checklist
   con 4 verificaciones post-rotación.">
2. ...

---

## Anexos (opcional)

- Logs relevantes (paste o link)
- Screenshots
- Queries SQL ejecutadas durante la investigación
