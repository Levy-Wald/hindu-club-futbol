'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Upload, Trash2, Plus, FileText, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// --- Types ---

interface DocIdentidad {
  id: string
  tipo_documento: string
  archivo_url: string
  fecha_emision: string | null
  fecha_vencimiento: string | null
  validado: boolean
  notas: string | null
  activo: boolean
}

interface DocMedico {
  id: string
  tipo_estudio_slug: string
  archivo_url: string
  fecha_estudio: string | null
  fecha_vencimiento: string | null
  resultado: string | null
  medico_firmante_nombre: string | null
  medico_firmante_matricula: string | null
  institucion_emisora: string | null
  activo: boolean
}

interface SeccionDocumentosProps {
  personaId: string
  tenantId: string
  fotoPerfilUrl?: string
}

// --- Helpers ---

function getEstadoVencimiento(fechaVencimiento: string | null): 'vigente' | 'por_vencer' | 'vencido' | 'sin_fecha' {
  if (!fechaVencimiento) return 'sin_fecha'
  const hoy = new Date()
  const venc = new Date(fechaVencimiento)
  if (venc < hoy) return 'vencido'
  const diff = (venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'por_vencer'
  return 'vigente'
}

function BadgeEstado({ fecha }: { fecha: string | null }) {
  const estado = getEstadoVencimiento(fecha)
  switch (estado) {
    case 'vigente':
      return <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">Vigente</Badge>
    case 'por_vencer':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Por vencer</Badge>
    case 'vencido':
      return <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">Vencido</Badge>
    default:
      return <Badge variant="outline" className="text-muted-foreground">Sin fecha</Badge>
  }
}

function BadgeResultado({ resultado }: { resultado: string | null }) {
  switch (resultado) {
    case 'apto':
      return <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400">Apto</Badge>
    case 'no_apto':
      return <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">No apto</Badge>
    case 'apto_con_observaciones':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Apto c/obs.</Badge>
    case 'pendiente':
      return <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
    default:
      return null
  }
}

const TIPOS_DOC_IDENTIDAD = [
  { value: 'dni_frente', label: 'DNI Frente' },
  { value: 'dni_dorso', label: 'DNI Dorso' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'otro', label: 'Otro' },
]

const TIPOS_DOC_MEDICO = [
  { value: 'apto_fisico', label: 'Apto físico' },
  { value: 'ecg', label: 'Electrocardiograma (ECG)' },
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'certificado_medico', label: 'Certificado médico' },
  { value: 'otro', label: 'Otro' },
]

const RESULTADOS = [
  { value: 'apto', label: 'Apto' },
  { value: 'no_apto', label: 'No apto' },
  { value: 'apto_con_observaciones', label: 'Apto con observaciones' },
  { value: 'pendiente', label: 'Pendiente' },
]

// --- Upload square for photos ---

