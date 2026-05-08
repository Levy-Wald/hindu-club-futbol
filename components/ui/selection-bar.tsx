'use client'

import { Button } from '@/components/ui/button'
import { ExportFormatSelector } from '@/components/ui/export-format-selector'
import { X, CheckSquare } from 'lucide-react'
import type { ExportData } from '@/lib/export/formats'

interface SelectionBarProps {
  count: number
  total: number
  onSelectAll: () => void
  onClear: () => void
  getData: () => ExportData | null
  children?: React.ReactNode
}

export function SelectionBar({ count, total, onSelectAll, onClear, getData, children }: SelectionBarProps) {
  if (count === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-2.5 shadow-lg">
      <span className="text-sm font-medium">
        {count} de {total} seleccionado{count !== 1 ? 's' : ''}
      </span>
      <Button variant="ghost" size="sm" onClick={onSelectAll}>
        <CheckSquare className="h-3.5 w-3.5 mr-1" />
        Todo
      </Button>
      {children}
      <ExportFormatSelector getData={getData} />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
