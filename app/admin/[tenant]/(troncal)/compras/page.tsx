import {
  fetchSolicitudes,
  fetchOrdenesCompra,
  fetchProveedoresSelect,
  fetchProductosSelect,
} from './_lib/queries'
import { ComprasView } from './_components/compras-view'

export default async function ComprasPage() {
  const [solicitudes, ordenes, proveedores, productos] = await Promise.all([
    fetchSolicitudes(),
    fetchOrdenesCompra(),
    fetchProveedoresSelect(),
    fetchProductosSelect(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Compras</h1>
        <p className="text-sm text-muted-foreground">
          Ciclo de compras: solicitud → orden de compra → recepción → factura.
        </p>
      </div>

      <ComprasView solicitudes={solicitudes} ordenes={ordenes} proveedores={proveedores} productos={productos} />
    </div>
  )
}
