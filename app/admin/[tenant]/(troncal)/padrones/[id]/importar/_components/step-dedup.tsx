'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Link2, AlertTriangle, Loader2 } from 'lucide-react'
import { fetchPersonasParaDedup } from '../_actions'
import { findMatch, detectInternalDuplicates } from '../_lib/dedup'
import type { ParsedData, ColumnMapping, ImportRow, FieldKey, DedupResult } from '../_lib/types'

interface StepDedupProps {
  parsedData: ParsedData
  mappings: ColumnMapping[]
  padronId: string
  onComplete: (rows: ImportRow[]) => void
  onBack: () => void
}

export function StepDedup({ parsedData, mappings, padronId, onComplete, onBack }: StepDedupProps) {
  const [loading, setLoading] = useState(true)
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [progress, setProgress] = useState(0)

  // Detect if we have a combined "APELLIDO Y NOMBRE" column
  const hasCombinedNameCol = useMemo(() => {
    // Check if apellido is mapped but nombre is NOT mapped to any data column
    const apellidoMapped = mappings.some((m) => m.targetField === 'apellido')
    const nombreMapped = mappings.some((m) => m.targetField === 'nombre' && parsedData.rows[0]?.[m.sourceIndex]?.trim())
    if (!apellidoMapped || nombreMapped) return -1

    // Find the apellido column and check if its header suggests combined name
    const apellidoMapping = mappings.find((m) => m.targetField === 'apellido')
    if (!apellidoMapping) return -1

    const header = (parsedData.headers[apellidoMapping.sourceIndex] ?? '').toLowerCase()
    const isCombined = header.includes('nombre') || header.includes('name')

    // Also check data: if values have spaces (like "ABAD GABRIELA"), it's combined
    if (!isCombined) {
      const sampleValues = parsedData.rows.slice(0, 10).map((r) => r[apellidoMapping.sourceIndex] ?? '')
      const hasSpaces = sampleValues.filter((v) => v.trim().includes(' ')).length > sampleValues.length * 0.5
      if (hasSpaces) return apellidoMapping.sourceIndex
    }

    return isCombined ? apellidoMapping.sourceIndex : -1
  }, [mappings, parsedData])

  // Build import rows from parsed data + mappings
  const rawRows = useMemo(() => {
    return parsedData.rows.map((row, rowIndex) => {
      const data: Partial<Record<FieldKey, string>> = {}
      const unmappedData: Record<string, string> = {}

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const value = row[colIndex]
        if (!value) continue

        const mapping = mappings[colIndex]
        if (mapping?.targetField) {
          data[mapping.targetField] = value
        } else {
          const header = parsedData.headers[colIndex] || `col_${colIndex}`
          unmappedData[header] = value
        }
      }

      // Split combined "APELLIDO NOMBRE" into separate fields
      if (hasCombinedNameCol >= 0 && data.apellido && !data.nombre) {
        const fullName = data.apellido
        const words = fullName.trim().split(/\s+/)
        if (words.length >= 2) {
          // First word = apellido, rest = nombre
          data.apellido = words[0]
          data.nombre = words.slice(1).join(' ')
        }
      }

      return { rowIndex, data, unmappedData } as Omit<ImportRow, 'dedupResult'> & { dedupResult: null }
    })
  }, [parsedData, mappings, hasCombinedNameCol])

  // Run dedup
  useEffect(() => {
    let cancelled = false

    async function runDedup() {
      setLoading(true)
      try {
        const existingPersonas = await fetchPersonasParaDedup()

        const BATCH_SIZE = 100
        const results: ImportRow[] = []

        for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
          if (cancelled) return

          const batch = rawRows.slice(i, i + BATCH_SIZE)
          for (const row of batch) {
            const dedupResult = findMatch(row.data, existingPersonas)
            dedupResult.rowIndex = row.rowIndex
            results.push({ ...row, dedupResult })
          }

          setProgress(Math.min(100, Math.round(((i + batch.length) / rawRows.length) * 100)))
        }

        // Detect internal duplicates
        detectInternalDuplicates(results)

        setImportRows(results)
      } catch (err) {
        console.error('Error in dedup:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    runDedup()
    return () => { cancelled = true }
  }, [rawRows])

  // Stats
  const stats = useMemo(() => {
    const nuevas = importRows.filter((r) => r.dedupResult?.status === 'nueva').length
    const exactas = importRows.filter((r) => r.dedupResult?.status === 'match_exacto').length
    const posibles = importRows.filter((r) => r.dedupResult?.status === 'match_posible').length
    const duplicadas = importRows.filter((r) => r.dedupResult?.status === 'duplicada_en_lote').length
    return { nuevas, exactas, posibles, duplicadas }
  }, [importRows])

  // Toggle a possible match to "nueva" or back
  function toggleRowStatus(rowIndex: number) {
    setImportRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex !== rowIndex || !r.dedupResult) return r
        const newStatus = r.dedupResult.status === 'match_posible' ? 'nueva' : 'match_posible'
        return {
          ...r,
          dedupResult: {
            ...r.dedupResult,
            status: newStatus,
            matchedPersonaId: newStatus === 'nueva' ? null : r.dedupResult.matchedPersonaId,
            matchedPersona: newStatus === 'nueva' ? null : r.dedupResult.matchedPersona,
          },
        }
      })
    )
  }

  // Confirm a possible match → promote to match_exacto
  function confirmMatch(rowIndex: number) {
    setImportRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex !== rowIndex || !r.dedupResult) return r
        return {
          ...r,
          dedupResult: {
            ...r.dedupResult,
            status: 'match_exacto' as const,
          },
        }
      })
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium">Analizando coincidencias...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Comparando {rawRows.length} filas contra personas existentes ({progress}%)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Revisión de coincidencias</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Se cruzaron los datos del archivo contra las personas existentes en el sistema.
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Personas nuevas"
          count={stats.nuevas}
          color="text-success-600"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <StatCard
          label="Match exacto (DNI)"
          count={stats.exactas}
          color="text-info-600"
          icon={<Link2 className="h-4 w-4" />}
        />
        <StatCard
          label="Match posible"
          count={stats.posibles}
          color="text-warning-600"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Duplicadas en lote"
          count={stats.duplicadas}
          color="text-error-600"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      {/* Possible matches requiring review */}
      {stats.posibles > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Coincidencias posibles ({stats.posibles}) — revisá si son la misma persona
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {importRows
              .filter((r) => r.dedupResult?.status === 'match_posible')
              .slice(0, 50)
              .map((row) => (
                <PossibleMatchCard
                  key={row.rowIndex}
                  row={row}
                  onToggle={() => toggleRowStatus(row.rowIndex)}
                  onConfirm={() => confirmMatch(row.rowIndex)}
                />
              ))}
            {stats.posibles > 50 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                ...y {stats.posibles - 50} coincidencias más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Preview of new personas */}
      {stats.nuevas > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Nuevas personas a crear ({stats.nuevas})
          </h3>
          <div className="overflow-x-auto rounded border max-h-[200px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr className="border-b">
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Nombre</th>
                  <th className="px-2 py-1.5 text-left">Apellido</th>
                  <th className="px-2 py-1.5 text-left">DNI</th>
                  <th className="px-2 py-1.5 text-left">Email</th>
                </tr>
              </thead>
              <tbody>
                {importRows
                  .filter((r) => r.dedupResult?.status === 'nueva')
                  .slice(0, 20)
                  .map((row) => (
                    <tr key={row.rowIndex} className="border-b last:border-0">
                      <td className="px-2 py-1 text-muted-foreground">{row.rowIndex + 1}</td>
                      <td className="px-2 py-1">{row.data.nombre ?? '—'}</td>
                      <td className="px-2 py-1">{row.data.apellido ?? '—'}</td>
                      <td className="px-2 py-1 text-muted-foreground">{row.data.numero_documento ?? '—'}</td>
                      <td className="px-2 py-1 text-muted-foreground">{row.data.email_principal ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {stats.nuevas > 20 && (
            <p className="text-xs text-muted-foreground">
              Mostrando las primeras 20 de {stats.nuevas}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Volver
        </Button>
        <Button size="sm" onClick={() => onComplete(importRows)}>
          Continuar
        </Button>
      </div>
    </div>
  )
}

function StatCard({
  label,
  count,
  color,
  icon,
}: {
  label: string
  count: number
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-md border p-3">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

function PossibleMatchCard({
  row,
  onToggle,
  onConfirm,
}: {
  row: ImportRow
  onToggle: () => void
  onConfirm: () => void
}) {
  const match = row.dedupResult?.matchedPersona
  if (!match) return null

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <p className="text-muted-foreground">Del archivo:</p>
            <p className="font-medium">
              {row.data.nombre} {row.data.apellido}
            </p>
            {row.data.numero_documento && (
              <p className="text-muted-foreground">DNI: {row.data.numero_documento}</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground">En el sistema:</p>
            <p className="font-medium">
              {match.nombre} {match.apellido}
            </p>
            {match.numero_documento && (
              <p className="text-muted-foreground">DNI: {match.numero_documento}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={onToggle}>
            No es la misma
          </Button>
          <Button size="sm" variant="default" className="text-xs h-7" onClick={onConfirm}>
            <Link2 className="h-3 w-3 mr-1" />
            Vincular
          </Button>
        </div>
      </div>
    </div>
  )
}
