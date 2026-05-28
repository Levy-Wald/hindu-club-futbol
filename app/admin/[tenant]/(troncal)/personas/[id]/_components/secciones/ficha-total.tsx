'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Loader2, ChevronDown, ChevronRight, FileText, Image as ImageIcon,
  Download, Upload, Check, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getVinculoLabel } from '@/lib/vinculos/labels'
import type { EditarPersonaInput } from '../../../_lib/schemas'

// --- Types ---

interface EquipoMembership {
  id: string
  equipo_id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  fecha_inicio: string | null
  activo: boolean
  equipo: {
    id: string
    nombre: string
    disciplina_slug: string
    modalidad: string | null
    categorias_equipo: { nombre_display: string } | null
  } | null
}

interface Vinculo {
  id: string
  tipo_vinculo_slug: string
  activo: boolean
  fecha_inicio: string | null
  notas: string | null
  destino?: { id: string; nombre: string; apellido: string; numero_documento: string | null }
  origen?: { id: string; nombre: string; apellido: string; numero_documento: string | null }
}

interface TrayectoriaClub {
  id: string
  club_nombre: string
  club_pais: string | null
  disciplina_slug: string | null
  categoria: string | null
  posicion: string | null
  fecha_desde: string | null
  fecha_hasta: string | null
  partidos_jugados: number | null
  goles: number | null
}

interface Logro {
  id: string
  tipo_logro: string
  descripcion: string
  torneo_nombre: string | null
  equipo_nombre: string | null
  anio: number | null
}

interface DatosMedicos {
  grupo_sanguineo: string
  factor_rh: string
  donante_organos: boolean
  alergias_medicamentos: string[]
  alergias_alimentarias: string[]
  alergias_otras: string
  antecedentes_medicos: string
  enfermedades_cronicas: string[]
  vacunas_obligatorias_dia: boolean
  embarazo: boolean
  fecha_ultima_revision_medica: string
  medico_cabecera_nombre: string
  medico_cabecera_telefono: string
  notas_medicas: string
}

interface Lesion {
  id: string
  tipo_lesion: string | null
  zona_corporal: string | null
  gravedad: string | null
  fecha_inicio: string | null
  fecha_alta_medica: string | null
  recuperada: boolean
  descripcion: string | null
}

interface DocIdentidad {
  id: string
  tipo_documento: string
  archivo_url: string
  fecha_vencimiento: string | null
  notas: string | null
}

interface DocMedico {
  id: string
  tipo_estudio_slug: string
  archivo_url: string
  fecha_estudio: string | null
  fecha_vencimiento: string | null
  resultado: string | null
  medico_firmante_nombre: string | null
}

interface Vehiculo {
  id: string
  marca: string
  modelo: string
  patente: string
  color: string | null
  permite_ingreso_club: boolean
}

interface Adjunto {
  id: string
  tipo: string
  label: string
  url: string
  seccion: string
}

// --- Field definitions for flat persona data ---

const SECCIONES_FLAT = [
  {
    key: 'identidad',
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
    key: 'contacto',
    titulo: 'Contacto',
    campos: [
      ['email_principal', 'Email principal'], ['email_secundario', 'Email secundario'],
      ['telefono_principal', 'Teléfono principal'], ['telefono_secundario', 'Teléfono secundario'],
      ['whatsapp', 'WhatsApp'], ['whatsapp_emergencia', 'WhatsApp emergencia'],
    ],
  },
  {
    key: 'direccion',
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
    key: 'fisico',
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
    key: 'deporte',
    titulo: 'Actividad deportiva',
    campos: [
      ['categoria_historica_max', 'Categoría máx.'],
      ['nivel_actividad_actual', 'Nivel actividad'],
      ['frecuencia_entrenamiento_semanal', 'Entrenamientos/semana'],
      ['horas_entrenamiento_semanales', 'Horas/semana'],
    ],
  },
  {
    key: 'profesional',
    titulo: 'Profesional',
    campos: [
      ['profesion_ocupacion', 'Profesión'], ['categoria_profesional', 'Categoría'],
      ['empresa_actual', 'Empresa'], ['cargo_actual', 'Cargo'],
      ['industria', 'Industria'], ['sitio_web_profesional', 'Sitio web'],
    ],
  },
  {
    key: 'educacion',
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
    key: 'membresia',
    titulo: 'Membresía',
    campos: [
      ['fecha_primera_relacion_club', 'Primera relación club'],
      ['es_socio_fundador', 'Socio fundador'], ['es_socio_vitalicio', 'Socio vitalicio'],
      ['es_socio_honorario', 'Socio honorario'], ['bautizo_club_realizado', 'Bautizo realizado'],
    ],
  },
  {
    key: 'notas',
    titulo: 'Notas',
    campos: [['notas_internas', 'Notas internas']],
  },
]

