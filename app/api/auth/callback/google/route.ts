import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { exchangeCodeForTokens, getGoogleCalendarList } from '@/lib/calendar-sync/google-client'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      `${origin}/admin/mi-cuenta?calendar_error=${encodeURIComponent(error)}`,
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/mi-cuenta?calendar_error=missing_code`,
    )
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get primary calendar
    const calendars = await getGoogleCalendarList(tokens.refreshToken)
    const primary = calendars.find((c) => c.primary) ?? calendars[0]

    if (!primary) {
      return NextResponse.redirect(
        `${origin}/admin/mi-cuenta?calendar_error=no_calendars`,
      )
    }

    // Get current user's persona_id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${origin}/login`)
    }

    const { data: persona } = await supabase
      .from('personas')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', TENANT_ID)
      .single()

    if (!persona) {
      return NextResponse.redirect(
        `${origin}/admin/mi-cuenta?calendar_error=no_persona`,
      )
    }

    // Upsert calendario_integraciones
    const { error: upsertError } = await supabase
      .from('calendario_integraciones')
      .upsert(
        {
          tenant_id: TENANT_ID,
          persona_id: persona.id,
          proveedor: 'google',
          estado: 'connected',
          google_calendar_id: primary.id,
          google_refresh_token: tokens.refreshToken,
          google_access_token: tokens.accessToken,
          google_token_expires_at: tokens.expiresAt,
          sync_direction: 'two-way',
          last_sync_at: null,
          next_sync_at: new Date().toISOString(),
          error_log: [],
        },
        { onConflict: 'tenant_id,persona_id,proveedor' },
      )

    if (upsertError) {
      console.error('Google calendar integration upsert error:', upsertError)
      return NextResponse.redirect(
        `${origin}/admin/mi-cuenta?calendar_error=${encodeURIComponent(upsertError.message)}`,
      )
    }

    // Parse state for redirect (persona_id was passed as state)
    const redirectPath = state || '/admin/mi-cuenta'
    return NextResponse.redirect(
      `${origin}${redirectPath}?calendar=connected&provider=google`,
    )
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    const msg = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      `${origin}/admin/mi-cuenta?calendar_error=${encodeURIComponent(msg)}`,
    )
  }
}
