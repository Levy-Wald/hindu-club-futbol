# ClubCore — Runbook Operativo

> Manual de operación del sistema en producción. Qué hacer cuando
> algo falla. Cada escenario incluye síntoma, diagnóstico y
> remediación con comandos exactos.
>
> Mantenido por el arquitecto. Actualizado al cierre de cada sprint
> que introduzca un nuevo componente operativo.
>
> Última actualización: 12 de mayo de 2026.

---

## Cómo usar este documento

1. Identificá el síntoma en la tabla de contenidos.
2. Saltá a la sección correspondiente.
3. Ejecutá el diagnóstico primero, después la remediación.
4. Si tras aplicar la remediación el problema persiste, crear
   POST-MORTEM siguiendo el template (`docs/POST-MORTEM-TEMPLATE.md`).
5. Si la solución expone un patrón general nuevo, canonizarlo como
   ADR en `docs/DECISIONS.md` y actualizar este runbook.

---

## Tabla de escenarios

| # | Escenario | Severidad típica |
|---|---|---|
| 1 | Cron job falla con `status='failed'` | Alta |
| 2 | Cron job no se ejecutó a la hora esperada | Alta |
| 3 | Cron job ejecuta pero `personas_notificadas=0` | Media |
| 4 | Cron envía duplicados (dedup falla) | Alta |
| 5 | Desactivar emergente un cron sin redeploy | Variable |
| 6 | Rotar `CRON_SECRET` sin downtime | Media (mantenimiento) |
| 7 | Mock no envía nada real (es esperado) | N/A |
| 8 | Plantilla rota: variables sin sustituir | Media |
| 9 | Envío masivo se traba a la mitad | Media |
| 10 | Persona reporta recibir demasiados envíos | Alta (privacy) |
| 11 | Deploy en Vercel queda en error | Alta |
| 12 | Hacer rollback a tag anterior | Variable |
| 13 | E2E tests fallan en CI pero pasan local | Media |
| 14 | Persona E2E aparece soft-deleted | Baja |
| 15 | Restaurar desde backup de Supabase | Crítica |
| 16 | Conectarse vía service role para operación manual | N/A (operativa) |
| 17 | Borrar datos contaminados de forma segura | Variable |
| 18 | RLS denegando query inesperadamente | Alta |
| 19 | Health checks rápidos al iniciar el día | Preventivo |
| 20 | Contacto de escalación | N/A |
| — | Cierre de sprint — los 4 niveles de verificación | Proceso |
| — | Anti-patrones detectados en producción (AP-001, AP-002) | Referencia |

---

## 1. Cron job falla con `status='failed'`

### Síntoma

`com_jobs_log` tiene una fila con `status='failed'` y `error_message` no nulo.
Las personas que debían recibir el envío del día no lo recibieron.

### Diagnóstico

```sql
SELECT id, job_slug, status, error_message, started_at, finished_at,
       personas_encontradas, personas_notificadas
FROM com_jobs_log
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 5;
```

Analizar el `error_message`. Causas típicas:

- "Error in RPC function ..." → la función `filtrar_personas_por_preferencias_comunicacion` falló. Verificar que existe: `SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'filtrar_personas_por_preferencias_comunicacion');`
- "permission denied for table ..." → RLS o service role mal configurado. Ver escenario 18.
- "timeout" → la query del trigger tardó más de 60s (límite Vercel). Investigar índices.

### Remediación

1. Si el error es transitorio (timeout puntual, conexión DB cortada):
   - Re-ejecutar el trigger manualmente desde la UI: `/admin/comunicaciones` → tab "Automatizaciones" → botón "Ejecutar ahora" del trigger afectado.
   - O via service role: ver escenario 16.

2. Si el error es de código:
   - Crear hotfix branch desde el tag actual, arreglar, validar:all, deploy, tag patch.
   - Re-ejecutar el trigger una vez deployado.

3. Documentar el incidente con POST-MORTEM-TEMPLATE si afectó a personas reales.

---

## 2. Cron job no se ejecutó a la hora esperada

### Síntoma

Pasaron las 9 AM ART (12:00/12:05/12:10 UTC) y no hay nuevas filas en
`com_jobs_log` del día actual.

### Diagnóstico

```sql
SELECT job_slug, MAX(started_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS ultima_ejecucion_art
FROM com_jobs_log
GROUP BY job_slug
ORDER BY 1;
```

Verificar `vercel.json`:

```bash
cat vercel.json | grep -A 5 crons
```

Esperado: 3 entradas activas con schedule `0 12 * * *`, `5 12 * * *`, `10 12 * * *`.

Verificar en Vercel dashboard → Project → Settings → Crons:
- Que los 3 crons estén "Active".
- Última ejecución registrada.

### Remediación

1. Si `vercel.json` tiene `"crons": []` (pausados):
   - Restaurar las 3 entradas en `vercel.json`.
   - Commit, push, esperar deploy READY.

2. Si Vercel dashboard muestra los crons como inactivos:
   - Re-deployar el proyecto (cambio dummy commit, push).
   - Verificar que el proyecto está en plan Pro (los crons solo corren en Pro).

3. Si los crons están active pero no ejecutaron:
   - Disparar manualmente via UI (escenario 1, remediación 1) para no perder el día.
   - Reportar a Vercel support si persiste.

---

## 3. Cron job ejecuta pero `personas_notificadas=0`

### Síntoma

`com_jobs_log` tiene fila con `status='completed'` pero `personas_notificadas=0`.

### Diagnóstico

Primero, distinguir entre **escenario esperado** y **bug**:

**Escenario esperado:** no hay personas que matcheen los filtros del trigger.

Verificación para `apto_vence_7d`:
```sql
SELECT COUNT(*) FROM personas_autorizaciones
WHERE tipo_autorizacion_slug = 'apto_fisico'
  AND activo = true
  AND fecha_vencimiento = CURRENT_DATE + INTERVAL '7 days';
```
Si devuelve 0 → escenario esperado. Sin acción.

**Bug posible:** el filtro encontró personas pero el dedup las descartó todas (ya recibieron en últimos 7 días) o todas filtradas por preferencias.

```sql
SELECT personas_encontradas, personas_dedup, personas_notificadas, metadata
FROM com_jobs_log
WHERE id = '<job_id_afectado>';
```

Si `personas_encontradas > 0` y `personas_dedup = personas_encontradas` → dedup correcto, todas fueron filtradas por envío reciente.

### Remediación

Generalmente no hay nada que hacer (es comportamiento esperado). Si se necesita forzar re-envío:

1. Eliminar el dedup del envío previo (con cuidado, idempotencia):
   ```sql
   DELETE FROM com_envios
   WHERE persona_id = '<persona_id>'
     AND origen_modulo_slug = '<trigger_slug>'
     AND created_at > NOW() - INTERVAL '7 days';
   ```
2. Re-ejecutar el trigger manualmente.

---

## 4. Cron envía duplicados (dedup falla)

### Síntoma

Una persona recibe múltiples envíos del mismo trigger en menos de 7 días.

### Diagnóstico