function FotoUploadSquare({
  label,
  previewUrl,
  uploading,
  onUpload,
}: {
  label: string
  previewUrl: string | null
  uploading: boolean
  onUpload: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-muted-foreground/30 bg-muted/30 transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs">Subir</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

// --- Main component ---

export function SeccionDocumentos({ personaId, tenantId, fotoPerfilUrl }: SeccionDocumentosProps) {
  const [loaded, setLoaded] = useState(false)

  // Fotos
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(fotoPerfilUrl ?? null)
  const [fotoFrente, setFotoFrente] = useState<string | null>(null)
  const [fotoDorso, setFotoDorso] = useState<string | null>(null)
  const [uploadingFoto, setUploadingFoto] = useState<string | null>(null)

  // Docs identidad
  const [docsIdentidad, setDocsIdentidad] = useState<DocIdentidad[]>([])
  const [showFormIdentidad, setShowFormIdentidad] = useState(false)
  const [formIdentidad, setFormIdentidad] = useState({ tipo_documento: '', fecha_vencimiento: '', notas: '' })
  const [fileIdentidad, setFileIdentidad] = useState<File | null>(null)
  const [uploadingIdentidad, setUploadingIdentidad] = useState(false)

  // Docs medicos
  const [docsMedicos, setDocsMedicos] = useState<DocMedico[]>([])
  const [showFormMedico, setShowFormMedico] = useState(false)
  const [formMedico, setFormMedico] = useState({
    tipo_estudio_slug: '', fecha_estudio: '', fecha_vencimiento: '',
    resultado: '', medico_firmante_nombre: '', institucion_emisora: '',
  })
  const [fileMedico, setFileMedico] = useState<File | null>(null)
  const [uploadingMedico, setUploadingMedico] = useState(false)

  // Load data
  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Fotos personales - buscar en storage o docs de identidad
      const { data: fotosData } = await supabase
        .from('personas_documentos_identidad')
        .select('*')
        .eq('persona_id', personaId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (fotosData) {
        setDocsIdentidad(fotosData)
        // Extraer fotos frente/dorso de docs
        const frente = fotosData.find((d) => d.tipo_documento === 'foto_frente')
        const dorso = fotosData.find((d) => d.tipo_documento === 'foto_dorso')
        if (frente) setFotoFrente(frente.archivo_url)
        if (dorso) setFotoDorso(dorso.archivo_url)
      }

      const { data: medicosData } = await supabase
        .from('personas_documentos_medicos')
        .select('*')
        .eq('persona_id', personaId)
        .eq('activo', true)
        .order('created_at', { ascending: false })

      if (medicosData) setDocsMedicos(medicosData)

      setLoaded(true)
    }
    load()
  }, [personaId])

  // --- Upload helpers ---

  async function uploadFoto(file: File, tipo: 'perfil' | 'frente' | 'dorso') {
    setUploadingFoto(tipo)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${tipo}_${Date.now()}.${ext}`
    const path = `${tenantId}/${personaId}/fotos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('private-fotos-personales')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error(`Error subiendo foto: ${uploadError.message}`)
      setUploadingFoto(null)
      return
    }

    const { data: urlData } = await supabase.storage
      .from('private-fotos-personales')
      .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

    const url = urlData?.signedUrl ?? path

    if (tipo === 'perfil') {
      const { error } = await supabase
        .from('personas')
        .update({ foto_perfil_url: url })
        .eq('id', personaId)
      if (error) toast.error(error.message)
      else {
        setFotoPerfil(url)
        toast.success('Foto de perfil actualizada')
      }
    } else {
      const tipoDoc = tipo === 'frente' ? 'foto_frente' : 'foto_dorso'
      const { error } = await supabase
        .from('personas_documentos_identidad')
        .upsert({
          tenant_id: tenantId,
          persona_id: personaId,
          tipo_documento: tipoDoc,
          archivo_url: url,
          activo: true,
        }, { onConflict: 'persona_id,tipo_documento' })
      if (error) {
        // Si falla upsert, intentar insert
        await supabase.from('personas_documentos_identidad').insert({
          tenant_id: tenantId,
          persona_id: personaId,
          tipo_documento: tipoDoc,
          archivo_url: url,
          activo: true,
        })
      }
      if (tipo === 'frente') setFotoFrente(url)
      else setFotoDorso(url)
      toast.success('Foto subida')
    }

    setUploadingFoto(null)
  }

  async function uploadDocIdentidad() {
    if (!fileIdentidad || !formIdentidad.tipo_documento) {
      toast.error('Seleccioná tipo de documento y archivo')
      return
    }
    setUploadingIdentidad(true)
    const supabase = createClient()
    const ext = fileIdentidad.name.split('.').pop()
    const fileName = `${formIdentidad.tipo_documento}_${Date.now()}.${ext}`
    const path = `${tenantId}/${personaId}/identidad/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('private-documentos')
      .upload(path, fileIdentidad)

    if (uploadError) {
      toast.error(`Error subiendo: ${uploadError.message}`)
      setUploadingIdentidad(false)
      return
    }

    const { data: urlData } = await supabase.storage
      .from('private-documentos')
      .createSignedUrl(path, 60 * 60 * 24 * 365)

    const url = urlData?.signedUrl ?? path

    const { data, error } = await supabase
      .from('personas_documentos_identidad')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        tipo_documento: formIdentidad.tipo_documento,
        archivo_url: url,
        fecha_vencimiento: formIdentidad.fecha_vencimiento || null,
        notas: formIdentidad.notas || null,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
    } else {
      setDocsIdentidad((prev) => [data, ...prev])
      setFormIdentidad({ tipo_documento: '', fecha_vencimiento: '', notas: '' })
      setFileIdentidad(null)
      setShowFormIdentidad(false)
      toast.success('Documento de identidad subido')
    }
    setUploadingIdentidad(false)
  }

  async function uploadDocMedico() {
    if (!fileMedico || !formMedico.tipo_estudio_slug) {
      toast.error('Seleccioná tipo de estudio y archivo')
      return
    }
    setUploadingMedico(true)
    const supabase = createClient()
    const ext = fileMedico.name.split('.').pop()
    const fileName = `${formMedico.tipo_estudio_slug}_${Date.now()}.${ext}`
    const path = `${tenantId}/${personaId}/medicos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('private-documentos')
      .upload(path, fileMedico)

    if (uploadError) {
      toast.error(`Error subiendo: ${uploadError.message}`)
      setUploadingMedico(false)
      return
    }

    const { data: urlData } = await supabase.storage
      .from('private-documentos')
      .createSignedUrl(path, 60 * 60 * 24 * 365)

    const url = urlData?.signedUrl ?? path

    const { data, error } = await supabase
      .from('personas_documentos_medicos')
      .insert({
        tenant_id: tenantId,
        persona_id: personaId,
        tipo_estudio_slug: formMedico.tipo_estudio_slug,
        archivo_url: url,
        fecha_estudio: formMedico.fecha_estudio || null,
        fecha_vencimiento: formMedico.fecha_vencimiento || null,
        resultado: formMedico.resultado || null,
        medico_firmante_nombre: formMedico.medico_firmante_nombre || null,
        institucion_emisora: formMedico.institucion_emisora || null,
        activo: true,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
    } else {
      setDocsMedicos((prev) => [data, ...prev])
      setFormMedico({
        tipo_estudio_slug: '', fecha_estudio: '', fecha_vencimiento: '',
        resultado: '', medico_firmante_nombre: '', institucion_emisora: '',
      })
      setFileMedico(null)
      setShowFormMedico(false)
      toast.success('Documento médico subido')
    }
    setUploadingMedico(false)
  }

  async function deleteDocIdentidad(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('personas_documentos_identidad')
      .update({ activo: false })
      .eq('id', id)
    if (error) toast.error(error.message)
    else {
      setDocsIdentidad((prev) => prev.filter((d) => d.id !== id))
      toast.success('Documento eliminado')
    }
  }

  async function deleteDocMedico(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('personas_documentos_medicos')
      .update({ activo: false })
      .eq('id', id)
    if (error) toast.error(error.message)
    else {
      setDocsMedicos((prev) => prev.filter((d) => d.id !== id))
      toast.success('Documento eliminado')
    }
  }

  // --- Render ---

  if (!loaded) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Cargando documentos...</CardContent></Card>
  }

  return (
    <div className="space-y-4">
      {/* FOTOS PERSONALES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fotos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <FotoUploadSquare
              label="Foto perfil (4x4)"
              previewUrl={fotoPerfil}
              uploading={uploadingFoto === 'perfil'}
              onUpload={(file) => uploadFoto(file, 'perfil')}
            />
            <FotoUploadSquare
              label="Foto frente"
              previewUrl={fotoFrente}
              uploading={uploadingFoto === 'frente'}
              onUpload={(file) => uploadFoto(file, 'frente')}
            />
            <FotoUploadSquare
              label="Foto dorso"
              previewUrl={fotoDorso}
              uploading={uploadingFoto === 'dorso'}
              onUpload={(file) => uploadFoto(file, 'dorso')}
            />
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENTOS DE IDENTIDAD */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documentos de identidad</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowFormIdentidad(!showFormIdentidad)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form nuevo */}
          {showFormIdentidad && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Tipo documento</Label>
                  <Select value={formIdentidad.tipo_documento} onValueChange={(v) => setFormIdentidad((p) => ({ ...p, tipo_documento: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOC_IDENTIDAD.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Archivo</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFileIdentidad(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Fecha vencimiento</Label>
                  <Input type="date" value={formIdentidad.fecha_vencimiento} onChange={(e) => setFormIdentidad((p) => ({ ...p, fecha_vencimiento: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Notas</Label>
                  <Input value={formIdentidad.notas} onChange={(e) => setFormIdentidad((p) => ({ ...p, notas: e.target.value }))} placeholder="Opcional" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={uploadDocIdentidad} disabled={uploadingIdentidad}>
                  {uploadingIdentidad ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                  Subir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowFormIdentidad(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Lista existente */}
          {docsIdentidad.filter((d) => !['foto_frente', 'foto_dorso'].includes(d.tipo_documento)).length > 0 ? (
            <div className="divide-y rounded-md border">
              {docsIdentidad
                .filter((d) => !['foto_frente', 'foto_dorso'].includes(d.tipo_documento))
                .map((doc) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {TIPOS_DOC_IDENTIDAD.find((t) => t.value === doc.tipo_documento)?.label ?? doc.tipo_documento}
                        </p>
                        {doc.notas && <p className="text-xs text-muted-foreground">{doc.notas}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeEstado fecha={doc.fecha_vencimiento} />
                      {doc.fecha_vencimiento && (
                        <span className="text-xs text-muted-foreground">Vto: {doc.fecha_vencimiento}</span>
                      )}
                      <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Ver</a>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteDocIdentidad(doc.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            !showFormIdentidad && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay documentos de identidad cargados.</p>
            )
          )}
        </CardContent>
      </Card>

      {/* DOCUMENTOS MÉDICOS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Documentos médicos</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowFormMedico(!showFormMedico)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form nuevo */}
          {showFormMedico && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Tipo de estudio</Label>
                  <Select value={formMedico.tipo_estudio_slug} onValueChange={(v) => setFormMedico((p) => ({ ...p, tipo_estudio_slug: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOC_MEDICO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Archivo</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFileMedico(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Resultado</Label>
                  <Select value={formMedico.resultado} onValueChange={(v) => setFormMedico((p) => ({ ...p, resultado: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {RESULTADOS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Fecha estudio</Label>
                  <Input type="date" value={formMedico.fecha_estudio} onChange={(e) => setFormMedico((p) => ({ ...p, fecha_estudio: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Fecha vencimiento</Label>
                  <Input type="date" value={formMedico.fecha_vencimiento} onChange={(e) => setFormMedico((p) => ({ ...p, fecha_vencimiento: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Médico firmante</Label>
                  <Input value={formMedico.medico_firmante_nombre} onChange={(e) => setFormMedico((p) => ({ ...p, medico_firmante_nombre: e.target.value }))} placeholder="Nombre del médico" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">Institución</Label>
                  <Input value={formMedico.institucion_emisora} onChange={(e) => setFormMedico((p) => ({ ...p, institucion_emisora: e.target.value }))} placeholder="Hospital / centro" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={uploadDocMedico} disabled={uploadingMedico}>
                  {uploadingMedico ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                  Subir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowFormMedico(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          {/* Lista existente */}
          {docsMedicos.length > 0 ? (
            <div className="divide-y rounded-md border">
              {docsMedicos.map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {TIPOS_DOC_MEDICO.find((t) => t.value === doc.tipo_estudio_slug)?.label ?? doc.tipo_estudio_slug}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fecha_estudio && `Fecha: ${doc.fecha_estudio}`}
                        {doc.medico_firmante_nombre && ` | Dr/a: ${doc.medico_firmante_nombre}`}
                        {doc.institucion_emisora && ` | ${doc.institucion_emisora}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <BadgeResultado resultado={doc.resultado} />
                    <BadgeEstado fecha={doc.fecha_vencimiento} />
                    {doc.fecha_vencimiento && (
                      <span className="text-xs text-muted-foreground">Vto: {doc.fecha_vencimiento}</span>
                    )}
                    <a href={doc.archivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">Ver</a>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteDocMedico(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showFormMedico && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay documentos médicos cargados.</p>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
