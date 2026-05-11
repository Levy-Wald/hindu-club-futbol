import { fetchMiEquipo, fetchPlantelEquipo, fetchHorariosEquipo, fetchEquiposDisponibles } from './_lib/queries'
import { MiEquipoClient } from './_components/mi-equipo-client'
import { SinEquipo } from './_components/sin-equipo'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

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
  const miAsignacion = resultado.asignacion as unknown as Record<string, unknown>

  const [plantel, horarios] = await Promise.all([
    fetchPlantelEquipo(equipoId),
    fetchHorariosEquipo(equipoId),
  ])

  const categoria = equipo.categoria as { nombre_display: string } | null
  const entidad = equipo.entidad as { id: string; nombre: string } | null

  return (
    <div className="space-y-6">
      {/* Header profesional */}
      <div className="flex items-start gap-4">
        {equipo.escudo_url ? (
          <img
            src={equipo.escudo_url as string}
            alt="Escudo"
            className="h-14 w-14 rounded-lg object-contain shrink-0"
          />
        ) : equipo.color_principal ? (
          <div
            className="h-14 w-14 rounded-lg border shrink-0 flex items-center justify-center"
            style={{ backgroundColor: equipo.color_principal as string }}
          >
            <Trophy className="h-7 w-7 text-white/80" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold truncate">{equipo.nombre as string}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-muted-foreground">
            {categoria ? <span>{categoria.nombre_display}</span> : null}
            <span className="capitalize">{equipo.disciplina_slug as string}</span>
            {equipo.modalidad ? <span>({equipo.modalidad as string})</span> : null}
            {equipo.torneo ? (
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {equipo.torneo as string}
              </span>
            ) : null}
          </div>
          {entidad ? (
            <p className="text-xs text-muted-foreground mt-0.5">{entidad.nombre}</p>
          ) : null}
        </div>
        <Badge variant="outline" className="shrink-0 capitalize">
          {miAsignacion.rol_equipo_slug
            ? (miAsignacion.rol_equipo_slug as string).replace(/_/g, ' ')
            : 'Jugador'}
          {miAsignacion.dorsal ? ` #${miAsignacion.dorsal}` : ''}
        </Badge>
      </div>

      <MiEquipoClient
        equipo={equipo}
        miAsignacion={miAsignacion}
        plantel={plantel}
        horarios={horarios}
      />

      {/* Solicitar ingreso a otro equipo */}
      <SinEquipo equipos={equiposDisponibles} titulo="Solicitar ingreso a otro equipo" />
    </div>
  )
}
