import type { ColumnMapping, FieldKey } from './types'

/**
 * Extended header map for auto-detection.
 * Maps common header names (lowercased) to system fields.
 */
const HEADER_MAP: Record<string, FieldKey> = {
  // Nombre
  nombre: 'nombre',
  nombres: 'nombre',
  name: 'nombre',
  'first name': 'nombre',
  'primer nombre': 'nombre',
  'nombre(s)': 'nombre',
  // Apellido
  apellido: 'apellido',
  apellidos: 'apellido',
  'last name': 'apellido',
  surname: 'apellido',
  'apellido(s)': 'apellido',
  // Nombre completo (se separa en nombre + apellido)
  'nombre completo': 'nombre',
  'nombre y apellido': 'nombre',
  'apellido y nombre': 'apellido',
  // Documento
  dni: 'numero_documento',
  documento: 'numero_documento',
  numero_documento: 'numero_documento',
  nro_documento: 'numero_documento',
  'nro documento': 'numero_documento',
  'nro. documento': 'numero_documento',
  'n° documento': 'numero_documento',
  'n doc': 'numero_documento',
  doc: 'numero_documento',
  'documento de identidad': 'numero_documento',
  cedula: 'numero_documento',
  'ci': 'numero_documento',
  // Tipo documento
  tipo_documento: 'tipo_documento',
  'tipo documento': 'tipo_documento',
  'tipo doc': 'tipo_documento',
  // Email
  email: 'email_principal',
  'e-mail': 'email_principal',
  mail: 'email_principal',
  correo: 'email_principal',
  'correo electronico': 'email_principal',
  'correo electrónico': 'email_principal',
  // Teléfono
  telefono: 'telefono_principal',
  teléfono: 'telefono_principal',
  tel: 'telefono_principal',
  celular: 'telefono_principal',
  phone: 'telefono_principal',
  mobile: 'telefono_principal',
  whatsapp: 'telefono_principal',
  cel: 'telefono_principal',
  movil: 'telefono_principal',
  móvil: 'telefono_principal',
  // Fecha nacimiento
  fecha_nacimiento: 'fecha_nacimiento',
  'fecha nacimiento': 'fecha_nacimiento',
  'fecha de nacimiento': 'fecha_nacimiento',
  'fec. nac.': 'fecha_nacimiento',
  'fec nac': 'fecha_nacimiento',
  nacimiento: 'fecha_nacimiento',
  birthdate: 'fecha_nacimiento',
  'fecha nac': 'fecha_nacimiento',
  fnac: 'fecha_nacimiento',
  // Género
  genero: 'genero',
  género: 'genero',
  sexo: 'genero',
  gender: 'genero',
  // CUIL/CUIT
  cuil: 'cuil_cuit',
  cuit: 'cuil_cuit',
  cuil_cuit: 'cuil_cuit',
  'cuil/cuit': 'cuil_cuit',
  // Dirección
  direccion: 'direccion_calle',
  dirección: 'direccion_calle',
  calle: 'direccion_calle',
  domicilio: 'direccion_calle',
  address: 'direccion_calle',
  // Número
  numero: 'direccion_numero',
  nro: 'direccion_numero',
  altura: 'direccion_numero',
  // Ciudad
  ciudad: 'direccion_ciudad',
  localidad: 'direccion_ciudad',
  city: 'direccion_ciudad',
  partido: 'direccion_ciudad',
  // Provincia
  provincia: 'direccion_provincia',
  state: 'direccion_provincia',
  // CP
  cp: 'direccion_codigo_postal',
  'codigo postal': 'direccion_codigo_postal',
  'código postal': 'direccion_codigo_postal',
  'cod postal': 'direccion_codigo_postal',
  zip: 'direccion_codigo_postal',
  // Nacionalidad
  nacionalidad: 'nacionalidad',
  pais: 'nacionalidad',
  país: 'nacionalidad',
  // Padrón
  'nro socio': 'numero_socio',
  'nro. socio': 'numero_socio',
  'numero socio': 'numero_socio',
  'número socio': 'numero_socio',
  numero_socio: 'numero_socio',
  'n° socio': 'numero_socio',
  socio: 'numero_socio',
  'carnet': 'numero_socio',
  // Tipo socio
  'tipo socio': 'tipo_socio',
  'tipo de socio': 'tipo_socio',
  tipo_socio: 'tipo_socio',
  categoria: 'tipo_socio',
  categoría: 'tipo_socio',
  'cat socio': 'tipo_socio',
  // Estado padrón
  estado: 'estado_padron',
  'estado padron': 'estado_padron',
  'estado padrón': 'estado_padron',
  status: 'estado_padron',
  situacion: 'estado_padron',
  situación: 'estado_padron',
}

