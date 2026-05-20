'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Receipt, FileSpreadsheet, FileText, Search, DollarSign, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { exportarReportePDF, exportarReporteXLSX, type ReporteExportable } from '@/modules/finanzas/lib/export-reportes'
import Link from 'next/link'
import { TENANT_ID } from '@/lib/tenant'


interface CobranzaRow {
  cuota_emitida_id: string
  persona_id: string
  persona_nombre: string
  numero_documento: string | null
  plan_nombre: string | null
  periodo: string
  fecha_vencimiento: string
  monto_emitido: number
  monto_pagado: number
  saldo_pendiente: number
  estado_cobranza: string
  dias_atraso: number
}

const ESTADOS_CHIPS = ['pagada', 'pendiente', 'vencida', 'anulada'] as const

const estadoBadgeClass: Record<string, string> = {
  pagada: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400',
  pendiente: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400',
  vencida: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400',
  anulada: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface CobranzasClientProps {
  planes: { id: string; nombre: string }[]
  periodos: string[]
}

export function CobranzasClient({ planes, periodos }: CobranzasClientProps) {
  const [estadosFiltro, setEstadosFiltro] = useState<Set<string>>(new Set(['pendiente', 'vencida']))
  const [periodoFiltro, setPeriodoFiltro] = useState('')
  const [planFiltro, setPlanFiltro] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CobranzaRow[]>([])
  const [resumen, setResumen] = useState<{
    totalEmitido: number
    totalCobrado: number
    totalPendiente: number
    totalVencido: number
    diasPromedioAtraso: number
  } | null>(null)

  const toggleEstado = (estado: string) => {
    setEstadosFiltro(prev => {
      const next = new Set(prev)
      if (next.has(estado)) next.delete(estado)
      else next.add(estado)
      return next
    })
  }

  const buscar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('v_estado_cobranzas')
      .select('*')
      .eq('tenant_id', TENANT_ID)
      .order('fecha_vencimiento', { ascending: false })

    if (periodoFiltro) query = query.eq('periodo', periodoFiltro)
    if (planFiltro) query = query.eq('plan_id', planFiltro)

    const { data } = await query

    let filteredData = (data ?? []).map(d => ({
      cuota_emitida_id: d.cuota_emitida_id,
      persona_id: d.persona_id,
      persona_nombre: d.persona_nombre?.trim() ?? '',
      numero_documento: d.numero_documento,
      plan_nombre: d.plan_nombre,
      periodo: d.periodo,
      fecha_vencimiento: d.fecha_vencimiento,
      monto_emitido: Number(d.monto_emitido),
      monto_pagado: Number(d.monto_pagado),
      saldo_pendiente: Number(d.saldo_pendiente),
      estado_cobranza: d.estado_cobranza,
      dias_atraso: Number(d.dias_atraso),
    }))

    // Filter by estados
    if (estadosFiltro.size > 0) {
      filteredData = filteredData.filter(d => estadosFiltro.has(d.estado_cobranza))
    }

    setRows(filteredData)

    // Resumen over ALL data (not just filtered)
    const allData = (data ?? [])
    const totalEmitido = allData.reduce((a, d) => a + Number(d.monto_emitido), 0)
    const totalCobrado = allData.reduce((a, d) => a + Number(d.monto_pagado), 0)
    const vencidas = allData.filter(d => d.estado_cobranza === 'vencida')
    const totalVencido = vencidas.reduce((a, d) => a + Number(d.saldo_pendiente), 0)
    const totalPendiente = allData.filter(d => d.estado_cobranza === 'pendiente' || d.estado_cobranza === 'vencida').reduce((a, d) => a + Number(d.saldo_pendiente), 0)
    const diasPromedioAtraso = vencidas.length > 0 ? Math.round(vencidas.reduce((a, d) => a + Number(d.dias_atraso), 0) / vencidas.length) : 0

    setResumen({ totalEmitido, totalCobrado, totalPendiente, totalVencido, diasPromedioAtraso })
    setLoading(false)
  }, [estadosFiltro, periodoFiltro, planFiltro])

  function buildExportable(): ReporteExportable {
    return {
      titulo: 'Reporte de Cobranzas',
      tenantNombre: 'Hindu Club',
      filtros: {
        'Estados': [...estadosFiltro].join(', ') || 'Todos',
        ...(periodoFiltro ? { 'Periodo': periodoFiltro } : {}),
      },
      columnas: [
        { key: 'persona_nombre', label: 'Persona' },
        { key: 'numero_documento', label: 'DNI' },
        { key: 'plan_nombre', label: 'Plan' },
        { key: 'periodo', label: 'Periodo' },
        { key: 'fecha_vencimiento', label: 'Vencimiento', format: (v) => formatFecha(v as string) },
        { key: 'monto_emitido', label: 'Emitido', align: 'right', format: (v) => formatMoney(v as number) },
        { key: 'monto_pagado', label: 'Pagado', align: 'right', format: (v) => formatMoney(v as number) },
        { key: 'saldo_pendiente', label: 'Saldo', align: 'right', format: (v) => formatMoney(v as number) },
        { key: 'estado_cobranza', label: 'Estado' },
        { key: 'dias_atraso', label: 'Dias atraso', align: 'right' },
      ],
      filas: rows as unknown as Record<string, unknown>[],
      totales: resumen ? { monto_emitido: resumen.totalEmitido, monto_pagado: resumen.totalCobrado, saldo_pendiente: resumen.totalPendiente } : undefined,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold">Reporte de Cobranzas</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label className="mb-2 block">Estado</Label>
            <div className="flex flex-wrap gap-2">
              {ESTADOS_CHIPS.map(estado => (
                <button
                  key={estado}
                  onClick={() => toggleEstado(estado)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    estadosFiltro.has(estado)
                      ? estadoBadgeClass[estado]
                      : 'bg-transparent text-muted-foreground border-border'
                  )}
                >
                  {estado.charAt(0).toUpperCase() + estado.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Periodo</Label>
              <Select value={periodoFiltro} onValueChange={(v) => setPeriodoFiltro(v ?? '')}>
                <option value="">Todos</option>
                {periodos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan de cuotas</Label>
              <Select value={planFiltro} onValueChange={(v) => setPlanFiltro(v ?? '')}>
                <option value="">Todos</option>
                {planes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={buscar} disabled={loading} className="w-full sm:w-auto">
                <Search className="h-4 w-4 mr-1" />
                {loading ? 'Cargando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Total emitido</span>
              </div>
              <p className="text-lg font-bold font-mono">{formatMoney(resumen.totalEmitido)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs">Total cobrado</span>
              </div>
              <p className="text-lg font-bold font-mono text-success-600">{formatMoney(resumen.totalCobrado)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Total pendiente</span>
              </div>
              <p className="text-lg font-bold font-mono">{formatMoney(resumen.totalPendiente)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Total vencido</span>
              </div>
              <p className="text-lg font-bold font-mono text-error-600">{formatMoney(resumen.totalVencido)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Dias prom. atraso</span>
              </div>
              <p className="text-lg font-bold">{resumen.diasPromedioAtraso} dias</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export */}
      {rows.length > 0 && (
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
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{rows.length} cuotas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead className="text-right">Emitido</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Dias</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.cuota_emitida_id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{r.persona_nombre}</p>
                          {r.numero_documento && <p className="text-xs text-muted-foreground">{r.numero_documento}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.plan_nombre ?? '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{r.periodo}</TableCell>
                      <TableCell className="text-sm">{formatFecha(r.fecha_vencimiento)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(r.monto_emitido)}</TableCell>
                      <TableCell className="text-right font-mono text-success-600">{formatMoney(r.monto_pagado)}</TableCell>
                      <TableCell className="text-right font-mono">{formatMoney(r.saldo_pendiente)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={estadoBadgeClass[r.estado_cobranza] ?? ''}>
                          {r.estado_cobranza}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {r.estado_cobranza === 'vencida' ? r.dias_atraso : '-'}
                      </TableCell>
                      <TableCell>
                        {(r.estado_cobranza === 'pendiente' || r.estado_cobranza === 'vencida') && (
                          <Link
                            href={`/admin/finanzas/cuenta-corriente?persona_id=${r.persona_id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Ver CC
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && rows.length === 0 && resumen && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay cuotas con los filtros seleccionados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
