'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FORMACIONES } from '../lib/formaciones'

export function SelectorFormacion({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (slug: string) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Formacion:
      </label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v ?? '')}
        disabled={disabled}
      >
        <SelectTrigger className="w-[180px]" data-testid="selector-formacion">
          <SelectValue placeholder="Elegir formacion" />
        </SelectTrigger>
        <SelectContent>
          {FORMACIONES.map((f) => (
            <SelectItem key={f.slug} value={f.slug}>
              {f.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
