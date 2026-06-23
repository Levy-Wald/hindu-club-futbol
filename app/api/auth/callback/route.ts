import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_TENANT_ID } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Acumulamos las cookies de sesión para aplicarlas al redirect final (que se
  // crea recién cuando sabemos el destino — login-branching admin↔portal).
  const cookieJar: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            cookieJar.push({ name, value, options })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Destino: si vino un `next` explícito, se respeta. Si no, branching por rol.
  let destino = next
  if (!destino) {
    const { data: { user } } = await supabase.auth.getUser()
    destino = `/admin/${DEFAULT_TENANT_ID}`
    if (user) {
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
    }
  }

  const response = NextResponse.redirect(`${origin}${destino}`)
  cookieJar.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return response
}
