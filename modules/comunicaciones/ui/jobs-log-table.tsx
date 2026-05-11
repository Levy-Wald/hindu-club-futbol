'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { Clock, ExternalLink } from 'lucide-react'

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
  })
}

export interface JobLogRow {
  id: string
  job_slug: string
  status: string
  started_at: string
  finished_at: string | null
  personas_encontradas: number
  personas_notificadas: number
  personas_dedup: number
  errores: number
}

interface JobsLogTableProps {
  jobs: JobLogRow[]
}

export function JobsLogTable({ jobs }: JobsLogTableProps) {
  return (
    <div className="space-y-4" data-testid="jobs-log-section">
      <Card>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay ejecuciones de automatizaciones registradas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Encontradas</TableHead>
                    <TableHead>Notificadas</TableHead>
                    <TableHead>Dedup</TableHead>
                    <TableHead>Errores</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const statusInfo = STATUS_VARIANTS[job.status] ?? { label: job.status, variant: 'outline' as const }
                    return (
                      <TableRow key={job.id} data-testid="job-log-row">
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatFecha(job.started_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {JOB_LABELS[job.job_slug] ?? job.job_slug}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{job.personas_encontradas}</TableCell>
                        <TableCell>
                          {job.personas_notificadas > 0 ? (
                            <Badge variant="outline" className="border-success-500 text-success-700 bg-success-50">
                              {job.personas_notificadas}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.personas_dedup > 0 ? (
                            <span className="text-muted-foreground">{job.personas_dedup}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.errores > 0 ? (
                            <Badge variant="destructive">{job.errores}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            render={<Link href={`/admin/comunicaciones/automatizaciones/${job.id}`} />}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
