import { parseFile } from '@/app/admin/padrones/[id]/importar/_lib/parser'

interface GroupedConfig {
  header_pattern: string
  header_capture_group: number
  item_pattern: string
  item_capture_group: number
  campo_grupo: string
  campo_item: string
}

interface ParsedGroupRow {
  numero_fila: number
  raw_data: Record<string, string>
  parsed_data: Record<string, unknown>
}

export async function parseAgrupado(
  file: File,
  config: GroupedConfig
): Promise<{ rows: ParsedGroupRow[]; error?: string }> {
  // Parse file to get raw rows
  const parsed = await parseFile(file)

  if (parsed.totalRows === 0 && parsed.headers.length === 0) {
    return { rows: [], error: 'El archivo está vacío' }
  }

  const headerRe = new RegExp(config.header_pattern, 'i')
  const itemRe = new RegExp(config.item_pattern)

  const rows: ParsedGroupRow[] = []
  let grupoActual: string | null = null
  let numeroEnGrupo = 0
  let filaGlobal = 0

  // Combine headers + data rows for scanning
  const allLines: string[] = []

  // If headers exist, add them as first line (they might be a group header)
  if (parsed.headers.length > 0) {
    allLines.push(parsed.headers.join(' '))
  }

  // Each data row: join all columns into a single string
  for (const cells of parsed.rows) {
    allLines.push(cells.join(' ').trim())
  }

  for (const line of allLines) {
    filaGlobal++
    if (!line.trim()) continue

    // Check if it's a group header
    const headerMatch = headerRe.exec(line.trim())
    if (headerMatch) {
      grupoActual = headerMatch[config.header_capture_group]?.trim() ?? null
      numeroEnGrupo = 0
      continue
    }

    // Check if it's an item
    const itemMatch = itemRe.exec(line.trim())
    if (itemMatch && grupoActual) {
      numeroEnGrupo++
      const itemValue = itemMatch[config.item_capture_group]?.trim() ?? ''

      if (!itemValue) continue

      rows.push({
        numero_fila: filaGlobal,
        raw_data: {
          fila_original: line.trim(),
          [config.campo_grupo]: grupoActual,
          [config.campo_item]: itemValue,
        },
        parsed_data: {
          [config.campo_grupo]: grupoActual,
          [config.campo_item]: itemValue,
          numero_en_grupo: numeroEnGrupo,
        },
      })
    }
    // Else: ignore (empty lines, comments, etc.)
  }

  if (grupoActual === null) {
    return { rows: [], error: 'No se detectó ningún header de grupo en el archivo' }
  }

  return { rows }
}
