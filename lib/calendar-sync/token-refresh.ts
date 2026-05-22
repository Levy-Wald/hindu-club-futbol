'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { refreshAccessTokenIfNeeded } from './google-client'
import type { CalendarioIntegracion } from './types'

/**
 * Ensures the Google access token is valid. Refreshes if expired.
 * Updates the DB row with new token + expiry.
 * Returns the valid access token, or throws if revoked.
 */
export async function ensureValidToken(
  integracion: CalendarioIntegracion,
): Promise<string> {
  if (!integracion.google_refresh_token) {
    throw new Error('No refresh token available')
  }

  const result = await refreshAccessTokenIfNeeded(
    integracion.google_refresh_token,
    integracion.google_token_expires_at,
  ).catch(async (err) => {
    // 401 = token revoked by user
    const supabase = createServiceRoleClient()
    await supabase
      .from('calendario_integraciones')
      .update({
        estado: 'disconnected',
        error_log: [
          ...(integracion.error_log ?? []),
          { type: 'token_revoked', at: new Date().toISOString(), detail: String(err) },
        ],
      })
      .eq('id', integracion.id)
    throw new Error('Google token revoked — integration disconnected')
  })

  if (!result) {
    // Token is still valid
    return integracion.google_access_token!
  }

  // Update DB with refreshed token
  const supabase = createServiceRoleClient()
  await supabase
    .from('calendario_integraciones')
    .update({
      google_access_token: result.accessToken,
      google_token_expires_at: result.expiresAt,
    })
    .eq('id', integracion.id)

  return result.accessToken
}
