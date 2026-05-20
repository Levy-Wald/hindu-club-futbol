// Tenant ID por defecto — hasta multi-tenancy real (Tramo 8)
export const DEFAULT_TENANT_ID = '11111111-1111-1111-1111-111111111111'

// Backwards compat alias
export const TENANT_ID = DEFAULT_TENANT_ID

// UUID v4 regex para validar tenant IDs en URLs
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidTenantId(id: string): boolean {
  return UUID_RE.test(id)
}
