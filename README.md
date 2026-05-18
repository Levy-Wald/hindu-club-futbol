# Hindu Club Futbol — Sistema de Gestion Deportiva

[![CI](https://github.com/yamiro12/hindu-club-futbol/actions/workflows/ci.yml/badge.svg)](https://github.com/yamiro12/hindu-club-futbol/actions/workflows/ci.yml)

Sistema integral de gestion para clubes deportivos amateur. Manejo de personas, equipos, membresias, cuotas, torneos, scouting, comunicaciones, finanzas, y mas.

## Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **UI:** shadcn/ui v4
- **Backend:** Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Deploy:** Vercel
- **Tests:** Playwright (E2E) + Vitest (Unit)

## Desarrollo local

```bash
pnpm install
pnpm run dev
```

## Scripts disponibles

| Comando | Descripcion |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | Build de produccion |
| `pnpm run typecheck` | Type check con TypeScript |
| `pnpm run lint` | ESLint |
| `pnpm run test:unit` | Tests unitarios (Vitest) |
| `pnpm run test:e2e` | Tests E2E (Playwright, requiere `.env.local`) |

## CI/CD

GitHub Actions ejecuta automaticamente en cada push/PR a `main`:
1. **Lint & Typecheck** — ESLint + `tsc --noEmit`
2. **Unit Tests** — Vitest
3. **Build** — `next build` (solo si 1 y 2 pasan)

Los tests E2E se ejecutan localmente (ver [ADR-053](docs/adr/ADR-053-e2e-no-en-ci.md)).
