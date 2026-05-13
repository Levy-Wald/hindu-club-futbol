import { describe, it, expect } from 'vitest'
import { generarFixture } from '../../modules/torneos/lib/fixture-generators'
import { generarFixtureLiga } from '../../modules/torneos/lib/fixture-generators/liga'
import { generarFixtureEliminacion } from '../../modules/torneos/lib/fixture-generators/eliminacion'
import { generarFixtureGruposPlayoff } from '../../modules/torneos/lib/fixture-generators/grupos-playoff'
import { generarFixtureSuizo } from '../../modules/torneos/lib/fixture-generators/suizo'
import { generarFixtureTriangular } from '../../modules/torneos/lib/fixture-generators/triangular'
import { generarFixtureCuadrangular } from '../../modules/torneos/lib/fixture-generators/cuadrangular'
import type { EquipoEnFixture } from '../../modules/torneos/lib/fixture-generators/types'

function makeEquipos(n: number): EquipoEnFixture[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `equipo-${i + 1}`,
    nombre: `Equipo ${i + 1}`,
  }))
}

describe('Liga (round-robin)', () => {
  it('genera N*(N-1)/2 partidos para N equipos (solo ida)', () => {
    const equipos = makeEquipos(6)
    const result = generarFixtureLiga(equipos)
    expect(result.total_partidos).toBe(15) // 6*5/2
    expect(result.total_fechas).toBe(5) // N-1 for even
  })

  it('genera ida y vuelta con doble de partidos', () => {
    const equipos = makeEquipos(4)
    const result = generarFixtureLiga(equipos, { ida_y_vuelta: true })
    expect(result.total_partidos).toBe(12) // 4*3/2 * 2
    expect(result.total_fechas).toBe(6) // (N-1) * 2
  })

  it('maneja cantidad impar con bye', () => {
    const equipos = makeEquipos(5)
    const result = generarFixtureLiga(equipos)
    expect(result.total_partidos).toBe(10) // 5*4/2
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('impar')
  })

  it('rechaza menos de 3 equipos', () => {
    const equipos = makeEquipos(2)
    const result = generarFixtureLiga(equipos)
    expect(result.total_partidos).toBe(0)
    expect(result.warnings).toHaveLength(1)
  })

  it('cada equipo juega exactamente N-1 partidos', () => {
    const equipos = makeEquipos(6)
    const result = generarFixtureLiga(equipos)
    const counts: Record<string, number> = {}
    for (const p of result.partidos) {
      counts[p.local.id] = (counts[p.local.id] ?? 0) + 1
      counts[p.visitante.id] = (counts[p.visitante.id] ?? 0) + 1
    }
    for (const eq of equipos) {
      expect(counts[eq.id]).toBe(5)
    }
  })
})

describe('Eliminacion directa', () => {
  it('genera bracket para 8 equipos: 7 partidos', () => {
    const equipos = makeEquipos(8)
    const result = generarFixtureEliminacion(equipos)
    expect(result.total_partidos).toBe(7) // 8-1
    expect(result.partidos.filter((p) => p.fase === 'final')).toHaveLength(1)
    expect(result.partidos.filter((p) => p.fase === 'semifinal')).toHaveLength(2)
    expect(result.partidos.filter((p) => p.fase === 'cuartos')).toHaveLength(4)
  })

  it('genera byes para 6 equipos (no potencia de 2)', () => {
    const equipos = makeEquipos(6)
    const result = generarFixtureEliminacion(equipos)
    // bracket size = 8, 2 byes
    expect(result.warnings.some((w) => w.includes('bye'))).toBe(true)
    // Less than 7 matches because 2 teams skip first round
    expect(result.total_partidos).toBe(5) // 6-1
  })

  it('agrega tercer puesto cuando se pide', () => {
    const equipos = makeEquipos(4)
    const result = generarFixtureEliminacion(equipos, { incluir_tercer_puesto: true })
    expect(result.partidos.filter((p) => p.fase === 'tercer_puesto')).toHaveLength(1)
  })

  it('rechaza menos de 4 equipos', () => {
    const result = generarFixtureEliminacion(makeEquipos(3))
    expect(result.total_partidos).toBe(0)
  })
})

