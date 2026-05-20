'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, Layers } from 'lucide-react'
import type { ProductoConCategorias } from '../lib/tipos'
import Link from 'next/link'

interface ProductoRowProps {
  producto: ProductoConCategorias
}

export function ProductoRow({ producto }: ProductoRowProps) {
  const p = producto

  return (
    <div
      data-testid={`producto-row-${p.sku ?? p.id}`}
      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
          {p.imagen_url ? (
            <Image src={p.imagen_url} alt={p.nombre} width={40} height={40} className="h-10 w-10 rounded object-cover" unoptimized />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/productos/${p.id}`}
              className="font-medium text-sm hover:underline truncate"
            >
              {p.nombre}
            </Link>
            {!p.activo && <Badge variant="secondary">Inactivo</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {p.sku && <span>SKU: {p.sku}</span>}
            <span className="capitalize">{p.tipo}</span>
            {p.variantes_count > 0 && (
              <span className="flex items-center gap-0.5">
                <Layers className="h-3 w-3" />
                {p.variantes_count} var.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {p.precio_base_ars !== null && (
          <span className="text-sm font-medium">
            ${p.precio_base_ars.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
          </span>
        )}
        {p.tipo === 'producto' && p.stock_simple !== null && (
          <span className="text-xs text-muted-foreground">
            Stock: {p.stock_simple}
          </span>
        )}
        <Link href={`/admin/productos/${p.id}`}>
          <Button variant="ghost" size="sm">Ver</Button>
        </Link>
      </div>
    </div>
  )
}
