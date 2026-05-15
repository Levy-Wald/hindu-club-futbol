import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { fetchProyecto, fetchTareasProyecto, fetchMiembrosProyecto, fetchComentarios, fetchEstadosTarea } from '@/modules/proyectos/lib/queries'
import { KanbanBoard } from '@/modules/proyectos/ui/kanban-board'
import { ListaTareas } from '@/modules/proyectos/ui/lista-tareas'
import { CalendarioProyecto } from '@/modules/proyectos/ui/calendario-proyecto'
import { ProyectoForm } from '@/modules/proyectos/ui/proyecto-form'
import { MiembrosList } from '@/modules/proyectos/ui/miembros-list'
import { ComentarioThread } from '@/modules/proyectos/ui/comentario-thread'
import { ESTADO_PROYECTO_LABELS, ESTADO_PROYECTO_COLORS } from '@/modules/proyectos/lib/tipos'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProyectoDetallePage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  const [proyecto, tareas, miembros, comentarios, estados] = await Promise.all([
    fetchProyecto(id),
    fetchTareasProyecto(id),
    fetchMiembrosProyecto(id),
    fetchComentarios(id),
    fetchEstadosTarea(),
  ])

  if (!proyecto) notFound()

  const supabase = await createClient()
  const [{ data: personas }, { data: entidades }] = await Promise.all([
    supabase
      .from('personas')
      .select('id, nombre, apellido, email_principal')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('apellido')
      .limit(200),
    supabase
      .from('entidades')
      .select('id, nombre')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('nombre'),
  ])

  const personasList = (personas ?? []) as { id: string; nombre: string; apellido: string; email_principal: string | null }[]
  const miembroPersonas = personasList.map(p => ({ id: p.id, nombre: p.nombre, apellido: p.apellido }))

  const progress = proyecto.total_tareas
    ? Math.round(((proyecto.tareas_completadas ?? 0) / proyecto.total_tareas) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/proyectos">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: proyecto.color }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{proyecto.nombre}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {proyecto.codigo && <span className="font-mono">{proyecto.codigo}</span>}
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: ESTADO_PROYECTO_COLORS[proyecto.estado], color: ESTADO_PROYECTO_COLORS[proyecto.estado] }}
            >
              {ESTADO_PROYECTO_LABELS[proyecto.estado]}
            </Badge>
            {proyecto.responsable && <span>Resp: {proyecto.responsable.apellido}, {proyecto.responsable.nombre}</span>}
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground hidden sm:block">
          {proyecto.presupuesto_total && (
            <div>
              Presupuesto: ${proyecto.presupuesto_consumido?.toLocaleString('es-AR') ?? '0'} / ${proyecto.presupuesto_total.toLocaleString('es-AR')} {proyecto.moneda}
            </div>
          )}
          {(proyecto.total_tareas ?? 0) > 0 && (
            <div>Tareas: {proyecto.tareas_completadas}/{proyecto.total_tareas} ({progress}%)</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={tab || 'tablero'}>
        <TabsList>
          <TabsTrigger value="tablero">Tablero</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="comentarios">Comentarios</TabsTrigger>
        </TabsList>

        <TabsContent value="tablero" className="mt-4">
          <KanbanBoard
            proyectoId={proyecto.id}
            tareas={tareas}
            estados={estados}
            miembros={miembroPersonas}
          />
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <ListaTareas
            proyectoId={proyecto.id}
            tareas={tareas}
            estados={estados}
            miembros={miembroPersonas}
          />
        </TabsContent>

        <TabsContent value="calendario" className="mt-4">
          <CalendarioProyecto
            proyectoId={proyecto.id}
            tareas={tareas}
            estados={estados}
            colorProyecto={proyecto.color}
            miembros={miembroPersonas}
          />
        </TabsContent>

        <TabsContent value="detalles" className="mt-4">
          <ProyectoForm
            proyecto={proyecto}
            personas={miembroPersonas}
            entidades={(entidades ?? []) as { id: string; nombre: string }[]}
          />
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <MiembrosList
            proyectoId={proyecto.id}
            miembros={miembros}
            personasDisponibles={personasList}
          />
        </TabsContent>

        <TabsContent value="comentarios" className="mt-4">
          <ComentarioThread
            proyectoId={proyecto.id}
            comentarios={comentarios}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
