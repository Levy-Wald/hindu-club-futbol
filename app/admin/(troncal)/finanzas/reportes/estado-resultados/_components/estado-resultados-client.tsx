'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { TrendingUp, FileSpreadsheet, FileText, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { exportarReportePDF, exportarReporteXLSX, type ReporteExportable } from '@/modules/finanzas/lib/export-reportes'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface CuentaResultado {
  cuenta_id: string
  codigo: string
  nombre: string
  tipo: string
  nivel: number
  saldo: number
  saldo_anterior?: number
}

interface GrupoResultado {
  tipo: string
  label: string
  cuentas: CuentaResultado[]
  total: number
  totalAnterior?: number
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDefaultDesde() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function getDefaultHasta() {
  return new Date().toISOString().split('T')[0]
}

async function calcSaldosPorRango(desde: string, hasta: string) {
  const supabase = createClient()

  const { data: cuentas } = await supabase
    .from('plan_cuentas')
    .select('id, codigo, nombre, tipo, nivel')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .in('tipo', ['ingreso', 'egreso'])
    .order('codigo')

  const { data: movs } = await supabase
    .from('movimientos_caja')
    .select('cuenta_debe_id, cuenta_haber_id, monto_neto')
    .eq('tenant_id', TENANT_ID)
    .eq('anulado', false)
    .gte('fecha', desde)
    .lte('fecha', hasta)

  const debeMap = new Map<string, number>()
  const haberMap = new Map<string, number>()

  for (const m of movs ?? []) {
    if (m.cuenta_debe_id) debeMap.set(m.cuenta_debe_id, (debeMap.get(m.cuenta_debe_id) ?? 0) + Number(m.monto_neto))
    if (m.cuenta_haber_id) haberMap.set(m.cuenta_haber_id, (haberMap.get(m.cuenta_haber_id) ?? 0) + Number(m.monto_neto))
  }

  return (cuentas ?? []).map(c => ({
    cuenta_id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    tipo: c.tipo,
    nivel: c.nivel,
    // For ingresos: saldo = haber - debe (acreedora nature)
    // For egresos: saldo = debe - haber (deudora nature)
    saldo: c.tipo === 'ingreso'
      ? (haberMap.get(c.id) ?? 0) - (debeMap.get(c.id) ?? 0)
      : (debeMap.get(c.id) ?? 0) - (haberMap.get(c.id) ?? 0),
  }))
}

export function EstadoResultadosClient() {
  const [desde, setDesde] = useState(getDefaultDesde)
  const [hasta, setHasta] = useState(getDefaultHasta)
  const [comparar, setComparar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [grupos, setGrupos] = useState<GrupoResultado[]>([])
  const [resultado, setResultado] = useState<number>(0)
  const [resultadoAnterior, setResultadoAnterior] = useState<number | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)

    const cuentasActual = await calcSaldosPorRango(desde, hasta)

    let cuentasAnterior: CuentaResultado[] = []
    if (comparar) {
      // Calculate equivalent previous period
      const d1 = new Date(desde + 'T12:00:00')
      const d2 = new Date(hasta + 'T12:00:00')
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (86400000)) + 1
      const prevHasta = new Date(d1.getTime() - 86400000).toISOString().split('T')[0]
      const prevDesde = new Date(d1.getTime() - diffDays * 86400000).toISOString().split('T')[0]
      cuentasAnterior = await calcSaldosPorRango(prevDesde, prevHasta)
    }

    const anteriorMap = new Map(cuentasAnterior.map(c => [c.cuenta_id, c.saldo]))

    const ingresoCuentas = cuentasActual.filter(c => c.tipo === 'ingreso').map(c => ({
      ...c,
      saldo_anterior: anteriorMap.get(c.cuenta_id),
    }))
    const egresoCuentas = cuentasActual.filter(c => c.tipo === 'egreso').map(c => ({
      ...c,
      saldo_anterior: anteriorMap.get(c.cuenta_id),
    }))

    const totalIngresos = ingresoCuentas.reduce((acc, c) => acc + c.saldo, 0)
    const totalEgresos = egresoCuentas.reduce((acc, c) => acc + c.saldo, 0)
    const totalIngresosAnt = comparar ? ingresoCuentas.reduce((acc, c) => acc + (c.saldo_anterior ?? 0), 0) : undefined
    const totalEgresosAnt = comparar ? egresoCuentas.reduce((acc, c) => acc + (c.saldo_anterior ?? 0), 0) : undefined

