# PARTE 7 — Integraciones y configuración externa

## 7.1 APIs externas

| Servicio | Estado | Notas |
|----------|--------|-------|
| **Supabase Auth** | Conectado | Magic link login funcional |
| **Supabase Storage** | Conectado | 5 buckets configurados |
| **Supabase Postgres** | Conectado | DB principal |
| **Resend (email)** | Stub | `lib/comunicaciones/email.ts` existe pero `RESEND_API_KEY` no configurada en Vercel |
| **MercadoPago** | No implementado | Declarado en roadmap (Sprint 15+) |
| **Zoho CRM** | No implementado | Declarado como conector futuro |
| **WhatsApp Business** | No implementado | Post-LIVE |
| **Google Fonts** | Conectado | Fonts dinámicas por tenant |
| **Vercel Cron** | Configurado | 2 crons: vencimientos (diario 9AM) + cleanup-api-logs (domingos 3AM) |

### API REST propia (Sprint 13)
- **Base:** `/api/v1/`
- **Auth:** Bearer token (API keys con SHA-256 hash)
- **Endpoints:** 5 (GET/POST personas, GET/PATCH personas/:id, GET equipos)
- **Scopes:** 8 definidos (personas:read/write, equipos:read/write, finanzas:read/write, eventos:read, padrones:read)
- **Rate limiting:** DB-based (count api_logs últimos 60s)
- **UI admin:** `/admin/integraciones` (crear keys, ver logs)
- **CRON_SECRET:** No configurado en Vercel (requerido para proteger cron endpoints)
- **SUPABASE_SERVICE_ROLE_KEY:** No configurado en Vercel

## 7.2 Storage buckets

| Bucket | Público | Max size | MIME types | Estado |
|--------|---------|----------|------------|--------|
| `public-assets` | Sí | 5 MB | jpeg, png, webp, svg+xml | En uso (logos, branding) |
| `private-fotos-personales` | No | 5 MB | jpeg, png, webp | En uso |
| `private-documentos` | No | 10 MB | jpeg, png, webp, pdf | En uso |
| `private-comprobantes` | No | 10 MB | jpeg, png, webp, pdf | Creado |
| `private-recibos-sueldo` | No | 10 MB | pdf, jpeg, png, webp | Creado (Sprint 11) |

Todos los buckets privados tienen RLS policies.
Path convention: `{bucket}/{tenant_id}/{module_slug}/{entity_id}/{filename}`

## 7.3 Variables de entorno requeridas

### `.env.example` (3 variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://hkoizqbptwhnepzbmjql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Variables adicionales necesarias (no en .env.example):

| Variable | Dónde se usa | Estado |
|----------|-------------|--------|
| `RESEND_API_KEY` | `lib/comunicaciones/email.ts` | No configurada |
| `CRON_SECRET` | `app/api/cron/*/route.ts` | No configurada |
| `SUPABASE_SERVICE_ROLE_KEY` | API v1 routes, import actions | Configurada localmente, pendiente en Vercel |

## 7.4 RLS policies

### Resumen
- **Total policies:** 311 (verificado contra DB)
- **99/99 tablas** tienen RLS habilitado (100%)
- **0 errores de seguridad** (advisor limpio post-cleanup Sprint 11)

### Patrón estándar de RLS:
```sql
-- SELECT: solo datos del tenant del usuario
CREATE POLICY tabla_select ON tabla
  FOR SELECT USING (tenant_id = (SELECT get_tenant_actual()));

-- INSERT/UPDATE/DELETE: tenant + atributo check
CREATE POLICY tabla_modify ON tabla
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT get_tenant_actual())
    AND tiene_atributo('atributo_requerido')
  );
```

### Excepciones documentadas:
1. **`pre_inscripciones`:** INSERT con `WITH CHECK (true)` — permite insert anónimo desde landing pública
2. **`public-assets` bucket:** SELECT público — sirve logos y branding
3. **24 funciones SECURITY DEFINER:** Algunas son helpers de RLS necesarios, clasificación pendiente (Sprint 16)

### Dependencias
- Todas las policies dependen de `get_tenant_actual()` (SECURITY DEFINER)
- `get_tenant_actual()` mapea `auth.uid()` → `personas.user_id` → `tenant_id`
- Si no hay usuario logueado, devuelve NULL → no se ven datos
