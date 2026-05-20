import { notFound, redirect } from 'next/navigation'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { obtenerPlantilla, fetchVariablesDisponibles } from '@/modules/comunicaciones/lib/queries'
import { PlantillaEditorForm } from '@/modules/comunicaciones/ui/plantilla-editor-form'

export default async function EditarPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [permisos, plantilla, variables] = await Promise.all([
    obtenerPermisosComunicaciones(),
    obtenerPlantilla(id),
    fetchVariablesDisponibles(),
  ])
  if (!permisos.puede_editar) redirect('/admin/comunicaciones')
  if (!plantilla) notFound()

  return (
    <PlantillaEditorForm
      plantilla={plantilla as unknown as Parameters<typeof PlantillaEditorForm>[0]['plantilla']}
      permisos={permisos}
      variablesDisponibles={variables as unknown as Parameters<typeof PlantillaEditorForm>[0]['variablesDisponibles']}
    />
  )
}
