import { fetchEventosSemana, fetchEquiposActivos } from './_lib/queries'
import { SemanaOperaciones } from './_components/semana-operaciones'

/** Devuelve el lunes de la semana actual en formato yyyy-mm-dd */
function getLunesActual(): string {
  const now = new Date()
  const day = now.getDay() // 0=dom, 1=lun
  const diff = day === 0 ? -6 : 1 - day
  const lunes = new Date(now)
  lunes.setDate(now.getDate() + diff)
  lunes.setHours(0, 0, 0, 0)
  return lunes.toISOString().slice(0, 10)
}

function addDaysISO(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default async function OperacionesPage() {
  const lunesISO = getLunesActual()
  const domingoISO = addDaysISO(lunesISO, 6)

  const [eventos, equipos] = await Promise.all([
    fetchEventosSemana(lunesISO, domingoISO),
    fetchEquiposActivos(),
  ])

  return (
    <SemanaOperaciones
      eventosIniciales={eventos}
      equipos={equipos}
      lunesInicialISO={lunesISO}
    />
  )
}
