import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchEquipoPublico, fetchConfigPublica } from '../../_lib/queries'
import { Trophy, Users, MapPin, Calendar, Clock, QrCode, ArrowRight, Shield, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const ROL_LABELS: Record<string, string> = {
  jugador: 'Jugador',
  capitan: 'Capitan',
  subcapitan: 'Subcapitan',
  dt: 'DT',
  preparador_fisico: 'Prep. Fisico',
  kinesiologo: 'Kinesiologo',
  delegado: 'Delegado',
  ayudante_campo: 'Ayudante',
  coordinador: 'Coordinador',
  director_deportivo: 'Dir. Deportivo',
}

const STAFF_ROLES = ['dt', 'preparador_fisico', 'kinesiologo', 'delegado', 'ayudante_campo', 'coordinador', 'director_deportivo']

type Categoria = { nombre_display: string; edad_min: number | null; edad_max: number | null } | null
type Entidad = { id: string; nombre: string; logo_url: string | null; tipo: string } | null
type Persona = { id: string; nombre: string; apellido: string; foto_perfil_url: string | null } | null
type Miembro = {
  id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  persona: Persona
}

export default async function EquipoDetallePublicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [equipo, config] = await Promise.all([
    fetchEquipoPublico(id),
    fetchConfigPublica(),
  ])

  if (!equipo) notFound()

  const cat = equipo.categoria as unknown as Categoria
  const entidad = equipo.entidad as unknown as Entidad
  const miembros = (equipo.miembros ?? []) as unknown as Miembro[]

  const jugadores = miembros.filter(
    (m) => !STAFF_ROLES.includes(m.rol_equipo_slug)
  )
  const staff = miembros.filter((m) =>
    STAFF_ROLES.includes(m.rol_equipo_slug)
  )

  const colorPrincipal = equipo.color_principal || '#3A8FC5'
  const colorSecundario = equipo.color_secundario || '#1E3A5F'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hindu-club.vercel.app'
  const pageUrl = `${siteUrl}/equipos/${id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pageUrl)}`

  function formatNombrePrivado(persona: Persona) {
    if (!persona) return 'N/N'
    const inicial = persona.nombre ? persona.nombre.charAt(0).toUpperCase() + '.' : ''
    return `${inicial} ${persona.apellido || ''}`
  }

  return (
    <div>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colorPrincipal} 0%, ${colorSecundario} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
            {equipo.escudo_url ? (
              <img
                src={equipo.escudo_url}
                alt={equipo.nombre}
                className="h-24 w-24 rounded-xl object-contain bg-white/10 p-2"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl flex items-center justify-center bg-white/10">
                <Trophy className="h-12 w-12 text-white/80" />
              </div>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {equipo.nombre}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                {cat && (
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {cat.nombre_display}
                    {cat.edad_min != null && cat.edad_max != null && (
                      <span className="ml-1">({cat.edad_min}-{cat.edad_max})</span>
                    )}
                  </Badge>
                )}
                {equipo.torneo && (
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {equipo.torneo}
                  </Badge>
                )}
                {equipo.modalidad && (
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {equipo.modalidad}
                  </Badge>
                )}
              </div>
              {entidad && (
                <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                  {entidad.logo_url && (
                    <img src={entidad.logo_url} alt={entidad.nombre} className="h-5 w-5 rounded object-contain" />
                  )}
                  <span className="text-sm text-white/80">
                    <Shield className="inline h-3.5 w-3.5 mr-1" />
                    {entidad.nombre} ({entidad.tipo})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Foto del equipo */}
      {equipo.foto_equipo_url && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="overflow-hidden rounded-xl border shadow-lg">
            <img
              src={equipo.foto_equipo_url}
              alt={`Foto del equipo ${equipo.nombre}`}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Plantel */}
        {jugadores.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#3A8FC5]" />
              Plantel
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {jugadores.map((m) => {
                const persona = m.persona as unknown as Persona
                const esCapitan = m.rol_equipo_slug === 'capitan'
                const esSubcapitan = m.rol_equipo_slug === 'subcapitan'
                return (
                  <div
                    key={m.id}
                    className="relative rounded-xl border bg-card p-3 text-center hover:shadow-md transition-shadow"
                  >
                    {/* Dorsal */}
                    {m.dorsal != null && (
                      <div
                        className="absolute top-2 right-2 text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center text-white"
                        style={{ backgroundColor: colorPrincipal }}
                      >
                        {m.dorsal}
                      </div>
                    )}
                    {/* Foto o iniciales */}
                    {persona?.foto_perfil_url ? (
                      <img
                        src={persona.foto_perfil_url}
                        alt=""
                        className="mx-auto h-16 w-16 rounded-full object-cover border-2"
                        style={{ borderColor: colorPrincipal }}
                      />
                    ) : (
                      <div
                        className="mx-auto h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: colorPrincipal }}
                      >
                        {persona ? persona.nombre.charAt(0).toUpperCase() + persona.apellido.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <p className="mt-2 text-sm font-semibold truncate">
                      {formatNombrePrivado(persona)}
                    </p>
                    {m.posicion && (
                      <p className="text-xs text-muted-foreground">{m.posicion}</p>
                    )}
                    {(esCapitan || esSubcapitan) && (
                      <Badge
                        className="mt-1 text-[10px] px-1.5"
                        style={{
                          backgroundColor: esCapitan ? '#F2C531' : '#3A8FC5',
                          color: esCapitan ? '#1E3A5F' : 'white',
                        }}
                      >
                        <Star className="h-2.5 w-2.5 mr-0.5" />
                        {esCapitan ? 'Capitan' : 'Subcapitan'}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#3A8FC5]" />
              Cuerpo tecnico
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {staff.map((m) => {
                const persona = m.persona as unknown as Persona
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-4 rounded-xl border bg-card p-4"
                  >
                    {persona?.foto_perfil_url ? (
                      <img
                        src={persona.foto_perfil_url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover border-2"
                        style={{ borderColor: colorPrincipal }}
                      />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: colorPrincipal }}
                      >
                        {persona ? persona.nombre.charAt(0).toUpperCase() + persona.apellido.charAt(0).toUpperCase() : '?'}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{formatNombrePrivado(persona)}</p>
                      <Badge variant="outline" className="text-xs mt-0.5">
                        {ROL_LABELS[m.rol_equipo_slug] || m.rol_equipo_slug}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Proximos eventos */}
        {equipo.eventos && equipo.eventos.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-[#3A8FC5]" />
              Proximos eventos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {equipo.eventos.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-4 rounded-xl border bg-card p-4"
                >
                  <div
                    className="h-12 w-12 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: colorPrincipal }}
                  >
                    {ev.fecha ? (
                      <>
                        <span className="text-[10px] uppercase">
                          {new Date(ev.fecha + 'T12:00:00').toLocaleDateString('es-AR', { month: 'short' })}
                        </span>
                        <span className="text-lg leading-none">
                          {new Date(ev.fecha + 'T12:00:00').getDate()}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px]">{ev.dia_semana || '?'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">
                      {ev.titulo || ev.tipo_evento_slug || 'Actividad'}
                    </p>
                    {ev.hora_inicio && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {ev.hora_inicio}{ev.hora_fin ? ` - ${ev.hora_fin}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* QR Code */}
        <section className="flex flex-col items-center text-center py-8 border-t">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[#3A8FC5]" />
            Compartir equipo
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Escanealo para ver esta pagina desde el celular
          </p>
          <img
            src={qrUrl}
            alt="Codigo QR del equipo"
            className="h-[160px] w-[160px] rounded-lg border p-2 bg-white"
            width={160}
            height={160}
          />
        </section>

        {/* CTA Asociate */}
        <section
          className="rounded-2xl p-8 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${colorPrincipal} 0%, ${colorSecundario} 100%)`,
          }}
        >
          <h2 className="text-2xl font-bold">Queres sumarte?</h2>
          <p className="mt-2 text-white/80">
            Asociate al club y se parte de la familia {config?.nombre_display || 'Hindu Club'}.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-[#F2C531] text-[#1E3A5F] hover:bg-[#F2C531]/90 font-semibold"
            render={<Link href="/asociate" />}
          >
            Quiero asociarme
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </section>
      </div>
    </div>
  )
}
