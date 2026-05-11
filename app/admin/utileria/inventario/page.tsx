import { obtenerPermisosUtileria } from '@/lib/permisos/utileria'
import { redirect } from 'next/navigation'
import { InventarioClient } from '../_components/inventario-client'

export default async function InventarioPage() {
  const permisos = await obtenerPermisosUtileria()
  if (!permisos.es_staff_utileria) redirect('/admin/utileria')
  return <InventarioClient permisos={permisos} />
}
