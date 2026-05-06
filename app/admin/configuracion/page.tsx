import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Package,
  Database,
  Building2,
  Palette,
  Store,
  Globe,
  CheckCircle2,
  Circle,
  ShieldCheck,
  AlertTriangle,
  Users,
  Landmark,
  CreditCard,
  Key,
  FileText,
  Download,
} from 'lucide-react'
import Link from 'next/link'
import { fetchTenantConfig, fetchModulos, fetchCatalogos } from './_lib/queries'
import { ModulosPanel } from './_components/modulos-panel'
import { CatalogosPanel } from './_components/catalogos-panel'
import { TenantForm } from './_components/tenant-form'
import { IntegracionesPanel } from './_components/integraciones-panel'
import { BrandingForm } from './branding/_components/branding-form'

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  free:       { label: 'Free',       className: 'bg-muted text-muted-foreground border-border' },
  light:      { label: 'Light',      className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  pro:        { label: 'Pro',        className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800' },
  enterprise: { label: 'Enterprise', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800' },
}

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'organizacion'

  const [{ tenant, modulosActivos, branding }, modulos, catalogos] = await Promise.all([
    fetchTenantConfig(),
    fetchModulos(),
    fetchCatalogos(),
  ])

  const modulosActivosCount = modulosActivos.filter((m) => m.activo).length
  const catalogosCount = Object.values(catalogos).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  )

  const config = tenant.configuracion as Record<string, unknown> | null

  // Completion steps
  const completionSteps = [
    { label: 'Nombre del club', done: Boolean(tenant.nombre) },
    { label: 'Logo subido', done: Boolean(branding?.logo_url) },
    { label: 'Colores definidos', done: Boolean(branding?.color_primario) },
    { label: 'Razon social', done: Boolean(config?.razon_social) },
    { label: 'CUIT', done: Boolean(config?.cuit) },
    { label: 'Modulo activo', done: modulosActivosCount > 0 },
  ]
  const completedCount = completionSteps.filter((s) => s.done).length
  const completionPct = Math.round((completedCount / completionSteps.length) * 100)

  const planStyle = PLAN_STYLES[tenant.plan_slug] ?? { label: tenant.plan_slug, className: 'bg-muted text-muted-foreground border-border' }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Configuracion</h1>
            <Badge variant="outline" className={`text-[11px] font-semibold px-2 py-0.5 ${planStyle.className}`}>
              {planStyle.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {tenant.nombre} &mdash; gestioná tu organizacion, marca, modulos y catálogos
          </p>
        </div>

        {/* Completion indicator */}
        {completedCount < completionSteps.length && (
          <div className="flex items-center gap-3 bg-muted/50 border rounded-xl px-4 py-2.5 shrink-0">
            <div className="space-y-1 min-w-[160px]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium text-muted-foreground">Setup</p>
                <p className="text-[11px] font-semibold tabular-nums">{completedCount}/{completionSteps.length}</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal tabs */}
      <Tabs defaultValue={activeTab}>
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="organizacion" className="gap-1.5 text-sm">
            <Building2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mi organizacion</span>
            <span className="sm:hidden">Org</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-sm">
            <Palette className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Identidad y marca</span>
            <span className="sm:hidden">Marca</span>
          </TabsTrigger>
          <TabsTrigger value="modulos" className="gap-1.5 text-sm">
            <Package className="h-3.5 w-3.5" />
            Modulos
            {modulosActivosCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5">
                {modulosActivosCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="catalogos" className="gap-1.5 text-sm">
            <Database className="h-3.5 w-3.5" />
            Catalogos
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5 hidden sm:inline-flex">
              {catalogosCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="marketplace" className="gap-1.5 text-sm">
            <Store className="h-3.5 w-3.5" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="avanzado" className="gap-1.5 text-sm">
            <Settings className="h-3.5 w-3.5" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        {/* ── Mi organizacion ── */}
        <TabsContent value="organizacion" className="mt-6 space-y-6">
          {/* 1. Checklist (only if incomplete) */}
          {completedCount < completionSteps.length && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Completá tu configuracion</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {completionSteps.map((step) => (
                    <div key={step.label} className="flex items-center gap-1.5">
                      {step.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={`text-xs ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2. Plan y suscripcion */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Plan y suscripcion</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Plan</p>
                    <Badge variant="outline" className={`text-xs font-semibold ${planStyle.className}`}>
                      {planStyle.label}
                    </Badge>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Estado</p>
                    <Badge variant={tenant.activo ? 'default' : 'destructive'} className="text-xs">
                      {tenant.activo ? (
                        <><CheckCircle2 className="mr-1 h-3 w-3" />Activo</>
                      ) : (
                        'Inactivo'
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Dominio custom</p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.dominio_custom ?? 'No configurado'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Accesos rapidos + Stats */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Accesos rapidos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickLink href="/admin/personas" icon={Users} label="Personas" description="Clientes y socios" />
              <QuickLink href="/admin/entidades" icon={Landmark} label="Entidades" description="Proveedores y externos" />
              <QuickLink href="/admin/padrones" icon={FileText} label="Padrones" description="Membresías activas" />
              <QuickLink href="/admin/equipos" icon={Users} label="Equipos" description="Planteles deportivos" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Modulos activos" value={modulosActivosCount} />
            <StatCard label="Catalogos" value={catalogosCount} />
            <StatCard label="Atributos" value={catalogos.atributos.length} />
            <StatCard label="Roles equipo" value={catalogos.rolesEquipo.length} />
          </div>

          {/* 4. Datos de la org + Ubicación + Config regional (TenantForm) */}
          <TenantForm tenant={tenant} />
        </TabsContent>

        {/* ── Identidad y marca ── */}
        <TabsContent value="branding" className="mt-6">
          <BrandingForm config={branding} />
        </TabsContent>

        {/* ── Modulos ── */}
        <TabsContent value="modulos" className="mt-6">
          <ModulosPanel modulos={modulos} />
        </TabsContent>

        {/* ── Catalogos ── */}
        <TabsContent value="catalogos" className="mt-6">
          <CatalogosPanel
            atributos={catalogos.atributos}
            estadosPadron={catalogos.estadosPadron}
            tiposSocio={catalogos.tiposSocio}
            rolesEquipo={catalogos.rolesEquipo}
            motivosBaja={catalogos.motivosBaja}
            tiposVinculo={catalogos.tiposVinculo}
            disciplinas={catalogos.disciplinas}
            nivelesCompetencia={catalogos.nivelesCompetencia}
            tiposDocumento={catalogos.tiposDocumento}
            tiposEstudio={catalogos.tiposEstudio}
            obrasSociales={catalogos.obrasSociales}
          />
        </TabsContent>

        {/* ── Marketplace ── */}
        <TabsContent value="marketplace" className="mt-6">
          <IntegracionesPanel />
        </TabsContent>

        {/* ── Avanzado ── */}
        <TabsContent value="avanzado" className="mt-6 space-y-6">
          {/* Plan y facturacion */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Plan y facturacion</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Tu suscripcion a ClubCore y medio de pago.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Plan actual</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-semibold ${planStyle.className}`}>
                      {planStyle.label}
                    </Badge>
                    <Badge variant={tenant.activo ? 'default' : 'destructive'} className="text-xs">
                      {tenant.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Medio de pago</p>
                  <p className="text-sm text-muted-foreground">No configurado</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Proxima facturacion</p>
                  <p className="text-sm text-muted-foreground">—</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" disabled>
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Configurar medio de pago
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Cambiar plan
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Descargar facturas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API y acceso programatico */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">API y acceso programatico</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Claves de API, webhooks y acceso para desarrolladores. Disponible en Sprint 13.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-dashed p-4 text-center space-y-1">
                  <Key className="h-5 w-5 mx-auto text-muted-foreground/50" />
                  <p className="text-xs font-medium">API Keys</p>
                  <p className="text-[10px] text-muted-foreground">Próximamente</p>
                </div>
                <div className="rounded-lg border border-dashed p-4 text-center space-y-1">
                  <Globe className="h-5 w-5 mx-auto text-muted-foreground/50" />
                  <p className="text-xs font-medium">Webhooks</p>
                  <p className="text-[10px] text-muted-foreground">Próximamente</p>
                </div>
                <div className="rounded-lg border border-dashed p-4 text-center space-y-1">
                  <FileText className="h-5 w-5 mx-auto text-muted-foreground/50" />
                  <p className="text-xs font-medium">Documentacion API</p>
                  <p className="text-[10px] text-muted-foreground">Próximamente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informacion del tenant */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold">Informacion del sistema</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Identificadores técnicos y metadatos. Solo lectura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                <InfoField label="Tenant ID" value={tenant.id} mono />
                <InfoField label="Slug" value={tenant.slug} mono />
                <InfoField label="Dominio custom" value={tenant.dominio_custom ?? 'No configurado'} />
                <InfoField label="Plan" value={planStyle.label} />
                <InfoField label="Timezone" value={(tenant as { timezone?: string }).timezone ?? 'America/Argentina/Buenos_Aires'} />
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
                  <Badge variant={tenant.activo ? 'default' : 'destructive'} className="text-xs">
                    {tenant.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <CardTitle className="text-sm font-semibold text-destructive">Zona de peligro</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Acciones irreversibles. Disponibles en una version futura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Exportar todos los datos
                </Button>
                <Button variant="destructive" size="sm" disabled>
                  Eliminar tenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: React.ElementType
  label: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{label}</p>
            <p className="text-[11px] text-muted-foreground truncate">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center space-y-1 hover:border-primary/30 transition-colors">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

