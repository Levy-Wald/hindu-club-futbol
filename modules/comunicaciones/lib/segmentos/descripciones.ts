import type { SegmentoConfig } from './tipos'

export function descripcionSegmento(config: SegmentoConfig): string {
  switch (config.tipo) {
    case 'todos_activos':
      return 'Todos los socios activos'
    case 'equipo':
      return 'Equipo específico'
    default:
      return 'Segmento desconocido'
  }
}
