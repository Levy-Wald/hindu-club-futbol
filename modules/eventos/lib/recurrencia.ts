// F1.4 — Motor de recurrencia de eventos.
// Expande periodicidad + dias_semana + fecha_fin_recurrencia en una lista de
// fechas hijas (YYYY-MM-DD), acotada a fecha_fin_recurrencia o, si no hay, a
// 1 año desde el inicio, con tope de seguridad MAX_INSTANCIAS_RECURRENCIA.
// Funciones puras (sin DB) para poder testearlas. Toda la aritmética en UTC
// para evitar corrimientos por timezone.

import type { Periodicidad } from './types'

export const PERIODICIDADES_RECURRENTES: Periodicidad[] = [
  'diario',
  'semanal',
  'dias_semana',
  'quincenal',
  'mensual',
  'anual',
]

export const MAX_INSTANCIAS_RECURRENCIA = 365

function parse(s: string): Date {
  return new Date(s + 'T00:00:00Z')
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCDate(c.getUTCDate() + n)
  return c
}
function addMonths(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCMonth(c.getUTCMonth() + n)
  return c
}
function addYears(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCFullYear(c.getUTCFullYear() + n)
  return c
}

/** Índice 0=lunes … 6=domingo (alineado con la máscara `dias_semana` de la UI). */
function indiceDiaSemana(d: Date): number {
  const js = d.getUTCDay() // 0=domingo … 6=sábado
  return js === 0 ? 6 : js - 1
}

/** dia_semana 1=lunes … 7=domingo (columna `eventos.dia_semana`). */
export function diaSemanaDe(fecha: string): number {
  return indiceDiaSemana(parse(fecha)) + 1
}

/** Suma `n` días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD. */
export function sumarDias(fecha: string, n: number): string {
  return toISO(addDays(parse(fecha), n))
}

/** Diferencia en días entre dos fechas YYYY-MM-DD (fin - inicio). 0 si falta fin. */
export function duracionDias(fechaInicio: string, fechaFin: string | null | undefined): number {
  if (!fechaFin) return 0
  const ms = parse(fechaFin).getTime() - parse(fechaInicio).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/**
 * Devuelve las fechas hijas de una serie recurrente (sin incluir la del evento
 * padre). Vacío si la periodicidad no es recurrente.
 */
export function fechasDeRecurrencia(
  fechaInicio: string,
  periodicidad: Periodicidad,
  diasSemana: boolean[] | null,
  fechaFinRecurrencia: string | null,
  max: number = MAX_INSTANCIAS_RECURRENCIA,
): string[] {
  if (!PERIODICIDADES_RECURRENTES.includes(periodicidad)) return []

  const start = parse(fechaInicio)
  const hardEnd = fechaFinRecurrencia ? parse(fechaFinRecurrencia) : addYears(start, 1)
  if (hardEnd < start) return []

  const fechas: string[] = []

  if (periodicidad === 'dias_semana') {
    const mask = diasSemana ?? []
    if (!mask.some(Boolean)) return []
    let cursor = addDays(start, 1)
    while (cursor <= hardEnd && fechas.length < max) {
      if (mask[indiceDiaSemana(cursor)]) fechas.push(toISO(cursor))
      cursor = addDays(cursor, 1)
    }
    return fechas
  }

  const step: (d: Date) => Date =
    periodicidad === 'diario'
      ? (d) => addDays(d, 1)
      : periodicidad === 'semanal'
        ? (d) => addDays(d, 7)
        : periodicidad === 'quincenal'
          ? (d) => addDays(d, 14)
          : periodicidad === 'mensual'
            ? (d) => addMonths(d, 1)
            : (d) => addYears(d, 1) // anual

  let cursor = step(start)
  while (cursor <= hardEnd && fechas.length < max) {
    fechas.push(toISO(cursor))
    cursor = step(cursor)
  }
  return fechas
}
