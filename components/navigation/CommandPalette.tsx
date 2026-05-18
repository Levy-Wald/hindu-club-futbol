'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { getIcon } from './icon-map'
import { useNavigation } from './navigation-provider'
import { SPACES } from '@/lib/navigation/spaces'

export function useCommandPaletteOpen() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return { open, setOpen, openPalette: useCallback(() => setOpen(true), []) }
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const { allItems } = useNavigation()

  const grouped = new Map<string, typeof allItems>()
  for (const item of allItems) {
    const space = SPACES.find(s => s.id === item.espacio)
    const key = space?.label ?? item.espacio
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(item)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Búsqueda global"
      description="Buscar páginas y acciones"
    >
      <CommandInput placeholder="Buscar páginas, módulos..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        {Array.from(grouped.entries()).map(([groupLabel, items]) => (
          <CommandGroup key={groupLabel} heading={groupLabel}>
            {items
              .filter(item => item.badge !== 'soon')
              .map(item => {
                const Icon = getIcon(item.icon)
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      router.push(item.href)
                      onOpenChange(false)
                    }}
                    value={`${item.label} ${item.grupo}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{item.grupo}</span>
                  </CommandItem>
                )
              })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
