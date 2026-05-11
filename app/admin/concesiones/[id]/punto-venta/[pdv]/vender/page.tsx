import { listarProductos, listarPuntosVenta, obtenerConcesionario } from '../../../../_actions'
import { VenderClient } from './_components/vender-client'
import { notFound } from 'next/navigation'

export default async function VenderPage({ params }: { params: Promise<{ id: string; pdv: string }> }) {
  const { id, pdv } = await params
  const [concesionario, productos, puntosVenta] = await Promise.all([
    obtenerConcesionario(id),
    listarProductos(id, { activo: true }),
    listarPuntosVenta(id),
  ])

  if (!concesionario) return notFound()

  const puntoVenta = puntosVenta.find((p: { id: string }) => p.id === pdv)
  if (!puntoVenta) return notFound()

  return (
    <VenderClient
      concesionarioId={id}
      concesionarioNombre={concesionario.nombre_comercial}
      puntoVentaId={pdv}
      puntoVentaNombre={puntoVenta.nombre}
      productos={productos}
    />
  )
}
