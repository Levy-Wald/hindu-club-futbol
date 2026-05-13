import type { EquipoEnFixture, PartidoEnFixture, FixturePreview, FixtureOptions } from './types'
import { generarFixtureEliminacion } from './eliminacion'

/**
 * Group stage (round-robin within groups) + playoff bracket.
 * Default: 4 teams per group. Top 2 per group advance to knockout.
 */
export function generarFixtureGruposPlayoff(
  equipos: EquipoEnFixture[],
  options: FixtureOptions = {}
): FixturePreview {
  const { equipos_por_grupo = 4, incluir_tercer_puesto = false } = options
  const warnings: string[] = []
  const n = equipos.length

  if (n < 6) {
    return { formato: 'grupos_playoff', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Se necesitan al menos 6 equipos'] }
  }

  if (equipos_por_grupo < 3) {
    return { formato: 'grupos_playoff', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Minimo 3 equipos por grupo'] }
  }

  const numGrupos = Math.ceil(n / equipos_por_grupo)
  if (numGrupos < 2) {
    return { formato: 'grupos_playoff', partidos: [], total_fechas: 0, total_partidos: 0, warnings: ['Se necesitan al menos 2 grupos'] }
  }

  // Distribute teams into groups (snake draft)
  const grupos: EquipoEnFixture[][] = Array.from({ length: numGrupos }, () => [])
  for (let i = 0; i < n; i++) {
    const groupIdx = i % numGrupos
    const team = { ...equipos[i], grupo: String.fromCharCode(65 + groupIdx) }
    grupos[groupIdx].push(team)
  }

  // Check for uneven groups
  const sizes = grupos.map((g) => g.length)
  if (new Set(sizes).size > 1) {
    warnings.push(`Grupos desiguales: ${sizes.join(', ')} equipos`)
  }

  const partidos: PartidoEnFixture[] = []
  let maxFechaGrupos = 0

  // Generate group stage (round-robin per group)
  for (let g = 0; g < numGrupos; g++) {
    const grupo = grupos[g]
    const groupLabel = String.fromCharCode(65 + g)
    const groupMatches = roundRobinGrupo(grupo, groupLabel)

    for (const m of groupMatches) {
      partidos.push(m)
      if (m.fecha_numero > maxFechaGrupos) maxFechaGrupos = m.fecha_numero
    }
  }

  // Generate playoff bracket with top 2 per group
  const clasificados: EquipoEnFixture[] = []
  for (const grupo of grupos) {
    // Take top 2 (first 2 in order — real ranking happens at runtime)
    clasificados.push(...grupo.slice(0, 2))
  }

  const playoff = generarFixtureEliminacion(clasificados, { incluir_tercer_puesto })

  // Offset playoff fechas after group stage
  for (const p of playoff.partidos) {
    partidos.push({
      ...p,
      fecha_numero: p.fecha_numero + maxFechaGrupos,
      fase: `playoff_${p.fase}`,
    })
  }

  if (playoff.warnings.length > 0) {
    warnings.push(...playoff.warnings.map((w) => `Playoff: ${w}`))
  }

  const total_fechas = maxFechaGrupos + playoff.total_fechas

  return {
    formato: 'grupos_playoff',
    partidos,
    total_fechas,
    total_partidos: partidos.length,
    warnings,
  }
}

function roundRobinGrupo(equipos: EquipoEnFixture[], groupLabel: string): PartidoEnFixture[] {
  const partidos: PartidoEnFixture[] = []
  const n = equipos.length

  // Simple round-robin for small groups
  let fecha = 1
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      partidos.push({
        local: equipos[i],
        visitante: equipos[j],
        fecha_numero: fecha,
        fase: `grupo_${groupLabel}`,
        orden: partidos.filter((p) => p.fecha_numero === fecha).length + 1,
      })
    }
    fecha++
  }

  // Compact: redistribute matches into minimum dates
  // Each team plays at most once per date
  return compactarFechas(partidos, `grupo_${groupLabel}`)
}

function compactarFechas(partidos: PartidoEnFixture[], fase: string): PartidoEnFixture[] {
  const result: PartidoEnFixture[] = []
  const remaining = [...partidos]
  let fecha = 1

  while (remaining.length > 0) {
    const usedTeams = new Set<string>()
    const dateMatches: PartidoEnFixture[] = []
    let orden = 1

    for (let i = remaining.length - 1; i >= 0; i--) {
      const m = remaining[i]
      if (!usedTeams.has(m.local.id) && !usedTeams.has(m.visitante.id)) {
        usedTeams.add(m.local.id)
        usedTeams.add(m.visitante.id)
        dateMatches.push({ ...m, fecha_numero: fecha, fase, orden })
        orden++
        remaining.splice(i, 1)
      }
    }

    result.push(...dateMatches)
    fecha++
  }

  return result
}
