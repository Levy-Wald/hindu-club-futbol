import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually (avoid dotenv dependency)
function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}
loadEnv(path.resolve('.env.local'))

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColumnRef {
  file: string
  line: number
  table: string
  column: string
}

interface Error {
  file: string
  line: number
  table: string
  column: string
  available: string[]
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function fetchSchema(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<Map<string, Set<string>>> {
  // Use OpenAPI spec exposed by PostgREST to get table/column info
  const url = `${supabaseUrl}/rest/v1/`
  const resp = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/openapi+json',
    },
  })
  if (!resp.ok) {
    throw new Error(`OpenAPI spec fetch failed: ${resp.status} ${await resp.text()}`)
  }
  const spec = await resp.json() as {
    definitions?: Record<string, { properties?: Record<string, unknown> }>
    components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> }
  }

  const schema = new Map<string, Set<string>>()
  const defs = spec.definitions || spec.components?.schemas || {}
  for (const [tableName, tableDef] of Object.entries(defs)) {
    if (!tableDef.properties) continue
    const cols = new Set<string>()
    for (const colName of Object.keys(tableDef.properties)) {
      cols.add(colName)
    }
    schema.set(tableName, cols)
  }

  if (schema.size === 0) {
    throw new Error('No tables found in OpenAPI spec — check service role key and URL')
  }

  return schema
}

function buildSchemaMap(
  rows: { table_name: string; column_name: string }[],
): Map<string, Set<string>> {
  const schema = new Map<string, Set<string>>()
  for (const row of rows) {
    if (!schema.has(row.table_name)) schema.set(row.table_name, new Set())
    schema.get(row.table_name)!.add(row.column_name)
  }
  return schema
}

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

function collectFiles(dir: string, exts: string[]): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip node_modules and .next
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
      results.push(...collectFiles(fullPath, exts))
    } else if (entry.isFile() && exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

// Remove single-line comments (// ...) and block comments (/* ... */)
// Simple approach: line by line for //, regex for block comments
function stripComments(src: string): { cleaned: string; lineMap: number[] } {
  // We preserve line count by replacing comment content with spaces
  // Track original line numbers after stripping block comments

  // Strip block comments (replace with whitespace preserving newlines)
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' '),
  )

  // Strip line comments
  const lines = noBlock.split('\n')
  const lineMap: number[] = []
  const cleaned: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].replace(/\/\/.*$/, '')
    cleaned.push(stripped)
    lineMap.push(i + 1) // 1-based
  }

  return { cleaned: cleaned.join('\n'), lineMap }
}

// Extract string literal value (single or double quote) — returns null if template literal or variable
function extractStringLiteral(raw: string): string | null {
  const trimmed = raw.trim()
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1)
  }
  return null
}

// ---------------------------------------------------------------------------
// Pattern matching
// ---------------------------------------------------------------------------

interface QueryContext {
  table: string
  file: string
  startLine: number
}

interface ColumnReference {
  file: string
  line: number
  table: string
  column: string
}

