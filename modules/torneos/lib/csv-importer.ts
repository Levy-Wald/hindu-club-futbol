'use server'

import Papa from 'papaparse'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import type { CSVFixtureRow, CSVResultadoRow } from './csv-templates'

type ImportResult = {
  ok: boolean
  insertados: number
  errores: string[]
}

function validarFecha(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !isNaN(Date.parse(fecha))
}

function validarHora(hora: string): boolean {
  return /^\d{2}:\d{2}$/.test(hora)
}

async function resolverEquipo(
  supabase: ReturnType<typeof createServiceRoleClient>,
  tenant_id: string,
  nombre: string,
  torneo_id: string
): Promise<{ equipo_id: string | null; equipo_externo_nombre: string | null }> {
  // Try to match with equipo propio by name (case insensitive)
  const { data: equipo } = await supabase
    .from('equipos')
    .select('id')
    .eq('tenant_id', tenant_id)
    .ilike('nombre', nombre.trim())
    .maybeSingle()

  if (equipo) {
    return { equipo_id: equipo.id, equipo_externo_nombre: null }
  }

  // Also check torneo_equipos for already registered external teams
  const { data: inscripto } = await supabase
    .from('torneo_equipos')
    .select('equipo_id, equipo_externo_nombre')
    .eq('torneo_id', torneo_id)
    .eq('activo', true)
    .or(`equipo_externo_nombre.ilike.${nombre.trim()}`)
    .maybeSingle()

  if (inscripto?.equipo_id) {
    return { equipo_id: inscripto.equipo_id, equipo_externo_nombre: null }
  }

  return { equipo_id: null, equipo_externo_nombre: nombre.trim() }
}

export async function importarCSVFixture(input: {
  torneo_id: string
  csv_content: string
  tenant_id: string
}): Promise<ImportResult> {
  const supabase = createServiceRoleClient()
  const errores: string[] = []
  let insertados = 0

  const parsed = Papa.parse<Record<string, string>>(input.csv_content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  if (parsed.errors.length > 0) {
    return {
      ok: false,
      insertados: 0,
      errores: parsed.errors.map((e) => `Fila ${e.row ?? '?'}: ${e.message}`),
    }
  }

  // Validate required headers
  const requiredHeaders = ['fecha', 'equipo_local', 'equipo_visitante']
  const headers = Object.keys(parsed.data[0] ?? {})
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      return { ok: false, insertados: 0, errores: [`Falta columna requerida: ${h}`] }
    }
  }

  // Verify torneo exists
  const { data: torneo } = await supabase
    .from('torneos')
    .select('id')
    .eq('id', input.torneo_id)
    .eq('tenant_id', input.tenant_id)
    .single()

  if (!torneo) {
    return { ok: false, insertados: 0, errores: ['Torneo no encontrado'] }
  }

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i] as unknown as CSVFixtureRow
    const rowNum = i + 2 // +2 because header is row 1, data starts at row 2

    // Validate fecha
    if (!row.fecha || !validarFecha(row.fecha)) {
      errores.push(`Fila ${rowNum}: fecha inválida "${row.fecha}" (formato esperado: YYYY-MM-DD)`)
      continue
    }

    // Validate hora (optional)
    if (row.hora && !validarHora(row.hora)) {
      errores.push(`Fila ${rowNum}: hora inválida "${row.hora}" (formato esperado: HH:MM)`)
      continue
    }

    if (!row.equipo_local?.trim()) {
      errores.push(`Fila ${rowNum}: equipo_local vacío`)
      continue
    }

    if (!row.equipo_visitante?.trim()) {
      errores.push(`Fila ${rowNum}: equipo_visitante vacío`)
      continue
    }

    // Resolve teams
    const local = await resolverEquipo(supabase, input.tenant_id, row.equipo_local, input.torneo_id)
    const visitante = await resolverEquipo(supabase, input.tenant_id, row.equipo_visitante, input.torneo_id)

    const hora = row.hora || '00:00'

    // Create evento (partido)
    const { data: evento, error: errEvento } = await supabase
      .from('eventos')
      .insert({
        tenant_id: input.tenant_id,
        tipo_evento_slug: 'partido',
        titulo: `${row.equipo_local.trim()} vs ${row.equipo_visitante.trim()}`,
        fecha: row.fecha,
        hora_inicio: hora + ':00',
        equipo_id: local.equipo_id,
        estado: 'programado',
      })
      .select('id')
      .single()

    if (errEvento || !evento) {
      errores.push(`Fila ${rowNum}: error creando evento — ${errEvento?.message}`)
      continue
    }

    // Create partidos_detalle
    const { error: errPartido } = await supabase
      .from('partidos_detalle')
      .insert({
        tenant_id: input.tenant_id,
        evento_id: evento.id,
        torneo_id: input.torneo_id,
        equipo_id: local.equipo_id,
        rival_texto: visitante.equipo_externo_nombre || row.equipo_visitante.trim(),
        condicion: 'local',
      })

    if (errPartido) {
      errores.push(`Fila ${rowNum}: error creando partido — ${errPartido.message}`)
      continue
    }

    insertados++
  }

  return { ok: errores.length === 0, insertados, errores }
}

