'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  CreditCard,
  Calendar,
  MessageSquare,
  Trophy,
  HardDrive,
  Code,
  Landmark,
  Puzzle,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type IntegrationStatus = 'disponible' | 'proximamente' | 'activa'

interface Integration {
  name: string
  description: string
  icon: LucideIcon
  status: IntegrationStatus
  statusLabel: string
}

interface Category {
  name: string
  icon: LucideIcon
  items: Integration[]
}

const CATEGORIES: Category[] = [
  {
    name: 'ERP y Contabilidad',
    icon: Landmark,
    items: [
      {
        name: 'Zoho Books',
        description: 'Sincronizá facturación y contabilidad',
        icon: Landmark,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Zoho CRM',
        description: 'Gestión de clientes y oportunidades',
        icon: Landmark,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'QuickBooks',
        description: 'Contabilidad para pequeños negocios',
        icon: Landmark,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Xero',
        description: 'Contabilidad online',
        icon: Landmark,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
    ],
  },
  {
    name: 'Cobros y pagos',
    icon: CreditCard,
    items: [
      {
        name: 'MercadoPago',
        description: 'Cobros online y QR',
        icon: CreditCard,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Stripe',
        description: 'Pagos internacionales',
        icon: CreditCard,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Modo',
        description: 'Red de pagos digitales Argentina',
        icon: CreditCard,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
    ],
  },
  {
    name: 'Calendarios',
    icon: Calendar,
    items: [
      {
        name: 'Google Calendar',
        description: 'Sincronizá eventos con Google',
        icon: Calendar,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Outlook Calendar',
        description: 'Sincronizá con Microsoft 365',
        icon: Calendar,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Apple Calendar (iCloud)',
        description: 'Sincronizá con iCloud',
        icon: Calendar,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
    ],
  },
  {
    name: 'Comunicación',
    icon: MessageSquare,
    items: [
      {
        name: 'WhatsApp Business',
        description: 'Bot y notificaciones por WA',
        icon: MessageSquare,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Resend',
        description: 'Emails transaccionales',
        icon: MessageSquare,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Slack',
        description: 'Notificaciones al equipo',
        icon: MessageSquare,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
    ],
  },
  {
    name: 'Deportivo',
    icon: Trophy,
    items: [
      {
        name: 'ATC Sports',
        description: 'Gestión deportiva integral',
        icon: Trophy,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Ondepor',
        description: 'Reservas de canchas',
        icon: Trophy,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
    ],
  },
  {
    name: 'Almacenamiento',
    icon: HardDrive,
    items: [
      {
        name: 'Google Drive',
        description: 'Documentos y archivos',
        icon: HardDrive,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
      {
        name: 'Dropbox',
        description: 'Almacenamiento en la nube',
        icon: HardDrive,
        status: 'proximamente',
        statusLabel: 'Próximamente',
      },
    ],
  },
  {
    name: 'Desarrollo',
    icon: Code,
    items: [
      {
        name: 'API REST',
        description: 'Conectá sistemas externos vía API',
        icon: Code,
        status: 'proximamente',
        statusLabel: 'Sprint 13',
      },
      {
        name: 'MCP Server',
        description: 'Agentes IA operan tu club',
        icon: Puzzle,
        status: 'proximamente',
        statusLabel: 'Sprint 13',
      },
      {
        name: 'Webhooks',
        description: 'Eventos en tiempo real',
        icon: Code,
        status: 'proximamente',
        statusLabel: 'Sprint 13',
      },
    ],
  },
]

export function IntegracionesPanel() {
  const [search, setSearch] = useState('')

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES
    const q = search.toLowerCase()
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0)
  }, [search])

  return (
    <div className="space-y-8">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar integraciones..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Categorías */}
      {filteredCategories.map((cat) => (
        <div key={cat.name} className="space-y-3">
          <div className="flex items-center gap-2">
            <cat.icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.name}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.items.map((item) => (
              <Card
                key={item.name}
                className="hover:ring-1 hover:ring-primary/20 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        item.status === 'activa' ? 'default' : 'secondary'
                      }
                      className="text-[10px] shrink-0"
                    >
                      {item.statusLabel}
                    </Badge>
                  </div>
                  {item.status === 'proximamente' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      disabled
                    >
                      Próximamente
                    </Button>
                  )}
                  {item.status === 'disponible' && (
                    <Button
                      size="sm"
                      className="w-full mt-3"
                      onClick={() =>
                        toast.info(
                          'Solicitud enviada. Te contactaremos para configurar la integración.'
                        )
                      }
                    >
                      Conectar
                    </Button>
                  )}
                  {item.status === 'activa' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => toast.info('Integración activa.')}
                    >
                      Configurar
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Puzzle className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No se encontraron integraciones para &quot;{search}&quot;
          </p>
        </div>
      )}
    </div>
  )
}
