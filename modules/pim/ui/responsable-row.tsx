'use client'

import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { eliminarResponsableDeProductoAction } from '../lib/actions'
import type { ProductoResponsable, RolResponsable } from '../lib/tipos'
import { useRouter } from 'next/navigation'

const ROL_LABELS: Record<RolResponsable, string> = {
  general: 'General',
  compras: 'Compras',
  stock: 'Stock',
  marketing: 'Marketing',
  product_owner: 'Product Owner',
  qa: 'QA',
  logistica: 'Logistica',
  ventas: 'Ventas',
}

interface ResponsableRowProps {
  responsable: ProductoResponsable
}

export function ResponsableRow({ responsable: resp }: ResponsableRowProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Eliminar este responsable del producto?')) return
    startTransition(async () => {
      await eliminarResponsableDeProductoAction({
        id: resp.id,
        producto_id: resp.producto_id,
      })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{resp.nombre_responsable}</span>
          <Badge variant="outline" className="text-xs">
            {ROL_LABELS[resp.rol]}
          </Badge>
          {resp.persona_id && (
            <Badge variant="secondary" className="text-xs">Persona</Badge>
          )}
          {resp.atributo_slug && (
            <Badge variant="secondary" className="text-xs">Atributo</Badge>
          )}
        </div>
        {resp.notas && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[400px]">
            {resp.notas}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
