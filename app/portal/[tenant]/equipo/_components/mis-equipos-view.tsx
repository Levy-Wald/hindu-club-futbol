'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Clock, Headset, CalendarDays, Swords, Dumbbell, ChevronRight, Star } from 'lucide-react'
import { ContactoBotones } from '../../_components/contacto-botones'
import type { MiEquipo, CompaneroPlantel, ReferenteEquipo, EventoEquipo } from '../_lib/queries'

export interface EquipoData {
  equipo: MiEquipo
  plantel: CompaneroPlantel[]
  referentes: ReferenteEquipo[]
  eventos: EventoEquipo[]
}

const CONV_LABEL: Record<string, string> = { titular: 'Titular', suplente: 'Suplente', convocado: 'Convocado' }
const ROL_LABEL: Record<string, string> = {
  dt: 'Director técnico', kine: 'Kinesiólogo', capitan: 'Capitán',
  subcapitan: 'Subcapitán', delegado: 'Delegado', preparador_fisico: 'Preparador físico',
  ayudante: 'Ayudante de campo', medico: 'Médico',
}
function rolLabel(slug: string) {
  return ROL_LABEL[slug] ?? slug.replace(/_/g, ' ')
}

const TIPO_META: Record<string, { label: string; icon: typeof Swords }> = {
  partido: { label: 'Partido', icon: Swords },
  amistoso: { label: 'Amistoso', icon: Swords },
  entrenamiento: { label: 'Entrenamiento', icon: Dumbbell },
}

function fmtFechaCorta(f: string | null): { dia: string; mes: string } {
  if (!f) return { dia: '--', mes: '' }
  const d = new Date(f + 'T00:00:00')
  return { dia: String(d.getDate()), mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '') }
}
function fmtFechaLarga(f: string | null): string {
  if (!f) return ''
  return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function MisEquiposView({ tenantId, equipos }: { tenantId: string; equipos: EquipoData[] }) {
  const base = `/portal/${tenantId}`
  const disciplinas = Array.from(new Set(equipos.map((e) => e.equipo.disciplina_slug).filter(Boolean))) as string[]
  const [filtro, setFiltro] = useState<string>('todos')

  const visibles = filtro === 'todos'
    ? equipos
    : equipos.filter((e) => e.equipo.disciplina_slug === filtro)

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">Mi equipo</h1>

      {/* Filtros por disciplina */}
      {disciplinas.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <FiltroChip activo={filtro === 'todos'} onClick={() => setFiltro('todos')}>Todos</FiltroChip>
          {disciplinas.map((d) => (
            <FiltroChip key={d} activo={filtro === d} onClick={() => setFiltro(d)}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </FiltroChip>
          ))}
        </div>
      )}

      {visibles.map(({ equipo: eq, plantel, referentes, eventos }) => {
        const proximo = eventos[0] ?? null
        return (
          <div key={eq.equipo_id} className="space-y-2">
            {/* Cabecera equipo */}
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

            {/* Próximo evento — arriba de todo */}
            {proximo && (
              <Link href={`${base}/agenda/${proximo.id}`} className="block">
                <Card className="border-primary/40 bg-primary/5">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-md bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0 leading-none">
                      <span className="text-base font-bold">{fmtFechaCorta(proximo.fecha_inicio).dia}</span>
                      <span className="text-[10px] uppercase">{fmtFechaCorta(proximo.fecha_inicio).mes}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
                        <Star className="h-3 w-3" /> Próximo evento
                      </p>
                      <p className="text-sm font-medium truncate">
                        {TIPO_META[proximo.tipo]?.label ?? proximo.tipo}{proximo.titulo ? ` · ${proximo.titulo}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {fmtFechaLarga(proximo.fecha_inicio)}{proximo.hora_inicio ? ` · ${proximo.hora_inicio.slice(0, 5)}` : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Plantel */}
            <p className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> Plantel ({plantel.length})
            </p>
            <Card>
              <CardContent className="p-0 divide-y">
                {plantel.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5">
                    <span className="w-7 text-center text-sm font-semibold text-muted-foreground tabular-nums">
                      {c.dorsal ?? '–'}
                    </span>
                    <span className="text-sm flex-1 truncate">{c.apellido}, {c.nombre}</span>
                    {c.rol && c.rol !== 'jugador' && <Badge variant="outline" className="capitalize text-[10px]">{rolLabel(c.rol)}</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contacto: cuerpo técnico + capitanes/subcapitanes/delegados */}
            {referentes.length > 0 && (
              <>
                <p className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1">
                  <Headset className="h-3.5 w-3.5" /> Staff y referentes
                </p>
                <Card>
                  <CardContent className="p-0 divide-y">
                    {referentes.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.apellido}, {r.nombre}</p>
                          <Badge variant="outline" className="capitalize text-[10px] mt-0.5">{rolLabel(r.rol)}</Badge>
                        </div>
                        <ContactoBotones
                          whatsapp={r.whatsapp}
                          telefono={r.telefono}
                          email={r.email}
                          personaId={r.persona_id}
                          nombre={`${r.nombre} ${r.apellido}`}
                          mensajeWhatsapp={`Hola ${r.nombre}, te escribo desde el portal del club.`}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Calendario del equipo: partidos + entrenamientos */}
            <p className="text-xs font-medium text-muted-foreground px-1 flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" /> Calendario del equipo
            </p>
            {eventos.length === 0 ? (
              <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Sin eventos próximos.</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {eventos.map((e) => {
                  const meta = TIPO_META[e.tipo] ?? { label: e.tipo, icon: CalendarDays }
                  const Icon = meta.icon
                  const fc = fmtFechaCorta(e.fecha_inicio)
                  return (
                    <Link key={e.id} href={`${base}/agenda/${e.id}`} className="block">
                      <Card>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 text-[10px] font-semibold leading-none">
                            <span>{fc.dia}</span>
                            <span className="uppercase">{fc.mes}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {meta.label}{e.titulo ? ` · ${e.titulo}` : ''}
                            </p>
                            {e.hora_inicio && <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{e.hora_inicio.slice(0, 5)}</p>}
                          </div>
                          {e.mi_convocatoria
                            ? <Badge variant={e.mi_convocatoria === 'titular' ? 'default' : 'outline'} className="shrink-0">{CONV_LABEL[e.mi_convocatoria]}</Badge>
                            : e.tipo !== 'entrenamiento' ? <Badge variant="secondary" className="shrink-0">sin convocar</Badge> : null}
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function FiltroChip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        activo ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
      }`}
    >
      {children}
    </button>
  )
}
