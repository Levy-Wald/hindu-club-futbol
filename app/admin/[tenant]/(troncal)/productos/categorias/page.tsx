import { TENANT_ID } from '@/lib/tenant'
import { listarCategorias, listarCategoriasJerarquicas } from '@/modules/pim/lib/queries'
import { CategoriaTree } from '@/modules/pim/ui/categoria-tree'
import { CategoriaFormDialog } from '@/modules/pim/ui/categoria-form'

export default async function CategoriasPage() {
  const [tree, allCategorias] = await Promise.all([
    listarCategoriasJerarquicas(TENANT_ID),
    listarCategorias(TENANT_ID),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Categorias de productos</h1>
        <CategoriaFormDialog mode="create" categorias={allCategorias} />
      </div>

      <CategoriaTree tree={tree} allCategorias={allCategorias} />
    </div>
  )
}
