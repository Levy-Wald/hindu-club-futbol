'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  allowCreate?: boolean
  className?: string
  disabled?: boolean
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Buscar...',
  allowCreate = true,
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearch(value)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (allowCreate && search !== value) {
          onChange(search)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [search, value, onChange, allowCreate])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(opt: ComboboxOption) {
    onChange(opt.value)
    setSearch(opt.label)
    setOpen(false)
  }

  function handleInputChange(val: string) {
    setSearch(val)
    setOpen(true)
    if (allowCreate) {
      onChange(val)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length === 1) {
        handleSelect(filtered[0])
      } else if (allowCreate) {
        onChange(search)
        setOpen(false)
      }
    }
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          value={search}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-8"
        />
        <ChevronsUpDown className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
          {filtered.map(opt => (
            <button
              key={opt.value}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
              onMouseDown={e => { e.preventDefault(); handleSelect(opt) }}
            >
              {opt.value === value && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              {opt.value !== value && <span className="w-3.5 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
