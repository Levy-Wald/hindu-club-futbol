'use client'

import { useState } from 'react'
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
import { Download } from 'lucide-react'
import type { EditarPersonaInput } from '../../_lib/schemas'

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

interface ExportDialogProps {
  persona: Record<string, unknown>
  form: EditarPersonaInput
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExportDialog({ persona, form, open, onOpenChange }: ExportDialogProps) {
  const allFieldKeys = MODULES.flatMap((m) => m.fields.map((f) => f.key))
  const [selected, setSelected] = useState<Set<string>>(new Set(allFieldKeys))

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
    setSelected(new Set(allFieldKeys))
  }

  function selectNone() {
    setSelected(new Set())
  }

  function handleExportCSV() {
    const fields = MODULES.flatMap((m) => m.fields).filter((f) => selected.has(f.key))
    const headers = fields.map((f) => f.label)
    const values = fields.map((f) => {
      const val = form[f.key as keyof EditarPersonaInput] ?? persona[f.key] ?? ''
      return String(val)
    })

    const csv = [headers.join(','), values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `persona_${(persona.apellido as string) ?? ''}_${(persona.nombre as string) ?? ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
    onOpenChange(false)
  }

  function handleExportJSON() {
    const fields = MODULES.flatMap((m) => m.fields).filter((f) => selected.has(f.key))
    const data: Record<string, unknown> = {}
    fields.forEach((f) => {
      data[f.key] = form[f.key as keyof EditarPersonaInput] ?? persona[f.key] ?? null
    })

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `persona_${(persona.apellido as string) ?? ''}_${(persona.nombre as string) ?? ''}.json`
    a.click()
    URL.revokeObjectURL(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar datos de persona</DialogTitle>
          <DialogDescription>
            Seleccioná los campos que querés exportar. Podés elegir por módulo o campo individual.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll}>Seleccionar todo</Button>
          <Button variant="outline" size="sm" onClick={selectNone}>Deseleccionar todo</Button>
          <span className="text-sm text-muted-foreground ml-auto pt-1.5 w-full sm:w-auto text-right">
            {selected.size} de {allFieldKeys.length} campos
          </span>
        </div>

        <div className="space-y-4">
          {MODULES.map((mod) => {
            const modFieldKeys = mod.fields.map((f) => f.key)
            const allChecked = modFieldKeys.every((k) => selected.has(k))
            const someChecked = modFieldKeys.some((k) => selected.has(k))
            return (
              <div key={mod.key} className="rounded-md border p-3">
                <div className="flex items-center gap-3 mb-2">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={() => toggleModule(mod.key)}
                  />
                  <Label className="font-medium cursor-pointer" onClick={() => toggleModule(mod.key)}>
                    {mod.label}
                  </Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pl-7">
                  {mod.fields.map((f) => (
                    <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selected.has(f.key)}
                        onCheckedChange={() => toggleField(f.key)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4">
          <Button onClick={handleExportCSV} disabled={selected.size === 0} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportJSON} disabled={selected.size === 0} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
