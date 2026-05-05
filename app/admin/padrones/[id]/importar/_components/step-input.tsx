'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, ClipboardPaste } from 'lucide-react'
import { toast } from 'sonner'
import { parseInput, parseFile } from '../_lib/parser'
import type { ParsedData } from '../_lib/types'

interface StepInputProps {
  onDataParsed: (data: ParsedData) => void
}

export function StepInput({ onDataParsed }: StepInputProps) {
  const [mode, setMode] = useState<'file' | 'paste'>('file')
  const [pastedText, setPastedText] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const parsed = await parseFile(file)
      if (parsed.rows.length === 0) {
        toast.error('El archivo no tiene datos.')
        return
      }
      onDataParsed(parsed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al leer el archivo.')
    } finally {
      setLoading(false)
    }
  }

  function handlePaste() {
    if (!pastedText.trim()) {
      toast.error('No hay texto para procesar.')
      return
    }

    const parsed = parseInput(pastedText)
    if (parsed.rows.length === 0) {
      toast.error('No se pudieron extraer datos del texto.')
      return
    }
    onDataParsed(parsed)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Cargar datos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Subí un archivo o pegá los datos directamente. Se acepta CSV, Excel, texto separado por tabs (copiar desde planilla), o cualquier formato tabular.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('file')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Subir archivo
        </Button>
        <Button
          variant={mode === 'paste' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('paste')}
        >
          <ClipboardPaste className="h-4 w-4 mr-2" />
          Pegar texto
        </Button>
      </div>

      {/* File upload */}
      {mode === 'file' && (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Arrastrá o hacé clic para subir</p>
          <p className="text-xs text-muted-foreground mt-1">
            CSV, Excel (.xlsx, .xls), TXT — Máximo 20.000 filas
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.txt,.tsv"
            onChange={handleFileSelect}
            className="hidden"
          />
          {loading && (
            <p className="text-sm text-primary mt-3">Procesando archivo...</p>
          )}
        </div>
      )}

      {/* Text paste */}
      {mode === 'paste' && (
        <div className="space-y-3">
          <textarea
            className="w-full h-64 rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={`Pegá acá los datos. Ejemplos de formatos aceptados:

— Copiado de Excel/Sheets (tabs separan columnas):
Nombre\tApellido\tDNI\tEmail
Juan\tPérez\t12345678\tjuan@mail.com

— Separado por comas (CSV):
Nombre,Apellido,DNI,Email
Juan,Pérez,12345678,juan@mail.com

— Separado por punto y coma:
Nombre;Apellido;DNI;Email
Juan;Pérez;12345678;juan@mail.com`}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {pastedText.trim() ? `${pastedText.split('\n').filter((l) => l.trim()).length} líneas detectadas` : ''}
            </p>
            <Button onClick={handlePaste} disabled={!pastedText.trim()}>
              Procesar texto
            </Button>
          </div>
        </div>
      )}

      {/* AI stub notice */}
      <div className="rounded-md border border-dashed border-muted-foreground/30 p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong>Próximamente:</strong> Interpretación inteligente con IA para PDFs, imágenes de planillas, y texto desestructurado.
          Por ahora, usá formatos tabulares (CSV, Excel, o pegá desde una planilla).
        </p>
      </div>
    </div>
  )
}
