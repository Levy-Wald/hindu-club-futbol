'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { ProductoFormDialog } from '@/modules/pim/ui/producto-form'
import { VarianteFormDialog } from '@/modules/pim/ui/variante-form'
import { VarianteRow } from '@/modules/pim/ui/variante-row'
import { GaleriaImagenes } from '@/modules/pim/ui/galeria-imagenes'
import type {
  ProductoConCategorias,
  ProductoVariante,
  ProductoCategoria,
  UnidadMedida,
  Marca,
  ProductoImagen,
  ModoOperacion,
} from '@/modules/pim/lib/tipos'

const MODOS_LABELS: Record<ModoOperacion, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  prestamo: 'Préstamo',
  gratis: 'Gratis',
}

interface ProductoDetalleProps {
  producto: ProductoConCategorias
  variantes: ProductoVariante[]
  categorias: ProductoCategoria[]
  unidades: UnidadMedida[]
  marcas: Marca[]
  imagenes: ProductoImagen[]
}

export function ProductoDetalle({
  producto,
  variantes,
  categorias,
  unidades,
  marcas,
  imagenes,
}: ProductoDetalleProps) {
  const p = producto

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/productos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {p.imagen_url ? (
              <img src={p.imagen_url} alt={p.nombre} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{p.nombre}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {p.sku && <span>SKU: {p.sku}</span>}
              <Badge variant="outline" className="capitalize">{p.tipo}</Badge>
              {!p.activo && <Badge variant="secondary">Inactivo</Badge>}
              {p.marca_nombre && <span>Marca: {p.marca_nombre}</span>}
            </div>
          </div>
        </div>
        <ProductoFormDialog
          mode="edit"
          producto={{ ...p, categorias: p.categorias.map((c) => ({ id: c.id })) }}
          categorias={categorias}
          unidades={unidades}
          marcas={marcas}
          triggerRender={<Button variant="outline" size="sm" />}
          triggerLabel="Editar"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Precio ARS</p>
          <p className="text-lg font-semibold">
            {p.precio_base_ars !== null ? `$${p.precio_base_ars.toLocaleString('es-AR')}` : '-'}
          </p>
        </div>
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Precio USD</p>
          <p className="text-lg font-semibold">
            {p.precio_base_usd !== null ? `US$${p.precio_base_usd.toLocaleString('es-AR')}` : '-'}
          </p>
        </div>
        {p.tipo === 'producto' && (
          <div className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="text-lg font-semibold">{p.stock_simple ?? '-'}</p>
          </div>
        )}
        <div className="border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Variantes</p>
          <p className="text-lg font-semibold">{variantes.length}</p>
        </div>
      </div>

      {/* Modos */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Modos:</span>
        {p.modos_disponibles.map((m) => (
          <Badge key={m} variant="outline">{MODOS_LABELS[m]}</Badge>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="variantes">
        <TabsList>
          <TabsTrigger value="variantes">Variantes ({variantes.length})</TabsTrigger>
          <TabsTrigger value="imagenes">Imagenes ({imagenes.length})</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="variantes" className="pt-4">
          <div className="space-y-3">
            <VarianteFormDialog mode="create" productoId={p.id} />
            {variantes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No hay variantes.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {variantes.map((v) => (
                  <VarianteRow key={v.id} variante={v} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="imagenes" className="pt-4">
          <GaleriaImagenes productoId={p.id} imagenes={imagenes} />
        </TabsContent>

        <TabsContent value="info" className="pt-4">
          <div className="border rounded-lg p-4 space-y-3 text-sm">
            {p.descripcion && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Descripcion</p>
                <p>{p.descripcion}</p>
              </div>
            )}
            {p.categorias.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Categorias</p>
                <div className="flex gap-1 flex-wrap">
                  {p.categorias.map((c) => (
                    <Badge key={c.id} variant="secondary">{c.nombre}</Badge>
                  ))}
                </div>
              </div>
            )}
            {p.unidad_medida_slug && (
              <div>
                <p className="text-muted-foreground text-xs mb-1">Unidad de medida</p>
                <p>{p.unidad_medida_slug}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs mb-1">Creado</p>
              <p>{new Date(p.created_at).toLocaleDateString('es-AR')}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
