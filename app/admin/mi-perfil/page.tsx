import { redirect } from 'next/navigation'
import { fetchMiPersona, fetchMisEquipos, fetchMisPadrones, fetchMisVinculos } from './_lib/queries'
import { MiPerfilClient } from './_components/mi-perfil-client'

export default async function MiPerfilPage() {
  const persona = await fetchMiPersona()

  if (!persona) {
    redirect('/login')
  }

  const [equipos, padrones, vinculos] = await Promise.all([
    fetchMisEquipos(persona.id),
    fetchMisPadrones(persona.id),
    fetchMisVinculos(persona.id),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="text-sm text-muted-foreground">Tus datos personales y membresías</p>
      </div>
      <MiPerfilClient
        persona={persona}
        equipos={equipos}
        padrones={padrones}
        vinculos={vinculos}
      />
    </div>
  )
}
