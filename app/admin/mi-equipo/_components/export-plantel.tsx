'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Download, FileDown, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

interface Miembro {
  id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  persona: {
    nombre: string
    apellido: string
    whatsapp: string | null
    telefono_principal: string | null
    email_principal: string | null
    numero_documento: string | null
  } | null
}

interface ExportPlantelProps {
  equipo: {
    nombre: string
    escudo_url: string | null
    color_principal: string | null
    disciplina: string
    categoria: string | null
    torneo: string | null
  }
  plantel: Miembro[]
}

const ROLES_STAFF = ['dt', 'preparador_fisico', 'kinesiologo', 'delegado', 'ayudante_campo', 'masajista', 'utilero']

const ROL_LABELS: Record<string, string> = {
  dt: 'DT',
  preparador_fisico: 'Preparador Físico',
  kinesiologo: 'Kinesiólogo',
  delegado: 'Delegado',
  ayudante_campo: 'Ayudante de Campo',
  masajista: 'Masajista',
  utilero: 'Utilero',
  capitan: 'Capitán',
  subcapitan: 'Sub-capitán',
  jugador: 'Jugador',
  arquero: 'Arquero',
}

export function ExportPlantel({ equipo, plantel }: ExportPlantelProps) {
  const [incluirStaff, setIncluirStaff] = useState(true)
  const [incluirMembrete, setIncluirMembrete] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const jugadores = plantel.filter((m) => !ROLES_STAFF.includes(m.rol_equipo_slug))
  const staff = plantel.filter((m) => ROLES_STAFF.includes(m.rol_equipo_slug))
  const listado = incluirStaff ? [...jugadores, ...staff] : jugadores

  function exportCSV() {
    const headers = ['Dorsal', 'Apellido', 'Nombre', 'Rol', 'Posición', 'WhatsApp', 'Teléfono', 'Email', 'DNI']
    const rows = listado.map((m) => [
      m.dorsal ?? '',
      m.persona?.apellido ?? '',
      m.persona?.nombre ?? '',
      ROL_LABELS[m.rol_equipo_slug] || m.rol_equipo_slug,
      m.posicion ?? '',
      m.persona?.whatsapp ?? '',
      m.persona?.telefono_principal ?? '',
      m.persona?.email_principal ?? '',
      m.persona?.numero_documento ?? '',
    ])

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `plantel-${equipo.nombre.toLowerCase().replace(/\s+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV descargado')
  }

  async function exportPNG() {
    if (!printRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(printRef.current, { quality: 1, pixelRatio: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `plantel-${equipo.nombre.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      link.click()
      toast.success('Imagen descargada')
    } catch {
      toast.error('Error al generar imagen')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <FileDown className="h-3.5 w-3.5" />
        Exportar
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar plantel</DialogTitle>
        </DialogHeader>

        {/* Opciones */}
        <div className="flex flex-wrap gap-4 py-2">
          <div className="flex items-center gap-2">
            <Switch checked={incluirStaff} onCheckedChange={setIncluirStaff} id="exp-staff" />
            <Label htmlFor="exp-staff" className="text-sm">Incluir cuerpo técnico</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={incluirMembrete} onCheckedChange={setIncluirMembrete} id="exp-membrete" />
            <Label htmlFor="exp-membrete" className="text-sm">Con membrete</Label>
          </div>
        </div>

        {/* Preview */}
        <div className="border rounded-lg overflow-hidden">
          <div ref={printRef} className="bg-white p-4 sm:p-6">
            {/* Membrete */}
            {incluirMembrete ? (
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                {equipo.escudo_url ? (
                  <img src={equipo.escudo_url} alt="" className="h-10 w-10 object-contain" />
                ) : equipo.color_principal ? (
                  <div
                    className="h-10 w-10 rounded-md"
                    style={{ backgroundColor: equipo.color_principal }}
                  />
                ) : null}
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">{equipo.nombre}</h3>
                  <p className="text-xs text-neutral-500">
                    {[equipo.categoria, equipo.disciplina, equipo.torneo].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Tabla */}
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-1.5 font-semibold text-neutral-600 w-8">#</th>
                  <th className="pb-1.5 font-semibold text-neutral-600">Jugador</th>
                  <th className="pb-1.5 font-semibold text-neutral-600">Rol</th>
                  <th className="pb-1.5 font-semibold text-neutral-600">Posición</th>
                  <th className="pb-1.5 font-semibold text-neutral-600">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {listado.map((m, idx) => (
                  <tr key={m.id} className={idx % 2 === 0 ? 'bg-neutral-50' : ''}>
                    <td className="py-1.5 text-neutral-500 font-mono">{m.dorsal ?? '-'}</td>
                    <td className="py-1.5 font-medium text-neutral-900">
                      {m.persona?.apellido}, {m.persona?.nombre}
                    </td>
                    <td className="py-1.5 text-neutral-600">
                      {ROL_LABELS[m.rol_equipo_slug] || m.rol_equipo_slug}
                    </td>
                    <td className="py-1.5 text-neutral-600">{m.posicion || '-'}</td>
                    <td className="py-1.5 text-neutral-600">{m.persona?.whatsapp || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <p className="text-[10px] text-neutral-400 mt-4 text-right">
              Generado el {new Date().toLocaleDateString('es-AR')} · {listado.length} integrantes
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <Button onClick={exportPNG} disabled={downloading} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Descargar imagen
          </Button>
          <Button onClick={exportCSV} variant="outline" className="flex-1 gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Descargar CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
