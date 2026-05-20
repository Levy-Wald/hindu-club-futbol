import { TENANT_ID } from '@/lib/tenant'
import { listarMarcas } from '@/modules/pim/lib/queries'
import { MarcaFormDialog } from '@/modules/pim/ui/marca-form'
import { MarcaRow } from '@/modules/pim/ui/marca-row'

export default async function MarcasPage() {
  const marcas = await listarMarcas(TENANT_ID)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Marcas</h1>
        <MarcaFormDialog mode="create" />
      </div>

      {marcas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <p>No hay marcas creadas.</p>
          <p className="text-sm mt-1">Usa el boton &quot;Nueva marca&quot; para agregar una.</p>
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {marcas.map((m) => (
            <MarcaRow key={m.id} marca={m} />
          ))}
        </div>
      )}
    </div>
  )
}
