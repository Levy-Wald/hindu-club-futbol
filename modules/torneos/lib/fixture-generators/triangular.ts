import type { EquipoEnFixture, PartidoEnFixture, FixturePreview } from './types'

/**
 * Triangular: exactly 3 teams, 3 matches. All play all in a single day or consecutive dates.
 */
export function generarFixtureTriangular(
  equipos: EquipoEnFixture[]
): FixturePreview {
  const warnings: string[] = []

  if (equipos.length !== 3) {
    return { formato: 'triangular', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Un triangular requiere exactamente 3 equipos'] }
  }

  const [a, b, c] = equipos

  const partidos: PartidoEnFixture[] = [
    { local: a, visitante: b, fecha_numero: 1, fase: 'regular', orden: 1 },
    { local: b, visitante: c, fecha_numero: 2, fase: 'regular', orden: 1 },
    { local: c, visitante: a, fecha_numero: 3, fase: 'regular', orden: 1 },
  ]

  return {
    formato: 'triangular',
    partidos,
    total_fechas: 3,
    total_partidos: 3,
    warnings,
  }
}
