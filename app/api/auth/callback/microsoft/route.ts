import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { exchangeMicrosoftCodeForTokens, getMicrosoftCalendarList } from '@/lib/calendar-sync/microsoft-client'

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
    const tokens = await exchangeMicrosoftCodeForTokens(code)

    // Get default calendar
    const calendars = await getMicrosoftCalendarList(tokens.accessToken)
    const defaultCal = calendars.find((c) => c.isDefaultCalendar) ?? calendars[0]

    if (!defaultCal) {
      return NextResponse.redirect(
        `${origin}/admin/mi-cuenta?calendar_error=no_calendars`,
      )
    }

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

    const { error: upsertError } = await supabase
      .from('calendario_integraciones')
      .upsert(
        {
          tenant_id: TENANT_ID,
          persona_id: persona.id,
          proveedor: 'microsoft',
          estado: 'connected',
          microsoft_calendar_id: defaultCal.id,
          microsoft_refresh_token: tokens.refreshToken,
          microsoft_access_token: tokens.accessToken,
          microsoft_token_expires_at: tokens.expiresAt,
          sync_direction: 'two-way',
          last_sync_at: null,
          next_sync_at: new Date().toISOString(),
          error_log: [],
        },
        { onConflict: 'tenant_id,persona_id,proveedor' },
      )

    if (upsertError) {
      console.error('Microsoft calendar integration upsert error:', upsertError)
      return NextResponse.redirect(
        `${origin}/admin/mi-cuenta?calendar_error=${encodeURIComponent(upsertError.message)}`,
      )
    }

    const redirectPath = state || '/admin/mi-cuenta'
    return NextResponse.redirect(
      `${origin}${redirectPath}?calendar=connected&provider=microsoft`,
    )
  } catch (err) {
    console.error('Microsoft OAuth callback error:', err)
    const msg = err instanceof Error ? err.message : 'unknown_error'
    return NextResponse.redirect(
      `${origin}/admin/mi-cuenta?calendar_error=${encodeURIComponent(msg)}`,
    )
  }
}
