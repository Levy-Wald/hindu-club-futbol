import type { EquipoEnFixture, PartidoEnFixture, FixturePreview, FixtureOptions } from './types'

/**
 * Swiss system — generates first round with random pairing.
 * Subsequent rounds are generated dynamically based on results (not pre-generated).
 */
export function generarFixtureSuizo(
  equipos: EquipoEnFixture[],
  options: FixtureOptions = {}
): FixturePreview {
  const { num_rondas } = options
  const warnings: string[] = []
  const n = equipos.length

  if (n < 6) {
    return { formato: 'suizo', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Se necesitan al menos 6 equipos'] }
  }

  const totalRondas = num_rondas ?? Math.ceil(Math.log2(n))
  warnings.push(`Sistema suizo: solo se genera la ronda 1. Las siguientes ${totalRondas - 1} rondas se generan segun resultados.`)

  const useBye = n % 2 !== 0
  if (useBye) {
    warnings.push('Cantidad impar: un equipo descansa por ronda')
  }

  // Shuffle for random first-round pairing
  const shuffled = [...equipos]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const partidos: PartidoEnFixture[] = []
  const matchesInRound = Math.floor(shuffled.length / 2)

  for (let i = 0; i < matchesInRound; i++) {
    partidos.push({
      local: shuffled[i * 2],
      visitante: shuffled[i * 2 + 1],
      fecha_numero: 1,
      fase: 'ronda_1',
      orden: i + 1,
    })
  }

  return {
    formato: 'suizo',
    partidos,
    total_fechas: 1, // Only first round pre-generated
    total_partidos: partidos.length,
    warnings,
  }
}
