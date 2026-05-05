export interface ColumnModule {
  key: string
  label: string
  columns: { id: string; label: string }[]
}

export const PERSONAS_MODULES: ColumnModule[] = [
  {
    key: 'identidad',
    label: 'Identidad',
    columns: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'apellido', label: 'Apellido' },
      { id: 'tipo_documento', label: 'Tipo documento' },
      { id: 'numero_documento', label: 'Nro. documento' },
      { id: 'cuil_cuit', label: 'CUIL/CUIT' },
      { id: 'fecha_nacimiento', label: 'Fecha nacimiento' },
      { id: 'genero', label: 'Género' },
      { id: 'nacionalidad', label: 'Nacionalidad' },
      { id: 'estado_civil', label: 'Estado civil' },
    ],
  },
  {
    key: 'contacto',
    label: 'Contacto',
    columns: [
      { id: 'email_principal', label: 'Email principal' },
      { id: 'email_secundario', label: 'Email secundario' },
      { id: 'telefono_principal', label: 'Teléfono principal' },
      { id: 'telefono_secundario', label: 'Teléfono secundario' },
      { id: 'whatsapp', label: 'WhatsApp' },
    ],
  },
  {
    key: 'direccion',
    label: 'Dirección',
    columns: [
      { id: 'direccion_calle', label: 'Calle' },
      { id: 'direccion_numero', label: 'Número' },
      { id: 'direccion_piso', label: 'Piso' },
      { id: 'direccion_depto', label: 'Depto' },
      { id: 'direccion_barrio', label: 'Barrio' },
      { id: 'direccion_ciudad', label: 'Ciudad' },
      { id: 'direccion_provincia', label: 'Provincia' },
      { id: 'direccion_codigo_postal', label: 'CP' },
    ],
  },
  {
    key: 'fisico',
    label: 'Físico',
    columns: [
      { id: 'altura_cm', label: 'Altura (cm)' },
      { id: 'peso_kg', label: 'Peso (kg)' },
      { id: 'lateralidad', label: 'Lateralidad' },
      { id: 'pie_dominante', label: 'Pie dominante' },
    ],
  },
  {
    key: 'deporte',
    label: 'Deporte',
    columns: [
      { id: 'deporte_principal_slug', label: 'Deporte principal' },
      { id: 'categoria_historica_max', label: 'Categoría máx.' },
      { id: 'nivel_actividad_actual', label: 'Nivel actividad' },
    ],
  },
  {
    key: 'membresia',
    label: 'Membresía',
    columns: [
      { id: 'roles', label: 'Roles/Atributos' },
      { id: 'estado', label: 'Estado' },
      { id: 'fecha_primera_relacion_club', label: 'Primera relación' },
    ],
  },
]

export const PERSONAS_DEFAULT_COLUMNS = [
  'apellido', 'nombre', 'numero_documento', 'email_principal',
  'telefono_principal', 'roles', 'estado',
]

export const EQUIPOS_MODULES: ColumnModule[] = [
  {
    key: 'general',
    label: 'General',
    columns: [
      { id: 'categoria', label: 'Categoría' },
      { id: 'disciplina', label: 'Disciplina' },
      { id: 'modalidad', label: 'Modalidad' },
      { id: 'miembros', label: 'Miembros' },
      { id: 'estado', label: 'Estado' },
      { id: 'color', label: 'Color' },
    ],
  },
]

export const EQUIPOS_DEFAULT_COLUMNS = [
  'categoria', 'disciplina', 'modalidad', 'miembros', 'estado',
]

export const EXTERNOS_MODULES: ColumnModule[] = [
  {
    key: 'general',
    label: 'General',
    columns: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'tipo', label: 'Tipo' },
      { id: 'telefono', label: 'Teléfono' },
      { id: 'email', label: 'Email' },
      { id: 'sitio_web', label: 'Sitio web' },
      { id: 'cuit', label: 'CUIT' },
      { id: 'razon_social', label: 'Razón social' },
      { id: 'estado', label: 'Estado' },
    ],
  },
]

export const EXTERNOS_DEFAULT_COLUMNS = [
  'nombre', 'tipo', 'telefono', 'email', 'estado',
]

