import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchScoutingFicha } from '../_lib/queries'
import { fetchEquiposActivos } from '../../_lib/queries'
import { ScoutingFichaEditor } from './_components/scouting-ficha-editor'

interface PageProps {
  params: Promise<{ id: string }>
}

const ESTADOS_LABEL: Record<string, string> = {
  observado: 'Observado',
  contactado: 'Contactado',
  en_negociacion: 'En negociación',
  descartado: 'Descartado',
  incorporado: 'Incorporado',
}

const ESTADOS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  observado: 'secondary',
  contactado: 'default',
  en_negociacion: 'outline',
  descartado: 'destructive',
  incorporado: 'default',
}

export default async function ScoutingDetallePage({ params }: PageProps) {
  const { id } = await params

  let ficha, equipos
  try {
    ;[ficha, equipos] = await Promise.all([
      fetchScoutingFicha(id),
      fetchEquiposActivos(),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sm:border-b-0 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-start gap-3">
          <Link href="/admin/operaciones/scouting">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">
              {ficha.apellido}, {ficha.nombre}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {ficha.posicion && (
                <span className="text-sm text-muted-foreground">{ficha.posicion}</span>
              )}
              {ficha.club_actual && (
                <span className="text-sm text-muted-foreground">
                  · {ficha.club_actual}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {ficha.estado === 'incorporado' ? (
              <Badge variant="default" className="bg-success-600 hover:bg-success-700">
                {ESTADOS_LABEL[ficha.estado]}
              </Badge>
            ) : (
              <Badge variant={ESTADOS_VARIANT[ficha.estado] ?? 'secondary'}>
                {ESTADOS_LABEL[ficha.estado] ?? ficha.estado}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <ScoutingFichaEditor ficha={ficha} equipos={equipos} />
    </div>
  )
}