export async function importarCSVResultados(input: {
  torneo_id: string
  csv_content: string
  tenant_id: string
}): Promise<ImportResult> {
  const supabase = createServiceRoleClient()
  const errores: string[] = []
  let actualizados = 0

  const parsed = Papa.parse<Record<string, string>>(input.csv_content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  if (parsed.errors.length > 0) {
    return {
      ok: false,
      insertados: 0,
      errores: parsed.errors.map((e) => `Fila ${e.row ?? '?'}: ${e.message}`),
    }
  }

  const requiredHeaders = ['fecha', 'equipo_local', 'equipo_visitante', 'marcador_local', 'marcador_visitante']
  const headers = Object.keys(parsed.data[0] ?? {})
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      return { ok: false, insertados: 0, errores: [`Falta columna requerida: ${h}`] }
    }
  }

  // Verify torneo
  const { data: torneo } = await supabase
    .from('torneos')
    .select('id')
    .eq('id', input.torneo_id)
    .eq('tenant_id', input.tenant_id)
    .single()

  if (!torneo) {
    return { ok: false, insertados: 0, errores: ['Torneo no encontrado'] }
  }

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i] as unknown as CSVResultadoRow
    const rowNum = i + 2

    if (!row.fecha || !validarFecha(String(row.fecha))) {
      errores.push(`Fila ${rowNum}: fecha inválida "${row.fecha}"`)
      continue
    }

    if (!row.equipo_local?.toString().trim() || !row.equipo_visitante?.toString().trim()) {
      errores.push(`Fila ${rowNum}: equipo_local o equipo_visitante vacío`)
      continue
    }

    const ml = parseInt(String(row.marcador_local), 10)
    const mv = parseInt(String(row.marcador_visitante), 10)
    if (isNaN(ml) || isNaN(mv) || ml < 0 || mv < 0) {
      errores.push(`Fila ${rowNum}: marcadores inválidos (${row.marcador_local} - ${row.marcador_visitante})`)
      continue
    }

    // This is a combined import: create event + partido + set results
    const local = await resolverEquipo(supabase, input.tenant_id, String(row.equipo_local), input.torneo_id)
    const visitante = await resolverEquipo(supabase, input.tenant_id, String(row.equipo_visitante), input.torneo_id)

    const hora = row.hora || '00:00'

    // Create evento
    const { data: evento, error: errEvento } = await supabase
      .from('eventos')
      .insert({
        tenant_id: input.tenant_id,
        tipo_evento_slug: 'partido',
        titulo: `${String(row.equipo_local).trim()} vs ${String(row.equipo_visitante).trim()}`,
        fecha: row.fecha,
        hora_inicio: hora + ':00',
        equipo_id: local.equipo_id,
        estado: 'finalizado',
      })
      .select('id')
      .single()

    if (errEvento || !evento) {
      errores.push(`Fila ${rowNum}: error creando evento — ${errEvento?.message}`)
      continue
    }

    // Create partidos_detalle with results
    const { error: errPartido } = await supabase
      .from('partidos_detalle')
      .insert({
        tenant_id: input.tenant_id,
        evento_id: evento.id,
        torneo_id: input.torneo_id,
        equipo_id: local.equipo_id,
        rival_texto: visitante.equipo_externo_nombre || String(row.equipo_visitante).trim(),
        condicion: 'local',
        marcador_local: ml,
        marcador_visitante: mv,
      })

    if (errPartido) {
      errores.push(`Fila ${rowNum}: error creando partido — ${errPartido.message}`)
      continue
    }

    actualizados++
  }

  return { ok: errores.length === 0, insertados: actualizados, errores }
}