```sql
SELECT persona_id, canal, origen_modulo_slug, COUNT(*) AS cantidad,
       MIN(created_at) AS primer_envio, MAX(created_at) AS ultimo_envio
FROM com_envios
WHERE created_at > NOW() - INTERVAL '7 days'
  AND origen_modulo_slug IS NOT NULL
GROUP BY persona_id, canal, origen_modulo_slug
HAVING COUNT(*) > 1
ORDER BY cantidad DESC
LIMIT 20;
```

Si hay resultados, el dedup falló. Causas posibles:

1. **`origen_modulo_slug` mal asignado en algún call** (ej: `'comunicaciones'` literal en lugar del trigger slug). Ver ADR-037.
2. **Race condition entre workers paralelos** de Playwright si fueron E2E.
3. **`idx_com_envios_dedup_origen` no usado** porque el query del dedup no lo aprovecha.

### Remediación

1. Verificar que el índice existe:
   ```sql
   SELECT indexname FROM pg_indexes
   WHERE tablename = 'com_envios' AND indexname = 'idx_com_envios_dedup_origen';
   ```

2. Si todos los duplicados son del mismo job_log (test E2E), es ruido de tests. Borrarlos:
   ```sql
   DELETE FROM com_envios
   WHERE origen_entidad_id = '<job_log_id>'
     AND created_at > NOW() - INTERVAL '1 day';
   ```

3. Si los duplicados son de producción real, investigar el código de `enviarComunicacionMasiva()` y de los triggers para confirmar que pasan `origenModuloSlug` correctamente. Crear POST-MORTEM.

---

## 5. Desactivar emergente un cron sin redeploy

### Síntoma

Bug detectado en producción que requiere apagar los 3 crons inmediatamente
hasta que se arregle.

### Remediación

1. Editar `vercel.json` y vaciar el array de crons:
   ```json
   {
     "crons": []
   }
   ```

2. Commit con mensaje `chore(cron): pausa emergente — investigación de <bug>`.

3. Push a main. Vercel detecta el cambio y actualiza el cron scheduler
   en cuanto el deploy queda READY (~2-3 min).

4. Una vez resuelto el bug, restaurar los 3 crons en `vercel.json` con
   sus schedules originales.

Referencia: este patrón se aplicó en Sprint FASE 2.4-FIX (commit `bc7ecd0`).

---

## 6. Rotar `CRON_SECRET` sin downtime

### Síntoma

Necesitás rotar el secret (compromiso de seguridad, rotación periódica,
nuevo dev en el equipo).

### Remediación

1. Generar nuevo secret: `openssl rand -hex 32`.

2. En Vercel dashboard → Project → Settings → Environment Variables:
   - Agregar `CRON_SECRET_NEW` con el valor nuevo (NO reemplazar el viejo aún).
   - Redeploy.

3. Modificar el código de los 3 cron endpoints para aceptar AMBOS secrets:
   ```typescript
   const validSecrets = [process.env.CRON_SECRET, process.env.CRON_SECRET_NEW];
   if (!validSecrets.includes(authHeader.replace('Bearer ', ''))) {
     return new Response('Unauthorized', { status: 401 });
   }
   ```
   Commit, deploy, verificar READY.

4. Esperar que se ejecute al menos 1 cron exitoso con el secret nuevo
   (Vercel usa el secret del environment, que ahora es el nuevo).

5. Renombrar `CRON_SECRET_NEW` → `CRON_SECRET` (eliminando el viejo).
   Redeploy.

6. Eliminar la lógica de doble validación del paso 3. Commit, deploy.

Total: ~30 min con 3 deploys, cero downtime.

---

## 7. Mock no envía nada real (es esperado)

### Síntoma

Reportás que un email/whatsapp no llegó. Verificás en `com_envios`
que el envío existe con `estado='enviado'`.

### Diagnóstico

```sql
SELECT estado, metadata
FROM com_envios
WHERE id = '<envio_id>';
```

Si `metadata->>'mock' = 'true'` → es modo mock. **No hay envío real.**

### Remediación

Esto NO es un bug. Por ADR-035 (mock-first universal), todo envío
externo (email vía Resend, WhatsApp Cloud, MercadoPago) está en mock
hasta F5.

El switch a producción real es F5 que requiere:
- Configurar API keys reales en Vercel (Resend, MercadoPago, etc.)
- Cambiar env var `COMUNICACIONES_MODE=production` (y equivalentes).
- Verificar dominios verificados (SPF/DKIM/DMARC para email).

Mientras tanto: el sistema graba en `com_envios` como si hubiera enviado,
pero el adapter no llama al servicio externo.

---

## 8. Plantilla rota: variables sin sustituir

### Síntoma

Un envío llegó (en mock o real) con texto literal como `{{nombre}}` o
`{{equipo}}` sin reemplazar por el valor real.

### Diagnóstico

```sql
SELECT slug, asunto, cuerpo, variables_disponibles
FROM com_plantillas
WHERE id = '<plantilla_id>';
```

Verificar que `variables_disponibles` lista todas las variables que
aparecen en `asunto` y `cuerpo`. Si una variable está en el cuerpo
pero no en `variables_disponibles`, no se sustituye.

```sql
SELECT cuerpo_renderizado
FROM com_envios
WHERE id = '<envio_id>';
```

### Remediación

1. Editar la plantilla en `/admin/comunicaciones/plantillas/[slug]`.
2. El editor auto-detecta variables al guardar (función `parseVariables`).
3. Si la variable es nueva, agregarla al contexto de variables del módulo
   que invoca el envío.

Para evitar el problema en futuros desarrollos: cualquier variable
nueva debe pasarse en `variablesGlobales` de `enviarComunicacionMasiva()`
o `enviarComunicacion()`.

---

## 9. Envío masivo se traba a la mitad

### Síntoma

Iniciaste un envío masivo desde `/admin/comunicaciones/envios-masivos`.
El conteo no avanza más allá de N personas o el deploy dio 504 timeout.

### Diagnóstico

```sql
SELECT estado, COUNT(*)
FROM com_envios
WHERE metadata->>'lote_id' = '<lote_id>'
GROUP BY estado;
```

Esperado: todos en `enviado` o `pendiente`. Si hay muchos en `pendiente`
y el job ya pasó, hay un trabajo a medias.

### Remediación

1. Verificar que el `MockAdapter.enviarMasivo()` no rompió. Logs en Vercel.

2. Para reanudar:
   - Si hay personas pendientes:
     ```sql
     UPDATE com_envios
     SET estado = 'fallado',
         error_mensaje = 'Lote interrumpido, requiere re-envío manual'
     WHERE metadata->>'lote_id' = '<lote_id>'
       AND estado = 'pendiente';
     ```
   - Crear nuevo envío masivo desde la UI apuntando a la lista de
     personas que quedaron sin enviar (filtrando por las del lote
     anterior con `estado='fallado'`).

3. Lote completo se considera cerrado por su `lote_id`. No reusar IDs.

---

## 10. Persona reporta recibir demasiados envíos

### Síntoma

Una persona se queja directamente o se da de baja por exceso de
comunicaciones.

### Diagnóstico

```sql
SELECT canal, origen_modulo_slug, COUNT(*) AS cantidad,
       MIN(created_at) AS primero, MAX(created_at) AS ultimo
FROM com_envios
WHERE persona_id = '<persona_id>'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY canal, origen_modulo_slug
ORDER BY cantidad DESC;
```

Verificar preferencias:
```sql
SELECT * FROM personas_preferencias_comunicacion
WHERE persona_id = '<persona_id>';
```

