import { listarConcesionarios } from '@/modules/concesiones/lib/actions'
import { ReportesClient } from '@/modules/concesiones/ui/components/reportes-client'

export default async function ReportesConcesionesPage() {
  const concesionarios = await listarConcesionarios()
  return <ReportesClient concesionarios={concesionarios} />
}
