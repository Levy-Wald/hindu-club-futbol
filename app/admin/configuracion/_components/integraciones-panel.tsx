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
  Receipt,
  Puzzle,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IntegrationStatus = 'activa' | 'disponible' | 'proximamente'

interface Integration {
  name: string
  description: string
  status: IntegrationStatus
  /** Optional label shown inside the badge — falls back to status default */
  badgeLabel?: string
}

interface Category {
  slug: string
  name: string
  icon: LucideIcon
  color: string        // Tailwind bg-* for the initials circle
  textColor: string    // Tailwind text-* for the initials circle
  items: Integration[]
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = [
  {
    slug: 'facturacion',
    name: 'Facturación y fiscal',
    icon: Receipt,
    color: 'bg-violet-100 dark:bg-violet-900/40',
    textColor: 'text-violet-700 dark:text-violet-300',
    items: [
      {
        name: 'AFIP / ARCA',
        description: 'Facturación electrónica y presentaciones fiscales en Argentina.',
        status: 'proximamente',
      },
      {
        name: 'Zoho Books',
        description: 'Sincronizá facturación, gastos y contabilidad general.',
        status: 'proximamente',
      },
      {
        name: 'Xero',
        description: 'Contabilidad online para equipos y pymes.',
        status: 'proximamente',
      },
      {
        name: 'QuickBooks',
        description: 'Contabilidad y reportes financieros simplificados.',
        status: 'proximamente',
      },
    ],
  },
  {
    slug: 'cobros',
    name: 'Cobros y pagos',
    icon: CreditCard,
    color: 'bg-emerald-100 dark:bg-emerald-900/40',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    items: [
      {
        name: 'MercadoPago',
        description: 'Cobros online, QR y links de pago para socios.',
        status: 'proximamente',
      },
      {
        name: 'Stripe',
        description: 'Pagos internacionales con tarjeta de crédito y débito.',
        status: 'proximamente',
      },
      {
        name: 'Modo',
        description: 'Red de pagos digitales para Argentina.',
        status: 'proximamente',
      },
      {
        name: 'Débito bancario',
        description: 'Débito automático en cuenta bancaria para cuotas mensuales.',
        status: 'proximamente',
      },
    ],
  },
  {
    slug: 'crm',
    name: 'CRM y comunicación',
    icon: MessageSquare,
    color: 'bg-blue-100 dark:bg-blue-900/40',
    textColor: 'text-blue-700 dark:text-blue-300',
    items: [
      {
        name: 'Zoho CRM',
        description: 'Gestión de contactos, oportunidades y pipeline comercial.',
        status: 'proximamente',
      },
      {
        name: 'WhatsApp Business',
        description: 'Bot y notificaciones automáticas por WhatsApp para socios.',
        status: 'proximamente',
      },
      {
        name: 'Resend',
        description: 'Emails transaccionales de alta entregabilidad.',
        status: 'proximamente',
      },
      {
        name: 'Slack',
        description: 'Alertas y notificaciones operativas al equipo interno.',
        status: 'proximamente',
      },
      {
        name: 'HubSpot',
        description: 'CRM gratuito con marketing y automatizaciones.',
        status: 'proximamente',
      },
    ],
  },
  {
    slug: 'deportivo',
    name: 'Deportivo',
    icon: Trophy,
    color: 'bg-amber-100 dark:bg-amber-900/40',
    textColor: 'text-amber-700 dark:text-amber-300',
    items: [
      {
        name: 'ATC Sports',
        description: 'Gestión deportiva integral para clubes federados.',
        status: 'proximamente',
      },
      {
        name: 'Ondepor',
        description: 'Reservas de canchas y turnos deportivos.',
        status: 'proximamente',
      },
      {
        name: 'Comet AFA',
        description: 'Integración con el sistema de AFA para fixtures y pases.',
        status: 'proximamente',
      },
    ],
  },
  {
    slug: 'calendario',
    name: 'Calendario',
    icon: Calendar,
    color: 'bg-sky-100 dark:bg-sky-900/40',
    textColor: 'text-sky-700 dark:text-sky-300',
    items: [
      {
        name: 'Google Calendar',
        description: 'Sincronizá partidos, turnos y eventos con Google.',
        status: 'proximamente',
      },
      {
        name: 'Outlook Calendar',
        description: 'Sincronizá con Microsoft 365 / Exchange.',
        status: 'proximamente',
      },
      {
        name: 'Apple Calendar',
        description: 'Sincronizá con iCloud Calendar en iOS y macOS.',
        status: 'proximamente',
      },
    ],
  },
  {
    slug: 'almacenamiento',
    name: 'Almacenamiento',
    icon: HardDrive,
    color: 'bg-orange-100 dark:bg-orange-900/40',
    textColor: 'text-orange-700 dark:text-orange-300',
    items: [
      {
        name: 'Google Drive',
        description: 'Documentos, contratos y archivos del club en Drive.',
        status: 'proximamente',
      },
      {
        name: 'Dropbox',
        description: 'Almacenamiento en la nube para equipos.',
        status: 'proximamente',
      },
      {
        name: 'DocuSign',
        description: 'Firma digital de contratos y documentos oficiales.',
        status: 'proximamente',
      },
    ],
  },
  {
    slug: 'desarrollo',
    name: 'Desarrollo',
    icon: Code,
    color: 'bg-slate-100 dark:bg-slate-800/60',
    textColor: 'text-slate-700 dark:text-slate-300',
    items: [
      {
        name: 'API REST',
        description: 'Conectá cualquier sistema externo vía API pública versionada.',
        status: 'proximamente',
        badgeLabel: 'Sprint 13',
      },
      {
        name: 'MCP Server',
        description: 'Agentes de IA pueden operar tu club directamente.',
        status: 'proximamente',
        badgeLabel: 'Sprint 13',
      },
      {
        name: 'Webhooks',
        description: 'Recibí eventos en tiempo real en tu propio servidor.',
        status: 'proximamente',
        badgeLabel: 'Sprint 13',
      },
      {
        name: 'Zapier / Make',
        description: 'Automatizaciones sin código con miles de aplicaciones.',
        status: 'proximamente',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate initials from first 2 meaningful chars of a name */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const STATUS_CONFIG: Record<
  IntegrationStatus,
  { label: string; badgeClass: string; buttonLabel: string }
> = {
  activa: {
    label: 'Activa',
    badgeClass:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    buttonLabel: 'Configurar',
  },
  disponible: {
    label: 'Disponible',
    badgeClass:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
    buttonLabel: 'Conectar',
  },
  proximamente: {
    label: 'Próximamente',
    badgeClass:
      'bg-muted text-muted-foreground border-border',
    buttonLabel: 'Próximamente',
  },
}

const TOTAL_INTEGRATIONS = CATEGORIES.reduce(
  (sum, cat) => sum + cat.items.length,
  0
)

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InitialsCircleProps {
  name: string
  color: string
  textColor: string
}

function InitialsCircle({ name, color, textColor }: InitialsCircleProps) {
  return (
    <div
      className={cn(
        'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm select-none',
        color,
        textColor
      )}
    >
      {getInitials(name)}
    </div>
  )
}

interface IntegrationCardProps {
  integration: Integration
  category: Category
}

function IntegrationCard({ integration, category }: IntegrationCardProps) {
  const cfg = STATUS_CONFIG[integration.status]
  const badgeText = integration.badgeLabel ?? cfg.label

  function handleAction() {
    if (integration.status === 'disponible') {
      toast.info(
        `Solicitud enviada. Te contactaremos para configurar ${integration.name}.`
      )
    } else if (integration.status === 'activa') {
      toast.info(`Abriendo configuración de ${integration.name}…`)
    }
  }

  return (
    <Card className="group relative flex flex-col overflow-hidden border hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* Top accent line for active integrations */}
      {integration.status === 'activa' && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-emerald-500" />
      )}

      <CardContent className="flex flex-col gap-4 p-5 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <InitialsCircle
            name={integration.name}
            color={category.color}
            textColor={category.textColor}
          />
          <Badge
            variant="outline"
            className={cn('text-[10px] font-medium shrink-0 mt-0.5', cfg.badgeClass)}
          >
            {badgeText}
          </Badge>
        </div>

        {/* Name + description */}
        <div className="flex-1">
          <p className="text-sm font-semibold leading-snug">{integration.name}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {integration.description}
          </p>
        </div>

        {/* Action button */}
        <div className="mt-auto">
          {integration.status === 'proximamente' ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-muted-foreground"
              disabled
            >
              Próximamente
            </Button>
          ) : integration.status === 'disponible' ? (
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={handleAction}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Conectar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={handleAction}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Configurar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface CategorySectionProps {
  category: Category
  items: Integration[]
}

function CategorySection({ category, items }: CategorySectionProps) {
  const Icon = category.icon
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn('h-6 w-6 rounded-md flex items-center justify-center', category.color)}>
          <Icon className={cn('h-3.5 w-3.5', category.textColor)} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{category.name}</h3>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <IntegrationCard key={item.name} integration={item} category={category} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function IntegracionesPanel() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('todos')

  /** Filter categories and items based on search + active category pill */
  const visibleCategories = useMemo(() => {
    const q = search.trim().toLowerCase()

    return CATEGORIES.flatMap((cat) => {
      // Category filter
      if (activeCategory !== 'todos' && cat.slug !== activeCategory) return []

      // Search filter within items
      const items = q
        ? cat.items.filter(
            (i) =>
              i.name.toLowerCase().includes(q) ||
              i.description.toLowerCase().includes(q)
          )
        : cat.items

      if (items.length === 0) return []
      return [{ cat, items }]
    })
  }, [search, activeCategory])

  const totalVisible = visibleCategories.reduce(
    (sum, { items }) => sum + items.length,
    0
  )

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Marketplace</h2>
          <Badge variant="secondary" className="text-xs">
            {TOTAL_INTEGRATIONS} integraciones
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Conectá ClubCore con las herramientas que ya usás. Pagos, contabilidad,
          calendarios, comunicación y más — todo desde un solo lugar.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Filters row: category pills + search                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Category pills — scrollable on mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1 min-w-0">
          <button
            onClick={() => setActiveCategory('todos')}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
              activeCategory === 'todos'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            )}
          >
            Todos
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.slug
            return (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                )}
              >
                <Icon className="h-3 w-3" />
                {cat.name}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar…"
            className="pl-8 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Results                                                             */}
      {/* ------------------------------------------------------------------ */}
      {visibleCategories.length > 0 ? (
        <div className="space-y-8">
          {/* Result count when searching */}
          {search.trim() && (
            <p className="text-xs text-muted-foreground">
              {totalVisible} resultado{totalVisible !== 1 ? 's' : ''} para &quot;{search}&quot;
            </p>
          )}

          {visibleCategories.map(({ cat, items }) => (
            <CategorySection key={cat.slug} category={cat} items={items} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
            <Puzzle className="h-6 w-6 text-muted-foreground opacity-60" />
          </div>
          <div>
            <p className="text-sm font-medium">Sin resultados</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No hay integraciones que coincidan con &quot;{search}&quot;.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setSearch('')
              setActiveCategory('todos')
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
