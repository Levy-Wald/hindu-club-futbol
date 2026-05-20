import { obtenerPermisosUtileria } from '@/lib/permisos/utileria'
import { redirect } from 'next/navigation'
import { ClientOnly } from '@/components/client-only'
import { SolicitudesClient } from '@/modules/utileria/ui/components/solicitudes-client'

export default async function SolicitudesPage() {
  const permisos = await obtenerPermisosUtileria()
  if (!permisos.es_staff_utileria && permisos.equipos_donde_es_responsable.length === 0) {
    redirect('/admin')
  }
  return <ClientOnly><SolicitudesClient permisos={permisos} /></ClientOnly>
}
