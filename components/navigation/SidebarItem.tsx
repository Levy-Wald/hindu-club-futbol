'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getIcon } from './icon-map'
import type { SidebarItem as SidebarItemType } from '@/lib/navigation/types'

export function SidebarItem({ item }: { item: SidebarItemType }) {
  const pathname = usePathname()
  const Icon = getIcon(item.icon)
  const isActive =
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  const isProximamente = item.estado === 'proximamente'
  const showBadge = item.badge || isProximamente

  return (
    <Link
      href={item.href}
      data-testid={`sidebar-item-${item.id}`}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        isProximamente && 'opacity-60'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
      {showBadge && (
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
          {isProximamente ? 'Pronto' : item.badge}
        </Badge>
      )}
    </Link>
  )
}
