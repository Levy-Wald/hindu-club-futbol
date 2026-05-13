'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TENANT_ID } from '@/lib/tenant'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Sede = { id: string; nombre: string }
type EspacioOption = { id: string; nombre: string; tipo_slug: string }

interface SelectorSedeEspacioProps {
  sedeId: string | null
  espacioId: string | null
  onSedeChange: (sedeId: string | null) => void
  onEspacioChange: (espacioId: string | null) => void
  tipoFilter?: string
  disabled?: boolean
}

export function SelectorSedeEspacio({
  sedeId,
  espacioId,
  onSedeChange,
  onEspacioChange,
  tipoFilter,
  disabled,
}: SelectorSedeEspacioProps) {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [espacios, setEspacios] = useState<EspacioOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSedes() {
      const supabase = createClient()
      const { data } = await supabase
        .from('sedes')
        .select('id, nombre')
        .eq('tenant_id', TENANT_ID)
        .is('deleted_at', null)
        .order('nombre')
      setSedes(data ?? [])
      setLoading(false)
    }
    fetchSedes()
  }, [])

  useEffect(() => {
    if (!sedeId) {
      setEspacios([])
      return
    }
    async function fetchEspacios() {
      const supabase = createClient()
      let query = supabase
        .from('espacios')
        .select('id, nombre, tipo_slug')
        .eq('tenant_id', TENANT_ID)
        .eq('sede_id', sedeId!)
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')

      if (tipoFilter) {
        query = query.like('tipo_slug', tipoFilter)
      }

      const { data } = await query
      setEspacios(data ?? [])
    }
    fetchEspacios()
  }, [sedeId, tipoFilter])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Sede</Label>
        <Select
          value={sedeId ?? ''}
          onValueChange={(v) => {
            const val = v || null
            onSedeChange(val)
            onEspacioChange(null)
          }}
          disabled={disabled || loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar sede" />
          </SelectTrigger>
          <SelectContent>
            {sedes.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Espacio</Label>
        <Select
          value={espacioId ?? ''}
          onValueChange={(v) => onEspacioChange(v || null)}
          disabled={disabled || !sedeId || espacios.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={sedeId ? 'Seleccionar espacio' : 'Elegir sede primero'} />
          </SelectTrigger>
          <SelectContent>
            {espacios.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
