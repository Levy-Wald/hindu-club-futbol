import type { EquipoEnFixture, PartidoEnFixture, FixturePreview, FixtureOptions } from './types'

/**
 * Single-elimination bracket.
 * Supports power-of-2 counts (4,8,16,32,64). Non-power-of-2 gets byes in round 1.
 */
export function generarFixtureEliminacion(
  equipos: EquipoEnFixture[],
  options: FixtureOptions = {}
): FixturePreview {
  const { incluir_tercer_puesto = false } = options
  const warnings: string[] = []
  const n = equipos.length

  if (n < 4) {
    return { formato: 'eliminacion', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Se necesitan al menos 4 equipos'] }
  }

  // Find next power of 2
  const bracketSize = nextPowerOf2(n)
  const numByes = bracketSize - n
  if (numByes > 0) {
    warnings.push(`${numByes} equipo(s) pasan directo a la segunda ronda (bye)`)
  }

  const totalRounds = Math.log2(bracketSize)
  const partidos: PartidoEnFixture[] = []

  // Seed teams into bracket positions
  const bracket: (EquipoEnFixture | null)[] = new Array(bracketSize).fill(null)
  // Standard seeding: 1 vs last, 2 vs second-to-last, etc.
  const seeded = seedBracket(equipos, bracketSize)
  for (let i = 0; i < seeded.length; i++) {
    bracket[i] = seeded[i]
  }

  // Generate rounds
  let currentRound = bracket
  let fechaNumero = 1

  for (let round = 0; round < totalRounds; round++) {
    const nextRound: (EquipoEnFixture | null)[] = []
    const faseName = getFaseEliminacion(totalRounds - round, totalRounds)
    let orden = 1

    for (let i = 0; i < currentRound.length; i += 2) {
      const a = currentRound[i]
      const b = currentRound[i + 1]

      if (a && b) {
        partidos.push({
          local: a,
          visitante: b,
          fecha_numero: fechaNumero,
          fase: faseName,
          orden,
        })
        // Winner is TBD — use local as placeholder for next round
        nextRound.push(a)
        orden++
      } else if (a) {
        // Bye: a advances
        nextRound.push(a)
      } else if (b) {
        nextRound.push(b)
      } else {
        nextRound.push(null)
      }
    }

    currentRound = nextRound
    fechaNumero++
  }

  if (incluir_tercer_puesto) {
    // Add 3rd place match at same fecha as final
    const semis = partidos.filter((p) => p.fase === 'semifinal')
    if (semis.length === 2) {
      partidos.push({
        local: semis[0].visitante, // loser placeholder
        visitante: semis[1].visitante,
        fecha_numero: fechaNumero - 1,
        fase: 'tercer_puesto',
        orden: 0, // before final
      })
      warnings.push('Partido por el tercer puesto agregado')
    }
  }

  return {
    formato: 'eliminacion',
    partidos,
    total_fechas: fechaNumero - 1,
    total_partidos: partidos.length,
    warnings,
  }
}

function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function seedBracket(equipos: EquipoEnFixture[], size: number): (EquipoEnFixture | null)[] {
  const result: (EquipoEnFixture | null)[] = new Array(size).fill(null)
  // Simple seeding: place teams in order, byes at the end
  for (let i = 0; i < equipos.length; i++) {
    result[i] = equipos[i]
  }
  return result
}

function getFaseEliminacion(roundsRemaining: number, totalRounds: number): string {
  if (roundsRemaining === 1) return 'final'
  if (roundsRemaining === 2) return 'semifinal'
  if (roundsRemaining === 3) return 'cuartos'
  if (roundsRemaining === 4) return 'octavos'
  // For larger brackets
  return `ronda_${totalRounds - roundsRemaining + 1}`
}
