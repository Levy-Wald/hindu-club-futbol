'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { ImportSummary } from '../_lib/types'

interface StepResultsProps {
  summary: ImportSummary
  padronId: string
}

export function StepResults({ summary, padronId }: StepResultsProps) {
  const hasErrors = summary.errores > 0
  const success = summary.nuevas + summary.vinculadas > 0

  return (
    <div className="space-y-6">
      {/* Status header + actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {success && !hasErrors && (
            <CheckCircle2 className="h-8 w-8 text-success-600" />
          )}
          {success && hasErrors && (
            <AlertTriangle className="h-8 w-8 text-warning-600" />
          )}
          {!success && (
            <XCircle className="h-8 w-8 text-error-600" />
          )}
          <div>
            <h2 className="text-lg font-medium">
              {success ? 'Importación completada' : 'No se importaron datos'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {success
                ? hasErrors
                  ? 'Se completó con algunos errores.'
                  : 'Todos los datos se procesaron correctamente.'
                : 'Revisá los errores e intentá de nuevo.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/padrones/${padronId}/importar`}>
            <Button variant="outline" size="sm">
              Importar más datos
            </Button>
          </Link>
          <Link href={`/admin/padrones/${padronId}`}>
            <Button size="sm">
              Ver padrón
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultCard count={summary.nuevas} label="Personas creadas" color="text-success-600" />
        <ResultCard count={summary.vinculadas} label="Vinculadas al padrón" color="text-info-600" />
        <ResultCard count={summary.actualizadas} label="Datos actualizados" color="text-warning-600" />
        <ResultCard count={summary.errores} label="Errores" color="text-error-600" />
      </div>

      {/* Error details */}
      {hasErrors && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Detalle de errores</h3>
          <div className="rounded-md border max-h-[200px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b">
                  <th className="px-3 py-1.5 text-left">Fila</th>
                  <th className="px-3 py-1.5 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {summary.detalleErrores.map((err, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-1.5 text-muted-foreground">{err.row}</td>
                    <td className="px-3 py-1.5 text-destructive">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

function ResultCard({
  count,
  label,
  color,
}: {
  count: number
  label: string
  color: string
}) {
  return (
    <div className="rounded-md border p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
