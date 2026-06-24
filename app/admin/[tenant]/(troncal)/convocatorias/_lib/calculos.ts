// F6.8 — Lógica pura del planificador de partido.

export type EstadoConvocatoria = 'titular' | 'suplente' | 'convocado' | null

export interface ResumenConvocatoria {
  titulares: number
  suplentes: number
  convocados: number // estado 'convocado' (reserva)
  total: number // total de citados (titular + suplente + convocado)
}

/** Cuenta jugadores por estado. `null`/no-convocado no suma al total. */
export function resumenConvocatoria(jugadores: { estado: EstadoConvocatoria }[]): ResumenConvocatoria {
  let titulares = 0
  let suplentes = 0
  let convocados = 0
  for (const j of jugadores) {
    if (j.estado === 'titular') titulares++
    else if (j.estado === 'suplente') suplentes++
    else if (j.estado === 'convocado') convocados++
  }
  return { titulares, suplentes, convocados, total: titulares + suplentes + convocados }
}

// --- Respuesta del jugador a la convocatoria (disponibilidad) ---

export type RespuestaConvocatoria = 'pendiente' | 'aceptado' | 'rechazado' | 'tentativa'

export const RESPUESTAS_VALIDAS: RespuestaConvocatoria[] = ['pendiente', 'aceptado', 'rechazado', 'tentativa']

export interface ResumenRespuestas {
  aceptados: number
  rechazados: number
  tentativa: number
  pendientes: number
  total: number // total de citados
}

/** Cuenta las respuestas de los citados (solo jugadores con estado != null). */
export function resumenRespuestas(
  jugadores: { estado: EstadoConvocatoria; respuesta?: RespuestaConvocatoria }[],
): ResumenRespuestas {
  let aceptados = 0
  let rechazados = 0
  let tentativa = 0
  let pendientes = 0
  let total = 0
  for (const j of jugadores) {
    if (j.estado == null) continue // no citado → no cuenta
    total++
    switch (j.respuesta ?? 'pendiente') {
      case 'aceptado': aceptados++; break
      case 'rechazado': rechazados++; break
      case 'tentativa': tentativa++; break
      default: pendientes++
    }
  }
  return { aceptados, rechazados, tentativa, pendientes, total }
}

export function esRespuestaValida(r: string): r is RespuestaConvocatoria {
  return (RESPUESTAS_VALIDAS as string[]).includes(r)
}

/**
 * ¿El jugador puede responder la convocatoria?
 * - Debe estar citado (estado != null).
 * - El partido no debe haber pasado (fecha_inicio >= hoy).
 * `hoyISO` es la fecha de referencia (YYYY-MM-DD) para testear sin reloj.
 */
export function puedeResponderConvocatoria(input: {
  estado: EstadoConvocatoria
  fechaInicio: string | null
  hoyISO: string
}): { ok: boolean; motivo?: string } {
  if (input.estado == null) return { ok: false, motivo: 'No estás convocado a este partido.' }
  if (input.fechaInicio && input.fechaInicio < input.hoyISO) {
    return { ok: false, motivo: 'El partido ya pasó.' }
  }
  return { ok: true }
}
