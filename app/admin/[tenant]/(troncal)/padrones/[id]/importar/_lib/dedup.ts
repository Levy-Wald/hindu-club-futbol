import type { FieldKey, DedupResult, FieldConflict, ImportRow } from './types'
import { FIELD_OPTIONS } from './types'

/**
 * Normalize a string for fuzzy comparison.
 */
function normalize(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\s+/g, ' ')
}

/**
 * Normalize DNI: remove dots, dashes, spaces.
 */
function normalizeDni(dni: string | null | undefined): string {
  if (!dni) return ''
  return dni.replace(/[\.\-\s]/g, '').trim()
}

/**
 * Compare two names for fuzzy matching.
 * Returns a score between 0 and 1.
 */
function nameMatchScore(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1

  // Check containment
  if (na.includes(nb) || nb.includes(na)) return 0.8

  // Simple word overlap
  const wordsA = na.split(' ')
  const wordsB = nb.split(' ')
  const commonWords = wordsA.filter((w) => wordsB.includes(w))
  const totalWords = Math.max(wordsA.length, wordsB.length)
  return commonWords.length / totalWords
}

interface ExistingPersona {
  id: string
  nombre: string
  apellido: string
  numero_documento: string | null
  email_principal: string | null
  telefono_principal: string | null
  fecha_nacimiento: string | null
  genero: string | null
  direccion_calle: string | null
  direccion_ciudad: string | null
  direccion_provincia: string | null
  cuil_cuit: string | null
}

/**
 * Find matches for a single import row against existing personas.
 */
export function findMatch(
  rowData: Partial<Record<FieldKey, string>>,
  existingPersonas: ExistingPersona[]
): DedupResult {
  const rowDni = normalizeDni(rowData.numero_documento)
  const rowNombre = normalize(rowData.nombre)
  const rowApellido = normalize(rowData.apellido)

  // 1. Exact DNI match
  if (rowDni) {
    const dniMatch = existingPersonas.find(
      (p) => normalizeDni(p.numero_documento) === rowDni
    )
    if (dniMatch) {
      return {
        rowIndex: 0,
        status: 'match_exacto',
        matchedPersonaId: dniMatch.id,
        matchedPersona: {
          id: dniMatch.id,
          nombre: dniMatch.nombre,
          apellido: dniMatch.apellido,
          numero_documento: dniMatch.numero_documento,
          email_principal: dniMatch.email_principal,
          telefono_principal: dniMatch.telefono_principal,
        },
        conflicts: buildConflicts(rowData, dniMatch),
      }
    }
  }

  // 2. Name-based fuzzy match
  if (rowNombre || rowApellido) {
    let bestMatch: ExistingPersona | null = null
    let bestScore = 0

    for (const persona of existingPersonas) {
      const nombreScore = nameMatchScore(rowData.nombre ?? '', persona.nombre)
      const apellidoScore = nameMatchScore(rowData.apellido ?? '', persona.apellido)
      const combinedScore = (nombreScore + apellidoScore) / 2

      if (combinedScore > bestScore && combinedScore >= 0.7) {
        bestScore = combinedScore
        bestMatch = persona
      }
    }

    if (bestMatch) {
      return {
        rowIndex: 0,
        status: 'match_posible',
        matchedPersonaId: bestMatch.id,
        matchedPersona: {
          id: bestMatch.id,
          nombre: bestMatch.nombre,
          apellido: bestMatch.apellido,
          numero_documento: bestMatch.numero_documento,
          email_principal: bestMatch.email_principal,
          telefono_principal: bestMatch.telefono_principal,
        },
        conflicts: buildConflicts(rowData, bestMatch),
      }
    }
  }

  // 3. No match — new persona
  return {
    rowIndex: 0,
    status: 'nueva',
    matchedPersonaId: null,
    matchedPersona: null,
    conflicts: [],
  }
}

/**
 * Build field-by-field conflicts between import data and existing persona.
 */
function buildConflicts(
  rowData: Partial<Record<FieldKey, string>>,
  existing: ExistingPersona
): FieldConflict[] {
  const conflicts: FieldConflict[] = []

  const comparisons: { field: FieldKey; existingValue: string | null }[] = [
    { field: 'nombre', existingValue: existing.nombre },
    { field: 'apellido', existingValue: existing.apellido },
    { field: 'numero_documento', existingValue: existing.numero_documento },
    { field: 'email_principal', existingValue: existing.email_principal },
    { field: 'telefono_principal', existingValue: existing.telefono_principal },
    { field: 'fecha_nacimiento', existingValue: existing.fecha_nacimiento },
    { field: 'genero', existingValue: existing.genero },
    { field: 'direccion_calle', existingValue: existing.direccion_calle },
    { field: 'direccion_ciudad', existingValue: existing.direccion_ciudad },
    { field: 'direccion_provincia', existingValue: existing.direccion_provincia },
    { field: 'cuil_cuit', existingValue: existing.cuil_cuit },
  ]

  for (const { field, existingValue } of comparisons) {
    const newValue = rowData[field] ?? null
    if (!newValue) continue // No new data for this field

    const normalizedExisting = normalize(existingValue)
    const normalizedNew = normalize(newValue)

    if (!existingValue) {
      // Field is empty in DB, new data available → suggest fill
      conflicts.push({
        field,
        fieldLabel: FIELD_OPTIONS.find((f) => f.value === field)?.label ?? field,
        currentValue: null,
        newValue,
        resolution: 'overwrite', // Default: fill empty fields
      })
    } else if (normalizedExisting !== normalizedNew) {
      // Values differ → flag for review
      conflicts.push({
        field,
        fieldLabel: FIELD_OPTIONS.find((f) => f.value === field)?.label ?? field,
        currentValue: existingValue,
        newValue,
        resolution: 'keep', // Default: keep existing
      })
    }
  }

  return conflicts
}

/**
 * Detect duplicates within the import batch itself.
 */
export function detectInternalDuplicates(rows: ImportRow[]): void {
  const seen = new Map<string, number>() // key → first row index

  for (const row of rows) {
    const dni = normalizeDni(row.data.numero_documento)
    if (dni) {
      const key = `dni:${dni}`
      if (seen.has(key)) {
        if (row.dedupResult) {
          row.dedupResult.status = 'duplicada_en_lote'
        }
      } else {
        seen.set(key, row.rowIndex)
      }
    }
  }
}