const SECCIONES_RELATED = [
  'equipos', 'trayectoria', 'logros', 'salud', 'lesiones',
  'docs_identidad', 'docs_medicos', 'vinculos', 'vehiculos',
] as const

type RelatedKey = (typeof SECCIONES_RELATED)[number]

const RELATED_LABELS: Record<RelatedKey, string> = {
  equipos: 'Equipos',
  trayectoria: 'Trayectoria clubes',
  logros: 'Logros deportivos',
  salud: 'Datos médicos',
  lesiones: 'Lesiones',
  docs_identidad: 'Documentos de identidad',
  docs_medicos: 'Documentos médicos',
  vinculos: 'Vínculos',
  vehiculos: 'Vehículos',
}

const ALL_SECTION_KEYS = [
  ...SECCIONES_FLAT.map((s) => s.key),
  ...SECCIONES_RELATED,
  'adjuntos',
]

// --- Props ---

interface FichaTotalProps {
  form: EditarPersonaInput
  persona: Record<string, unknown>
  personaId: string
  tenantId: string
}

export function SeccionFichaTotal({ form, persona, personaId, tenantId }: FichaTotalProps) {
  const [loading, setLoading] = useState(true)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(ALL_SECTION_KEYS))

  // Related data
  const [equipos, setEquipos] = useState<EquipoMembership[]>([])
  const [trayectoria, setTrayectoria] = useState<TrayectoriaClub[]>([])
  const [logros, setLogros] = useState<Logro[]>([])
  const [datosMedicos, setDatosMedicos] = useState<DatosMedicos | null>(null)
  const [lesiones, setLesiones] = useState<Lesion[]>([])
  const [docsIdentidad, setDocsIdentidad] = useState<DocIdentidad[]>([])
  const [docsMedicos, setDocsMedicos] = useState<DocMedico[]>([])
  const [vinculos, setVinculos] = useState<{ tipo: string; persona: string; notas: string | null }[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])

  // File uploader
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Multi-select download
  const [selectedAdjuntos, setSelectedAdjuntos] = useState<Set<string>>(new Set())

  // Load all related data
  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Extract equipos from persona prop
      const personaEquipos = (persona.personas_equipos ?? []) as EquipoMembership[]
      setEquipos(personaEquipos.filter((e) => e.activo))

      // Extract vinculos from persona prop
      const vinculosOrigen = ((persona.personas_vinculos_origen ?? []) as Vinculo[]).filter((v) => v.activo)
      const vinculosDestino = ((persona.personas_vinculos_destino ?? []) as Vinculo[]).filter((v) => v.activo)
      const allVinculos = [
        ...vinculosOrigen.map((v) => ({
          tipo: getVinculoLabel(v.tipo_vinculo_slug, 'directo'),
          persona: v.destino ? `${v.destino.apellido}, ${v.destino.nombre}` : '—',
          notas: v.notas,
        })),
        ...vinculosDestino.map((v) => ({
          tipo: getVinculoLabel(v.tipo_vinculo_slug, 'inverso'),
          persona: v.origen ? `${v.origen.apellido}, ${v.origen.nombre}` : '—',
          notas: v.notas,
        })),
      ]
      setVinculos(allVinculos)

      // Parallel fetch of related data from DB/API
      const [trayectoriaRes, saludRes, docsIdRes, docsMedRes, vehiculosRes] = await Promise.all([
        fetch(`/api/historial-deportivo/${personaId}`).then((r) => r.ok ? r.json() : { trayectoria: [], logros: [] }).catch(() => ({ trayectoria: [], logros: [] })),
        supabase.from('personas_datos_medicos').select('*').eq('persona_id', personaId).maybeSingle(),
        supabase.from('personas_documentos_identidad').select('id, tipo_documento, archivo_url, fecha_vencimiento, notas').eq('persona_id', personaId).eq('activo', true).order('created_at', { ascending: false }),
        supabase.from('personas_documentos_medicos').select('id, tipo_estudio_slug, archivo_url, fecha_estudio, fecha_vencimiento, resultado, medico_firmante_nombre').eq('persona_id', personaId).eq('activo', true).order('created_at', { ascending: false }),
        supabase.from('personas_vehiculos').select('id, marca, modelo, patente, color, permite_ingreso_club').eq('persona_id', personaId).is('deleted_at', null),
      ])

      // Also fetch lesiones
      const { data: lesionesData } = await supabase
        .from('personas_lesiones')
        .select('id, tipo_lesion, zona_corporal, gravedad, fecha_inicio, fecha_alta_medica, recuperada, descripcion')
        .eq('persona_id', personaId)
        .is('deleted_at', null)
        .order('fecha_inicio', { ascending: false })

      setTrayectoria(trayectoriaRes.trayectoria ?? [])
      setLogros(trayectoriaRes.logros ?? [])
      if (saludRes.data) setDatosMedicos(saludRes.data)
      setDocsIdentidad(docsIdRes.data ?? [])
      setDocsMedicos(docsMedRes.data ?? [])
      setVehiculos(vehiculosRes.data ?? [])
      setLesiones(lesionesData ?? [])

      // Build adjuntos list from all sources
      const allAdjuntos: Adjunto[] = []
      if (persona.foto_perfil_url) {
        allAdjuntos.push({ id: 'foto_perfil', tipo: 'imagen', label: 'Foto de perfil', url: persona.foto_perfil_url as string, seccion: 'Identidad' })
      }
      for (const doc of (docsIdRes.data ?? [])) {
        const isPhoto = ['foto_frente', 'foto_dorso'].includes(doc.tipo_documento)
        allAdjuntos.push({
          id: `doc_id_${doc.id}`,
          tipo: isPhoto ? 'imagen' : 'documento',
          label: doc.tipo_documento.replace(/_/g, ' '),
          url: doc.archivo_url,
          seccion: 'Documentos identidad',
        })
      }
      for (const doc of (docsMedRes.data ?? [])) {
        allAdjuntos.push({
          id: `doc_med_${doc.id}`,
          tipo: 'documento',
          label: doc.tipo_estudio_slug.replace(/_/g, ' '),
          url: doc.archivo_url,
          seccion: 'Documentos médicos',
        })
      }
      // Logro evidences
      for (const logro of (trayectoriaRes.logros ?? [])) {
        if (logro.archivo_evidencia_url) {
          allAdjuntos.push({
            id: `logro_${logro.id}`,
            tipo: 'documento',
            label: `Evidencia: ${logro.descripcion}`,
            url: logro.archivo_evidencia_url,
            seccion: 'Logros',
          })
        }
      }
      setAdjuntos(allAdjuntos)

      setLoading(false)
    }
    load()
  }, [personaId, persona])

  // --- Helpers ---

  function valor(key: string): string {
    const v = form[key as keyof EditarPersonaInput] ?? persona[key]
    if (v === null || v === undefined || v === '') return '—'
    if (typeof v === 'boolean') return v ? 'Sí' : 'No'
    if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
    return String(v)
  }

  function toggleSection(key: string) {
    setVisibleSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function showAll() {
    setVisibleSections(new Set(ALL_SECTION_KEYS))
  }

  function hideAll() {
    setVisibleSections(new Set())
  }

  function toggleAdjunto(id: string) {
    setSelectedAdjuntos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllAdjuntos() {
    if (selectedAdjuntos.size === adjuntos.length) {
      setSelectedAdjuntos(new Set())
    } else {
      setSelectedAdjuntos(new Set(adjuntos.map((a) => a.id)))
    }
  }

  async function downloadAdjunto(url: string, filename: string) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  async function downloadSelected() {
    const selected = adjuntos.filter((a) => selectedAdjuntos.has(a.id))
    for (const adj of selected) {
      await downloadAdjunto(adj.url, adj.label)
    }
    toast.success(`${selected.length} archivo(s) descargado(s)`)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
    ]
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(file.type) && !['xlsx', 'xls', 'pdf'].includes(ext ?? '')) {
      toast.error('Solo se permiten archivos XLSX, XLS o PDF')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const fileName = `ficha_${Date.now()}.${ext}`
    const path = `${tenantId}/${personaId}/ficha/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('private-documentos')
      .upload(path, file)

    if (uploadError) {
      toast.error(`Error subiendo: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data: urlData } = await supabase.storage
      .from('private-documentos')
      .createSignedUrl(path, 60 * 60 * 24 * 365)

    const url = urlData?.signedUrl ?? path

    // Store as identity doc with type "ficha_adjunto"
    const { data, error } = await supabase
      .from('personas_documentos_identidad')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        tipo_documento: 'ficha_adjunto',
        archivo_url: url,
        notas: file.name,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
    } else {
      setDocsIdentidad((prev) => [data, ...prev])
      setAdjuntos((prev) => [
        ...prev,
        { id: `doc_id_${data.id}`, tipo: 'documento', label: file.name, url, seccion: 'Ficha adjuntos' },
      ])
      toast.success('Archivo subido')
    }
    setUploading(false)
    e.target.value = ''
  }

  // --- Filter bar ---

  function SectionToggle({ sectionKey, label }: { sectionKey: string; label: string }) {
    const visible = visibleSections.has(sectionKey)
    return (
      <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
        <Checkbox
          checked={visible}
          onCheckedChange={() => toggleSection(sectionKey)}
          className="h-3.5 w-3.5"
        />
        <span className={visible ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      </label>
    )
  }

  // --- Render ---

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Secciones visibles</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={showAll}>Todas</Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={hideAll}>Ninguna</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SECCIONES_FLAT.map((sec) => (
              <SectionToggle key={sec.key} sectionKey={sec.key} label={sec.titulo} />
            ))}
            {SECCIONES_RELATED.map((key) => (
              <SectionToggle key={key} sectionKey={key} label={RELATED_LABELS[key]} />
            ))}
            <SectionToggle sectionKey="adjuntos" label="Referencia adjuntos" />
          </div>
        </CardContent>
      </Card>

      {/* FLAT PERSONA SECTIONS */}
      {SECCIONES_FLAT.map((sec) => {
        if (!visibleSections.has(sec.key)) return null
        return (
          <Card key={sec.key}>
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
        )
      })}

      {/* EQUIPOS */}
      {visibleSections.has('equipos') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Equipos ({equipos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {equipos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin equipos asignados.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {equipos.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 border rounded-md p-2 text-xs">
                    {e.dorsal !== null && <Badge variant="outline" className="text-[10px]">{e.dorsal}</Badge>}
                    <span className="font-medium">{e.equipo?.nombre ?? '—'}</span>
                    <span className="text-muted-foreground capitalize">{e.rol_equipo_slug.replace(/_/g, ' ')}</span>
                    {e.equipo?.categorias_equipo && (
                      <Badge variant="secondary" className="text-[10px]">{e.equipo.categorias_equipo.nombre_display}</Badge>
                    )}
                    {e.posicion && <span className="text-muted-foreground">· {e.posicion}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TRAYECTORIA */}
      {visibleSections.has('trayectoria') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Trayectoria clubes ({trayectoria.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {trayectoria.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin trayectoria registrada.</p>
            ) : (
              <div className="divide-y">
                {trayectoria.map((t) => (
                  <div key={t.id} className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
                    <div>
                      <span className="font-medium">{t.club_nombre}</span>
                      {t.club_pais && <span className="text-muted-foreground"> ({t.club_pais})</span>}
                    </div>
                    <div className="text-muted-foreground">
                      {t.fecha_desde && t.fecha_desde}
                      {t.fecha_hasta && ` — ${t.fecha_hasta}`}
                      {t.categoria && ` · ${t.categoria}`}
                    </div>
                    <div className="text-muted-foreground">
                      {t.posicion && `Pos: ${t.posicion}`}
                      {t.partidos_jugados != null && ` · ${t.partidos_jugados} PJ`}
                      {t.goles != null && ` · ${t.goles} goles`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LOGROS */}
      {visibleSections.has('logros') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Logros deportivos ({logros.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {logros.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin logros registrados.</p>
            ) : (
              <div className="divide-y">
                {logros.map((l) => (
                  <div key={l.id} className="py-2 flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="text-[10px] shrink-0">{l.tipo_logro.replace(/_/g, ' ')}</Badge>
                    <span className="font-medium">{l.descripcion}</span>
                    {l.torneo_nombre && <span className="text-muted-foreground">· {l.torneo_nombre}</span>}
                    {l.anio && <span className="text-muted-foreground">· {l.anio}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SALUD */}
      {visibleSections.has('salud') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Datos médicos</CardTitle>
          </CardHeader>
          <CardContent>
            {!datosMedicos ? (
              <p className="text-xs text-muted-foreground">Sin datos médicos registrados.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                {([
                  ['grupo_sanguineo', 'Grupo sanguíneo'],
                  ['factor_rh', 'Factor RH'],
                  ['donante_organos', 'Donante órganos'],
                  ['alergias_medicamentos', 'Alergias medicamentos'],
                  ['alergias_alimentarias', 'Alergias alimentarias'],
                  ['alergias_otras', 'Otras alergias'],
                  ['antecedentes_medicos', 'Antecedentes'],
                  ['enfermedades_cronicas', 'Enfermedades crónicas'],
                  ['vacunas_obligatorias_dia', 'Vacunas al día'],
                  ['fecha_ultima_revision_medica', 'Última revisión'],
                  ['medico_cabecera_nombre', 'Médico cabecera'],
                  ['medico_cabecera_telefono', 'Tel. médico'],
                ] as [string, string][]).map(([key, label]) => {
                  const raw = datosMedicos[key as keyof DatosMedicos]
                  let display = '—'
                  if (typeof raw === 'boolean') display = raw ? 'Sí' : 'No'
                  else if (Array.isArray(raw)) display = raw.length ? raw.join(', ') : '—'
                  else if (raw) display = String(raw)
                  return (
                    <div key={key} className="flex justify-between py-1 border-b border-dashed last:border-0">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="text-xs font-medium text-right max-w-[60%] truncate">{display}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* LESIONES */}
      {visibleSections.has('lesiones') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Lesiones ({lesiones.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {lesiones.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin lesiones registradas.</p>
            ) : (
              <div className="divide-y">
                {lesiones.map((l) => (
                  <div key={l.id} className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{l.tipo_lesion ?? '—'}</span>
                      {l.zona_corporal && <span className="text-muted-foreground">({l.zona_corporal})</span>}
                    </div>
                    <div className="text-muted-foreground">
                      {l.fecha_inicio && `Desde: ${l.fecha_inicio}`}
                      {l.fecha_alta_medica && ` — Alta: ${l.fecha_alta_medica}`}
                    </div>
                    <div className="flex items-center gap-2">
                      {l.gravedad && <Badge variant="outline" className="text-[10px]">{l.gravedad}</Badge>}
                      <Badge variant={l.recuperada ? 'default' : 'secondary'} className="text-[10px]">
                        {l.recuperada ? 'Recuperada' : 'Activa'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DOCS IDENTIDAD */}
      {visibleSections.has('docs_identidad') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Documentos de identidad ({docsIdentidad.filter((d) => !['foto_frente', 'foto_dorso'].includes(d.tipo_documento)).length})</CardTitle>
          </CardHeader>
          <CardContent>
            {docsIdentidad.filter((d) => !['foto_frente', 'foto_dorso'].includes(d.tipo_documento)).length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin documentos de identidad.</p>
            ) : (
              <div className="divide-y">
                {docsIdentidad
                  .filter((d) => !['foto_frente', 'foto_dorso'].includes(d.tipo_documento))
                  .map((doc) => (
                    <div key={doc.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium capitalize">{doc.tipo_documento.replace(/_/g, ' ')}</span>
                        {doc.notas && <span className="text-muted-foreground">— {doc.notas}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.fecha_vencimiento && <span className="text-muted-foreground">Vto: {doc.fecha_vencimiento}</span>}
                        <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver</a>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DOCS MEDICOS */}
      {visibleSections.has('docs_medicos') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Documentos médicos ({docsMedicos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {docsMedicos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin documentos médicos.</p>
            ) : (
              <div className="divide-y">
                {docsMedicos.map((doc) => (
                  <div key={doc.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium capitalize">{doc.tipo_estudio_slug.replace(/_/g, ' ')}</span>
                      {doc.medico_firmante_nombre && <span className="text-muted-foreground">— Dr/a {doc.medico_firmante_nombre}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.resultado && <Badge variant="outline" className="text-[10px]">{doc.resultado}</Badge>}
                      {doc.fecha_vencimiento && <span className="text-muted-foreground">Vto: {doc.fecha_vencimiento}</span>}
                      <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VINCULOS */}
      {visibleSections.has('vinculos') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Vínculos ({vinculos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {vinculos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin vínculos registrados.</p>
            ) : (
              <div className="divide-y">
                {vinculos.map((v, i) => (
                  <div key={i} className="py-2 flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="text-[10px] shrink-0">{v.tipo}</Badge>
                    <span className="font-medium">{v.persona}</span>
                    {v.notas && <span className="text-muted-foreground">· {v.notas}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* VEHICULOS */}
      {visibleSections.has('vehiculos') && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Vehículos ({vehiculos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {vehiculos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin vehículos registrados.</p>
            ) : (
              <div className="divide-y">
                {vehiculos.map((v) => (
                  <div key={v.id} className="py-2 flex items-center gap-3 text-xs">
                    <span className="font-medium">{v.marca} {v.modelo}</span>
                    <Badge variant="outline" className="text-[10px]">{v.patente}</Badge>
                    {v.color && <span className="text-muted-foreground">{v.color}</span>}
                    {v.permite_ingreso_club && <Badge variant="default" className="text-[10px]">Ingreso club</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REFERENCIA ADJUNTOS */}
      {visibleSections.has('adjuntos') && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Referencia adjuntos ({adjuntos.length})</CardTitle>
              <div className="flex items-center gap-2">
                {adjuntos.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={toggleAllAdjuntos}
                    >
                      {selectedAdjuntos.size === adjuntos.length ? 'Deseleccionar' : 'Seleccionar todo'}
                    </Button>
                    {selectedAdjuntos.size > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={downloadSelected}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Descargar ({selectedAdjuntos.size})
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                  Subir archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adjuntos.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No hay archivos adjuntos en ninguna sección.</p>
            ) : (
              <div className="divide-y">
                {adjuntos.map((adj) => (
                  <div key={adj.id} className="py-2 flex items-center gap-3 text-xs">
                    <Checkbox
                      checked={selectedAdjuntos.has(adj.id)}
                      onCheckedChange={() => toggleAdjunto(adj.id)}
                      className="h-3.5 w-3.5"
                    />
                    {adj.tipo === 'imagen'
                      ? <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      : <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className="font-medium capitalize">{adj.label}</span>
                    <Badge variant="secondary" className="text-[10px]">{adj.seccion}</Badge>
                    <div className="ml-auto flex items-center gap-2">
                      <a href={adj.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver</a>
                      <button
                        className="text-primary underline"
                        onClick={() => downloadAdjunto(adj.url, adj.label)}
                      >
                        Descargar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
