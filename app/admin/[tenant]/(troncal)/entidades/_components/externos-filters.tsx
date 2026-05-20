'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Filter, X } from 'lucide-react'

const TIPOS = [
  { value: 'club', label: 'Club' },
  { value: 'federacion', label: 'Federación' },
  { value: 'sponsor', label: 'Sponsor' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'organismo', label: 'Organismo' },
  { value: 'otro', label: 'Otro' },
]

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
]

export function ExternosFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentTipo = searchParams.get('tipo') ?? ''
  const currentActivo = searchParams.get('activo') ?? ''

  const [tipo, setTipo] = useState(currentTipo)
  const [activo, setActivo] = useState(currentActivo)

  const activeCount = (tipo ? 1 : 0) + (activo ? 1 : 0)

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (tipo) params.set('tipo', tipo)
    else params.delete('tipo')

    if (activo) params.set('activo', activo)
    else params.delete('activo')

    router.push(`/admin/entidades?${params.toString()}`)
  }, [tipo, activo, searchParams, router])

  const clearFilters = useCallback(() => {
    setTipo('')
    setActivo('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('tipo')
    params.delete('activo')
    params.delete('page')
    router.push(`/admin/entidades?${params.toString()}`)
  }, [searchParams, router])

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
        <PopoverContent className="w-72" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Tipo</h4>
              <div className="space-y-1.5">
                {TIPOS.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={tipo === t.value}
                      onCheckedChange={() => setTipo(tipo === t.value ? '' : t.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-sm mb-2">Estado</h4>
              <div className="space-y-1.5">
                {ESTADOS.map((e) => (
                  <label key={e.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={activo === e.value}
                      onCheckedChange={() => setActivo(activo === e.value ? '' : e.value)}
                    />
                    {e.label}
                  </label>
                ))}
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
