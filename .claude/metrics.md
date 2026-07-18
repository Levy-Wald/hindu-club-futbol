# metrics.md — criterios de éxito del QA (hindu-v2)

El `qa` valida CONTRA esto: no es criterio implícito. Si un ítem de acá falla, es FAIL.
Read-only; no corrige.

## Capa 1 — Técnica (gate)
Confirma el `GATE` que reportó el coder. No re-corre todo a ciegas. Re-corre build completo solo si
el reporte es dudoso o el diff toca rutas/build.
- `pnpm typecheck` — 0 errores.
- `pnpm lint` — 0 errores.
- `pnpm test:unit` — todos verdes; el N de tests no baja sin justificación en el spec.
- `pnpm build` — pasa, si el loop tocó rutas/build.
- `pnpm test:e2e` — happy path del flujo tocado, si aplica.

## Capa 2 — Estándares (delegá en `verifier`, 7 checks → ≥ aprobado)
1. RLS + `tenant_id` en toda tabla/query nueva (policies tenant-scoped, nunca `USING(true)` disfrazada).
2. Auth en server: service role para writes/admin, `createServerClient` para lecturas de usuario;
   nunca el tenant/id del body sin validar.
3. Tipos: sin `any` salvo en catch.
4. CSS vars / tokens, nunca hex hardcodeado en className.
5. Voseo: copy visible al usuario en español rioplatense.
6. Sin `SELECT *` nuevo ni `catch {}` vacío.
7. Data real de Hindu intacta: nada apunta al tenant `11111111-...` en tests/seeds (usar `tenant_demo_xxx`).

## Capa 3 — Funcional
- Cumple el spec del loop (lo que pedía, no menos).
- Sin regresiones en lo vecino.
- Edge cases: estados vacíos, **mobile 375px** (Android gama baja es target), datos que no rompen,
  error explícito (nunca 500 silencioso ni `catch {}` vacío).
- Si tocó migración (Tier 2): advisors de Supabase limpios tras aplicar.

## Núcleo
Si el diff toca navegación data-driven (`catalogo_modulos`), modelo Actor/Roles (`actor_roles`),
estructura de tablas existentes, seams de conectores, o **data real de Hindu** — **sin que el spec lo
pida explícito** → FAIL automático.

## Regla de veredicto
Un solo issue real ya es FAIL. Default a FAIL ante la duda. No se aprueba "se arregla después".
