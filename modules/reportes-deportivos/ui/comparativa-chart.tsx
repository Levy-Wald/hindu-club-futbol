'use client'

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ComparativaEquipo } from '../lib/queries'

interface ComparativaChartProps {
  data: ComparativaEquipo[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function ComparativaChart({ data }: ComparativaChartProps) {
  const chartData = data.map(d => ({
    nombre: d.equipo_nombre,
    asistencia: Number(d.asistencia_promedio_30d).toFixed(0),
    lesionados: Number(d.lesionados_activos),
    convocados: Number(d.convocados_activos),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comparativa de equipos — Asistencia promedio (30 días)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Asistencia']}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <Bar dataKey="asistencia" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
