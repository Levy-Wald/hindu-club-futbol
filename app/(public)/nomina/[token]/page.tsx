import { obtenerInfoPublicaPorToken } from '@/modules/nominas_externas/lib/queries'
import { FormPublico } from '@/modules/nominas_externas/ui/publico/form-publico'
import { ErrorToken } from '@/modules/nominas_externas/ui/publico/error-token'

type Props = { params: Promise<{ token: string }> }

export default async function NominaPublicaPage({ params }: Props) {
  const { token } = await params
  const info = await obtenerInfoPublicaPorToken(token)

  if (!info) {
    return <ErrorToken />
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <FormPublico token={token} info={info} />
    </div>
  )
}
