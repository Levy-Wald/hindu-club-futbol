import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CalendarDays, DollarSign, CheckCircle2, Clock } from 'lucide-react'
import { PagarCuotaConvenioDialog } from './_components/pagar-cuota-dialog'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

function formatMoney(v: number | null): string {
  if (v == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v)
}

function formatFecha(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const estadoBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  activo: { label: 'Activo', variant: 'default' },
  vigente: { label: 'Vigente', variant: 'default' },
  completado: { label: 'Completado', variant: 'secondary' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  en_mora: { label: 'En mora', variant: 'destructive' },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ConvenioDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: convenio, error } = await supabase
    .from('convenios_pago')
    .select('*, persona:personas!persona_id(id, nombre, apellido, numero_documento)')
    .eq('id', id)
    .eq('tenant_id', TENANT_ID)
    .single()

  if (error || !convenio) notFound()

  const personaRaw = convenio.persona as unknown
  const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as { nombre: string; apellido: string; numero_documento: string | null } | null
  const badge = estadoBadge[convenio.estado] ?? { label: convenio.estado, variant: 'outline' as const }

  const esActivo = convenio.estado === 'vigente' || convenio.estado === 'activo'
  const cuotasRestantes = convenio.cantidad_cuotas - convenio.cuotas_pagadas
  const porcentaje = convenio.cantidad_cuotas > 0 ? Math.round((convenio.cuotas_pagadas / convenio.cantidad_cuotas) * 100) : 0

  // Fetch cajas y medios de pago para el dialog de cobro
  const [cajasRes, mediosPagoRes] = await Promise.all([
    supabase.from('cajas').select('id, nombre').eq('tenant_id', TENANT_ID).eq('activa', true).is('deleted_at', null).order('nombre'),
    supabase.from('medios_pago').select('id, nombre').eq('tenant_id', TENANT_ID).eq('activo', true).order('nombre'),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Convenio — {persona ? `${persona.apellido}, ${persona.nombre}` : 'Sin persona'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {persona?.numero_documento ? `DNI ${persona.numero_documento}` : ''}
          </p>
        </div>
        <Badge variant={badge.variant} className="text-sm">{badge.label}</Badge>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Deuda original</span>
            </div>
            <p className="text-lg font-bold">{formatMoney(convenio.deuda_original)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Cuotas pagadas</span>
            </div>
            <p className="text-lg font-bold">{convenio.cuotas_pagadas}/{convenio.cantidad_cuotas}</p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div className="bg-primary rounded-full h-1.5" style={{ width: `${porcentaje}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs">Monto por cuota</span>
            </div>
            <p className="text-lg font-bold">{formatMoney(convenio.monto_cuota)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs">Inicio</span>
            </div>
            <p className="text-lg font-bold">{formatFecha(convenio.fecha_inicio)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Proxima cuota */}
      {esActivo && cuotasRestantes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Proxima cuota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Cuota {convenio.cuotas_pagadas + 1} de {convenio.cantidad_cuotas}
                </p>
                <p className="text-sm">
                  Vencimiento: <strong>{formatFecha(convenio.proximo_vencimiento)}</strong>
                </p>
                <p className="text-sm">
                  Monto: <strong>{formatMoney(convenio.monto_cuota)}</strong>
                </p>
              </div>
              <PagarCuotaConvenioDialog
                convenioId={convenio.id}
                cuotaNumero={convenio.cuotas_pagadas + 1}
                totalCuotas={convenio.cantidad_cuotas}
                monto={convenio.monto_cuota}
                cajas={cajasRes.data ?? []}
                mediosPago={mediosPagoRes.data ?? []}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {convenio.observaciones && (
        <Card>
          <CardHeader><CardTitle className="text-base">Observaciones</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{convenio.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
