'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { importarMiembrosPadron, buscarPersonaPorDocumento } from '../../_actions'
import { importarPersonas } from '@/app/admin/personas/_actions'

// --- Types ---

type FieldKey =
  | 'nombre'
  | 'apellido'
  | 'numero_documento'
  | 'email_principal'
  | 'telefono_principal'
  | 'numero_socio'

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'apellido', label: 'Apellido' },
  { value: 'numero_documento', label: 'Nro. Documento' },
  { value: 'email_principal', label: 'Email' },
  { value: 'telefono_principal', label: 'Telefono' },
  { value: 'numero_socio', label: 'Numero Socio' },
]

const IGNORE_VALUE = '__ignorar__'

// --- CSV Parsing ---

function parseCSV(text: string): string[][] {
  const cleaned = text.startsWith('\ufeff') ? text.slice(1) : text
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    const next = cleaned[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        row.push(current.trim())
        current = ''
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current.trim())
        current = ''
        if (row.some((cell) => cell !== '')) {
          rows.push(row)
        }
        row = []
        if (char === '\r') i++
      } else if (char === '\r') {
        row.push(current.trim())
        current = ''
        if (row.some((cell) => cell !== '')) {
          rows.push(row)
        }
        row = []
      } else {
        current += char
      }
    }
  }

  row.push(current.trim())
  if (row.some((cell) => cell !== '')) {
    rows.push(row)
  }

  return rows
}

// --- Auto-detect column mapping ---

const HEADER_MAP: Record<string, FieldKey> = {
  nombre: 'nombre',
  name: 'nombre',
  'primer nombre': 'nombre',
  apellido: 'apellido',
  'last name': 'apellido',
  surname: 'apellido',
  dni: 'numero_documento',
  documento: 'numero_documento',
  numero_documento: 'numero_documento',
  nro_documento: 'numero_documento',
  'nro documento': 'numero_documento',
  doc: 'numero_documento',
  email: 'email_principal',
  mail: 'email_principal',
  correo: 'email_principal',
  telefono: 'telefono_principal',
  tel: 'telefono_principal',
  celular: 'telefono_principal',
  phone: 'telefono_principal',
  numero_socio: 'numero_socio',
  'nro socio': 'numero_socio',
  'n socio': 'numero_socio',
  'numero socio': 'numero_socio',
  socio: 'numero_socio',
}

function autoDetectMapping(headers: string[]): (FieldKey | null)[] {
  const usedFields = new Set<FieldKey>()
  return headers.map((h) => {
    const normalized = h.toLowerCase().trim()
    const field = HEADER_MAP[normalized]
    if (field && !usedFields.has(field)) {
      usedFields.add(field)
      return field
    }
    return null
  })
}

// --- Component ---

interface ImportarMiembrosDialogProps {
  padronId: string
  estadosPadron: { id: string; slug: string; nombre: string }[]
  tiposSocio: { id: string; slug: string; nombre: string }[]
}

