import { obtenerPermisosUtileria } from '@/lib/permisos/utileria'
import { redirect } from 'next/navigation'
import { KitsClient } from '../_components/kits-client'

export default async function KitsPage() {
  const permisos = await obtenerPermisosUtileria()
  if (!permisos.es_staff_utileria && permisos.equipos_donde_es_responsable.length === 0) {
    redirect('/admin')
  }
  return <KitsClient permisos={permisos} />
}
