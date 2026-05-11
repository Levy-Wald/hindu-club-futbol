import { redirect } from 'next/navigation'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { PlantillaEditorForm } from '@/modules/comunicaciones/ui/plantilla-editor-form'

export default async function NuevaPlantillaPage() {
  const permisos = await obtenerPermisosComunicaciones()
  if (!permisos.puede_crear) redirect('/admin/comunicaciones')

  return <PlantillaEditorForm permisos={permisos} />
}
