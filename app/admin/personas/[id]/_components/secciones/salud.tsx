'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Save, Plus, Trash2, Activity, Stethoscope, HeartPulse, Upload, FileText, Eye } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

interface DatosMedicos {
  id?: string
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
  medico_cabecera_especialidad: string
  notas_medicas: string
}

const EMPTY_MEDICOS: DatosMedicos = {
  grupo_sanguineo: '', factor_rh: '', donante_organos: false,
  alergias_medicamentos: [], alergias_alimentarias: [], alergias_otras: '',
  antecedentes_medicos: '', enfermedades_cronicas: [],
  vacunas_obligatorias_dia: false, embarazo: false,
  fecha_ultima_revision_medica: '', medico_cabecera_nombre: '',
  medico_cabecera_telefono: '', medico_cabecera_especialidad: '',
  notas_medicas: '',
}

interface ObraSocial {
  id?: string
  obra_social_slug: string
  obra_social_otra_nombre: string
  plan: string
  numero_afiliado: string
  titular_nombre: string
  titular_dni: string
  telefono_emergencia: string
  prepaga_adicional: string
  vigencia_desde: string
  vigencia_hasta: string
}

const EMPTY_OBRA_SOCIAL: ObraSocial = {
  obra_social_slug: '', obra_social_otra_nombre: '', plan: '',
  numero_afiliado: '', titular_nombre: '', titular_dni: '',
  telefono_emergencia: '', prepaga_adicional: '',
  vigencia_desde: '', vigencia_hasta: '',
}

interface Lesion {
  id: string
  tipo_lesion: string
  zona_cuerpo: string
  gravedad: string
  fecha_lesion: string
  fecha_alta: string | null
  estado: string
  descripcion: string | null
  diagnostico: string | null
  contexto_actividad: string | null
  dias_baja_estimados: number | null
  profesional_externo_nombre: string | null
}

interface Rehabilitacion {
  id: string
  lesion_id: string | null
  tipo_rehabilitacion: string
  fecha_inicio: string
  fecha_fin_real: string | null
  estado: string
  progreso_porcentaje: number
  sesiones_planificadas: number | null
  sesiones_completadas: number | null
  profesional_externo_nombre: string | null
  descripcion: string | null
}

interface SeccionSaludProps {
  personaId: string
  tenantId: string
}

// --- Constants ---

const TIPOS_LESION = [
  { value: 'esguince', label: 'Esguince' },
  { value: 'fractura', label: 'Fractura' },
  { value: 'desgarro', label: 'Desgarro' },
  { value: 'contractura', label: 'Contractura' },
  { value: 'tendinitis', label: 'Tendinitis' },
  { value: 'luxacion', label: 'Luxación' },
  { value: 'rotura_ligamento', label: 'Rotura de ligamento' },
  { value: 'otro', label: 'Otro' },
]

const ZONAS_CUERPO = [
  { value: 'tobillo_izq', label: 'Tobillo izquierdo' },
  { value: 'tobillo_der', label: 'Tobillo derecho' },
  { value: 'rodilla_izq', label: 'Rodilla izquierda' },
  { value: 'rodilla_der', label: 'Rodilla derecha' },
  { value: 'muslo_izq', label: 'Muslo izquierdo' },
  { value: 'muslo_der', label: 'Muslo derecho' },
  { value: 'cadera', label: 'Cadera' },
  { value: 'espalda_baja', label: 'Espalda baja' },
  { value: 'espalda_alta', label: 'Espalda alta' },
  { value: 'hombro_izq', label: 'Hombro izquierdo' },
  { value: 'hombro_der', label: 'Hombro derecho' },
  { value: 'codo_izq', label: 'Codo izquierdo' },
  { value: 'codo_der', label: 'Codo derecho' },
  { value: 'muñeca_izq', label: 'Muñeca izquierda' },
  { value: 'muñeca_der', label: 'Muñeca derecha' },
  { value: 'mano_izq', label: 'Mano izquierda' },
  { value: 'mano_der', label: 'Mano derecha' },
  { value: 'cabeza', label: 'Cabeza' },
  { value: 'cuello', label: 'Cuello' },
  { value: 'pie_izq', label: 'Pie izquierdo' },
  { value: 'pie_der', label: 'Pie derecho' },
  { value: 'otro', label: 'Otro' },
]

const GRAVEDADES = [
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'grave', label: 'Grave' },
  { value: 'muy_grave', label: 'Muy grave' },
]

