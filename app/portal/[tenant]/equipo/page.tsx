import { Card, CardContent } from '@/components/ui/card'
import { ShieldHalf } from 'lucide-react'
import { TENANT_ID } from '@/lib/tenant'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchMisEquipos, fetchPlantel, fetchEventosEquipo, fetchReferentesEquipo } from './_lib/queries'
import { MisEquiposView, type EquipoData } from './_components/mis-equipos-view'

export default async function PortalEquipoPage() {
  const personaId = await getCurrentPersonaId()
  const equipos = personaId ? await fetchMisEquipos(personaId) : []

  if (equipos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">Mi equipo</h1>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            <ShieldHalf className="h-8 w-8 mx-auto mb-3 opacity-40" />
            No estás asignado a ningún equipo.
          </CardContent>
        </Card>
      </div>
    )
  }

  const equipoIds = equipos.map((e) => e.equipo_id)
  const [planteles, referentes, eventosTodos] = await Promise.all([
    Promise.all(equipos.map((e) => fetchPlantel(e.equipo_id))),
    Promise.all(equipos.map((e) => fetchReferentesEquipo(e.equipo_id))),
    fetchEventosEquipo(personaId!, equipoIds),
  ])

  const data: EquipoData[] = equipos.map((equipo, idx) => ({
    equipo,
    plantel: planteles[idx],
    referentes: referentes[idx],
    eventos: eventosTodos.filter((ev) => ev.equipo_id === equipo.equipo_id),
  }))

  return <MisEquiposView tenantId={TENANT_ID} equipos={data} />
}
