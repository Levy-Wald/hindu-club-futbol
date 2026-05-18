import {
  fetchStatsEquipos,
  fetchPerformanceJugadores,
  fetchComparativaEquipos,
} from '@/modules/reportes-deportivos/lib/queries'
import { DashboardDeportivo } from '@/modules/reportes-deportivos/ui/dashboard-deportivo'

export default async function ReportesDeportivosPage() {
  const [stats, jugadores, comparativa] = await Promise.all([
    fetchStatsEquipos(),
    fetchPerformanceJugadores(),
    fetchComparativaEquipos(),
  ])

  return (
    <DashboardDeportivo
      stats={stats}
      jugadores={jugadores}
      comparativa={comparativa}
    />
  )
}
