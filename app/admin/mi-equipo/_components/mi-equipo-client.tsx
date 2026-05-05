'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
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
  Download,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'
import { TarjetaJugador } from './tarjeta-jugador'
import { ExportPlantel } from './export-plantel'
import { editarEvento } from '../../equipos/_actions'

interface MiEquipoClientProps {
  equipo: Record<string, unknown>
  miAsignacion: Record<string, unknown>
  plantel: Array<Record<string, unknown>>
  horarios: Array<Record<string, unknown>>
}

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const ROLES_STAFF = ['dt', 'preparador_fisico', 'kinesiologo', 'delegado', 'ayudante_campo', 'masajista', 'utilero']
const ROLES_REFERENTES = ['capitan', 'subcapitan']
const ROLES_PUEDEN_EDITAR_EVENTOS = ['dt', 'capitan', 'subcapitan', 'delegado', 'preparador_fisico', 'ayudante_campo']

const TIPOS_ACTIVIDAD = [
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'partido_local', label: 'Partido local' },
  { value: 'partido_visitante', label: 'Partido visitante' },
  { value: 'amistoso', label: 'Amistoso' },
  { value: 'torneo', label: 'Torneo' },
  { value: 'otro', label: 'Otro' },
]

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
  const fechaNac = p?.fecha_nacimiento as string | null
  const edad = fechaNac ? Math.floor((Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
  return {
    nombre: p?.nombre as string || '',
    apellido: p?.apellido as string || '',
    dorsal: j.dorsal as number | null,
    posicion: j.posicion as string | null,
    rol: (j.rol_equipo_slug as string) || 'jugador',
    foto_url: p?.foto_perfil_url as string | null,
    foto_credencial_url: p?.foto_credencial_url as string | null,
    pie_dominante: p?.pie_dominante as string | null,
    altura_cm: p?.altura_cm as number | null,
    peso_kg: p?.peso_kg as number | null,
    edad,
  }
}

export function MiEquipoClient({ equipo, miAsignacion, plantel, horarios }: MiEquipoClientProps) {
  const staff = plantel.filter((p) => ROLES_STAFF.includes(p.rol_equipo_slug as string))
  const referentes = plantel.filter((p) => ROLES_REFERENTES.includes(p.rol_equipo_slug as string))
  // Jugadores = todos menos staff (capitán y referentes SÍ son jugadores)
  const jugadores = plantel.filter((p) => !ROLES_STAFF.includes(p.rol_equipo_slug as string))

  const indumentaria = equipo.indumentaria as Record<string, { descripcion?: string; foto_url?: string }> | null
  const fotoEquipo = equipo.foto_equipo_url as string | null

  // Eventos ordenados cronológicamente por fecha real
  const eventosUnicos = deduplicarPorId(horarios)
  const hoyStr = new Date().toISOString().split('T')[0]
  // Solo mostrar eventos futuros o de hoy
  const eventosFuturos = eventosUnicos.filter((e) => {
    const fecha = e.fecha as string | null
    if (fecha) return fecha >= hoyStr
    return true // eventos sin fecha (legacy) siempre se muestran
  })
  const eventosCronologicos = [...eventosFuturos].sort((a, b) => {
    const fA = a.fecha as string | null
    const fB = b.fecha as string | null
    // Eventos con fecha van primero, ordenados por fecha
    if (fA && fB) {
      if (fA !== fB) return fA.localeCompare(fB)
      return ((a.hora_inicio as string) || '').localeCompare((b.hora_inicio as string) || '')
    }
    if (fA && !fB) return -1
    if (!fA && fB) return 1
    // Ambos sin fecha: por dia_semana
    const dA = a.dia_semana as number
    const dB = b.dia_semana as number
    if (dA !== dB) return dA - dB
    return ((a.hora_inicio as string) || '').localeCompare((b.hora_inicio as string) || '')
  })

  const proximaActividad = eventosCronologicos[0] ?? null

  const equipoData = buildEquipoData(equipo)
  const miRol = miAsignacion.rol_equipo_slug as string
  const puedeEditarEventos = ROLES_PUEDEN_EDITAR_EVENTOS.includes(miRol)
  const equipoId = equipo.id as string

  // Edit event state
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [editId, setEditId] = useState('')
  const [editFecha, setEditFecha] = useState('')
  const [editHoraInicio, setEditHoraInicio] = useState('')
  const [editHoraFin, setEditHoraFin] = useState('')
  const [editTipoActividad, setEditTipoActividad] = useState('')
  const [editTitulo, setEditTitulo] = useState('')
  const [editHoraCitacion, setEditHoraCitacion] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')

  function openEditEvento(evento: Record<string, unknown>) {
    setEditId(evento.id as string)
    setEditFecha((evento.fecha as string) ?? '')
    setEditHoraInicio(((evento.hora_inicio as string) ?? '').slice(0, 5))
    setEditHoraFin(((evento.hora_fin as string) ?? '').slice(0, 5))
    setEditTipoActividad((evento.tipo_actividad as string) ?? '')
    setEditTitulo((evento.titulo as string) ?? '')
    setEditHoraCitacion(((evento.hora_citacion as string) ?? '').slice(0, 5))
    setEditDescripcion((evento.descripcion as string) ?? '')
    setEditOpen(true)
  }

  function handleEditarEvento(e: React.FormEvent) {
    e.preventDefault()
    if (!editFecha || !editHoraInicio || !editHoraFin || !editTipoActividad) {
      toast.error('Fecha, hora inicio, hora fin y tipo son obligatorios.')
      return
    }
    startTransition(async () => {
      const result = await editarEvento(editId, equipoId, {
        fecha: editFecha,
        hora_inicio: editHoraInicio,
        hora_fin: editHoraFin,
        tipo_actividad: editTipoActividad,
        titulo: editTitulo || null,
        hora_citacion: editHoraCitacion || null,
        descripcion: editDescripcion || null,
      })
      if (result.ok) {
        toast.success(result.message)
        setEditOpen(false)
      } else {
        toast.error(result.message)
      }
    })
  }

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
                    {formatFechaEvento(proximaActividad)}
                  </p>
                  {proximaActividad.titulo ? (
                    <p className="text-sm text-white/80 font-medium">{proximaActividad.titulo as string}</p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="capitalize">
                      {formatTipoActividad(proximaActividad.tipo_actividad as string)}
                    </Badge>
                    {(proximaActividad.hora_citacion as string | null) ? (
                      <span className="text-xs text-muted-foreground">
                        Citación: {(proximaActividad.hora_citacion as string).slice(0, 5)}
                      </span>
                    ) : null}
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

      {/* 2. CALENDARIO — cronológico por fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximos eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventosCronologicos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin eventos programados</p>
          ) : (
            <div className="space-y-2">
              {eventosCronologicos.map((h) => (
                <EventoCard
                  key={h.id as string}
                  evento={h}
                  equipoNombre={equipo.nombre as string}
                  puedeEditar={puedeEditarEventos}
                  onEditar={openEditEvento}
                />
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

      {/* Dialog editar evento (DT, capitán, delegados) */}
      {puedeEditarEventos ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar evento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditarEvento} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mi-edit-fecha">Fecha</Label>
                <Input id="mi-edit-fecha" type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mi-edit-inicio">Hora inicio</Label>
                  <Input id="mi-edit-inicio" type="time" value={editHoraInicio} onChange={(e) => setEditHoraInicio(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mi-edit-fin">Hora fin</Label>
                  <Input id="mi-edit-fin" type="time" value={editHoraFin} onChange={(e) => setEditHoraFin(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipo de actividad</Label>
                <Select value={editTipoActividad} onValueChange={(v) => setEditTipoActividad(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_ACTIVIDAD.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mi-edit-titulo">Título (opcional)</Label>
                <Input id="mi-edit-titulo" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} placeholder="Ej: Partido vs River" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mi-edit-citacion">Hora de citación (opcional)</Label>
                <Input id="mi-edit-citacion" type="time" value={editHoraCitacion} onChange={(e) => setEditHoraCitacion(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mi-edit-desc">Descripción (opcional)</Label>
                <Textarea id="mi-edit-desc" value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} rows={2} placeholder="Notas adicionales..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : 'Guardar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}

/* ─── Sub-componentes ─── */

function EventoCard({ evento, equipoNombre, puedeEditar, onEditar }: {
  evento: Record<string, unknown>
  equipoNombre: string
  puedeEditar: boolean
  onEditar: (evento: Record<string, unknown>) => void
}) {
  const sede = evento.sede as Record<string, unknown> | null
  const cancha = evento.cancha as Record<string, unknown> | null
  const direccionObj = sede?.direccion as Record<string, unknown> | null
  const direccion = direccionObj
    ? [direccionObj.calle, direccionObj.numero, direccionObj.ciudad].filter(Boolean).join(' ') || null
    : null
  const nombreLugar = [
    sede ? (sede.nombre as string) : '',
    cancha ? (cancha.nombre as string) : '',
  ].filter(Boolean).join(' · ')
  const searchQuery = encodeURIComponent(direccion || nombreLugar || '')
  const horaCitacion = evento.hora_citacion as string | null
  const titulo = evento.titulo as string | null

  return (
    <div className="border rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors space-y-1.5">
      {/* Primera fila: fecha, horario, tipo */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{formatFechaEvento(evento)}</p>
          {titulo ? <p className="text-xs text-muted-foreground">{titulo}</p> : null}
        </div>
        <div className="font-mono tabular-nums text-sm font-medium shrink-0">
          {(evento.hora_inicio as string)?.slice(0, 5)} – {(evento.hora_fin as string)?.slice(0, 5)}
        </div>
        <Badge variant="outline" className="text-[10px] capitalize shrink-0">
          {formatTipoActividad(evento.tipo_actividad as string)}
        </Badge>
      </div>

      {/* Segunda fila: sede, citación, maps, ics */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {nombreLugar ? (
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {nombreLugar}
          </span>
        ) : null}
        {direccion ? (
          <span className="truncate hidden sm:inline">{direccion}</span>
        ) : null}
        {horaCitacion ? (
          <span className="shrink-0">Citación: {horaCitacion.slice(0, 5)}</span>
        ) : null}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {(direccion || nombreLugar) ? (
            <>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${searchQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                title="Google Maps"
              >
                <Navigation className="h-3.5 w-3.5" />
              </a>
              <a
                href={`https://waze.com/ul?q=${searchQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                title="Waze"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </>
          ) : null}
          {puedeEditar ? (
            <button
              type="button"
              onClick={() => onEditar(evento)}
              className="text-muted-foreground hover:text-foreground"
              title="Editar evento"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => downloadICS(evento, equipoNombre, nombreLugar, direccion)}
            className="text-muted-foreground hover:text-foreground"
            title="Descargar para calendario (.ics)"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
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

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Formatea la fecha de un evento: usa `fecha` si existe, sino calcula desde dia_semana */
function formatFechaEvento(evento: Record<string, unknown>): string {
  const fecha = evento.fecha as string | null
  if (fecha) {
    const d = new Date(fecha + 'T12:00:00') // noon to avoid timezone issues
    const jsDay = d.getDay()
    const diaSemana = jsDay === 0 ? 7 : jsDay
    return `${DIAS[diaSemana]} ${d.getDate()} de ${MESES[d.getMonth()]}`
  }
  // Fallback para eventos legacy sin fecha
  const diaSemana = evento.dia_semana as number
  return DIAS[diaSemana] || 'Sin fecha'
}

/** Genera y descarga un archivo .ics para agregar el evento al calendario */
function downloadICS(
  evento: Record<string, unknown>,
  equipoNombre: string,
  ubicacion: string,
  direccion: string | null
) {
  const fecha = evento.fecha as string | null
  if (!fecha) return

  const horaInicio = (evento.hora_inicio as string) || '00:00'
  const horaFin = (evento.hora_fin as string) || '23:59'
  const titulo = (evento.titulo as string) || formatTipoActividad(evento.tipo_actividad as string)
  const horaCitacion = evento.hora_citacion as string | null
  const descripcionEvento = evento.descripcion as string | null

  // Format: YYYYMMDDTHHMMSS (local time)
  const dtStart = fecha.replace(/-/g, '') + 'T' + horaInicio.replace(/:/g, '').padEnd(6, '0')
  const dtEnd = fecha.replace(/-/g, '') + 'T' + horaFin.replace(/:/g, '').padEnd(6, '0')

  const locationParts = [ubicacion, direccion].filter(Boolean).join(' - ')
  const descParts = [
    `Equipo: ${equipoNombre}`,
    horaCitacion ? `Hora de citación: ${horaCitacion.slice(0, 5)}` : '',
    descripcionEvento || '',
  ].filter(Boolean).join('\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubCore//Hindu Club//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${titulo} - ${equipoNombre}`,
    locationParts ? `LOCATION:${locationParts}` : '',
    `DESCRIPTION:${descParts}`,
    `UID:${evento.id as string}@clubcore`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `evento-${fecha}.ics`
  link.click()
  URL.revokeObjectURL(url)
}
