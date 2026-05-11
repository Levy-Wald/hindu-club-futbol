export const VARIABLES_EJEMPLO: Record<string, string> = {
  nombre: 'Juan Perez',
  apellido: 'Perez',
  nombre_completo: 'Juan Perez',
  email: 'juan.perez@ejemplo.com',
  monto: '15.000',
  monto_formateado: '$ 15.000,00',
  monto_final: '15.000',
  monto_neto: '45.000',
  fecha: '11/05/2026',
  fecha_vencimiento: '30/05/2026',
  fecha_emision: '01/05/2026',
  fecha_inicio: '01/03/2026',
  equipo: 'Open Junior +28',
  disciplina: 'Futbol',
  club: 'Hindu Club',
  club_nombre: 'Hindu Club',
  periodo: '2026-05',
  numero_socio: '1234',
  numero_cuota: '3',
  plan_nombre: 'Fondo Futbol 2026',
  padron_nombre: 'Socios Activos',
  tipo_contrato: 'Prestacion de servicios',
  tipo_autorizacion: 'Salida del club',
  titulo: 'Entrenamiento Sub-15',
  hora: '18:00',
  link_pago: 'https://hindu-club.vercel.app/pagar/abc123',
  url_accion: 'https://hindu-club.vercel.app/admin/persona/abc123',
}

export function getVariableEjemplo(variable: string): string {
  return VARIABLES_EJEMPLO[variable] ?? `[var: ${variable}]`
}

export function getVariablesEjemploCompleto(variablesDisponibles: string[]): Record<string, string> {
  return Object.fromEntries(
    variablesDisponibles.map(v => [v, getVariableEjemplo(v)])
  )
}
