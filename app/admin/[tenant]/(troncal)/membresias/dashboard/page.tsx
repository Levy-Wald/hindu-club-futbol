import { fetchResumenMembresias, fetchMembresiasStats } from '@/modules/membresias/lib/queries'
import { DashboardMembresias } from '@/modules/membresias/ui/dashboard-membresias'

export default async function DashboardMembresiasPage() {
  const [resumen, stats] = await Promise.all([
    fetchResumenMembresias(),
    fetchMembresiasStats(),
  ])

  return <DashboardMembresias resumen={resumen} stats={stats} />
}
