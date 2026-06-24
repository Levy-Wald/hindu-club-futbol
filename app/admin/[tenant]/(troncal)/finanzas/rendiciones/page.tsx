import { fetchRendiciones, fetchCentrosCosto } from './_lib/queries'
import { RendicionesTable } from './_components/rendiciones-table'
import { CrearRendicionDialog } from './_components/crear-rendicion-dialog'

export default async function RendicionesPage() {
  const [rendiciones, centros] = await Promise.all([fetchRendiciones(), fetchCentrosCosto()])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Rendición de gastos</h1>
          <p className="text-sm text-muted-foreground">
            Rendiciones: borrador → presentada → aprobada → liquidada.
          </p>
        </div>
        <CrearRendicionDialog centros={centros} />
      </div>

      <RendicionesTable rendiciones={rendiciones} />
    </div>
  )
}
