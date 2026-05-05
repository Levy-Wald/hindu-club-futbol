'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, AlertTriangle } from 'lucide-react'
import { autoDetectMapping } from '../_lib/column-detector'
import { FIELD_OPTIONS } from '../_lib/types'
import type { ParsedData, ColumnMapping, FieldKey } from '../_lib/types'

interface StepMappingProps {
  parsedData: ParsedData
  onComplete: (mappings: ColumnMapping[]) => void
  onBack: () => void
}

const IGNORE_VALUE = '__ignorar__'

export function StepMapping({ parsedData, onComplete, onBack }: StepMappingProps) {
  const initialMappings = useMemo(
    () => autoDetectMapping(parsedData.headers, parsedData.rows.slice(0, 10)),
    [parsedData]
  )

  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings)

  const previewRows = parsedData.rows.slice(0, 5)

  const mappedFields = mappings
    .filter((m) => m.targetField !== null)
    .map((m) => m.targetField!)

  const hasNombre = mappedFields.includes('nombre')
  const hasApellido = mappedFields.includes('apellido')
  const hasIdentifier = mappedFields.includes('numero_documento') || (hasNombre && hasApellido)

  function handleMappingChange(index: number, value: string) {
    setMappings((prev) => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        targetField: value === IGNORE_VALUE ? null : (value as FieldKey),
        confidence: 1, // User-set = full confidence
      }
      return next
    })
  }

  // Group field options by category
  const groupedOptions = useMemo(() => {
    const groups: Record<string, typeof FIELD_OPTIONS> = {}
    for (const opt of FIELD_OPTIONS) {
      if (!groups[opt.group]) groups[opt.group] = []
      groups[opt.group].push(opt)
    }
    return groups
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Mapeo de columnas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Indicá qué campo del sistema corresponde a cada columna del archivo.
          Las columnas sin mapear se guardarán como datos extra.
        </p>
      </div>

      {/* Preview table */}
      <div>
        <h3 className="text-sm font-medium mb-2">Vista previa (primeras 5 filas)</h3>
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                {parsedData.headers.map((h, i) => (
                  <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  {parsedData.headers.map((_, ci) => (
                    <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate text-muted-foreground">
                      {row[ci] ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mapping UI */}
      <div>
        <h3 className="text-sm font-medium mb-3">Asignación de campos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mappings.map((mapping, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded border bg-background">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={mapping.sourceHeader}>
                  {mapping.sourceHeader}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  ej: {previewRows[0]?.[i] ?? '—'}
                </p>
              </div>
              <div className="shrink-0">
                {mapping.confidence >= 0.7 && mapping.targetField && (
                  <Check className="h-3 w-3 text-green-600 inline mr-1" />
                )}
              </div>
              <Select
                value={mapping.targetField ?? IGNORE_VALUE}
                onValueChange={(v) => handleMappingChange(i, v ?? IGNORE_VALUE)}
              >
                <SelectTrigger className="h-8 text-xs w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IGNORE_VALUE}>— Ignorar —</SelectItem>
                  {Object.entries(groupedOptions).map(([group, options]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group}</div>
                      {options.map((opt) => {
                        const alreadyUsed = mappedFields.includes(opt.value) && mapping.targetField !== opt.value
                        return (
                          <SelectItem key={opt.value} value={opt.value} disabled={alreadyUsed}>
                            {opt.label} {alreadyUsed ? '(ya asignado)' : ''}
                          </SelectItem>
                        )
                      })}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      {/* Summary & validation */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-md border bg-muted/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={hasIdentifier ? 'default' : 'destructive'}>
              {mappedFields.length} campos mapeados
            </Badge>
            {parsedData.totalRows > 0 && (
              <Badge variant="outline">{parsedData.totalRows} filas</Badge>
            )}
          </div>
          {!hasIdentifier && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Mapeá al menos Nombre + Apellido, o DNI, para poder identificar personas.
            </p>
          )}
          {mappings.some((m) => !m.targetField) && (
            <p className="text-xs text-muted-foreground">
              Las columnas sin mapear se guardarán en metadata.
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onBack}>
            Volver
          </Button>
          <Button size="sm" onClick={() => onComplete(mappings)} disabled={!hasIdentifier}>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}
