import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { EditarPersonaInput } from '../../../_lib/schemas'

const SECCIONES = [
  {
    titulo: 'Identidad',
    campos: [
      ['nombre', 'Nombre'], ['apellido', 'Apellido'], ['nombre_completo_legal', 'Nombre legal'],
      ['tipo_documento', 'Tipo documento'], ['numero_documento', 'Nro. documento'],
      ['dni_pais_emision', 'País emisión DNI'], ['cuil_cuit', 'CUIL/CUIT'],
      ['pasaporte_numero', 'Pasaporte'], ['pasaporte_pais', 'País pasaporte'],
      ['pasaporte_vigencia', 'Vigencia pasaporte'], ['fecha_nacimiento', 'Fecha nacimiento'],
      ['genero', 'Género'], ['nacionalidad', 'Nacionalidad'], ['estado_civil', 'Estado civil'],
    ],
  },
  {
    titulo: 'Contacto',
    campos: [
      ['email_principal', 'Email principal'], ['email_secundario', 'Email secundario'],
      ['telefono_principal', 'Teléfono principal'], ['telefono_secundario', 'Teléfono secundario'],
      ['whatsapp', 'WhatsApp'], ['whatsapp_emergencia', 'WhatsApp emergencia'],
    ],
  },
  {
    titulo: 'Dirección',
    campos: [
      ['direccion_calle', 'Calle'], ['direccion_numero', 'Número'],
      ['direccion_piso', 'Piso'], ['direccion_depto', 'Depto'],
      ['direccion_barrio', 'Barrio'], ['direccion_ciudad', 'Ciudad'],
      ['direccion_provincia', 'Provincia'], ['direccion_codigo_postal', 'CP'],
      ['direccion_pais', 'País'], ['direccion_observaciones', 'Observaciones'],
    ],
  },
  {
    titulo: 'Perfil físico',
    campos: [
      ['altura_cm', 'Altura (cm)'], ['peso_kg', 'Peso (kg)'],
      ['fecha_medicion_fisica', 'Fecha medición'], ['contextura', 'Contextura'],
      ['lateralidad', 'Lateralidad'], ['pie_dominante', 'Pie dominante'],
      ['mano_dominante', 'Mano dominante'], ['tipo_pisada', 'Tipo pisada'],
      ['usa_lentes', 'Usa lentes'], ['tipo_lentes', 'Tipo lentes'],
      ['usa_audifono', 'Usa audífono'],
    ],
  },
  {
    titulo: 'Deporte',
    campos: [
      ['deporte_principal_slug', 'Deporte principal'],
      ['deportes_secundarios', 'Deportes secundarios'],
      ['años_practica_deporte_principal', 'Años práctica'],
      ['categoria_historica_max', 'Categoría máx.'],
      ['nivel_actividad_actual', 'Nivel actividad'],
      ['frecuencia_entrenamiento_semanal', 'Entrenamientos/semana'],
      ['horas_entrenamiento_semanales', 'Horas/semana'],
    ],
  },
  {
    titulo: 'Profesional',
    campos: [
      ['profesion_ocupacion', 'Profesión'], ['categoria_profesional', 'Categoría'],
      ['empresa_actual', 'Empresa'], ['cargo_actual', 'Cargo'],
      ['industria', 'Industria'], ['sitio_web_profesional', 'Sitio web'],
    ],
  },
  {
    titulo: 'Educación',
    campos: [
      ['nivel_educativo_max', 'Nivel educativo'], ['titulo_carrera', 'Título'],
      ['institucion_titulo', 'Institución'], ['año_graduacion', 'Año graduación'],
      ['estudiando_actualmente', 'Estudia actualmente'],
      ['institucion_actual', 'Institución actual'], ['año_grado_actual', 'Año/grado'],
      ['idioma_nativo', 'Idioma nativo'],
    ],
  },
  {
    titulo: 'Membresía',
    campos: [
      ['fecha_primera_relacion_club', 'Primera relación club'],
      ['es_socio_fundador', 'Socio fundador'], ['es_socio_vitalicio', 'Socio vitalicio'],
      ['es_socio_honorario', 'Socio honorario'], ['bautizo_club_realizado', 'Bautizo realizado'],
    ],
  },
  {
    titulo: 'Notas',
    campos: [['notas_internas', 'Notas internas']],
  },
]

interface FichaTotalProps {
  form: EditarPersonaInput
  persona: Record<string, unknown>
}

export function SeccionFichaTotal({ form, persona }: FichaTotalProps) {
  function valor(key: string): string {
    const v = form[key as keyof EditarPersonaInput] ?? persona[key]
    if (v === null || v === undefined || v === '') return '—'
    if (typeof v === 'boolean') return v ? 'Sí' : 'No'
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
    return String(v)
  }

  return (
    <div className="space-y-4">
      {SECCIONES.map((sec) => (
        <Card key={sec.titulo}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{sec.titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
              {sec.campos.map(([key, label]) => (
                <div key={key} className="flex justify-between py-1 border-b border-dashed last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-medium text-right max-w-[60%] truncate">{valor(key)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
