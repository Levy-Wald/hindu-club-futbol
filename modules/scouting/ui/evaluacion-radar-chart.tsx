'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DIMENSIONES } from '../lib/tipos'
import type { Evaluacion } from '../lib/tipos'

interface EvaluacionRadarChartProps {
  evaluaciones: Evaluacion[]
}

const SLUG_TO_COL: Record<string, keyof Evaluacion> = {
  'control_balon': 'control_balon',
  'pase': 'pase',
  'definicion': 'definicion',
  '1vs1': 'uno_vs_uno',
  'velocidad': 'velocidad',
  'resistencia': 'resistencia',
  'fuerza': 'fuerza',
  'mentalidad': 'mentalidad',
  'competitividad': 'competitividad',
  'vision_juego': 'vision_juego',
  'posicionamiento': 'posicionamiento',
}

export function EvaluacionRadarChart({ evaluaciones }: EvaluacionRadarChartProps) {
  if (evaluaciones.length === 0) return null

  const data = DIMENSIONES.map(d => {
    const col = SLUG_TO_COL[d.slug]
    const values = evaluaciones
      .map(e => e[col] as number | null)
      .filter((v): v is number => v != null)
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0

    return {
      dimension: d.nombre,
      promedio: Math.round(avg * 10) / 10,
      fullMark: 10,
    }
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Radar de habilidades</CardTitle>
        <p className="text-xs text-muted-foreground">
          Promedio de {evaluaciones.length} evaluación{evaluaciones.length > 1 ? 'es' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 10 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 10]}
                tick={{ fontSize: 9 }}
              />
              <Radar
                name="Promedio"
                dataKey="promedio"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
              <Tooltip
                formatter={(value) => [Number(value).toFixed(1), 'Promedio']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
