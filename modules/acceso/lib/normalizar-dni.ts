/**
 * Normaliza el DNI removiendo puntos, guiones, espacios.
 */
export function normalizarDni(dni: string): string {
  return dni.replace(/[.\-\s]/g, '').trim()
}

/**
 * Valida que un DNI tenga formato razonable (numérico, 6-10 dígitos).
 */
export function esDniValido(dni: string): boolean {
  const normalized = normalizarDni(dni)
  return /^\d{6,10}$/.test(normalized)
}
