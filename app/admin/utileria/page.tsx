import { obtenerPermisosUtileria } from '@/lib/permisos/utileria'
import { redirect } from 'next/navigation'
import { DashboardUtileria } from './_components/dashboard-utileria'

export default async function UteriaPage() {
  const permisos = await obtenerPermisosUtileria()

  if (!permisos.es_staff_utileria && permisos.equipos_donde_es_responsable.length === 0) {
    redirect('/admin')
  }

  return <DashboardUtileria permisos={permisos} />
}
