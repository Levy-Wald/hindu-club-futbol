import type { EquipoEnFixture, PartidoEnFixture, FixturePreview, FixtureOptions } from './types'

/**
 * Cuadrangular: exactly 4 teams.
 * Default: 6 matches (all vs all). Optional: +semifinal/final bracket.
 */
export function generarFixtureCuadrangular(
  equipos: EquipoEnFixture[],
  options: FixtureOptions = {}
): FixturePreview {
  const { incluir_tercer_puesto = false } = options
  const warnings: string[] = []

  if (equipos.length !== 4) {
    return { formato: 'cuadrangular', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Un cuadrangular requiere exactamente 4 equipos'] }
  }

  const [a, b, c, d] = equipos

  // 6 matches in 3 dates (2 matches per date, each team plays once per date)
  const partidos: PartidoEnFixture[] = [
    // Fecha 1
    { local: a, visitante: b, fecha_numero: 1, fase: 'regular', orden: 1 },
    { local: c, visitante: d, fecha_numero: 1, fase: 'regular', orden: 2 },
    // Fecha 2
    { local: a, visitante: c, fecha_numero: 2, fase: 'regular', orden: 1 },
    { local: b, visitante: d, fecha_numero: 2, fase: 'regular', orden: 2 },
    // Fecha 3
    { local: a, visitante: d, fecha_numero: 3, fase: 'regular', orden: 1 },
    { local: b, visitante: c, fecha_numero: 3, fase: 'regular', orden: 2 },
  ]

  let total_fechas = 3

  if (incluir_tercer_puesto) {
    // Semis: 1 vs 4, 2 vs 3
    partidos.push(
      { local: a, visitante: d, fecha_numero: 4, fase: 'semifinal', orden: 1 },
      { local: b, visitante: c, fecha_numero: 4, fase: 'semifinal', orden: 2 },
    )
    // Tercer puesto + final
    partidos.push(
      { local: d, visitante: c, fecha_numero: 5, fase: 'tercer_puesto', orden: 1 },
      { local: a, visitante: b, fecha_numero: 5, fase: 'final', orden: 2 },
    )
    total_fechas = 5
    warnings.push('Semifinales y final agregadas al cuadrangular')
  }

  return {
    formato: 'cuadrangular',
    partidos,
    total_fechas,
    total_partidos: partidos.length,
    warnings,
  }
}
