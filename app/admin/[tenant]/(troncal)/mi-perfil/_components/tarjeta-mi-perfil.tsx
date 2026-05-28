'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, Share2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface Equipo {
  id: string
  nombre: string
  disciplina_slug: string
  modalidad: string | null
  color_principal?: string | null
  color_secundario?: string | null
  escudo_url?: string | null
  torneo?: string | null
  categorias_equipo?: { nombre_display: string } | null
  categoria?: { nombre_display: string } | null
}

interface Asignacion {
  id: string
  rol_equipo_slug: string
  dorsal: number | null
  posicion: string | null
  equipo: Equipo | null
}

interface TarjetaJugadorMiPerfilProps {
  persona: {
    nombre: string
    apellido: string
    foto_perfil_url?: string | null
    fecha_nacimiento?: string | null
    peso_kg?: number | null
    altura_cm?: number | null
  }
  asignaciones: Asignacion[]
}

const DISCIPLINA_LABELS: Record<string, string> = {
  hockey: 'Hockey',
  futbol: 'Fútbol',
  rugby: 'Rugby',
  natacion: 'Natación',
  tenis: 'Tenis',
  padel: 'Pádel',
  basquet: 'Básquet',
  voley: 'Vóley',
  handball: 'Handball',
  atletismo: 'Atletismo',
  gimnasia: 'Gimnasia',
  otro: 'Otro',
}

