'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { eliminarPrecioAction } from '../lib/actions'
import { PrecioFormDialog } from './precio-form'
import type { PrecioProducto, ListaPrecios, ProductoVariante, TipoLista } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const TIPO_COLORS: Record<TipoLista, string> = {
  compra: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  costo: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  venta: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

interface PrecioRowProps {
  precio: PrecioProducto
  listas: ListaPrecios[]
  variantes: ProductoVariante[]
}

export function PrecioRow({ precio, listas, variantes }: PrecioRowProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Eliminar este precio?')) return
    startTransition(async () => {
      await eliminarPrecioAction({ id: precio.id, producto_id: precio.producto_id })
      router.refresh()
    })
  }

  const monedaSymbol = precio.moneda === 'USD' ? 'US$' : precio.moneda === 'EUR' ? '€' : '$'

  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0 flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {monedaSymbol}{precio.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            <Badge variant="outline" className="text-xs">{precio.moneda}</Badge>
            {precio.lista_tipo && (
              <Badge className={`text-xs ${TIPO_COLORS[precio.lista_tipo]}`}>
                {precio.lista_nombre}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{precio.variante_nombre ?? 'Base'}</span>
            {precio.fecha_vigencia_desde && <span>desde {precio.fecha_vigencia_desde}</span>}
            {precio.fecha_vigencia_hasta && <span>hasta {precio.fecha_vigencia_hasta}</span>}
            {precio.notas && <span className="truncate max-w-[200px]">· {precio.notas}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <PrecioFormDialog
          mode="edit"
          productoId={precio.producto_id}
          listas={listas}
          variantes={variantes}
          precio={precio}
          triggerRender={<Button variant="ghost" size="sm" />}
          triggerLabel="Editar"
        />
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
