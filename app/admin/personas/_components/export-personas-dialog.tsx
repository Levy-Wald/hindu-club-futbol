'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { exportarPersonas } from '../_actions-export'
import type { ExportFormat, ExportData, ClubBranding } from '@/lib/export/formats'

const MODULES = [
  {
    key: 'identidad',
    label: 'Identidad',
    fields: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'apellido', label: 'Apellido' },
      { key: 'nombre_completo_legal', label: 'Nombre legal' },
      { key: 'tipo_documento', label: 'Tipo documento' },
      { key: 'numero_documento', label: 'Nro. documento' },
      { key: 'dni_pais_emision', label: 'País emisión DNI' },
      { key: 'cuil_cuit', label: 'CUIL/CUIT' },
      { key: 'pasaporte_numero', label: 'Pasaporte' },
      { key: 'pasaporte_pais', label: 'País pasaporte' },
      { key: 'pasaporte_vigencia', label: 'Vigencia pasaporte' },
      { key: 'fecha_nacimiento', label: 'Fecha nacimiento' },
      { key: 'genero', label: 'Género' },
      { key: 'nacionalidad', label: 'Nacionalidad' },
      { key: 'estado_civil', label: 'Estado civil' },
    ],
  },
  {
    key: 'contacto',
    label: 'Contacto',
    fields: [
      { key: 'email_principal', label: 'Email principal' },
      { key: 'email_secundario', label: 'Email secundario' },
      { key: 'telefono_principal', label: 'Teléfono principal' },
      { key: 'telefono_secundario', label: 'Teléfono secundario' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'whatsapp_emergencia', label: 'WhatsApp emergencia' },
    ],
  },
  {
    key: 'direccion',
    label: 'Dirección',
    fields: [
      { key: 'direccion_calle', label: 'Calle' },
      { key: 'direccion_numero', label: 'Número' },
      { key: 'direccion_piso', label: 'Piso' },
      { key: 'direccion_depto', label: 'Depto' },
      { key: 'direccion_barrio', label: 'Barrio' },
      { key: 'direccion_ciudad', label: 'Ciudad' },
      { key: 'direccion_provincia', label: 'Provincia' },
      { key: 'direccion_codigo_postal', label: 'CP' },
      { key: 'direccion_pais', label: 'País' },
      { key: 'direccion_observaciones', label: 'Observaciones' },
    ],
  },
  {
    key: 'fisico',
    label: 'Físico',
    fields: [
      { key: 'altura_cm', label: 'Altura (cm)' },
      { key: 'peso_kg', label: 'Peso (kg)' },
      { key: 'fecha_medicion_fisica', label: 'Fecha medición' },
      { key: 'contextura', label: 'Contextura' },
      { key: 'lateralidad', label: 'Lateralidad' },
      { key: 'pie_dominante', label: 'Pie dominante' },
      { key: 'mano_dominante', label: 'Mano dominante' },
      { key: 'tipo_pisada', label: 'Tipo pisada' },
      { key: 'usa_lentes', label: 'Usa lentes' },
      { key: 'tipo_lentes', label: 'Tipo lentes' },
      { key: 'usa_audifono', label: 'Usa audífono' },
    ],
  },
  {
    key: 'deporte',
    label: 'Deporte',
    fields: [
      { key: 'deporte_principal_slug', label: 'Deporte principal' },
      { key: 'años_practica_deporte_principal', label: 'Años práctica' },
      { key: 'categoria_historica_max', label: 'Categoría máx.' },
      { key: 'nivel_actividad_actual', label: 'Nivel actividad' },
      { key: 'frecuencia_entrenamiento_semanal', label: 'Entrenamientos/semana' },
      { key: 'horas_entrenamiento_semanales', label: 'Horas/semana' },
    ],
  },
  {
    key: 'profesional',
    label: 'Profesional',
    fields: [
      { key: 'profesion_ocupacion', label: 'Profesión' },
      { key: 'categoria_profesional', label: 'Categoría' },
      { key: 'empresa_actual', label: 'Empresa' },
      { key: 'cargo_actual', label: 'Cargo' },
      { key: 'industria', label: 'Industria' },
      { key: 'sitio_web_profesional', label: 'Sitio web' },
    ],
  },
  {
    key: 'educacion',
    label: 'Educación',
    fields: [
      { key: 'nivel_educativo_max', label: 'Nivel educativo' },
      { key: 'titulo_carrera', label: 'Título' },
      { key: 'institucion_titulo', label: 'Institución' },
      { key: 'año_graduacion', label: 'Año graduación' },
      { key: 'estudiando_actualmente', label: 'Estudia actualmente' },
      { key: 'institucion_actual', label: 'Institución actual' },
      { key: 'año_grado_actual', label: 'Año/grado' },
      { key: 'idioma_nativo', label: 'Idioma nativo' },
    ],
  },
  {
    key: 'membresia',
    label: 'Membresía',
    fields: [
      { key: 'fecha_primera_relacion_club', label: 'Primera relación club' },
      { key: 'es_socio_fundador', label: 'Socio fundador' },
      { key: 'es_socio_vitalicio', label: 'Socio vitalicio' },
      { key: 'es_socio_honorario', label: 'Socio honorario' },
      { key: 'bautizo_club_realizado', label: 'Bautizo realizado' },
    ],
  },
  {
    key: 'notas',
    label: 'Notas',
    fields: [
      { key: 'notas_internas', label: 'Notas internas' },
    ],
  },
]

