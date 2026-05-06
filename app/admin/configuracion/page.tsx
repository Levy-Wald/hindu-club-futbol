import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Package, Database, Building2, Palette, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { fetchTenantConfig, fetchModulos, fetchCatalogos } from './_lib/queries'
import { ModulosPanel } from './_components/modulos-panel'
import { CatalogosPanel } from './_components/catalogos-panel'

const TIPO_LABELS: Record<string, string> = {
  club: 'Club Deportivo',
  country: 'Country',
  federacion: 'Federacion',
  capitan_amateur: 'Capitan Amateur',
  saas_cliente: 'SaaS Cliente',
  escuela_deportiva: 'Escuela Deportiva',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export default async function ConfiguracionPage() {
  const [{ tenant, modulosActivos }, modulos, catalogos] = await Promise.all([
    fetchTenantConfig(),
    fetchModulos(),
    fetchCatalogos(),
  ])

  const modulosActivosCount = modulosActivos.filter((m) => m.activo).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Configuracion</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tu tenant, modulos y catalogos</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Plan {PLAN_LABELS[tenant.plan_slug] ?? tenant.plan_slug}
        </Badge>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="modulos">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Modulos</span>
            <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5 hidden sm:inline-flex">
              {modulosActivosCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="catalogos">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Catalogos</span>
          </TabsTrigger>
          <TabsTrigger value="avanzado">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Avanzado</span>
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos del tenant</CardTitle>
                <CardDescription>Informacion principal de tu organizacion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Nombre" value={tenant.nombre} />
                  <InfoField label="Slug" value={tenant.slug} mono />
                  <InfoField label="Tipo" value={TIPO_LABELS[tenant.tipo] ?? tenant.tipo} />
                  <InfoField label="Plan" value={PLAN_LABELS[tenant.plan_slug] ?? tenant.plan_slug} />
                  <InfoField label="Dominio custom" value={tenant.dominio_custom ?? 'No configurado'} />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Estado</p>
                    <Badge variant={tenant.activo ? 'default' : 'destructive'}>
                      {tenant.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Branding y pagina publica
                  </CardTitle>
                  <CardDescription>Logo, colores, contenido y configuracion de tu sitio publico</CardDescription>
                </div>
                <Button variant="outline" size="sm" render={<Link href="/admin/configuracion/branding" />}>
                  Abrir Branding Studio
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <InfoField label="Logo" value={tenant.logo_url ?? 'Sin logo'} />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Color principal</p>
                    <div className="flex items-center gap-2">
                      {tenant.color_principal && (
                        <div className="h-5 w-5 rounded border" style={{ backgroundColor: tenant.color_principal }} />
                      )}
                      <span className="text-sm font-mono">{tenant.color_principal ?? 'No definido'}</span>
                    </div>
                  </div>
                  <InfoField label="Idioma" value={tenant.idioma_default ?? 'es-AR'} />
                  <InfoField label="Timezone" value={tenant.timezone ?? 'America/Argentina/Buenos_Aires'} />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Modulos activos" value={modulosActivosCount} />
              <StatCard label="Catalogos" value={
                catalogos.atributos.length + catalogos.estadosPadron.length +
                catalogos.tiposSocio.length + catalogos.rolesEquipo.length
              } />
              <StatCard label="Atributos" value={catalogos.atributos.length} />
              <StatCard label="Roles equipo" value={catalogos.rolesEquipo.length} />
            </div>
          </div>
        </TabsContent>

        {/* Modulos */}
        <TabsContent value="modulos" className="mt-6">
          <ModulosPanel modulos={modulos} />
        </TabsContent>

        {/* Catalogos */}
        <TabsContent value="catalogos" className="mt-6">
          <CatalogosPanel
            atributos={catalogos.atributos}
            estadosPadron={catalogos.estadosPadron}
            tiposSocio={catalogos.tiposSocio}
            rolesEquipo={catalogos.rolesEquipo}
          />
        </TabsContent>

        {/* Avanzado */}
        <TabsContent value="avanzado" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuracion avanzada</CardTitle>
              <CardDescription>Configuracion JSON del tenant (solo lectura)</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto max-h-64 font-mono">
                {JSON.stringify(tenant.configuracion ?? {}, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
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
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
