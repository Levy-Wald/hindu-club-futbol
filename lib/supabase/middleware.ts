import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_TENANT_ID } from '@/lib/tenant'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rutas /admin/* (back office) y /portal/* (front del socio).
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/portal'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario y esta en /login, redirigir segun rol (login-branching F3):
  // admin del tenant → back office; resto (socios) → portal.
  if (user && request.nextUrl.pathname === '/login') {
    let destino = `/admin/${DEFAULT_TENANT_ID}`
    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle()
    if (persona) {
      const { data: attrs } = await supabase
        .from('personas_atributos')
        .select('atributo_slug')
        .eq('persona_id', persona.id)
        .eq('activo', true)
        .in('atributo_slug', ['tenant.admin', 'sistema.admin'])
      destino = attrs && attrs.length > 0 ? `/admin/${DEFAULT_TENANT_ID}` : `/portal/${DEFAULT_TENANT_ID}`
    }
    const url = request.nextUrl.clone()
    url.pathname = destino
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
