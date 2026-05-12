import crypto from 'crypto'

/**
 * S2: Token crypto-secure de 32 bytes en base64url.
 * PROHIBIDO usar gen_random_uuid() o secuencias.
 */
export function generateNominaToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Verifica formato válido (no valida existencia en DB).
 */
export function esTokenValido(token: string): boolean {
  return /^[A-Za-z0-9_-]{40,50}$/.test(token)
}
