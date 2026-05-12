'use client'

import { useState } from 'react'
import { CAMPOS_SOLICITABLES, ROLES_OPTIONS } from '../../lib/catalogo-campos'
import type { NominaPublicInfo, PersonaInput, EntidadInput } from '../../lib/types'

type Props = {
  token: string
  info: NominaPublicInfo
}

export function FormPublico({ token, info }: Props) {
  const [personas, setPersonas] = useState<PersonaInput[]>([])
  const [entidades, setEntidades] = useState<EntidadInput[]>([])
  const [cargadorEmail, setCargadorEmail] = useState('')
  const [tab, setTab] = useState<'personas' | 'entidades'>('personas')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const campos = info.campos_solicitados.filter(
    (s) => s in CAMPOS_SOLICITABLES
  )

  const fechaFormateada = new Date(info.evento.fecha + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const agregarPersona = () => {
    setPersonas((prev) => [...prev, { nombre: '', apellido: '' }])
  }

  const agregarEntidad = () => {
    setEntidades((prev) => [...prev, { nombre: '' }])
  }

  const actualizarPersona = (idx: number, campo: string, valor: string) => {
    setPersonas((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [campo]: valor } : p))
    )
  }

  const quitarPersona = (idx: number) => {
    setPersonas((prev) => prev.filter((_, i) => i !== idx))
  }

  const actualizarEntidad = (idx: number, campo: string, valor: string) => {
    setEntidades((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [campo]: valor } : e))
    )
  }

  const quitarEntidad = (idx: number) => {
    setEntidades((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    setError(null)

    if (personas.length === 0 && entidades.length === 0) {
      setError('Agregá al menos una persona o entidad.')
      return
    }

    const personasValidas = personas.filter((p) => p.nombre.trim() && p.apellido.trim())
    const entidadesValidas = entidades.filter((e) => e.nombre.trim())

    if (personasValidas.length === 0 && entidadesValidas.length === 0) {
      setError('Completá al menos nombre y apellido de una persona, o el nombre de una entidad.')
      return
    }

    if (info.nivel_validacion === 'L1' && !cargadorEmail.trim()) {
      setError('Tu email es obligatorio.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/nomina/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cargador_email: cargadorEmail || undefined,
          personas: personasValidas,
          entidades: entidadesValidas,
        }),
      })

      if (response.status === 429) {
        setError('Demasiados intentos. Por favor esperá un minuto.')
        return
      }

      const result = await response.json()
      if (!result.ok) {
        setError(result.error)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4" data-testid="confirmacion-submit">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-2xl">&#10003;</span>
          </div>
          <h1 className="text-lg font-bold text-neutral-900 mb-2">Nómina enviada</h1>
          <p className="text-sm text-neutral-500">
            La nómina fue recibida correctamente. El club la revisará antes del evento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-neutral-900">{info.evento.titulo}</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {fechaFormateada}
          {info.evento.hora_inicio && ` · ${info.evento.hora_inicio.slice(0, 5)}`}
        </p>
        {info.contexto && (
          <p className="text-sm text-brand-600 font-medium mt-1">{info.contexto}</p>
        )}
      </div>

      {/* Email cargador si L1 */}
      {info.nivel_validacion === 'L1' && (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Tu email (obligatorio)</label>
          <input
            type="email"
            inputMode="email"
            value={cargadorEmail}
            onChange={(e) => setCargadorEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-neutral-300 px-3 text-base"
            placeholder="tu@email.com"
            data-testid="input-cargador-email"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('personas')}
          data-testid="tab-personas"
          className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
            tab === 'personas'
              ? 'bg-brand-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Personas ({personas.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('entidades')}
          data-testid="tab-entidades"
          className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
            tab === 'entidades'
              ? 'bg-brand-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Entidades ({entidades.length})
        </button>
      </div>

      {/* Tab Personas */}
      {tab === 'personas' && (
        <div className="space-y-4">
          {personas.map((p, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-700">Persona {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => quitarPersona(idx)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
              {campos.map((slug) => {
                const campo = CAMPOS_SOLICITABLES[slug as keyof typeof CAMPOS_SOLICITABLES]
                if (!campo) return null

                if (slug === 'rol') {
                  return (
                    <div key={slug}>
                      <label className="block text-xs text-neutral-500 mb-1">{campo.label}</label>
                      <select
                        value={(p as Record<string, string>)[slug] ?? ''}
                        onChange={(e) => actualizarPersona(idx, slug, e.target.value)}
                        data-testid={`input-persona-${idx}-${slug}`}
                        className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-base bg-white"
                      >
                        <option value="">Seleccionar...</option>
                        {ROLES_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )
                }

                if (campo.tipo === 'textarea') {
                  return (
                    <div key={slug}>
                      <label className="block text-xs text-neutral-500 mb-1">{campo.label}</label>
                      <textarea
                        value={(p as Record<string, string>)[slug] ?? ''}
                        onChange={(e) => actualizarPersona(idx, slug, e.target.value)}
                        data-testid={`input-persona-${idx}-${slug}`}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-base min-h-[48px]"
                        rows={2}
                      />
                    </div>
                  )
                }

                return (
                  <div key={slug}>
                    <label className="block text-xs text-neutral-500 mb-1">{campo.label}</label>
                    <input
                      type={campo.tipo === 'date' ? 'date' : 'text'}
                      inputMode={campo.inputMode}
                      value={(p as Record<string, string>)[slug] ?? ''}
                      onChange={(e) => actualizarPersona(idx, slug, e.target.value)}
                      data-testid={`input-persona-${idx}-${slug}`}
                      className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-base"
                    />
                  </div>
                )
              })}
            </div>
          ))}

          <button
            type="button"
            onClick={agregarPersona}
            data-testid="btn-agregar-persona"
            className="w-full h-12 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-600 font-medium
                       hover:border-brand-400 hover:text-brand-600 transition-colors"
          >
            + Agregar persona
          </button>
        </div>
      )}

      {/* Tab Entidades */}
      {tab === 'entidades' && (
        <div className="space-y-4">
          {entidades.map((e, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-700">Entidad {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => quitarEntidad(idx)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={e.nombre}
                  onChange={(ev) => actualizarEntidad(idx, 'nombre', ev.target.value)}
                  data-testid={`input-entidad-${idx}-nombre`}
                  className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-base"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Contacto (opcional)</label>
                <input
                  type="text"
                  value={e.contacto ?? ''}
                  onChange={(ev) => actualizarEntidad(idx, 'contacto', ev.target.value)}
                  data-testid={`input-entidad-${idx}-contacto`}
                  className="w-full h-12 rounded-lg border border-neutral-300 px-3 text-base"
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={agregarEntidad}
            data-testid="btn-agregar-entidad"
            className="w-full h-12 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-600 font-medium
                       hover:border-brand-400 hover:text-brand-600 transition-colors"
          >
            + Agregar entidad
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        data-testid="btn-submit-nomina"
        className="w-full h-14 rounded-xl bg-brand-600 text-white font-semibold text-base
                   hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar nómina'}
      </button>
    </div>
  )
}
