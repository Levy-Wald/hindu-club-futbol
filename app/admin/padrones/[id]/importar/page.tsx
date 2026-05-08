import { redirect } from 'next/navigation'

/**
 * Wizard de importación viejo — deprecado en Sprint 14a.6.
 * Redirige al flujo unificado de sincronización.
 */
export default async function ImportarPadronPage() {
  redirect('/admin/padrones/sincronizar')
}
