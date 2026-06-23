import { Suspense } from 'react'
import { fetchProveedores } from './_lib/queries'
import { ProveedoresTable } from './_components/proveedores-table'
import { ProveedoresSearch } from './_components/proveedores-search'
import { CrearProveedorDialog } from './_components/crear-proveedor-dialog'

interface Props {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ProveedoresPage({ searchParams }: Props) {
  const sp = await searchParams
  const search = sp.q
  const activo = sp.activo

  const proveedores = await fetchProveedores({ search, activo })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            Empresas que proveen productos o servicios al club, con cuenta corriente y catálogo asociado.
          </p>
        </div>
        <CrearProveedorDialog />
      </div>

      <Suspense>
        <ProveedoresSearch />
      </Suspense>

      <ProveedoresTable proveedores={proveedores} />
    </div>
  )
}
