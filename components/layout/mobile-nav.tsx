'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Trophy,
  Menu,
  X,
  UserCircle,
  CreditCard,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import {
  navSections,
  type NavItemDef,
  type NavCollapsibleDef,
  type NavSectionDef,
} from '@/lib/navigation/items'

const bottomNavItems = [
  { label: 'Inicio', href: '/admin', icon: LayoutDashboard },
  { label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy },
  { label: 'Personas', href: '/admin/personas', icon: Users },
  { label: 'Mas', href: '#menu', icon: Menu },
]

function MobileSectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </span>
    </div>
  )
}

function MobileCollapsible({
  def,
  pathname,
  onClose,
}: {
  def: NavCollapsibleDef
  pathname: string
  onClose: () => void
}) {
  const [isOpen, setIsOpen] = useState(def.activeCheck(pathname))
  const isActive = def.activeCheck(pathname)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors w-full text-left',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <def.icon className="h-5 w-5" />
        <span className="flex-1">{def.label}</span>
        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 ml-4">
          {def.subItems.map((sub) => {
            const isSubActive = pathname === sub.href || (sub.href !== '/admin' && pathname.startsWith(sub.href))
            return (
              <Link
                key={sub.href}
                href={sub.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isSubActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <sub.icon className="h-4 w-4" />
                {sub.label}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function MobileNavItem({ item, onClose }: { item: NavItemDef; onClose: () => void }) {
  const pathname = usePathname()
  const isActive = item.href === '/admin'
    ? pathname === '/admin'
    : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  )
}

function MobileSection({ section, pathname, onClose }: { section: NavSectionDef; pathname: string; onClose: () => void }) {
  return (
    <>
      <MobileSectionHeader label={section.label} />
      {section.items.map((item) => (
        <MobileNavItem key={item.href} item={item} onClose={onClose} />
      ))}
      {section.collapsibles.map((c) => (
        <MobileCollapsible key={c.label} def={c} pathname={pathname} onClose={onClose} />
      ))}
    </>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-2">
          {bottomNavItems.map((item) => {
            if (item.href === '#menu') {
              return (
                <button
                  key="menu"
                  onClick={() => setMenuOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 w-16 py-1 text-muted-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            }
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-md transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-background animate-in fade-in duration-150">
          <div className="flex items-center justify-between h-14 px-4 border-b">
            <span className="font-bold text-lg">Hindu Club</span>
            <button onClick={closeMenu} className="p-2 rounded-md hover:bg-accent">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
            <MobileNavItem item={{ label: 'Mi perfil', href: '/admin/mi-perfil', icon: UserCircle }} onClose={closeMenu} />
            <MobileNavItem item={{ label: 'Mi equipo', href: '/admin/mi-equipo', icon: Trophy }} onClose={closeMenu} />
            <MobileNavItem item={{ label: 'Mi cuenta', href: '/admin/mi-cuenta', icon: CreditCard }} onClose={closeMenu} />

            <div className="my-2 border-t" />

            <MobileNavItem item={{ label: 'Inicio', href: '/admin', icon: LayoutDashboard }} onClose={closeMenu} />

            {navSections.map((section) => (
              <MobileSection key={section.key} section={section} pathname={pathname} onClose={closeMenu} />
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
