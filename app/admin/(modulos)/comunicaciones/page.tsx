import { createClient } from '@/lib/supabase/server'
import { TENANT_ID } from '@/lib/tenant'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PlantillasTable } from '@/modules/comunicaciones/ui/plantillas-table'
import { EnviosTable } from '@/modules/comunicaciones/ui/envios-table'
import { FileText, Send } from 'lucide-react'

export default async function ComunicacionesPage() {
  const supabase = await createClient()

  const [plantillasRes, enviosRes] = await Promise.all([
    supabase
      .from('com_plantillas')
      .select('id, nombre, slug, tipo, asunto, cuerpo, variables_disponibles, activa, created_at, updated_at')
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
        </TabsList>

        <TabsContent value="plantillas" data-testid="panel-plantillas">
          <div className="pt-4">
            <PlantillasTable plantillas={plantillas} />
          </div>
        </TabsContent>

        <TabsContent value="envios" data-testid="panel-envios">
          <div className="pt-4">
            <EnviosTable envios={envios} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
