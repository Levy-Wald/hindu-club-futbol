import { fetchShapes, fetchEspaciosDisponibles } from '@/modules/diagramacion-club/lib/queries'
import { DiagramaCanvas } from '@/modules/diagramacion-club/ui/diagrama-canvas'

export default async function MapaClubPage() {
  const [shapes, espacios] = await Promise.all([
    fetchShapes(),
    fetchEspaciosDisponibles(),
  ])

  return (
    <div className="container py-6">
      <DiagramaCanvas shapesInicial={shapes} espacios={espacios} />
    </div>
  )
}
