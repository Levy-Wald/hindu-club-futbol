'use server'

import { createClient } from '@/lib/supabase/server'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

const CAMPOS_VALIDOS = new Set([
  'nombre',
  'apellido',
  'nombre_completo_legal',
  'tipo_documento',
  'numero_documento',
  'dni_pais_emision',
  'cuil_cuit',
  'pasaporte_numero',
  'pasaporte_pais',
  'pasaporte_vigencia',
  'fecha_nacimiento',
  'genero',
  'nacionalidad',
  'estado_civil',
  'email_principal',
  'email_secundario',
  'telefono_principal',
  'telefono_secundario',
  'whatsapp',
  'whatsapp_emergencia',
  'direccion_calle',
  'direccion_numero',
  'direccion_piso',
  'direccion_depto',
  'direccion_barrio',
  'direccion_ciudad',
  'direccion_provincia',
  'direccion_codigo_postal',
  'direccion_pais',
  'direccion_observaciones',
  'lateralidad',
  'pie_dominante',
  'mano_dominante',
  'tipo_pisada',
  'altura_cm',
  'peso_kg',
  'fecha_medicion_fisica',
  'contextura',
  'usa_lentes',
  'tipo_lentes',
  'usa_audifono',
  'categoria_historica_max',
  'nivel_actividad_actual',
  'frecuencia_entrenamiento_semanal',
  'horas_entrenamiento_semanales',
  'profesion_ocupacion',
  'categoria_profesional',
  'empresa_actual',
  'cargo_actual',
  'industria',
  'sitio_web_profesional',
  'nivel_educativo_max',
  'titulo_carrera',
  'institucion_titulo',
  'año_graduacion',
  'estudiando_actualmente',
  'institucion_actual',
  'año_grado_actual',
  'idioma_nativo',
  'fecha_primera_relacion_club',
  'es_socio_fundador',
  'es_socio_vitalicio',
  'es_socio_honorario',
  'bautizo_club_realizado',
  'notas_internas',
  'estado',
  'created_at',
])

export interface ExportarPersonasParams {
  campos: string[]
  filtros: {
    search?: string
    estados?: string[]
    atributos?: string[]
    verEliminadas?: boolean
  }
}

export async function exportarPersonas(
  params: ExportarPersonasParams
): Promise<{ ok: boolean; data: Record<string, unknown>[] }> {
  const { campos, filtros } = params
  const {
    search = '',
    estados = [],
    verEliminadas = false,
  } = filtros

  // Validar y filtrar campos contra la whitelist
  const camposValidos = campos.filter((c) => CAMPOS_VALIDOS.has(c))

  // Siempre incluir id; deduplicar
  const camposSeleccionados = Array.from(new Set(['id', ...camposValidos]))

  const supabase = await createClient()

  let query = supabase
    .from('personas')
    .select(camposSeleccionados.join(','))
    .eq('tenant_id', TENANT_ID)

  if (!verEliminadas) {
    query = query.is('deleted_at', null)
  }

  if (search) {
    query = query.or(
      `nombre.ilike.%${search}%,apellido.ilike.%${search}%,numero_documento.ilike.%${search}%`
    )
  }

  if (estados.length > 0) {
    query = query.in('estado', estados)
  }

  query = query.order('apellido', { ascending: true }).limit(5000)

  const { data, error } = await query

  if (error) {
    return { ok: false, data: [] }
  }

  return { ok: true, data: (data ?? []) as unknown as Record<string, unknown>[] }
}
