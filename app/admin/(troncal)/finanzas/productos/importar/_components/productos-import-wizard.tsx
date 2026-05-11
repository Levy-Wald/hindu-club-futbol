'use client'

import { useState, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Upload, ClipboardPaste, Check, AlertTriangle, Loader2, CheckCircle2, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { parseInput, parseFile } from '@/app/admin/(troncal)/padrones/[id]/importar/_lib/parser'
import { importarProductosBatch } from '../_actions'
import type { ParsedData } from '@/app/admin/(troncal)/padrones/[id]/importar/_lib/types'
import { PRODUCTO_FIELD_OPTIONS, type ProductoFieldKey } from '../_lib/types'

interface ProductoColumnMapping {
  sourceIndex: number
  sourceHeader: string
  targetField: ProductoFieldKey | null
  confidence: number
}

type Step = 'input' | 'mapping' | 'confirm' | 'results'

const IGNORE_VALUE = '__ignorar__'

// Simple auto-detect mapping for product columns
function autoDetectProductMapping(headers: string[]): ProductoColumnMapping[] {
  const ALIASES: Record<string, ProductoFieldKey> = {
    'nombre': 'nombre', 'name': 'nombre', 'producto': 'nombre', 'product': 'nombre', 'descripcion': 'descripcion',
    'description': 'descripcion', 'tipo': 'tipo', 'type': 'tipo', 'sku': 'sku', 'codigo': 'sku', 'code': 'sku',
    'ean13': 'ean13', 'ean-13': 'ean13', 'ean14': 'ean14', 'ean-14': 'ean14', 'barcode': 'ean13',
    'marca': 'marca', 'brand': 'marca', 'modelo': 'modelo', 'model': 'modelo',
    'color': 'color', 'material': 'material', 'origen': 'origen', 'origin': 'origen',
    'unidad': 'unidad_medida', 'unit': 'unidad_medida', 'unidad_medida': 'unidad_medida',
    'precio': 'precio', 'price': 'precio', 'precio_venta': 'precio', 'sale_price': 'precio',
    'precio_compra': 'precio_compra', 'cost': 'precio_compra', 'costo': 'precio_compra',
    'moneda': 'moneda', 'currency': 'moneda',
    'iva': 'iva_venta', 'iva_venta': 'iva_venta', 'iva_compra': 'iva_compra',
    'stock': 'stock_actual', 'stock_actual': 'stock_actual', 'stock_minimo': 'stock_minimo',
    'peso': 'peso_kg', 'weight': 'peso_kg', 'instalacion': 'instalacion',
  }

  return headers.map((header, index) => {
    const normalized = header.toLowerCase().trim().replace(/[\s\-_.]+/g, '_')
    const match = ALIASES[normalized] || null
    return {
      sourceIndex: index,
      sourceHeader: header,
      targetField: match as ProductoFieldKey | null,
      confidence: match ? 0.9 : 0,
    }
  })
}

export function ProductosImportWizard() {
  const [step, setStep] = useState<Step>('input')
  const [mode, setMode] = useState<'file' | 'paste'>('file')
  const [pastedText, setPastedText] = useState('')
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<ProductoColumnMapping[]>([])
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
      setMappings(autoDetectProductMapping(parsed.headers))
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
    setMappings(autoDetectProductMapping(parsed.headers))
    setStep('mapping')
  }

  // --- Step 2: Mapping ---
  const mappedFields = useMemo(() => mappings.filter((m) => m.targetField).map((m) => m.targetField!), [mappings])
  const hasNombre = mappedFields.includes('nombre')

  function handleMappingChange(index: number, value: string) {
    setMappings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], targetField: value === IGNORE_VALUE ? null : (value as ProductoFieldKey), confidence: 1 }
      return next
    })
  }

  // --- Step 3: Import ---
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
      const result = await importarProductosBatch(rows)
      setResults(result)
      setStep('results')
      if (result.imported > 0) toast.success(`${result.imported} productos importados.`)
    } catch {
      toast.error('Error durante la importación.')
    } finally {
      setImporting(false)
    }
  }

  const groupedOptions = useMemo(() => {
    const groups: Record<string, typeof PRODUCTO_FIELD_OPTIONS> = {}
    for (const opt of PRODUCTO_FIELD_OPTIONS) {
      if (!groups[opt.group]) groups[opt.group] = []
      groups[opt.group].push(opt)
    }
    return groups
  }, [])

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" render={<Link href="/admin/finanzas/productos" />}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Importar productos</h1>
          <p className="text-sm text-muted-foreground">
            Importa productos desde CSV, Excel o pegando datos
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Archivo', 'Mapeo', 'Confirmar', 'Resultado'].map((label, i) => {
          const stepKeys: Step[] = ['input', 'mapping', 'confirm', 'results']
          const isActive = step === stepKeys[i]
          const isDone = stepKeys.indexOf(step) > i
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <Badge variant={isActive ? 'default' : isDone ? 'secondary' : 'outline'} className="text-xs">
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </Badge>
              <span className={isActive ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
            </div>
          )
        })}
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setMode('file')}>
              <Upload className="h-4 w-4 mr-1" /> Archivo
            </Button>
            <Button variant={mode === 'paste' ? 'default' : 'outline'} size="sm" onClick={() => setMode('paste')}>
              <ClipboardPaste className="h-4 w-4 mr-1" /> Pegar datos
            </Button>
          </div>

          {mode === 'file' ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Arrastra un archivo o hace clic para seleccionar</p>
              <p className="text-xs text-muted-foreground mt-1">CSV, XLS, XLSX</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,.tsv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Pega tus datos separados por tabs o comas. La primera fila debe ser el encabezado."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
              <Button onClick={handlePaste} disabled={!pastedText.trim()}>
                Procesar datos
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && parsedData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {parsedData.totalRows} filas detectadas, {parsedData.headers.length} columnas
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep('input')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver
              </Button>
              <Button size="sm" disabled={!hasNombre} onClick={() => setStep('confirm')}>
                Continuar
              </Button>
            </div>
          </div>

          {!hasNombre && (
            <div className="flex items-center gap-2 rounded-md border border-warning-300 bg-warning-50 dark:bg-warning-950/20 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0" />
              <span>Mapeá al menos la columna <strong>Nombre</strong> para continuar.</span>
            </div>
          )}

          <div className="rounded-md border overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Columna origen</TableHead>
                  <TableHead className="w-48">Mapear a</TableHead>
                  <TableHead>Vista previa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{mapping.sourceHeader}</TableCell>
                    <TableCell>
                      <Select
                        value={mapping.targetField ?? IGNORE_VALUE}
                        onValueChange={(val) => handleMappingChange(i, val ?? IGNORE_VALUE)}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={IGNORE_VALUE}>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <X className="h-3 w-3" /> Ignorar
                            </span>
                          </SelectItem>
                          {Object.entries(groupedOptions).map(([group, opts]) => (
                            <div key={group}>
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group}</div>
                              {opts.map((opt) => (
                                <SelectItem
                                  key={opt.value}
                                  value={opt.value}
                                  disabled={mappedFields.includes(opt.value) && mapping.targetField !== opt.value}
                                >
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                      {parsedData.rows.slice(0, 3).map((r) => r[i]).filter(Boolean).join(' | ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && parsedData && (
        <div className="space-y-4">
          <div className="rounded-md border p-4 space-y-2">
            <h3 className="font-medium">Resumen de importación</h3>
            <p className="text-sm text-muted-foreground">{parsedData.totalRows} productos a importar</p>
            <div className="flex flex-wrap gap-2">
              {mappings.filter((m) => m.targetField).map((m) => (
                <Badge key={m.sourceIndex} variant="secondary" className="text-xs">
                  {m.sourceHeader} → {PRODUCTO_FIELD_OPTIONS.find((o) => o.value === m.targetField)?.label ?? m.targetField}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Se deduplica por SKU o EAN-13. Los productos existentes se omiten.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('mapping')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Volver
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              {importing ? 'Importando...' : `Importar ${parsedData.totalRows} productos`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'results' && results && (
        <div className="space-y-4">
          <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success-600" />
              <h3 className="font-medium">Importación completada</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-success-600">{results.imported}</p>
                <p className="text-xs text-muted-foreground">Importados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">{results.skipped}</p>
                <p className="text-xs text-muted-foreground">Omitidos (duplicados)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-error-600">{results.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errores</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                {results.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3 w-3 text-error-500 mt-0.5 shrink-0" />
                    <span>Fila {err.row}: {err.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/admin/finanzas/productos" />}>
              Volver a productos
            </Button>
            <Button onClick={() => { setStep('input'); setParsedData(null); setResults(null) }}>
              Importar más
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
