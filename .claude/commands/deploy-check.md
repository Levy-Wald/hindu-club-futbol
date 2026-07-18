---
name: deploy-check
description: Validacion post-deploy. Verifica Vercel READY + Supabase migrations + build health.
---

Ejecuta las siguientes verificaciones post-deploy y reporta el resultado.

## Checks obligatorios

### 1. Vercel deployment status
Via el MCP de Vercel, verifica que el ultimo deploy del project `hindu-club`
(prj_sH5WIGNfNGo5tXxyTVvQaEfBDyBk, team serviciosclevel) — auto-deploy en push a `main` — este en
estado READY. Si no, reporta el estado y los build logs relevantes.

### 2. Supabase migrations + advisors
Via el MCP de Supabase (proyecto `hkoizqbptwhnepzbmjql`): `list_migrations` para confirmar que las
del repo (`supabase/migrations/`) coinciden con las aplicadas, y `get_advisors` para confirmar 0
ERRORs de seguridad tras una migracion.

### 3. Build local
`pnpm build` termina sin errores.

## Output esperado
```
DEPLOY CHECK — [fecha]
======================
Vercel:     OK | FAIL — [detalle]
Migrations: OK | FAIL — [detalle]
Advisors:   OK | FAIL — [N ERRORs / N WARNs]
Build:      OK | FAIL — [detalle]

RESULTADO GLOBAL: PASS | FAIL
```
Si alguno falla, lista las acciones correctivas. El 1er hit tras deploy puede ser lento (cold start),
no es bug.
