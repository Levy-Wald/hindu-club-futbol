'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { eliminarVarianteAction } from '../lib/actions'
import { VarianteFormDialog } from './variante-form'
import type { ProductoVariante } from '../lib/tipos'
import { useRouter } from 'next/navigation'

interface VarianteRowProps {
  variante: ProductoVariante
}

export function VarianteRow({ variante }: VarianteRowProps) {
  const v = variante
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Eliminar esta variante?')) return
    startTransition(async () => {
      await eliminarVarianteAction({ id: v.id, producto_id: v.producto_id })
      router.refresh()
    })
  }

  const attrs = Object.entries(v.atributos ?? {})

  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{v.nombre_variante}</span>
          {v.sku_variante && (
            <span className="text-xs text-muted-foreground">SKU: {v.sku_variante}</span>
          )}
          {!v.activo && <Badge variant="secondary">Inactivo</Badge>}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {v.precio_diferencial_ars !== null && <span>Dif ARS: ${v.precio_diferencial_ars}</span>}
          {v.stock_simple_variante !== null && <span>Stock: {v.stock_simple_variante}</span>}
          {attrs.length > 0 && (
            <span>
              {attrs.map(([k, val]) => `${k}: ${val}`).join(', ')}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <VarianteFormDialog
          mode="edit"
          productoId={v.producto_id}
          variante={v}
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
