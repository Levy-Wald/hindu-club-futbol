// F1.4 — Lógica pura de recordatorios (sin DB), para poder testearla.
// El motor con efectos (consulta + notificaciones) vive en recordatorios.ts.

import type { Recordatorio } from './types'

export const VENTANA_MS = 70 * 60 * 1000 // 70 min: cubre el gap de un cron horario con margen
export const OFFSET_AR = '-03:00' // hora local del club (Argentina, sin DST)

/** Inicio del evento en ms epoch (fecha + hora en hora local AR). NaN si inválido. */
export function inicioEventoMs(fechaInicio: string, horaInicio: string | null): number {
  const hora = (horaInicio ?? '00:00:00').slice(0, 8)
  return new Date(`${fechaInicio}T${hora}${OFFSET_AR}`).getTime()
}

/**
 * ¿Algún recordatorio habilitado debe dispararse ahora? Dispara cuando `ahora`
 * cae en [fireTime, fireTime+VENTANA), con fireTime = inicio - minutos_antes, y
 * el evento todavía no empezó.
 */
export function recordatorioDispara(
  startMs: number,
  recordatorios: Recordatorio[],
  ahoraMs: number,
): boolean {
  if (Number.isNaN(startMs) || ahoraMs >= startMs) return false
  return recordatorios.some((r) => {
    if (!r || !r.habilitado || typeof r.minutos_antes !== 'number') return false
    const fire = startMs - r.minutos_antes * 60_000
    return ahoraMs >= fire && ahoraMs < fire + VENTANA_MS
  })
}
