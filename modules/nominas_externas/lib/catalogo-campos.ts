// S7 + S12: catálogo en TS, no en DB. Validación compile-time.

export const CAMPOS_SOLICITABLES = {
  nombre: { slug: 'nombre', label: 'Nombre', tipo: 'text', requerido_siempre: true, inputMode: 'text' as const },
  apellido: { slug: 'apellido', label: 'Apellido', tipo: 'text', requerido_siempre: true, inputMode: 'text' as const },
  dni: { slug: 'dni', label: 'DNI', tipo: 'text', requerido_siempre: false, inputMode: 'numeric' as const },
  fecha_nacimiento: { slug: 'fecha_nacimiento', label: 'Fecha de nacimiento', tipo: 'date', requerido_siempre: false, inputMode: 'text' as const },
  telefono: { slug: 'telefono', label: 'Teléfono', tipo: 'tel', requerido_siempre: false, inputMode: 'tel' as const },
  email: { slug: 'email', label: 'Email', tipo: 'email', requerido_siempre: false, inputMode: 'email' as const },
  rol: { slug: 'rol', label: 'Rol', tipo: 'select', requerido_siempre: false, inputMode: 'text' as const },
  notas: { slug: 'notas', label: 'Notas adicionales', tipo: 'textarea', requerido_siempre: false, inputMode: 'text' as const },
} as const

export type CampoSlug = keyof typeof CAMPOS_SOLICITABLES

export const CAMPOS_SLUGS = Object.keys(CAMPOS_SOLICITABLES) as CampoSlug[]

export const ROLES_OPTIONS = [
  { value: 'jugador', label: 'Jugador/a' },
  { value: 'dt', label: 'Director Técnico' },
  { value: 'asistente_dt', label: 'Asistente DT' },
  { value: 'preparador_fisico', label: 'Preparador Físico' },
  { value: 'kinesiologo', label: 'Kinesiólogo/a' },
  { value: 'medico', label: 'Médico/a' },
  { value: 'delegado', label: 'Delegado/a' },
  { value: 'arbitro', label: 'Árbitro' },
  { value: 'acompanante', label: 'Acompañante' },
  { value: 'otro', label: 'Otro' },
]

export function validarCamposSolicitados(slugs: unknown): CampoSlug[] {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return ['nombre', 'apellido', 'dni', 'rol'] // S7: default sensato
  }
  const validos = slugs.filter(
    (s): s is CampoSlug => typeof s === 'string' && CAMPOS_SLUGS.includes(s as CampoSlug)
  )
  return Array.from(new Set(['nombre', 'apellido', ...validos])) as CampoSlug[]
}
