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
  Puzzle,
  ArrowRight,
  BarChart3,
  Globe,
  Image,
} from 'lucide-react'
import Link from 'next/link'
import { fetchTenantConfig, fetchModulos, fetchCatalogos } from './_lib/queries'
import { ModulosPanel } from './_components/modulos-panel'
import { CatalogosPanel } from './_components/catalogos-panel'
import { TenantForm } from './_components/tenant-form'
import { IntegracionesPanel } from './_components/integraciones-panel'

const SECTIONS = [
  { value: 'general', label: 'Datos del club', icon: Building2 },
  { value: 'branding', label: 'Branding', icon: Palette },
  { value: 'modulos', label: 'Modulos', icon: Package },
  { value: 'catalogos', label: 'Catalogos', icon: Database },
  { value: 'integraciones', label: 'Integraciones', icon: Puzzle },
  { value: 'avanzado', label: 'Avanzado', icon: Settings },
] as const

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  light: 'Light',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'general'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Configuracion</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona tu organizacion, modulos, catalogos e integraciones
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Plan {PLAN_LABELS[tenant.plan_slug] ?? tenant.plan_slug}
        </Badge>
      </div>

      {/* Sidebar tabs + content */}
      <Tabs defaultValue={activeTab} className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <TabsList
          variant="line"
          className="flex lg:flex-col lg:w-56 lg:h-auto lg:p-1.5 overflow-x-auto lg:overflow-visible shrink-0 lg:bg-transparent lg:border lg:rounded-lg lg:gap-0.5 lg:items-stretch"
        >
          {SECTIONS.map((s) => (
            <TabsTrigger
              key={s.value}
              value={s.value}
              className="justify-start gap-2 text-sm lg:w-full lg:rounded-md lg:px-3 lg:py-2"
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
              {s.value === 'modulos' && (
                <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5 hidden lg:inline-flex">
                  {modulosActivosCount}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* ── Datos del club ── */}
          <TabsContent value="general">
            <div className="space-y-6">
              <TenantForm tenant={tenant} />

              {/* Resumen stats */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Resumen</CardTitle>
                  </div>
                  <CardDescription>
                    Estado general de tu configuracion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard label="Modulos activos" value={modulosActivosCount} />
                    <StatCard label="Catalogos" value={catalogosCount} />
                    <StatCard label="Atributos" value={catalogos.atributos.length} />
                    <StatCard label="Roles equipo" value={catalogos.rolesEquipo.length} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Branding ── */}
          <TabsContent value="branding">
            <div className="space-y-6">
              {/* Preview card that links to Branding Studio */}
              <Card className="group cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
                <Link href="/admin/configuracion/branding" className="block">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {branding?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={branding.logo_url}
                            alt="Logo"
                            className="h-12 w-12 rounded-lg object-contain border bg-white p-1"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg border bg-muted flex items-center justify-center">
                            <Image className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-base">
                            {branding?.nombre_display ?? tenant.nombre}
                          </CardTitle>
                          <CardDescription>
                            {branding?.slogan ?? 'Sin slogan configurado'}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        tabIndex={-1}
                      >
                        Abrir Branding Studio
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Colores */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Colores
                        </p>
                        <div className="flex items-center gap-2">
                          {branding?.color_primario ? (
                            <>
                              <div
                                className="h-6 w-6 rounded border shadow-sm"
                                style={{ backgroundColor: branding.color_primario }}
                              />
                              <span className="text-sm font-mono text-muted-foreground">
                                {branding.color_primario}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">No definidos</span>
                          )}
                          {branding?.color_secundario && (
                            <div
                              className="h-6 w-6 rounded border shadow-sm"
                              style={{ backgroundColor: branding.color_secundario }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Estado paginas */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Estado
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={branding?.pagina_publica_activa ? 'default' : 'secondary'}>
                            Pagina {branding?.pagina_publica_activa ? 'activa' : 'inactiva'}
                          </Badge>
                          <Badge variant={branding?.pre_inscripcion_activa ? 'default' : 'secondary'}>
                            Pre-inscripcion {branding?.pre_inscripcion_activa ? 'activa' : 'inactiva'}
                          </Badge>
                        </div>
                      </div>

                      {/* Assets */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Assets
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={branding?.logo_url ? 'default' : 'outline'}>
                            Logo {branding?.logo_url ? 'OK' : 'pendiente'}
                          </Badge>
                          <Badge variant={branding?.favicon_url ? 'default' : 'outline'}>
                            Favicon {branding?.favicon_url ? 'OK' : 'pendiente'}
                          </Badge>
                          <Badge variant={branding?.logo_dark_url ? 'default' : 'outline'}>
                            Logo dark {branding?.logo_dark_url ? 'OK' : 'pendiente'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>

              {/* Quick stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pagina publica</p>
                        <p className="text-xs text-muted-foreground">
                          {branding?.pagina_publica_activa ? 'Publicada y visible' : 'No publicada'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Identidad visual</p>
                        <p className="text-xs text-muted-foreground">
                          {branding?.logo_url && branding?.color_primario
                            ? 'Logo y colores configurados'
                            : 'Configuracion pendiente'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Pre-inscripcion</p>
                        <p className="text-xs text-muted-foreground">
                          {branding?.pre_inscripcion_activa
                            ? 'Formulario activo'
                            : 'Formulario desactivado'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Modulos ── */}
          <TabsContent value="modulos">
            <ModulosPanel modulos={modulos} />
          </TabsContent>

          {/* ── Catalogos ── */}
          <TabsContent value="catalogos">
            <CatalogosPanel
              atributos={catalogos.atributos}
              estadosPadron={catalogos.estadosPadron}
              tiposSocio={catalogos.tiposSocio}
              rolesEquipo={catalogos.rolesEquipo}
            />
          </TabsContent>

          {/* ── Integraciones ── */}
          <TabsContent value="integraciones">
            <IntegracionesPanel />
          </TabsContent>

          {/* ── Avanzado ── */}
          <TabsContent value="avanzado">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuracion JSON del tenant</CardTitle>
                  <CardDescription>
                    Datos extendidos almacenados en el campo configuracion (solo lectura)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-80 font-mono">
                    {JSON.stringify(tenant.configuracion ?? {}, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informacion del tenant</CardTitle>
                  <CardDescription>
                    Identificadores y metadatos del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoField label="Tenant ID" value={tenant.id} mono />
                    <InfoField label="Slug" value={tenant.slug} mono />
                    <InfoField label="Dominio custom" value={tenant.dominio_custom ?? 'No configurado'} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Estado
                      </p>
                      <Badge variant={tenant.activo ? 'default' : 'destructive'}>
                        {tenant.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Danger zone placeholder */}
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
                  <CardDescription>
                    Acciones irreversibles. Disponibles en una version futura.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" size="sm" disabled>
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

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-medium truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