// Find all .from('table') occurrences and their position in the source
function findFromCalls(src: string, file: string): QueryContext[] {
  const results: QueryContext[] = []
  // Match .from('...') or .from("...")
  const re = /\.from\(\s*(['"])((?:[^'"\\]|\\.)*)\1\s*\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(src)) !== null) {
    const table = match[2]
    const line = lineNumber(src, match.index)
    results.push({ table, file, startLine: line })
  }
  return results
}

// Get line number (1-based) for a character index in src
function lineNumber(src: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i++) {
    if (src[i] === '\n') line++
  }
  return line
}

// Parse select columns from a select string, handling FK joins like table(col1, col2)
// Returns { columns: string[], fkTables: string[] }
function parseSelectColumns(selectStr: string): { columns: string[]; fkTables: string[] } {
  const columns: string[] = []
  const fkTables: string[] = []

  // Remove newlines and extra spaces
  const flat = selectStr.replace(/\s+/g, ' ').trim()

  // Find FK join patterns: word(content) — capture the table name and recurse into content
  const fkRe = /(\w+)\s*\(([^)]*)\)/g
  let fkMatch: RegExpExecArray | null
  const fkRanges: [number, number][] = []

  while ((fkMatch = fkRe.exec(flat)) !== null) {
    fkTables.push(fkMatch[1])
    fkRanges.push([fkMatch.index, fkMatch.index + fkMatch[0].length])
    // Inner columns belong to the FK target table, not the source table.
    // We skip them to avoid false positives.
  }

  // Now parse top-level columns (outside FK ranges)
  // Simple: split by comma, skip anything that was in an FK range
  const parts = flat.split(',')
  let pos = 0
  for (const part of parts) {
    const trimmed = part.trim()
    const partStart = flat.indexOf(part, pos)
    pos = partStart + part.length + 1

    // Check if this position overlaps with any FK range
    const inFk = fkRanges.some(([start, end]) => partStart >= start && partStart < end)
    if (inFk) continue

    // Skip if it contains '(' (it's part of an FK join handled above or aggregate)
    if (trimmed.includes('(')) continue
    if (trimmed === '*' || trimmed === '') continue

    // Handle aliasing: col:alias or col -> alias
    // Skip jsonb operators (->> ->)
    if (trimmed.includes('->>') || trimmed.includes('->')) continue
    const col = trimmed.split(':')[0].trim()
    if (col && /^\w+$/.test(col)) {
      columns.push(col)
    }
  }

  return { columns, fkTables }
}

// Extract content between matching parens starting right after an open paren
// Returns the content and the end index
function extractParenContent(src: string, openIndex: number): { content: string; endIndex: number } | null {
  let depth = 1
  let i = openIndex + 1
  const start = i
  while (i < src.length && depth > 0) {
    if (src[i] === '(') depth++
    else if (src[i] === ')') depth--
    i++
  }
  if (depth !== 0) return null
  return { content: src.slice(start, i - 1), endIndex: i }
}