const ALL_FIELD_KEYS = MODULES.flatMap((m) => m.fields.map((f) => f.key))
const TOTAL_FIELDS = ALL_FIELD_KEYS.length

function buildFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `personas_export_${date}`
}

export function ExportPersonasDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(ALL_FIELD_KEYS))

  function toggleField(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleModule(moduleKey: string) {
    const mod = MODULES.find((m) => m.key === moduleKey)
    if (!mod) return
    const modFieldKeys = mod.fields.map((f) => f.key)
    const allSelected = modFieldKeys.every((k) => selected.has(k))
    setSelected((prev) => {
      const next = new Set(prev)
      modFieldKeys.forEach((k) => {
        if (allSelected) next.delete(k)
        else next.add(k)
      })
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(ALL_FIELD_KEYS))
  }

  function selectNone() {
    setSelected(new Set())
  }

  function buildParams() {
    const q = searchParams.get('q') ?? undefined
    const estadosRaw = searchParams.get('estados')
    const atributosRaw = searchParams.get('atributos')
    const eliminadas = searchParams.get('eliminadas')

    return {
      campos: Array.from(selected),
      filtros: {
        search: q,
        estados: estadosRaw ? estadosRaw.split(',').filter(Boolean) : undefined,
        atributos: atributosRaw ? atributosRaw.split(',').filter(Boolean) : undefined,
        verEliminadas: eliminadas === '1',
      },
    }
  }

  async function handleExport(format: ExportFormat) {
    if (selected.size === 0) return
    setLoading(true)
    try {
      const { exportData } = await import('@/lib/export/formats')
      const result = await exportarPersonas(buildParams())
      if (!result.ok) {
        toast.error('Error al exportar personas. Intentá de nuevo.')
        return
      }

      const fields = MODULES.flatMap((m) => m.fields).filter((f) => selected.has(f.key))
      const headers = fields.map((f) => f.label)
      const rows = result.data.map((row) =>
        fields.map((f) => String(row[f.key] ?? ''))
      )

      const data: ExportData = { headers, rows, filename: buildFilename() }
      const branding: ClubBranding = {
        nombre: 'Hindu Club',
        direccion: 'Don Bosco 3569, Victoria, Buenos Aires',
        email: 'info@hinduclub.com.ar',
        web: 'www.hinduclub.com.ar',
        logoUrl: '/logo.png',
        usuario: 'Admin',
        fecha: new Date().toLocaleDateString('es-AR'),
      }

      await exportData(format, data, branding)
      toast.success(`${result.data.length} persona${result.data.length !== 1 ? 's' : ''} exportada${result.data.length !== 1 ? 's' : ''} correctamente.`)
      onOpenChange(false)
    } catch {
      toast.error('Error inesperado al exportar. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar personas</DialogTitle>
          <DialogDescription>
            Exportar todas las personas según los filtros actuales
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll} disabled={loading}>
            Seleccionar todo
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone} disabled={loading}>
            Deseleccionar todo
          </Button>
          <span className="text-sm text-muted-foreground ml-auto pt-1.5 w-full sm:w-auto text-right">
            {selected.size} de {TOTAL_FIELDS} campos
          </span>
        </div>

        <div className="space-y-4">
          {MODULES.map((mod) => {
            const modFieldKeys = mod.fields.map((f) => f.key)
            const allChecked = modFieldKeys.every((k) => selected.has(k))
            return (
              <div key={mod.key} className="rounded-md border p-3">
                <div className="flex items-center gap-3 mb-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={() => toggleModule(mod.key)}
                    disabled={loading}
                  />
                  <Label
                    className="font-medium cursor-pointer"
                    onClick={() => !loading && toggleModule(mod.key)}
                  >
                    {mod.label}
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pl-7">
                  {mod.fields.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selected.has(f.key)}
                        onCheckedChange={() => toggleField(f.key)}
                        disabled={loading}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t mt-4">
          <Button
            onClick={() => handleExport('csv')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('xlsx')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />}
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf_membretado')}
            disabled={selected.size === 0 || loading}
            size="sm"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
            Membretado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
