'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { importarPersonas } from '../_actions'

// --- Types ---

type FieldKey =
  | 'nombre'
  | 'apellido'
  | 'numero_documento'
  | 'email_principal'
  | 'telefono_principal'
  | 'fecha_nacimiento'
  | 'genero'
  | 'cuil_cuit'
  | 'tipo_documento'
  | 'direccion_calle'
  | 'direccion_ciudad'
  | 'direccion_provincia'

const FIELD_OPTIONS: { value: FieldKey; label: string }[] = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'apellido', label: 'Apellido' },
  { value: 'numero_documento', label: 'Nro. Documento' },
  { value: 'email_principal', label: 'Email' },
  { value: 'telefono_principal', label: 'Telefono' },
  { value: 'fecha_nacimiento', label: 'Fecha Nacimiento' },
  { value: 'genero', label: 'Genero' },
  { value: 'cuil_cuit', label: 'CUIL/CUIT' },
  { value: 'tipo_documento', label: 'Tipo Documento' },
  { value: 'direccion_calle', label: 'Direccion Calle' },
  { value: 'direccion_ciudad', label: 'Ciudad' },
  { value: 'direccion_provincia', label: 'Provincia' },
]

const IGNORE_VALUE = '__ignorar__'

// --- CSV Parsing ---

function parseCSV(text: string): string[][] {
  // Remove BOM if present
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
        i++ // skip escaped quote
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
        if (char === '\r') i++ // skip \n in \r\n
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

  // Last field/row
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
  whatsapp: 'telefono_principal',
  fecha_nacimiento: 'fecha_nacimiento',
  nacimiento: 'fecha_nacimiento',
  birthdate: 'fecha_nacimiento',
  'fecha nac': 'fecha_nacimiento',
  genero: 'genero',
  sexo: 'genero',
  gender: 'genero',
  cuil: 'cuil_cuit',
  cuit: 'cuil_cuit',
  cuil_cuit: 'cuil_cuit',
  direccion: 'direccion_calle',
  calle: 'direccion_calle',
  domicilio: 'direccion_calle',
  ciudad: 'direccion_ciudad',
  localidad: 'direccion_ciudad',
  provincia: 'direccion_provincia',
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

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<(FieldKey | null)[]>([])
  const [importing, setImporting] = useState(false)
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
  }, [])

  function handleClose(value: boolean) {
    if (!value) reset()
    onOpenChange(value)
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

    const mappedRows = rows.map((row) => {
      const obj: Record<string, string> = {}
      mapping.forEach((field, colIndex) => {
        if (field && row[colIndex]) {
          obj[field] = row[colIndex]
        }
      })
      return obj as unknown as Parameters<typeof importarPersonas>[0][number]
    })

    try {
      const result = await importarPersonas(mappedRows)
      setResults(result)
      setStep(4)
      if (result.imported > 0) {
        toast.success(`Se importaron ${result.imported} persona(s).`)
      }
    } catch {
      toast.error('Error inesperado durante la importacion.')
    } finally {
      setImporting(false)
    }
  }

  const previewRows = rows.slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar personas desde CSV</DialogTitle>
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
              Exporta tu Excel como CSV (separado por comas, UTF-8) antes de importar.
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
                disabled={!getMappedFields().includes('nombre') || !getMappedFields().includes('apellido')}
              >
                Continuar
              </Button>
            </div>
            {(!getMappedFields().includes('nombre') || !getMappedFields().includes('apellido')) && (
              <p className="text-xs text-destructive">
                Debes mapear al menos las columnas Nombre y Apellido.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm">
                Se importaran <strong>{rows.length}</strong> fila(s).
              </p>
              <p className="text-sm">
                Campos mapeados:{' '}
                <span className="font-medium">
                  {getMappedFields()
                    .map((f) => FIELD_OPTIONS.find((o) => o.value === f)?.label ?? f)
                    .join(', ')}
                </span>
              </p>
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
                <p className="text-2xl font-bold text-green-600">{results.imported}</p>
                <p className="text-xs text-muted-foreground">Importadas</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
                <p className="text-xs text-muted-foreground">Duplicadas (omitidas)</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-2xl font-bold text-red-600">{results.errors.length}</p>
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
