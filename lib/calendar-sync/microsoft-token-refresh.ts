'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { refreshMicrosoftToken } from './microsoft-client'
import type { CalendarioIntegracion } from './types'

/**
 * Ensures the Microsoft access token is valid. Refreshes if expired.
 * Returns the valid access token, or throws if revoked.
 */
export async function ensureMicrosoftTokenValid(
  integracion: CalendarioIntegracion,
): Promise<string> {
  if (!integracion.microsoft_refresh_token) {
    throw new Error('No Microsoft refresh token available')
  }

  // Check if token is still valid (with 5min buffer)
  if (integracion.microsoft_token_expires_at) {
    const expiryMs = new Date(integracion.microsoft_token_expires_at).getTime()
    if (Date.now() < expiryMs - 5 * 60 * 1000 && integracion.microsoft_access_token) {
      return integracion.microsoft_access_token
    }
  }

  // Refresh the token
  const supabase = createServiceRoleClient()

  try {
    const result = await refreshMicrosoftToken(integracion.microsoft_refresh_token)

    await supabase
      .from('calendario_integraciones')
      .update({
        microsoft_access_token: result.accessToken,
        microsoft_refresh_token: result.refreshToken,
        microsoft_token_expires_at: result.expiresAt,
      })
      .eq('id', integracion.id)

    return result.accessToken
  } catch (err) {
    // Token revoked or invalid
    await supabase
      .from('calendario_integraciones')
      .update({
        estado: 'disconnected',
        error_log: [
          ...(integracion.error_log ?? []),
          { type: 'microsoft_token_revoked', at: new Date().toISOString(), detail: String(err) },
        ],
      })
      .eq('id', integracion.id)
    throw new Error('Microsoft token revoked — integration disconnected')
  }
}
