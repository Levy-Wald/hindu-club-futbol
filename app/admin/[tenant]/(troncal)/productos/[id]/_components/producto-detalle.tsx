'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductoFormDialog } from '@/modules/pim/ui/producto-form'
import { VarianteFormDialog } from '@/modules/pim/ui/variante-form'
import { VarianteRow } from '@/modules/pim/ui/variante-row'
import { GaleriaImagenes } from '@/modules/pim/ui/galeria-imagenes'
import { ProveedorFormDialog } from '@/modules/pim/ui/proveedor-form'
import { ProveedorRow } from '@/modules/pim/ui/proveedor-row'
import { ResponsableFormDialog } from '@/modules/pim/ui/responsable-form'
import { ResponsableRow } from '@/modules/pim/ui/responsable-row'
import { PrecioFormDialog } from '@/modules/pim/ui/precio-form'
import { PrecioRow } from '@/modules/pim/ui/precio-row'
import { MovimientoStockFormDialog } from '@/modules/pim/ui/movimiento-stock-form'
import { StockRow } from '@/modules/pim/ui/stock-row'
import type {
  ProductoConCategorias,
  ProductoVariante,
  ProductoCategoria,
  UnidadMedida,
  Marca,
  ProductoImagen,
  ProductoProveedor,
  ProductoResponsable,
  ListaPrecios,
  PrecioProducto,
  StockEspacio,
  MovimientoStock,
  ModoOperacion,
  TipoUso,
} from '@/modules/pim/lib/tipos'

const MODOS_LABELS: Record<ModoOperacion, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  prestamo: 'Préstamo',
  gratis: 'Gratis',
}

const TIPO_USO_LABELS: Record<TipoUso, string> = {
  reventa: 'Reventa',
  uso_interno_consumible: 'Consumible',
  uso_interno_bien_uso: 'Bien de uso',
  servicio: 'Servicio',
}

interface ProductoDetalleProps {
  producto: ProductoConCategorias
  variantes: ProductoVariante[]
  categorias: ProductoCategoria[]
  unidades: UnidadMedida[]
  marcas: Marca[]
  imagenes: ProductoImagen[]
  proveedores: ProductoProveedor[]
  responsables: ProductoResponsable[]
  entidades: { id: string; nombre: string; tipo: string }[]
  personasResp: { id: string; nombre: string; apellido: string }[]
  atributosResp: { slug: string; nombre: string }[]
  listasPrecios: ListaPrecios[]
  precios: PrecioProducto[]
  stockEspacios: StockEspacio[]
  movimientos: MovimientoStock[]
  espacios: { id: string; nombre: string }[]
}