### Remediación

1. Si la persona NO tiene fila en `personas_preferencias_comunicacion`:
   - Crear una fila con opt-outs activos según pedido del usuario.
   - O ir a `/admin/personas/<id>/preferencias-comunicacion` (UI admin).

2. Si tiene fila pero los opt-outs no están seteados:
   - Editar desde UI admin y guardar.

3. Para transaccionales (cuotas vencidas, aptos): NO se pueden filtrar
   por opt-out (ADR del 2.5). Si la persona se queja de transaccionales,
   investigar si realmente las necesita (caso: socio dado de baja
   debería estar en `estado='baja'` y no recibir nada).

---

## 11. Deploy en Vercel queda en error

### Síntoma

`Vercel:list_deployments` muestra el último deploy con `state='ERROR'`.
El sitio sigue sirviendo el deploy anterior (Vercel mantiene rollback automático).

### Diagnóstico

```bash
# Via CLI o vía MCP Vercel
vercel deployments inspect <deployment_id>
```

Ver build logs. Causas típicas:
- TypeScript errors (`tsc --noEmit` rompió).
- Build OOM (Out Of Memory) — pasa con turbopack en builds muy grandes.
- Missing env var en build time (raro, casi todo en runtime).

### Remediación

1. Si es bug de código:
   - Crear branch desde el último tag estable.
   - Arreglar, `npm run validate:all` local, push.
   - Verificar nuevo deploy READY antes de mergear.

2. Si la deuda no es bloqueante y el deploy anterior sirve:
   - No urgente. Puede esperar al siguiente sprint.
   - Documentar como deuda en `CURRENT-STATE.md` §6.

3. Si necesitás recuperar funcionalidad rápido:
   - Rollback (escenario 12).

---

## 12. Hacer rollback a tag anterior

### Síntoma

El último deploy introdujo regresión crítica. Necesitás volver a la
versión anterior.

### Remediación

**Opción A — Rollback en Vercel dashboard (más rápido, 30 segundos):**

1. Vercel dashboard → Project → Deployments.
2. Buscar el deployment del tag estable anterior.
3. Click menú "..." → "Promote to Production".
4. Verificar que el sitio sirve el deploy anterior.

**Opción B — Rollback vía git (más permanente):**

1. Identificar el commit del tag estable: `git rev-parse v0.X.Y-anterior`.
2. Revert: `git revert HEAD..v0.X.Y-anterior` (puede haber conflictos).
3. Si revert es complejo, usar reset (DESTRUCTIVO):
   ```bash
   git checkout main
   git reset --hard v0.X.Y-anterior
   git push --force-with-lease origin main
   ```
4. Vercel detecta el push y deploya.

**Después del rollback:**

- Documentar en POST-MORTEM-TEMPLATE el incidente.
- Crear branch desde la versión rota para investigar la causa raíz
  sin presión.

---

## 13. E2E tests fallan en CI pero pasan local

### Síntoma

`npm run test:e2e` pasa local. CI / Vercel build falla en E2E.

### Diagnóstico

Causas típicas (ordenadas por frecuencia):

1. **Persona E2E soft-deleted** entre runs. Ver escenario 14.

2. **Dedup de 7 días filtrando al fixture** (caso del Sprint 2.5).
   Ver ADR-038. Verificar que el test tiene pre-cleanup en `try` block.

3. **Race condition entre workers paralelos** de Playwright.

4. **PLAYWRIGHT_BASE_URL** apuntando a localhost en CI cuando debería
   ser producción. Verificar `playwright.config.ts`.

5. **Estado de DB de producción contaminado** por un test anterior
   que no limpió bien. Aplicar cleanup manual:
   ```sql
   -- Ver datos sospechosos generados por tests
   SELECT * FROM com_jobs_log WHERE metadata->>'ejecutado_manualmente' = 'true'
   ORDER BY started_at DESC LIMIT 10;
   ```

### Remediación

1. Reproducir local apuntando a producción:
   ```bash
   PLAYWRIGHT_BASE_URL=https://hindu-club.vercel.app npx playwright test
   ```

2. Si el test específico es identificable, correr solo ese:
   ```bash
   PLAYWRIGHT_BASE_URL=https://hindu-club.vercel.app npx playwright test \
     --grep "automatizaciones: trigger apto_vence_7d"
   ```

3. Agregar pre-cleanup al test según patrón ADR-038 si no lo tiene.

4. Si es race condition, considerar correr el test en `serial` mode
   o reducir workers a 1 temporalmente.

---

## 14. Persona E2E aparece soft-deleted

### Síntoma

Tests E2E fallan reportando "persona not found" o RLS error.
Query manual confirma: `personas.deleted_at IS NOT NULL` para
`id = '99999999-9999-9999-9999-999999999999'`.

### Diagnóstico

```sql
SELECT id, nombre, deleted_at, estado, updated_at
FROM personas
WHERE id = '99999999-9999-9999-9999-999999999999';
```

Si `deleted_at` no es null, está soft-deleted. Causa raíz desconocida
(probablemente un test E2E previo la borró por error).

### Remediación

```sql
UPDATE personas
SET deleted_at = NULL,
    estado = 'activo',
    updated_at = NOW()
WHERE id = '99999999-9999-9999-9999-999999999999';
```

Si pasa más de 2 veces en un mes, agendar investigación seria:
revisar todos los tests E2E que tocan `personas` para ver cuál
ejecuta DELETE sobre la fixture E2E.

---

## 15. Restaurar desde backup de Supabase

### Síntoma

Pérdida de datos críticos. Necesitás restaurar desde un punto
anterior en el tiempo.

### Diagnóstico

Verificar capacidades de backup en Supabase dashboard → Database → Backups:

- **Plan Free:** backups diarios automáticos, retención 7 días.
- **Plan Pro:** Point-In-Time Recovery (PITR) opcional, retención 7-30 días.

### Remediación

**Para restauración completa (toda la DB a un punto en el tiempo):**

1. Supabase dashboard → Database → Backups.
2. Seleccionar el snapshot/timestamp objetivo.
3. Click "Restore". Esto crea una **nueva DB**, no sobrescribe la activa.
4. Validar la DB restaurada antes de hacer cualquier switch.

**Para restauración parcial (una tabla específica):**

1. Restaurar a una DB temporal (paso anterior).
2. Conectar vía service role a ambas DBs.
3. Export de la tabla afectada en la temporal:
   ```bash
   pg_dump -t <tabla> -h <temp_host> -U postgres > tabla.sql
   ```
4. Import en producción:
   ```bash
   psql -h <prod_host> -U postgres < tabla.sql
   ```

**ADVERTENCIA:** Las migraciones aplicadas DESPUÉS del backup pueden
romper la consistencia. Verificar `schema_migrations` antes de restaurar.

**Verificar configuración de backups HOY (antes que sea urgente):**

- Supabase dashboard → Database → Backups → confirmar plan + retención.
- Si plan Free + retención 7 días no alcanza para el negocio, upgrade a Pro.

---

## 16. Conectarse vía service role para operación manual

### Síntoma

Necesitás ejecutar una query con permisos de service role (saltearse RLS)
fuera del flujo de la app.

### Remediación

**Vía Supabase MCP (preferido para operaciones puntuales):**

