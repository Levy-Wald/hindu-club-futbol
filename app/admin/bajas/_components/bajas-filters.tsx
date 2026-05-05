'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Filter, X } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
}

interface BajasFiltersProps {
  motivos: FilterOption[]
}

export function BajasFilters({ motivos }: BajasFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentMotivos = searchParams.get('motivos')?.split(',').filter(Boolean) ?? []
  const currentFechaDesde = searchParams.get('fecha_desde') ?? ''
  const currentFechaHasta = searchParams.get('fecha_hasta') ?? ''

  const [motivosSelected, setMotivosSelected] = useState<string[]>(currentMotivos)
  const [fechaDesde, setFechaDesde] = useState(currentFechaDesde)
  const [fechaHasta, setFechaHasta] = useState(currentFechaHasta)

  const activeCount = motivosSelected.length + (fechaDesde ? 1 : 0) + (fechaHasta ? 1 : 0)

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (motivosSelected.length > 0) params.set('motivos', motivosSelected.join(','))
    else params.delete('motivos')

    if (fechaDesde) params.set('fecha_desde', fechaDesde)
    else params.delete('fecha_desde')

    if (fechaHasta) params.set('fecha_hasta', fechaHasta)
    else params.delete('fecha_hasta')

    router.push(`/admin/bajas?${params.toString()}`)
  }, [motivosSelected, fechaDesde, fechaHasta, searchParams, router])

  const clearFilters = useCallback(() => {
    setMotivosSelected([])
    setFechaDesde('')
    setFechaHasta('')
    router.push('/admin/bajas')
  }, [router])

  function toggleValue(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {activeCount}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Motivo de baja</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {motivos.map((m) => (
                  <label key={m.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={motivosSelected.includes(m.value)}
                      onCheckedChange={() => setMotivosSelected(toggleValue(motivosSelected, m.value))}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Rango de fecha de baja</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Desde</Label>
                  <Input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Hasta</Label>
                  <Input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

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
