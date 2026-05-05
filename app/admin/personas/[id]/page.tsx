import { notFound } from 'next/navigation'
import Link from 'next/link'
import { fetchPersonaById, fetchCatalogoAtributos, fetchCatalogoVinculos, fetchPadrones, fetchEstadosPadron, fetchTiposSocio } from '../_lib/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PersonaAvatar } from '../_components/persona-avatar'
import { PersonaEditor } from './_components/persona-editor'
import { ArrowLeft, History } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PersonaDetallePage({ params }: PageProps) {
  const { id } = await params

  // Todas las queries en paralelo — no esperar persona para lanzar catálogos
  const [personaResult, catalogoAtributos, catalogoVinculos, padrones, estadosPadron, tiposSocio] = await Promise.all([
    fetchPersonaById(id).catch(() => null),
    fetchCatalogoAtributos(),
    fetchCatalogoVinculos(),
    fetchPadrones(),
    fetchEstadosPadron(),
    fetchTiposSocio(),
  ])

  if (!personaResult) notFound()
  const persona = personaResult

  return (
    <div className="space-y-4">
      {/* HEADER STICKY */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4 sm:px-6 py-3 border-b -mt-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/admin/personas">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PersonaAvatar nombre={persona.nombre} apellido={persona.apellido} className="h-9 w-9 shrink-0 hidden sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold truncate">
              {persona.apellido}, {persona.nombre}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {persona.numero_documento && <span className="truncate">Doc: {persona.numero_documento}</span>}
              <Badge variant={persona.deleted_at ? 'destructive' : 'default'} className="text-[10px] h-4 shrink-0">
                {persona.deleted_at ? 'eliminada' : persona.estado}
              </Badge>
            </div>
          </div>
          <Link href={`/admin/personas/${persona.id}/historial`} className="shrink-0">
            <Button variant="outline" size="sm">
              <History className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Historial</span>
            </Button>
          </Link>
        </div>
      </div>

      <PersonaEditor
        persona={persona}
        catalogoAtributos={catalogoAtributos}
        catalogoVinculos={catalogoVinculos}
        padronesDisponibles={padrones}
        estadosPadron={estadosPadron}
        tiposSocio={tiposSocio}
      />
    </div>
  )
}
