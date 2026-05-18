'use client'

import { SidebarItem } from './SidebarItem'
import type { SidebarItem as SidebarItemType } from '@/lib/navigation/types'

export function SidebarGroup({
  label,
  items,
}: {
  label: string
  items: SidebarItemType[]
}) {
  return (
    <div>
      <div className="px-3 pt-4 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
      </div>
      <div className="space-y-0.5">
        {items.map(item => (
          <SidebarItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