/**
 * Normalize a header string for comparison.
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[()[\]{}]/g, '')
}

/**
 * Try to detect field by looking at sample data values.
 */
function detectByValues(values: string[]): FieldKey | null {
  const nonEmpty = values.filter((v) => v.trim())
  if (nonEmpty.length === 0) return null

  // Email pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (nonEmpty.filter((v) => emailRegex.test(v)).length > nonEmpty.length * 0.5) {
    return 'email_principal'
  }

  // DNI pattern (7-8 digits, possibly with dots)
  const dniRegex = /^\d{7,8}$|^\d{1,2}\.\d{3}\.\d{3}$/
  if (nonEmpty.filter((v) => dniRegex.test(v.replace(/\s/g, ''))).length > nonEmpty.length * 0.5) {
    return 'numero_documento'
  }

  // CUIL/CUIT pattern (XX-XXXXXXXX-X)
  const cuilRegex = /^\d{2}-?\d{7,8}-?\d$/
  if (nonEmpty.filter((v) => cuilRegex.test(v.replace(/\s/g, ''))).length > nonEmpty.length * 0.5) {
    return 'cuil_cuit'
  }

  // Phone pattern
  const phoneRegex = /^[\d\s\-+()]{8,}$/
  if (nonEmpty.filter((v) => phoneRegex.test(v)).length > nonEmpty.length * 0.5) {
    return 'telefono_principal'
  }

  // Date pattern
  const dateRegex = /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$|^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/
  if (nonEmpty.filter((v) => dateRegex.test(v)).length > nonEmpty.length * 0.5) {
    return 'fecha_nacimiento'
  }

  return null
}

/**
 * Auto-detect column mapping from headers and sample data.
 * Returns confidence-scored mappings.
 */
export function autoDetectMapping(
  headers: string[],
  sampleRows: string[][]
): ColumnMapping[] {
  const usedFields = new Set<FieldKey>()
  const mappings: ColumnMapping[] = []

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeHeader(headers[i])
    let targetField: FieldKey | null = null
    let confidence = 0

    // Try exact header match
    if (HEADER_MAP[normalized]) {
      targetField = HEADER_MAP[normalized]
      confidence = 0.95
    }

    // Try partial match
    if (!targetField) {
      for (const [key, field] of Object.entries(HEADER_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
          if (!usedFields.has(field)) {
            targetField = field
            confidence = 0.7
            break
          }
        }
      }
    }

    // Try value-based detection
    if (!targetField && sampleRows.length > 0) {
      const columnValues = sampleRows.slice(0, 10).map((row) => row[i] ?? '')
      const detected = detectByValues(columnValues)
      if (detected && !usedFields.has(detected)) {
        targetField = detected
        confidence = 0.5
      }
    }

    // Avoid duplicates
    if (targetField && usedFields.has(targetField)) {
      targetField = null
      confidence = 0
    }

    if (targetField) {
      usedFields.add(targetField)
    }

    mappings.push({
      sourceIndex: i,
      sourceHeader: headers[i],
      targetField,
      confidence,
    })
  }

  return mappings
}

/**
 * Detects if a column likely contains "Apellido, Nombre" combined format.
 * Returns true if most values match the pattern.
 */
export function detectCombinedNameColumn(values: string[]): boolean {
  const nonEmpty = values.filter((v) => v.trim())
  if (nonEmpty.length === 0) return false

  const commaPattern = nonEmpty.filter((v) => v.includes(',') && v.split(',').length === 2)
  return commaPattern.length > nonEmpty.length * 0.5
}

/**
 * Split "Apellido, Nombre" into separate values.
 */
export function splitCombinedName(value: string): { nombre: string; apellido: string } {
  const parts = value.split(',').map((p) => p.trim())
  if (parts.length >= 2) {
    return { apellido: parts[0], nombre: parts[1] }
  }
  // Try space-based split (first word = nombre, rest = apellido)
  const words = value.trim().split(/\s+/)
  if (words.length >= 2) {
    return { nombre: words[0], apellido: words.slice(1).join(' ') }
  }
  return { nombre: value, apellido: '' }
}