describe('Grupos + Playoff', () => {
  it('genera fase de grupos + bracket para 8 equipos', () => {
    const equipos = makeEquipos(8)
    const result = generarFixtureGruposPlayoff(equipos, { equipos_por_grupo: 4 })
    // 2 groups of 4, 6 group matches per group = 12 group matches
    const grupoPartidos = result.partidos.filter((p) => p.fase.startsWith('grupo_'))
    expect(grupoPartidos.length).toBe(12)
    // Top 2 per group = 4 teams in playoff, 3 playoff matches
    const playoffPartidos = result.partidos.filter((p) => p.fase.startsWith('playoff_'))
    expect(playoffPartidos.length).toBe(3)
  })

  it('rechaza menos de 6 equipos', () => {
    const result = generarFixtureGruposPlayoff(makeEquipos(5))
    expect(result.total_partidos).toBe(0)
  })
})

describe('Suizo', () => {
  it('genera solo primera ronda', () => {
    const equipos = makeEquipos(8)
    const result = generarFixtureSuizo(equipos)
    expect(result.total_fechas).toBe(1)
    expect(result.total_partidos).toBe(4) // 8/2
    expect(result.warnings.some((w) => w.includes('ronda 1'))).toBe(true)
  })

  it('maneja cantidad impar', () => {
    const equipos = makeEquipos(7)
    const result = generarFixtureSuizo(equipos)
    expect(result.total_partidos).toBe(3) // floor(7/2)
    expect(result.warnings.some((w) => w.includes('impar'))).toBe(true)
  })
})

describe('Triangular', () => {
  it('genera 3 partidos para 3 equipos', () => {
    const equipos = makeEquipos(3)
    const result = generarFixtureTriangular(equipos)
    expect(result.total_partidos).toBe(3)
    expect(result.total_fechas).toBe(3)
  })

  it('rechaza != 3 equipos', () => {
    expect(generarFixtureTriangular(makeEquipos(2)).total_partidos).toBe(0)
    expect(generarFixtureTriangular(makeEquipos(4)).total_partidos).toBe(0)
  })
})

describe('Cuadrangular', () => {
  it('genera 6 partidos para 4 equipos (regular)', () => {
    const equipos = makeEquipos(4)
    const result = generarFixtureCuadrangular(equipos)
    expect(result.total_partidos).toBe(6)
    expect(result.total_fechas).toBe(3)
  })

  it('genera 10 partidos con tercer puesto (semis + final)', () => {
    const equipos = makeEquipos(4)
    const result = generarFixtureCuadrangular(equipos, { incluir_tercer_puesto: true })
    expect(result.total_partidos).toBe(10)
    expect(result.total_fechas).toBe(5)
    expect(result.partidos.filter((p) => p.fase === 'final')).toHaveLength(1)
  })

  it('rechaza != 4 equipos', () => {
    expect(generarFixtureCuadrangular(makeEquipos(3)).total_partidos).toBe(0)
  })
})

describe('Dispatcher (generarFixture)', () => {
  it('despacha liga correctamente', () => {
    const result = generarFixture('liga', makeEquipos(4))
    expect(result.formato).toBe('liga')
    expect(result.total_partidos).toBe(6)
  })

  it('despacha triangular correctamente', () => {
    const result = generarFixture('triangular', makeEquipos(3))
    expect(result.formato).toBe('triangular')
    expect(result.total_partidos).toBe(3)
  })

  it('despacha eliminacion correctamente', () => {
    const result = generarFixture('eliminacion', makeEquipos(8))
    expect(result.formato).toBe('eliminacion')
    expect(result.total_partidos).toBe(7)
  })
})
