import NextImage from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, Info, Users, Shirt, Settings, Trophy, Building2, Image, Briefcase } from 'lucide-react'
import { fetchEquipoDetalle, fetchRolesEquipo, fetchCategoriasEquipo, fetchEntidadesFederaciones, fetchSedes, fetchCanchas } from '@/modules/equipos/lib/queries'
import { fetchPersonaIdsLesionados } from '@/modules/salud-lesiones/lib/queries'
import { Plantel } from '@/modules/equipos/ui/components/plantel'
import { EditarEquipoForm } from '@/modules/equipos/ui/components/editar-equipo-form'
import { EquipoComposicion } from '@/modules/equipos/ui/components/equipo-composicion'
import { CalendarioPanel } from '@/modules/equipos/ui/components/horarios-panel'
import { IndumentariaPanel } from '@/modules/equipos/ui/components/indumentaria-panel'
import { EliminarEquipoButton } from '@/modules/equipos/ui/components/eliminar-equipo-button'
import { CuerpoTecnicoTab } from '@/modules/equipos/ui/components/cuerpo-tecnico-tab'
import { CapabilityGate } from '@/components/capability-gate'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EquipoDetallePage({ params }: PageProps) {
  const { id } = await params

  let equipo, roles, categorias, federaciones, sedes, canchas
  try {
    ;[equipo, roles, categorias, federaciones, sedes, canchas] = await Promise.all([
      fetchEquipoDetalle(id),
      fetchRolesEquipo(),
      fetchCategoriasEquipo(),
      fetchEntidadesFederaciones(),
      fetchSedes(),
      fetchCanchas(),
    ])
  } catch {
    notFound()
  }

  const categoria = equipo.categoria as {
    nombre_display: string
    disciplina_slug: string
    modalidad: string | null
    edad_min: number | null
    edad_max: number | null
  } | null

  const entidad = equipo.entidad as unknown as { id: string; nombre: string; tipo: string; logo_url: string | null } | null

  const miembros = equipo.miembros as unknown as Array<{
    id: string
    persona_id: string
    rol_equipo_slug: string
    dorsal: number | null
    posicion: string | null
    fecha_inicio: string | null
    activo: boolean
    personas: {
      id: string
      nombre: string
      apellido: string
      numero_documento: string | null
      email_principal: string | null
      telefono_principal: string | null
      whatsapp: string | null
      foto_perfil_url: string | null
    } | null
  }>

  const eventos = equipo.horarios as unknown as Array<{
    id: string
    fecha: string | null
    dia_semana: number
    hora_inicio: string
    hora_fin: string
    tipo_evento_slug: string
    titulo: string | null
    hora_citacion: string | null
    descripcion: string | null
    activo: boolean
    sede_id: string | null
    cancha_id: string | null
    notas_pre: string | null
    notas_post: string | null
    partidos_detalle: Array<{
      rival_texto: string | null
      condicion: string | null
      torneo_slug: string | null
      marcador_local: number | null
      marcador_visitante: number | null
    }> | null
  }>

  // Fetch lesionados activos para mostrar badge
  const personaIds = miembros.map(m => m.persona_id)
  const lesionadosSet = await fetchPersonaIdsLesionados(personaIds)
  const lesionadosIds = Array.from(lesionadosSet)

  const rolesJugador = roles.filter((r) => r.categoria === 'deportivo')
  const rolesStaff = roles.filter((r) => r.categoria === 'staff')
  const todosRoles = [...rolesJugador, ...rolesStaff]

  const miembrosJugadores = miembros.filter((m) =>
    rolesJugador.some((r) => r.slug === m.rol_equipo_slug)
  )
  const miembrosStaff = miembros.filter((m) =>
    rolesStaff.some((r) => r.slug === m.rol_equipo_slug)
  )

  const indumentaria = (equipo.indumentaria ?? {}) as Record<string, { descripcion?: string; foto_url?: string }>

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sm:border-b-0 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-start gap-3">
          <Link href="/admin/equipos">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {equipo.escudo_url ? (
              <NextImage src={equipo.escudo_url} alt="Escudo" width={40} height={40} className="h-10 w-10 rounded-md object-contain shrink-0" unoptimized />
            ) : equipo.color_principal ? (
              <div className="h-10 w-10 rounded-md border shrink-0 flex items-center justify-center" style={{ backgroundColor: equipo.color_principal }}>
                <Trophy className="h-5 w-5 text-white/80" />
              </div>
            ) : null}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{equipo.nombre}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                {categoria && <span>{categoria.nombre_display}</span>}
                <span className="capitalize">{equipo.disciplina_slug}</span>
                {equipo.modalidad && <span>({equipo.modalidad})</span>}
                {equipo.torneo && (
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {equipo.torneo}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={equipo.activo ? 'default' : 'secondary'}>
            {equipo.activo ? 'activo' : 'inactivo'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="inline-flex w-max sm:w-full sm:justify-start">
            <TabsTrigger value="info">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Info</span>
            </TabsTrigger>
            <TabsTrigger value="jugadores">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Jugadores</span>
            </TabsTrigger>
            <TabsTrigger value="plantel">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Plantel completo</span>
            </TabsTrigger>
            <TabsTrigger value="cuerpo-tecnico">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Cuerpo Técnico</span>
            </TabsTrigger>
            <TabsTrigger value="indumentaria">
              <Shirt className="h-4 w-4" />
              <span className="hidden sm:inline">Indumentaria</span>
            </TabsTrigger>
            <TabsTrigger value="horarios">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Info Tab */}
        <TabsContent value="info">
          <div className="space-y-6 pt-4">
            {/* Foto del equipo */}
            {equipo.foto_equipo_url && (
              <Card>
                <CardContent className="p-0">
                  <img
                    src={equipo.foto_equipo_url}
                    alt={`Foto ${equipo.nombre}`}
                    className="w-full h-48 sm:h-64 object-cover rounded-lg"
                  />
                </CardContent>
              </Card>
            )}

            {/* Federación y torneo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Federación y competencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Federación / Liga</p>
                    {entidad ? (
                      <Link href={`/admin/entidades/${entidad.id}`} className="text-sm font-medium hover:underline">
                        {entidad.nombre}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin federación asignada</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Torneo</p>
                    <p className="text-sm font-medium">{equipo.torneo || 'Sin torneo asignado'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Disciplina</p>
                    <p className="text-sm font-medium capitalize">{equipo.disciplina_slug}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Categoría</p>
                    <p className="text-sm font-medium">{categoria?.nombre_display || 'Sin categoría'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Composición del equipo */}
            <EquipoComposicion miembros={miembros} roles={roles} />

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Jugadores" value={miembrosJugadores.length} />
                  <StatCard label="Staff" value={miembrosStaff.length} />
                  <StatCard label="Eventos" value={eventos.length} />
                  <StatCard label="Total miembros" value={miembros.length} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jugadores Tab */}
        <TabsContent value="jugadores">
          <div className="pt-4">
            <Plantel
              equipoId={equipo.id}
              miembros={miembrosJugadores}
              roles={rolesJugador}
              tipo="jugador"
              lesionadosIds={lesionadosIds}
            />
          </div>
        </TabsContent>

        {/* Plantel completo Tab (jugadores + staff) */}
        <TabsContent value="plantel">
          <div className="pt-4">
            <Plantel
              equipoId={equipo.id}
              miembros={miembros}
              roles={todosRoles}
              tipo="jugador"
              lesionadosIds={lesionadosIds}
            />
          </div>
        </TabsContent>

        {/* Cuerpo Técnico Tab */}
        <TabsContent value="cuerpo-tecnico">
          <div className="pt-4">
            <CuerpoTecnicoTab equipoId={equipo.id} />
          </div>
        </TabsContent>

        {/* Indumentaria Tab */}
        <TabsContent value="indumentaria">
          <div className="pt-4">
            <IndumentariaPanel
              equipoId={equipo.id}
              indumentaria={indumentaria}
              fotoEquipoUrl={equipo.foto_equipo_url ?? null}
            />
          </div>
        </TabsContent>

        {/* Horarios Tab */}
        <TabsContent value="horarios">
          <div className="pt-4">
            <CalendarioPanel equipoId={equipo.id} eventos={eventos} sedes={sedes} canchas={canchas} />
          </div>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <div className="space-y-6 pt-4">
            <CapabilityGate capability="ccbp.plantel.admin">
              <EditarEquipoForm
                equipo={{
                  id: equipo.id,
                  nombre: equipo.nombre,
                  disciplina_slug: equipo.disciplina_slug,
                  modalidad: equipo.modalidad,
                  activo: equipo.activo,
                  color_principal: equipo.color_principal ?? null,
                  color_secundario: equipo.color_secundario ?? null,
                  categoria_id: equipo.categoria_id ?? null,
                  entidad_id: equipo.entidad_id ?? null,
                  torneo: equipo.torneo ?? null,
                }}
                categorias={categorias.map((c) => ({
                  id: c.id,
                  nombre_display: c.nombre_display,
                  disciplina_slug: c.disciplina_slug,
                  edad_min: (c as unknown as { edad_min: number | null }).edad_min,
                  edad_max: (c as unknown as { edad_max: number | null }).edad_max,
                }))}
                federaciones={federaciones}
              />
            </CapabilityGate>
            <CapabilityGate capability="ccbp.plantel.admin">
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground mb-3">Zona de peligro</p>
                <EliminarEquipoButton equipoId={equipo.id} equipoNombre={equipo.nombre} />
              </div>
            </CapabilityGate>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
