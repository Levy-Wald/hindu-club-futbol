import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchTenantConfig, fetchModulos, fetchCatalogos } from './_lib/queries'
import { ModulosPanel } from './_components/modulos-panel'
import { CatalogosPanel } from './_components/catalogos-panel'

export default async function ConfiguracionPage() {
  const [{ tenant }, modulos, catalogos] = await Promise.all([
    fetchTenantConfig(),
    fetchModulos(),
    fetchCatalogos(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Configuracion</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="modulos">Modulos</TabsTrigger>
          <TabsTrigger value="catalogos">Catalogos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos del tenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{tenant.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium">{tenant.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dominio personalizado</p>
                  <p className="font-medium">{tenant.dominio_personalizado ?? 'No configurado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={tenant.activo ? 'default' : 'outline'}>
                    {tenant.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Logo URL</p>
                  <p className="font-medium text-sm truncate">
                    {tenant.logo_url ?? 'Sin logo'}
                  </p>
                </div>
              </div>

              {tenant.config && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Configuracion (JSON)</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-48">
                    {JSON.stringify(tenant.config, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modulos" className="mt-4">
          <ModulosPanel modulos={modulos} />
        </TabsContent>

        <TabsContent value="catalogos" className="mt-4">
          <CatalogosPanel
            atributos={catalogos.atributos}
            estadosPadron={catalogos.estadosPadron}
            tiposSocio={catalogos.tiposSocio}
            rolesEquipo={catalogos.rolesEquipo}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
