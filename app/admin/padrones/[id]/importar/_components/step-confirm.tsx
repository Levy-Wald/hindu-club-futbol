'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, UserPlus, Link2, Pencil, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { ejecutarImport } from '../_actions'
import type { ImportRow, ImportSummary, FieldKey } from '../_lib/types'

interface StepConfirmProps {
  importRows: ImportRow[]
  padronId: string
  padronNombre: string
  onComplete: (summary: ImportSummary) => void
  onBack: () => void
}

export function StepConfirm({ importRows, padronId, padronNombre, onComplete, onBack }: StepConfirmProps) {
  const [importing, setImporting] = useState(false)
  const [conflictMode, setConflictMode] = useState<'keep' | 'fill_empty' | 'overwrite_all'>('fill_empty')

  // Compute what will happen
  const plan = useMemo(() => {
    let crear = 0
    let vincular = 0
    let actualizar = 0
    let omitir = 0
    let conflictos = 0

    for (const row of importRows) {
      const status = row.dedupResult?.status
      if (status === 'nueva') {
        crear++
      } else if (status === 'match_exacto' || status === 'match_posible') {
        vincular++
        const conflicts = row.dedupResult?.conflicts ?? []
        const hasValueConflicts = conflicts.some((c) => c.currentValue !== null)
        if (hasValueConflicts) conflictos++
        if (conflicts.length > 0) actualizar++
      } else if (status === 'duplicada_en_lote') {
        omitir++
      }
    }

    return { crear, vincular, actualizar, omitir, conflictos }
  }, [importRows])

  async function handleImport() {
    setImporting(true)
    try {
      const rowsToSend = importRows
        .filter((r) => r.dedupResult?.status !== 'duplicada_en_lote')
        .map((row) => {
          const status = row.dedupResult?.status
          const conflicts = row.dedupResult?.conflicts ?? []

          let action: 'crear' | 'vincular' | 'vincular_y_actualizar' | 'omitir'
          let fieldsToUpdate: { field: string; value: string }[] = []

          if (status === 'nueva') {
            action = 'crear'
          } else if (status === 'match_exacto' || status === 'match_posible') {
            // Determine what to update based on conflict mode
            if (conflictMode === 'keep') {
              // Only fill empty fields
              fieldsToUpdate = conflicts
                .filter((c) => c.currentValue === null && c.newValue)
                .map((c) => ({ field: c.field, value: c.newValue! }))
            } else if (conflictMode === 'fill_empty') {
              // Fill empty + keep existing where there's a conflict
              fieldsToUpdate = conflicts
                .filter((c) => c.currentValue === null && c.newValue)
                .map((c) => ({ field: c.field, value: c.newValue! }))
            } else if (conflictMode === 'overwrite_all') {
              // Overwrite everything
              fieldsToUpdate = conflicts
                .filter((c) => c.newValue)
                .map((c) => ({ field: c.field, value: c.newValue! }))
            }

            action = fieldsToUpdate.length > 0 ? 'vincular_y_actualizar' : 'vincular'
          } else {
            action = 'omitir'
          }

          return {
            data: row.data,
            unmappedData: row.unmappedData,
            action,
            matchedPersonaId: row.dedupResult?.matchedPersonaId ?? null,
            fieldsToUpdate,
          }
        })

      const summary = await ejecutarImport(padronId, rowsToSend)
      onComplete(summary)
    } catch (err) {
      toast.error('Error durante la importación.')
      console.error(err)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Confirmar importación</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Revisá el resumen antes de impactar en el sistema.
        </p>
      </div>

      {/* Plan summary */}
      <div className="rounded-md border p-4 space-y-4">
        <h3 className="text-sm font-medium">Resumen de operaciones</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PlanCard icon={<UserPlus className="h-4 w-4" />} count={plan.crear} label="Crear nuevas" color="text-green-600" />
          <PlanCard icon={<Link2 className="h-4 w-4" />} count={plan.vincular} label="Vincular existentes" color="text-blue-600" />
          <PlanCard icon={<Pencil className="h-4 w-4" />} count={plan.actualizar} label="Con datos nuevos" color="text-yellow-600" />
          <PlanCard icon={<Ban className="h-4 w-4" />} count={plan.omitir} label="Omitir (duplicadas)" color="text-muted-foreground" />
        </div>

        <div className="text-sm">
          <p>
            Se vincularán al padrón <strong>{padronNombre}</strong>
          </p>
        </div>
      </div>

      {/* Conflict resolution strategy */}
      {plan.conflictos > 0 && (
        <div className="rounded-md border p-4 space-y-3">
          <h3 className="text-sm font-medium">
            Resolución de conflictos ({plan.conflictos} personas con datos diferentes)
          </h3>
          <p className="text-xs text-muted-foreground">
            Cuando el archivo trae un dato diferente al que ya existe en el sistema:
          </p>
          <div className="space-y-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="conflict"
                checked={conflictMode === 'fill_empty'}
                onChange={() => setConflictMode('fill_empty')}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Completar vacíos, no pisar existentes</p>
                <p className="text-xs text-muted-foreground">
                  Solo agrega datos donde el campo está vacío. No modifica datos existentes.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="conflict"
                checked={conflictMode === 'keep'}
                onChange={() => setConflictMode('keep')}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">No actualizar ningún dato</p>
                <p className="text-xs text-muted-foreground">
                  Solo vincular al padrón, sin tocar ningún campo de la persona.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="conflict"
                checked={conflictMode === 'overwrite_all'}
                onChange={() => setConflictMode('overwrite_all')}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Pisar con datos del archivo</p>
                <p className="text-xs text-muted-foreground">
                  Reemplaza todos los campos con los datos del archivo importado.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Data extras */}
      {importRows.some((r) => Object.keys(r.unmappedData).length > 0) && (
        <div className="rounded-md border border-dashed p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Datos extra no mapeados:</strong> Se guardarán en el campo <code>metadata</code> de cada persona.
            Podrás consultarlos después.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={importing}>
          Volver
        </Button>
        <Button onClick={handleImport} disabled={importing}>
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importando...
            </>
          ) : (
            `Importar ${importRows.length - plan.omitir} personas`
          )}
        </Button>
      </div>
    </div>
  )
}

function PlanCard({
  icon,
  count,
  label,
  color,
}: {
  icon: React.ReactNode
  count: number
  label: string
  color: string
}) {
  return (
    <div className="text-center p-2 rounded border">
      <div className={`flex items-center justify-center gap-1 ${color}`}>
        {icon}
        <span className="text-xl font-bold">{count}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
