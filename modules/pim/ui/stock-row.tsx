'use client'

import { Badge } from '@/components/ui/badge'
import type { StockEspacio } from '../lib/tipos'

interface StockRowProps {
  stock: StockEspacio
}

export function StockRow({ stock }: StockRowProps) {
  const isLow = stock.cantidad_minima !== null && stock.cantidad <= stock.cantidad_minima
  const isOver = stock.cantidad_maxima !== null && stock.cantidad >= stock.cantidad_maxima

  return (
    <div className="flex items-center justify-between p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{stock.espacio_nombre}</span>
          {stock.variante_nombre && (
            <Badge variant="outline" className="text-xs">{stock.variante_nombre}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {stock.cantidad_minima !== null && <span>Min: {stock.cantidad_minima}</span>}
          {stock.cantidad_maxima !== null && <span>Max: {stock.cantidad_maxima}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-lg font-semibold ${isLow ? 'text-destructive' : isOver ? 'text-amber-600' : ''}`}>
          {stock.cantidad}
        </span>
        {isLow && <Badge variant="destructive" className="text-xs">Bajo</Badge>}
        {isOver && <Badge className="text-xs bg-amber-100 text-amber-800">Lleno</Badge>}
      </div>
    </div>
  )
}
