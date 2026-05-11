import { listarConcesionarios } from './_actions'
import { ClientOnly } from '@/components/client-only'
import { ConcesionesListClient } from './_components/concesiones-list-client'

export default async function ConcesionesPage() {
  const concesionarios = await listarConcesionarios()
  return <ClientOnly><ConcesionesListClient concesionarios={concesionarios} /></ClientOnly>
}
