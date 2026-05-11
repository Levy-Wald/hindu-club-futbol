import type { SegmentoConfig } from './tipos'

export function descripcionSegmento(config: SegmentoConfig): string {
  switch (config.tipo) {
    case 'todos_activos':
      return 'Todos los socios activos'
    case 'equipo':
      return 'Equipo específico'
    case 'personas_ids_directos':
      return `${config.persona_ids.length} personas seleccionadas`
    default:
      return 'Segmento desconocido'
  }
}