export function ImportarMiembrosDialog({ padronId, estadosPadron, tiposSocio }: ImportarMiembrosDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<(FieldKey | null)[]>([])
  const [importing, setImporting] = useState(false)
  const [defaultEstadoId, setDefaultEstadoId] = useState('')
  const [defaultTipoSocioId, setDefaultTipoSocioId] = useState('')
  const [results, setResults] = useState<{
    imported: number
    skipped: number
    errors: { row: number; message: string }[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep(1)
    setHeaders([])
    setRows([])
    setMapping([])
    setImporting(false)
    setResults(null)
    setDefaultEstadoId('')
    setDefaultTipoSocioId('')
  }, [])

  function handleClose(value: boolean) {
    if (!value) reset()
    setOpen(value)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length < 2) {
        toast.error('El archivo no tiene datos suficientes.')
        return
      }

      const csvHeaders = parsed[0]
      const csvRows = parsed.slice(1)
      setHeaders(csvHeaders)
      setRows(csvRows)
      setMapping(autoDetectMapping(csvHeaders))
      setStep(2)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleMappingChange(colIndex: number, value: string | null) {
    const v = value ?? ''
    setMapping((prev) => {
      const next = [...prev]
      next[colIndex] = v === IGNORE_VALUE || v === '' ? null : (v as FieldKey)
      return next
    })
  }

  function getMappedFields(): FieldKey[] {
    return mapping.filter((m): m is FieldKey => m !== null)
  }

  async function handleImport() {
    setImporting(true)

    const documentoIndex = mapping.findIndex((m) => m === 'numero_documento')
    const numeroSocioIndex = mapping.findIndex((m) => m === 'numero_socio')

    if (documentoIndex < 0) {
      toast.error('Se requiere mapear la columna Documento para vincular personas al padron.')
      setImporting(false)
      return
    }

    // Step 1: Create personas that don't exist
    const personaRows = rows.map((row) => {
      const obj: Record<string, string> = {}
      mapping.forEach((field, colIndex) => {
        if (field && row[colIndex] && field !== 'numero_socio') {
          obj[field] = row[colIndex]
        }
      })
      return obj as { nombre: string; apellido: string; numero_documento?: string; email_principal?: string; telefono_principal?: string }
    })

    // Import personas first (will skip duplicates by documento)
    await importarPersonas(personaRows)

    // Step 2: Now find all personas by documento and add to padron

    // Fetch persona IDs by documento
    const padronRows: { persona_id: string; numero_socio?: string; estado_padron_id?: string; tipo_socio_id?: string }[] = []
    const linkErrors: { row: number; message: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const doc = documentoIndex >= 0 ? rows[i][documentoIndex] : ''
      if (!doc) {
        linkErrors.push({ row: i + 1, message: 'Sin documento, no se puede vincular' })
        continue
      }

      const personas = await buscarPersonaPorDocumento(doc)
      if (!personas || personas.length === 0) {
        linkErrors.push({ row: i + 1, message: `No se encontro persona con documento ${doc}` })
        continue
      }

      padronRows.push({
        persona_id: personas[0].id,
        numero_socio: numeroSocioIndex >= 0 ? rows[i][numeroSocioIndex] || undefined : undefined,
        estado_padron_id: defaultEstadoId || undefined,
        tipo_socio_id: defaultTipoSocioId || undefined,
      })
    }

    const padronResult = await importarMiembrosPadron(padronId, padronRows)

    setResults({
      imported: padronResult.imported,
      skipped: padronResult.skipped,
      errors: [...linkErrors, ...padronResult.errors],
    })
    setStep(4)

    if (padronResult.imported > 0) {
      toast.success(`Se agregaron ${padronResult.imported} miembro(s) al padron.`)
    }

    setImporting(false)
  }

  const previewRows = rows.slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Upload className="mr-2 h-4 w-4" />
        Importar CSV
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar miembros desde CSV</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2.5 w-2.5 rounded-full ${
                s === step
                  ? 'bg-primary'
                  : s < step
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sube un CSV con al menos las columnas: nombre, apellido y documento.
              Las personas que no existan seran creadas automaticamente.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>
        )}

        {/* Step 2: Preview & Map */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <h3 className="text-sm font-medium">Vista previa (primeras 5 filas)</h3>
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1 text-left font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-0">
                      {headers.map((_, ci) => (
                        <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate">
                          {row[ci] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-sm font-medium pt-2">Mapeo de columnas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {headers.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm min-w-[100px] truncate" title={h}>
                    {h}
                  </span>
                  <Select
                    value={mapping[i] ?? IGNORE_VALUE}
                    onValueChange={(v) => handleMappingChange(i, v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={IGNORE_VALUE}>Ignorar</SelectItem>
                      {FIELD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Volver
              </Button>
              <Button
                size="sm"
                onClick={() => setStep(3)}
                disabled={
                  !getMappedFields().includes('nombre') ||
                  !getMappedFields().includes('apellido') ||
                  !getMappedFields().includes('numero_documento')
                }
              >
                Continuar
              </Button>
            </div>
            {(!getMappedFields().includes('nombre') || !getMappedFields().includes('apellido') || !getMappedFields().includes('numero_documento')) && (
              <p className="text-xs text-destructive">
                Debes mapear al menos Nombre, Apellido y Documento.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm">
                Se procesaran <strong>{rows.length}</strong> fila(s).
              </p>
              <p className="text-sm">
                Campos mapeados:{' '}
                <span className="font-medium">
                  {getMappedFields()
                    .map((f) => FIELD_OPTIONS.find((o) => o.value === f)?.label ?? f)
                    .join(', ')}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Las personas que no existan (por documento) seran creadas. Luego se agregaran al padron.
              </p>
            </div>

            {/* Default padron fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Estado padron (por defecto)</label>
                <Select value={defaultEstadoId} onValueChange={(v) => setDefaultEstadoId(v ?? '')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sin estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosPadron.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tipo socio (por defecto)</label>
                <Select value={defaultTipoSocioId} onValueChange={(v) => setDefaultTipoSocioId(v ?? '')}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sin tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSocio.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Volver
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing}>
                {importing ? 'Importando...' : 'Importar'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && results && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border p-3">
                <p className="text-2xl font-bold text-success-600">{results.imported}</p>
                <p className="text-xs text-muted-foreground">Agregados</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-2xl font-bold text-warning-600">{results.skipped}</p>
                <p className="text-xs text-muted-foreground">Ya existian</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-2xl font-bold text-error-600">{results.errors.length}</p>
                <p className="text-xs text-muted-foreground">Errores</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                <h4 className="text-sm font-medium">Detalle de errores</h4>
                {results.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive">
                    Fila {err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => handleClose(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
