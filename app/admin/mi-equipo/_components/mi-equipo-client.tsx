'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Shirt,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trophy,
  Shield,
  Star,
  MessageCircle,
  UserCheck,
  Navigation,
  ExternalLink,
} from 'lucide-react'
import { TarjetaJugador } from './tarjeta-jugador'
import { ExportPlantel } from './export-plantel'

interface MiEquipoClientProps {
  equipo: Record<string, unknown>
  miAsignacion: Record<string, unknown>
  plantel: Array<Record<string, unknown>>
  horarios: Array<Record<string, unknown>>
}

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const ROLES_STAFF = ['dt', 'preparador_fisico', 'kinesiologo', 'delegado', 'ayudante_campo', 'masajista', 'utilero']
const ROLES_REFERENTES = ['capitan', 'subcapitan']

const ROL_LABELS: Record<string, string> = {
  dt: 'Director Técnico',
  preparador_fisico: 'Preparador Físico',
  kinesiologo: 'Kinesiólogo',
  delegado: 'Delegado',
  ayudante_campo: 'Ayudante de Campo',
  masajista: 'Masajista',
  utilero: 'Utilero',
  capitan: 'Capitán',
  subcapitan: 'Sub-capitán',
  jugador: 'Jugador',
  arquero: 'Arquero',
}

const INDUMENTARIA_LABELS: Record<string, string> = {
  titular: 'Titular',
  suplente: 'Suplente',
  arquero_titular: 'Arquero titular',
  arquero_suplente: 'Arquero suplente',
  dia_club: 'Día de club',
  dia_visitante: 'Día visitante',
}

const INDUMENTARIA_ORDER = ['titular', 'suplente', 'arquero_titular', 'arquero_suplente', 'dia_club', 'dia_visitante']

function buildEquipoData(equipo: Record<string, unknown>) {
  return {
    nombre: equipo.nombre as string,
    escudo_url: equipo.escudo_url as string | null,
    color_principal: equipo.color_principal as string | null,
    color_secundario: equipo.color_secundario as string | null,
    disciplina: equipo.disciplina_slug as string,
    categoria: (equipo.categoria as { nombre_display: string } | null)?.nombre_display ?? null,
    torneo: equipo.torneo as string | null,
  }
}

function buildJugadorData(j: Record<string, unknown>) {
  const p = j.persona as Record<string, unknown>
  return {
    nombre: p?.nombre as string || '',
    apellido: p?.apellido as string || '',
    dorsal: j.dorsal as number | null,
    posicion: j.posicion as string | null,
    rol: (j.rol_equipo_slug as string) || 'jugador',
    foto_url: p?.foto_perfil_url as string | null,
  }
}

