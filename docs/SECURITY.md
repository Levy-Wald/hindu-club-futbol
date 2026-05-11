# ClubCore — Security

> Políticas, controles y prácticas de seguridad. Estándar moderno sin
> certificación formal (SOC2/ISO27001 no entran en alcance 2026).
>
> Objetivo: proteger datos de tenants y usuarios contra amenazas comunes
> de SaaS PyME — no banking-grade pero sólido.
>
> Mantenido por el arquitecto.
>
> Última actualización: 10 de mayo de 2026.

---

## 1. Filosofía

### 1.1 Defensa en profundidad

Ningún control de seguridad funciona aislado. Cada operación atraviesa
múltiples capas: RLS de Postgres, validación zod en server action,
verificación de auth en middleware, sanitización de inputs en componente.
Si una falla, las otras protegen.

### 1.2 Aislamiento entre tenants es sagrado

La regla más importante del sistema: **un tenant nunca puede ver datos
de otro**. Cualquier bug que viole esto es un incidente de severidad
máxima — drop everything, fix, audit retrospectivo.

### 1.3 Mínimos privilegios

Toda credencial, key, role o permission se otorga al mínimo necesario.
Si un endpoint solo necesita leer, no se le da escritura. Si una API
key solo necesita acceso a personas, no se le da acceso a finanzas.

### 1.4 Secret never in code

Cero secretos hardcoded en el repositorio. Todo va por variables de
entorno o Supabase secrets. Validar antes de cada push.

### 1.5 Transparente con el usuario

El usuario tiene derecho a saber qué datos suyos guardamos, quién accede,
para qué. Audit log accesible. Exportación de datos personales viable.

---

## 2. Modelo de amenazas

### 2.1 Amenazas en alcance (que protegemos)

