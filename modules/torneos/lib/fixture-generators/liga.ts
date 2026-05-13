import type { EquipoEnFixture, PartidoEnFixture, FixturePreview, FixtureOptions } from './types'

/**
 * Round-robin (circle algorithm).
 * If ida_y_vuelta=true, generates double round-robin.
 */
export function generarFixtureLiga(
  equipos: EquipoEnFixture[],
  options: FixtureOptions = {}
): FixturePreview {
  const { ida_y_vuelta = false } = options
  const warnings: string[] = []
  const n = equipos.length

  if (n < 3) {
    return { formato: 'liga', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Se necesitan al menos 3 equipos'] }
  }

  // Circle algorithm: fix first team, rotate the rest
  const teams = [...equipos]
  const useBye = n % 2 !== 0
  if (useBye) {
    teams.push({ id: '__bye__', nombre: 'BYE' })
    warnings.push('Cantidad impar de equipos: una fecha libre por equipo')
  }

  const totalTeams = teams.length
  const rounds = totalTeams - 1
  const matchesPerRound = totalTeams / 2

  const partidos: PartidoEnFixture[] = []

  // Generate ida
  const rotatable = teams.slice(1)
  for (let round = 0; round < rounds; round++) {
    const current = [teams[0], ...rotatable]
    let orden = 1

    for (let match = 0; match < matchesPerRound; match++) {
      const home = current[match]
      const away = current[totalTeams - 1 - match]

      if (home.id === '__bye__' || away.id === '__bye__') continue

      partidos.push({
        local: home,
        visitante: away,
        fecha_numero: round + 1,
        fase: 'ida',
        orden,
      })
      orden++
    }

    // Rotate: move last element to second position
    rotatable.unshift(rotatable.pop()!)
  }

  // Generate vuelta (same matchups, swapped home/away)
  if (ida_y_vuelta) {
    for (const p of [...partidos]) {
      partidos.push({
        local: p.visitante,
        visitante: p.local,
        fecha_numero: p.fecha_numero + rounds,
        fase: 'vuelta',
        orden: p.orden,
      })
    }
  }

  const total_fechas = ida_y_vuelta ? rounds * 2 : rounds

  return {
    formato: 'liga',
    partidos,
    total_fechas,
    total_partidos: partidos.length,
    warnings,
  }
}
