'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'

type Props = {
  onBuscar: (dni: string) => void
  isLoading: boolean
}

export function BuscadorDni({ onBuscar, isLoading }: Props) {
  const [dni, setDni] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dni.trim()) onBuscar(dni.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="input-dni" className="text-sm font-medium text-neutral-700">
          DNI de la persona
        </label>
        <input
          id="input-dni"
          data-testid="input-dni"
          type="text"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          placeholder="Ej: 12345678"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          className="mt-1 block w-full h-14 rounded-xl border border-neutral-300 px-4 text-lg font-mono
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                     placeholder:text-neutral-400"
        />
      </div>
      <button
        type="submit"
        disabled={!dni.trim() || isLoading}
        data-testid="btn-buscar-acceso"
        className="flex w-full items-center justify-center gap-2 h-12 rounded-xl bg-brand-600 text-white
                   font-semibold text-base hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        <Search className="h-5 w-5" />
        {isLoading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  )
}