const ESTADOS_LESION = [
  { value: 'activa', label: 'Activa' },
  { value: 'en_rehabilitacion', label: 'En rehabilitación' },
  { value: 'alta_parcial', label: 'Alta parcial' },
  { value: 'alta_total', label: 'Alta total' },
  { value: 'recaida', label: 'Recaída' },
]

const CONTEXTOS = [
  { value: 'entrenamiento', label: 'Entrenamiento' },
  { value: 'partido_oficial', label: 'Partido oficial' },
  { value: 'partido_amistoso', label: 'Partido amistoso' },
  { value: 'fuera_club', label: 'Fuera del club' },
]

const TIPOS_REHAB = [
  { value: 'kinesiologia', label: 'Kinesiología' },
  { value: 'fisioterapia', label: 'Fisioterapia' },
  { value: 'cirugia_post', label: 'Post-quirúrgico' },
  { value: 'readaptacion_deportiva', label: 'Readaptación deportiva' },
  { value: 'otro', label: 'Otro' },
]

const ESTADOS_REHAB = [
  { value: 'planificada', label: 'Planificada' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'pausada', label: 'Pausada' },
  { value: 'completada', label: 'Completada' },
  { value: 'abandonada', label: 'Abandonada' },
]

// --- Helper ---

function getBadgeVariant(estado: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (estado) {
    case 'activa': case 'en_curso': return 'default'
    case 'alta_total': case 'completada': return 'secondary'
    case 'recaida': return 'destructive'
    default: return 'outline'
  }
}

// --- Document types & constants ---

interface StorageFile {
  name: string
  created_at: string | null
}

interface DocumentoMedico {
  nombre: string
  path: string
  fecha: string
}

const TIPOS_DOCUMENTO_MEDICO = [
  { value: 'apto_medico', label: 'Apto medico' },
  { value: 'estudio_medico', label: 'Estudio medico' },
  { value: 'certificado_medico', label: 'Certificado medico' },
  { value: 'otro', label: 'Otro' },
]

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
const ALLOWED_MIME_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function formatStorageDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// --- DocumentUploader sub-component ---

interface DocumentUploaderProps {
  storagePath: string
  label: string
  showTipoSelector?: boolean
}

