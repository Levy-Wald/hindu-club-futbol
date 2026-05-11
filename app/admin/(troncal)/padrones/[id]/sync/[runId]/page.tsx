import { notFound } from 'next/navigation'
import { obtenerRun, obtenerConteosRun } from '@/lib/imports/actions'
import { fetchPadronDetalle } from '../../../_lib/queries'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RunReviewClient } from './_components/run-review-client'

const estadoVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  parseando: 'secondary',
  matching: 'secondary',
  revisando: 'outline',
  aplicando: 'secondary',
  aplicado: 'default',
  rollback: 'destructive',
  fallado: 'destructive',
}

interface Props {
  params: Promise<{ id: string; runId: string }>
}

export default async function SyncRunDetailPage({ params }: Props) {
  const { id: padronId, runId } = await params

  const [padron, run] = await Promise.all([
    fetchPadronDetalle(padronId).catch(() => null),
    obtenerRun(runId),
  ])

  if (!padron || !run) notFound()

  const conteos = await obtenerConteosRun(runId)

  const pipeline = Array.isArray(run.import_pipelines)
    ? run.import_pipelines[0]
    : run.import_pipelines

  const pipelineName = (pipeline as { nombre?: string } | null)?.nombre ?? run.pipeline_slug

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
        <Link href="/admin/padrones" className="hover:underline">Padrones</Link>
        <span>/</span>
        <Link href={`/admin/padrones/${padronId}`} className="hover:underline">{padron.nombre}</Link>
        <span>/</span>
        <Link href={`/admin/padrones/${padronId}/sync`} className="hover:underline">Sincronizaciones</Link>
        <span>/</span>
        <span className="text-foreground">{run.archivo_origen ?? 'Run'}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/admin/padrones/${padronId}/sync`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{run.archivo_origen ?? 'Import'}</h1>
          <p className="text-sm text-muted-foreground">
            {pipelineName} &middot; {run.total_filas ?? 0} filas
          </p>
        </div>
        <Badge variant={estadoVariant[run.estado] ?? 'secondary'} className="text-sm">
          {run.estado}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard label="Exactos" value={conteos.exacto ?? 0} color="text-success-600" />
        <StatCard label="Auto-fuzzy" value={conteos.auto_fuzzy ?? 0} color="text-info-600" />
        <StatCard label="A revisar" value={conteos.revisar ?? 0} color="text-warning-600" />
        <StatCard label="Sin match" value={conteos.sin_match ?? 0} color="text-warning-600" />
        <StatCard label="Aplicados" value={conteos.apply_aplicado ?? 0} color="text-success-600" />
        <StatCard label="Pend. equipo" value={conteos.apply_pendiente_revision_equipo ?? 0} color="text-purple-600" />
      </div>

      {/* Client-side interactive sections */}
      <RunReviewClient
        runId={runId}
        padronId={padronId}
        estado={run.estado as string}
        conteos={conteos}
        pipelineSlug={run.pipeline_slug as string}
      />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border rounded-md p-3 text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
