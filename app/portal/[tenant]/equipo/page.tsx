import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, ShieldHalf, Phone, MessageCircle, Headset } from 'lucide-react'
import { getCurrentPersonaId } from '@/lib/permissions/capabilities'
import { fetchMisEquipos, fetchPlantel, fetchMisPartidos, fetchReferentesEquipo } from './_lib/queries'

const CONV_LABEL: Record<string, string> = { titular: 'Titular', suplente: 'Suplente', convocado: 'Convocado' }

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

  const [planteles, referentes, partidos] = await Promise.all([
    Promise.all(equipos.map((e) => fetchPlantel(e.equipo_id))),
    Promise.all(equipos.map((e) => fetchReferentesEquipo(e.equipo_id))),
    fetchMisPartidos(personaId!, equipos.map((e) => e.equipo_id)),
  ])

  function soloDigitos(s: string | null): string | null {
    if (!s) return null
    const d = s.replace(/\D/g, '')
    return d.length >= 8 ? d : null
  }

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">Mi equipo</h1>

      {equipos.map((eq, idx) => (
        <div key={eq.equipo_id} className="space-y-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{eq.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {eq.disciplina_slug ?? ''}{eq.categoria ? ` · ${eq.categoria}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {eq.dorsal != null && <p className="text-2xl font-bold tabular-nums leading-none">#{eq.dorsal}</p>}
                  {eq.posicion && <p className="text-xs text-muted-foreground">{eq.posicion}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plantel */}
          <p className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Plantel ({planteles[idx].length})
          </p>
          <Card>
            <CardContent className="p-0 divide-y">
              {planteles[idx].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5">
                  <span className="w-7 text-center text-sm font-semibold text-muted-foreground tabular-nums">
                    {c.dorsal ?? '–'}
                  </span>
                  <span className="text-sm flex-1 truncate">{c.apellido}, {c.nombre}</span>
                  {c.rol && c.rol !== 'jugador' && <Badge variant="outline" className="capitalize text-[10px]">{c.rol.replace(/_/g, ' ')}</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Contacto del equipo (cuerpo técnico + capitanes) */}
          {referentes[idx].length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1">
                <Headset className="h-3.5 w-3.5" /> Contacto del equipo
              </p>
              <Card>
                <CardContent className="p-0 divide-y">
                  {referentes[idx].map((r, i) => {
                    const wa = soloDigitos(r.whatsapp ?? r.telefono)
                    const tel = soloDigitos(r.telefono ?? r.whatsapp)
                    return (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.apellido}, {r.nombre}</p>
                          <Badge variant="outline" className="capitalize text-[10px] mt-0.5">{r.rol.replace(/_/g, ' ')}</Badge>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {wa && (
                            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
                              className="h-8 w-8 rounded-md border flex items-center justify-center text-primary hover:bg-accent">
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}
                          {tel && (
                            <a href={`tel:${tel}`} aria-label="Llamar"
                              className="h-8 w-8 rounded-md border flex items-center justify-center text-muted-foreground hover:bg-accent">
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ))}

      {/* Mis próximos partidos */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground px-1">Mis próximos partidos</p>
        {partidos.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Sin partidos próximos.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {partidos.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 text-[10px] font-semibold leading-none">
                    <span>{p.fecha_inicio ? new Date(p.fecha_inicio + 'T00:00:00').getDate() : '--'}</span>
                    <span className="uppercase">{p.fecha_inicio ? new Date(p.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR', { month: 'short' }).replace('.', '') : ''}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.titulo ?? p.equipo_nombre ?? 'Partido'}</p>
                    {p.hora_inicio && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{p.hora_inicio.slice(0, 5)}</p>}
                  </div>
                  {p.mi_convocatoria
                    ? <Badge variant={p.mi_convocatoria === 'titular' ? 'default' : 'outline'} className="shrink-0">{CONV_LABEL[p.mi_convocatoria]}</Badge>
                    : <Badge variant="secondary" className="shrink-0">sin convocar</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
