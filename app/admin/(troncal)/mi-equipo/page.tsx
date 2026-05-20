import { fetchMiEquipo, fetchPlantelEquipo, fetchHorariosEquipo, fetchEquiposDisponibles } from './_lib/queries'
import { MiEquipoClient } from './_components/mi-equipo-client'
import { SinEquipo } from './_components/sin-equipo'
import { EquiposTabs } from './_components/equipos-tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

function EquipoDetail({
  equipo,
  miAsignacion,
  plantel,
  horarios,
}: {
  equipo: Record<string, unknown>
  miAsignacion: Record<string, unknown>
  plantel: Awaited<ReturnType<typeof fetchPlantelEquipo>>
  horarios: Awaited<ReturnType<typeof fetchHorariosEquipo>>
}) {
  const categoria = equipo.categoria as { nombre_display: string } | null
  const entidad = equipo.entidad as { id: string; nombre: string } | null

  return (
    <div className="space-y-6">
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
          <h2 className="text-xl font-bold truncate">{equipo.nombre as string}</h2>
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
    </div>
  )
}

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

  const equipoDataPromises = resultado.asignaciones.map(async (asig) => {
    const equipo = asig.equipo as unknown as Record<string, unknown>
    const equipoId = equipo.id as string
    const [plantel, horarios] = await Promise.all([
      fetchPlantelEquipo(equipoId),
      fetchHorariosEquipo(equipoId),
    ])
    return { asignacion: asig as unknown as Record<string, unknown>, equipo, plantel, horarios }
  })

  const equiposData = await Promise.all(equipoDataPromises)
  const isSingle = equiposData.length === 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isSingle ? 'Mi equipo' : 'Mis equipos'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSingle
            ? 'Tu equipo y plantel'
            : `Estás asignado a ${equiposData.length} equipos`}
        </p>
      </div>

      {isSingle ? (
        <EquipoDetail
          equipo={equiposData[0].equipo}
          miAsignacion={equiposData[0].asignacion}
          plantel={equiposData[0].plantel}
          horarios={equiposData[0].horarios}
        />
      ) : (
        <EquiposTabs
          equipos={equiposData.map((d) => ({
            id: d.equipo.id as string,
            nombre: d.equipo.nombre as string,
          }))}
        >
          {equiposData.map((d) => (
            <EquipoDetail
              key={d.equipo.id as string}
              equipo={d.equipo}
              miAsignacion={d.asignacion}
              plantel={d.plantel}
              horarios={d.horarios}
            />
          ))}
        </EquiposTabs>
      )}

      <SinEquipo equipos={equiposDisponibles} titulo="Solicitar ingreso a otro equipo" />
    </div>
  )
}
