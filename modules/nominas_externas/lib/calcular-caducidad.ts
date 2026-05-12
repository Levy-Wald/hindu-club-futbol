/**
 * S9: Caducidad explícita con 3 niveles de fallback.
 * D2: 24h post-evento.
 */
export function calcularCaducidad(evento: {
  fecha: string
  hora_inicio: string | null
  hora_fin: string | null
}): Date {
  // Nivel 1: usar hora_fin si existe
  if (evento.hora_fin) {
    const finReal = new Date(`${evento.fecha}T${evento.hora_fin}`)
    return new Date(finReal.getTime() + 24 * 60 * 60 * 1000)
  }

  // Nivel 2: hora_inicio + 3h como estimación
  if (evento.hora_inicio) {
    const inicioReal = new Date(`${evento.fecha}T${evento.hora_inicio}`)
    return new Date(inicioReal.getTime() + 27 * 60 * 60 * 1000) // +3h +24h
  }

  // Nivel 3: fin del día del evento + 24h
  const fechaEvento = new Date(`${evento.fecha}T23:59:59`)
  return new Date(fechaEvento.getTime() + 24 * 60 * 60 * 1000)
}
