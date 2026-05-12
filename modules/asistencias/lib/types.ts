export type EstadoAsistencia =
  | 'pendiente'
  | 'presente'
  | 'ausente'
  | 'tarde'
  | 'justificado'
  | 'lesionado'

export type CategoriaRolEquipo =
  | 'deportivo'
  | 'cuerpo_tecnico'
  | 'comision_delegados'

export type RolEnEquipo = {
  rol_equipo_slug: string
  rol_nombre: string
  categoria: CategoriaRolEquipo
  dorsal: number | null
  posicion: string | null
  es_capitan: boolean
  es_subcapitan: boolean
}

export type PersonaInvitada = {
  persona_id: string
  nombre: string
  apellido: string
  foto_url: string | null
  roles: RolEnEquipo[]
  asistencia: {
    id: string | null
    estado: EstadoAsistencia
    nota: string | null
    respondido_at: string | null
  }
  evento_invitado_id: string
  origen_invitacion: 'manual' | 'auto_plantel' | 'auto_rol_evento'
}

export type InvitadosPorCategoria = {
  deportivo: PersonaInvitada[]
  cuerpo_tecnico: PersonaInvitada[]
  comision_delegados: PersonaInvitada[]
}

export type EntidadInvitada = {
  entidad_id: string
  nombre: string
  tipo: string
  evento_invitado_id: string
  marca_asistencia: boolean
  asistencia: {
    id: string | null
    estado: EstadoAsistencia
    nota: string | null
    respondido_at: string | null
  }
}

export type EquipoInvitado = {
  equipo_id: string
  nombre: string
  evento_invitado_id: string
  marca_asistencia: boolean
  asistencia: {
    id: string | null
    estado: EstadoAsistencia
    nota: string | null
    respondido_at: string | null
  }
}

export type InvitadosCompleto = InvitadosPorCategoria & {
  entidades: EntidadInvitada[]
  equipos: EquipoInvitado[]
}

export const ESTADOS_ASISTENCIA: {
  valor: EstadoAsistencia
  label: string
  shortLabel: string
  color: string
}[] = [
  { valor: 'presente', label: 'Presente', shortLabel: 'P', color: 'bg-success-600 text-white' },
  { valor: 'ausente', label: 'Ausente', shortLabel: 'A', color: 'bg-error-600 text-white' },
  { valor: 'tarde', label: 'Tarde', shortLabel: 'T', color: 'bg-warning-500 text-white' },
  { valor: 'justificado', label: 'Justificado', shortLabel: 'J', color: 'bg-info-500 text-white' },
  { valor: 'lesionado', label: 'Lesionado', shortLabel: 'L', color: 'bg-neutral-500 text-white' },
]
