'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Save, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface SeccionSaludProps {
  personaId: string
  tenantId: string
}

export function SeccionSalud({ personaId, tenantId }: SeccionSaludProps) {
  const [medicos, setMedicos] = useState<DatosMedicos>(EMPTY_MEDICOS)
  const [obraSocial, setObraSocial] = useState<ObraSocial>(EMPTY_OBRA_SOCIAL)
  const [loadingMed, setLoadingMed] = useState(false)
  const [loadingOS, setLoadingOS] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: med } = await supabase
        .from('personas_datos_medicos')
        .select('*')
        .eq('persona_id', personaId)
        .maybeSingle()

      if (med) {
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

      const { data: os } = await supabase
        .from('personas_obra_social')
        .select('*')
        .eq('persona_id', personaId)
        .eq('activo', true)
        .maybeSingle()

      if (os) {
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
      setLoaded(true)
    }
    load()
  }, [personaId])

  async function saveMedicos() {
    setLoadingMed(true)
    const supabase = createClient()
    const payload = {
      tenant_id: tenantId,
      persona_id: personaId,
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
      tenant_id: tenantId,
      persona_id: personaId,
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

  if (!loaded) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Cargando datos médicos...</CardContent></Card>
  }

  return (
    <div className="space-y-4">
      {/* DATOS MÉDICOS */}
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

          <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            Subida de archivos (credencial obra social, aptos médicos, DNI) — requiere configurar Supabase Storage. Próximo paso.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
