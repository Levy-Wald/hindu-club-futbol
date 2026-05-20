import { fetchDefiniciones } from '@/modules/atributos-custom/lib/queries'
import { AtributosCustomConfig } from './_components/config-panel'

export default async function AtributosCustomPage() {
  const definiciones = await fetchDefiniciones()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atributos custom</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Definí campos personalizados para personas, entidades, productos o eventos.
        </p>
      </div>
      <AtributosCustomConfig definiciones={definiciones} />
    </div>
  )
}
