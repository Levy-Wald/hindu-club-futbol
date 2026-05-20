import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_TENANT_ID, isValidTenantId } from '@/lib/tenant'

// S4: Rate limiting en edge para rutas publicas de nominas
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minuto
const RATE_LIMIT_MAX = 30 // 30 requests por IP por minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit en rutas publicas de nominas externas
  if (pathname.startsWith('/nomina/') || pathname.startsWith('/api/nomina/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
        { status: 429 }
      )
    }
  }

  // Skip auth (getUser) para rutas que no lo necesitan
  // Solo /admin/* y /login requieren verificacion de sesion
  if (!pathname.startsWith('/admin') && pathname !== '/login') {
    return NextResponse.next()
  }

  // --- Tenant routing for /admin/* ---

  // /admin exact → redirect to default tenant
  if (pathname === '/admin') {
    const url = request.nextUrl.clone()
    url.pathname = `/admin/${DEFAULT_TENANT_ID}`
    return NextResponse.redirect(url)
  }

  // /admin/scl/* → SCL panel, no tenant needed
  if (pathname.startsWith('/admin/scl')) {
    return await updateSession(request)
  }

  // /admin/[segment]/... → check if segment is a valid tenant UUID
  const match = pathname.match(/^\/admin\/([^/]+)/)
  if (match) {
    const segment = match[1]

    // If not a valid UUID, it's an old-style URL → redirect with default tenant
    if (!isValidTenantId(segment)) {
      const url = request.nextUrl.clone()
      url.pathname = `/admin/${DEFAULT_TENANT_ID}${pathname.slice(6)}`
      return NextResponse.redirect(url)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
