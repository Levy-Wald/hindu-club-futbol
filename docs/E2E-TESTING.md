# E2E Testing — ClubCore v2

## Setup local

1. Tener dev server corriendo: `npm run dev`
2. Crear `.env.local` con:
   - `E2E_USER_EMAIL=e2e-test@levywald.com` (o omitir, es el default)
   - `E2E_USER_PASSWORD=<password del auth user en Supabase>`
   - `PLAYWRIGHT_BASE_URL=http://localhost:3000`
3. Instalar browser: `npx playwright install chromium`

## Usuario E2E

E2E user actual: `e2e-test@levywald.com` (staff basico en Hindu).
Persona ID: `99999999-9999-9999-9999-999999999999`.
Auth user ID: `21c56268-478e-4bce-84a4-72cede088a4b`.

Para nuevos tenants, crear user E2E dedicado read-only con la misma estructura.

## Correr tests

- Todos: `npm run test:e2e`
- Un spec: `npx playwright test tests/e2e/modules/salud.spec.ts`
- UI mode (debug): `npm run test:e2e:ui`

## Convenciones

- Cada modulo tiene su `.spec.ts` en `tests/e2e/modules/<slug>.spec.ts`
- Tests del troncal en `tests/e2e/troncal/`
- Tests verifican carga de pagina, no mutan data
- Tests deben ser idempotentes (re-ejecutables sin estado previo)

## Tests pendientes (skip)

| Test | Razon | Cuando habilitar |
|------|-------|------------------|
| utileria > inventario page loads | Requiere atributo `staff_utileria` — user E2E tiene `staff` basico | Agregar atributo al user E2E o crear test con user con permisos |

## En CI

CI corre `npm run validate:all` que incluye `npm run test:e2e`.
Los tests apuntan a `PLAYWRIGHT_BASE_URL` que en CI es el deploy de Vercel.

## Troubleshooting

### Playwright se cuelga al correr tests

No usar `webServer` en `playwright.config.ts`. Siempre correr `npm run dev`
en una terminal separada antes de ejecutar tests.

### Auth setup falla

- Verificar que `E2E_USER_PASSWORD` esta seteado en `.env.local`
- Verificar que el dev server esta corriendo en `localhost:3000`
- Si `Invalid login credentials`: verificar password en Supabase Studio
