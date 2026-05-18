'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { exportToPDF, exportToXLSX } from '@/lib/export/formats'
import type { StatsEquipo, PerformanceJugador } from '../lib/queries'

interface ExportButtonsProps {
  stats: StatsEquipo[]
  jugadores: PerformanceJugador[]
}

export function ExportButtons({ stats, jugadores }: ExportButtonsProps) {
  function exportEquiposPDF() {
    exportToPDF({
      filename: 'reporte_deportivo_equipos.pdf',
      headers: ['Equipo', 'Disciplina', 'Convocados', 'Lesionados', 'Asist. 30d', 'Torneos'],
      rows: stats.map(s => [
        s.equipo_nombre,
        s.disciplina_slug,
        String(s.convocados_activos),
        String(s.lesionados_activos),
        `${Number(s.asistencia_promedio_30d).toFixed(0)}%`,
        String(s.torneos_inscriptos_activos),
      ]),
    })
  }

  function exportEquiposXLSX() {
    exportToXLSX({
      filename: 'reporte_deportivo_equipos.xlsx',
      headers: ['Equipo', 'Disciplina', 'Convocados', 'Lesionados', 'Asist. 30d (%)', 'Torneos'],
      rows: stats.map(s => [
        s.equipo_nombre,
        s.disciplina_slug,
        String(s.convocados_activos),
        String(s.lesionados_activos),
        Number(s.asistencia_promedio_30d).toFixed(1),
        String(s.torneos_inscriptos_activos),
      ]),
    })
  }

  function exportJugadoresPDF() {
    const conEquipo = jugadores.filter(j => j.equipo_id)
    exportToPDF({
      filename: 'reporte_deportivo_jugadores.pdf',
      headers: ['Jugador', 'Equipo', 'Partidos 90d', 'Asist. entren. (%)', 'Estado'],
      rows: conEquipo.map(j => [
        `${j.apellido}, ${j.nombre}`,
        j.equipo_nombre ?? '—',
        String(j.partidos_90d),
        `${Number(j.asistencia_entrenamientos_pct_90d).toFixed(0)}%`,
        j.lesionado_activo ? 'Lesionado' : 'Activo',
      ]),
    })
  }

  function exportJugadoresXLSX() {
    const conEquipo = jugadores.filter(j => j.equipo_id)
    exportToXLSX({
      filename: 'reporte_deportivo_jugadores.xlsx',
      headers: ['Jugador', 'Equipo', 'Partidos 90d', 'Asist. entren. (%)', 'Estado'],
      rows: conEquipo.map(j => [
        `${j.apellido}, ${j.nombre}`,
        j.equipo_nombre ?? '—',
        String(j.partidos_90d),
        Number(j.asistencia_entrenamientos_pct_90d).toFixed(1),
        j.lesionado_activo ? 'Lesionado' : 'Activo',
      ]),
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="h-4 w-4 mr-1" />
        Exportar
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportEquiposPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Equipos PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportEquiposXLSX}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Equipos XLSX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJugadoresPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Jugadores PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJugadoresXLSX}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Jugadores XLSX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
