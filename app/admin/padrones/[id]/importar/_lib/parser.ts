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
    return {
      headers: allRows[0],
      rows: allRows.slice(1),
      delimiter,
      totalRows: allRows.length - 1,
    }
  }

  // Generate generic headers
  const colCount = Math.max(...allRows.map((r) => r.length))
  const headers = Array.from({ length: colCount }, (_, i) => `Columna ${i + 1}`)

  return {
    headers,
    rows: allRows,
    delimiter,
    totalRows: allRows.length,
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
