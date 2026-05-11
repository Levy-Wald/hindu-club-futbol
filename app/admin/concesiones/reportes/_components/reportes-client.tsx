'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { TrendingUp, DollarSign, ShoppingCart, Store } from 'lucide-react'
import { reporteVentasMensuales } from '../../_actions'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  concesionarios: any[]
}

export function ReportesClient({ concesionarios }: Props) {
  const activos = concesionarios.filter((c: any) => c.activo)
  const [selectedId, setSelectedId] = useState(activos[0]?.id ?? '')
  const [reporte, setReporte] = useState<any[]>([])

  useEffect(() => {
    if (!selectedId) return
    reporteVentasMensuales(selectedId).then(setReporte)
  }, [selectedId])

  const totalVentas = activos.reduce((sum: number, c: any) => sum + Number(c.ventas_mes_actual ?? 0), 0)
  const totalBruto = activos.reduce((sum: number, c: any) => sum + Number(c.total_ventas_mes_actual ?? 0), 0)
  const totalCanon = activos.reduce((sum: number, c: any) => sum + Number(c.canon_acumulado_mes_actual ?? 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reportes de Concesiones</h1>

      {/* Global stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{activos.length}</p>
                <p className="text-xs text-muted-foreground">Concesionarios activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{totalVentas}</p>
                <p className="text-xs text-muted-foreground">Ventas este mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">${totalBruto.toLocaleString('es-AR')}</p>
                <p className="text-xs text-muted-foreground">Total bruto mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">${totalCanon.toLocaleString('es-AR')}</p>
                <p className="text-xs text-muted-foreground">Canon acum. mes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      {activos.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ranking por ventas del mes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activos
                .sort((a: any, b: any) => Number(b.total_ventas_mes_actual) - Number(a.total_ventas_mes_actual))
                .map((c: any, i: number) => (
                  <div key={c.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6 text-right">{i + 1}.</span>
                      <span className="font-medium">{c.nombre_comercial}</span>
                    </div>
                    <div className="flex gap-6 text-right">
                      <span>{c.ventas_mes_actual} ventas</span>
                      <span className="font-medium">${Number(c.total_ventas_mes_actual).toLocaleString('es-AR')}</span>
                      <span className="text-primary font-semibold">${Number(c.canon_acumulado_mes_actual).toLocaleString('es-AR')} canon</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-concesionario monthly detail */}
      {activos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Detalle mensual</CardTitle>
              <div className="w-64">
                <Select value={selectedId} onValueChange={v => setSelectedId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar concesionario" /></SelectTrigger>
                  <SelectContent>
                    {activos.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nombre_comercial}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {reporte.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos para este concesionario.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Período</th>
                      <th className="py-2 pr-4 text-right">Ventas</th>
                      <th className="py-2 pr-4 text-right">Total bruto</th>
                      <th className="py-2 pr-4 text-right">Canon</th>
                      <th className="py-2 text-right">Ticket prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.map((r: any) => (
                      <tr key={r.periodo} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{r.periodo}</td>
                        <td className="py-2 pr-4 text-right">{r.cantidad_ventas}</td>
                        <td className="py-2 pr-4 text-right">${Number(r.total_bruto).toLocaleString('es-AR')}</td>
                        <td className="py-2 pr-4 text-right font-semibold text-primary">${Number(r.total_canon).toLocaleString('es-AR')}</td>
                        <td className="py-2 text-right">${Number(r.ticket_promedio).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
