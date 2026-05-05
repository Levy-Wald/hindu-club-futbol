'use client'

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
  CreditCard,
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
const DIAS_CORTO = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

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

export function MiEquipoClient({ equipo, miAsignacion, plantel, horarios }: MiEquipoClientProps) {
  const staff = plantel.filter((p) => ROLES_STAFF.includes(p.rol_equipo_slug as string))
  const referentes = plantel.filter((p) => ROLES_REFERENTES.includes(p.rol_equipo_slug as string))
  const jugadores = plantel.filter(
    (p) => !ROLES_STAFF.includes(p.rol_equipo_slug as string) && !ROLES_REFERENTES.includes(p.rol_equipo_slug as string)
  )

  const indumentaria = equipo.indumentaria as Record<string, { descripcion?: string; foto_url?: string }> | null
  const fotoEquipo = equipo.foto_equipo_url as string | null

  // Agrupar horarios por tipo
  const horariosEntrenamiento = horarios.filter((h) => (h.tipo_actividad as string) === 'entrenamiento')
  const horariosPartido = horarios.filter((h) => (h.tipo_actividad as string) === 'partido')
  const horariosOtros = horarios.filter(
    (h) => (h.tipo_actividad as string) !== 'entrenamiento' && (h.tipo_actividad as string) !== 'partido'
  )

  // Próxima actividad: buscar el horario más cercano al día actual
  const hoy = new Date()
  const diaHoy = hoy.getDay() === 0 ? 7 : hoy.getDay() // lunes=1, domingo=7
  const proximaActividad = getProximaActividad(horarios, diaHoy)

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

      {/* 1. PRÓXIMA ACTIVIDAD — widget destacado */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Próxima actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximaActividad ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {DIAS[proximaActividad.dia_semana as number]}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="capitalize">
                    {proximaActividad.tipo_actividad as string}
                  </Badge>
                  {(() => {
                    const sede = proximaActividad.sede as Record<string, unknown> | null
                    const cancha = proximaActividad.cancha as Record<string, unknown> | null
                    return (sede || cancha) ? (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {sede ? (sede.nombre as string) : ''}
                        {cancha ? ` - ${cancha.nombre as string}` : ''}
                      </span>
                    ) : null
                  })()}
                </div>
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
          ) : (
            <p className="text-sm text-muted-foreground">Sin actividades programadas</p>
          )}
        </CardContent>
      </Card>

      {/* 2. HORARIOS — entrenamientos y partidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {horarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin horarios cargados</p>
          ) : (
            <>
              {horariosEntrenamiento.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Entrenamientos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {horariosEntrenamiento.map((h) => (
                      <HorarioCard key={h.id as string} horario={h} />
                    ))}
                  </div>
                </div>
              ) : null}
              {horariosPartido.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Partidos
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {horariosPartido.map((h) => (
                      <HorarioCard key={h.id as string} horario={h} />
                    ))}
                  </div>
                </div>
              ) : null}
              {horariosOtros.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Otras actividades
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {horariosOtros.map((h) => (
                      <HorarioCard key={h.id as string} horario={h} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* 3. INDUMENTARIA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Indumentaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {indumentaria && Object.keys(indumentaria).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {INDUMENTARIA_ORDER.map((tipo) => {
                const data = indumentaria[tipo]
                if (!data) return null
                return (
                  <div key={tipo} className="border rounded-lg p-3 text-center space-y-2">
                    {data.foto_url ? (
                      <img
                        src={data.foto_url}
                        alt={INDUMENTARIA_LABELS[tipo] || tipo}
                        className="w-full h-20 sm:h-24 object-contain rounded"
                      />
                    ) : (
                      <div className="w-full h-20 sm:h-24 bg-muted rounded flex items-center justify-center">
                        <Shirt className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <p className="text-xs font-semibold">{INDUMENTARIA_LABELS[tipo] || tipo}</p>
                    {data.descripcion ? (
                      <p className="text-xs text-muted-foreground leading-tight">{data.descripcion}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin indumentaria cargada</p>
          )}
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
                <PersonaCardCompleta key={s.id as string} miembro={s} />
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
                  {(equipo.categoria as { nombre_display: string } | null)?.nombre_display
                    ? ` · ${(equipo.categoria as { nombre_display: string }).nombre_display}`
                    : ''}
                </p>
              </div>
              <Badge variant="default" className="shrink-0">En curso</Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* 7. PLANTEL COMPLETO — tabla con todos los datos de contacto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Plantel ({jugadores.length} jugadores)
          </CardTitle>
          <ExportPlantel
            equipo={{
              nombre: equipo.nombre as string,
              escudo_url: equipo.escudo_url as string | null,
              color_principal: equipo.color_principal as string | null,
              disciplina: equipo.disciplina_slug as string,
              categoria: (equipo.categoria as { nombre_display: string } | null)?.nombre_display ?? null,
              torneo: equipo.torneo as string | null,
            }}
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
                        <p className="text-sm font-medium truncate">
                          {p.apellido as string}, {p.nombre as string}
                        </p>
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
                          jugador={{
                            nombre: p.nombre as string,
                            apellido: p.apellido as string,
                            dorsal: j.dorsal as number | null,
                            posicion: j.posicion as string | null,
                            rol: (j.rol_equipo_slug as string) || 'jugador',
                            foto_url: p.foto_perfil_url as string | null,
                          }}
                          equipo={{
                            nombre: equipo.nombre as string,
                            escudo_url: equipo.escudo_url as string | null,
                            color_principal: equipo.color_principal as string | null,
                            color_secundario: equipo.color_secundario as string | null,
                            disciplina: equipo.disciplina_slug as string,
                            categoria: (equipo.categoria as { nombre_display: string } | null)?.nombre_display ?? null,
                            torneo: equipo.torneo as string | null,
                          }}
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

  return (
    <div className="flex items-center justify-between border rounded-lg p-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">{DIAS[horario.dia_semana as number]}</p>
        {(sede || cancha) ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {sede ? (sede.nombre as string) : ''}
            {cancha ? ` · ${cancha.nombre as string}` : ''}
          </p>
        ) : null}
      </div>
      <div className="text-right">
        <span className="text-sm font-mono tabular-nums font-medium">
          {(horario.hora_inicio as string)?.slice(0, 5)}
        </span>
        <span className="text-xs text-muted-foreground"> – </span>
        <span className="text-sm font-mono tabular-nums font-medium">
          {(horario.hora_fin as string)?.slice(0, 5)}
        </span>
      </div>
    </div>
  )
}

function PersonaCardCompleta({
  miembro,
  destacado = false,
}: {
  miembro: Record<string, unknown>
  destacado?: boolean
}) {
  const p = miembro.persona as Record<string, unknown>
  if (!p) return null

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
          <p className="text-sm font-semibold truncate">
            {p.nombre as string} {p.apellido as string}
          </p>
          <Badge variant={destacado ? 'default' : 'secondary'} className="text-xs mt-0.5 capitalize">
            {destacado ? <Star className="h-3 w-3 mr-1" /> : null}
            {rolLabel}
          </Badge>
        </div>
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

function getProximaActividad(
  horarios: Array<Record<string, unknown>>,
  diaHoy: number
): Record<string, unknown> | null {
  if (horarios.length === 0) return null

  // Buscar la próxima actividad a partir de hoy
  const horariosOrdenados = [...horarios].sort((a, b) => {
    const dA = a.dia_semana as number
    const dB = b.dia_semana as number
    // Normalizar relativo a hoy
    const distA = dA >= diaHoy ? dA - diaHoy : 7 - diaHoy + dA
    const distB = dB >= diaHoy ? dB - diaHoy : 7 - diaHoy + dB
    if (distA !== distB) return distA - distB
    return ((a.hora_inicio as string) || '').localeCompare((b.hora_inicio as string) || '')
  })

  return horariosOrdenados[0]
}
