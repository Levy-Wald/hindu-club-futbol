'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Upload, ClipboardPaste, FileText, Check, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { parseInput, parseFile } from '@/app/admin/padrones/[id]/importar/_lib/parser'
import { autoDetectMapping } from '@/app/admin/padrones/[id]/importar/_lib/column-detector'
import { importarPersonasBatch } from '../_actions'
import type { ParsedData, ColumnMapping, FieldKey } from '@/app/admin/padrones/[id]/importar/_lib/types'
import { FIELD_OPTIONS } from '@/app/admin/padrones/[id]/importar/_lib/types'

type Step = 'input' | 'mapping' | 'confirm' | 'results'

const IGNORE_VALUE = '__ignorar__'

export function PersonasImportWizard() {
  const [step, setStep] = useState<Step>('input')
  const [mode, setMode] = useState<'file' | 'paste'>('file')
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ imported: number; skipped: number; errors: { row: number; message: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Step 1: Input ---
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseFile(file)
      if (parsed.rows.length === 0) { toast.error('Archivo sin datos.'); return }
      setParsedData(parsed)
      setMappings(autoDetectMapping(parsed.headers, parsed.rows.slice(0, 10)))
      setStep('mapping')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al leer archivo.')
    }
  }

  function handlePaste() {
    if (!pastedText.trim()) { toast.error('No hay texto.'); return }
    const parsed = parseInput(pastedText)
    if (parsed.rows.length === 0) { toast.error('No se extrajeron datos.'); return }
    setParsedData(parsed)
    setMappings(autoDetectMapping(parsed.headers, parsed.rows.slice(0, 10)))
    setStep('mapping')
  }

  // --- Step 2: Mapping ---
  const mappedFields = useMemo(() => mappings.filter((m) => m.targetField).map((m) => m.targetField!), [mappings])
  const hasIdentifier = mappedFields.includes('nombre') && mappedFields.includes('apellido')

  function handleMappingChange(index: number, value: string) {
    setMappings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], targetField: value === IGNORE_VALUE ? null : (value as FieldKey), confidence: 1 }
      return next
    })
  }

  // --- Step 3: Confirm & Import ---
  async function handleImport() {
    if (!parsedData) return
    setImporting(true)

    const rows = parsedData.rows.map((row) => {
      const data: Record<string, string> = {}
      mappings.forEach((m, i) => {
        if (m.targetField && row[i]) data[m.targetField] = row[i]
      })
      return data
    })

    try {
      const result = await importarPersonasBatch(rows)
      setResults(result)
      setStep('results')
      if (result.imported > 0) toast.success(`${result.imported} personas importadas.`)
    } catch {
      toast.error('Error durante la importación.')
    } finally {
      setImporting(false)
    }
  }

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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/personas">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Importar personas</h1>
          <p className="text-sm text-muted-foreground">CSV, Excel o texto pegado</p>
        </div>
      </div>

      {/* Steps */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setMode('file')}>
              <Upload className="h-4 w-4 mr-2" />Subir archivo
            </Button>
            <Button variant={mode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setMode('paste')}>
              <ClipboardPaste className="h-4 w-4 mr-2" />Pegar texto
            </Button>
          </div>

          {mode === 'file' && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50" onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Arrastrá o hacé clic para subir</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx), TXT</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt,.tsv" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {mode === 'paste' && (
            <div className="space-y-3">
              <textarea
                className="w-full h-48 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Pegá los datos acá (tabs, comas, o punto y coma como separador)"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handlePaste} disabled={!pastedText.trim()}>Procesar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'mapping' && parsedData && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Mapeo de columnas</h2>

          {/* Preview */}
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50">
                {parsedData.headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {parsedData.rows.slice(0, 3).map((row, ri) => (
                  <tr key={ri} className="border-b last:border-0">
                    {parsedData.headers.map((_, ci) => <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[120px] truncate text-muted-foreground">{row[ci] ?? ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mappings.map((m, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.sourceHeader}</p>
                  <p className="text-xs text-muted-foreground truncate">ej: {parsedData.rows[0]?.[i] ?? '—'}</p>
                </div>
                {m.confidence >= 0.7 && m.targetField && <Check className="h-3 w-3 text-green-600 shrink-0" />}
                <Select value={m.targetField ?? IGNORE_VALUE} onValueChange={(v) => handleMappingChange(i, v ?? IGNORE_VALUE)}>
                  <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={IGNORE_VALUE}>— Ignorar —</SelectItem>
                    {Object.entries(groupedOptions).map(([group, options]) => (
                      <div key={group}>
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group}</div>
                        {options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} disabled={mappedFields.includes(opt.value) && m.targetField !== opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            {!hasIdentifier && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />Mapeá al menos Nombre y Apellido.
              </p>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setStep('input')}>Volver</Button>
              <Button size="sm" onClick={() => setStep('confirm')} disabled={!hasIdentifier}>Continuar</Button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && parsedData && (
        <div className="space-y-4">
          <div className="rounded-md border p-4 space-y-2">
            <p className="text-sm">Se importarán <strong>{parsedData.rows.length}</strong> personas.</p>
            <p className="text-sm">Campos: <span className="font-medium">{mappedFields.map((f) => FIELD_OPTIONS.find((o) => o.value === f)?.label ?? f).join(', ')}</span></p>
            <p className="text-xs text-muted-foreground">Se deduplicará por DNI. Si ya existe, se omite.</p>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep('mapping')}>Volver</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : 'Importar'}
            </Button>
          </div>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <h2 className="text-lg font-medium">Importación completada</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border p-3">
              <p className="text-2xl font-bold text-green-600">{results.imported}</p>
              <p className="text-xs text-muted-foreground">Importadas</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
              <p className="text-xs text-muted-foreground">Omitidas (duplicadas)</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
              <p className="text-xs text-muted-foreground">Errores</p>
            </div>
          </div>
          {results.errors.length > 0 && (
            <div className="max-h-[150px] overflow-y-auto space-y-1">
              {results.errors.map((err, i) => (
                <p key={i} className="text-xs text-destructive">Fila {err.row}: {err.message}</p>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Link href="/admin/personas"><Button>Ver personas</Button></Link>
          </div>
        </div>
      )}
    </div>
  )
}
