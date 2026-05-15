import { redirect } from 'next/navigation'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { AutomatizacionForm } from '@/modules/comunicaciones/ui/automatizacion-form'

export default async function NuevaAutomatizacionPage() {
  const permisos = await obtenerPermisosComunicaciones()
  if (!permisos.puede_editar) redirect('/admin/comunicaciones')

  return <AutomatizacionForm />
}
