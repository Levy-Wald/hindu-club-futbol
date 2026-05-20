import { listarConcesionarios } from '@/modules/concesiones/lib/actions'
import { ClientOnly } from '@/components/client-only'
import { ConcesionesListClient } from '@/modules/concesiones/ui/components/concesiones-list-client'

export default async function ConcesionesPage() {
  const concesionarios = await listarConcesionarios()
  return <ClientOnly><ConcesionesListClient concesionarios={concesionarios} /></ClientOnly>
}
