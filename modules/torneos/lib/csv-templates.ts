export const CSV_FIXTURE_HEADERS = [
  'fecha',
  'hora',
  'equipo_local',
  'equipo_visitante',
  'cancha',
  'jornada',
  'categoria',
] as const

export const CSV_RESULTADOS_HEADERS = [
  ...CSV_FIXTURE_HEADERS,
  'marcador_local',
  'marcador_visitante',
] as const

export type CSVFixtureRow = {
  fecha: string
  hora: string
  equipo_local: string
  equipo_visitante: string
  cancha?: string
  jornada?: string
  categoria?: string
}

export type CSVResultadoRow = CSVFixtureRow & {
  marcador_local: number
  marcador_visitante: number
}

export function generarPlantillaFixture(): string {
  return CSV_FIXTURE_HEADERS.join(',') + '\n' +
    '2026-03-15,10:00,Hindu Sub-15,Rival FC,Cancha 1,1,Sub-15\n' +
    '2026-03-15,12:00,Hindu Sub-13,Club Otro,Cancha 2,1,Sub-13'
}

export function generarPlantillaResultados(): string {
  return CSV_RESULTADOS_HEADERS.join(',') + '\n' +
    '2026-03-15,10:00,Hindu Sub-15,Rival FC,Cancha 1,1,Sub-15,3,1\n' +
    '2026-03-15,12:00,Hindu Sub-13,Club Otro,Cancha 2,1,Sub-13,2,2'
}
