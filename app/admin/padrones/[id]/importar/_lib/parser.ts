import type { ParsedData } from './types'

/**
 * Detects the delimiter used in the text data.
 * Checks tab, semicolon, comma, and pipe.
 */
function detectDelimiter(text: string): string {
  const firstLines = text.split('\n').slice(0, 5).join('\n')

  const delimiters = ['\t', ';', ',', '|']
  let bestDelimiter = ','
  let bestScore = 0

  for (const d of delimiters) {
    const lines = firstLines.split('\n').filter((l) => l.trim())
    if (lines.length === 0) continue

    const counts = lines.map((l) => l.split(d).length)
    const firstCount = counts[0]

    // Score = consistency of column count across lines × number of columns
    if (firstCount > 1) {
      const consistent = counts.every((c) => c === firstCount)
      const score = consistent ? firstCount * 2 : firstCount
      if (score > bestScore) {
        bestScore = score
        bestDelimiter = d
      }
    }
  }

  return bestDelimiter
}

/**
 * Parses CSV/TSV/delimited text handling quotes properly.
 */
function parseDelimited(text: string, delimiter: string): string[][] {
  const cleaned = text.startsWith('\ufeff') ? text.slice(1) : text
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    const next = cleaned[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === delimiter) {
        row.push(current.trim())
        current = ''
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current.trim())
        current = ''
        if (row.some((cell) => cell !== '')) {
          rows.push(row)
        }
        row = []
        if (char === '\r') i++
      } else if (char === '\r') {
        row.push(current.trim())
        current = ''
        if (row.some((cell) => cell !== '')) {
          rows.push(row)
        }
        row = []
      } else {
        current += char
      }
    }
  }

  row.push(current.trim())
  if (row.some((cell) => cell !== '')) {
    rows.push(row)
  }

  return rows
}

/**
 * Determines if the first row is likely a header row.
 */
function isLikelyHeader(firstRow: string[], secondRow: string[] | undefined): boolean {
  if (!secondRow) return false

  // If first row has more non-numeric values than second row, it's likely a header
  const firstNonNumeric = firstRow.filter((v) => v && isNaN(Number(v.replace(/[.\-/]/g, '')))).length
  const secondNonNumeric = secondRow.filter((v) => v && isNaN(Number(v.replace(/[.\-/]/g, '')))).length

  // If first row is all text and second has numbers, it's a header
  if (firstNonNumeric > secondNonNumeric) return true

  // If first row has typical header words
  const headerWords = ['nombre', 'apellido', 'dni', 'documento', 'email', 'tel', 'fecha', 'socio', 'nro', 'num', 'dir', 'calle']
  const hasHeaderWord = firstRow.some((v) =>
    headerWords.some((hw) => v.toLowerCase().includes(hw))
  )
  if (hasHeaderWord) return true

  return false
}

const HEADER_KEYWORDS = [
  'nombre', 'apellido', 'dni', 'documento', 'email', 'telefono', 'tel',
  'fecha', 'socio', 'nro', 'num', 'dir', 'calle', 'categoria', 'actividad',
  'estado', 'genero', 'sexo', 'cuil', 'cuit', 'domicilio', 'localidad',
  'provincia', 'codigo postal', 'cp', 'nacionalidad',
]

/**
 * Checks if a row looks like a header, title, or metadata row (not real data).
 * Handles multi-row headers common in Excel exports (e.g., "HINDU CLUB", "Apr-26", "APELLIDO Y NOMBRE").
 */
function isJunkOrHeaderRow(row: string[]): boolean {
  const nonEmpty = row.filter((v) => v.trim() !== '')

  // Row with 0-1 non-empty cells is likely a title/spacer row
  if (nonEmpty.length <= 1) return true

  // Check if any cell contains a header keyword
  const joined = nonEmpty.join(' ').toLowerCase()
  const headerHits = HEADER_KEYWORDS.filter((kw) => joined.includes(kw))
  if (headerHits.length >= 2) return true

  // Check for exact header-like patterns: "APELLIDO Y NOMBRE", "FECHANAC", etc.
  const exactHeaders = ['apellido y nombre', 'fechanac', 'fecha nac', 'fecha nacimiento', 'fechaingreso', 'fecha ingreso', 'n° socio', 'nro socio', 'n socio']
  if (nonEmpty.some((v) => exactHeaders.includes(v.toLowerCase().trim()))) return true

  // Month-year patterns like "Apr-26", "Ene-26", "2026" — metadata rows
  const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Abr|Ago|Dic)[-\s]\d{2,4}$/i
  if (nonEmpty.length <= 2 && nonEmpty.some((v) => monthPattern.test(v.trim()))) return true

  return false
}

/**
 * Filters out all header/title/junk rows from parsed data.
 * Handles Excel files with multiple header rows (common in club exports).
 */
function filterJunkRows(rows: string[][]): string[][] {
  // Find the first "real data" row — scan from the top
  let firstDataRow = 0
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (!isJunkOrHeaderRow(rows[i])) {
      firstDataRow = i
      break
    }
    firstDataRow = i + 1
  }
  return rows.slice(firstDataRow)
}

/**
 * Main parse function. Accepts any text input and returns structured data.
 */
export function parseInput(text: string): ParsedData {
  if (!text.trim()) {
    return { headers: [], rows: [], delimiter: ',', totalRows: 0 }
  }

  const delimiter = detectDelimiter(text)
  const allRows = parseDelimited(text, delimiter)

  if (allRows.length === 0) {
    return { headers: [], rows: [], delimiter, totalRows: 0 }
  }

  const hasHeader = isLikelyHeader(allRows[0], allRows[1])

  if (hasHeader) {
    const dataRows = filterJunkRows(allRows.slice(1))
    return {
      headers: allRows[0],
      rows: dataRows,
      delimiter,
      totalRows: dataRows.length,
    }
  }

  // No detected header — still filter junk rows from the top
  const dataRows = filterJunkRows(allRows)

  // Generate generic headers
  const colCount = Math.max(...dataRows.map((r) => r.length), 1)
  const headers = Array.from({ length: colCount }, (_, i) => `Columna ${i + 1}`)

  return {
    headers,
    rows: dataRows,
    delimiter,
    totalRows: dataRows.length,
  }
}

/**
 * Parse an Excel file (XLSX) from an ArrayBuffer.
 * Uses the xlsx library if available, otherwise falls back to CSV extraction.
 * This is a stub that will be enhanced when xlsx dependency is added.
 */
export async function parseExcelFile(buffer: ArrayBuffer): Promise<ParsedData> {
  // Dynamic import of xlsx to keep bundle size down
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const csv = XLSX.utils.sheet_to_csv(firstSheet)
    return parseInput(csv)
  } catch {
    throw new Error('No se pudo leer el archivo Excel. Intentá exportarlo como CSV.')
  }
}

/**
 * Read a File object and parse it.
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'xlsx' || extension === 'xls') {
    const buffer = await file.arrayBuffer()
    return parseExcelFile(buffer)
  }

  // CSV, TSV, TXT — read as text
  const text = await file.text()
  return parseInput(text)
}
