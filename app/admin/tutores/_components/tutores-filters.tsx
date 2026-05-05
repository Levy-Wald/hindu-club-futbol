'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Filter, X } from 'lucide-react'

export function TutoresFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentConMenor = searchParams.get('conMenor') === '1'
  const currentSinMenor = searchParams.get('sinMenor') === '1'

  const [conMenor, setConMenor] = useState(currentConMenor)
  const [sinMenor, setSinMenor] = useState(currentSinMenor)

  const activeCount = (conMenor ? 1 : 0) + (sinMenor ? 1 : 0)

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    if (conMenor) params.set('conMenor', '1')
    else params.delete('conMenor')

    if (sinMenor) params.set('sinMenor', '1')
    else params.delete('sinMenor')

    router.push(`/admin/tutores?${params.toString()}`)
  }, [conMenor, sinMenor, searchParams, router])

  const clearFilters = useCallback(() => {
    setConMenor(false)
    setSinMenor(false)
    router.push('/admin/tutores')
  }, [router])

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
              <h4 className="font-medium text-sm mb-2">Menores vinculados</h4>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={conMenor}
                    onCheckedChange={(checked) => setConMenor(checked === true)}
                  />
                  Con menor vinculado
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={sinMenor}
                    onCheckedChange={(checked) => setSinMenor(checked === true)}
                  />
                  Sin menor vinculado
                </label>
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