function DocumentUploader({ storagePath, label, showTipoSelector = false }: DocumentUploaderProps) {
  const [documentos, setDocumentos] = useState<DocumentoMedico[]>([])
  const [uploading, setUploading] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [tipoDocumento, setTipoDocumento] = useState('apto_medico')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true)
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('private-documentos')
      .list(storagePath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

    if (error) {
      console.error('Error listing documents:', error.message)
      setLoadingDocs(false)
      return
    }

    const docs: DocumentoMedico[] = (data ?? [])
      .filter((f: StorageFile) => f.name !== '.emptyFolderPlaceholder')
      .map((f: StorageFile) => ({
        nombre: f.name,
        path: `${storagePath}/${f.name}`,
        fecha: f.created_at ?? '',
      }))

    setDocumentos(docs)
    setLoadingDocs(false)
  }, [storagePath])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  async function handleUpload(file: File) {
    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Formato no permitido. Usá JPG, PNG, WEBP o PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera el limite de 10 MB.')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const timestamp = Date.now()
    const prefix = showTipoSelector ? `${tipoDocumento}_` : ''
    const fileName = `${prefix}${timestamp}.${ext}`
    const fullPath = `${storagePath}/${fileName}`

    const { error } = await supabase.storage
      .from('private-documentos')
      .upload(fullPath, file)

    setUploading(false)
    if (error) {
      toast.error(`Error al subir: ${error.message}`)
    } else {
      toast.success('Documento subido correctamente')
      await loadDocuments()
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  async function handleDownload(path: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('private-documentos')
      .createSignedUrl(path, 3600)

    if (error || !data?.signedUrl) {
      toast.error('No se pudo generar el enlace de descarga')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(path: string) {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('private-documentos')
      .remove([path])

    if (error) {
      toast.error(`Error al eliminar: ${error.message}`)
    } else {
      toast.success('Documento eliminado')
      setDocumentos((prev) => prev.filter((d) => d.path !== path))
    }
  }

  function getDocLabel(nombre: string): string {
    for (const tipo of TIPOS_DOCUMENTO_MEDICO) {
      if (nombre.startsWith(`${tipo.value}_`)) {
        return tipo.label
      }
    }
    return nombre
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {showTipoSelector && (
          <Select value={tipoDocumento} onValueChange={(v) => setTipoDocumento(v ?? 'apto_medico')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO_MEDICO.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_MIME_ACCEPT}
          onChange={onFileChange}
          className="hidden"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3.5 w-3.5" />
          )}
          {uploading ? 'Subiendo...' : label}
        </Button>
      </div>

      {loadingDocs ? (
        <p className="text-xs text-muted-foreground">Cargando documentos...</p>
      ) : documentos.length > 0 ? (
        <div className="divide-y rounded-md border">
          {documentos.map((doc) => (
            <div key={doc.path} className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm truncate">{showTipoSelector ? getDocLabel(doc.nombre) : doc.nombre}</p>
                  <p className="text-xs text-muted-foreground">{formatStorageDate(doc.fecha)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(doc.path)}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(doc.path)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// --- Inline attach button for lesion/rehab items ---

interface InlineAttachButtonProps {
  storagePath: string
}

function InlineAttachButton({ storagePath }: InlineAttachButtonProps) {
  const [count, setCount] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadCount = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('private-documentos')
      .list(storagePath, { limit: 100 })

    const filtered = (data ?? []).filter((f: StorageFile) => f.name !== '.emptyFolderPlaceholder')
    setCount(filtered.length)
  }, [storagePath])

  useEffect(() => {
    loadCount()
  }, [loadCount])

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const ext = getExtension(file.name)
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Formato no permitido. Usá JPG, PNG, WEBP o PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo supera el limite de 10 MB.')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const timestamp = Date.now()
    const fileName = `${timestamp}.${ext}`
    const fullPath = `${storagePath}/${fileName}`

    const { error } = await supabase.storage
      .from('private-documentos')
      .upload(fullPath, file)

    setUploading(false)
    if (error) {
      toast.error(`Error al subir: ${error.message}`)
    } else {
      toast.success('Documento adjuntado')
      await loadCount()
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_ACCEPT}
        onChange={onFileChange}
        className="hidden"
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <Upload className="mr-1 h-3 w-3" />
        )}
        Adjuntar
      </Button>
      {count !== null && count > 0 && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => setShowDocs(!showDocs)}
        >
          <FileText className="mr-1 h-3 w-3" />
          {count} doc{count > 1 ? 's' : ''}
        </Button>
      )}
      {showDocs && (
        <InlineDocList storagePath={storagePath} onUpdate={loadCount} />
      )}
    </div>
  )
}

interface InlineDocListProps {
  storagePath: string
  onUpdate: () => Promise<void>
}

function InlineDocList({ storagePath, onUpdate }: InlineDocListProps) {
  const [docs, setDocs] = useState<DocumentoMedico[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('private-documentos')
        .list(storagePath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })

      const filtered = (data ?? [])
        .filter((f: StorageFile) => f.name !== '.emptyFolderPlaceholder')
        .map((f: StorageFile) => ({
          nombre: f.name,
          path: `${storagePath}/${f.name}`,
          fecha: f.created_at ?? '',
        }))
      setDocs(filtered)
      setLoading(false)
    }
    load()
  }, [storagePath])

  async function handleDownload(path: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('private-documentos')
      .createSignedUrl(path, 3600)
    if (error || !data?.signedUrl) {
      toast.error('No se pudo generar el enlace')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function handleDelete(path: string) {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('private-documentos')
      .remove([path])
    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      setDocs((prev) => prev.filter((d) => d.path !== path))
      toast.success('Documento eliminado')
      await onUpdate()
    }
  }

  if (loading) return <p className="text-xs text-muted-foreground ml-2">Cargando...</p>

  return (
    <div className="absolute right-0 top-full mt-1 z-10 w-64 rounded-md border bg-background shadow-lg p-2 space-y-1">
      {docs.map((doc) => (
        <div key={doc.path} className="flex items-center justify-between gap-1 text-xs">
          <span className="truncate">{doc.nombre}</span>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDownload(doc.path)}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(doc.path)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
      {docs.length === 0 && <p className="text-xs text-muted-foreground">Sin documentos</p>}
    </div>
  )
}

// --- Main Component ---

export function SeccionSalud({ personaId, tenantId }: SeccionSaludProps) {
  const [medicos, setMedicos] = useState<DatosMedicos>(EMPTY_MEDICOS)
  const [obraSocial, setObraSocial] = useState<ObraSocial>(EMPTY_OBRA_SOCIAL)
  const [lesiones, setLesiones] = useState<Lesion[]>([])
  const [rehabilitaciones, setRehabilitaciones] = useState<Rehabilitacion[]>([])
  const [loadingMed, setLoadingMed] = useState(false)
  const [loadingOS, setLoadingOS] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Lesion form
  const [showLesionForm, setShowLesionForm] = useState(false)
  const [lesionForm, setLesionForm] = useState({
    tipo_lesion: '', zona_cuerpo: '', gravedad: 'moderada', fecha_lesion: '',
    descripcion: '', diagnostico: '', contexto_actividad: '',
    dias_baja_estimados: '', profesional_externo_nombre: '',
  })
  const [savingLesion, setSavingLesion] = useState(false)

  // Rehab form
  const [showRehabForm, setShowRehabForm] = useState(false)
  const [rehabForm, setRehabForm] = useState({
    lesion_id: '', tipo_rehabilitacion: '', fecha_inicio: '',
    descripcion: '', sesiones_planificadas: '', frecuencia_semanal: '',
    profesional_externo_nombre: '',
  })
  const [savingRehab, setSavingRehab] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [medRes, osRes, lesRes, rehabRes] = await Promise.all([
        supabase.from('personas_datos_medicos').select('*').eq('persona_id', personaId).maybeSingle(),
        supabase.from('personas_obra_social').select('*').eq('persona_id', personaId).eq('activo', true).maybeSingle(),
        supabase.from('personas_lesiones').select('*').eq('persona_id', personaId).eq('activo', true).order('fecha_lesion', { ascending: false }),
        supabase.from('personas_rehabilitaciones').select('*').eq('persona_id', personaId).eq('activo', true).order('fecha_inicio', { ascending: false }),
      ])

      if (medRes.data) {
        const med = medRes.data
        setMedicos({
          id: med.id,
          grupo_sanguineo: med.grupo_sanguineo ?? '',
          factor_rh: med.factor_rh ?? '',
          donante_organos: med.donante_organos ?? false,
          alergias_medicamentos: med.alergias_medicamentos ?? [],
          alergias_alimentarias: med.alergias_alimentarias ?? [],
          alergias_otras: med.alergias_otras ?? '',
          antecedentes_medicos: med.antecedentes_medicos ?? '',
          enfermedades_cronicas: med.enfermedades_cronicas ?? [],
          vacunas_obligatorias_dia: med.vacunas_obligatorias_dia ?? false,
          embarazo: med.embarazo ?? false,
          fecha_ultima_revision_medica: med.fecha_ultima_revision_medica ?? '',
          medico_cabecera_nombre: med.medico_cabecera_nombre ?? '',
          medico_cabecera_telefono: med.medico_cabecera_telefono ?? '',
          medico_cabecera_especialidad: med.medico_cabecera_especialidad ?? '',
          notas_medicas: med.notas_medicas ?? '',
        })
      }

      if (osRes.data) {
        const os = osRes.data
        setObraSocial({
          id: os.id,
          obra_social_slug: os.obra_social_slug ?? '',
          obra_social_otra_nombre: os.obra_social_otra_nombre ?? '',
          plan: os.plan ?? '',
          numero_afiliado: os.numero_afiliado ?? '',
          titular_nombre: os.titular_nombre ?? '',
          titular_dni: os.titular_dni ?? '',
          telefono_emergencia: os.telefono_emergencia ?? '',
          prepaga_adicional: os.prepaga_adicional ?? '',
          vigencia_desde: os.vigencia_desde ?? '',
          vigencia_hasta: os.vigencia_hasta ?? '',
        })
      }

      if (lesRes.data) setLesiones(lesRes.data)
      if (rehabRes.data) setRehabilitaciones(rehabRes.data)

      setLoaded(true)
    }
    load()
  }, [personaId])

  // --- Save handlers ---

  async function saveMedicos() {
    setLoadingMed(true)
    const supabase = createClient()
    const payload = {
      tenant_id: tenantId, persona_id: personaId,
      grupo_sanguineo: medicos.grupo_sanguineo || null,
      factor_rh: medicos.factor_rh || null,
      donante_organos: medicos.donante_organos,
      alergias_medicamentos: medicos.alergias_medicamentos,
      alergias_alimentarias: medicos.alergias_alimentarias,
      alergias_otras: medicos.alergias_otras || null,
      antecedentes_medicos: medicos.antecedentes_medicos || null,
      enfermedades_cronicas: medicos.enfermedades_cronicas,
      vacunas_obligatorias_dia: medicos.vacunas_obligatorias_dia,
      embarazo: medicos.embarazo,
      fecha_ultima_revision_medica: medicos.fecha_ultima_revision_medica || null,
      medico_cabecera_nombre: medicos.medico_cabecera_nombre || null,
      medico_cabecera_telefono: medicos.medico_cabecera_telefono || null,
      medico_cabecera_especialidad: medicos.medico_cabecera_especialidad || null,
      notas_medicas: medicos.notas_medicas || null,
    }

    let error
    if (medicos.id) {
      ({ error } = await supabase.from('personas_datos_medicos').update(payload).eq('id', medicos.id))
    } else {
      const { data, error: e } = await supabase.from('personas_datos_medicos').insert(payload).select('id').single()
      error = e
      if (data) setMedicos((prev) => ({ ...prev, id: data.id }))
    }

    setLoadingMed(false)
    if (error) toast.error(error.message)
    else toast.success('Datos médicos guardados')
  }

  async function saveObraSocial() {
    setLoadingOS(true)
    const supabase = createClient()
    const payload = {
      tenant_id: tenantId, persona_id: personaId,
      obra_social_slug: obraSocial.obra_social_slug || null,
      obra_social_otra_nombre: obraSocial.obra_social_otra_nombre || null,
      plan: obraSocial.plan || null,
      numero_afiliado: obraSocial.numero_afiliado || null,
      titular_nombre: obraSocial.titular_nombre || null,
      titular_dni: obraSocial.titular_dni || null,
      telefono_emergencia: obraSocial.telefono_emergencia || null,
      prepaga_adicional: obraSocial.prepaga_adicional || null,
      vigencia_desde: obraSocial.vigencia_desde || null,
      vigencia_hasta: obraSocial.vigencia_hasta || null,
    }

    let error
    if (obraSocial.id) {
      ({ error } = await supabase.from('personas_obra_social').update(payload).eq('id', obraSocial.id))
    } else {
      const { data, error: e } = await supabase.from('personas_obra_social').insert(payload).select('id').single()
      error = e
      if (data) setObraSocial((prev) => ({ ...prev, id: data.id }))
    }

    setLoadingOS(false)
    if (error) toast.error(error.message)
    else toast.success('Obra social guardada')
  }

  async function saveLesion() {
    if (!lesionForm.tipo_lesion || !lesionForm.zona_cuerpo || !lesionForm.fecha_lesion) {
      toast.error('Tipo, zona y fecha son obligatorios')
      return
    }
    setSavingLesion(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('personas_lesiones')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        tipo_lesion: lesionForm.tipo_lesion,
        zona_cuerpo: lesionForm.zona_cuerpo,
        gravedad: lesionForm.gravedad,
        fecha_lesion: lesionForm.fecha_lesion,
        descripcion: lesionForm.descripcion || null,
        diagnostico: lesionForm.diagnostico || null,
        contexto_actividad: lesionForm.contexto_actividad || null,
        dias_baja_estimados: lesionForm.dias_baja_estimados ? parseInt(lesionForm.dias_baja_estimados) : null,
        profesional_externo_nombre: lesionForm.profesional_externo_nombre || null,
      })
      .select()
      .single()

    setSavingLesion(false)
    if (error) {
      toast.error(error.message)
    } else {
      setLesiones((prev) => [data, ...prev])
      setShowLesionForm(false)
      setLesionForm({ tipo_lesion: '', zona_cuerpo: '', gravedad: 'moderada', fecha_lesion: '', descripcion: '', diagnostico: '', contexto_actividad: '', dias_baja_estimados: '', profesional_externo_nombre: '' })
      toast.success('Lesión registrada')
    }
  }

  async function saveRehab() {
    if (!rehabForm.tipo_rehabilitacion || !rehabForm.fecha_inicio) {
      toast.error('Tipo y fecha de inicio son obligatorios')
      return
    }
    setSavingRehab(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('personas_rehabilitaciones')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        lesion_id: rehabForm.lesion_id || null,
        tipo_rehabilitacion: rehabForm.tipo_rehabilitacion,
        fecha_inicio: rehabForm.fecha_inicio,
        descripcion: rehabForm.descripcion || null,
        sesiones_planificadas: rehabForm.sesiones_planificadas ? parseInt(rehabForm.sesiones_planificadas) : null,
        frecuencia_semanal: rehabForm.frecuencia_semanal ? parseInt(rehabForm.frecuencia_semanal) : null,
        profesional_externo_nombre: rehabForm.profesional_externo_nombre || null,
      })
      .select()
      .single()

    setSavingRehab(false)
    if (error) {
      toast.error(error.message)
    } else {
      setRehabilitaciones((prev) => [data, ...prev])
      setShowRehabForm(false)
      setRehabForm({ lesion_id: '', tipo_rehabilitacion: '', fecha_inicio: '', descripcion: '', sesiones_planificadas: '', frecuencia_semanal: '', profesional_externo_nombre: '' })
      toast.success('Rehabilitación registrada')
    }
  }

  async function deleteLesion(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('personas_lesiones').update({ activo: false }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      setLesiones((prev) => prev.filter((l) => l.id !== id))
      toast.success('Lesión eliminada')
    }
  }

  async function deleteRehab(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('personas_rehabilitaciones').update({ activo: false }).eq('id', id)
    if (error) toast.error(error.message)
    else {
      setRehabilitaciones((prev) => prev.filter((r) => r.id !== id))
      toast.success('Rehabilitación eliminada')
    }
  }

  if (!loaded) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Cargando datos de salud...</CardContent></Card>
  }

  return (
    <Tabs defaultValue="medicos" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto mb-4">
        <TabsTrigger value="medicos">
          <Stethoscope className="h-3.5 w-3.5 mr-1" />
          Datos médicos
        </TabsTrigger>
        <TabsTrigger value="lesiones">
          <Activity className="h-3.5 w-3.5 mr-1" />
          Lesiones
          {lesiones.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{lesiones.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="rehabilitacion">
          <HeartPulse className="h-3.5 w-3.5 mr-1" />
          Rehabilitación
          {rehabilitaciones.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{rehabilitaciones.length}</Badge>
          )}
        </TabsTrigger>
      </TabsList>

      {/* DATOS MÉDICOS */}
      <TabsContent value="medicos">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Datos médicos</CardTitle>
              <Button size="sm" onClick={saveMedicos} disabled={loadingMed}>
                {loadingMed ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                Guardar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Grupo sanguíneo</Label>
                  <Select value={medicos.grupo_sanguineo} onValueChange={(v) => setMedicos((p) => ({ ...p, grupo_sanguineo: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                      <SelectItem value="desconocido">Desconocido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Factor RH</Label>
                  <Select value={medicos.factor_rh} onValueChange={(v) => setMedicos((p) => ({ ...p, factor_rh: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positivo">Positivo (+)</SelectItem>
                      <SelectItem value="negativo">Negativo (-)</SelectItem>
                      <SelectItem value="desconocido">Desconocido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Última revisión médica</Label>
                  <Input type="date" value={medicos.fecha_ultima_revision_medica} onChange={(e) => setMedicos((p) => ({ ...p, fecha_ultima_revision_medica: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <Checkbox checked={medicos.donante_organos} onCheckedChange={(v) => setMedicos((p) => ({ ...p, donante_organos: v === true }))} />
                    <Label className="text-sm cursor-pointer">Donante órganos</Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <Checkbox checked={medicos.vacunas_obligatorias_dia} onCheckedChange={(v) => setMedicos((p) => ({ ...p, vacunas_obligatorias_dia: v === true }))} />
                    <Label className="text-sm cursor-pointer">Vacunas al día</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Alergias a medicamentos (separadas por coma)</Label>
                  <Input value={medicos.alergias_medicamentos.join(', ')} onChange={(e) => setMedicos((p) => ({ ...p, alergias_medicamentos: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="Ej: penicilina, ibuprofeno" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Alergias alimentarias (separadas por coma)</Label>
                  <Input value={medicos.alergias_alimentarias.join(', ')} onChange={(e) => setMedicos((p) => ({ ...p, alergias_alimentarias: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="Ej: maní, mariscos" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Otras alergias</Label>
                  <Input value={medicos.alergias_otras} onChange={(e) => setMedicos((p) => ({ ...p, alergias_otras: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Enfermedades crónicas (separadas por coma)</Label>
                  <Input value={medicos.enfermedades_cronicas.join(', ')} onChange={(e) => setMedicos((p) => ({ ...p, enfermedades_cronicas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} placeholder="Ej: asma, diabetes" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Antecedentes médicos</Label>
                <Textarea value={medicos.antecedentes_medicos} onChange={(e) => setMedicos((p) => ({ ...p, antecedentes_medicos: e.target.value }))} rows={3} />
              </div>

              <p className="text-sm font-medium text-muted-foreground pt-2">Médico de cabecera</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Nombre</Label>
                  <Input value={medicos.medico_cabecera_nombre} onChange={(e) => setMedicos((p) => ({ ...p, medico_cabecera_nombre: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Teléfono</Label>
                  <Input type="tel" value={medicos.medico_cabecera_telefono} onChange={(e) => setMedicos((p) => ({ ...p, medico_cabecera_telefono: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Especialidad</Label>
                  <Input value={medicos.medico_cabecera_especialidad} onChange={(e) => setMedicos((p) => ({ ...p, medico_cabecera_especialidad: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Notas médicas</Label>
                <Textarea value={medicos.notas_medicas} onChange={(e) => setMedicos((p) => ({ ...p, notas_medicas: e.target.value }))} rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* OBRA SOCIAL */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Obra social / Prepaga</CardTitle>
              <Button size="sm" onClick={saveObraSocial} disabled={loadingOS}>
                {loadingOS ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                Guardar
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Nombre obra social</Label>
                  <Input value={obraSocial.obra_social_otra_nombre} onChange={(e) => setObraSocial((p) => ({ ...p, obra_social_otra_nombre: e.target.value }))} placeholder="Ej: OSDE, Swiss Medical..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Plan</Label>
                  <Input value={obraSocial.plan} onChange={(e) => setObraSocial((p) => ({ ...p, plan: e.target.value }))} placeholder="Ej: 410, PMI..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">N° afiliado</Label>
                  <Input value={obraSocial.numero_afiliado} onChange={(e) => setObraSocial((p) => ({ ...p, numero_afiliado: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Titular nombre</Label>
                  <Input value={obraSocial.titular_nombre} onChange={(e) => setObraSocial((p) => ({ ...p, titular_nombre: e.target.value }))} placeholder="Si no es la persona" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Titular DNI</Label>
                  <Input value={obraSocial.titular_dni} onChange={(e) => setObraSocial((p) => ({ ...p, titular_dni: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Tel. emergencia</Label>
                  <Input type="tel" value={obraSocial.telefono_emergencia} onChange={(e) => setObraSocial((p) => ({ ...p, telefono_emergencia: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Prepaga adicional</Label>
                  <Input value={obraSocial.prepaga_adicional} onChange={(e) => setObraSocial((p) => ({ ...p, prepaga_adicional: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Vigencia desde</Label>
                  <Input type="date" value={obraSocial.vigencia_desde} onChange={(e) => setObraSocial((p) => ({ ...p, vigencia_desde: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Vigencia hasta</Label>
                  <Input type="date" value={obraSocial.vigencia_hasta} onChange={(e) => setObraSocial((p) => ({ ...p, vigencia_hasta: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* APTOS MÉDICOS */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aptos medicos y documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUploader
                storagePath={`personas/${personaId}/salud/aptos`}
                label="Subir documento"
                showTipoSelector
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* LESIONES */}
      <TabsContent value="lesiones">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Historial de lesiones</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowLesionForm(!showLesionForm)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Registrar lesión
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form */}
            {showLesionForm && (
              <div className="rounded-md border p-4 space-y-3 bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Tipo lesión *</Label>
                    <Select value={lesionForm.tipo_lesion} onValueChange={(v) => setLesionForm((p) => ({ ...p, tipo_lesion: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{TIPOS_LESION.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Zona del cuerpo *</Label>
                    <Select value={lesionForm.zona_cuerpo} onValueChange={(v) => setLesionForm((p) => ({ ...p, zona_cuerpo: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{ZONAS_CUERPO.map((z) => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Gravedad</Label>
                    <Select value={lesionForm.gravedad} onValueChange={(v) => setLesionForm((p) => ({ ...p, gravedad: v ?? 'moderada' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GRAVEDADES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Fecha lesión *</Label>
                    <Input type="date" value={lesionForm.fecha_lesion} onChange={(e) => setLesionForm((p) => ({ ...p, fecha_lesion: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Contexto</Label>
                    <Select value={lesionForm.contexto_actividad} onValueChange={(v) => setLesionForm((p) => ({ ...p, contexto_actividad: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{CONTEXTOS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Días baja estimados</Label>
                    <Input type="number" value={lesionForm.dias_baja_estimados} onChange={(e) => setLesionForm((p) => ({ ...p, dias_baja_estimados: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Profesional</Label>
                    <Input value={lesionForm.profesional_externo_nombre} onChange={(e) => setLesionForm((p) => ({ ...p, profesional_externo_nombre: e.target.value }))} placeholder="Nombre del médico" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Descripción</Label>
                    <Input value={lesionForm.descripcion} onChange={(e) => setLesionForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Cómo ocurrió" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Diagnóstico</Label>
                    <Input value={lesionForm.diagnostico} onChange={(e) => setLesionForm((p) => ({ ...p, diagnostico: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveLesion} disabled={savingLesion}>
                    {savingLesion ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                    Registrar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowLesionForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* List */}
            {lesiones.length > 0 ? (
              <div className="divide-y rounded-md border">
                {lesiones.map((l) => (
                  <div key={l.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {TIPOS_LESION.find((t) => t.value === l.tipo_lesion)?.label ?? l.tipo_lesion}
                          {' — '}
                          {ZONAS_CUERPO.find((z) => z.value === l.zona_cuerpo)?.label ?? l.zona_cuerpo}
                        </p>
                        <Badge variant={getBadgeVariant(l.estado)} className="text-[10px]">
                          {ESTADOS_LESION.find((e) => e.value === l.estado)?.label ?? l.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {l.fecha_lesion} · Gravedad: {GRAVEDADES.find((g) => g.value === l.gravedad)?.label ?? l.gravedad}
                        {l.dias_baja_estimados && ` · ${l.dias_baja_estimados} días baja est.`}
                        {l.contexto_actividad && ` · ${CONTEXTOS.find((c) => c.value === l.contexto_actividad)?.label}`}
                      </p>
                      {l.diagnostico && <p className="text-xs text-muted-foreground mt-0.5">Dx: {l.diagnostico}</p>}
                      <div className="relative mt-1">
                        <InlineAttachButton
                          storagePath={`personas/${personaId}/salud/lesiones/${l.id}`}
                        />
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteLesion(l.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              !showLesionForm && <p className="text-sm text-muted-foreground text-center py-6">No hay lesiones registradas.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* REHABILITACIÓN */}
      <TabsContent value="rehabilitacion">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Rehabilitaciones</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowRehabForm(!showRehabForm)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nueva rehabilitación
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form */}
            {showRehabForm && (
              <div className="rounded-md border p-4 space-y-3 bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Tipo *</Label>
                    <Select value={rehabForm.tipo_rehabilitacion} onValueChange={(v) => setRehabForm((p) => ({ ...p, tipo_rehabilitacion: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>{TIPOS_REHAB.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Fecha inicio *</Label>
                    <Input type="date" value={rehabForm.fecha_inicio} onChange={(e) => setRehabForm((p) => ({ ...p, fecha_inicio: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Lesión asociada</Label>
                    <Select value={rehabForm.lesion_id} onValueChange={(v) => setRehabForm((p) => ({ ...p, lesion_id: v ?? '' }))}>
                      <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                      <SelectContent>
                        {lesiones.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {TIPOS_LESION.find((t) => t.value === l.tipo_lesion)?.label} - {l.fecha_lesion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Sesiones planificadas</Label>
                    <Input type="number" value={rehabForm.sesiones_planificadas} onChange={(e) => setRehabForm((p) => ({ ...p, sesiones_planificadas: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Frecuencia semanal</Label>
                    <Input type="number" value={rehabForm.frecuencia_semanal} onChange={(e) => setRehabForm((p) => ({ ...p, frecuencia_semanal: e.target.value }))} placeholder="Veces/semana" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">Profesional</Label>
                    <Input value={rehabForm.profesional_externo_nombre} onChange={(e) => setRehabForm((p) => ({ ...p, profesional_externo_nombre: e.target.value }))} placeholder="Kinesiólogo, fisio..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Descripción / Objetivos</Label>
                  <Input value={rehabForm.descripcion} onChange={(e) => setRehabForm((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Objetivo de la rehabilitación" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveRehab} disabled={savingRehab}>
                    {savingRehab ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                    Registrar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRehabForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* List */}
            {rehabilitaciones.length > 0 ? (
              <div className="divide-y rounded-md border">
                {rehabilitaciones.map((r) => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {TIPOS_REHAB.find((t) => t.value === r.tipo_rehabilitacion)?.label ?? r.tipo_rehabilitacion}
                        </p>
                        <Badge variant={getBadgeVariant(r.estado)} className="text-[10px]">
                          {ESTADOS_REHAB.find((e) => e.value === r.estado)?.label ?? r.estado}
                        </Badge>
                        {r.progreso_porcentaje > 0 && (
                          <span className="text-xs text-muted-foreground">{r.progreso_porcentaje}%</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Inicio: {r.fecha_inicio}
                        {r.sesiones_planificadas && ` · ${r.sesiones_completadas ?? 0}/${r.sesiones_planificadas} sesiones`}
                        {r.profesional_externo_nombre && ` · ${r.profesional_externo_nombre}`}
                      </p>
                      {r.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{r.descripcion}</p>}
                      <div className="relative mt-1">
                        <InlineAttachButton
                          storagePath={`personas/${personaId}/salud/rehabilitaciones/${r.id}`}
                        />
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteRehab(r.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              !showRehabForm && <p className="text-sm text-muted-foreground text-center py-6">No hay rehabilitaciones registradas.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
