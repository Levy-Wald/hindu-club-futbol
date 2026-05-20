'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { TENANT_ID } from '@/lib/tenant'


interface Props {
  value: string
  onChange: (personaId: string) => void
  placeholder?: string
}

export function PersonaSearchInput({ value, onChange, placeholder = 'Buscar persona...' }: Props) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Array<{ id: string; nombre: string; apellido: string; numero_documento: string | null }>>([])
  const [selectedName, setSelectedName] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (search.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('personas')
        .select('id, nombre, apellido, numero_documento')
        .eq('tenant_id', TENANT_ID)
        .is('deleted_at', null)
        .or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,numero_documento.ilike.%${search}%`)
        .limit(10)
      setResults(data ?? [])
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  return (
    <div className="relative">
      <Input
        value={value ? selectedName : search}
        onChange={(e) => {
          if (value) {
            onChange('')
            setSelectedName('')
          }
          setSearch(e.target.value)
        }}
        placeholder={placeholder}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {results.map((p) => (
            <button
              key={p.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              onClick={() => {
                onChange(p.id)
                setSelectedName(`${p.nombre} ${p.apellido}`)
                setSearch('')
                setOpen(false)
              }}
            >
              <span className="font-medium">{p.nombre} {p.apellido}</span>
              {p.numero_documento && <span className="text-muted-foreground ml-2">DNI {p.numero_documento}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
