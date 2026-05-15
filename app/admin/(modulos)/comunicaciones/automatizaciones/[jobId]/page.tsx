import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  obtenerJobLog,
  fetchAutomatizacion,
  fetchAutomatizacionPasos,
  fetchPlantillas,
} from '@/modules/comunicaciones/lib/queries'
import { AutomatizacionForm } from '@/modules/comunicaciones/ui/automatizacion-form'
import { WorkflowEditor } from '@/modules/comunicaciones/ui/workflow-editor'

const JOB_LABELS: Record<string, string> = {
  apto_vence_7d: 'Apto fisico por vencer (7d)',
  cuota_vence_7d: 'Cuota por vencer (7d)',
  cuota_vencida_7d: 'Cuota vencida (7d)',
}

const STATUS_VARIANTS: Record<string, { label: string; variant: 'outline' | 'destructive' | 'default' }> = {
  completed: { label: 'Completado', variant: 'outline' },
  failed: { label: 'Fallido', variant: 'destructive' },
  running: { label: 'Ejecutando', variant: 'default' },
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default async function AutomatizacionOrJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params

  // Try as automatizacion first
  const auto = await fetchAutomatizacion(jobId)
  if (auto) {
    const [pasos, plantillas] = await Promise.all([
      fetchAutomatizacionPasos(auto.id),
      fetchPlantillas(),
    ])

    const plantillasSimple = plantillas.map((p: { slug: string; nombre: string }) => ({
      slug: p.slug,
      nombre: p.nombre,
    }))

    return (
      <div className="space-y-6">
        <AutomatizacionForm
          automatizacion={auto as unknown as Parameters<typeof AutomatizacionForm>[0]['automatizacion']}
        />
        <WorkflowEditor
          automatizacionId={auto.id}
          pasos={pasos as unknown as Parameters<typeof WorkflowEditor>[0]['pasos']}
          plantillas={plantillasSimple}
        />
      </div>
    )
  }

  // Fall back to job log
  const job = await obtenerJobLog(jobId)
  if (!job) notFound()

  const statusInfo = STATUS_VARIANTS[job.status] ?? { label: job.status, variant: 'outline' as const }
  const metadata = job.metadata as Record<string, unknown> | null

  return (
    <div className="space-y-6" data-testid="job-detail-page">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" render={<Link href="/admin/comunicaciones" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">
            {JOB_LABELS[job.job_slug] ?? job.job_slug}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatFecha(job.started_at)}
          </p>
        </div>
        <Badge variant={statusInfo.variant} className="ml-auto">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Encontradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{job.personas_encontradas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success-700">{job.personas_notificadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dedup (omitidas)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{job.personas_dedup}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Errores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${job.errores > 0 ? 'text-error-600' : ''}`}>
              {job.errores}
            </p>
          </CardContent>
        </Card>
      </div>

      {metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(metadata.detalles) && (
              <ul className="space-y-1 text-sm text-muted-foreground">
                {(metadata.detalles as string[]).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
            {typeof metadata.lote_id === 'string' && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Lote: </span>
                <Link
                  href={`/admin/comunicaciones/envios-masivos/${metadata.lote_id}`}
                  className="text-primary-600 underline"
                >
                  {String(metadata.lote_id)}
                </Link>
              </p>
            )}
            {typeof metadata.error === 'string' && (
              <p className="mt-3 text-sm text-error-600">
                Error: {String(metadata.error)}</p>
            )}
          </CardContent>
        </Card>
      )}

      {job.finished_at && (
        <p className="text-xs text-muted-foreground">
          Finalizado: {formatFecha(job.finished_at)}
          {' — '}
          Duracion: {Math.round((new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s
        </p>
      )}
    </div>
  )
}
