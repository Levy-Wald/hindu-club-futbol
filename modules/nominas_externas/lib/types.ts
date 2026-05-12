export type NivelValidacion = 'L0' | 'L1' | 'L2' | 'L3' | 'L4'

export type EstadoNomina = 'pendiente' | 'completada' | 'caducada' | 'cancelada'

export type MatchDecision =
  | 'auto_match'
  | 'posible_match'
  | 'crear_nueva'
  | 'rechazada'
  | 'duplicada_socio'

export type TipoItem = 'persona' | 'entidad'

export type CampoSlug =
  | 'nombre'
  | 'apellido'
  | 'dni'
  | 'fecha_nacimiento'
  | 'telefono'
  | 'email'
  | 'rol'
  | 'notas'

export type NominaExterna = {
  id: string
  tenant_id: string
  token: string
  evento_id: string
  equipo_destino_id: string | null
  entidad_destino_id: string | null
  nombre_contacto: string | null
  email_contacto: string | null
  telefono_contacto: string | null
  campos_solicitados: CampoSlug[]
  nivel_validacion: NivelValidacion
  caduca_at: string
  estado: EstadoNomina
  submissions_count: number
  max_submissions: number
  created_at: string
  created_by_persona_id: string | null
  completada_at: string | null
}

export type NominaItem = {
  id: string
  nomina_externa_id: string
  tenant_id: string
  tipo: TipoItem
  persona_input: Record<string, string> | null
  entidad_input: Record<string, string> | null
  persona_id_match: string | null
  entidad_id_match: string | null
  persona_id_creada: string | null
  entidad_id_creada: string | null
  match_confidence: number | null
  match_decision: MatchDecision | null
  procesada: boolean
  created_at: string
  procesada_at: string | null
  procesada_por_persona_id: string | null
  notas_admin: string | null
}

export type NominaConEvento = NominaExterna & {
  evento: { titulo: string; fecha: string; hora_inicio: string | null }
  equipo_destino: { nombre: string } | null
  entidad_destino: { nombre: string } | null
}

export type NominaPublicInfo = {
  campos_solicitados: CampoSlug[]
  nivel_validacion: NivelValidacion
  evento: { titulo: string; fecha: string; hora_inicio: string | null }
  contexto: string | null
  caduca_at: string
}

export type PersonaInput = {
  nombre: string
  apellido: string
  dni?: string
  fecha_nacimiento?: string
  telefono?: string
  email?: string
  rol?: string
  notas?: string
}

export type EntidadInput = {
  nombre: string
  contacto?: string
  notas?: string
}

export type SubmitPayload = {
  token: string
  cargador_email?: string
  personas: PersonaInput[]
  entidades: EntidadInput[]
}