// Bajas
export const BAJAS_MODULES: ColumnModule[] = [
  {
    key: 'general',
    label: 'General',
    columns: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'apellido', label: 'Apellido' },
      { id: 'numero_documento', label: 'Documento' },
      { id: 'email_principal', label: 'Email' },
      { id: 'telefono_principal', label: 'Teléfono' },
      { id: 'motivo_baja', label: 'Motivo' },
      { id: 'fecha_baja', label: 'Fecha baja' },
      { id: 'motivo_baja_detalle', label: 'Detalle' },
    ],
  },
]

export const BAJAS_DEFAULT_COLUMNS = ['apellido', 'nombre', 'numero_documento', 'motivo_baja', 'fecha_baja']

// Tutores / Padres
export const TUTORES_MODULES: ColumnModule[] = [
  {
    key: 'general',
    label: 'General',
    columns: [
      { id: 'nombre', label: 'Nombre' },
      { id: 'apellido', label: 'Apellido' },
      { id: 'numero_documento', label: 'Documento' },
      { id: 'email_principal', label: 'Email' },
      { id: 'telefono_principal', label: 'Teléfono' },
      { id: 'menores', label: 'Menores vinculados' },
      { id: 'estado', label: 'Estado' },
    ],
  },
]

export const TUTORES_DEFAULT_COLUMNS = ['apellido', 'nombre', 'numero_documento', 'email_principal', 'menores', 'estado']

// Equipo plantel (jugadores dentro de un equipo)
export const EQUIPO_PLANTEL_MODULES: ColumnModule[] = [
  {
    key: 'jugador',
    label: 'Jugador',
    columns: [
      { id: 'dorsal', label: 'Dorsal' },
      { id: 'posicion', label: 'Posición' },
      { id: 'documento', label: 'Documento' },
      { id: 'email', label: 'Email' },
      { id: 'fecha_inicio', label: 'Desde' },
      { id: 'estado', label: 'Estado' },
    ],
  },
]

export const EQUIPO_PLANTEL_DEFAULT_COLUMNS = [
  'dorsal', 'posicion', 'documento', 'fecha_inicio',
]

// Equipo staff (cuerpo técnico dentro de un equipo)
export const EQUIPO_STAFF_MODULES: ColumnModule[] = [
  {
    key: 'staff',
    label: 'Staff',
    columns: [
      { id: 'rol', label: 'Rol' },
      { id: 'documento', label: 'Documento' },
      { id: 'email', label: 'Email' },
      { id: 'fecha_inicio', label: 'Desde' },
      { id: 'estado', label: 'Estado' },
    ],
  },
]

export const EQUIPO_STAFF_DEFAULT_COLUMNS = [
  'rol', 'documento', 'fecha_inicio',
]

// Padrones listing (the list of padrones)
export const PADRONES_LIST_MODULES: ColumnModule[] = [
  {
    key: 'general',
    label: 'General',
    columns: [
      { id: 'tipo', label: 'Tipo' },
      { id: 'miembros', label: 'Miembros' },
      { id: 'disciplina', label: 'Disciplina' },
      { id: 'estado', label: 'Estado' },
    ],
  },
]

export const PADRONES_LIST_DEFAULT_COLUMNS = [
  'tipo', 'miembros', 'disciplina', 'estado',
]

// Padron detail (members inside a padron)
export const PADRONES_DETAIL_MODULES: ColumnModule[] = [
  {
    key: 'miembro',
    label: 'Miembro',
    columns: [
      { id: 'apellido', label: 'Apellido' },
      { id: 'nombre', label: 'Nombre' },
      { id: 'numero_documento', label: 'Documento' },
      { id: 'email', label: 'Email' },
      { id: 'numero_socio', label: 'Nro. socio' },
      { id: 'tipo_socio', label: 'Tipo socio' },
      { id: 'estado_padron', label: 'Estado' },
      { id: 'fecha_alta', label: 'Fecha alta' },
    ],
  },
]

export const PADRONES_DETAIL_DEFAULT_COLUMNS = [
  'apellido', 'nombre', 'numero_documento', 'numero_socio', 'tipo_socio', 'estado_padron',
]
