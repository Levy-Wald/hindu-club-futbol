'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity } from 'lucide-react'
import type { PerformanceJugador } from '../lib/queries'

interface JugadorPerformanceListProps {
  jugadores: PerformanceJugador[]
}

export function JugadorPerformanceList({ jugadores }: JugadorPerformanceListProps) {
  // Only show jugadores that have equipo
  const conEquipo = jugadores.filter(j => j.equipo_id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top jugadores — Asistencia a entrenamientos (90 días)</CardTitle>
      </CardHeader>
      <CardContent>
        {conEquipo.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sin datos de performance disponibles.</p>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="hidden sm:table-cell">Equipo</TableHead>
                  <TableHead className="text-right">Partidos 90d</TableHead>
                  <TableHead className="text-right">Asist. entren.</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conEquipo.slice(0, 50).map(j => {
                  const pct = Number(j.asistencia_entrenamientos_pct_90d)
                  return (
                    <TableRow key={`${j.persona_id}-${j.equipo_id}`}>
                      <TableCell className="font-medium">{j.apellido}, {j.nombre}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{j.equipo_nombre}</TableCell>
                      <TableCell className="text-right">{j.partidos_90d}</TableCell>
                      <TableCell className="text-right">
                        <span className={pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}>
                          {pct > 0 ? `${pct.toFixed(0)}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {j.lesionado_activo ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <Activity className="h-3 w-3 mr-0.5" />
                            Lesionado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Activo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
