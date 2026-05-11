import { listarConcesionarios } from './_actions'
import { ConcesionesListClient } from './_components/concesiones-list-client'

export default async function ConcesionesPage() {
  const concesionarios = await listarConcesionarios()
  return <ConcesionesListClient concesionarios={concesionarios} />
}
