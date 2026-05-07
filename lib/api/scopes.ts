export const SCOPES = {
  'personas:read': 'Leer personas',
  'personas:write': 'Crear y editar personas',
  'equipos:read': 'Leer equipos',
  'equipos:write': 'Crear y editar equipos',
  'finanzas:read': 'Leer finanzas (cajas, movimientos, cuotas)',
  'finanzas:write': 'Crear movimientos y cuotas',
  'eventos:read': 'Leer eventos y calendario',
  'padrones:read': 'Leer padrones',
} as const

export type Scope = keyof typeof SCOPES

export function hasScope(scopes: string[], required: Scope): boolean {
  return scopes.includes(required) || scopes.includes('*')
}
