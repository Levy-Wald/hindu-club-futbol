'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { BookOpen, FileSpreadsheet, FileText, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { exportarReportePDF, exportarReporteXLSX, type ReporteExportable } from '@/modules/finanzas/lib/export-reportes'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface Cuenta {
  id: string
  codigo: string
  nombre: string
  tipo: string
}

interface Persona {
  id: string
  nombre: string
  apellido: string
}

interface MovimientoLM {
  movimiento_id: string
  fecha: string
  tipo: string
  numero: number | null
  descripcion: string | null
  comprobante_numero: string | null
  cuenta_debe_id: string | null
  cuenta_debe_codigo: string | null
  cuenta_haber_id: string | null
  cuenta_haber_codigo: string | null
  monto_neto: number
  persona_id: string | null
  anulado: boolean
  saldo_running?: number
}

function formatMoney(v: number | null): string {
  if (v == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDefaultDesde() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function getDefaultHasta() {
  return new Date().toISOString().split('T')[0]
}

export function LibroMayorClient({ cuentas, personas }: { cuentas: Cuenta[]; personas: Persona[] }) {
  const [cuentaId, setCuentaId] = useState('')
  const [desde, setDesde] = useState(getDefaultDesde)
  const [hasta, setHasta] = useState(getDefaultHasta)
  const [showAnulados, setShowAnulados] = useState(false)
  const [loading, setLoading] = useState(false)
  const [movimientos, setMovimientos] = useState<MovimientoLM[]>([])
  const [resumen, setResumen] = useState<{ saldoInicial: number; totalDebe: number; totalHaber: number; saldoFinal: number } | null>(null)

  const personaMap = new Map(personas.map(p => [p.id, `${p.apellido}, ${p.nombre}`]))
  const cuentaSeleccionada = cuentas.find(c => c.id === cuentaId)

  const buscar = useCallback(async () => {
    if (!cuentaId) return
    setLoading(true)
    const supabase = createClient()

    // Get saldo inicial (movimientos antes del rango)
    const { data: prevData } = await supabase
      .from('v_libro_mayor')
      .select('cuenta_debe_id, cuenta_haber_id, monto_neto')
      .eq('tenant_id', TENANT_ID)
      .or(`cuenta_debe_id.eq.${cuentaId},cuenta_haber_id.eq.${cuentaId}`)
      .lt('fecha', desde)
      .eq('anulado', false)

    let saldoInicial = 0
    for (const row of prevData ?? []) {
      if (row.cuenta_debe_id === cuentaId) saldoInicial += Number(row.monto_neto)
      if (row.cuenta_haber_id === cuentaId) saldoInicial -= Number(row.monto_neto)
    }

    // Get movimientos del rango
    let query = supabase
      .from('v_libro_mayor')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .or(`cuenta_debe_id.eq.${cuentaId},cuenta_haber_id.eq.${cuentaId}`)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })
      .order('created_at', { ascending: true })

    if (!showAnulados) {
      query = query.eq('anulado', false)
    }

    const { data } = await query

    let totalDebe = 0
    let totalHaber = 0
    let runSaldo = saldoInicial

    const rows: MovimientoLM[] = (data ?? []).map((m) => {
      const debe = m.cuenta_debe_id === cuentaId ? Number(m.monto_neto) : 0
      const haber = m.cuenta_haber_id === cuentaId ? Number(m.monto_neto) : 0
      totalDebe += debe
      totalHaber += haber
      runSaldo += debe - haber

      return {
        ...m,
        monto_neto: Number(m.monto_neto),
        saldo_running: runSaldo,
      } as MovimientoLM
    })

    setMovimientos(rows)
    setResumen({ saldoInicial, totalDebe, totalHaber, saldoFinal: saldoInicial + totalDebe - totalHaber })
    setLoading(false)
  }, [cuentaId, desde, hasta, showAnulados])

  function buildExportable(): ReporteExportable {
    return {
      titulo: 'Libro Mayor',
      tenantNombre: 'Hindu Club',
      filtros: {
        'Cuenta': cuentaSeleccionada ? `${cuentaSeleccionada.codigo} ${cuentaSeleccionada.nombre}` : '',
        'Periodo': `${formatFecha(desde)} al ${formatFecha(hasta)}`,
        'Incluye anulados': showAnulados ? 'Si' : 'No',
      },
      columnas: [
        { key: 'fecha', label: 'Fecha', format: (v) => formatFecha(v as string) },
        { key: 'numero', label: 'Comp. #' },
        { key: 'tipo', label: 'Tipo' },
        { key: 'descripcion', label: 'Descripcion' },
        { key: 'persona_display', label: 'Persona' },
        { key: 'debe', label: 'Debe', align: 'right', format: (v) => v ? formatMoney(v as number) : '' },
        { key: 'haber', label: 'Haber', align: 'right', format: (v) => v ? formatMoney(v as number) : '' },
        { key: 'saldo_running', label: 'Saldo', align: 'right', format: (v) => formatMoney(v as number) },
      ],
      filas: movimientos.map(m => ({
        ...m,
        persona_display: m.persona_id ? (personaMap.get(m.persona_id) ?? '') : '',
        debe: m.cuenta_debe_id === cuentaId ? m.monto_neto : null,
        haber: m.cuenta_haber_id === cuentaId ? m.monto_neto : null,
      })),
      totales: resumen ? { debe: resumen.totalDebe, haber: resumen.totalHaber, saldo_running: resumen.saldoFinal } : undefined,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold">Libro Mayor</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Cuenta</Label>
              <Select value={cuentaId} onValueChange={(v) => setCuentaId(v ?? '')}>
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Switch id="anulados" checked={showAnulados} onCheckedChange={setShowAnulados} />
              <Label htmlFor="anulados">Mostrar anulados</Label>
            </div>
            <Button onClick={buscar} disabled={!cuentaId || loading}>
              <Search className="h-4 w-4 mr-1" />
              {loading ? 'Cargando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Saldo inicial</p>
              <p className="text-lg font-bold font-mono">{formatMoney(resumen.saldoInicial)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Total debe</p>
              <p className="text-lg font-bold font-mono text-error-600">{formatMoney(resumen.totalDebe)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Total haber</p>
              <p className="text-lg font-bold font-mono text-success-600">{formatMoney(resumen.totalHaber)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Saldo final</p>
              <p className="text-lg font-bold font-mono">{formatMoney(resumen.saldoFinal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Saldo del periodo</p>
              <p className={`text-lg font-bold font-mono ${resumen.saldoFinal - resumen.saldoInicial >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {formatMoney(resumen.saldoFinal - resumen.saldoInicial)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export buttons */}
      {movimientos.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportarReportePDF(buildExportable())}>
            <FileText className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportarReporteXLSX(buildExportable())}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
        </div>
      )}

      {/* Tabla */}
      {movimientos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {movimientos.length} movimientos — {cuentaSeleccionada?.codigo} {cuentaSeleccionada?.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Comp. #</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead>Persona</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((m) => {
                    const esDebe = m.cuenta_debe_id === cuentaId
                    const esHaber = m.cuenta_haber_id === cuentaId
                    return (
                      <TableRow key={m.movimiento_id} className={m.anulado ? 'opacity-50 line-through' : ''}>
                        <TableCell>{formatFecha(m.fecha)}</TableCell>
                        <TableCell className="font-mono text-xs">{m.numero ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={
                            m.tipo === 'ingreso' ? 'bg-success-100 text-success-800' :
                            m.tipo === 'egreso' ? 'bg-error-100 text-error-800' :
                            'bg-info-100 text-info-800'
                          }>
                            {m.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{m.descripcion ?? '-'}</TableCell>
                        <TableCell className="text-xs">{m.persona_id ? (personaMap.get(m.persona_id) ?? '') : ''}</TableCell>
                        <TableCell className="text-right font-mono text-error-600">
                          {esDebe ? formatMoney(m.monto_neto) : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono text-success-600">
                          {esHaber ? formatMoney(m.monto_neto) : ''}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatMoney(m.saldo_running ?? 0)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && movimientos.length === 0 && cuentaId && resumen && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay movimientos en este periodo para la cuenta seleccionada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
