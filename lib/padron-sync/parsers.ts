/**
 * Parsers para archivos de padrón Hindu Club.
 * Maneja: fechas seriales Excel, split APELLIDO Y NOMBRE, categorías.
 */

// ============================================================
// Fecha serial Excel → ISO date
// ============================================================
export function excelSerialToISO(serial: number): string | null {
  if (!serial || serial < 1 || serial > 100000) return null
  // Excel epoch = 1900-01-01, pero tiene el bug del año bisiesto 1900
  // serial 1 = 1900-01-01, serial 25569 = 1970-01-01
  const utcDays = serial - 25569
  const utcMs = utcDays * 86400 * 1000
  const date = new Date(utcMs)
  if (isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

// ============================================================
// Split "APELLIDO Y NOMBRE" → { apellido, nombre }
// ============================================================
const PARTICULAS_APELLIDO = new Set([
  'DE', 'DEL', 'DE LA', 'DE LAS', 'DE LOS', 'LA', 'LAS', 'LOS',
  'VAN', 'VAN DER', 'VAN DEN', 'VON', 'DI', 'DA', 'DOS', 'DAS',
  'MC', 'MAC', 'O\'', 'AL', 'EL', 'BEN', 'SAN', 'SANTA',
])

export interface NombreParseado {
  apellido: string
  nombre: string
  confianza: 'alta' | 'media' | 'baja'
  original: string
}

export function splitApellidoNombre(raw: string): NombreParseado {
  const original = raw.trim()
  if (!original) return { apellido: '', nombre: '', confianza: 'baja', original }

  const words = original.split(/\s+/)

  if (words.length === 1) {
    return { apellido: words[0], nombre: '', confianza: 'baja', original }
  }

  if (words.length === 2) {
    return { apellido: words[0], nombre: words[1], confianza: 'alta', original }
  }

  // Buscar partículas de apellido compuesto
  let apellidoWords = 1

  // Probar partículas de 3 palabras, luego 2, luego 1
  for (const len of [3, 2, 1]) {
    if (words.length <= len) continue
    const prefix = words.slice(0, len).join(' ')
    if (PARTICULAS_APELLIDO.has(prefix)) {
      // La partícula + siguiente palabra = apellido
      apellidoWords = Math.min(len + 1, words.length - 1)
      break
    }
  }

  // Si no se encontró partícula y hay 3+ palabras, asumir primera = apellido
  // pero marcar confianza media/baja
  const apellido = words.slice(0, apellidoWords).join(' ')
  const nombre = words.slice(apellidoWords).join(' ')
  const confianza = apellidoWords === 1 && words.length > 3 ? 'baja' :
                    apellidoWords === 1 && words.length === 3 ? 'media' : 'alta'

  return { apellido, nombre, confianza, original }
}

// ============================================================
// Parsear CATEGORIA → { franja, tipo_socio }
// ============================================================
const FRANJAS = ['MAYOR', 'JUVENIL', 'INFANTIL', 'PLENARIO', 'VITALICIO', 'HONORARIO']

export interface CategoriaParseada {
  franja: string | null
  tipo_socio: string
  original: string
}

export function parsearCategoria(raw: string): CategoriaParseada {
  const original = raw.trim()
  if (!original) return { franja: null, tipo_socio: original, original }

  // Casos especiales que no siguen el patrón "FRANJA Tipo"
  const upper = original.toUpperCase()
  if (upper === 'SOCIO FUNDACION') return { franja: null, tipo_socio: 'Fundación', original }
  if (upper === 'CONSORCISTAS') return { franja: null, tipo_socio: 'Consorcista', original }

  // Buscar franja al inicio
  for (const franja of FRANJAS) {
    if (upper.startsWith(franja + ' ')) {
      const tipo = original.slice(franja.length + 1).trim()
      return { franja, tipo_socio: tipo || original, original }
    }
    if (upper === franja) {
      return { franja, tipo_socio: franja, original }
    }
  }

  // Caso "Plenario Golf" (minúscula)
  for (const franja of FRANJAS) {
    const lower = franja.charAt(0) + franja.slice(1).toLowerCase()
    if (original.startsWith(lower + ' ')) {
      const tipo = original.slice(lower.length + 1).trim()
      return { franja: franja, tipo_socio: tipo || original, original }
    }
  }

  return { franja: null, tipo_socio: original, original }
}

// ============================================================
// Normalizar DNI (quitar puntos, guiones, espacios)
// ============================================================
export function normalizarDNI(dni: string | number | null | undefined): string {
  if (dni == null) return ''
  return String(dni).replace(/[\.\-\s]/g, '').trim()
}

// ============================================================
// Detectar si un valor es fecha serial Excel
// ============================================================
export function esSerialExcel(value: unknown): boolean {
  if (typeof value === 'number') {
    return value > 10000 && value < 100000
  }
  return false
}

// ============================================================
// Parsear fila completa del padrón Hindu
// ============================================================
export interface FilaPadronParseada {
  fila_original: number
  numero_socio: string
  apellido: string
  nombre: string
  nombre_confianza: 'alta' | 'media' | 'baja'
  nombre_original: string
  dni: string
  fecha_nacimiento: string | null
  fecha_ingreso: string | null
  categoria_original: string
  categoria_franja: string | null
  categoria_tipo_socio: string
  actividad: string
  notas: string | null
  valido: boolean
  motivo_rechazo: string | null
}

export function parsearFilaPadron(
  row: unknown[],
  filaIndex: number
): FilaPadronParseada | null {
  // El padrón Hindu tiene columna 0 null, datos desde columna 1
  const socio = String(row[1] ?? '').trim()
  const nombreCompleto = String(row[2] ?? '').trim()
  const dniRaw = row[3] as string | number | null | undefined
  const fechaNacRaw = row[4] as string | number | null | undefined
  const fechaIngrRaw = row[5] as string | number | null | undefined
  const categoriaRaw = String(row[6] ?? '').trim()
  const actividadRaw = String(row[7] ?? '').trim()
  const notasRaw = row[8] != null ? String(row[8]).trim() : null

  // Validar que la fila tiene datos mínimos
  if (!nombreCompleto && !dniRaw) return null

  const { apellido, nombre, confianza, original } = splitApellidoNombre(nombreCompleto)
  const dni = normalizarDNI(dniRaw)
  const { franja, tipo_socio } = parsearCategoria(categoriaRaw)

  // Fechas
  let fechaNacimiento: string | null = null
  if (esSerialExcel(fechaNacRaw)) {
    fechaNacimiento = excelSerialToISO(fechaNacRaw as number)
  } else if (typeof fechaNacRaw === 'string') {
    fechaNacimiento = fechaNacRaw
  }

  let fechaIngreso: string | null = null
  if (esSerialExcel(fechaIngrRaw)) {
    fechaIngreso = excelSerialToISO(fechaIngrRaw as number)
  } else if (typeof fechaIngrRaw === 'string') {
    fechaIngreso = fechaIngrRaw
  }

  // Validación
  let valido = true
  let motivo_rechazo: string | null = null

  if (!dni) {
    valido = false
    motivo_rechazo = 'DNI vacío o inválido'
  } else if (dni.length < 6 || dni.length > 11) {
    valido = false
    motivo_rechazo = `DNI con longitud inválida: ${dni.length} dígitos`
  }

  if (!apellido && !nombre) {
    valido = false
    motivo_rechazo = (motivo_rechazo ? motivo_rechazo + '; ' : '') + 'Nombre vacío'
  }

  return {
    fila_original: filaIndex,
    numero_socio: socio,
    apellido,
    nombre,
    nombre_confianza: confianza,
    nombre_original: original,
    dni,
    fecha_nacimiento: fechaNacimiento,
    fecha_ingreso: fechaIngreso,
    categoria_original: categoriaRaw,
    categoria_franja: franja,
    categoria_tipo_socio: tipo_socio,
    actividad: actividadRaw,
    notas: notasRaw,
    valido,
    motivo_rechazo,
  }
}
