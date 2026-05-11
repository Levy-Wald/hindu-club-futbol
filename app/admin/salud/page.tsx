import { obtenerPermisosSalud } from '@/lib/permisos/salud'
import { redirect } from 'next/navigation'
import { SaludClient } from './_components/salud-client'

export default async function SaludPage() {
  const permisos = await obtenerPermisosSalud()

  if (permisos.nivel === 'denegado') {
    redirect('/admin')
  }

  return <SaludClient permisos={permisos} />
}
