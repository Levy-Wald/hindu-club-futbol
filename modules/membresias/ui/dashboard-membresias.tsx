'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, UserMinus } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { ResumenMembresia } from '../lib/queries'

interface DashboardMembresiasProps {
  resumen: ResumenMembresia[]
  stats: {
    activas: number
    suspendidas: number
    canceladas: number
    total: number
    ingresoMensual: number
    altasUltimoMes: number
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const TIPO_LABELS: Record<string, string> = {
  membresia: 'Membresía',
  abono: 'Abono',
  clase_individual: 'Clase individual',
  cuota_consorcio: 'Cuota consorcio',
  otro: 'Otro',
}

export function DashboardMembresias({ resumen, stats }: DashboardMembresiasProps) {
  const chartData = resumen.map(r => ({
    nombre: `${TIPO_LABELS[r.tipo] ?? r.tipo}${r.disciplina_slug ? ` (${r.disciplina_slug})` : ''}`,
    activos: Number(r.activos),
    bajas: Number(r.dados_baja),
    suspendidos: Number(r.suspendidos),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Dashboard Membresías</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard icon={<Users className="h-4 w-4" />} label="Socios activos" value={stats.activas} />
        <SummaryCard icon={<DollarSign className="h-4 w-4" />} label="Ingreso mensual" value={`$${stats.ingresoMensual.toLocaleString('es-AR')}`} />
        <SummaryCard icon={<TrendingUp className="h-4 w-4" />} label="Altas (30d)" value={stats.altasUltimoMes} />
        <SummaryCard icon={<UserMinus className="h-4 w-4" />} label="Canceladas" value={stats.canceladas} />
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="activos" name="Activos" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {resumen.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumen.map((r, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">{TIPO_LABELS[r.tipo] ?? r.tipo}</p>
                  {r.disciplina_slug && <p className="text-xs text-muted-foreground capitalize">{r.disciplina_slug}</p>}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-lg font-bold text-green-600">{r.activos}</p>
                      <p className="text-muted-foreground">Activos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-amber-600">{r.suspendidos}</p>
                      <p className="text-muted-foreground">Suspend.</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-red-600">{r.dados_baja}</p>
                      <p className="text-muted-foreground">Bajas</p>
                    </div>
                  </div>
                  {Number(r.ingreso_mensual_estimado) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Ingreso est.: ${Number(r.ingreso_mensual_estimado).toLocaleString('es-AR')}/mes
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{icon}{label}</div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