function calcularEdad(fechaNac: string): number {
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function TarjetaJugadorMiPerfil({ persona, asignaciones }: TarjetaJugadorMiPerfilProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  if (asignaciones.length === 0) return null

  const edad = persona.fecha_nacimiento ? calcularEdad(persona.fecha_nacimiento) : null

  // Get primary team for colors (first assignment)
  const primaryEquipo = asignaciones[0]?.equipo
  const colorPrincipal = primaryEquipo?.color_principal || '#1a1a2e'
  const colorSecundario = primaryEquipo?.color_secundario || '#e2e8f0'

  // Collect unique disciplines
  const disciplinas = [...new Set(asignaciones.map((a) => a.equipo?.disciplina_slug).filter(Boolean))] as string[]

  // Collect unique categories
  const categorias = [...new Set(
    asignaciones
      .map((a) => a.equipo?.categorias_equipo?.nombre_display || a.equipo?.categoria?.nombre_display)
      .filter(Boolean)
  )] as string[]

  // Collect unique torneos
  const torneos = [...new Set(
    asignaciones.map((a) => a.equipo?.torneo).filter(Boolean)
  )] as string[]

  // Primary dorsal (first assignment that has one)
  const primaryDorsal = asignaciones.find((a) => a.dorsal != null)?.dorsal ?? null

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: 'transparent',
      })
      const link = document.createElement('a')
      link.download = `tarjeta-${persona.apellido.toLowerCase()}-${persona.nombre.toLowerCase()}.png`
      link.href = dataUrl
      link.click()
      toast.success('Tarjeta descargada')
    } catch {
      toast.error('Error al generar la tarjeta')
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3 })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `tarjeta-${persona.apellido.toLowerCase()}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Tarjeta de ${persona.nombre} ${persona.apellido}` })
      } else {
        handleDownload()
      }
    } catch {
      toast.error('Error al compartir')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mi tarjeta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mi tarjeta</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div
            ref={cardRef}
            className="w-[320px] rounded-2xl overflow-hidden relative select-none"
            style={{
              background: `linear-gradient(145deg, ${colorPrincipal} 0%, ${colorPrincipal}dd 60%, ${colorPrincipal}99 100%)`,
            }}
          >
            {/* Decorative shapes */}
            <div
              className="absolute top-0 right-0 w-36 h-36 opacity-15 rounded-bl-[60px]"
              style={{ backgroundColor: colorSecundario }}
            />
            <div
              className="absolute bottom-0 left-0 w-44 h-44 opacity-8 rounded-tr-[60px]"
              style={{ backgroundColor: colorSecundario }}
            />
            <div
              className="absolute top-16 left-4 w-2 h-16 opacity-20 rounded-full"
              style={{ backgroundColor: colorSecundario }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col p-6">
              {/* Top: escudo + dorsal */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {primaryEquipo?.escudo_url ? (
                    <img src={primaryEquipo.escudo_url} alt="" className="h-8 w-8 object-contain" />
                  ) : null}
                  {asignaciones.length > 1 && (
                    <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                      {asignaciones.length} equipos
                    </span>
                  )}
                </div>
                {primaryDorsal != null && (
                  <div
                    className="text-5xl font-black leading-none"
                    style={{ color: `${colorSecundario}cc` }}
                  >
                    {primaryDorsal}
                  </div>
                )}
              </div>

              {/* Foto + nombre */}
              <div className="flex items-center gap-4 mb-5">
                <div
                  className="w-20 h-20 rounded-xl border-3 flex items-center justify-center overflow-hidden shrink-0"
                  style={{ borderColor: `${colorSecundario}88` }}
                >
                  {persona.foto_perfil_url ? (
                    <img src={persona.foto_perfil_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white/70">
                      {persona.nombre[0]}{persona.apellido[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white leading-tight truncate">
                    {persona.nombre}
                  </h3>
                  <h2 className="text-xl font-black text-white uppercase leading-tight truncate">
                    {persona.apellido}
                  </h2>
                </div>
              </div>

              {/* Info grid: edad, nacimiento, peso, altura */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-5">
                {edad != null && (
                  <InfoItem label="Edad" value={`${edad} años`} color={colorSecundario} />
                )}
                {persona.fecha_nacimiento && (
                  <InfoItem label="Nacimiento" value={formatFecha(persona.fecha_nacimiento)} color={colorSecundario} />
                )}
                {persona.altura_cm && (
                  <InfoItem label="Altura" value={`${persona.altura_cm} cm`} color={colorSecundario} />
                )}
                {persona.peso_kg && (
                  <InfoItem label="Peso" value={`${persona.peso_kg} kg`} color={colorSecundario} />
                )}
              </div>

              {/* Separator */}
              <div className="h-px w-full opacity-20 mb-4" style={{ backgroundColor: colorSecundario }} />

              {/* Deportivo: disciplinas + categorías */}
              {disciplinas.length > 0 && (
                <div className="mb-3">
                  <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">
                    {disciplinas.length === 1 ? 'Disciplina' : 'Disciplinas'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {disciplinas.map((d) => (
                      <span
                        key={d}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase"
                        style={{ backgroundColor: `${colorSecundario}cc`, color: colorPrincipal }}
                      >
                        {DISCIPLINA_LABELS[d] || d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {categorias.length > 0 && (
                <div className="mb-3">
                  <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">
                    {categorias.length === 1 ? 'Categoría' : 'Categorías'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {categorias.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-white/90"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipos list */}
              <div className="mb-3">
                <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">
                  {asignaciones.length === 1 ? 'Equipo' : 'Equipos'}
                </span>
                <div className="flex flex-col gap-1 mt-1">
                  {asignaciones.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-[11px] text-white/80">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: colorSecundario }} />
                      <span className="font-medium truncate">{a.equipo?.nombre ?? '—'}</span>
                      {a.posicion && (
                        <span className="text-white/50">· {a.posicion}</span>
                      )}
                      {a.dorsal != null && (
                        <span className="text-white/50">#{a.dorsal}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Torneos */}
              {torneos.length > 0 && (
                <div>
                  <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">
                    {torneos.length === 1 ? 'Torneo' : 'Torneos'}
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {torneos.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white/70 border border-white/10"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleDownload} disabled={downloading} className="flex-1 gap-2">
            <Download className="h-4 w-4" />
            Descargar PNG
          </Button>
          <Button onClick={handleShare} disabled={downloading} variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest">{label}</span>
      <p className="text-sm font-bold text-white/90 leading-tight" style={{ textShadow: `0 0 20px ${color}33` }}>
        {value}
      </p>
    </div>
  )
}