export function MiEquipoClient({ equipo, miAsignacion, plantel, horarios }: MiEquipoClientProps) {
  const staff = plantel.filter((p) => ROLES_STAFF.includes(p.rol_equipo_slug as string))
  const referentes = plantel.filter((p) => ROLES_REFERENTES.includes(p.rol_equipo_slug as string))
  // Jugadores = todos menos staff (capitán y referentes SÍ son jugadores)
  const jugadores = plantel.filter((p) => !ROLES_STAFF.includes(p.rol_equipo_slug as string))

  const indumentaria = equipo.indumentaria as Record<string, { descripcion?: string; foto_url?: string }> | null
  const fotoEquipo = equipo.foto_equipo_url as string | null

  // Horarios ordenados cronológicamente (Lun→Dom, por hora)
  const horariosUnicos = deduplicarPorId(horarios)
  const horariosCronologicos = [...horariosUnicos].sort((a, b) => {
    const dA = a.dia_semana as number
    const dB = b.dia_semana as number
    if (dA !== dB) return dA - dB
    return ((a.hora_inicio as string) || '').localeCompare((b.hora_inicio as string) || '')
  })

  const hoy = new Date()
  const diaHoy = hoy.getDay() === 0 ? 7 : hoy.getDay()
  const proximaActividad = getProximaActividad(horariosUnicos, diaHoy)

  const equipoData = buildEquipoData(equipo)

  return (
    <div className="space-y-4">
      {/* Foto del equipo */}
      {fotoEquipo ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <img
              src={fotoEquipo}
              alt={`Foto ${equipo.nombre as string}`}
              className="w-full h-48 sm:h-64 object-cover"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* 1. PRÓXIMA ACTIVIDAD */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Próxima actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximaActividad ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-2xl font-bold">
                    {DIAS[proximaActividad.dia_semana as number]}
                  </p>
                  <Badge variant="default" className="capitalize">
                    {formatTipoActividad(proximaActividad.tipo_actividad as string)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono tabular-nums">
                    {(proximaActividad.hora_inicio as string)?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    hasta {(proximaActividad.hora_fin as string)?.slice(0, 5)}
                  </p>
                </div>
              </div>

              {/* Ubicación y links de navegación */}
              {(() => {
                const sede = proximaActividad.sede as Record<string, unknown> | null
                const cancha = proximaActividad.cancha as Record<string, unknown> | null
                if (!sede && !cancha) return null
                const nombreLugar = [
                  sede ? (sede.nombre as string) : '',
                  cancha ? (cancha.nombre as string) : '',
                ].filter(Boolean).join(' · ')
                const direccionObj = sede?.direccion as Record<string, unknown> | null
                const direccion = direccionObj
                  ? [direccionObj.calle, direccionObj.numero, direccionObj.ciudad].filter(Boolean).join(' ') || null
                  : null
                const searchQuery = encodeURIComponent(direccion || nombreLugar)
                return (
                  <div className="border-t border-primary/10 pt-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{nombreLugar}</p>
                        {direccion ? (
                          <p className="text-xs text-muted-foreground">{direccion}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${searchQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-background border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
                      >
                        <Navigation className="h-3 w-3" />
                        Google Maps
                      </a>
                      <a
                        href={`https://waze.com/ul?q=${searchQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs bg-background border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Waze
                      </a>
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin actividades programadas</p>
          )}
        </CardContent>
      </Card>

      {/* 2. HORARIOS — cronológico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horarios semanales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {horariosCronologicos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin horarios cargados</p>
          ) : (
            <div className="space-y-2">
              {horariosCronologicos.map((h) => (
                <HorarioCard key={h.id as string} horario={h} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. INDUMENTARIA — siempre muestra los 6 tipos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Indumentaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {INDUMENTARIA_ORDER.map((tipo) => {
              const data = indumentaria?.[tipo]
              return (
                <div key={tipo} className="border rounded-lg p-3 text-center space-y-2">
                  {data?.foto_url ? (
                    <img
                      src={data.foto_url}
                      alt={INDUMENTARIA_LABELS[tipo]}
                      className="w-full h-20 sm:h-24 object-contain rounded"
                    />
                  ) : (
                    <div className="w-full h-20 sm:h-24 bg-muted rounded flex items-center justify-center">
                      <Shirt className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <p className="text-xs font-semibold">{INDUMENTARIA_LABELS[tipo]}</p>
                  {data?.descripcion ? (
                    <p className="text-xs text-muted-foreground leading-tight">{data.descripcion}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 italic">Sin cargar</p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. CAPITÁN Y REFERENTES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Capitán y referentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referentes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {referentes.map((r) => (
                <PersonaCardCompleta
                  key={r.id as string}
                  miembro={r}
                  equipo={equipoData}
                  destacado
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin capitán o referentes asignados</p>
          )}
        </CardContent>
      </Card>

      {/* 5. CUERPO TÉCNICO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Cuerpo técnico
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staff.map((s) => (
                <PersonaCardCompleta key={s.id as string} miembro={s} equipo={equipoData} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin cuerpo técnico asignado</p>
          )}
        </CardContent>
      </Card>

      {/* 6. TORNEOS Y CAMPEONATOS */}
      {equipo.torneo ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Torneos y campeonatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 border rounded-lg p-4">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{equipo.torneo as string}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {equipo.disciplina_slug as string}
                  {equipoData.categoria ? ` · ${equipoData.categoria}` : ''}
                </p>
              </div>
              <Badge variant="default" className="shrink-0">En curso</Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 7. PLANTEL — jugadores + referentes (NO staff) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Plantel ({jugadores.length} jugadores)
          </CardTitle>
          <ExportPlantel
            equipo={equipoData}
            plantel={plantel.map((m) => ({
              id: m.id as string,
              rol_equipo_slug: m.rol_equipo_slug as string,
              dorsal: m.dorsal as number | null,
              posicion: m.posicion as string | null,
              persona: m.persona ? {
                nombre: (m.persona as Record<string, unknown>).nombre as string,
                apellido: (m.persona as Record<string, unknown>).apellido as string,
                whatsapp: (m.persona as Record<string, unknown>).whatsapp as string | null,
                telefono_principal: (m.persona as Record<string, unknown>).telefono_principal as string | null,
                email_principal: (m.persona as Record<string, unknown>).email_principal as string | null,
                numero_documento: (m.persona as Record<string, unknown>).numero_documento as string | null,
              } : null,
            }))}
          />
        </CardHeader>
        <CardContent>
          {jugadores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin jugadores en el plantel</p>
          ) : (
            <div className="space-y-2">
              {jugadores
                .sort((a, b) => {
                  const dA = a.dorsal as number | null
                  const dB = b.dorsal as number | null
                  if (dA != null && dB != null) return dA - dB
                  if (dA != null) return -1
                  if (dB != null) return 1
                  const pA = a.persona as Record<string, unknown>
                  const pB = b.persona as Record<string, unknown>
                  return ((pA?.apellido as string) || '').localeCompare((pB?.apellido as string) || '')
                })
                .map((j) => {
                  const p = j.persona as Record<string, unknown>
                  if (!p) return null
                  const personaId = p.id as string
                  const isReferente = ROLES_REFERENTES.includes(j.rol_equipo_slug as string)

                  return (
                    <div key={j.id as string} className="flex items-center gap-3 border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      {/* Dorsal */}
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {j.dorsal ? (
                          <span className="text-sm font-bold text-primary">{j.dorsal as number}</span>
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-9 w-9 shrink-0">
                        {p.foto_perfil_url ? <AvatarImage src={p.foto_perfil_url as string} /> : null}
                        <AvatarFallback className="text-xs">
                          {((p.nombre as string)?.[0] || '') + ((p.apellido as string)?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/admin/personas/${personaId}`}
                          className="text-sm font-medium truncate hover:underline block"
                        >
                          {p.apellido as string}, {p.nombre as string}
                          {isReferente ? (
                            <Badge variant="default" className="ml-2 text-[10px] h-4 align-middle">
                              <Star className="h-2.5 w-2.5 mr-0.5" />
                              {ROL_LABELS[j.rol_equipo_slug as string]}
                            </Badge>
                          ) : null}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {p.whatsapp ? (
                            <a
                              href={`https://wa.me/${(p.whatsapp as string).replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-green-600 transition-colors"
                            >
                              <MessageCircle className="h-3 w-3" />
                              {p.whatsapp as string}
                            </a>
                          ) : null}
                          {p.telefono_principal && p.telefono_principal !== p.whatsapp ? (
                            <a
                              href={`tel:${p.telefono_principal as string}`}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              {p.telefono_principal as string}
                            </a>
                          ) : null}
                          {p.email_principal ? (
                            <a
                              href={`mailto:${p.email_principal as string}`}
                              className="items-center gap-1 hover:text-foreground transition-colors hidden sm:flex"
                            >
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{p.email_principal as string}</span>
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {/* Posición + tarjeta */}
                      <div className="flex items-center gap-1 shrink-0">
                        {j.posicion ? (
                          <Badge variant="secondary" className="text-xs">{j.posicion as string}</Badge>
                        ) : null}
                        <TarjetaJugador
                          jugador={buildJugadorData(j)}
                          equipo={equipoData}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ─── Sub-componentes ─── */

function HorarioCard({ horario }: { horario: Record<string, unknown> }) {
  const sede = horario.sede as Record<string, unknown> | null
  const cancha = horario.cancha as Record<string, unknown> | null
  const direccionObj = sede?.direccion as Record<string, unknown> | null
  const direccion = direccionObj
    ? [direccionObj.calle, direccionObj.numero, direccionObj.ciudad].filter(Boolean).join(' ') || null
    : null
  const nombreLugar = [
    sede ? (sede.nombre as string) : '',
    cancha ? (cancha.nombre as string) : '',
  ].filter(Boolean).join(' · ')
  const searchQuery = encodeURIComponent(direccion || nombreLugar || '')

  return (
    <div className="flex items-center gap-3 border rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors">
      {/* Día */}
      <div className="w-20 shrink-0">
        <p className="text-sm font-semibold">{DIAS[horario.dia_semana as number]}</p>
      </div>

      {/* Horario */}
      <div className="font-mono tabular-nums text-sm font-medium shrink-0">
        {(horario.hora_inicio as string)?.slice(0, 5)} – {(horario.hora_fin as string)?.slice(0, 5)}
      </div>

      {/* Tipo actividad */}
      <Badge variant="outline" className="text-[10px] capitalize shrink-0">
        {formatTipoActividad(horario.tipo_actividad as string)}
      </Badge>

      {/* Sede/cancha */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs text-muted-foreground">
        {nombreLugar ? (
          <>
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{nombreLugar}</span>
          </>
        ) : null}
      </div>

      {/* Maps link */}
      {(direccion || nombreLugar) ? (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          title="Ver en Google Maps"
        >
          <Navigation className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  )
}

function PersonaCardCompleta({
  miembro,
  equipo,
  destacado = false,
}: {
  miembro: Record<string, unknown>
  equipo: ReturnType<typeof buildEquipoData>
  destacado?: boolean
}) {
  const p = miembro.persona as Record<string, unknown>
  if (!p) return null

  const personaId = p.id as string
  const rolLabel = ROL_LABELS[miembro.rol_equipo_slug as string] || (miembro.rol_equipo_slug as string)?.replace(/_/g, ' ')

  return (
    <div className={`border rounded-lg p-4 space-y-3 ${destacado ? 'border-primary/30 bg-primary/5' : ''}`}>
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11">
          {p.foto_perfil_url ? <AvatarImage src={p.foto_perfil_url as string} /> : null}
          <AvatarFallback>
            {((p.nombre as string)?.[0] || '') + ((p.apellido as string)?.[0] || '')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link
            href={`/admin/personas/${personaId}`}
            className="text-sm font-semibold truncate hover:underline block"
          >
            {p.nombre as string} {p.apellido as string}
          </Link>
          <Badge variant={destacado ? 'default' : 'secondary'} className="text-xs mt-0.5 capitalize">
            {destacado ? <Star className="h-3 w-3 mr-1" /> : null}
            {rolLabel}
          </Badge>
        </div>
        <TarjetaJugador
          jugador={buildJugadorData(miembro)}
          equipo={equipo}
        />
      </div>

      <div className="space-y-1.5">
        {p.whatsapp ? (
          <a
            href={`https://wa.me/${(p.whatsapp as string).replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-green-600 transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {p.whatsapp as string}
          </a>
        ) : null}
        {p.telefono_principal && p.telefono_principal !== p.whatsapp ? (
          <a
            href={`tel:${p.telefono_principal as string}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            {p.telefono_principal as string}
          </a>
        ) : null}
        {p.email_principal ? (
          <a
            href={`mailto:${p.email_principal as string}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{p.email_principal as string}</span>
          </a>
        ) : null}
      </div>
    </div>
  )
}

/* ─── Helpers ─── */

function formatTipoActividad(tipo: string): string {
  return tipo.replace(/_/g, ' ')
}

function deduplicarPorId(arr: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const seen = new Set<string>()
  return arr.filter((item) => {
    const id = item.id as string
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function getProximaActividad(
  horarios: Array<Record<string, unknown>>,
  diaHoy: number
): Record<string, unknown> | null {
  if (horarios.length === 0) return null

  const horariosOrdenados = [...horarios].sort((a, b) => {
    const dA = a.dia_semana as number
    const dB = b.dia_semana as number
    const distA = dA >= diaHoy ? dA - diaHoy : 7 - diaHoy + dA
    const distB = dB >= diaHoy ? dB - diaHoy : 7 - diaHoy + dB
    if (distA !== distB) return distA - distB
    return ((a.hora_inicio as string) || '').localeCompare((b.hora_inicio as string) || '')
  })

  return horariosOrdenados[0]
}
