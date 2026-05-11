import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export async function getApiKeys() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('api_keys')
    .select('id, nombre, descripcion, key_prefix, scopes, rate_limit_por_minuto, activa, ultimo_uso_at, expira_at, created_at')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getApiLogs(limit = 50, apiKeyId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('api_logs')
    .select('id, api_key_id, method, path, status_code, response_ms, ip_address, error_message, created_at')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (apiKeyId) {
    query = query.eq('api_key_id', apiKeyId)
  }

  const { data } = await query
  return data ?? []
}

export async function getDashboardStats() {
  const supabase = await createClient()

  const [keysRes, logsHoyRes, erroresHoyRes] = await Promise.all([
    supabase
      .from('api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .eq('activa', true)
      .is('deleted_at', null),
    supabase
      .from('api_logs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00'),
    supabase
      .from('api_logs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00')
      .gte('status_code', 400),
  ])

  return {
    keys_activas: keysRes.count ?? 0,
    requests_hoy: logsHoyRes.count ?? 0,
    errores_hoy: erroresHoyRes.count ?? 0,
  }
}
