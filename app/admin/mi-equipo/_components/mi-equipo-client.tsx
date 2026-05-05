'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Shirt, Users, Phone, Mail, Calendar, MapPin } from 'lucide-react'

interface MiEquipoClientProps {
  equipo: Record<string, unknown>
  miAsignacion: Record<string, unknown>
  plantel: Array<Record<string, unknown>>
  horarios: Array<Record<string, unknown>>
}

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const ROLES_STAFF = ['dt', 'preparador_fisico', 'kinesiologo', 'delegado', 'ayudante_campo']
const ROLES_REFERENTES = ['capitan', 'subcapitan']

export function MiEquipoClient({ equipo, miAsignacion, plantel, horarios }: MiEquipoClientProps) {
  const staff = plantel.filter((p) => ROLES_STAFF.includes(p.rol_equipo_slug as string))
  const referentes = plantel.filter((p) => ROLES_REFERENTES.includes(p.rol_equipo_slug as string))
  const jugadores = plantel.filter((p) => !ROLES_STAFF.includes(p.rol_equipo_slug as string))

  const indumentaria = equipo.indumentaria as Record<string, { descripcion?: string; foto_url?: string }> | null

  const fotoEquipo = equipo.foto_equipo_url as string | null

  return (
    <div className="space-y-6">
      {/* Foto del equipo */}
      {fotoEquipo && (
        <Card>
          <CardContent className="p-0">
            <img
              src={fotoEquipo}
              alt={`Foto ${equipo.nombre as string}`}
              className="w-full h-48 sm:h-64 object-cover rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Horarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {horarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin horarios cargados</p>
          ) : (
            <div className="space-y-2">
              {horarios.map((h) => {
                const sede = h.sede as Record<string, unknown> | null
                const cancha = h.cancha as Record<string, unknown> | null
                return (
                  <div key={h.id as string} className="flex items-center justify-between border rounded-md p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{DIAS[h.dia_semana as number] || `Día ${h.dia_semana}`}</span>
                        <Badge variant="outline" className="text-xs">{h.tipo_actividad as string}</Badge>
                      </div>
                      {(sede || cancha) ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {sede?.nombre as string}{cancha ? ` - ${cancha.nombre as string}` : ''}
                        </div>
                      ) : null}
                    </div>
                    <span className="text-sm font-mono">
                      {(h.hora_inicio as string)?.slice(0, 5)} - {(h.hora_fin as string)?.slice(0, 5)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indumentaria */}
      {indumentaria && Object.keys(indumentaria).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shirt className="h-4 w-4" />
              Indumentaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(indumentaria).map(([tipo, data]) => (
                <div key={tipo} className="border rounded-md p-3 text-center space-y-2">
                  {data.foto_url && (
                    <img src={data.foto_url} alt={tipo} className="w-full h-24 object-contain" />
                  )}
                  <p className="text-xs font-medium capitalize">{tipo.replace(/_/g, ' ')}</p>
                  {data.descripcion && <p className="text-xs text-muted-foreground">{data.descripcion}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cuerpo técnico */}
      {staff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cuerpo técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.map((s) => {
                const p = s.persona as Record<string, unknown>
                return (
                  <PersonaContacto key={s.id as string} persona={p} rol={s.rol_equipo_slug as string} />
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capitán / Referentes */}
      {referentes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capitán y referentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referentes.map((r) => {
                const p = r.persona as Record<string, unknown>
                return (
                  <PersonaContacto key={r.id as string} persona={p} rol={r.rol_equipo_slug as string} />
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plantel completo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Plantel ({jugadores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jugadores.map((j) => {
              const p = j.persona as Record<string, unknown>
              return (
                <div key={j.id as string} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3">
                    {j.dorsal ? <span className="text-sm font-bold w-6 text-center">#{j.dorsal as number}</span> : null}
                    <div>
                      <p className="text-sm font-medium">{p?.apellido as string}, {p?.nombre as string}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {p?.whatsapp ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {p.whatsapp as string}
                          </span>
                        ) : null}
                        {p?.email_principal ? (
                          <span className="flex items-center gap-1 hidden sm:flex">
                            <Mail className="h-3 w-3" />
                            {p.email_principal as string}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {j.posicion ? <Badge variant="secondary" className="text-xs">{j.posicion as string}</Badge> : null}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PersonaContacto({ persona, rol }: { persona: Record<string, unknown>; rol: string }) {
  return (
    <div className="flex items-center justify-between border rounded-md p-3">
      <div>
        <p className="text-sm font-medium">{persona?.apellido as string}, {persona?.nombre as string}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {persona?.whatsapp ? (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {persona.whatsapp as string}
            </span>
          ) : null}
          {persona?.email_principal ? (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {persona.email_principal as string}
            </span>
          ) : null}
        </div>
      </div>
      <Badge variant="outline" className="text-xs capitalize">{rol.replace(/_/g, ' ')}</Badge>
    </div>
  )
}
