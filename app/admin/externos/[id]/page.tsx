import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, Building2, Info, Users } from 'lucide-react'
import {
  fetchEntidadDetalle,
  fetchEntidadRepresentantes,
  fetchEntidadesHijas,
  fetchEntidadesForSelect,
} from '../_lib/queries'
import { EntidadInfo } from './_components/entidad-info'
import { EntidadRepresentantes } from './_components/entidad-representantes'
import { EntidadHijas } from './_components/entidad-hijas'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EntidadDetallePage({ params }: PageProps) {
  const { id } = await params

  let entidad, representantes, hijas, todasEntidades
  try {
    ;[entidad, representantes, hijas, todasEntidades] = await Promise.all([
      fetchEntidadDetalle(id),
      fetchEntidadRepresentantes(id),
      fetchEntidadesHijas(id),
      fetchEntidadesForSelect(),
    ])
  } catch {
    notFound()
  }

  const entidadPadre = entidad.entidad_padre as { id: string; nombre: string; tipo: string } | null

  // Excluir la entidad actual del select de padre
  const entidadesParaSelect = todasEntidades.filter((e) => e.id !== id)

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sm:border-b-0 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-start gap-3">
          <Link href="/admin/externos">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{entidad.nombre}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline">{entidad.tipo}</Badge>
              {entidadPadre && (
                <span className="text-sm text-muted-foreground">
                  Parte de{' '}
                  <Link href={`/admin/externos/${entidadPadre.id}`} className="hover:underline font-medium">
                    {entidadPadre.nombre}
                  </Link>
                </span>
              )}
            </div>
          </div>
          <Badge variant={entidad.activo ? 'default' : 'secondary'}>
            {entidad.activo ? 'activo' : 'inactivo'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="info">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="representantes">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Representantes</span>
          </TabsTrigger>
          <TabsTrigger value="hijas">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Entidades hijas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="pt-4">
            <EntidadInfo
              entidad={{
                id: entidad.id,
                tipo: entidad.tipo,
                nombre: entidad.nombre,
                telefono: entidad.telefono,
                email: entidad.email,
                sitio_web: entidad.sitio_web,
                cuit: entidad.cuit,
                razon_social: entidad.razon_social,
                direccion: entidad.direccion as {
                  calle?: string
                  numero?: string
                  ciudad?: string
                  provincia?: string
                  codigo_postal?: string
                  pais?: string
                } | null,
                entidad_padre_id: entidad.entidad_padre_id,
              }}
              entidadesParaSelect={entidadesParaSelect}
            />
          </div>
        </TabsContent>

        <TabsContent value="representantes">
          <div className="pt-4">
            <EntidadRepresentantes
              entidadId={entidad.id}
              representantes={representantes.map((r) => ({
                id: r.id,
                rol: r.rol,
                rol_custom: r.rol_custom,
                fecha_inicio: r.fecha_inicio,
                activo: r.activo,
                persona: r.persona as unknown as {
                  id: string
                  nombre: string
                  apellido: string
                  email_principal: string | null
                  telefono_principal: string | null
                },
              }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="hijas">
          <div className="pt-4">
            <EntidadHijas hijas={hijas} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
