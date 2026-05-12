'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { generarNominaLinkAction, obtenerDefaultsEvento } from '../../lib/actions'
import { CAMPOS_SOLICITABLES, CAMPOS_SLUGS, type CampoSlug } from '../../lib/catalogo-campos'

type Props = {
  onClose: () => void
  onCreated: () => void
}

type Evento = { id: string; titulo: string; fecha: string; tipo_evento_slug: string }

export function ModalGenerarLink({ onClose, onCreated }: Props) {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventoId, setEventoId] = useState('')
  const [nivel, setNivel] = useState('L0')
  const [camposChecked, setCamposChecked] = useState<Set<CampoSlug>>(
    new Set(['nombre', 'apellido', 'dni', 'rol'])
  )
  const [nombreContacto, setNombreContacto] = useState('')
  const [emailContacto, setEmailContacto] = useState('')
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // AP-001 ✓: eventos NO tiene deleted_at
    supabase
      .from('eventos')
      .select('id, titulo, fecha, tipo_evento_slug')
      .gte('fecha', new Date().toISOString().slice(0, 10))
      .order('fecha', { ascending: true })
      .limit(50)
      .then(({ data }) => setEventos(data ?? []))
  }, [])

  const handleEventoChange = async (id: string) => {
    setEventoId(id)
    const evento = eventos.find((e) => e.id === id)
    if (evento) {
      const defaults = await obtenerDefaultsEvento(evento.tipo_evento_slug)
      setNivel(defaults.nivel)
      setCamposChecked(new Set(defaults.campos as CampoSlug[]))
    }
  }

  const toggleCampo = (slug: CampoSlug) => {
    if (slug === 'nombre' || slug === 'apellido') return // siempre requeridos
    setCamposChecked((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const handleGenerar = async () => {
    if (!eventoId) {
      toast.error('Seleccioná un evento')
      return
    }

    setIsGenerating(true)
    const result = await generarNominaLinkAction({
      evento_id: eventoId,
      campos_solicitados: Array.from(camposChecked),
      nivel_validacion: nivel,
      nombre_contacto: nombreContacto || undefined,
      email_contacto: emailContacto || undefined,
    })
    setIsGenerating(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setGeneratedUrl(result.data.url)
    toast.success('Link generado')
  }

  const copyLink = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl)
      toast.success('Link copiado')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Generar link de nómina</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600">✕</button>
        </div>

        {generatedUrl ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">Link generado. Copialo y compartilo.</p>
            <input
              type="text"
              readOnly
              value={generatedUrl}
              data-testid="input-link-generado"
              className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-sm bg-neutral-50"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="flex-1 h-10 rounded-lg bg-brand-600 text-white text-sm font-medium"
              >
                Copiar link
              </button>
              <button
                type="button"
                onClick={() => { onCreated() }}
                className="flex-1 h-10 rounded-lg border border-neutral-300 text-neutral-700 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Evento */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Evento</label>
              <select
                value={eventoId}
                onChange={(e) => handleEventoChange(e.target.value)}
                data-testid="select-evento"
                className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-sm bg-white"
              >
                <option value="">Seleccionar evento...</option>
                {eventos.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.titulo} ({ev.fecha})
                  </option>
                ))}
              </select>
            </div>

            {/* Nivel validación */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nivel de validación</label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                data-testid="select-nivel-validacion"
                className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-sm bg-white"
              >
                <option value="L0">L0 - Mínimo</option>
                <option value="L1">L1 - Básico (email cargador)</option>
                <option value="L2" disabled>L2 - Medio (disponible FASE 16)</option>
                <option value="L3" disabled>L3 - Alto (disponible post-FASE 16)</option>
                <option value="L4" disabled>L4 - Fuerte (disponible FASE 10)</option>
              </select>
            </div>

            {/* Campos */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Campos a solicitar</label>
              <div className="space-y-1">
                {CAMPOS_SLUGS.map((slug) => {
                  const campo = CAMPOS_SOLICITABLES[slug]
                  const locked = campo.requerido_siempre
                  return (
                    <label key={slug} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={camposChecked.has(slug)}
                        disabled={locked}
                        onChange={() => toggleCampo(slug)}
                        className="rounded"
                      />
                      <span className={locked ? 'text-neutral-400' : 'text-neutral-700'}>
                        {campo.label}{locked ? ' (obligatorio)' : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre contacto (opcional)</label>
              <input
                type="text"
                value={nombreContacto}
                onChange={(e) => setNombreContacto(e.target.value)}
                className="w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm"
                placeholder="Ej: DT del equipo rival"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email contacto (opcional)</label>
              <input
                type="email"
                value={emailContacto}
                onChange={(e) => setEmailContacto(e.target.value)}
                className="w-full h-10 rounded-lg border border-neutral-300 px-3 text-sm"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerar}
              disabled={isGenerating || !eventoId}
              data-testid="btn-confirmar-generar"
              className="w-full h-12 rounded-xl bg-brand-600 text-white font-semibold
                         hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? 'Generando...' : 'Generar link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
