import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Calendar, Info, Shield, Users } from 'lucide-react'
import { fetchEquipoDetalle, fetchRolesEquipo, fetchCategoriasEquipo } from '../_lib/queries'
import { Plantel } from './_components/plantel'
import { EditarEquipoForm } from './_components/editar-equipo-form'
import { EquipoComposicion } from './_components/equipo-composicion'
import { HorariosPanel } from './_components/horarios-panel'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EquipoDetallePage({ params }: PageProps) {
  const { id } = await params

  let equipo, roles, categorias
  try {
    ;[equipo, roles, categorias] = await Promise.all([
      fetchEquipoDetalle(id),
      fetchRolesEquipo(),
      fetchCategoriasEquipo(),
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
    } | null
  }>

  const horarios = equipo.horarios as unknown as Array<{
    id: string
    dia_semana: number
    hora_inicio: string
    hora_fin: string
    tipo_actividad: string
    activo: boolean
  }>

  const rolesJugador = roles.filter((r) => r.categoria === 'deportivo')
  const rolesStaff = roles.filter((r) => r.categoria === 'staff')

  const miembrosJugadores = miembros.filter((m) =>
    rolesJugador.some((r) => r.slug === m.rol_equipo_slug)
  )
  const miembrosStaff = miembros.filter((m) =>
    rolesStaff.some((r) => r.slug === m.rol_equipo_slug)
  )

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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {equipo.color_principal && (
                <div className="h-4 w-4 rounded-full border shrink-0" style={{ backgroundColor: equipo.color_principal }} />
              )}
              <h1 className="text-xl sm:text-2xl font-bold truncate">{equipo.nombre}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              {categoria && <span>{categoria.nombre_display}</span>}
              <span>{equipo.disciplina_slug}</span>
              {equipo.modalidad && <span>({equipo.modalidad})</span>}
              {categoria?.edad_min != null && categoria?.edad_max != null && (
                <span className="text-xs">· {categoria.edad_min}–{categoria.edad_max} años</span>
              )}
            </div>
          </div>
          <Badge variant={equipo.activo ? 'default' : 'secondary'}>
            {equipo.activo ? 'activo' : 'inactivo'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="info">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="plantel">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Plantel</span>
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
          <TabsTrigger value="horarios">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Horarios</span>
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <div className="space-y-6 pt-4">
            {/* Team Composition */}
            <EquipoComposicion miembros={miembros} roles={roles} />

            {/* Stats */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Resumen</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Jugadores" value={miembrosJugadores.length} />
                <StatCard label="Staff" value={miembrosStaff.length} />
                <StatCard label="Horarios" value={horarios.length} />
                <StatCard label="Total miembros" value={miembros.length} />
              </div>
            </div>

            {/* Edit Form */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Configuración</h3>
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
                }}
                categorias={categorias.map((c) => ({
                  id: c.id,
                  nombre_display: c.nombre_display,
                  disciplina_slug: c.disciplina_slug,
                  edad_min: (c as unknown as { edad_min: number | null }).edad_min,
                  edad_max: (c as unknown as { edad_max: number | null }).edad_max,
                }))}
              />
            </div>
          </div>
        </TabsContent>

        {/* Plantel Tab */}
        <TabsContent value="plantel">
          <div className="pt-4">
            <Plantel
              equipoId={equipo.id}
              miembros={miembrosJugadores}
              roles={rolesJugador}
              tipo="jugador"
            />
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff">
          <div className="pt-4">
            <Plantel
              equipoId={equipo.id}
              miembros={miembrosStaff}
              roles={rolesStaff}
              tipo="staff"
            />
          </div>
        </TabsContent>

        {/* Horarios Tab */}
        <TabsContent value="horarios">
          <div className="pt-4">
            <HorariosPanel equipoId={equipo.id} horarios={horarios} />
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
