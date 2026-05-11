import { listarConcesionarios } from '../_actions'
import { ReportesClient } from './_components/reportes-client'

export default async function ReportesConcesionesPage() {
  const concesionarios = await listarConcesionarios()
  return <ReportesClient concesionarios={concesionarios} />
}
