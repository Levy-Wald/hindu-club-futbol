import { createClient } from '@supabase/supabase-js'

/**
 * ¿Están las credenciales del cliente service-role en el entorno?
 *
 * En CI (build) y en previews sin secrets NO están, y no deberían estar: el
 * service-role key saltea todas las políticas RLS, así que no se carga en
 * superficies que no la necesitan (ADR-035, mock-first). Quien la use en un
 * camino que puede ejecutarse en build time debe chequear esto primero.
 */
export function hasServiceRoleCredentials(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Sin esto, supabase-js tira "supabaseKey is required" sin decir cuál falta
  // ni desde dónde. Ese error genérico costó 4 días de build rojo (issue #34).
  if (!url || !serviceRoleKey) {
    const faltan = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(', ')
    throw new Error(
      `createServiceRoleClient(): falta ${faltan} en el entorno. ` +
      `Si esto corre en build time, usá hasServiceRoleCredentials() antes de llamar.`
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
