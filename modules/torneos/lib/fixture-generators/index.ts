import type { FormatoTorneo } from '../types'
import type { EquipoEnFixture, FixtureOptions, FixturePreview } from './types'
import { generarFixtureLiga } from './liga'
import { generarFixtureEliminacion } from './eliminacion'
import { generarFixtureGruposPlayoff } from './grupos-playoff'
import { generarFixtureSuizo } from './suizo'
import { generarFixtureTriangular } from './triangular'
import { generarFixtureCuadrangular } from './cuadrangular'

export type { EquipoEnFixture, FixtureOptions, FixturePreview, PartidoEnFixture } from './types'

export function generarFixture(
  formato: FormatoTorneo,
  equipos: EquipoEnFixture[],
  options: FixtureOptions = {}
): FixturePreview {
  switch (formato) {
    case 'liga':
      return generarFixtureLiga(equipos, options)
    case 'eliminacion':
      return generarFixtureEliminacion(equipos, options)
    case 'grupos_playoff':
      return generarFixtureGruposPlayoff(equipos, options)
    case 'suizo':
      return generarFixtureSuizo(equipos, options)
    case 'triangular':
      return generarFixtureTriangular(equipos)
    case 'cuadrangular':
      return generarFixtureCuadrangular(equipos, options)
    default: {
      const _exhaustive: never = formato
      throw new Error(`Formato no soportado: ${_exhaustive}`)
    }
  }
}