| Amenaza | Mitigación principal |
|---|---|
| **Cross-tenant data leak** | RLS + filtro en código + tests manuales |
| **SQL injection** | Supabase params + zod validation |
| **XSS** | React escape default + sanitización en inputs HTML |
| **CSRF** | SameSite cookies + headers en server actions |
| **Auth bypass** | Middleware en /admin/* + JWT verification |
| **Credential stuffing** | Rate limiting en /login |
| **Brute force** | Rate limiting + lockout temporal |
| **API key leak** | Scopes mínimos + rotación + tracking de uso |
| **Cron endpoint abuse** | CRON_SECRET en header |
| **File upload malicioso** | Type + size validation + storage policies |
| **Insider threat (admin del tenant)** | Audit log de acciones críticas |
| **Phishing al usuario final** | Email con dominio verificado SPF/DKIM/DMARC |
| **Exposición de PII en logs** | Reglas de logging explícitas |

### 2.2 Amenazas fuera de alcance (asumidas como bajo riesgo)

- **APTs (Advanced Persistent Threats):** no somos target Fortune 500.
- **0-days en Postgres/Supabase:** mitigación es upstream.
- **Compromiso físico de servidores:** Vercel/Supabase responsabilidad.
- **DDoS volumétrico:** Vercel/Cloudflare lo absorben.
- **Ransomware:** mitigación es backups (§14).

### 2.3 Compliance posicionada (no certificada)

- **GDPR-friendly:** principios respetados aunque no aplique
  estrictamente (clientes argentinos). Right to access, right to be
  forgotten, data minimization.
- **Ley 25.326 Argentina (Protección de Datos Personales):** cumplida
  por diseño.
- **SOC2 / ISO27001:** no buscamos. Si un cliente lo exige, se evalúa.

---

## 3. Autenticación

### 3.1 Mecanismo actual

Supabase Auth con email + password. Magic links como alternativa.

**Sin password:** ningún usuario admin tiene password hardcoded. Solo
magic link o reset de password.

### 3.2 Sesiones

- Cookies HTTP-only, Secure, SameSite=Lax.
- Lifetime: 7 días con refresh automático.
- Logout invalida sesión en backend (no solo en cliente).
- "Logout de todos los dispositivos" disponible en `/admin/mi-cuenta`.

### 3.3 Rate limiting de auth

- `/login` (POST): 5 intentos / 15 minutos por IP.
- `/api/auth/callback`: sin rate limit (manejado por Supabase).
- Lockout: 5 fallos en 15min → 30 min de bloqueo desde esa IP.

(Implementación pendiente — Sprint 15a junto con Resend.)

### 3.4 Two-factor authentication (futuro)

No implementado en 2026. Para Q3/Q4 si aparece demanda.

### 3.5 SSO empresarial (futuro)

Postergado. Si un cliente empresarial lo exige, se evalúa Google
Workspace / Microsoft Entra SAML.

---

## 4. Aislamiento multi-tenant

### 4.1 RLS habilitada en TODAS las tablas

Verificación obligatoria por migration:

```sql
ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;
```

Auditar con:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

Si retorna filas → vulnerabilidad crítica, fix inmediato.

### 4.2 Policies obligatorias por tabla

Toda tabla de negocio tiene mínimo 4 policies (SELECT, INSERT, UPDATE,
DELETE) que filtran por `tenant_id`.

Patrón estándar:

```sql
CREATE POLICY "tenant_isolation_select" ON public.<tabla>
FOR SELECT
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation_insert" ON public.<tabla>
FOR INSERT
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
-- (etc.)
```

Hoy `tenant_id` viene de `lib/tenant.ts` hardcoded. Migración a JWT
custom en Sprint 17b.

### 4.3 Filtro en código (defensa en profundidad)

Aunque RLS filtre, **el código también filtra**:

```ts
const { data } = await supabase
  .from('personas')
  .select('*')
  .eq('tenant_id', tenantId)  // ← obligatorio aunque RLS lo haga
  .limit(50);
```

Razón: si una RLS policy se rompe en un deploy, el filtro en código
protege. Doble cinturón.

### 4.4 Service role NUNCA en operaciones de usuario

El cliente service role bypassea RLS. Reglas:

- Solo en jobs de sistema (migrations, crons internos).
- Nunca en server action triggered por usuario.
- Si una server action necesita service role para algo específico
  (ej: crear tenant nuevo), aislar esa función y documentar por qué.

### 4.5 Testing manual de aislamiento

Procedimiento (ejecutar después de cambios en RLS):

1. Crear 2 tenants de prueba (T1, T2).
2. Crear datos en cada uno.
3. Logueado como usuario de T1, intentar SELECT/UPDATE/DELETE de datos
   de T2 vía SQL directo o API.
4. Resultado esperado: filas filtradas o 403, NUNCA leak.

Esto se hará formalmente en Sprint 17c con tests automatizados.

---

## 5. Validación de inputs

### 5.1 Zod obligatorio en server actions

Toda server action que reciba input externo (form, API call) valida con
zod:

```ts
const Schema = z.object({
  apellido: z.string().min(1).max(100).trim(),
  email: z.string().email().optional(),
  numero_documento: z.string().regex(/^\d{7,8}$/).optional(),
});

export async function crearPersona(input: unknown): Promise<ActionResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }
  // ... usar parsed.data
}
```

### 5.2 Validación en API REST

Endpoints `/api/v1/*` validan body con zod antes de procesar. Sin zod,
no se acepta input.

### 5.3 Sanitización HTML (cuando aplica)

Inputs que llegan a renderizarse como HTML (plantillas de comunicación,
descripciones rich-text) se sanitizan con DOMPurify o equivalente.
React escapa por default — la sanitización es solo para casos donde
permitimos HTML.

### 5.4 SQL injection

Imposible por arquitectura — Supabase client usa params siempre. No
construir queries SQL con string concatenation, ni siquiera para
debugging.

### 5.5 Path traversal en uploads

Nombre de archivo se sanitiza:
- Removidos: `../`, `..\`, slashes, caracteres especiales.
- Limitado a `[a-zA-Z0-9._-]{1,200}`.
- Renombrar a UUID si se prefiere (sin path del usuario).

---

## 6. Headers HTTP de seguridad

### 6.1 Headers obligatorios

Configurar en `next.config.js`:

```js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        // HSTS — fuerza HTTPS por 1 año
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        // No permite ser embebido en iframes (clickjacking)
        { key: 'X-Frame-Options', value: 'DENY' },
        // Bloquea MIME sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // Política de referrer
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Restricciones de browser APIs
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // Content Security Policy
        { key: 'Content-Security-Policy', value: cspPolicy },
      ],
    },
  ];
}
```

### 6.2 Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://*.supabase.co https://*.vercel.app;
font-src 'self';
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.mercadopago.com;
frame-ancestors 'none';
form-action 'self';
base-uri 'self';
```

`'unsafe-inline'` y `'unsafe-eval'` necesarios por Next.js + Tailwind.
Mitigación: review de inputs que terminan en HTML.

### 6.3 CORS

API endpoints (`/api/v1/*`) configuran CORS explícitamente:

- `Access-Control-Allow-Origin`: solo dominios permitidos del tenant
  (no `*`).
- `Access-Control-Allow-Credentials`: false por default.
- `Access-Control-Allow-Methods`: solo los necesarios (GET, POST,
  PATCH).

---

## 7. Rate limiting

### 7.1 Endpoints públicos

| Endpoint | Limit |
|---|---|
| `/login` (POST) | 5 / 15 min por IP |
| `/api/auth/callback` | manejado por Supabase |
| `/(public)/asociate` (POST pre-inscripción) | 3 / hora por IP |
| `/api/v1/*` (cuando aplique) | según scope de la API key, default 100/min |
| `/api/cron/*` | sin rate limit, protegido por CRON_SECRET |

### 7.2 Implementación

Sprint 15a / 15b: usar Vercel Edge Middleware con Upstash Redis o
equivalente para tracking.

Pseudocódigo:

```ts
const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
const key = `rate-limit:${endpoint}:${ip}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, windowSeconds);
if (count > maxRequests) {
  return new Response('Too Many Requests', { status: 429 });
}
```

### 7.3 Bypass para tenants premium (futuro)

Cuando hay clientes pagos, considerar tiers de rate limit. No urgente.

---

## 8. Manejo de secrets

### 8.1 Variables de entorno

**Producción (Vercel):**

| Variable | Sensibilidad | Quién accede |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | Cualquiera |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Cualquiera (RLS protege) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Crítica** | Solo Vercel, nunca expuesta |
| `RESEND_API_KEY` | Crítica | Solo Vercel |
| `MERCADOPAGO_ACCESS_TOKEN` | Crítica | Solo Vercel |
| `CRON_SECRET` | Crítica | Solo Vercel |
| `DATABASE_URL` (si se usa) | Crítica | Solo Vercel |

### 8.2 Variables prefijadas con NEXT_PUBLIC_ son PÚBLICAS

Cualquier variable que arranque con `NEXT_PUBLIC_` se bundlea en el JS
del cliente. **Nunca poner secretos ahí.** Auditar antes de deploy.

### 8.3 Local development

Variables locales en `.env.local` (gitignored por default). Validar
gitignore antes de commitear.

NUNCA commitear `.env` con secretos. Si pasa: rotar inmediatamente y
purgar del historial git.

### 8.4 Rotación

Frecuencia obligatoria:

- `SUPABASE_SERVICE_ROLE_KEY`: cada 6 meses o ante sospecha.
- `RESEND_API_KEY`: cada 12 meses.
- `MERCADOPAGO_ACCESS_TOKEN`: cada 6 meses.
- `CRON_SECRET`: cada 12 meses.
- API keys de usuarios del SaaS: configurable, default cada 12 meses.

Después de cada rotación, validar que el sistema sigue operativo y que
la key anterior está revocada.

### 8.5 Secrets nunca en logs

Reglas de logging (§10) explícitamente prohíben loguear:
- API keys completas (solo prefijo "sk_..." si es necesario para
  debugging)
- Passwords
- Tokens JWT
- Headers de Authorization

---

## 9. Datos personales y privacidad

### 9.1 Clasificación de datos

| Nivel | Ejemplo | Tratamiento |
|---|---|---|
| **Público** | Nombre del tenant, branding | Sin restricción |
| **Operativo** | Nombre, equipo, padrón | Visible para staff del tenant |
| **Sensible (PII)** | DNI, email, teléfono, dirección | RLS estricta, audit log |
| **Crítico (PII especial)** | Datos médicos, datos económicos | Módulos activables, audit + permisos extra |

### 9.2 Datos sensibles — reglas

- Tablas `personas_datos_medicos`, `personas_documentos_medicos`,
  `personas_datos_economicos`, `personas_obra_social`: acceso restringido
  por permiso adicional dentro del tenant (no todo staff puede verlos).
- Visualización en UI: indicar explícitamente "Datos sensibles" con
  badge.
- Export con membrete: requiere confirmación si incluye PII especial.

### 9.3 Right to access (acceso del usuario a sus datos)

Toda persona del sistema puede ver sus propios datos:
- Su ficha en `/admin/mi-perfil`
- Sus pagos, cuotas, suscripciones
- Solicitar exportación completa de sus datos en formato JSON o PDF.

Implementación: Sprint 16+, postergado pero declarado.

### 9.4 Right to be forgotten

Soft delete por default. Hard delete con confirmación dual (persona o
tutor + admin).

- Soft delete: `activo=false`, `fecha_baja`, datos sensibles
  anonimizados pero relación histórica preservada (por integridad de
  registros financieros, etc.).
- Hard delete: solo si la persona nunca tuvo movimientos financieros.

### 9.5 Data minimization

Solo capturamos lo que el tenant necesita operar. Módulos activables
controlan qué tablas se usan por tenant.

### 9.6 Retención

- Audit log: 24 meses, después se archiva/elimina.
- Logs de Vercel: 30 días (default Vercel).
- Backups: 30 días rolling.
- Datos operativos: indefinido mientras el tenant siga activo.
- Tenant dado de baja: 90 días para restauración, después purga.

---

## 10. Audit log

### 10.1 Qué se loguea

Operaciones críticas:

- Login / logout
- Cambio de password
- Crear / modificar / eliminar persona, entidad
- Cambios en atributos (especialmente admin)
- Cambios en padrones y equipos
- Movimientos financieros (crear, anular)
- Emisión de cuotas
- Generación de exports / reportes
- Acceso a datos médicos
- Cambios de configuración del tenant
- Onboarding de tenant nuevo

### 10.2 Qué NO se loguea

- Passwords (jamás)
- Tokens JWT
- Contenido de comunicaciones privadas (solo metadata: enviado a quién,
  cuándo)
- Datos médicos en su contenido (solo "Se accedió a datos médicos de
  persona X")
- Búsquedas casuales (genera ruido)

### 10.3 Estructura

Tabla `audit_log`:

```
id, tenant_id, usuario_id, accion, tabla, registro_id,
datos_antes (jsonb), datos_despues (jsonb), ip_address,
user_agent, timestamp
```

Campos `datos_antes`/`datos_despues` redactan PII especial (no guardan
contenido médico, solo flag de "modificado").

### 10.4 Consulta

`/admin/configuracion/audit-log` (Sprint 16+): admin del tenant puede
filtrar por usuario, acción, fecha, recurso afectado.

---

## 11. API REST y scopes

### 11.1 API keys

Estructura:

```
clb_<env><tenant_short><random>
ej: clb_live_hindu_a1b2c3d4e5f6
```

Almacenadas hasheadas en `api_keys`. Mostradas solo una vez al crearlas.

### 11.2 Scopes

Definidos en `lib/api/scopes.ts`. Patrón:

```
<recurso>:<accion>
ej: personas:read, personas:write, finanzas:read
```

Cada endpoint declara qué scopes requiere. Verificación en
`lib/api/auth.ts`.

### 11.3 Logging de uso

Toda llamada a `/api/v1/*` se registra en `api_logs`:
- API key ID (no la key completa)
- Endpoint
- Status code
- Latency
- IP de origen
- Timestamp

Limpieza automática: cron `cleanup-api-logs` los domingos elimina
registros > 90 días.

### 11.4 Throttling por key

Default: 100 requests/min por key. Configurable por scope si hace
falta.

---

## 12. Storage (archivos subidos)

### 12.1 Buckets configurados

| Bucket | Tipo | Tamaño máx | RLS |
|---|---|---|---|
| `private-fotos-personales` | Privado | 5 MB | Por tenant + persona |
| `private-documentos` | Privado | 10 MB | Por tenant + persona |
| `tenant-branding` | Público (lectura) | 500 KB | Por tenant |

### 12.2 Validación al subir

Server action verifica:

- MIME type whitelist (imagen: jpg/png/webp; doc: pdf/jpg/png)
- Tamaño (límite por bucket)
- Magic number coincide con extensión declarada (anti-spoof)
- Nombre sanitizado (§5.5)
- Si es imagen, no contiene EXIF GPS (privacidad)

### 12.3 Anti-malware

Para 2026: validación por tipo + tamaño. No corremos clamav.
**Si llega cliente regulado (salud, banca, gob) → integrar
Cloudflare/AWS scan.** No en alcance actual.

### 12.4 Storage policies

```sql
-- Lectura: solo si la persona pertenece al tenant del path
CREATE POLICY "tenant_read" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'private-documentos'
  AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);
```

---

## 13. Crons y endpoints internos

### 13.1 Protección con CRON_SECRET

Toda llamada a `/api/cron/*` debe incluir:

```
Authorization: Bearer <CRON_SECRET>
```

Vercel Cron lo envía automáticamente cuando se configura el cron en
`vercel.json`. Endpoints rechazan llamadas sin el header.

```ts
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... lógica del cron
}
```

### 13.2 Crons configurados (2026-05)

- `/api/cron/dispatch-vencimientos` — diario 9:00 ART
- `/api/cron/cleanup-api-logs` — domingos 3:00 ART

### 13.3 Idempotencia

Cron jobs son idempotentes — si Vercel los re-ejecuta por failure, no
genera duplicados.

---

## 14. Backups y disaster recovery

### 14.1 Backups Supabase

Plan actual: backups automáticos diarios de Supabase, retención
configurable.

**Verificar mensualmente** que los backups existen y son restaurables.

### 14.2 Point-in-time recovery

Habilitar PITR en Supabase si el plan lo permite (Pro+). Permite
restaurar a cualquier momento dentro de la ventana de retención.

### 14.3 Disaster recovery plan

**Escenarios cubiertos:**

| Escenario | RTO objetivo | Acción |
|---|---|---|
| Bug que corrompe datos de un tenant | 1 hora | Restore selectivo desde backup |
| Drop accidental de tabla | 2 horas | Restore full + replay deltas |
| Cuenta Supabase comprometida | 4 horas | Restore en cuenta nueva + rotar todo |
| Vercel down completo | 8 horas | Esperar (sin alternativa hoy) |

RTO = Recovery Time Objective.
RPO (Recovery Point Objective) = 24h con backups diarios, 1h con PITR.

### 14.4 Drills (futuro)

Postergado a Q4 2026. Cuando haya múltiples tenants pagos, hacer drill
trimestral de restore.

### 14.5 Export de datos del tenant

Por buen servicio: tenants pueden exportar todos sus datos en JSON +
SQL en `/admin/configuracion/exportar-todo`. Sprint 16+.

---

## 15. Incident response

### 15.1 Clasificación

| Severidad | Ejemplo | Tiempo de respuesta |
|---|---|---|
| **S0 — Crítica** | Cross-tenant data leak, auth bypass, credenciales comprometidas | Inmediata, todo el equipo |
| **S1 — Alta** | Privilege escalation dentro del tenant, exposure de PII especial | < 4 horas |
| **S2 — Media** | Bug de seguridad sin exploit conocido, vulnerabilidad en dep | < 24 horas |
| **S3 — Baja** | Hardening pendiente, mejora menor | Próximo sprint |

### 15.2 Procedimiento ante incidente S0/S1

1. **Contener.** Deshabilitar la feature/endpoint afectado.
2. **Investigar.** Logs, audit log, queries. Identificar alcance.
3. **Notificar.** Yair primero, después tenants afectados si aplica.
4. **Remediar.** Fix + deploy + validar.
5. **Audit retrospectivo.** Documentar en `DECISIONS.md` qué pasó, qué
   se mejoró, cómo evitarlo a futuro.
6. **Rotar credenciales** si hubo exposición.

### 15.3 Comunicación a clientes

Si un incidente afecta datos de un cliente: notificar dentro de 72hs
con:
- Qué pasó
- Qué datos afectados
- Qué hicimos
- Qué deben hacer ellos

Modelo de email pre-armado en plantillas (Sprint 16+).

---

## 16. Anti-patrones de seguridad prohibidos

| # | Anti-patrón |
|---|---|
| SEC-A1 | Variables `NEXT_PUBLIC_*` con secretos |
| SEC-A2 | Service role en operaciones de usuario |
| SEC-A3 | RLS deshabilitada en tabla de negocio |
| SEC-A4 | Server action sin validación zod |
| SEC-A5 | Query SQL construida con string concat (no params) |
| SEC-A6 | Endpoint sin auth en `/admin/*` |
| SEC-A7 | Cron sin CRON_SECRET |
| SEC-A8 | API key sin scopes |
| SEC-A9 | Loguear passwords/tokens/keys en `console` |
| SEC-A10 | Hard delete sin confirmación |
| SEC-A11 | Almacenar passwords (siempre via Supabase Auth) |
| SEC-A12 | CORS con `*` en endpoints autenticados |
| SEC-A13 | Header CSP sin definir |
| SEC-A14 | Upload sin validación de MIME + size |
| SEC-A15 | Datos médicos visibles sin permiso explícito |
| SEC-A16 | Exponer IDs internos en URLs públicas (usar slugs) |
| SEC-A17 | Bypass de RLS para "casos especiales" |
| SEC-A18 | API key en URL en lugar de header |

---

## 17. Checklist de seguridad por feature nueva

Antes de cerrar sprint, validar:

**Auth y permisos:**
- [ ] Endpoint en `/admin/*` requiere sesión válida
- [ ] Server action verifica permisos antes de ejecutar
- [ ] Datos sensibles requieren permiso adicional

**Multi-tenant:**
- [ ] RLS habilitada en tablas nuevas
- [ ] Policies SELECT/INSERT/UPDATE/DELETE definidas
- [ ] Código filtra por `tenant_id` aunque RLS lo haga
- [ ] No usa service role en flujos de usuario

**Validación:**
- [ ] Inputs validados con zod en server action
- [ ] Tipos correctos en TypeScript
- [ ] Sanitización de strings que se renderizan como HTML

**Privacidad:**
- [ ] PII especial protegida con permisos extra
- [ ] Audit log registra acceso/modificación de datos sensibles
- [ ] Datos personales en uploads no incluyen EXIF GPS

**API:**
- [ ] Si expone endpoint público, valida CORS y rate limit
- [ ] Si crea API key nueva, define scopes mínimos
- [ ] Logging en `api_logs`

**Storage:**
- [ ] Bucket correcto (privado vs público)
- [ ] Validación de tipo + tamaño
- [ ] Storage policy verifica tenant

**Secrets:**
- [ ] Sin secretos hardcoded en código
- [ ] Variables nuevas correctamente clasificadas (NEXT_PUBLIC o
      privadas)
- [ ] Nada de keys en `console.log`

---

## 18. Hardening pendiente / postergado

| Item | Sprint planeado | Razón de no hacerlo hoy |
|---|---|---|
| JWT con claims de tenant real | 17b | Hoy hardcoded por simplicidad dev |
| Rate limiting con Upstash | 15a | Resend setup tiene prioridad |
| 2FA | Q3 2026 | Sin demanda actual |
| SSO empresarial | Q4+ | Sin cliente que lo exija |
| Tests automatizados de RLS | 17c | Coverage general en 17c |
| Drill de DR | Q4 2026 | Sin masa crítica de clientes |
| Pen test externo | Cuando facture > $50k USD/mes | Cost-benefit |
| Bug bounty | 2027+ | Programa requiere recursos |
| WAF dedicado | Si volumen lo justifica | Vercel + Cloudflare alcanzan hoy |
| SOC2 / ISO27001 | Si cliente lo exige | No exigido hoy |
| Cifrado de datos sensibles en reposo (más allá del de Supabase) | Si compliance lo exige | Supabase ya cifra en disco |
| Anonimización para entornos de dev | Cuando haya entorno staging compartido | Hoy dev = local |
| Notificación automática de incidentes a tenants | 16+ | Manual por ahora, volumen permite |

---

## 19. Responsabilidad compartida

Modelo claro de qué es responsabilidad de quién:

| Item | Responsable |
|---|---|
| Infraestructura física | Vercel, Supabase |
| Postgres patches | Supabase |
| Vulnerabilidades en deps (npm) | Arquitecto + Code (Dependabot) |
| Vulnerabilidades en nuestro código | Arquitecto + Code |
| Configuración de RLS y policies | Arquitecto |
| Validación de inputs | Code en cada server action |
| Manejo de secrets | Yair (Vercel dashboard) + Arquitecto |
| Rotación de keys | Yair en calendario |
| Auditoría de logs | Arquitecto periódicamente |
| Educación del cliente final | Tenant admin |
| Contraseña fuerte del tenant admin | Tenant admin |

---

## 20. Cómo se mantiene este documento

Cambios al modelo de amenazas o controles requieren aprobación del
arquitecto. Code consulta este doc en sprints que tocan:
- Auth, sesiones, permisos
- Endpoints públicos o expuestos
- Subida/descarga de archivos
- API REST
- Datos sensibles

Cada vulnerabilidad encontrada → entrada en `DECISIONS.md` con el fix
aplicado.

Auditoría formal de seguridad: cada cierre de sprint 15-final
(antes del 1 jul) y trimestralmente después.
