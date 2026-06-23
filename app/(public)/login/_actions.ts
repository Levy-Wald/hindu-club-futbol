'use server'

import { DEFAULT_TENANT_ID } from '@/lib/tenant'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { getUserAttributes } from '@/lib/permissions/user-attributes'
import { isAdmin } from '@/lib/navigation/filter'

// F3 — Login-branching: un admin del tenant aterriza en el back office (/admin);
// el resto (socios) en el Portal Cliente (/portal). Sin persona asociada → /admin
// por defecto (caso de usuario técnico/mal configurado).
export async function resolveLandingPath(): Promise<string> {
  const personaId = await getCurrentPersonaId()
  if (!personaId) return `/admin/${DEFAULT_TENANT_ID}`

  const attrs = await getUserAttributes(personaId)
  return isAdmin(attrs) ? `/admin/${DEFAULT_TENANT_ID}` : `/portal/${DEFAULT_TENANT_ID}`
}
