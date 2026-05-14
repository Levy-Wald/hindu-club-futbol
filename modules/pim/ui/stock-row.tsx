'use client'

import { Badge } from '@/components/ui/badge'
import type { StockEspacio } from '../lib/tipos'

interface StockRowProps {
  stock: StockEspacio
}

export function StockRow({ stock }: StockRowProps) {
  const isLow = stock.stock_minimo !== null && stock.cantidad <= stock.stock_minimo
  const isOver = stock.stock_maximo !== null && stock.cantidad >= stock.stock_maximo

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
          {stock.stock_minimo !== null && <span>Min: {stock.stock_minimo}</span>}
          {stock.stock_maximo !== null && <span>Max: {stock.stock_maximo}</span>}
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
