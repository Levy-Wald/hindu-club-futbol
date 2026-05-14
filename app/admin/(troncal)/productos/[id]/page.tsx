import { notFound } from 'next/navigation'
import { TENANT_ID } from '@/lib/tenant'
import {
  productoPorId,
  listarVariantes,
  listarCategorias,
  listarUnidadesMedida,
  listarMarcas,
  imagenesDeProducto,
} from '@/modules/pim/lib/queries'
import { ProductoDetalle } from './_components/producto-detalle'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductoDetailPage({ params }: Props) {
  const { id } = await params

  const [producto, variantes, categorias, unidades, marcas, imagenes] = await Promise.all([
    productoPorId(TENANT_ID, id),
    listarVariantes(id),
    listarCategorias(TENANT_ID),
    listarUnidadesMedida(),
    listarMarcas(TENANT_ID),
    imagenesDeProducto(id),
  ])

  if (!producto) notFound()

  return (
    <ProductoDetalle
      producto={producto}
      variantes={variantes}
      categorias={categorias}
      unidades={unidades}
      marcas={marcas}
      imagenes={imagenes}
    />
  )
}
