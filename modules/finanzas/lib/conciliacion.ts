'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import Papa from 'papaparse'
import crypto from 'crypto'
import { TENANT_ID } from '@/lib/tenant'


// =============================================================================
// Types
// =============================================================================

export interface FilaBancaria {
  fecha_operacion: string
  fecha_valor?: string
  descripcion: string
  referencia_bancaria?: string
  monto: number
  saldo_banco?: number
}

export type FormatoExtracto = 'generico' | 'mercadopago' | 'galicia' | 'santander' | 'bbva' | 'macro'

export interface ResultadoImport {
  batch_id: string
  filas_importadas: number
  filas_duplicadas: number
  filas_con_error: number
  errores: Array<{ fila: number; mensaje: string }>
}

type ActionResult = { success: boolean; error?: string; data?: unknown }

// =============================================================================
// Hash dedup
// =============================================================================

function hashFila(fila: FilaBancaria): string {
  const data = `${fila.fecha_operacion}|${fila.monto}|${fila.descripcion}|${fila.referencia_bancaria ?? ''}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

// =============================================================================
// Parsers
// =============================================================================

function normalizeMonto(raw: string): number {
  if (!raw) return NaN
  const cleaned = raw.replace(/[$ ]/g, '').replace(/\./g, '').replace(',', '.')
  return parseFloat(cleaned)
}

function normalizeDate(raw: string): string | null {
  if (!raw) return null
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // Try DD/MM/YYYY or DD-MM-YYYY
  const match = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match) {
    const [, d, m, y] = match
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Try MM/DD/YYYY
  const match2 = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (match2) return null // ambiguous, already handled above
  return null
}

function findHeader(headers: string[], ...candidates: string[]): string | null {
  const normalized = headers.map(h => h.toLowerCase().trim())
  for (const c of candidates) {
    const idx = normalized.indexOf(c.toLowerCase())
    if (idx >= 0) return headers[idx]
  }
  return null
}

function parseGenerico(csvText: string): { filas: FilaBancaria[]; errores: Array<{ fila: number; mensaje: string }> } {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const headers = result.meta.fields ?? []
  const filas: FilaBancaria[] = []
  const errores: Array<{ fila: number; mensaje: string }> = []

  const fechaCol = findHeader(headers, 'fecha', 'fecha_operacion', 'date', 'fecha operacion')
  const descCol = findHeader(headers, 'descripcion', 'descripción', 'concepto', 'detalle', 'description')
  const montoCol = findHeader(headers, 'monto', 'importe', 'amount')
  const debitoCol = findHeader(headers, 'debito', 'débito', 'debe')
  const creditoCol = findHeader(headers, 'credito', 'crédito', 'haber')
  const refCol = findHeader(headers, 'referencia', 'referencia_bancaria', 'ref', 'nro_comprobante')
  const saldoCol = findHeader(headers, 'saldo', 'saldo_banco', 'balance')

  if (!fechaCol) { errores.push({ fila: 0, mensaje: 'Columna "fecha" no encontrada' }); return { filas, errores } }
  if (!descCol) { errores.push({ fila: 0, mensaje: 'Columna "descripcion" no encontrada' }); return { filas, errores } }
  if (!montoCol && (!debitoCol || !creditoCol)) {
    errores.push({ fila: 0, mensaje: 'Columna "monto" o "debito+credito" no encontrada' })
    return { filas, errores }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const fecha = normalizeDate(row[fechaCol!])
    if (!fecha) { errores.push({ fila: i + 2, mensaje: `Fecha invalida: "${row[fechaCol!]}"` }); continue }

    let monto: number
    if (montoCol) {
      monto = normalizeMonto(row[montoCol])
    } else {
      const debito = normalizeMonto(row[debitoCol!] || '0')
      const credito = normalizeMonto(row[creditoCol!] || '0')
      monto = credito - debito
    }
    if (isNaN(monto) || monto === 0) { errores.push({ fila: i + 2, mensaje: 'Monto invalido o cero' }); continue }

    const desc = row[descCol!]?.trim()
    if (!desc) { errores.push({ fila: i + 2, mensaje: 'Descripcion vacia' }); continue }

    filas.push({
      fecha_operacion: fecha,
      descripcion: desc,
      monto,
      referencia_bancaria: refCol ? row[refCol]?.trim() || undefined : undefined,
      saldo_banco: saldoCol ? normalizeMonto(row[saldoCol]) || undefined : undefined,
    })
  }

  return { filas, errores }
}

function parseMercadoPago(csvText: string): { filas: FilaBancaria[]; errores: Array<{ fila: number; mensaje: string }> } {
  const result = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })
  const headers = result.meta.fields ?? []
  const filas: FilaBancaria[] = []
  const errores: Array<{ fila: number; mensaje: string }> = []

  // MP standard columns (may need adjustment based on actual exports)
  const fechaCol = findHeader(headers, 'fecha', 'date', 'fecha_creacion', 'DATE_CREATED')
  const descCol = findHeader(headers, 'descripcion', 'description', 'concepto', 'DESCRIPTION', 'SOURCE_ID')
  const montoCol = findHeader(headers, 'monto', 'amount', 'NET_RECEIVED_AMOUNT', 'TRANSACTION_AMOUNT')
  const refCol = findHeader(headers, 'referencia', 'EXTERNAL_REFERENCE', 'reference', 'SOURCE_ID')
  const saldoCol = findHeader(headers, 'saldo', 'BALANCE', 'balance')

  if (!fechaCol || !montoCol) {
    errores.push({ fila: 0, mensaje: 'Formato MercadoPago no reconocido. Se requieren columnas fecha y monto.' })
    return { filas, errores }
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const fecha = normalizeDate(row[fechaCol]?.split(' ')[0] ?? '')
    if (!fecha) { errores.push({ fila: i + 2, mensaje: `Fecha invalida` }); continue }

    const monto = normalizeMonto(row[montoCol])
    if (isNaN(monto) || monto === 0) { errores.push({ fila: i + 2, mensaje: 'Monto invalido' }); continue }

    const desc = descCol ? row[descCol]?.trim() || `Movimiento MP fila ${i + 2}` : `Movimiento MP fila ${i + 2}`

    filas.push({
      fecha_operacion: fecha,
      descripcion: desc,
      monto,
      referencia_bancaria: refCol ? row[refCol]?.trim() || undefined : undefined,
      saldo_banco: saldoCol ? normalizeMonto(row[saldoCol]) || undefined : undefined,
    })
  }

  return { filas, errores }
}

function parseExtracto(text: string, formato: FormatoExtracto): ReturnType<typeof parseGenerico> {
  switch (formato) {
    case 'generico': return parseGenerico(text)
    case 'mercadopago': return parseMercadoPago(text)
    default:
      throw new Error(`Formato "${formato}" no soportado aún — solicitar al equipo`)
  }
}

// =============================================================================
// Import action
// =============================================================================

export async function importarExtracto(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const cajaId = formData.get('caja_id') as string
  const formato = (formData.get('formato') as FormatoExtracto) || 'generico'
  const archivo = formData.get('archivo') as File | null

  if (!cajaId) return { success: false, error: 'Debe seleccionar una caja' }
  if (!archivo) return { success: false, error: 'Debe subir un archivo' }

  // Read file content
  let text: string
  const fileName = archivo.name.toLowerCase()

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const XLSX = await import('xlsx')
    const buffer = await archivo.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    text = XLSX.utils.sheet_to_csv(ws)
  } else {
    text = await archivo.text()
  }

  // Parse
  let parsed: ReturnType<typeof parseGenerico>
  try {
    parsed = parseExtracto(text, formato)
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }

  if (parsed.filas.length === 0 && parsed.errores.length > 0) {
    return { success: false, error: parsed.errores.map(e => e.mensaje).join('; ') }
  }

  const batchId = crypto.randomUUID()
  let importadas = 0
  let duplicadas = 0

  // Insert filas one by one to handle dedup gracefully
  for (let i = 0; i < parsed.filas.length; i++) {
    const fila = parsed.filas[i]
    const hash = hashFila(fila)

    const { error } = await supabase
      .from('conciliacion_movimientos_bancarios')
      .insert({
        tenant_id: TENANT_ID,
        caja_id: cajaId,
        fecha_operacion: fila.fecha_operacion,
        fecha_valor: fila.fecha_valor || null,
        descripcion: fila.descripcion,
        referencia_bancaria: fila.referencia_bancaria || null,
        monto: fila.monto,
        saldo_banco: fila.saldo_banco ?? null,
        import_batch_id: batchId,
        fila_origen: i + 1,
        hash_dedup: hash,
      })

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique') || error.code === '23505') {
        duplicadas++
      } else {
        parsed.errores.push({ fila: i + 1, mensaje: error.message })
      }
    } else {
      importadas++
    }
  }

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')

  const result: ResultadoImport = {
    batch_id: batchId,
    filas_importadas: importadas,
    filas_duplicadas: duplicadas,
    filas_con_error: parsed.errores.length,
    errores: parsed.errores,
  }

  return { success: true, data: result }
}

// =============================================================================
// Auto-match
// =============================================================================

export async function autoMatchearExtracto(
  cajaId: string,
  batchId?: string,
  toleranciaPesos: number = 0,
  toleranciaDias: number = 1,
): Promise<ActionResult> {
  const supabase = await createClient()

  // Get pending filas
  let query = supabase
    .from('conciliacion_movimientos_bancarios')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .eq('estado', 'pendiente')
    .is('deleted_at', null)

  if (batchId) query = query.eq('import_batch_id', batchId)

  const { data: filas, error: filasError } = await query
  if (filasError) return { success: false, error: filasError.message }
  if (!filas || filas.length === 0) return { success: true, data: { matcheados: 0, sin_match: 0, multiples_candidatos: 0 } }

  // Get unreconciled movimientos for this caja
  const { data: movimientos } = await supabase
    .from('movimientos_caja')
    .select('id, tipo, monto_neto, fecha')
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .eq('anulado', false)
    .is('conciliado_at', null)

  const movsDisponibles = new Set((movimientos ?? []).map(m => m.id))
  const movsList = movimientos ?? []

  let matcheados = 0
  let sin_match = 0
  let multiples_candidatos = 0

  // Get current user
  let userId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  userId = user?.id ?? null

  for (const fila of filas) {
    const montoFila = Number(fila.monto)
    const absMontoFila = Math.abs(montoFila)

    // Determine compatible types based on sign
    const tiposCandidatos = montoFila > 0
      ? ['ingreso', 'transferencia']
      : ['egreso', 'transferencia']

    // Find candidates
    const candidatos = movsList.filter(m => {
      if (!movsDisponibles.has(m.id)) return false
      if (!tiposCandidatos.includes(m.tipo)) return false
      if (Math.abs(Number(m.monto_neto) - absMontoFila) > toleranciaPesos) return false

      // Date tolerance
      const fechaMov = new Date(m.fecha + 'T12:00:00')
      const fechaFila = new Date(fila.fecha_operacion + 'T12:00:00')
      const diffDays = Math.abs(Math.round((fechaMov.getTime() - fechaFila.getTime()) / 86400000))
      if (diffDays > toleranciaDias) return false

      return true
    })

    if (candidatos.length === 1) {
      const mov = candidatos[0]

      // Update fila bancaria
      await supabase
        .from('conciliacion_movimientos_bancarios')
        .update({
          estado: 'conciliado',
          movimiento_caja_id: mov.id,
          conciliado_at: new Date().toISOString(),
          conciliado_por_id: userId,
        })
        .eq('id', fila.id)

      // Update movimiento_caja (FK reversa)
      await supabase
        .from('movimientos_caja')
        .update({
          conciliado_at: new Date().toISOString(),
          conciliacion_mb_id: fila.id,
        })
        .eq('id', mov.id)

      movsDisponibles.delete(mov.id)
      matcheados++
    } else if (candidatos.length > 1) {
      multiples_candidatos++
    } else {
      sin_match++
    }
  }

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')
  return { success: true, data: { matcheados, sin_match, multiples_candidatos } }
}

// =============================================================================
// Manual actions
// =============================================================================

export async function conciliarManual(filaId: string, movimientoCajaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Check fila exists and is pending
  const { data: fila } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .select('id, estado')
    .eq('id', filaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!fila) return { success: false, error: 'Fila no encontrada' }
  if (fila.estado === 'conciliado') return { success: false, error: 'La fila ya esta conciliada' }

  // Check movimiento exists and is not reconciled
  const { data: mov } = await supabase
    .from('movimientos_caja')
    .select('id, conciliado_at')
    .eq('id', movimientoCajaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!mov) return { success: false, error: 'Movimiento no encontrado' }
  if (mov.conciliado_at) return { success: false, error: 'El movimiento ya esta conciliado con otra fila' }

  let userId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  userId = user?.id ?? null

  // Update both sides
  const { error: e1 } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .update({
      estado: 'conciliado',
      movimiento_caja_id: movimientoCajaId,
      conciliado_at: new Date().toISOString(),
      conciliado_por_id: userId,
    })
    .eq('id', filaId)

  if (e1) return { success: false, error: e1.message }

  const { error: e2 } = await supabase
    .from('movimientos_caja')
    .update({
      conciliado_at: new Date().toISOString(),
      conciliacion_mb_id: filaId,
    })
    .eq('id', movimientoCajaId)

  if (e2) return { success: false, error: e2.message }

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')
  return { success: true }
}

export async function crearMovimientoDesdeFila(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const filaId = formData.get('fila_id') as string
  const cajaId = formData.get('caja_id') as string
  const cuentaDebeId = formData.get('cuenta_debe_id') as string | null
  const cuentaHaberId = formData.get('cuenta_haber_id') as string | null
  const personaId = formData.get('persona_id') as string | null
  const centroCostoId = formData.get('centro_costo_id') as string | null
  const descripcion = formData.get('descripcion') as string | null

  // Get fila data
  const { data: fila } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .select('*')
    .eq('id', filaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!fila) return { success: false, error: 'Fila no encontrada' }

  const montoFila = Number(fila.monto)
  const tipo = montoFila > 0 ? 'ingreso' : 'egreso'
  const montoAbs = Math.abs(montoFila)
  const periodoContable = fila.fecha_operacion.substring(0, 7)

  const insertData: Record<string, unknown> = {
    tenant_id: TENANT_ID,
    tipo,
    caja_id: cajaId,
    monto_bruto: montoAbs,
    monto_neto: montoAbs,
    moneda: 'ARS',
    fecha: fila.fecha_operacion,
    periodo_contable: periodoContable,
    descripcion: descripcion || fila.descripcion,
    conciliado_at: new Date().toISOString(),
    conciliacion_mb_id: filaId,
  }

  if (cuentaDebeId) insertData.cuenta_debe_id = cuentaDebeId
  if (cuentaHaberId) insertData.cuenta_haber_id = cuentaHaberId
  if (personaId) insertData.persona_id = personaId
  if (centroCostoId) insertData.centro_costo_id = centroCostoId

  const { data: movimiento, error: movError } = await supabase
    .from('movimientos_caja')
    .insert(insertData)
    .select('id')
    .single()

  if (movError) return { success: false, error: `Error al crear movimiento: ${movError.message}` }

  // Update fila
  await supabase
    .from('conciliacion_movimientos_bancarios')
    .update({
      estado: 'conciliado',
      movimiento_caja_id: movimiento.id,
      conciliado_at: new Date().toISOString(),
    })
    .eq('id', filaId)

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')
  revalidatePath('/admin/[tenant]/finanzas/movimientos', 'page')
  return { success: true, data: { movimiento_id: movimiento.id } }
}

export async function marcarDiscrepancia(filaId: string, notas: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .update({
      estado: 'discrepancia',
      notas_conciliacion: notas,
    })
    .eq('id', filaId)
    .eq('tenant_id', TENANT_ID)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')
  return { success: true }
}

export async function ignorarFila(filaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .update({ estado: 'ignorado' })
    .eq('id', filaId)
    .eq('tenant_id', TENANT_ID)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')
  return { success: true }
}

export async function desconciliar(filaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Get current movimiento_caja_id
  const { data: fila } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .select('id, movimiento_caja_id')
    .eq('id', filaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!fila) return { success: false, error: 'Fila no encontrada' }

  // Revert fila
  const { error: e1 } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .update({
      estado: 'pendiente',
      movimiento_caja_id: null,
      conciliado_at: null,
      conciliado_por_id: null,
      notas_conciliacion: null,
    })
    .eq('id', filaId)

  if (e1) return { success: false, error: e1.message }

  // Revert movimiento_caja FK reversa
  if (fila.movimiento_caja_id) {
    await supabase
      .from('movimientos_caja')
      .update({
        conciliado_at: null,
        conciliacion_mb_id: null,
      })
      .eq('id', fila.movimiento_caja_id)
  }

  revalidatePath('/admin/[tenant]/finanzas/conciliacion', 'page')
  return { success: true }
}

// =============================================================================
// Queries
// =============================================================================

export async function fetchFilasConciliacion(cajaId: string, estado?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('conciliacion_movimientos_bancarios')
    .select(`
      *,
      movimiento:movimientos_caja(id, numero, tipo, monto_neto, fecha, descripcion)
    `)
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .is('deleted_at', null)
    .order('fecha_operacion', { ascending: false })

  if (estado) {
    if (estado === 'pendientes') {
      query = query.in('estado', ['pendiente', 'discrepancia'])
    } else {
      query = query.eq('estado', estado)
    }
  }

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

export async function fetchMovimientosSinConciliar(cajaId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('movimientos_caja')
    .select('id, numero, tipo, monto_neto, fecha, descripcion')
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .eq('anulado', false)
    .is('conciliado_at', null)
    .order('fecha', { ascending: false })
    .limit(200)

  if (error) return []
  return data ?? []
}

export async function fetchResumenConciliacion(cajaId: string) {
  const supabase = await createClient()

  const { data: caja } = await supabase
    .from('cajas')
    .select('id, nombre, saldo_actual, tipo, moneda')
    .eq('id', cajaId)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (!caja) return null

  // Ultimo saldo banco
  const { data: ultimoSaldo } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .select('saldo_banco, fecha_operacion')
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .not('saldo_banco', 'is', null)
    .is('deleted_at', null)
    .order('fecha_operacion', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Counts
  const { count: sinConciliarSistema } = await supabase
    .from('movimientos_caja')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .eq('anulado', false)
    .is('conciliado_at', null)

  const { count: sinMatchBanco } = await supabase
    .from('conciliacion_movimientos_bancarios')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .eq('caja_id', cajaId)
    .eq('estado', 'pendiente')
    .is('deleted_at', null)

  return {
    caja,
    saldoBanco: ultimoSaldo ? Number(ultimoSaldo.saldo_banco) : null,
    fechaUltimoSaldo: ultimoSaldo?.fecha_operacion ?? null,
    sinConciliarSistema: sinConciliarSistema ?? 0,
    sinMatchBanco: sinMatchBanco ?? 0,
  }
}

export async function fetchCajasBancarias() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cajas')
    .select('id, nombre, tipo, moneda, saldo_actual')
    .eq('tenant_id', TENANT_ID)
    .eq('activa', true)
    .is('deleted_at', null)
    .in('tipo', ['banco', 'mercadopago', 'digital'])
    .order('nombre')

  if (error) return []
  return data ?? []
}
