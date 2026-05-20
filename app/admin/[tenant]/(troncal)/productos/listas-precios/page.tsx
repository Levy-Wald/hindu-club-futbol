import { TENANT_ID } from '@/lib/tenant'
import { listarListasPrecios } from '@/modules/pim/lib/queries'
import { ListasPreciosPageClient } from './_components/listas-precios-page-client'

export default async function ListasPreciosPage() {
  const listas = await listarListasPrecios(TENANT_ID)

  return <ListasPreciosPageClient listas={listas} />
}
