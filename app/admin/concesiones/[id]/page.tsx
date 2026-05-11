import { obtenerConcesionario, listarPuntosVenta, listarProductos, listarVentas, listarCanones, reporteVentasMensuales, fetchSedes } from '../_actions'
import { ConcesionarioDetailClient } from './_components/concesionario-detail-client'
import { notFound } from 'next/navigation'

export default async function ConcesionarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [concesionario, puntosVenta, productos, ventas, canones, reporteMensual, sedes] = await Promise.all([
    obtenerConcesionario(id),
    listarPuntosVenta(id),
    listarProductos(id),
    listarVentas({ concesionario_id: id, limit: 100 }),
    listarCanones(id),
    reporteVentasMensuales(id),
    fetchSedes(),
  ])

  if (!concesionario) return notFound()

  return (
    <ConcesionarioDetailClient
      concesionario={concesionario}
      puntosVenta={puntosVenta}
      productos={productos}
      ventas={ventas}
      canones={canones}
      reporteMensual={reporteMensual}
      sedes={sedes}
    />
  )
}
