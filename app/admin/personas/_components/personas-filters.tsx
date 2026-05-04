'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Filter, X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface PersonasFiltersProps {
  atributos: FilterOption[]
  padrones: FilterOption[]
}

const ESTADOS: FilterOption[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'baja', label: 'Baja' },
  { value: 'pendiente_revision', label: 'Pendiente revisión' },
]

export function PersonasFilters({ atributos, padrones }: PersonasFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentEstados = searchParams.get('estados')?.split(',').filter(Boolean) ?? []
  const currentAtributos = searchParams.get('atributos')?.split(',').filter(Boolean) ?? []
  const currentPadrones = searchParams.get('padrones')?.split(',').filter(Boolean) ?? []
  const verEliminadas = searchParams.get('eliminadas') === '1'

  const [estados, setEstados] = useState<string[]>(currentEstados)
  const [atributosSelected, setAtributosSelected] = useState<string[]>(currentAtributos)
  const [padronesSelected, setPadronesSelected] = useState<string[]>(currentPadrones)
  const [eliminadas, setEliminadas] = useState(verEliminadas)

  const activeCount = estados.length + atributosSelected.length + padronesSelected.length + (eliminadas ? 1 : 0)

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (estados.length > 0) params.set('estados', estados.join(','))
    else params.delete('estados')

    if (atributosSelected.length > 0) params.set('atributos', atributosSelected.join(','))
    else params.delete('atributos')

    if (padronesSelected.length > 0) params.set('padrones', padronesSelected.join(','))
    else params.delete('padrones')

    if (eliminadas) params.set('eliminadas', '1')
    else params.delete('eliminadas')

    router.push(`/admin/personas?${params.toString()}`)
  }, [estados, atributosSelected, padronesSelected, eliminadas, searchParams, router])

  const clearFilters = useCallback(() => {
    setEstados([])
    setAtributosSelected([])
    setPadronesSelected([])
    setEliminadas(false)
    router.push('/admin/personas')
  }, [router])

  function toggleValue(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {activeCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Estado</h4>
              <div className="space-y-1.5">
                {ESTADOS.map((e) => (
                  <label key={e.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={estados.includes(e.value)}
                      onCheckedChange={() => setEstados(toggleValue(estados, e.value))}
                    />
                    {e.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Atributo</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {atributos.map((a) => (
                  <label key={a.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={atributosSelected.includes(a.value)}
                      onCheckedChange={() => setAtributosSelected(toggleValue(atributosSelected, a.value))}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Padrón</h4>
              <div className="space-y-1.5">
                {padrones.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={padronesSelected.includes(p.value)}
                      onCheckedChange={() => setPadronesSelected(toggleValue(padronesSelected, p.value))}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={eliminadas}
                onCheckedChange={(checked) => setEliminadas(checked === true)}
              />
              Ver eliminadas
            </label>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={applyFilters} className="flex-1">
                Aplicar
              </Button>
              {activeCount > 0 && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
