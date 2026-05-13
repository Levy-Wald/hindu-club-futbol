/**
 * Calcula la duración en horas entre hora_inicio y hora_fin.
 * Ambos en formato HH:MM:SS o HH:MM.
 */
export function calcularDuracionHoras(hora_inicio: string, hora_fin: string): number {
  const [h1, m1] = hora_inicio.split(':').map(Number)
  const [h2, m2] = hora_fin.split(':').map(Number)
  const minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
  return Math.max(0, minutos / 60)
}

/**
 * Calcula la tarifa total = precio por hora * duración.
 * D51: tarifa calculada al confirmar, persistida.
 */
export function calcularTarifaTotal(
  precioHora: number | null,
  duracionHoras: number
): number | null {
  if (precioHora == null || precioHora <= 0) return null
  return Math.round(precioHora * duracionHoras * 100) / 100
}
