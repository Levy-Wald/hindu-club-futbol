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
import { BarChart3, FileSpreadsheet, FileText, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { exportarReportePDF, exportarReporteXLSX, type ReporteExportable } from '@/modules/finanzas/lib/export-reportes'
import { TENANT_ID } from '@/lib/tenant'


interface CuentaBalance {
  cuenta_id: string
  codigo: string
  nombre: string
  tipo: string
  cuenta_padre_id: string | null
  nivel: number
  naturaleza: string
  total_debe: number
  total_haber: number
  saldo: number
}

interface GrupoBalance {
  tipo: string
  label: string
  cuentas: CuentaBalance[]
  total: number
}

const tipoLabels: Record<string, string> = {
  activo: 'ACTIVO',
  pasivo: 'PASIVO',
  patrimonio_neto: 'PATRIMONIO NETO',
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function BalanceClient() {
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0])
  const [showCeroSaldo, setShowCeroSaldo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [grupos, setGrupos] = useState<GrupoBalance[]>([])
  const [verificacion, setVerificacion] = useState<{ balancea: boolean; diferencia: number } | null>(null)

  const buscar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const hoy = new Date().toISOString().split('T')[0]
    const esHoy = fechaCierre === hoy

    let cuentasData: CuentaBalance[]

    if (esHoy) {
      // Use the view directly (already aggregated)
      const { data } = await supabase
        .from('v_balance_cuentas')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .in('tipo', ['activo', 'pasivo', 'patrimonio_neto'])

      cuentasData = (data ?? []).map(c => ({
        cuenta_id: c.cuenta_id,
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        cuenta_padre_id: c.cuenta_padre_id,
        nivel: c.nivel,
        naturaleza: c.naturaleza,
        total_debe: Number(c.total_debe),
        total_haber: Number(c.total_haber),
        saldo: Number(c.saldo),
      }))
    } else {
      // Recalculate saldos up to fechaCierre
      const { data: cuentas } = await supabase
        .from('plan_cuentas')
        .select('id, codigo, nombre, tipo, cuenta_padre_id, nivel')
        .eq('tenant_id', TENANT_ID)
        .eq('activa', true)
        .in('tipo', ['activo', 'pasivo', 'patrimonio_neto'])
        .order('codigo')

      const { data: movs } = await supabase
        .from('movimientos_caja')
        .select('cuenta_debe_id, cuenta_haber_id, monto_neto')
        .eq('tenant_id', TENANT_ID)
        .eq('anulado', false)
        .lte('fecha', fechaCierre)

      const debeMap = new Map<string, number>()
      const haberMap = new Map<string, number>()

      for (const m of movs ?? []) {
        if (m.cuenta_debe_id) {
          debeMap.set(m.cuenta_debe_id, (debeMap.get(m.cuenta_debe_id) ?? 0) + Number(m.monto_neto))
        }
        if (m.cuenta_haber_id) {
          haberMap.set(m.cuenta_haber_id, (haberMap.get(m.cuenta_haber_id) ?? 0) + Number(m.monto_neto))
        }
      }

      cuentasData = (cuentas ?? []).map(c => {
        const td = debeMap.get(c.id) ?? 0
        const th = haberMap.get(c.id) ?? 0
        const nat = ['activo'].includes(c.tipo) ? 'deudora' : 'acreedora'
        return {
          cuenta_id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          tipo: c.tipo,
          cuenta_padre_id: c.cuenta_padre_id,
          nivel: c.nivel,
          naturaleza: nat,
          total_debe: td,
          total_haber: th,
          saldo: td - th,
        }
      })
    }

    // Group by tipo
    const tipoOrder = ['activo', 'pasivo', 'patrimonio_neto']
    const grouped: GrupoBalance[] = tipoOrder.map(tipo => {
      const cuentasTipo = cuentasData.filter(c => c.tipo === tipo)
      // For presentation: activo uses saldo as-is (deudora nature), pasivo/patrimonio invert
      const signo = tipo === 'activo' ? 1 : -1
      const filtered = showCeroSaldo ? cuentasTipo : cuentasTipo.filter(c => Math.abs(c.saldo) >= 0.01)
      return {
        tipo,
        label: tipoLabels[tipo] ?? tipo.toUpperCase(),
        cuentas: filtered.sort((a, b) => a.codigo.localeCompare(b.codigo)),
        total: cuentasTipo.reduce((acc, c) => acc + c.saldo * signo, 0),
      }
    })

    setGrupos(grouped)

    const totalActivo = grouped.find(g => g.tipo === 'activo')?.total ?? 0
    const totalPasivo = grouped.find(g => g.tipo === 'pasivo')?.total ?? 0
    const totalPN = grouped.find(g => g.tipo === 'patrimonio_neto')?.total ?? 0
    const diff = totalActivo - (totalPasivo + totalPN)
    setVerificacion({ balancea: Math.abs(diff) <= 1, diferencia: diff })

    setLoading(false)
  }, [fechaCierre, showCeroSaldo])

  function buildExportable(): ReporteExportable {
    const filas: Record<string, unknown>[] = []
    for (const g of grupos) {
      filas.push({ codigo: '', nombre: g.label, saldo_display: '' })
      for (const c of g.cuentas) {
        const signo = g.tipo === 'activo' ? 1 : -1
        filas.push({
          codigo: c.codigo,
          nombre: c.nombre,
          saldo_display: c.saldo * signo,
        })
      }
      filas.push({ codigo: '', nombre: `TOTAL ${g.label}`, saldo_display: g.total })
      filas.push({ codigo: '', nombre: '', saldo_display: '' })
    }

    return {
      titulo: 'Balance General',
      tenantNombre: 'Hindu Club',
      filtros: { 'Al cierre de': formatFecha(fechaCierre) },
      columnas: [
        { key: 'codigo', label: 'Codigo' },
        { key: 'nombre', label: 'Cuenta' },
        { key: 'saldo_display', label: 'Saldo', align: 'right', format: (v) => v ? formatMoney(v as number) : '' },
      ],
      filas,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold">Balance General</h1>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>Al cierre de fecha</Label>
              <Input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="cero" checked={showCeroSaldo} onCheckedChange={setShowCeroSaldo} />
              <Label htmlFor="cero">Cuentas con saldo 0</Label>
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
                    <TableHead className="text-right w-[150px]">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {g.cuentas.map((c) => {
                    const signo = g.tipo === 'activo' ? 1 : -1
                    const saldoPresentacion = c.saldo * signo
                    return (
                      <TableRow key={c.cuenta_id}>
                        <TableCell className="font-mono text-sm text-muted-foreground">{c.codigo}</TableCell>
                        <TableCell className={cn(c.nivel === 1 && 'font-bold', c.nivel === 2 && 'font-semibold pl-6', c.nivel >= 3 && 'pl-10')}>
                          {c.nombre}
                        </TableCell>
                        <TableCell className={cn('text-right font-mono', saldoPresentacion < 0 && 'text-error-600')}>
                          {formatMoney(saldoPresentacion)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell />
                    <TableCell>TOTAL {g.label}</TableCell>
                    <TableCell className="text-right font-mono">{formatMoney(g.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {verificacion && (
        <Card className={verificacion.balancea ? 'border-success-500' : 'border-error-500'}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              {verificacion.balancea ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success-600" />
                  <span className="font-semibold text-success-600">VERIFICACION: ACTIVO = PASIVO + PATRIMONIO NETO</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-error-600" />
                  <div>
                    <span className="font-semibold text-error-600">ACTIVO ≠ PASIVO + PATRIMONIO NETO</span>
                    <p className="text-sm text-error-600 mt-1">Diferencia: {formatMoney(verificacion.diferencia)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Esto puede deberse a movimientos sin asiento contable completo (falta cuenta_debe o cuenta_haber).
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
