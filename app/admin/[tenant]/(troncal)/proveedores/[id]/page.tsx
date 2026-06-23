import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Info, Wallet, Package, ShoppingCart } from 'lucide-react'
import {
  fetchProveedorDetalle,
  fetchProveedorCuentaCorriente,
  fetchProveedorProductos,
} from '../_lib/queries'
import { ProveedorInfo } from './_components/proveedor-info'
import { ProveedorCuentaCorriente } from './_components/proveedor-cuenta-corriente'
import { ProveedorProductos } from './_components/proveedor-productos'
import { EliminarProveedorButton } from './_components/eliminar-proveedor-button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProveedorDetallePage({ params }: PageProps) {
  const { id } = await params

  let proveedor, cuenta, productos
  try {
    ;[proveedor, cuenta, productos] = await Promise.all([
      fetchProveedorDetalle(id),
      fetchProveedorCuentaCorriente(id),
      fetchProveedorProductos(id),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sm:border-b-0 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-start gap-3">
          <Link href="/admin/proveedores">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{proveedor.nombre}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline">proveedor</Badge>
              {proveedor.cuit && <span className="text-sm text-muted-foreground">CUIT {proveedor.cuit}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={proveedor.activo ? 'default' : 'secondary'}>
              {proveedor.activo ? 'activo' : 'inactivo'}
            </Badge>
            <EliminarProveedorButton id={proveedor.id} nombre={proveedor.nombre} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="info">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="cuenta">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Cuenta corriente</span>
          </TabsTrigger>
          <TabsTrigger value="productos">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="compras">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Compras</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="pt-4">
            <ProveedorInfo
              proveedor={{
                id: proveedor.id,
                nombre: proveedor.nombre,
                cuit: proveedor.cuit,
                razon_social: proveedor.razon_social,
                telefono: proveedor.telefono,
                email: proveedor.email,
                sitio_web: proveedor.sitio_web,
                direccion: proveedor.direccion as {
                  calle?: string
                  numero?: string
                  ciudad?: string
                  provincia?: string
                  codigo_postal?: string
                  pais?: string
                } | null,
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="cuenta">
          <div className="pt-4">
            <ProveedorCuentaCorriente cuenta={cuenta} />
          </div>
        </TabsContent>

        <TabsContent value="productos">
          <div className="pt-4">
            <ProveedorProductos productos={productos} />
          </div>
        </TabsContent>

        <TabsContent value="compras">
          <div className="pt-4">
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-40" />
                El historial de compras (solicitud → OC → recepción) llega con el módulo de Compras (F1.14).
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
