'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ArrowLeftRight, FileSpreadsheet, FileText, Search, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { exportarReportePDF, exportarReporteXLSX, type ReporteExportable } from '@/modules/finanzas/lib/export-reportes'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

interface CajaResumen {
  cajaId: string
  cajaNombre: string
  cajaTipo: string
  saldoSistema: number
  saldoBanco: number | null
  diferencia: number | null
  sinConciliarSistema: number
  sinMatchBanco: number
}

function formatMoney(v: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

export function ConciliacionReporteClient() {
  const [loading, setLoading] = useState(false)
  const [resumen, setResumen] = useState<CajaResumen[]>([])

  const generar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Get all bancarias cajas
    const { data: cajas } = await supabase
      .from('cajas')
      .select('id, nombre, tipo, saldo_actual')
      .eq('tenant_id', TENANT_ID)
      .eq('activa', true)
      .is('deleted_at', null)
      .in('tipo', ['banco', 'mercadopago', 'digital'])
      .order('nombre')

    const results: CajaResumen[] = []

    for (const caja of cajas ?? []) {
      // Ultimo saldo banco
      const { data: ultimoSaldo } = await supabase
        .from('conciliacion_movimientos_bancarios')
        .select('saldo_banco')
        .eq('tenant_id', TENANT_ID)
        .eq('caja_id', caja.id)
        .not('saldo_banco', 'is', null)
        .is('deleted_at', null)
        .order('fecha_operacion', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count: sinConciliarSistema } = await supabase
        .from('movimientos_caja')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID)
        .eq('caja_id', caja.id)
        .eq('anulado', false)
        .is('conciliado_at', null)

      const { count: sinMatchBanco } = await supabase
        .from('conciliacion_movimientos_bancarios')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID)
        .eq('caja_id', caja.id)
        .eq('estado', 'pendiente')
        .is('deleted_at', null)

      const saldoBanco = ultimoSaldo ? Number(ultimoSaldo.saldo_banco) : null

      results.push({
        cajaId: caja.id,
        cajaNombre: caja.nombre,
        cajaTipo: caja.tipo,
        saldoSistema: Number(caja.saldo_actual),
        saldoBanco,
        diferencia: saldoBanco != null ? Number(caja.saldo_actual) - saldoBanco : null,
        sinConciliarSistema: sinConciliarSistema ?? 0,
        sinMatchBanco: sinMatchBanco ?? 0,
      })
    }

    setResumen(results)
    setLoading(false)
  }, [])

  function buildExportable(): ReporteExportable {
    return {
      titulo: 'Conciliacion Bancaria',
      tenantNombre: 'Hindu Club',
      filtros: {},
      columnas: [
        { key: 'cajaNombre', label: 'Caja' },
        { key: 'cajaTipo', label: 'Tipo' },
        { key: 'saldoSistema', label: 'Saldo sistema', align: 'right', format: (v) => formatMoney(v as number) },
        { key: 'saldoBanco', label: 'Saldo banco', align: 'right', format: (v) => v != null ? formatMoney(v as number) : 'Sin datos' },
        { key: 'diferencia', label: 'Diferencia', align: 'right', format: (v) => v != null ? formatMoney(v as number) : '-' },
        { key: 'sinConciliarSistema', label: 'Sin conciliar (sist.)', align: 'right' },
        { key: 'sinMatchBanco', label: 'Sin match (banco)', align: 'right' },
      ],
      filas: resumen as unknown as Record<string, unknown>[],
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold">Reporte de Conciliacion</h1>
        </div>
        <Button onClick={generar} disabled={loading}>
          <Search className="h-4 w-4 mr-1" />
          {loading ? 'Generando...' : 'Generar'}
        </Button>
      </div>

      {resumen.length > 0 && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportarReportePDF(buildExportable())}>
            <FileText className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportarReporteXLSX(buildExportable())}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
        </div>
      )}

      {resumen.map(r => (
        <Card key={r.cajaId} className={r.diferencia != null && Math.abs(r.diferencia) > 1 ? 'border-error-300' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {r.diferencia != null && Math.abs(r.diferencia) <= 1
                ? <CheckCircle2 className="h-4 w-4 text-success-600" />
                : <AlertTriangle className="h-4 w-4 text-error-600" />}
              {r.cajaNombre}
              <span className="text-xs text-muted-foreground font-normal">({r.cajaTipo})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Saldo sistema</p>
                <p className="font-mono font-medium">{formatMoney(r.saldoSistema)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo banco</p>
                <p className="font-mono font-medium">{r.saldoBanco != null ? formatMoney(r.saldoBanco) : 'Sin datos'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Diferencia</p>
                <p className={cn('font-mono font-medium', r.diferencia && Math.abs(r.diferencia) > 1 ? 'text-error-600' : 'text-success-600')}>
                  {r.diferencia != null ? formatMoney(r.diferencia) : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sistema sin conciliar</p>
                <p className="font-medium">{r.sinConciliarSistema}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Banco sin match</p>
                <p className="font-medium">{r.sinMatchBanco}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {resumen.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Click "Generar" para ver el estado de conciliacion de todas las cajas bancarias</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
