import { obtenerPermisosSalud } from '@/modules/salud/lib/permissions'
import { redirect } from 'next/navigation'
import { SaludClient } from '@/modules/salud/ui/components/salud-client'

export default async function SaludPage() {
  const permisos = await obtenerPermisosSalud()

  if (permisos.nivel === 'denegado') {
    redirect('/admin')
  }

  return <SaludClient permisos={permisos} />
}
