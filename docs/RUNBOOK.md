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
hasta FASE 16.

El switch a producción real es Sprint de FASE 16 que requiere:
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

## Histórico de actualizaciones

| Fecha | Sprint | Cambios |
|---|---|---|
| 2026-05-12 | DOCS-2 | Versión inicial con 20 escenarios |
