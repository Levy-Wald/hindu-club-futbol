import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { fetchProyectos } from '@/modules/proyectos/lib/queries'
import { ProyectoCard } from '@/modules/proyectos/ui/proyecto-card'

interface PageProps {
  searchParams: Promise<{ estado?: string; busqueda?: string }>
}

export default async function ProyectosPage({ searchParams }: PageProps) {
  const { estado, busqueda } = await searchParams
  const proyectos = await fetchProyectos({ estado, busqueda })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Proyectos</h1>
        <Link href="/admin/proyectos/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Nuevo proyecto
          </Button>
        </Link>
      </div>

      {proyectos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Sin proyectos.</p>
          <Link href="/admin/proyectos/nuevo">
            <Button variant="outline" className="mt-4">Crear primer proyecto</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectos.map(p => (
            <ProyectoCard key={p.id} proyecto={p} />
          ))}
        </div>
      )}
    </div>
  )
}
