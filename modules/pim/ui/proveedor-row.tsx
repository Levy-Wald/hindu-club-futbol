'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Trash2 } from 'lucide-react'
import {
  eliminarProveedorDeProductoAction,
  establecerProveedorPrincipalAction,
} from '../lib/actions'
import type { ProductoProveedor } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface ProveedorRowProps {
  proveedor: ProductoProveedor
}

export function ProveedorRow({ proveedor: prov }: ProveedorRowProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Eliminar este proveedor del producto?')) return
    startTransition(async () => {
      await eliminarProveedorDeProductoAction({
        id: prov.id,
        producto_id: prov.producto_id,
      })
      router.refresh()
    })
  }

  function handleSetPrincipal() {
    startTransition(async () => {
      await establecerProveedorPrincipalAction({
        id: prov.id,
        producto_id: prov.producto_id,
      })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{prov.nombre_proveedor}</span>
          {prov.es_principal && (
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-0.5" />
              Principal
            </Badge>
          )}
          {prov.entidad_id && (
            <Badge variant="outline" className="text-xs">Entidad</Badge>
          )}
          {prov.persona_id && (
            <Badge variant="outline" className="text-xs">Persona</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          {prov.codigo_proveedor && <span>Cod: {prov.codigo_proveedor}</span>}
          {prov.precio_proveedor !== null && (
            <span>
              {prov.moneda_compra ?? 'ARS'} ${prov.precio_proveedor.toLocaleString('es-AR')}
            </span>
          )}
          {prov.plazo_entrega_dias !== null && (
            <span>{prov.plazo_entrega_dias} dias</span>
          )}
          {prov.notas && <span className="truncate max-w-[200px]">{prov.notas}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!prov.es_principal && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSetPrincipal}
            disabled={isPending}
            title="Establecer como principal"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
