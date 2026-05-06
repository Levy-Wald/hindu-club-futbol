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
  ArrowRight,
  Globe,
  ImageIcon,
  CheckCircle2,
  Circle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import { fetchTenantConfig, fetchModulos, fetchCatalogos } from './_lib/queries'
import { ModulosPanel } from './_components/modulos-panel'
import { CatalogosPanel } from './_components/catalogos-panel'
import { TenantForm } from './_components/tenant-form'
import { IntegracionesPanel } from './_components/integraciones-panel'

const SECTIONS = [
  { value: 'mi-organizacion', label: 'Mi organizacion', icon: Building2 },
  { value: 'identidad-marca', label: 'Identidad y marca', icon: Palette },
  { value: 'modulos', label: 'Modulos', icon: Package },
  { value: 'catalogos', label: 'Catalogos', icon: Database },
  { value: 'marketplace', label: 'Marketplace', icon: Store },
  { value: 'avanzado', label: 'Avanzado', icon: Settings },
] as const

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
  const activeTab = params.tab || 'mi-organizacion'

  const [{ tenant, modulosActivos, branding }, modulos, catalogos] = await Promise.all([
    fetchTenantConfig(),
    fetchModulos(),
    fetchCatalogos(),
  ])

  const modulosActivosCount = modulosActivos.filter((m) => m.activo).length
  const catalogosCount =
    catalogos.atributos.length +
    catalogos.estadosPadron.length +
    catalogos.tiposSocio.length +
    catalogos.rolesEquipo.length

  // Completion steps
  const completionSteps = [
    { label: 'Nombre del club',     done: Boolean(tenant.nombre) },
    { label: 'Logo subido',         done: Boolean(branding?.logo_url) },
    { label: 'Colores definidos',   done: Boolean(branding?.color_primario) },
    { label: 'Razon social',        done: Boolean((tenant.configuracion as Record<string, unknown>)?.razon_social) },
    { label: 'CUIT',                done: Boolean((tenant.configuracion as Record<string, unknown>)?.cuit) },
    { label: 'Modulo activo',       done: modulosActivosCount > 0 },
  ]
  const completedCount = completionSteps.filter((s) => s.done).length
  const completionPct = Math.round((completedCount / completionSteps.length) * 100)

  const planStyle = PLAN_STYLES[tenant.plan_slug] ?? { label: tenant.plan_slug, className: 'bg-muted text-muted-foreground border-border' }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Configuracion
            </h1>
            <Badge
              variant="outline"
              className={`text-[11px] font-semibold px-2 py-0.5 ${planStyle.className}`}
            >
              {planStyle.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {tenant.nombre} &mdash; gestioná tu organizacion, marca, modulos y catálogos
          </p>
        </div>

        {/* Completion indicator */}
        <div className="flex items-center gap-3 bg-muted/50 border rounded-xl px-4 py-3 shrink-0 min-w-[220px]">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Configuracion completada</p>
              <p className="text-xs font-semibold tabular-nums">
                {completedCount}/{completionSteps.length}
              </p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
          {completedCount === completionSteps.length ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </div>

      {/* ── Sidebar tabs + content ── */}
      <Tabs defaultValue={activeTab} className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

        {/* Sidebar navigation */}
        <div className="shrink-0 w-full lg:w-52">
          <TabsList
            variant="line"
            className="flex lg:flex-col w-full lg:h-auto lg:p-1.5 overflow-x-auto lg:overflow-visible lg:bg-muted/40 lg:border lg:rounded-xl lg:gap-0.5 lg:items-stretch"
          >
            {SECTIONS.map((s) => (
              <TabsTrigger
                key={s.value}
                value={s.value}
                className="justify-start gap-2.5 text-sm font-medium lg:w-full lg:rounded-lg lg:px-3 lg:py-2.5 lg:data-[state=active]:bg-background lg:data-[state=active]:shadow-sm"
              >
                <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="hidden sm:inline">{s.label}</span>
                {s.value === 'modulos' && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] h-4 px-1.5 hidden lg:inline-flex"
                  >
                    {modulosActivosCount}
                  </Badge>
                )}
                {s.value === 'catalogos' && (
                  <Badge
                    variant="secondary"
                    className="ml-auto text-[10px] h-4 px-1.5 hidden lg:inline-flex"
                  >
                    {catalogosCount}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">

          {/* ── Mi organizacion ── */}
          <TabsContent value="mi-organizacion" className="mt-0">
            <div className="space-y-6">
              <SectionHeader
                icon={Building2}
                title="Mi organizacion"
                description="Datos institucionales, dirección, contacto, configuracion regional y plan."
              />
              <TenantForm tenant={tenant} />

              {/* Setup checklist */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">Checklist de configuracion</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Completá estos pasos para tener tu club listo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {completionSteps.map((step) => (
                      <div key={step.label} className="flex items-center gap-2.5 py-1.5">
                        {step.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={`text-sm ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Modulos activos" value={modulosActivosCount} />
                <StatCard label="Catalogos" value={catalogosCount} />
                <StatCard label="Atributos" value={catalogos.atributos.length} />
                <StatCard label="Roles equipo" value={catalogos.rolesEquipo.length} />
              </div>
            </div>
          </TabsContent>

          {/* ── Identidad y marca ── */}
          <TabsContent value="identidad-marca" className="mt-0">
            <div className="space-y-6">
              <SectionHeader
                icon={Palette}
                title="Identidad y marca"
                description="Logo, colores, slogan y configuracion de tu pagina publica y formulario de pre-inscripcion."
              />

              {/* Main preview card → Branding Studio */}
              <Link href="/admin/configuracion/branding" className="block group">
                <Card className="hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {branding?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={branding.logo_url}
                            alt="Logo"
                            className="h-14 w-14 rounded-xl object-contain border bg-white p-1.5 shadow-sm"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-xl border bg-muted flex items-center justify-center shadow-sm">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <CardTitle className="text-base">
                            {branding?.nombre_display ?? tenant.nombre}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {branding?.slogan ?? 'Sin slogan configurado'}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors"
                        tabIndex={-1}
                      >
                        Branding Studio
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t">
                      {/* Colores */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Colores
                        </p>
                        {branding?.color_primario ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-7 w-7 rounded-md border shadow-sm"
                              style={{ backgroundColor: branding.color_primario }}
                            />
                            {branding.color_secundario && (
                              <div
                                className="h-7 w-7 rounded-md border shadow-sm"
                                style={{ backgroundColor: branding.color_secundario }}
                              />
                            )}
                            <span className="text-xs font-mono text-muted-foreground ml-1">
                              {branding.color_primario}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No definidos</p>
                        )}
                      </div>

                      {/* Assets */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Assets
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <AssetBadge label="Logo" done={Boolean(branding?.logo_url)} />
                          <AssetBadge label="Favicon" done={Boolean(branding?.favicon_url)} />
                          <AssetBadge label="Logo dark" done={Boolean(branding?.logo_dark_url)} />
                        </div>
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Estado
                        </p>
                        <div className="flex flex-col gap-1.5">
                          <StatusRow
                            icon={Globe}
                            label="Pagina publica"
                            active={Boolean(branding?.pagina_publica_activa)}
                          />
                          <StatusRow
                            icon={Building2}
                            label="Pre-inscripcion"
                            active={Boolean(branding?.pre_inscripcion_activa)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Tip card */}
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-4 flex items-start gap-3">
                  <Palette className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Desde el <strong className="text-foreground">Branding Studio</strong> podés subir tu logo, definir la paleta de colores, configurar el slogan y controlar la visibilidad de tu pagina publica y formulario de inscripcion.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Modulos ── */}
          <TabsContent value="modulos" className="mt-0">
            <div className="space-y-6">
              <SectionHeader
                icon={Package}
                title="Modulos"
                description="Activá o desactivá los modulos funcionales disponibles en tu plan. Cada modulo habilita un conjunto de features en la plataforma."
              />
              <ModulosPanel modulos={modulos} />
            </div>
          </TabsContent>

          {/* ── Catalogos ── */}
          <TabsContent value="catalogos" className="mt-0">
            <div className="space-y-6">
              <SectionHeader
                icon={Database}
                title="Catalogos"
                description="Gestioná los valores de referencia del sistema: atributos de personas, estados de padron, tipos de socio y roles de equipo."
              />
              <CatalogosPanel
                atributos={catalogos.atributos}
                estadosPadron={catalogos.estadosPadron}
                tiposSocio={catalogos.tiposSocio}
                rolesEquipo={catalogos.rolesEquipo}
              />
            </div>
          </TabsContent>

          {/* ── Marketplace ── */}
          <TabsContent value="marketplace" className="mt-0">
            <div className="space-y-6">
              <SectionHeader
                icon={Store}
                title="Marketplace"
                description="Conectá ClubCore con sistemas externos: procesadores de pago, federaciones deportivas, plataformas de comunicacion y mas."
              />
              <IntegracionesPanel />
            </div>
          </TabsContent>

          {/* ── Avanzado ── */}
          <TabsContent value="avanzado" className="mt-0">
            <div className="space-y-6">
              <SectionHeader
                icon={Settings}
                title="Avanzado"
                description="Informacion técnica del tenant, configuracion extendida en JSON y acciones de administracion del sistema."
              />

              {/* Tenant metadata */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">Informacion del tenant</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Identificadores y metadatos del sistema. Solo lectura.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <InfoField label="Tenant ID" value={tenant.id} mono />
                    <InfoField label="Slug" value={tenant.slug} mono />
                    <InfoField
                      label="Dominio custom"
                      value={tenant.dominio_custom ?? 'No configurado'}
                    />
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Estado
                      </p>
                      <Badge variant={tenant.activo ? 'default' : 'destructive'} className="text-xs">
                        {tenant.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <InfoField label="Plan" value={planStyle.label} />
                    <InfoField label="Timezone" value={(tenant as { timezone?: string }).timezone ?? 'America/Argentina/Buenos_Aires'} />
                  </div>
                </CardContent>
              </Card>

              {/* Raw JSON config */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">Configuracion JSON</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Datos extendidos almacenados en el campo <code className="font-mono">configuracion</code> del tenant.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted/60 border p-4 rounded-lg overflow-x-auto max-h-72 font-mono leading-relaxed text-muted-foreground">
                    {JSON.stringify(tenant.configuracion ?? {}, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* Danger zone */}
              <Card className="border-destructive/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-sm font-semibold text-destructive">
                      Zona de peligro
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Acciones irreversibles. Disponibles en una version futura.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" size="sm" disabled className="text-muted-foreground">
                      Exportar todos los datos
                    </Button>
                    <Button variant="destructive" size="sm" disabled>
                      Eliminar tenant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}

// ─── Helper components ────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
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

function AssetBadge({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
        done
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
          : 'bg-muted text-muted-foreground border-border'
      }`}
    >
      {done ? (
        <CheckCircle2 className="h-2.5 w-2.5" />
      ) : (
        <Circle className="h-2.5 w-2.5" />
      )}
      {label}
    </span>
  )
}

function StatusRow({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`ml-auto inline-block h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-muted-foreground/30'
        }`}
      />
    </div>
  )
}
