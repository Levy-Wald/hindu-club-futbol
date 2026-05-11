import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlantillasTable } from '@/modules/comunicaciones/ui/plantillas-table'
import { EnviosTable } from '@/modules/comunicaciones/ui/envios-table'
import { LotesTable } from '@/modules/comunicaciones/ui/lotes-table'
import { JobsLogTable } from '@/modules/comunicaciones/ui/jobs-log-table'
import { obtenerPermisosComunicaciones } from '@/modules/comunicaciones/lib/plantillas/permisos'
import { listarLotes, listarJobsLog } from '@/modules/comunicaciones/lib/queries'
import { FileText, Send, Users, Clock } from 'lucide-react'

export default async function ComunicacionesPage() {
  const supabase = await createClient()
  const permisos = await obtenerPermisosComunicaciones()

  const [plantillasRes, enviosRes, lotes, jobsLog] = await Promise.all([
    supabase
      .from('com_plantillas')
      .select('id, nombre, slug, tipo, asunto, cuerpo, variables_disponibles, activa, metadata, created_at, updated_at')
      .eq('tenant_id', TENANT_ID)
      .is('deleted_at', null)
      .order('nombre'),
    supabase
      .from('com_envios')
      .select(`
        id, canal, estado, error_mensaje, plantilla_slug, metadata, created_at,
        persona:personas(id, nombre, apellido)
      `)
      .eq('tenant_id', TENANT_ID)
      .order('created_at', { ascending: false })
      .limit(100),
    listarLotes(),
    listarJobsLog(),
  ])

  const plantillas = plantillasRes.data ?? []

  const enviosRaw = (enviosRes.data ?? []) as unknown as Array<{
    id: string
    canal: string
    estado: string
    error_mensaje: string | null
    plantilla_slug: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    persona: { id: string; nombre: string; apellido: string } | null
  }>

  const envios = enviosRaw.map((e) => ({
    id: e.id,
    canal: e.canal,
    estado: e.estado,
    error_mensaje: e.error_mensaje,
    created_at: e.created_at,
    persona_nombre: e.persona ? `${e.persona.nombre} ${e.persona.apellido}` : null,
    plantilla_slug: e.plantilla_slug,
    metadata: e.metadata,
  }))

  return (
    <div className="space-y-6" data-testid="comunicaciones-page">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Comunicaciones</h1>
        <p className="text-sm text-muted-foreground">
          Plantillas de comunicacion y registro de envios
        </p>
      </div>

      <Tabs defaultValue="plantillas">
        <TabsList>
          <TabsTrigger value="plantillas" data-testid="tab-plantillas">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="envios" data-testid="tab-envios">
            <Send className="h-4 w-4" />
            Envios
          </TabsTrigger>
          <TabsTrigger value="envios-masivos" data-testid="tab-envios-masivos">
            <Users className="h-4 w-4" />
            Envios masivos
          </TabsTrigger>
          <TabsTrigger value="automatizaciones" data-testid="tab-automatizaciones">
            <Clock className="h-4 w-4" />
            Automatizaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" data-testid="panel-plantillas">
          <div className="pt-4">
            <PlantillasTable plantillas={plantillas} permisos={permisos} />
          </div>
        </TabsContent>

        <TabsContent value="envios" data-testid="panel-envios">
          <div className="pt-4">
            <EnviosTable envios={envios} />
          </div>
        </TabsContent>

        <TabsContent value="envios-masivos" data-testid="panel-envios-masivos">
          <div className="pt-4">
            <LotesTable lotes={lotes} puede_enviar_masivo={permisos.puede_enviar_masivo} />
          </div>
        </TabsContent>

        <TabsContent value="automatizaciones" data-testid="panel-automatizaciones">
          <div className="pt-4">
            <JobsLogTable jobs={jobsLog} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
