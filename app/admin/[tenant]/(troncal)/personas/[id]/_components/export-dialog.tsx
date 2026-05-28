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
import { Download, FileText, FileSpreadsheet, Braces, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getVinculoLabel } from '@/lib/vinculos/labels'
import type { EditarPersonaInput } from '../../_lib/schemas'

// --- Field modules for flat persona data ---

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

const RELATED_MODULES = [
  { key: 'equipos', label: 'Equipos' },
  { key: 'vinculos', label: 'Vínculos' },
  { key: 'trayectoria', label: 'Trayectoria / Logros' },
  { key: 'salud', label: 'Datos médicos / Lesiones' },
]

interface ExportDialogProps {
  persona: Record<string, unknown>
  form: EditarPersonaInput
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getFieldValue(form: EditarPersonaInput, persona: Record<string, unknown>, key: string): string {
  const val = form[key as keyof EditarPersonaInput] ?? persona[key] ?? ''
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

export function ExportDialog({ persona, form, open, onOpenChange }: ExportDialogProps) {
  const allFieldKeys = MODULES.flatMap((m) => m.fields.map((f) => f.key))
  const allRelatedKeys = RELATED_MODULES.map((m) => m.key)
  const [selected, setSelected] = useState<Set<string>>(new Set([...allFieldKeys, ...allRelatedKeys]))
  const [exporting, setExporting] = useState(false)

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
    if (mod) {
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
    } else {
      // Related module toggle
      toggleField(moduleKey)
    }
  }

  function selectAll() {
    setSelected(new Set([...allFieldKeys, ...allRelatedKeys]))
  }

  function selectNone() {
    setSelected(new Set())
  }

  const personaName = `${(persona.apellido as string) ?? ''}_${(persona.nombre as string) ?? ''}`.replace(/\s+/g, '_')

  // --- Fetch related data for export ---

  async function fetchRelatedData() {
    const personaId = persona.id as string
    const data: Record<string, unknown> = {}

    if (selected.has('equipos')) {
      const equipos = ((persona.personas_equipos ?? []) as { activo: boolean; equipo: { nombre: string } | null; rol_equipo_slug: string; dorsal: number | null; posicion: string | null }[])
        .filter((e) => e.activo)
        .map((e) => ({
          equipo: e.equipo?.nombre ?? '—',
          rol: e.rol_equipo_slug,
          dorsal: e.dorsal,
          posicion: e.posicion,
        }))
      data.equipos = equipos
    }

    if (selected.has('vinculos')) {
      const vinculosOrigen = ((persona.personas_vinculos_origen ?? []) as { activo: boolean; tipo_vinculo_slug: string; destino?: { nombre: string; apellido: string } }[]).filter((v) => v.activo)
      const vinculosDestino = ((persona.personas_vinculos_destino ?? []) as { activo: boolean; tipo_vinculo_slug: string; origen?: { nombre: string; apellido: string } }[]).filter((v) => v.activo)
      data.vinculos = [
        ...vinculosOrigen.map((v) => ({
          tipo: getVinculoLabel(v.tipo_vinculo_slug, 'directo'),
          persona: v.destino ? `${v.destino.apellido}, ${v.destino.nombre}` : '—',
        })),
        ...vinculosDestino.map((v) => ({
          tipo: getVinculoLabel(v.tipo_vinculo_slug, 'inverso'),
          persona: v.origen ? `${v.origen.apellido}, ${v.origen.nombre}` : '—',
        })),
      ]
    }

    if (selected.has('trayectoria')) {
      try {
        const res = await fetch(`/api/historial-deportivo/${personaId}`)
        if (res.ok) {
          const trayData = await res.json()
          data.trayectoria = trayData.trayectoria ?? []
          data.logros = trayData.logros ?? []
        }
      } catch { /* empty */ }
    }

    if (selected.has('salud')) {
      const supabase = createClient()
      const [medicos, lesiones] = await Promise.all([
        supabase.from('personas_datos_medicos').select('*').eq('persona_id', personaId).maybeSingle(),
        supabase.from('personas_lesiones').select('tipo_lesion, zona_corporal, gravedad, fecha_inicio, fecha_alta_medica, recuperada').eq('persona_id', personaId).is('deleted_at', null),
      ])
      if (medicos.data) data.datos_medicos = medicos.data
      data.lesiones = lesiones.data ?? []
    }

    return data
  }

  // --- CSV Export ---

  async function handleExportCSV() {
    setExporting(true)
    try {
      const fields = MODULES.flatMap((m) => m.fields).filter((f) => selected.has(f.key))
      const headers = fields.map((f) => f.label)
      const values = fields.map((f) => getFieldValue(form, persona, f.key))

      const csv = [headers.join(','), values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')].join('\n')
      downloadBlob('\uFEFF' + csv, `persona_${personaName}.csv`, 'text/csv;charset=utf-8;')
      onOpenChange(false)
    } finally {
      setExporting(false)
    }
  }

  // --- JSON Export ---

  async function handleExportJSON() {
    setExporting(true)
    try {
      const fields = MODULES.flatMap((m) => m.fields).filter((f) => selected.has(f.key))
      const data: Record<string, unknown> = {}
      fields.forEach((f) => {
        data[f.key] = form[f.key as keyof EditarPersonaInput] ?? persona[f.key] ?? null
      })

      const related = await fetchRelatedData()
      Object.assign(data, related)

      downloadBlob(JSON.stringify(data, null, 2), `persona_${personaName}.json`, 'application/json')
      onOpenChange(false)
    } finally {
      setExporting(false)
    }
  }

  // --- PDF Export ---

  async function handleExportPDF(withLetterhead: boolean) {
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      let y = 15

      // Letterhead
      if (withLetterhead) {
        const supabase = createClient()
        const { data: config } = await supabase
          .from('tenant_config_publica')
          .select('logo_url, nombre_display, color_primario, direccion, telefono, email_contacto')
          .eq('tenant_id', persona.tenant_id as string)
          .maybeSingle()

        if (config) {
          // Header bar
          const primaryColor = config.color_primario || '#3A8FC5'
          const r = parseInt(primaryColor.slice(1, 3), 16)
          const g = parseInt(primaryColor.slice(3, 5), 16)
          const b = parseInt(primaryColor.slice(5, 7), 16)
          doc.setFillColor(r, g, b)
          doc.rect(0, 0, pageWidth, 25, 'F')

          // Try to load logo
          if (config.logo_url) {
            try {
              const logoRes = await fetch(config.logo_url)
              const logoBlob = await logoRes.blob()
              const logoBase64 = await blobToBase64(logoBlob)
              doc.addImage(logoBase64, 'PNG', 10, 3, 19, 19)
            } catch {
              // Skip logo if it fails to load
            }
          }

          // Org name
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text(config.nombre_display || 'Organización', 35, 12)

          // Contact info
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          const contactParts = [config.direccion, config.telefono, config.email_contacto].filter(Boolean)
          if (contactParts.length > 0) {
            doc.text(contactParts.join(' | '), 35, 18)
          }

          doc.setTextColor(0, 0, 0)
          y = 32
        }
      }

      // Title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Ficha de persona', 14, y)
      y += 7

      // Person header
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      const nombreCompleto = `${form.apellido || ''}, ${form.nombre || ''}`.trim()
      doc.text(nombreCompleto, 14, y)
      y += 5
      if (form.numero_documento) {
        doc.setFontSize(9)
        doc.text(`Doc: ${form.numero_documento}`, 14, y)
        y += 4
      }
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`, 14, y)
      doc.setTextColor(0, 0, 0)
      y += 6

      // Line separator
      doc.setDrawColor(200, 200, 200)
      doc.line(14, y, pageWidth - 14, y)
      y += 4

      // Flat field sections
      for (const mod of MODULES) {
        const modFields = mod.fields.filter((f) => selected.has(f.key))
        if (modFields.length === 0) continue

        const tableData = modFields.map((f) => [f.label, getFieldValue(form, persona, f.key)])

        // Check for page break
        if (y > 260) {
          doc.addPage()
          y = 15
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(mod.label, 14, y)
        y += 2

        autoTable(doc, {
          startY: y,
          head: [],
          body: tableData,
          theme: 'plain',
          styles: { fontSize: 8, cellPadding: 1.5 },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 100, 100] },
            1: { cellWidth: 'auto' },
          },
          margin: { left: 14, right: 14 },
        })

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
      }

      // Related data in PDF
      const related = await fetchRelatedData()

      // Equipos
      if (related.equipos && (related.equipos as unknown[]).length > 0) {
        if (y > 250) { doc.addPage(); y = 15 }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Equipos', 14, y)
        y += 2

        const equiposData = (related.equipos as { equipo: string; rol: string; dorsal: number | null; posicion: string | null }[])
          .map((e) => [e.equipo, e.rol, e.dorsal != null ? String(e.dorsal) : '—', e.posicion || '—'])

        autoTable(doc, {
          startY: y,
          head: [['Equipo', 'Rol', 'Dorsal', 'Posición']],
          body: equiposData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
          margin: { left: 14, right: 14 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
      }

      // Vinculos
      if (related.vinculos && (related.vinculos as unknown[]).length > 0) {
        if (y > 250) { doc.addPage(); y = 15 }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Vínculos', 14, y)
        y += 2

        const vinculosData = (related.vinculos as { tipo: string; persona: string }[])
          .map((v) => [v.tipo, v.persona])

        autoTable(doc, {
          startY: y,
          head: [['Tipo', 'Persona']],
          body: vinculosData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
          margin: { left: 14, right: 14 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
      }

      // Trayectoria
      if (related.trayectoria && (related.trayectoria as unknown[]).length > 0) {
        if (y > 250) { doc.addPage(); y = 15 }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Trayectoria clubes', 14, y)
        y += 2

        const trayData = (related.trayectoria as { club_nombre: string; fecha_desde?: string; fecha_hasta?: string; categoria?: string; posicion?: string }[])
          .map((t) => [
            t.club_nombre,
            [t.fecha_desde, t.fecha_hasta].filter(Boolean).join(' — ') || '—',
            t.categoria || '—',
            t.posicion || '—',
          ])

        autoTable(doc, {
          startY: y,
          head: [['Club', 'Período', 'Categoría', 'Posición']],
          body: trayData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 1.5 },
          headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
          margin: { left: 14, right: 14 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
      }

      // Datos médicos
      if (related.datos_medicos) {
        if (y > 250) { doc.addPage(); y = 15 }
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Datos médicos', 14, y)
        y += 2

        const med = related.datos_medicos as Record<string, unknown>
        const medFields = [
          ['Grupo sanguíneo', med.grupo_sanguineo],
          ['Factor RH', med.factor_rh],
          ['Donante órganos', med.donante_organos ? 'Sí' : 'No'],
          ['Alergias medicamentos', Array.isArray(med.alergias_medicamentos) ? (med.alergias_medicamentos as string[]).join(', ') : ''],
          ['Antecedentes', med.antecedentes_medicos],
          ['Médico cabecera', med.medico_cabecera_nombre],
        ].filter(([, v]) => v).map(([k, v]) => [String(k), String(v)])

        if (medFields.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [],
            body: medFields,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 50, textColor: [100, 100, 100] },
            },
            margin: { left: 14, right: 14 },
          })
          y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
        }
      }

      // Footer on every page
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
        if (withLetterhead) {
          doc.text('Documento generado automáticamente — Confidencial', 14, doc.internal.pageSize.getHeight() - 8)
        }
      }

      doc.save(`ficha_${personaName}${withLetterhead ? '_membretada' : ''}.pdf`)
      onOpenChange(false)
    } catch (err) {
      console.error('Error generating PDF:', err)
      toast.error('Error generando PDF')
    } finally {
      setExporting(false)
    }
  }

  // --- Helpers ---

  function downloadBlob(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- Render ---

  const totalSelected = allFieldKeys.filter((k) => selected.has(k)).length + allRelatedKeys.filter((k) => selected.has(k)).length
  const totalFields = allFieldKeys.length + allRelatedKeys.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar ficha de persona</DialogTitle>
          <DialogDescription>
            Seleccioná los campos y secciones que querés exportar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAll}>Seleccionar todo</Button>
          <Button variant="outline" size="sm" onClick={selectNone}>Deseleccionar todo</Button>
          <span className="text-sm text-muted-foreground ml-auto pt-1.5 w-full sm:w-auto text-right">
            {totalSelected} de {totalFields} secciones/campos
          </span>
        </div>

        <div className="space-y-4">
          {/* Flat field modules */}
          {MODULES.map((mod) => {
            const modFieldKeys = mod.fields.map((f) => f.key)
            const allChecked = modFieldKeys.every((k) => selected.has(k))
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

          {/* Related data modules */}
          <div className="rounded-md border p-3">
            <Label className="font-medium mb-2 block">Datos relacionados</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-1">
              {RELATED_MODULES.map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selected.has(mod.key)}
                    onCheckedChange={() => toggleField(mod.key)}
                  />
                  {mod.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t mt-4">
          <Button
            onClick={() => handleExportPDF(false)}
            disabled={totalSelected === 0 || exporting}
            className="flex-1"
            variant="default"
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            PDF
          </Button>
          <Button
            onClick={() => handleExportPDF(true)}
            disabled={totalSelected === 0 || exporting}
            className="flex-1"
            variant="default"
          >
            {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            PDF membrete
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={totalSelected === 0 || exporting}
            className="flex-1"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportJSON}
            disabled={totalSelected === 0 || exporting}
            className="flex-1"
          >
            <Braces className="mr-2 h-4 w-4" />
            JSON
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
