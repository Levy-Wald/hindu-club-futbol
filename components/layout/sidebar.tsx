'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  personalItems,
  dashboardItem,
  navSections,
  type NavItemDef,
  type NavCollapsibleDef,
  type NavSectionDef,
} from '@/lib/navigation/items'

function NavItem({ item, pathname }: { item: NavItemDef; pathname: string }) {
  const isActive = item.href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  )
}

function SubNavItem({ item, pathname }: { item: NavItemDef; pathname: string }) {
  const segments = item.href.split('/').filter(Boolean)
  const isParentDashboard = segments.length === 2
  const isActive = isParentDashboard
    ? pathname === item.href
    : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors ml-4',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-3.5 w-3.5" />
      <span className="text-[13px]">{item.label}</span>
    </Link>
  )
}

function SectionHeader({ label, testId }: { label: string; testId: string }) {
  return (
    <div className="px-3 pt-4 pb-1" data-testid={testId}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
    </div>
  )
}

function CollapsibleSection({
  def,
  isOpen,
  onToggle,
  pathname,
}: {
  def: NavCollapsibleDef
  isOpen: boolean
  onToggle: () => void
  pathname: string
}) {
  const isActive = def.activeCheck(pathname)
  return (
    <>
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-left',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <def.icon className="h-4 w-4" />
        <span className="flex-1">{def.label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="space-y-0.5">
          {def.subItems.map((item) => (
            <SubNavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      )}
    </>
  )
}

function SidebarSection({ section, pathname }: { section: NavSectionDef; pathname: string }) {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    section.collapsibles.forEach((c) => {
      initial[c.label] = c.activeCheck(pathname)
    })
    return initial
  })

  return (
    <>
      <SectionHeader label={section.label} testId={section.testId} />
      {section.items.map((item) => (
        <NavItem key={item.href} item={item} pathname={pathname} />
      ))}
      {section.collapsibles.map((c) => (
        <CollapsibleSection
          key={c.label}
          def={c}
          isOpen={openStates[c.label] ?? false}
          onToggle={() => setOpenStates((s) => ({ ...s, [c.label]: !s[c.label] }))}
          pathname={pathname}
        />
      ))}
    </>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
          Hindu Club
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {personalItems.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="my-2 border-t" />

        <NavItem item={dashboardItem} pathname={pathname} />

        {navSections.map((section) => (
          <SidebarSection key={section.key} section={section} pathname={pathname} />
        ))}
      </nav>
    </aside>
  )
}
