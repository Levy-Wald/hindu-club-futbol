'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCapabilities, usePersonaId, can } from '@/lib/permissions/capabilities-context'
import { Users, Trophy, Wallet, CalendarCheck } from 'lucide-react'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

export function SaludoWidget({ nombre }: { nombre: string }) {
  const caps = useCapabilities()

  const atajos = [
    { label: 'Personas', href: '/admin/personas', icon: Users, show: can(caps, 'personas.read') },
    { label: 'Equipos', href: '/admin/equipos', icon: Trophy, show: can(caps, 'ccbp.plantel.read') },
    { label: 'Finanzas', href: '/admin/finanzas', icon: Wallet, show: can(caps, 'finanzas.read') },
    { label: 'Reservas', href: '/admin/reservas', icon: CalendarCheck, show: can(caps, 'reservas.read') },
  ].filter(a => a.show)

  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {getGreeting()}, {nombre}
        </CardTitle>
        <p className="text-sm text-muted-foreground capitalize">{hoy}</p>
      </CardHeader>
      {atajos.length > 0 && (
        <CardContent className="flex flex-wrap gap-2">
          {atajos.map(a => {
            const Icon = a.icon
            return (
              <Link
                key={a.href}
                href={a.href}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                <Icon className="h-4 w-4" />
                {a.label}
              </Link>
            )
          })}
        </CardContent>
      )}
    </Card>
  )
}
