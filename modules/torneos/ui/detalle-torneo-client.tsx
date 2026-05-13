'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  TorneoHidratado,
  Categoria,
  EquipoInscripto,
  Federacion,
  NivelCompetencia,
  EquipoPropio,
} from '../lib/types'
import { BadgeEstadoTorneo } from './badge-estado-torneo'
import { TabDatosGenerales } from './tab-datos-generales'
import { TabCategorias } from './tab-categorias'
import { TabEquiposInscriptos } from './tab-equipos-inscriptos'

export function DetalleTorneoClient({
  torneo,
  categorias,
  equipos,
  federaciones,
  niveles,
  equiposPropios,
  puedeAdmin,
}: {
  torneo: TorneoHidratado
  categorias: Categoria[]
  equipos: EquipoInscripto[]
  federaciones: Federacion[]
  niveles: NivelCompetencia[]
  equiposPropios: EquipoPropio[]
  puedeAdmin: boolean
}) {
  const [tab, setTab] = useState('datos')

  return (
    <div data-testid="pantalla-detalle-torneo">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/competencias/torneos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{torneo.nombre}</h1>
            <BadgeEstadoTorneo estado={torneo.estado} />
            {puedeAdmin && (
              <>
                <Link href={`/admin/competencias/torneos/${torneo.id}/fixture`}>
                  <Button variant="outline" size="sm" data-testid="btn-generar-fixture">
                    <Calendar className="h-4 w-4 mr-2" />
                    Generar fixture
                  </Button>
                </Link>
                <Link href={`/admin/competencias/torneos/${torneo.id}/import`}>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {torneo.tipo === 'externo' ? 'Externo' : 'Interno'}
            {torneo.federacion_nombre && ` — ${torneo.federacion_nombre}`}
            {torneo.temporada && ` — ${torneo.temporada}`}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="datos" data-testid="tab-datos">
            Datos generales
          </TabsTrigger>
          <TabsTrigger value="categorias" data-testid="tab-categorias">
            Categorias ({categorias.length})
          </TabsTrigger>
          <TabsTrigger value="equipos" data-testid="tab-equipos">
            Equipos ({equipos.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datos">
          <TabDatosGenerales
            torneo={torneo}
            federaciones={federaciones}
            niveles={niveles}
            puedeAdmin={puedeAdmin}
          />
        </TabsContent>
        <TabsContent value="categorias">
          <TabCategorias
            torneo={torneo}
            categorias={categorias}
            puedeAdmin={puedeAdmin}
          />
        </TabsContent>
        <TabsContent value="equipos">
          <TabEquiposInscriptos
            torneo={torneo}
            categorias={categorias}
            equipos={equipos}
            equiposPropios={equiposPropios}
            puedeAdmin={puedeAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
