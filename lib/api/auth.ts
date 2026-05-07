import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateApiKey(): { key: string; prefix: string } {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const key =
    'cc_' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  const prefix = key.slice(0, 11) // "cc_" + 8 hex chars
  return { key, prefix }
}

interface ValidatedKey {
  id: string
  tenant_id: string
  scopes: string[]
  rate_limit_por_minuto: number
}

export async function validateApiKey(
  request: NextRequest
): Promise<{ ok: true; apiKey: ValidatedKey } | { ok: false; status: number; error: string }> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or invalid Authorization header' }
  }

  const rawKey = authHeader.slice(7)
  const keyHash = await hashApiKey(rawKey)
  const supabase = createServiceClient()

  const { data: keys } = await supabase.rpc('fn_validar_api_key', { p_key_hash: keyHash })

  const keyData = (keys as ValidatedKey[] | null)?.[0]
  if (!keyData) {
    return { ok: false, status: 401, error: 'Invalid or expired API key' }
  }

  // Rate limit check
  const { data: withinLimit } = await supabase.rpc('fn_chequear_rate_limit', {
    p_api_key_id: keyData.id,
    p_limite: keyData.rate_limit_por_minuto,
  })

  if (!withinLimit) {
    return { ok: false, status: 429, error: 'Rate limit exceeded' }
  }

  // Update ultimo_uso_at
  await supabase
    .from('api_keys')
    .update({ ultimo_uso_at: new Date().toISOString() })
    .eq('id', keyData.id)

  return { ok: true, apiKey: keyData }
}

export async function logApiRequest(params: {
  tenant_id: string
  api_key_id: string
  method: string
  path: string
  status_code: number
  response_ms: number
  ip_address: string | null
  user_agent: string | null
  error_message?: string | null
}) {
  const supabase = createServiceClient()
  await supabase.from('api_logs').insert(params)
}
