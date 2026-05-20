import { fetchShapes, fetchEspaciosDisponibles, fetchSedesDisponibles } from '@/modules/diagramacion-club/lib/queries'
import { DiagramaCanvas } from '@/modules/diagramacion-club/ui/diagrama-canvas'

export default async function MapaClubPage() {
  const [shapes, espacios, sedes] = await Promise.all([
    fetchShapes(),
    fetchEspaciosDisponibles(),
    fetchSedesDisponibles(),
  ])

  return (
    <div className="container py-6">
      <DiagramaCanvas shapesInicial={shapes} espacios={espacios} sedes={sedes} />
    </div>
  )
}
