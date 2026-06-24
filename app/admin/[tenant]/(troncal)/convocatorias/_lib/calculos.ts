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
