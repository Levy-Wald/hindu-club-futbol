import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { fetchConvocatoria } from '../_lib/queries'
import { ConvocatoriaBuilder } from './_components/convocatoria-builder'

interface PageProps {
  params: Promise<{ eventoId: string }>
}

export default async function ConvocatoriaPage({ params }: PageProps) {
  const { eventoId } = await params

  let detalle
  try {
    detalle = await fetchConvocatoria(eventoId)
  } catch {
    notFound()
  }

  const { evento, equipoNombre, jugadores } = detalle

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/convocatorias">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{evento.titulo ?? 'Partido'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {equipoNombre ?? '—'}
            {evento.fecha_inicio ? ` · ${new Date(evento.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR')}` : ''}
            {evento.hora_inicio ? ` · ${(evento.hora_inicio as string).slice(0, 5)}` : ''}
          </p>
        </div>
      </div>

      <ConvocatoriaBuilder eventoId={eventoId} jugadores={jugadores} />
    </div>
  )
}