export function ProductoDetalle({
  producto,
  variantes,
  categorias,
  unidades,
  marcas,
  imagenes,
  proveedores,
  responsables,
  entidades,
  personasResp,
  atributosResp,
  listasPrecios,
  precios,
  stockEspacios,
  movimientos,
  espacios,
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
              <Image src={p.imagen_url} alt={p.nombre} width={48} height={48} className="h-12 w-12 rounded-lg object-cover" unoptimized />
            ) : (
              <Package className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{p.nombre}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {p.sku && <span>SKU: {p.sku}</span>}
              <Badge variant="outline" className="capitalize">{p.tipo}</Badge>
              {p.tipo_uso && <Badge variant="outline">{TIPO_USO_LABELS[p.tipo_uso]}</Badge>}
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
          listasPrecios={listasPrecios}
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
            <p className="text-lg font-semibold">
              {stockEspacios.length > 0
                ? stockEspacios.reduce((sum, s) => sum + s.cantidad, 0)
                : (p.stock_simple ?? '-')}
            </p>
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
          <TabsTrigger value="stock">Stock ({stockEspacios.length})</TabsTrigger>
          <TabsTrigger value="precios">Precios ({precios.length})</TabsTrigger>
          <TabsTrigger value="imagenes">Imagenes ({imagenes.length})</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores ({proveedores.length})</TabsTrigger>
          <TabsTrigger value="responsables">Responsables ({responsables.length})</TabsTrigger>
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

        <TabsContent value="stock" className="pt-4">
          <div className="space-y-3">
            <MovimientoStockFormDialog
              productoId={p.id}
              variantes={variantes}
              espacios={espacios}
            />
            {stockEspacios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No hay stock registrado.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {stockEspacios.map((s) => (
                  <StockRow key={s.id} stock={s} />
                ))}
              </div>
            )}
            {movimientos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Ultimos movimientos</h3>
                <div className="border rounded-lg divide-y text-sm">
                  {movimientos.slice(0, 10).map((m) => (
                    <div key={m.id} className="p-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-medium capitalize">{m.tipo}</span>
                        {m.espacio_origen_nombre && <span className="text-muted-foreground"> de {m.espacio_origen_nombre}</span>}
                        {m.espacio_destino_nombre && <span className="text-muted-foreground"> a {m.espacio_destino_nombre}</span>}
                        {m.motivo && <span className="text-muted-foreground"> · {m.motivo}</span>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold">{m.tipo === 'salida' ? '-' : '+'}{m.cantidad}</span>
                        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="precios" className="pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <PrecioFormDialog
                mode="create"
                productoId={p.id}
                listas={listasPrecios}
                variantes={variantes}
              />
              <p className="text-xs text-muted-foreground">
                Gestionar listas en{' '}
                <Link href="/admin/productos/listas-precios" className="underline">
                  Productos → Listas de Precios
                </Link>
              </p>
            </div>
            {precios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No hay precios asignados.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {precios.map((pr) => (
                  <PrecioRow key={pr.id} precio={pr} listas={listasPrecios} variantes={variantes} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="imagenes" className="pt-4">
          <GaleriaImagenes productoId={p.id} imagenes={imagenes} />
        </TabsContent>

        <TabsContent value="proveedores" className="pt-4">
          <div className="space-y-3">
            <ProveedorFormDialog
              productoId={p.id}
              entidades={entidades}
              personas={personasResp}
            />
            {proveedores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No hay proveedores asignados.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {proveedores.map((prov) => (
                  <ProveedorRow key={prov.id} proveedor={prov} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="responsables" className="pt-4">
          <div className="space-y-3">
            <ResponsableFormDialog
              productoId={p.id}
              personas={personasResp}
              atributos={atributosResp}
            />
            {responsables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>No hay responsables asignados.</p>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {responsables.map((resp) => (
                  <ResponsableRow key={resp.id} responsable={resp} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="info" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descripcion */}
            <div className="border rounded-lg p-4 space-y-3 text-sm md:col-span-2">
              <h3 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Descripcion</h3>
              {p.descripcion_corta && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Corta</p>
                  <p>{p.descripcion_corta}</p>
                </div>
              )}
              {p.descripcion_larga && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Larga</p>
                  <p className="whitespace-pre-wrap">{p.descripcion_larga}</p>
                </div>
              )}
              {!p.descripcion_corta && !p.descripcion_larga && (
                <p className="text-muted-foreground">Sin descripcion</p>
              )}
            </div>

            {/* Identificacion */}
            <div className="border rounded-lg p-4 space-y-3 text-sm">
              <h3 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Identificacion</h3>
              {p.ean13 && <InfoRow label="EAN-13" value={p.ean13} />}
              {p.ean14 && <InfoRow label="EAN-14" value={p.ean14} />}
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
              {p.unidad_medida_slug && <InfoRow label="Unidad de medida" value={p.unidad_medida_slug} />}
              <InfoRow label="Creado" value={new Date(p.created_at).toLocaleDateString('es-AR')} />
            </div>

            {/* Atributos fisicos */}
            <div className="border rounded-lg p-4 space-y-3 text-sm">
              <h3 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Atributos fisicos</h3>
              {p.material && <InfoRow label="Material" value={p.material} />}
              {p.color && <InfoRow label="Color" value={p.color} />}
              {p.medida_tamano && <InfoRow label="Medida / Tamano" value={p.medida_tamano} />}
              {p.peso_kg !== null && <InfoRow label="Peso" value={`${p.peso_kg} kg`} />}
              {!p.material && !p.color && !p.medida_tamano && p.peso_kg === null && (
                <p className="text-muted-foreground">Sin atributos fisicos</p>
              )}
            </div>

            {/* Logistica */}
            <div className="border rounded-lg p-4 space-y-3 text-sm md:col-span-2">
              <h3 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Logistica</h3>
              <div className="grid grid-cols-2 gap-3">
                {p.origen_pais && <InfoRow label="Origen" value={p.origen_pais} />}
                {p.cantidad_por_bulto !== null && <InfoRow label="Cantidad por bulto" value={String(p.cantidad_por_bulto)} />}
              </div>
              {!p.origen_pais && p.cantidad_por_bulto === null && (
                <p className="text-muted-foreground">Sin datos logisticos</p>
              )}
            </div>

            {/* Contabilidad */}
            <div className="border rounded-lg p-4 space-y-3 text-sm md:col-span-2">
              <h3 className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Contabilidad</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoRow label="Moneda" value={p.moneda} />
                <InfoRow label="IVA compra" value={p.iva_compra !== null ? `${p.iva_compra}%` : '-'} />
                <InfoRow label="IVA venta" value={p.iva_venta !== null ? `${p.iva_venta}%` : '-'} />
                {p.precio_compra !== null && <InfoRow label="Precio compra" value={`$${p.precio_compra.toLocaleString('es-AR')}`} />}
              </div>
              <div className="flex gap-4">
                {p.es_arancelado && <Badge variant="secondary">Arancelado</Badge>}
                {p.es_comprable && <Badge variant="secondary">Comprable</Badge>}
                {!p.es_arancelado && !p.es_comprable && (
                  <span className="text-muted-foreground">Sin flags contables</span>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p>{value}</p>
    </div>
  )
}
