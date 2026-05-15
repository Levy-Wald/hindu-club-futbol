import { redirect } from 'next/navigation'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { fetchVariablesDisponibles } from '@/modules/comunicaciones/lib/queries'
import { PlantillaEditorForm } from '@/modules/comunicaciones/ui/plantilla-editor-form'

export default async function NuevaPlantillaPage() {
  const [permisos, variables] = await Promise.all([
    obtenerPermisosComunicaciones(),
    fetchVariablesDisponibles(),
  ])
  if (!permisos.puede_crear) redirect('/admin/comunicaciones')

  return (
    <PlantillaEditorForm
      permisos={permisos}
      variablesDisponibles={variables as unknown as Parameters<typeof PlantillaEditorForm>[0]['variablesDisponibles']}
    />
  )
}
