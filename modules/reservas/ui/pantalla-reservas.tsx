import { listarReservas, listarCanchasDisponibles } from '../lib/queries'
import { canGestionarReservas } from '../lib/permisos'
import { TablaReservas } from './tabla-reservas'

export async function PantallaReservas({
  personaId,
  tenantId,
}: {
  personaId: string
  tenantId: string
}) {
  const [reservas, canchas, puedeEditar] = await Promise.all([
    listarReservas(tenantId),
    listarCanchasDisponibles(tenantId),
    canGestionarReservas(personaId),
  ])

  // Build list of canchas that have reservas (for filter dropdown)
  const canchaIdsConReservas = [...new Set(reservas.map(r => r.cancha_id))]
  const canchasConReservas = canchaIdsConReservas.map(id => {
    const r = reservas.find(r => r.cancha_id === id)
    return { id, nombre: r?.cancha.nombre ?? '' }
  })

  return (
    <TablaReservas
      reservas={reservas}
      canchas={canchas}
      canchasConReservas={canchasConReservas}
      puedeEditar={puedeEditar}
    />
  )
}
