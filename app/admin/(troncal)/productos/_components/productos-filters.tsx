'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { ProductoCategoria, Marca } from '@/modules/pim/lib/tipos'

interface ProductosFiltersProps {
  categorias: ProductoCategoria[]
  marcas: Marca[]
  currentCategoria?: string
  currentMarca?: string
  currentTipo?: string
  currentSearch?: string
}

export function ProductosFilters({
  categorias,
  marcas,
  currentCategoria,
  currentMarca,
  currentTipo,
  currentSearch,
}: ProductosFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/productos?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o SKU..."
          defaultValue={currentSearch ?? ''}
          className="pl-9"
          onChange={(e) => {
            const val = e.target.value
            // Debounce search
            const timeout = setTimeout(() => updateParam('q', val || null), 400)
            return () => clearTimeout(timeout)
          }}
        />
      </div>

      <Select value={currentTipo ?? ''} onValueChange={(v) => updateParam('tipo', v || null)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          <SelectItem value="producto">Producto</SelectItem>
          <SelectItem value="servicio">Servicio</SelectItem>
        </SelectContent>
      </Select>

      {categorias.length > 0 && (
        <Select value={currentCategoria ?? ''} onValueChange={(v) => updateParam('categoria', v || null)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {marcas.length > 0 && (
        <Select value={currentMarca ?? ''} onValueChange={(v) => updateParam('marca', v || null)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {marcas.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
