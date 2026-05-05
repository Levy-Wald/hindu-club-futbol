import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchPersonaById, fetchCatalogoAtributos, fetchCatalogoVinculos, fetchPadrones, fetchEstadosPadron, fetchTiposSocio } from '../_lib/queries'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PersonaAvatar } from '../_components/persona-avatar'
import { TabDatos } from './_components/tab-datos'
import { TabAtributos } from './_components/tab-atributos'
import { TabVinculos } from './_components/tab-vinculos'
import { TabPadrones } from './_components/tab-padrones'
import { ArrowLeft, History } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PersonaDetallePage({ params }: PageProps) {
  const { id } = await params

  let persona
  try {
    persona = await fetchPersonaById(id)
  } catch {
    notFound()
  }

  const [catalogoAtributos, catalogoVinculos, padrones, estadosPadron, tiposSocio] = await Promise.all([
    fetchCatalogoAtributos(),
    fetchCatalogoVinculos(),
    fetchPadrones(),
    fetchEstadosPadron(),
    fetchTiposSocio(),
  ])

  return (
    <div className="space-y-6">
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 py-3 border-b -mt-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/personas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PersonaAvatar nombre={persona.nombre} apellido={persona.apellido} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate">
              {persona.apellido}, {persona.nombre}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {persona.numero_documento && <span>Doc: {persona.numero_documento}</span>}
              <Badge variant={persona.deleted_at ? 'destructive' : 'default'} className="text-[10px] h-4">
                {persona.deleted_at ? 'eliminada' : persona.estado}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/admin/personas/${persona.id}/historial`}>
              <Button variant="outline" size="sm">
                <History className="mr-2 h-4 w-4" />
                Historial
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="datos">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="datos">Ficha completa</TabsTrigger>
          <TabsTrigger value="atributos">
            Atributos
            {persona.personas_atributos?.filter((a: { activo: boolean }) => a.activo).length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 rounded-full px-1 text-xs">
                {persona.personas_atributos.filter((a: { activo: boolean }) => a.activo).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
          <TabsTrigger value="padrones">Padrones</TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="mt-4">
          <TabDatos persona={persona} />
        </TabsContent>

        <TabsContent value="atributos" className="mt-4">
          <TabAtributos
            personaId={persona.id}
            atributos={persona.personas_atributos ?? []}
            catalogo={catalogoAtributos}
          />
        </TabsContent>

        <TabsContent value="vinculos" className="mt-4">
          <TabVinculos
            personaId={persona.id}
            vinculosOrigen={persona.personas_vinculos_origen ?? []}
            vinculosDestino={persona.personas_vinculos_destino ?? []}
            catalogoVinculos={catalogoVinculos}
          />
        </TabsContent>

        <TabsContent value="padrones" className="mt-4">
          <TabPadrones
            personaId={persona.id}
            personaPadrones={persona.personas_padrones ?? []}
            padronesDisponibles={padrones}
            estadosPadron={estadosPadron}
            tiposSocio={tiposSocio}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
