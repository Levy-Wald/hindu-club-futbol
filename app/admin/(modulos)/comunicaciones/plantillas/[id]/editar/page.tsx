import { notFound, redirect } from 'next/navigation'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { obtenerPlantilla } from '@/modules/comunicaciones/lib/queries'
import { PlantillaEditorForm } from '@/modules/comunicaciones/ui/plantilla-editor-form'

export default async function EditarPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const permisos = await obtenerPermisosComunicaciones()
  if (!permisos.puede_editar) redirect('/admin/comunicaciones')

  const plantilla = await obtenerPlantilla(id)
  if (!plantilla) notFound()

  return (
    <PlantillaEditorForm
      plantilla={plantilla as unknown as Parameters<typeof PlantillaEditorForm>[0]['plantilla']}
      permisos={permisos}
    />
  )
}
