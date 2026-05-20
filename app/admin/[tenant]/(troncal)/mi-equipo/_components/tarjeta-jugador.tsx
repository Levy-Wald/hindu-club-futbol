'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, Share2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

const ROL_LABELS: Record<string, string> = {
  capitan: 'Capitán',
  subcapitan: 'Sub-capitán',
  dt: 'Director Técnico',
  delegado: 'Delegado',
  preparador_fisico: 'Preparador Físico',
  kinesiologo: 'Kinesiólogo',
  ayudante_campo: 'Ayudante de Campo',
}

interface TarjetaJugadorProps {
  jugador: {
    nombre: string
    apellido: string
    dorsal: number | null
    posicion: string | null
    rol: string
    foto_url: string | null
    foto_credencial_url?: string | null
    pie_dominante?: string | null
    altura_cm?: number | null
    peso_kg?: number | null
    edad?: number | null
  }
  equipo: {
    nombre: string
    escudo_url: string | null
    color_principal: string | null
    color_secundario: string | null
    disciplina: string
    categoria: string | null
    torneo: string | null
  }
  triggerLabel?: string
}

export function TarjetaJugador({ jugador, equipo, triggerLabel }: TarjetaJugadorProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const colorPrincipal = equipo.color_principal || '#1a1a2e'
  const colorSecundario = equipo.color_secundario || '#e2e8f0'
  const fotoFinal = jugador.foto_url || jugador.foto_credencial_url || null

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
      link.download = `tarjeta-${jugador.apellido.toLowerCase()}-${jugador.nombre.toLowerCase()}.png`
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
      const file = new File([blob], `tarjeta-${jugador.apellido.toLowerCase()}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Tarjeta de ${jugador.nombre} ${jugador.apellido}` })
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
          <span className="hidden sm:inline">{triggerLabel || 'Tarjeta'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tarjeta del Jugador</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <div
            ref={cardRef}
            className="w-[280px] h-[400px] rounded-2xl overflow-hidden relative select-none"
            style={{
              background: `linear-gradient(135deg, ${colorPrincipal} 0%, ${colorPrincipal}dd 50%, ${colorPrincipal}99 100%)`,
            }}
          >
            {/* Top decorative shape */}
            <div
              className="absolute top-0 right-0 w-32 h-32 opacity-20 rounded-bl-full"
              style={{ backgroundColor: colorSecundario }}
            />
            <div
              className="absolute bottom-0 left-0 w-40 h-40 opacity-10 rounded-tr-full"
              style={{ backgroundColor: colorSecundario }}
            />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center p-6">
              {/* Escudo y equipo */}
              <div className="flex items-center gap-2 mb-3">
                {equipo.escudo_url ? (
                  <img src={equipo.escudo_url} alt="" className="h-6 w-6 object-contain" />
                ) : null}
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  {equipo.nombre}
                </span>
              </div>

              {/* Dorsal grande */}
              {jugador.dorsal ? (
                <div className="text-6xl font-black text-white/90 leading-none mb-2">
                  {jugador.dorsal}
                </div>
              ) : (
                <div className="h-16 mb-2" />
              )}

              {/* Foto o iniciales */}
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4 overflow-hidden"
                style={{ borderColor: colorSecundario }}
              >
                {fotoFinal ? (
                  <img src={fotoFinal} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white/80">
                    {jugador.nombre[0]}{jugador.apellido[0]}
                  </span>
                )}
              </div>

              {/* Nombre */}
              <h3 className="text-lg font-bold text-white text-center leading-tight">
                {jugador.nombre}
              </h3>
              <h2 className="text-xl font-black text-white uppercase text-center leading-tight">
                {jugador.apellido}
              </h2>

              {/* Stats */}
              <div className="flex items-center gap-3 text-[10px] text-white/70 mt-1">
                {jugador.edad != null ? <span>{jugador.edad} años</span> : null}
                {jugador.altura_cm ? <span>{jugador.altura_cm} cm</span> : null}
                {jugador.peso_kg ? <span>{jugador.peso_kg} kg</span> : null}
                {jugador.pie_dominante ? <span>Pie {jugador.pie_dominante}</span> : null}
              </div>

              {/* Posición y rol */}
              <div className="mt-auto flex flex-col items-center gap-1.5">
                {jugador.posicion ? (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ backgroundColor: colorSecundario, color: colorPrincipal }}
                  >
                    {jugador.posicion}
                  </span>
                ) : null}
                {jugador.rol && jugador.rol !== 'jugador' ? (
                  <span className="px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20 text-white/90">
                    {ROL_LABELS[jugador.rol] || jugador.rol.replace(/_/g, ' ')}
                  </span>
                ) : null}
              </div>

              {/* Footer */}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-white/60 uppercase tracking-wide">
                {equipo.categoria ? <span>{equipo.categoria}</span> : null}
                {equipo.torneo ? (
                  <>
                    <span>·</span>
                    <span>{equipo.torneo}</span>
                  </>
                ) : null}
              </div>
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
