import { TENANT_ID } from '@/lib/tenant'
import { listarProductos, listarCategorias, listarUnidadesMedida, listarMarcas } from '@/modules/pim/lib/queries'
import { ProductoFormDialog } from '@/modules/pim/ui/producto-form'
import { ProductoRow } from '@/modules/pim/ui/producto-row'
import { ProductosFilters } from './_components/productos-filters'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ProductosPage({ searchParams }: Props) {
  const sp = await searchParams
  const busqueda = sp.q
  const categoria_id = sp.categoria
  const marca_id = sp.marca
  const tipo = sp.tipo as 'producto' | 'servicio' | undefined

  const [productos, categorias, unidades, marcas] = await Promise.all([
    listarProductos(TENANT_ID, { busqueda, categoria_id, marca_id, tipo }),
    listarCategorias(TENANT_ID),
    listarUnidadesMedida(),
    listarMarcas(TENANT_ID),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Catalogo de productos</h1>
        <ProductoFormDialog
          mode="create"
          categorias={categorias}
          unidades={unidades}
          marcas={marcas}
        />
      </div>

      <ProductosFilters
        categorias={categorias}
        marcas={marcas}
        currentCategoria={categoria_id}
        currentMarca={marca_id}
        currentTipo={tipo}
        currentSearch={busqueda}
      />

      {productos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p>No hay productos.</p>
          <p className="text-sm mt-1">Usa el boton &quot;Nuevo producto&quot; para agregar uno.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {productos.map((p) => (
            <ProductoRow key={p.id} producto={p} />
          ))}
        </div>
      )}
    </div>
  )
}