// Extract a quoted string (single/double) starting at index, returns value and end index
function extractQuotedString(src: string, start: number): { value: string; endIndex: number } | null {
  const quote = src[start]
  if (quote !== "'" && quote !== '"') return null
  let i = start + 1
  let value = ''
  while (i < src.length) {
    if (src[i] === '\\') {
      value += src[i + 1]
      i += 2
    } else if (src[i] === quote) {
      return { value, endIndex: i + 1 }
    } else {
      value += src[i]
      i++
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Main extraction logic
// ---------------------------------------------------------------------------

interface FileRefs {
  refs: ColumnReference[]
  tableRefs: { file: string; line: number; table: string }[]
}

function extractRefsFromFile(src: string, file: string): FileRefs {
  const { cleaned } = stripComments(src)

  const refs: ColumnReference[] = []
  const tableRefs: { file: string; line: number; table: string }[] = []

  // Track current table context per chained call
  // Strategy: find .from('table') calls, then scan subsequent chained calls
  // We do a simpler global scan approach — match patterns globally, associating
  // each column reference with the nearest preceding .from() call

  const fromPositions: { index: number; table: string }[] = []
  const fromRe = /\.from\(\s*(['"])((?:[^'"\\]|\\.)*)\1\s*\)/g
  let m: RegExpExecArray | null

  while ((m = fromRe.exec(cleaned)) !== null) {
    fromPositions.push({ index: m.index, table: m[2] })
    tableRefs.push({ file, line: lineNumber(cleaned, m.index), table: m[2] })
  }

  function nearestTable(index: number): string | null {
    let best: { index: number; table: string } | null = null
    for (const fp of fromPositions) {
      if (fp.index <= index) {
        if (!best || fp.index > best.index) best = fp
      }
    }
    return best ? best.table : null
  }

  // .select('col1, col2, ...')
  // Also handle multi-line by looking for the closing paren
  const selectRe = /\.select\(\s*/g
  while ((m = selectRe.exec(cleaned)) !== null) {
    const parenStart = m.index + m[0].length - 1 // index of the '('
    // Check if next char is a quote
    const afterParen = cleaned.slice(parenStart + 1).trimStart()
    const quoteMatch = afterParen.match(/^(['"`])/)
    if (!quoteMatch) continue

    // Extract the full content of .select(...)
    const content = extractParenContent(cleaned, parenStart)
    if (!content) continue

    const table = nearestTable(m.index)
    if (!table) continue

    // The content may be a string literal or template literal
    // For simplicity: strip outer quotes if present
    const inner = content.content.trim()
    let selectStr: string | null = null

    if ((inner.startsWith("'") && inner.includes("'", 1)) ||
        (inner.startsWith('"') && inner.includes('"', 1))) {
      // Find the full quoted string
      const qs = extractQuotedString(inner, 0)
      if (qs) selectStr = qs.value
    } else if (inner.startsWith('`')) {
      // Template literal — may have expressions, take the static parts
      selectStr = inner.slice(1, inner.lastIndexOf('`')).replace(/\$\{[^}]*\}/g, ' ')
    }

    if (!selectStr) continue

    const { columns, fkTables } = parseSelectColumns(selectStr)
    const line = lineNumber(cleaned, m.index)

    for (const col of columns) {
      refs.push({ file, line, table, column: col })
    }
    // FK join references (e.g., persona_id(nombre, apellido)) use FK column
    // names, not table names — PostgREST resolves them. Don't validate as tables.
    // We skip them entirely since the column names inside belong to the FK target
    // table, not the .from() table.
  }

  // Generic column-extracting methods: .eq, .neq, .is, .in, .order, .lt, .lte, .gt, .gte, .contains, .containedBy, .filter
  const colMethodRe = /\.(eq|neq|is|in|not|order|lt|lte|gt|gte|overlaps|contains|containedBy|filter|match)\(\s*(['"])((?:[^'"\\]|\\.)*)\2/g
  while ((m = colMethodRe.exec(cleaned)) !== null) {
    const col = m[3]
    if (col.includes('(') || col === '*') continue
    // Skip if it looks like a path (contains .) — could be jsonb path
    if (col.includes('.')) continue
    // Skip jsonb operators
    if (col.includes('->>') || col.includes('->')) continue
    const table = nearestTable(m.index)
    if (!table) continue
    refs.push({ file, line: lineNumber(cleaned, m.index), table, column: col })
  }

  // .insert({ col: val, ... }) and .update({ col: val, ... })
  // Match .insert( or .update( then extract the first object's keys
  const mutationRe = /\.(insert|update|upsert)\(\s*(\[?\s*\{)/g
  while ((m = mutationRe.exec(cleaned)) !== null) {
    const table = nearestTable(m.index)
    if (!table) continue
    const line = lineNumber(cleaned, m.index)

    // Find the opening brace
    const braceIdx = cleaned.indexOf('{', m.index + m[0].length - 1)
    if (braceIdx === -1) continue

    // Extract object content (shallow — find matching })
    let depth = 1
    let i = braceIdx + 1
    const objStart = i
    while (i < cleaned.length && depth > 0) {
      if (cleaned[i] === '{') depth++
      else if (cleaned[i] === '}') depth--
      i++
    }
    const objContent = cleaned.slice(objStart, i - 1)

    // Extract keys: match patterns like  key: or 'key': or "key":
    const keyRe = /(?:^|,|\{)\s*['"]?(\w+)['"]?\s*:/g
    let km: RegExpExecArray | null
    while ((km = keyRe.exec(objContent)) !== null) {
      const col = km[1]
      if (col && !['true', 'false', 'null', 'undefined'].includes(col)) {
        refs.push({ file, line, table, column: col })
      }
    }
  }

  return { refs, tableRefs }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  console.log('Fetching database schema...')

  let schema: Map<string, Set<string>>
  try {
    schema = await fetchSchemaViaPostgREST(supabaseUrl, serviceRoleKey)
    if (schema.size === 0) throw new Error('Empty schema from PostgREST')
  } catch (e1) {
    console.log('PostgREST approach failed, trying RPC...')
    try {
      schema = await fetchSchemaViaSQL(supabaseUrl, serviceRoleKey)
      if (schema.size === 0) throw new Error('Empty schema from RPC')
    } catch (e2) {
      console.log('RPC approach failed, trying direct client...')
      schema = await fetchSchema(supabaseUrl, serviceRoleKey)
    }
  }

  console.log(`Schema loaded: ${schema.size} tables`)

  // Collect files
  const root = process.cwd()
  const scanDirs = ['app', 'lib', 'components'].map((d) => path.join(root, d))
  const files: string[] = []
  for (const dir of scanDirs) {
    files.push(...collectFiles(dir, ['.ts', '.tsx']))
  }
  console.log(`Scanning ${files.length} TypeScript files...`)

  // Extract references
  const allRefs: ColumnReference[] = []
  const allTableRefs: { file: string; line: number; table: string }[] = []

  for (const file of files) {
    let src: string
    try {
      src = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const { refs, tableRefs } = extractRefsFromFile(src, file)
    allRefs.push(...refs)
    allTableRefs.push(...tableRefs)
  }

  console.log(`Found ${allRefs.length} column references and ${allTableRefs.length} table references\n`)

  const errors: Error[] = []
  const validated: number[] = []

  // Validate table references
  const tableErrors: { file: string; line: number; table: string }[] = []
  const seenTables = new Set<string>()

  for (const tr of allTableRefs) {
    if (seenTables.has(tr.table)) continue
    seenTables.add(tr.table)
    if (!schema.has(tr.table)) {
      // Only report once per table (avoid noise)
    }
  }

  // Validate column references
  for (const ref of allRefs) {
    const cols = schema.get(ref.table)
    if (!cols) {
      // Table not found — report as error
      errors.push({
        file: ref.file,
        line: ref.line,
        table: ref.table,
        column: ref.column,
        available: [],
      })
    } else if (!cols.has(ref.column)) {
      errors.push({
        file: ref.file,
        line: ref.line,
        table: ref.table,
        column: ref.column,
        available: Array.from(cols).sort(),
      })
    } else {
      validated.push(1)
    }
  }

  // Also report table-not-found once per unique (file, table) pair
  const tableMissingErrors: { file: string; line: number; table: string }[] = []
  const seenTableMiss = new Set<string>()
  for (const tr of allTableRefs) {
    const key = `${tr.table}`
    if (!schema.has(tr.table) && !seenTableMiss.has(key)) {
      seenTableMiss.add(key)
      tableMissingErrors.push(tr)
    }
  }

  // Print table-not-found errors
  if (tableMissingErrors.length > 0) {
    console.log('--- TABLE NOT FOUND ---\n')
    for (const te of tableMissingErrors) {
      const relFile = path.relative(root, te.file)
      console.log(`❌ TABLE MISSING:`)
      console.log(`   File: ${relFile}:${te.line}`)
      console.log(`   Table: "${te.table}" does not exist in public schema`)
      console.log()
    }
  }

  // Print column errors (deduplicate by table+column)
  const seenError = new Set<string>()
  const dedupedErrors = errors.filter((e) => {
    const key = `${e.table}.${e.column}`
    if (seenError.has(key)) return false
    seenError.add(key)
    return true
  })

  if (dedupedErrors.length > 0) {
    console.log('--- COLUMN MISMATCHES ---\n')
    for (const err of dedupedErrors) {
      const relFile = path.relative(root, err.file)
      console.log(`❌ MISMATCH:`)
      console.log(`   File: ${relFile}:${err.line}`)
      console.log(`   Table: ${err.table}`)
      if (err.available.length === 0) {
        console.log(`   Table does not exist in DB`)
      } else {
        console.log(`   Column: "${err.column}" does not exist`)
        // Show available columns truncated
        const preview =
          err.available.length > 10
            ? err.available.slice(0, 10).join(', ') + ` ... (+${err.available.length - 10} more)`
            : err.available.join(', ')
        console.log(`   Available: [${preview}]`)
      }
      console.log()
    }
  }

  const totalErrors = dedupedErrors.length + tableMissingErrors.length
  const totalValidated = validated.length

  console.log(
    `✅ ${totalValidated} queries validated, ${totalErrors} error(s) found` +
      (tableMissingErrors.length > 0 ? ` (${tableMissingErrors.length} missing tables, ${dedupedErrors.length} missing columns)` : ''),
  )

  process.exit(totalErrors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
