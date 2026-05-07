'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Upload, FileSpreadsheet, Clock, CheckCircle2, XCircle, RotateCcw, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { procesarArchivoSync } from '../_actions'

interface Padron {
  id: string
  nombre: string
  slug: string
  tipo: string | null
}

interface SyncRecord {
  id: string
  padron_id: string
  archivo_origen: string
  estado: string
  total_filas_archivo: number
  altas_count: number
  bajas_count: number
  cambios_count: number
  sin_cambios_count: number
  rechazados_count: number
  fecha_sync: string
  created_at: string
  padrones: { nombre: string }[] | null
}

interface Props {
  syncs: SyncRecord[]
  padrones: Padron[]
}

export function SincronizarClient({ syncs, padrones }: Props) {
  const router = useRouter()
  const [padronId, setPadronId] = useState('')
  const [processing, setProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!padronId) {
      toast.error('Seleccioná un padrón primero')
      return
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Solo se aceptan archivos .xlsx, .xls o .csv')
      return
    }

    setProcessing(true)

    try {
      // Read file and parse with xlsx
      const arrayBuffer = await file.arrayBuffer()
      const XLSX = await import('xlsx')
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const filas = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

      // Calculate hash for idempotency
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      const result = await procesarArchivoSync(padronId, filas, file.name, hash)

      if (result.error) {
        toast.error(result.error)
        if (result.syncId) {
          router.push(`/admin/padrones/sincronizar/${result.syncId}`)
        }
      } else if (result.syncId) {
        toast.success(`Procesado: ${result.stats?.altas} altas, ${result.stats?.bajas} bajas, ${result.stats?.cambios} cambios`)
        router.push(`/admin/padrones/sincronizar/${result.syncId}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error procesando archivo')
    } finally {
      setProcessing(false)
    }
  }, [padronId, router])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function estadoBadge(estado: string) {
    switch (estado) {
      case 'preview': return <Badge variant="secondary">Preview</Badge>
      case 'procesando': return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Procesando</Badge>
      case 'revisado': return <Badge variant="outline">Revisado</Badge>
      case 'aplicado': return <Badge variant="default"><CheckCircle2 className="h-3 w-3 mr-1" />Aplicado</Badge>
      case 'rollback': return <Badge variant="destructive"><RotateCcw className="h-3 w-3 mr-1" />Rollback</Badge>
      case 'fallado': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fallado</Badge>
      default: return <Badge variant="outline">{estado}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Nueva sincronización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Padrón destino</label>
            <Select value={padronId} onValueChange={(v) => setPadronId(v ?? '')}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Seleccionar padrón..." />
              </SelectTrigger>
              <SelectContent>
                {padrones.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            } ${!padronId ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (padronId && !processing) {
                document.getElementById('file-input')?.click()
              }
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleInputChange}
            />
            {processing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Procesando archivo...</p>
                <p className="text-xs text-muted-foreground">Parseando filas, comparando contra DB, generando diffs</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Arrastrá el Excel acá o hacé click para seleccionar</p>
                <p className="text-xs text-muted-foreground">Formato esperado: Hindu padrón mensual (.xlsx)</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Historial de sincronizaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {syncs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              No hay sincronizaciones previas
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Padrón</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Altas</TableHead>
                  <TableHead className="text-center">Bajas</TableHead>
                  <TableHead className="text-center">Cambios</TableHead>
                  <TableHead className="text-center">Sin cambios</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-sm">{s.archivo_origen}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(s.padrones as unknown as { nombre: string }[])?.[0]?.nombre ?? '-'}
                    </TableCell>
                    <TableCell>{estadoBadge(s.estado)}</TableCell>
                    <TableCell className="text-center text-sm text-green-600 font-medium">
                      {s.altas_count > 0 ? `+${s.altas_count}` : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-red-600 font-medium">
                      {s.bajas_count > 0 ? `-${s.bajas_count}` : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-yellow-600 font-medium">
                      {s.cambios_count > 0 ? s.cambios_count : '-'}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {s.sin_cambios_count}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: es })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/padrones/sincronizar/${s.id}`)}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
