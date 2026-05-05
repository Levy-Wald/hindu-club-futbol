import { fetchPadronesParaComparar, fetchPersonasConMembresías, fetchEquiposParaComparar } from './_lib/queries'
import { ComparadorUI } from './_components/comparador-ui'

export default async function CompararPadronesPage() {
  const [padrones, personas, equipos] = await Promise.all([
    fetchPadronesParaComparar(),
    fetchPersonasConMembresías(),
    fetchEquiposParaComparar(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Comparar padrones</h1>
        <p className="text-sm text-muted-foreground">
          Cruzá padrones entre sí, contra personas, equipos o entidades para encontrar diferencias.
        </p>
      </div>

      <ComparadorUI padrones={padrones} personas={personas} equipos={equipos} />
    </div>
  )
}