    setGrupos([
      {
        tipo: 'ingreso',
        label: 'INGRESOS',
        cuentas: ingresoCuentas.filter(c => Math.abs(c.saldo) >= 0.01 || (c.saldo_anterior && Math.abs(c.saldo_anterior) >= 0.01)),
        total: totalIngresos,
        totalAnterior: totalIngresosAnt,
      },
      {
        tipo: 'egreso',
        label: 'EGRESOS',
        cuentas: egresoCuentas.filter(c => Math.abs(c.saldo) >= 0.01 || (c.saldo_anterior && Math.abs(c.saldo_anterior) >= 0.01)),
        total: totalEgresos,
        totalAnterior: totalEgresosAnt,
      },
    ])

    setResultado(totalIngresos - totalEgresos)
    setResultadoAnterior(comparar && totalIngresosAnt != null && totalEgresosAnt != null ? totalIngresosAnt - totalEgresosAnt : null)
    setLoading(false)
  }, [desde, hasta, comparar])

  function buildExportable(): ReporteExportable {
    const filas: Record<string, unknown>[] = []
    for (const g of grupos) {
      filas.push({ codigo: '', nombre: g.label, saldo: '' })
      for (const c of g.cuentas) {
        filas.push({ codigo: c.codigo, nombre: c.nombre, saldo: c.saldo })
      }
      filas.push({ codigo: '', nombre: `TOTAL ${g.label}`, saldo: g.total })
      filas.push({ codigo: '', nombre: '', saldo: '' })
    }
    filas.push({ codigo: '', nombre: resultado >= 0 ? 'UTILIDAD DEL PERIODO' : 'PERDIDA DEL PERIODO', saldo: resultado })

    return {
      titulo: 'Estado de Resultados',
      tenantNombre: 'Hindu Club',
      filtros: { 'Periodo': `${formatFecha(desde)} al ${formatFecha(hasta)}` },
      columnas: [
        { key: 'codigo', label: 'Codigo' },
        { key: 'nombre', label: 'Cuenta' },
        { key: 'saldo', label: 'Monto', align: 'right', format: (v) => v ? formatMoney(v as number) : '' },
      ],
      filas,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold">Estado de Resultados</h1>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="comparar" checked={comparar} onCheckedChange={setComparar} />
              <Label htmlFor="comparar">Comparar con periodo anterior</Label>
            </div>
            <Button onClick={buscar} disabled={loading}>
              <Search className="h-4 w-4 mr-1" />
              {loading ? 'Cargando...' : 'Generar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {grupos.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportarReportePDF(buildExportable())}>
            <FileText className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportarReporteXLSX(buildExportable())}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
        </div>
      )}

      {grupos.map((g) => (
        <Card key={g.tipo}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">{g.label}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Codigo</TableHead>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="text-right w-[150px]">Monto</TableHead>
                    {comparar && <TableHead className="text-right w-[150px]">Anterior</TableHead>}
                    {comparar && <TableHead className="text-right w-[100px]">Var %</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.cuentas.map((c) => {
                    const variacion = comparar && c.saldo_anterior && c.saldo_anterior !== 0
                      ? ((c.saldo - c.saldo_anterior) / Math.abs(c.saldo_anterior)) * 100
                      : null
                    return (
                      <TableRow key={c.cuenta_id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">{c.codigo}</TableCell>
                        <TableCell className={cn(c.nivel === 1 && 'font-bold', c.nivel === 2 && 'font-semibold pl-6', c.nivel >= 3 && 'pl-10')}>
                          {c.nombre}
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatMoney(c.saldo)}</TableCell>
                        {comparar && (
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {c.saldo_anterior != null ? formatMoney(c.saldo_anterior) : '-'}
                          </TableCell>
                        )}
                        {comparar && (
                          <TableCell className={cn('text-right font-mono text-xs', variacion && variacion > 0 ? 'text-success-600' : variacion && variacion < 0 ? 'text-error-600' : '')}>
                            {variacion != null ? `${variacion > 0 ? '+' : ''}${variacion.toFixed(1)}%` : '-'}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell />
                    <TableCell>TOTAL {g.label}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(g.total)}</TableCell>
                    {comparar && <TableCell className="text-right font-mono text-muted-foreground">{g.totalAnterior != null ? formatMoney(g.totalAnterior) : '-'}</TableCell>}
                    {comparar && <TableCell />}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {grupos.length > 0 && (
        <Card className={resultado >= 0 ? 'border-success-500' : 'border-error-500'}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">RESULTADO DEL PERIODO</p>
                <p className={cn('text-2xl font-bold font-mono', resultado >= 0 ? 'text-success-600' : 'text-error-600')}>
                  {formatMoney(resultado)}
                </p>
                <p className="text-sm text-muted-foreground">{resultado >= 0 ? 'Utilidad' : 'Perdida'}</p>
              </div>
              {resultadoAnterior != null && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Periodo anterior</p>
                  <p className="text-lg font-mono text-muted-foreground">{formatMoney(resultadoAnterior)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
