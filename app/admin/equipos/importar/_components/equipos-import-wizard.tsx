'use client'

import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
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
import type { ParsedData } from '@/app/admin/padrones/[id]/importar/_lib/types'
import { importarEquiposBatch } from '../_actions'

type EquipoField = 'nombre' | 'disciplina_slug' | 'modalidad' | 'color_principal'

const FIELD_OPTIONS: { value: EquipoField; label: string }[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'disciplina_slug', label: 'Disciplina' },
  { value: 'modalidad', label: 'Modalidad (M/F/mixto)' },
  { value: 'color_principal', label: 'Color principal' },
]

const HEADER_MAP: Record<string, EquipoField> = {
  nombre: 'nombre',
  equipo: 'nombre',
  name: 'nombre',
  disciplina: 'disciplina_slug',
  disciplina_slug: 'disciplina_slug',
  deporte: 'disciplina_slug',
  modalidad: 'modalidad',
  genero: 'modalidad',
  color: 'color_principal',
  color_principal: 'color_principal',
}

const IGNORE_VALUE = '__ignorar__'

type Step = 'input' | 'mapping' | 'confirm' | 'results'

export function EquiposImportWizard() {
  const [step, setStep] = useState<Step>('input')
  const [mode, setMode] = useState<'file' | 'paste'>('file')
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<(EquipoField | null)[]>([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ imported: number; skipped: number; errors: { row: number; message: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function autoDetect(headers: string[]): (EquipoField | null)[] {
    const used = new Set<EquipoField>()
    return headers.map((h) => {
      const normalized = h.toLowerCase().trim().replace(/[_\-\.]+/g, ' ')
      const field = HEADER_MAP[normalized]
      if (field && !used.has(field)) { used.add(field); return field }
      return null
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseFile(file)
      if (parsed.rows.length === 0) { toast.error('Archivo sin datos.'); return }
      setParsedData(parsed)
      setMappings(autoDetect(parsed.headers))
      setStep('mapping')
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error.') }
  }

  function handlePaste() {
    if (!pastedText.trim()) return
    const parsed = parseInput(pastedText)
    if (parsed.rows.length === 0) { toast.error('Sin datos.'); return }
    setParsedData(parsed)
    setMappings(autoDetect(parsed.headers))
    setStep('mapping')
  }

  const mappedFields = mappings.filter((m): m is EquipoField => m !== null)
  const hasRequired = mappedFields.includes('nombre') && mappedFields.includes('disciplina_slug')

  async function handleImport() {
    if (!parsedData) return
    setImporting(true)
    const rows = parsedData.rows.map((row) => {
      const data: Record<string, string> = {}
      mappings.forEach((field, i) => { if (field && row[i]) data[field] = row[i] })
      return data
    })
    try {
      const result = await importarEquiposBatch(rows)
      setResults(result)
      setStep('results')
      if (result.imported > 0) toast.success(`${result.imported} equipos importados.`)
    } catch { toast.error('Error.') }
    finally { setImporting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/equipos"><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-xl font-semibold">Importar equipos</h1>
          <p className="text-sm text-muted-foreground">CSV, Excel o texto pegado</p>
        </div>
      </div>

      {step === 'input' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setMode('file')}><Upload className="h-4 w-4 mr-2" />Subir</Button>
            <Button variant={mode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setMode('paste')}><ClipboardPaste className="h-4 w-4 mr-2" />Pegar</Button>
          </div>
          {mode === 'file' && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50" onClick={() => fileInputRef.current?.click()}>
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Subir archivo</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,.txt,.tsv" onChange={handleFileSelect} className="hidden" />
            </div>
          )}
          {mode === 'paste' && (
            <div className="space-y-3">
              <textarea className="w-full h-48 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Pegá los datos" value={pastedText} onChange={(e) => setPastedText(e.target.value)} />
              <div className="flex justify-end"><Button onClick={handlePaste} disabled={!pastedText.trim()}>Procesar</Button></div>
            </div>
          )}
        </div>
      )}

      {step === 'mapping' && parsedData && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50">{parsedData.headers.map((h, i) => <th key={i} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>{parsedData.rows.slice(0, 3).map((row, ri) => <tr key={ri} className="border-b last:border-0">{parsedData.headers.map((_, ci) => <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[120px] truncate text-muted-foreground">{row[ci] ?? ''}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parsedData.headers.map((h, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border">
                <p className="text-sm font-medium flex-1 truncate">{h}</p>
                {mappings[i] && <Check className="h-3 w-3 text-success-600 shrink-0" />}
                <Select value={mappings[i] ?? IGNORE_VALUE} onValueChange={(v) => setMappings((p) => { const n = [...p]; n[i] = v === IGNORE_VALUE ? null : v as EquipoField; return n })}>
                  <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={IGNORE_VALUE}>— Ignorar —</SelectItem>
                    {FIELD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value} disabled={mappedFields.includes(o.value) && mappings[i] !== o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            {!hasRequired && <p className="text-xs text-destructive"><AlertTriangle className="h-3 w-3 inline mr-1" />Mapeá Nombre y Disciplina.</p>}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={() => setStep('input')}>Volver</Button>
              <Button size="sm" onClick={() => setStep('confirm')} disabled={!hasRequired}>Continuar</Button>
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && parsedData && (
        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <p className="text-sm">Se importarán <strong>{parsedData.rows.length}</strong> equipos.</p>
            <p className="text-xs text-muted-foreground mt-1">Se deduplicará por nombre + disciplina.</p>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep('mapping')}>Volver</Button>
            <Button onClick={handleImport} disabled={importing}>{importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : 'Importar'}</Button>
          </div>
        </div>
      )}

      {step === 'results' && results && (
        <div className="space-y-4">
          <div className="flex items-center gap-3"><CheckCircle2 className="h-8 w-8 text-success-600" /><h2 className="text-lg font-medium">Completado</h2></div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border p-3"><p className="text-2xl font-bold text-success-600">{results.imported}</p><p className="text-xs text-muted-foreground">Importados</p></div>
            <div className="rounded-md border p-3"><p className="text-2xl font-bold text-warning-600">{results.skipped}</p><p className="text-xs text-muted-foreground">Omitidos</p></div>
            <div className="rounded-md border p-3"><p className="text-2xl font-bold text-error-600">{results.errors.length}</p><p className="text-xs text-muted-foreground">Errores</p></div>
          </div>
          <div className="flex justify-end"><Link href="/admin/equipos"><Button>Ver equipos</Button></Link></div>
        </div>
      )}
    </div>
  )
}
