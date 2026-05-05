import { redirect } from 'next/navigation'
import { fetchMiEquipo, fetchPlantelEquipo, fetchHorariosEquipo, fetchEquiposDisponibles } from './_lib/queries'
import { MiEquipoClient } from './_components/mi-equipo-client'
import { SinEquipo } from './_components/sin-equipo'

export default async function MiEquipoPage() {
  const resultado = await fetchMiEquipo()
  const equiposDisponibles = await fetchEquiposDisponibles()

  if (!resultado) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Mi equipo</h1>
          <p className="text-sm text-muted-foreground">Todavía no estás asignado a un equipo</p>
        </div>
        <SinEquipo equipos={equiposDisponibles} />
      </div>
    )
  }

  const equipo = resultado.asignacion.equipo as unknown as Record<string, unknown>
  const equipoId = equipo.id as string

  const [plantel, horarios] = await Promise.all([
    fetchPlantelEquipo(equipoId),
    fetchHorariosEquipo(equipoId),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi equipo</h1>
        <p className="text-sm text-muted-foreground">{equipo.nombre as string}</p>
      </div>
      <MiEquipoClient
        equipo={equipo}
        miAsignacion={resultado.asignacion}
        plantel={plantel}
        horarios={horarios}
      />
      {/* Solicitar ingreso a otro equipo */}
      <SinEquipo equipos={equiposDisponibles} titulo="Solicitar ingreso a otro equipo" />
    </div>
  )
}
