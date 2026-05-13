import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { TENANT_ID } from '@/lib/tenant'
import { Badge } from '@/components/ui/badge'
import { Check, Lock, ShoppingBag } from 'lucide-react'

type ModuloCard = {
  slug: string
  nombre: string
  capa: string | null
  activo: boolean
  descripcion_comercial: string | null
  precio_mensual_ars: number | null
  estado_pricing: string | null
}

const CAPA_LABELS: Record<string, string> = {
  troncal: 'Troncal',
  cross_vertical: 'Cross-vertical',
  vertical_ccbp: 'Club Deportivo (CCBP)',
  integracion: 'Integraciones',
}

const CAPA_ORDER = ['troncal', 'cross_vertical', 'vertical_ccbp', 'integracion']

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceRoleClient()

  const [modulosResult, activosResult, pricingResult] = await Promise.all([
    service.from('catalogo_modulos').select('slug, nombre, capa, activo_global').eq('activo_global', true).order('orden'),
    service.from('tenant_modulos').select('modulo_slug').eq('tenant_id', TENANT_ID).eq('activo', true),
    service.from('catalogo_modulos_pricing').select('*'),
  ])

  const modulos = modulosResult.data ?? []
  const activoSlugs = new Set((activosResult.data ?? []).map(a => a.modulo_slug))
  const pricingMap = (pricingResult.data ?? []).reduce((acc, p) => {
    acc[p.modulo_slug] = p
    return acc
  }, {} as Record<string, { descripcion_comercial: string | null; precio_mensual_ars: number | null; estado: string }>)

  const cards: ModuloCard[] = modulos
    .filter(m => m.capa)
    .map(m => ({
      slug: m.slug,
      nombre: m.nombre,
      capa: m.capa,
      activo: activoSlugs.has(m.slug),
      descripcion_comercial: pricingMap[m.slug]?.descripcion_comercial ?? null,
      precio_mensual_ars: pricingMap[m.slug]?.precio_mensual_ars ?? null,
      estado_pricing: pricingMap[m.slug]?.estado ?? null,
    }))

  const grouped = CAPA_ORDER.reduce((acc, capa) => {
    acc[capa] = cards.filter(c => c.capa === capa)
    return acc
  }, {} as Record<string, ModuloCard[]>)

  return (
    <div className="container mx-auto p-4 max-w-6xl" data-testid="pantalla-marketplace">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          Marketplace de modulos
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Activa los modulos que tu negocio necesita
        </p>
      </div>

      {CAPA_ORDER.map((capa) => {
        const items = grouped[capa]
        if (!items || items.length === 0) return null

        return (
          <div key={capa} className="mb-8" data-testid={`sidebar-section-${capa === 'vertical_ccbp' ? 'ccbp' : capa.replace('_', '-')}`}>
            <h2 className="text-lg font-semibold mb-4">{CAPA_LABELS[capa] ?? capa}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((card) => (
                <div
                  key={card.slug}
                  data-testid={`marketplace-card-${card.slug}`}
                  className={`rounded-lg border p-6 shadow-sm transition-colors ${
                    card.activo
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold">{card.nombre}</h3>
                    {card.activo ? (
                      <Check className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-400 shrink-0" />
                    )}
                  </div>

                  {card.descripcion_comercial && (
                    <p className="text-sm text-slate-500 mb-4">{card.descripcion_comercial}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {card.precio_mensual_ars && !card.activo && (
                      <span className="text-sm font-medium text-slate-600">
                        ${card.precio_mensual_ars.toLocaleString('es-AR')}/mes
                      </span>
                    )}
                    {card.activo ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
                    ) : card.estado_pricing === 'proximamente' ? (
                      <Badge variant="secondary">Proximamente</Badge>
                    ) : (
                      <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 cursor-pointer">
                        Activar
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