Usar `Supabase:execute_sql` con `project_id='hkoizqbptwhnepzbmjql'`.
El MCP corre con permisos de service role por default.

**Vía psql (para sesiones largas):**

1. Obtener service role key:
   - Supabase dashboard → Project → Settings → API.
   - Copiar `service_role` secret.

2. Conectar:
   ```bash
   psql "postgres://postgres.<project_ref>:<service_role_password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
   ```

3. Para operaciones destructivas, SIEMPRE empezar con transaction:
   ```sql
   BEGIN;
   -- tu operación
   SELECT COUNT(*) FROM tabla WHERE condicion;  -- verificar antes
   -- aplicar
   ROLLBACK;  -- o COMMIT si la verificación pasó
   ```

**ADVERTENCIA:** service role salta RLS. Una query mal hecha puede
afectar datos de cualquier tenant. Cuidado extra cuando ClubCore
tenga más de 1 tenant productivo.

---

## 17. Borrar datos contaminados de forma segura

### Síntoma

Tests E2E o un bug dejaron datos basura en producción. Necesitás
limpiar sin afectar datos reales.

### Remediación

**Protocolo seguro de borrado en producción:**

1. **Contar antes de borrar:**
   ```sql
   SELECT COUNT(*) FROM tabla WHERE condicion_de_basura;
   ```
   Si el conteo es 10x mayor al esperado, NO BORRAR. Revisar la condición.

2. **Inspeccionar muestra:**
   ```sql
   SELECT * FROM tabla WHERE condicion_de_basura LIMIT 10;
   ```
   Confirmar que las filas son las esperadas.

3. **Borrar con transaction:**
   ```sql
   BEGIN;
   DELETE FROM tabla WHERE condicion_de_basura;
   -- verificar el conteo afectado
   ROLLBACK;  -- primer pase: ROLLBACK siempre
   ```

4. **Repetir con COMMIT solo si el conteo del paso 3 coincide con el
   esperado del paso 1.**

5. **Documentar la operación** en `CURRENT-STATE.md` §6 si fue significativa.

**Ejemplo real:** Sprint FASE 2.4-FIX limpió 181 envíos contaminados:
```sql
BEGIN;
UPDATE com_envios
SET origen_modulo_slug = NULL, origen_entidad_id = NULL, updated_at = NOW()
WHERE origen_modulo_slug = 'comunicaciones' AND origen_entidad_id IS NULL;
-- Verificar: 181 rows affected
COMMIT;
```

---

## 18. RLS denegando query inesperadamente

### Síntoma

Query falla con `permission denied for table <tabla>` o devuelve 0 filas
cuando esperamos resultados.

### Diagnóstico

```sql
-- Ver policies de la tabla
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = '<tabla>';

-- Verificar si RLS está habilitada
SELECT relname, relrowsecurity FROM pg_class
WHERE relname = '<tabla>' AND relnamespace = 'public'::regnamespace;
```

Verificar qué usuario está corriendo la query: `SELECT current_user, auth.uid(), auth.role();`

### Remediación

**Caso 1: query desde server action que necesita saltar RLS.**

- Usar service role client (no anon key).
- Cambio en código: importar de `@/lib/supabase/service-role` en lugar
  del cliente normal.

**Caso 2: query desde server action que SÍ debe respetar RLS (multi-tenant).**

- Verificar que `auth.uid()` devuelve un valor (usuario logueado).
- Verificar que el usuario tiene atributo correcto en `personas_atributos`.
- Verificar que la policy filtra correctamente por ese atributo.

**Caso 3: tabla nueva sin RLS habilitada.**

- Habilitar: `ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;`
- Crear policies adecuadas (ver patrones en migrations existentes).
- **NUNCA dejar una tabla pública sin RLS** (R-MT2 de ARCHITECTURE.md).

---

## 19. Health checks rápidos al iniciar el día

Ejecutar estas 4 queries cada mañana antes de empezar trabajo serio:

```sql
-- 1. Crons ejecutaron hoy
SELECT job_slug,
       MAX(started_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS ultima_ejecucion_art,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS fallidos_total
FROM com_jobs_log
WHERE started_at > CURRENT_DATE
GROUP BY job_slug;

-- 2. No hay envíos en estado fallado reciente
SELECT estado, COUNT(*) FROM com_envios
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY estado;

-- 3. RLS sigue habilitada en tablas críticas
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('personas', 'com_envios', 'com_jobs_log',
                  'personas_preferencias_comunicacion',
                  'personas_autorizaciones', 'cuotas_emitidas')
  AND relnamespace = 'public'::regnamespace;

-- 4. Persona E2E activa (para que no rompan E2E del próximo sprint)
SELECT id, nombre, deleted_at, estado
FROM personas
WHERE id = '99999999-9999-9999-9999-999999999999';
```

Esperado:
1. 3 jobs ejecutados a las 9:00, 9:05, 9:10 ART, ninguno failed.
2. Casi todo en `enviado`, nada en `fallado` excepto outliers conocidos.
3. Las 6 tablas con `relrowsecurity = true`.
4. Persona E2E con `deleted_at = null`, `estado = 'activo'`.

Si algo no coincide, ir al escenario correspondiente.

---

## 20. Contacto de escalación

### Para issues operativos no resueltos por este runbook

| Severidad | Acción |
|---|---|
| Alta (sistema caído, datos perdidos) | Yair (yair@levywald.com) inmediato + crear POST-MORTEM |
| Media (función rota pero workaround disponible) | Documentar en CURRENT-STATE.md §6 + plantear en próximo sprint |
| Baja (deuda técnica) | Agregar a §6 con sprint planeado |

### Para issues estructurales (cambios arquitectónicos)

1. Crear RFC siguiendo `docs/RFC-TEMPLATE.md`.
2. Compartir con stakeholders (hoy: Yair + arquitecto Opus).
3. Aprobado → ADR canonizado en `DECISIONS.md` antes de implementar.

### Contactos externos

- **Supabase support:** vía dashboard, plan Pro con response time <24h.
- **Vercel support:** vía dashboard, plan Pro con response time <24h.
- **Anthropic API (Claude):** status.anthropic.com para incidentes.

---

## Escenario: Cierre de sprint — los 4 niveles de verificación

Un sprint no se declara completo hasta que pasa los 4 niveles de
verificación que se listan a continuación. Cada nivel verifica algo
distinto. Saltar un nivel es asumir un riesgo conocido.

### Nivel 1 — Build local

**Qué verifica:** que el código compila sin errores de tipo y los
linters no tienen rojos.

**Cómo:**
```bash
npm run validate:all
```

Esperado: tests passed, linter OK, tsc sin errores.

**Qué NO verifica:**
- Si el código compila en Vercel (env vars distintas, build cache, etc.)
- Si la app deployada renderiza
- Si los server actions funcionan en runtime
- Si las queries a DB devuelven lo esperado

### Nivel 2 — Deploy verde en Vercel

**Qué verifica:** que Vercel construyó el bundle y lo deployó a
producción sin errores en el pipeline.

**Cómo:** vía MCP `claude.ai Vercel`, tool `list_deployments`:
- projectId, teamId del proyecto
- Verificar `state=READY` del último deploy del commit final

**NUNCA** verificar vía `vercel deploy` CLI local (regla R-PE10
canonizada en DOCS-5, ADR-039).

