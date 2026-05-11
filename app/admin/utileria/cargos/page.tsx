import { obtenerPermisosUtileria } from '@/lib/permisos/utileria'
import { redirect } from 'next/navigation'
import { CargosClient } from '../_components/cargos-client'

export default async function CargosPage() {
  const permisos = await obtenerPermisosUtileria()
  if (!permisos.es_staff_utileria) redirect('/admin/utileria')
  return <CargosClient />
}