**Qué NO verifica:**
- Si las server actions ejecutan correctamente en runtime
- Si las queries a DB devuelven los datos esperados
- Si el flujo del usuario funciona end-to-end

### Nivel 3 — Verificación funcional vía MCP

**Qué verifica:** que el schema y los datos de producción reflejan
los cambios esperados del sprint.

**Cómo:** vía MCP `claude.ai Supabase`, tool `execute_sql`:
- Confirmar tablas/funciones/triggers creados
- Confirmar datos sembrados (catálogos, módulos activados, etc.)
- Confirmar constraints aplicados (CHECK, UNIQUE, FK)
- Confirmar RLS habilitada en tablas nuevas

**Qué NO verifica:**
- Si la UI llama correctamente a los server actions
- Si los server actions manejan correctamente los casos edge
- Si el flujo desde el clic del usuario hasta la fila en DB funciona

### Nivel 4 — End-to-end contra producción

**Qué verifica:** que el flujo completo del usuario funciona en
producción real, no en tu entorno local.

**Cómo:**
```bash
cd <repo> && PLAYWRIGHT_BASE_URL=<url-prod> npx playwright test <archivo>.spec.ts
```

Tests deben tener fixture real + cleanup garantizado (ADR-038).

**Es el único nivel que detecta:**
- Bugs en server actions que solo se ven en runtime
- Mismatches entre el schema declarado y el real (ej: columnas
  inexistentes, indexes parciales incompatibles con onConflict)
- Bugs de permisos que el build local no detecta
- Problemas de timing/race conditions en optimistic UI
- Edge cases del flujo del usuario que pruebas unitarias no cubren

### Resumen

| Nivel | Detecta | No detecta |
|---|---|---|
| 1. Build | Errores de tipo, sintaxis | Comportamiento en runtime |
| 2. Deploy | Errores de build en Vercel | Comportamiento de la app |
| 3. Funcional MCP | Schema/data en prod | Flujo del usuario |
| 4. E2E | Flujo completo en prod | (es el último nivel) |

**Los 4 niveles son acumulativos. Saltarse un nivel = riesgo conocido.**

Para sprints que tocan UI, server actions o lógica de negocio, los
4 niveles son obligatorios. Para sprints documentales (DOCS-N), los
niveles 1 y 2 alcanzan (no hay UI ni server actions nuevos).

---

## Anti-patrones detectados en producción

Catálogo acumulativo de bugs reales detectados mediante E2E contra
producción que NO fueron capturados por build local ni verificación
de schema. Cada entrada tiene: causa, detección, fix, lección.

Este catálogo se consulta al diseñar nuevos sprints para evitar
caer en los mismos patrones. Cada bug acá agrega una restricción
implícita al envelope canónico.

---

### AP-001 — Asumir `deleted_at` en tablas sin soft-delete uniforme

**Sprint origen:** FASE 3.1 (12-may-2026)
**Archivo afectado:** `modules/asistencias/lib/permisos.ts`

**Causa raíz:**
Al diseñar el server action de verificación de permisos, se asumió
que la tabla `personas_atributos` tenía columna `deleted_at` por
herencia de ADR-030 (soft-delete uniforme). En realidad, ADR-030
es aspiracional: tablas viejas como `personas_atributos` no tienen
esa columna todavía.

El código tenía:
```ts
.eq('atributo_slug', 'tenant.admin')
.eq('activo', true)
.is('deleted_at', null)  // ← columna inexistente
.maybeSingle()
```

PostgREST devuelve un error que termina interpretándose como "el
usuario no tiene el atributo". Resultado: el permiso de `tenant.admin`
silenciosamente niega acceso a TODOS los usuarios.

**Detección:**
E2E contra producción retornó "Sin permiso para tomar asistencia
en este evento" para el usuario admin de prueba. Investigación
posterior reveló que el filtro `deleted_at` estaba fallando.

**Fix aplicado (commit 917476e):**
Eliminar `.is('deleted_at', null)` de la query. Mantener solo
`.eq('activo', true)` que sí existe en la tabla.

**Lección canonizada:**
ADR-030 (soft-delete uniforme) describe el estado deseado, NO el
estado actual del schema. Antes de aplicar `.is('deleted_at', null)`
en una query, verificar con `information_schema.columns` que la
columna existe en la tabla destino.

**Mitigación preventiva:**
En sprints que toquen tablas existentes, agregar a la verificación
inicial del prompt una query como:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = '<tabla>' AND column_name = 'deleted_at';
```

Si no existe, NO aplicar el filtro y considerar agregar la columna
como deuda separada (no inline en el sprint).

---

### AP-002 — `upsert + onConflict` con partial unique index

**Sprint origen:** FASE 3.1 (12-may-2026)
**Archivo afectado:** `modules/asistencias/lib/auto-poblar.ts`

**Causa raíz:**
Para garantizar idempotencia del auto-poblado de invitados, se usó:
```ts
await supabase.from('evento_invitados').upsert(rows, {
  onConflict: 'evento_id,persona_id',
  ignoreDuplicates: true,
})
```

El unique index `uniq_evento_invitados_persona` es **parcial** (tiene
WHERE clause) porque el modelo es polimórfico:
```sql
CREATE UNIQUE INDEX uniq_evento_invitados_persona
  ON evento_invitados (evento_id, persona_id)
  WHERE persona_id IS NOT NULL AND deleted_at IS NULL;
```

PostgREST `onConflict` requiere un unique constraint **completo**, NO
parcial. El upsert falla en runtime con 500. El error es difícil de
diagnosticar porque la query parece correcta a primera vista.

**Detección:**
E2E contra producción retornó 500 al cargar la pantalla de asistencia
(porque dispara auto-poblado).

**Fix aplicado (commit b2d8147):**
Reemplazar `upsert` por patrón **check-then-insert**:
1. Query: traer todos los invitados existentes del evento
2. Filtrar en JS: solo nuevos (no presentes en la lista)
3. Insert directo (sin `onConflict`) de los nuevos

```ts
const { data: existentes } = await supabase
  .from('evento_invitados')
  .select('persona_id')
  .eq('evento_id', evento_id)
  .is('deleted_at', null)

const personasYaInvitadas = new Set(existentes?.map(e => e.persona_id))
const nuevos = rowsParaInsertar.filter(r => !personasYaInvitadas.has(r.persona_id))

if (nuevos.length > 0) {
  await supabase.from('evento_invitados').insert(nuevos)
}
```

**Lección canonizada:**
Modelos polimórficos (CHECK exactly_one_not_null) requieren unique
indexes parciales por diseño. PostgREST `onConflict` NO funciona
con indexes parciales. Para idempotencia en esos casos, usar
check-then-insert en lugar de upsert.

**Mitigación preventiva:**
Cuando un sprint use tabla con modelo polimórfico (persona/entidad/
equipo o similar), nunca usar `.upsert()` con `onConflict`. Default
a check-then-insert.

Agregar al prompt envelope una verificación: "¿La tabla destino
tiene unique index parcial? Si sí, NO usar upsert."

---

### Escenario: AP-003 — PostgREST FK joins no confiables

**Detectado:** Sprint 3.4 (12-may-2026), commit `090c30b`.

**Síntoma:** un `select('*, padron:padrones(*)')` via PostgREST
puede devolver `null` inesperado o data inconsistente, especialmente
cuando hay constraints de RLS o FK complejos. Esto provoca
`TypeError: Cannot read property 'X' of null` en runtime, sin
detección en build.

**Causa raíz:** el comportamiento del FK embedding en PostgREST
depende del estado de la conexión, RLS policies, y el orden de
evaluación interno. No es completamente predecible.

**Anti-patrón:** confiar en joins via PostgREST para data crítica
de runtime.

**Patrón correcto:** para datos críticos (no opcionales, no
analíticos), hacer queries separadas y joinear en TypeScript.

```typescript
// ❌ NO confiable:
const { data } = await supabase
  .from('nominas_externas')
  .select('*, padron:padrones(*)')
  .eq('id', nominaId)
  .single()

// ✅ Confiable:
const { data: nomina } = await supabase
  .from('nominas_externas').select('*').eq('id', nominaId).single()
const { data: padron } = await supabase
  .from('padrones').select('*').eq('id', nomina.padron_id).single()
```

**Cuándo es OK usar joins via PostgREST:** dashboards de solo
lectura, agregaciones donde un null se maneja explícitamente, datos
no críticos para el flujo.

---

### Escenario: AP-004 — Slugs case-sensitive en catálogos

**Detectado:** Sprint 3.4 (12-may-2026), commit `8f9350e`.

**Síntoma:** un insert con `tipo_documento='DNI'` falla con error
de FK constraint cuando el catálogo tiene el slug en lowercase
(`'dni'`). El error es difícil de debuggear porque parece un
problema de FK pero es de case-sensitivity de strings.

**Causa raíz:** Postgres compara strings con case-sensitivity en
FK constraints. `'DNI' != 'dni'` aunque visualmente parecen iguales.

**Anti-patrón:** hardcodear valores de catálogo sin verificar el
case exacto.

**Patrón correcto:** antes de hardcodear cualquier valor que vaya a
FK contra un catálogo, verificar vía MCP:

```sql
SELECT slug FROM catalogo_tipos_documento ORDER BY slug;
```

O mejor: importar los slugs desde un archivo TS compartido que
sirva como source of truth en código.

**Catálogos del proyecto con convención lowercase:** todos los
`catalogo_*` del schema usan lowercase para `slug`. Mantener esta
convención.

---

### Escenario: AP-005 — CHECK constraints no se auto-actualizan al agregar valores a catálogos

**Detectado:** Sprint 3.5 (12-may-2026), migration in-sprint.

**Síntoma:** insertar fila en `padrones` con `tipo='visitantes_temporales'`
falla con violación de CHECK constraint `padrones_tipo_check`,
aunque el valor existe lógicamente en el catálogo.

**Causa raíz:** algunas tablas usan CHECK constraint con lista
hardcoded de valores permitidos (en lugar de FK a un catálogo).
Cuando se introduce un valor nuevo, hay que UPDATEAR el CHECK
también — no se actualiza solo.

**Anti-patrón:** agregar valor nuevo a un catálogo controlado por
CHECK constraint sin actualizar el CHECK.

**Patrón correcto:** cuando se introduce un nuevo valor en cualquier
catálogo, en la MISMA migration:

1. Verificar si hay CHECK constraint que limite los valores:
   ```sql
   SELECT conname, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid='<tabla>'::regclass
     AND contype='c';
   ```
2. Si existe, hacer DROP + recreate con el nuevo valor incluido.

**Mejor patrón a futuro:** migrar de CHECK constraint a FK contra
una tabla catálogo. Esto se hará gradualmente en FASE 15 (Hardening).

---

### Escenario: AP-006 — Sprint que crea módulo nuevo debe agregar entrada al sidebar

**Detectado:** validación post-Sprint 3.5 (12-may-2026, hora 19:00).

**Síntoma:** módulos creados en Sprints 3.3 (acceso) y 3.4
(nóminas externas) tienen rutas funcionales y deployadas, pero
no hay link de descubrimiento en el sidebar. El usuario que no
sabe la URL no puede llegar a la pantalla.

**Causa raíz:** el envelope canónico de los sprints describe
detalle de DB, server actions, UI, tests, pero NO menciona
explícitamente la integración con el sidebar troncal.

**Anti-patrón:** cerrar un sprint que creó un módulo activable por
tenant sin agregar entrada al sidebar (o sin canonizar el motivo
de por qué no debería estar).

**Patrón correcto:** todo sprint que crea o activa un módulo en
`tenant_modulos` para Hindu debe, como parte de su PARTE de UI:

1. Agregar entrada al sidebar (`components/layout/sidebar.tsx`).
2. Decidir en qué sección va (CRM, ERP, Club Deportivo, Plataforma).
3. Si va como sub-item de una sección existente (ej: Operaciones),
   agregarlo al array correspondiente.

**Excepciones documentadas:** módulos accesibles solo por API o
solo por roles específicos no admin (ej: pantallas dedicadas a
guardia que viven en `/admin/acceso` pero deberían tener su propio
layout simplificado en el futuro) pueden quedar fuera del sidebar
con justificación escrita.

---

## Modelo operativo Yair / Arquitecto

Canonizado el 12-may-2026 en respuesta a la delegación explícita
del rol arquitectónico operativo de Yair al Arquitecto (Claude
Opus en chat web). Este modelo aplica desde Sprint DOCS-7
en adelante.

### Por qué existe este modelo

A partir del 12-may-2026, el proyecto entra en una fase de
ejecución sostenida (FASES 4 a 17). Pedirle a Yair que valide
cada decisión operativa (orden, alcance, tests, naming) genera
fricción innecesaria y lentifica el avance.

El modelo divide responsabilidad: Yair decide el QUÉ; el
Arquitecto decide el CÓMO; Code ejecuta.

### Yair Levy Wald — Dueño de producto

**Decide:**
- Visión: qué hace el sistema, para quién, con qué objetivo
- Scope macro: qué fases entran al MVP, cuáles se postergan
- Modelo de negocio: pricing, contratos, ofertas
- Aprobación de RFCs antes de su sprint asociado
- Cambios estructurales: arquitectura mayor, stack, plan
- Decisiones legales / comerciales / contractuales
- Reasignación de roles

**No decide:**
- Orden interno de sprints dentro de fase aprobada
- Modelos de datos específicos
- Patrones de código
- Naming, testing, anti-patrones internos

### Arquitecto — Claude Opus en chat web

**Decide:**
- Orden de sprints respetando dependencias técnicas
- Alcance y tamaño de cada sprint
- Modelo de datos: tablas, columnas, FK, índices, RLS, CHECK
- Patrones de código: server actions, hooks, queries, validación
- Estructura modular: cómo dividir módulos, qué va en troncal
- Cómo testear: E2E vs integración vs unit, fixture vs mock
- Si requiere pre-mortem (R-PE9): scoring del riesgo
- Renumeración cuando hay desincronización docs
- Anti-patrones (AP-NNN) cuando bug en prod enseña algo
- ADRs para decisiones técnicas que requieren preservar contexto
- Cuándo cortar el día / cuándo seguir
- Cuándo solicitar input estructural a Yair (preguntas tappables)

**Responsabilidades operativas (no negociables):**
- Verificación vía MCP en cada cierre de sprint (R-PE10, ADR-039)
- Aplicación del envelope canónico en cada prompt
- Mantenimiento de docs vivos al día (CURRENT-STATE, SPRINT-PLAN,
  GLOSSARY, DECISIONS, RUNBOOK)
- Canonización de anti-patrones cuando aparecen
- Cierre ejecutivo al Drive en días significativos

### Implementador — Claude Code en CLI

**Ejecuta:**
- Los prompts canónicos que arma el Arquitecto
- Verificaciones iniciales declaradas en PARTE 1 de cada prompt
- Reporte de cierre usando el FOOTER canonizado (R-PE10)

**Restricciones inviolables:**
- NO afirmar estado de producción sin verificar vía MCP (ADR-039)
- NO usar `.is('deleted_at', null)` en tablas sin verificar (AP-001)
- NO usar `upsert + onConflict` contra unique indexes parciales
  (AP-002)
- NO confiar en PostgREST FK joins para data crítica (AP-003)
- Verificar case-sensitivity de slugs en catálogos (AP-004)
- Actualizar CHECK constraints cuando se agrega valor a catálogo
  (AP-005)
- Agregar entrada al sidebar cuando se crea módulo nuevo (AP-006)

### Cómo se manifiesta en la práctica

#### Cuando llega un input de Yair

El Arquitecto evalúa:
- ¿Es decisión de producto / scope / negocio? → toma como brief
  y diseña sprint(s)
- ¿Es decisión técnica? → la toma el Arquitecto
- ¿Es ambigua? → pide clarificación vía `ask_user_input_v0`
  (max 3 preguntas tappables)

#### Cuando hay 2+ opciones técnicas con tradeoff serio

El Arquitecto:
1. Presenta las opciones con sus tradeoffs
2. Da su voto técnico con razones
3. Pide validación de Yair (`ask_user_input_v0`)
4. Procede con la elegida

#### Cuando aparece un bug o error inesperado

El Arquitecto:
1. Verifica vía MCP la realidad (no confía en el reporte de Code)
2. Decide si el problema requiere fix, nuevo ADR, nuevo AP, o nada
3. Canoniza el aprendizaje en RUNBOOK si tiene valor preventivo
4. Avisa a Yair solo si requiere decisión estructural

#### Cuando el día termina

El Arquitecto:
1. Verifica que todos los sprints del día estén cerrados con tag
2. Verifica vía MCP el estado final de producción
3. Arma el cierre ejecutivo del día (estructurado)
4. Le pasa el archivo a Yair para que lo suba al Drive

### Cuando el modelo se actualiza

Cambios menores (clarificaciones, ejemplos): el Arquitecto los
agrega al RUNBOOK sin consultar.

Cambios estructurales (qué decide quién): requieren confirmación
explícita de Yair en el chat. Quedan canonizados en una nueva
sección de este RUNBOOK + actualización de CLAUDE.md.

---

## Histórico de actualizaciones

| Fecha | Sprint | Cambios |
|---|---|---|
| 2026-05-12 | DOCS-2 | Versión inicial con 20 escenarios |
| 2026-05-12 | DOCS-6 | Sección "Niveles de verificación" + sección "Anti-patrones" con AP-001 y AP-002 |
| 2026-05-12 | DOCS-7 | AP-003 a AP-006 + sección "Modelo operativo Yair / Arquitecto" |


=====================================================================
INICIO ADDENDUM — agregado el 2026-05-13
=====================================================================

RUNBOOK-ADDENDUM — Protocolos de cierre de sprint y fase  
\=============================================================

Versión: 1.0 (addendum, no reemplaza RUNBOOK.md vigente)  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Aplicación: append al final de docs/RUNBOOK.md (separado por sección clara)

PROPÓSITO DEL ADDENDUM  
\=======================

Este addendum extiende RUNBOOK.md (vigente, \~42K) con los protocolos canonizados de cierre de sprint y cierre de fase derivados del nuevo PROMPT-TEMPLATE.md.

Los procedimientos operativos vigentes del RUNBOOK (modelo Yair/Arquitecto/Code, workflows de deploy, verificación MCP, escalamiento) se mantienen sin cambios.

PROTOCOLO DE CIERRE DE SPRINT (referencia PROMPT-TEMPLATE PARTE 10\)  
\=====================================================================

Al cerrar CADA sprint, Code ejecuta este protocolo en ORDEN. Cualquier desviación se reporta al arquitecto.

PASO 10.1 — Actualizar docs vivos del repo  
\- /docs/CURRENT-STATE.md → sprint \[ID\] cerrado, métricas DB actualizadas, tag nuevo  
\- /docs/SPRINT-PLAN.md → sprint \[ID\] marcado DONE, próximo señalado  
\- /docs/GLOSSARY.md → términos nuevos agregados (si los hay)  
\- /docs/ROADMAP.md → sprint \[ID\] en estado DONE  
\- /docs/DATA-MODEL.md → tablas/columnas/funciones/triggers/RLS nuevas  
\- /docs/MODULE-CATALOG.md → módulo nuevo o cambio de estado  
\- /docs/VISUAL-GALLERY.md → screenshots de pantallas nuevas con paths

PASO 10.2 — Commit principal del feature  
git add \[paths del feature\]  
git commit \-m "feat(\[modulo\]): \[descripción corta\] (Sprint \[ID\])"

PASO 10.3 — Commit separado de docs  
git add docs/  
git commit \-m "docs: update \[docs tocados\] for Sprint \[ID\]"

PASO 10.4 — Tag explícito  
git tag v\[X.Y.Z\]-\[fase\]-sprint\[N\]  
git push origin main \--tags

PASO 10.5 — Cierre ejecutivo en Drive  
\- Crear documento "CIERRE-SPRINT-\[ID\]" en Drive \`\_Cierre Ejecutivo/\`  
\- Contenido: métricas del sprint, lo construido, decisiones tomadas, deuda generada, links a commit y deploy  
\- Aplicar R-DOC1: contenido textual del repo o linker, nunca paráfrasis

PASO 10.6 — Screenshots de pantallas nuevas (PROMPT-TEMPLATE PARTE 7\)  
\- Capturar pantallas nuevas o modificadas vía Playwright (page.screenshot())  
\- Subir a Drive en \`\_Cierre Ejecutivo/sprint-\[ID\]/screenshots/\` o \`\_Verticales/\[vertical\]/galeria/sprint-\[ID\]/\`  
\- Actualizar VISUAL-GALLERY.md con los paths

PASO 10.7 — Reporte al arquitecto

Devolver al arquitecto con este formato fijo:

\`\`\`  
Sprint \[ID\] cerrado.

Commits:  
\- feat: \[hash\] — \[mensaje\]  
\- docs: \[hash\] — \[mensaje\]  
\- tag: v\[X.Y.Z\]-\[fase\]-sprint\[N\]

Deploy:  
\- Vercel deploy ID: \[dpl\_xxx\]  
\- URL: \[url\]  
\- Estado: READY

Pre-mortem:  
\- Riesgos materializados: \[ninguno | Sn mitigado, Sn materializado y resuelto\]  
\- Riesgos nuevos identificados: \[si los hay\]

Verificación PARTE 1:  
\- \[resumen 1 línea de cada query\]

Tests:  
\- Inicio: N specs  
\- Cierre: N+M specs  
\- Pasando: N+M / N+M  
\- Skipped: 0  
\- Failed: 0

Migration:  
\- Tablas creadas: \[lista\]  
\- Funciones creadas: \[lista\]  
\- Triggers creados: \[lista\]  
\- RLS policies: \[lista\]  
\- Catalogos seedeados: \[lista\]

Desviaciones de scope:  
\- Ninguna | \[Lista con justificación\]

Cierre ejecutivo en Drive:  
\- URL: \[Drive doc\]

Próximo sprint:  
\- \[ID\] \[Nombre\]  
\`\`\`

PROTOCOLO DE VERIFICACIÓN POR EL ARQUITECTO  
\=============================================

Cuando Code reporta el cierre, el arquitecto verifica vía MCP (no toma palabra de Code).

PASO V.1 — Verificar commits  
\- Vía GitHub MCP: confirmar hash de feat y docs commits \+ tag aplicado  
\- Confirmar push a main exitoso

PASO V.2 — Verificar Supabase  
\- Vía Supabase MCP: confirmar tablas, columnas, funciones, triggers nuevos  
\- Ejecutar queries de smoke test para validar data integrity

PASO V.3 — Verificar Vercel  
\- Vía Vercel MCP: confirmar deploy ID en estado READY  
\- Smoke test al URL del deploy (200 OK, render correcto)

PASO V.4 — Verificar tests E2E  
\- Confirmar que el test count subió de N a N+M  
\- Confirmar 0 failures, 0 skipped

PASO V.5 — Verificar Drive  
\- Confirmar que CIERRE-SPRINT-\[ID\] existe en \`\_Cierre Ejecutivo/\`  
\- Confirmar que VISUAL-GALLERY tiene los paths nuevos

PASO V.6 — Decisión binaria  
\- Si todos los checks pasan: sprint OFICIALMENTE cerrado. Pasar al siguiente.  
\- Si alguno falla: marcar el sprint como REOPENED, identificar la falla y mandar de vuelta a Code con instrucciones.

PROTOCOLO DE CIERRE DE FASE  
\=============================

Cuando todos los sprints de una FASE están cerrados, se ejecuta el protocolo de cierre de fase. Este NO lo ejecuta Code; lo ejecuta el arquitecto con Yair.

PASO F.1 — Revisión integral de la fase  
\- Leer todos los CIERRE-SPRINT-\[ID\] de la fase  
\- Identificar deuda generada (no resuelta en sprints individuales)  
\- Identificar decisiones arquitectónicas que ameriten ADR retroactivo  
\- Identificar términos nuevos para GLOSSARY

PASO F.2 — Actualización de docs estratégicos  
\- /docs/ARCHITECTURE.md → revisar si hay cambios arquitectónicos derivados  
\- /docs/DATA-MODEL.md → asegurar que refleja el modelo completo de la fase  
\- /docs/ROADMAP.md → marcar FASE como DONE  
\- /docs/SPRINT-PLAN.md → preparar lista de sprints de la siguiente fase

PASO F.3 — ADRs nuevos (si hay)  
\- Cualquier decisión arquitectónica tomada durante la fase que no esté ya en un ADR, se canoniza ahora  
\- Append a /docs/DECISIONS.md  
\- Asignar números correlativos (ADR-04N+)

PASO F.4 — Cierre ejecutivo de fase  
\- Crear documento "CIERRE-FASE-\[A/B/C/D/E\]" en Drive \`\_Cierre Ejecutivo/\`  
\- Métricas finales de la fase: número de sprints, costo total Code, tablas creadas, tests agregados, features deliverables  
\- Lista de decisiones tomadas  
\- Lista de deuda generada para fases futuras  
\- Lista de aprendizajes y mejoras al proceso

PASO F.5 — Tag de fase  
\- git tag v\[X.Y.Z\]-\[fase\]-completa  
\- git push origin main \--tags

PASO F.6 — Decisión binaria de avance  
\- Si la fase está aprobada: pasar a la siguiente fase  
\- Si hay deuda crítica: crear una fase correctiva (sprint correctivo) antes de pasar

PROTOCOLO ESPECIAL — F4 (VALIDACIÓN HINDU)
\============================================

F4 es distinta a las otras: no hay sprints técnicos sino actividades de validación.

C.1 — Reset DB  
\- Backup completo de la DB actual  
\- Reset del tenant Hindu en Supabase (mantener schema, vaciar datos productivos)

C.2 — Carga inicial por Yair  
\- Yair descarga templates de importación (CSV/Excel) vía la UI de admin  
\- Carga datos reales de Hindu vía importadores universales (Sprint A4)  
\- Verifica que cargas críticas funcionen (personas, equipos, eventos, cuotas)

C.3 — Operación durante 5-7 días  
\- Staff de Hindu (Yair \+ Juan Marco \+ admins designados) usa el sistema en operación real  
\- Diariamente recopilar feedback (Yair anota incidentes)

C.4 — Recopilación de feedback  
\- Lista de bugs encontrados  
\- Lista de features que faltaron  
\- Lista de mejoras de UX

C.5 — Decisión binaria  
\- Producto APROBADO: avanzar a F6
\- Producto REQUIERE F2': crear sprints correctivos antes de F6

C.6 — Documento de validación  
\- Crear "VALIDACION-F4" en Drive \`\_Cierre Ejecutivo/\`  
\- Firmas (formales o no) de Yair y stakeholders de Hindu  
\- Decisión escrita  
\- Próximo paso

CHECKLIST OPERATIVO RÁPIDO POR SPRINT  
\========================================

Para cualquier persona, IA o empresa que ejecuta un sprint usando PROMPT-TEMPLATE:

Antes de codear:  
\[ \] Leer todos los docs listados en BLOQUE A del prompt  
\[ \] Declarar capas tocadas (BLOQUE B)  
\[ \] Reportar pre-mortem (PARTE 0\) con mínimo 5 riesgos  
\[ \] Ejecutar verificación inicial (PARTE 1\) y reportar resultados

Durante el sprint:  
\[ \] Aplicar migration en transacción BEGIN/COMMIT (PARTE 2\)  
\[ \] Crear estructura modules/ según PARTE 3  
\[ \] Implementar integraciones según PARTE 4  
\[ \] Construir UI según PARTE 5 con data-testids declarados  
\[ \] Aplicar tokens de diseño según PARTE 6  
\[ \] Capturar mockups/screenshots según PARTE 7  
\[ \] Actualizar sidebar según PARTE 8  
\[ \] Construir tests E2E según PARTE 9 con cleanup try/finally

Al cerrar:  
\[ \] Actualizar docs vivos (PARTE 10.1)  
\[ \] Commit feature (PARTE 10.2)  
\[ \] Commit docs separado (PARTE 10.3)  
\[ \] Aplicar tag (PARTE 10.4)  
\[ \] Crear cierre ejecutivo en Drive (PARTE 10.5)  
\[ \] Subir screenshots (PARTE 10.6)  
\[ \] Reportar al arquitecto (PARTE 10.7)

CIERRE DEL ADDENDUM  
\====================

Este addendum se considera vigente. Los protocolos aquí definidos son obligatorios.

Cualquier sprint que se cierre sin cumplir el protocolo es un sprint INCOMPLETO y debe reabrirse.

Fin del addendum.  
