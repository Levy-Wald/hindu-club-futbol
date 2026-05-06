import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText } from 'lucide-react'
import { fetchContratos } from '@/app/admin/rrhh/_lib/queries'
import { ContratosFilters } from './_components/contratos-filters'
import { NuevoContratoDialog } from './_components/nuevo-contrato-dialog'
import { ContratoRowActions } from './_components/contrato-row-actions'

function formatMoney(amount: number | null, currency = 'ARS') {
  if (amount == null) return '-'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(amount)
}

function formatFecha(iso: string | null): string {
  if (!iso) return 'Indefinido'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function modalidadLabel(modalidad: string): string {
  switch (modalidad) {
    case 'relacion_dependencia':
      return 'Rel. dependencia'
    case 'monotributo':
      return 'Monotributo'
    case 'honorarios':
      return 'Honorarios'
    case 'informal':
      return 'Informal'
    case 'pasantia':
      return 'Pasantia'
    case 'voluntariado':
      return 'Voluntariado'
    default:
      return modalidad
  }
}

function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'vigente':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'vencido':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'rescindido':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'suspendido':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    default:
      return ''
  }
}

function estadoLabel(estado: string): string {
  switch (estado) {
    case 'vigente':
      return 'Vigente'
    case 'vencido':
      return 'Vencido'
    case 'rescindido':
      return 'Rescindido'
    case 'suspendido':
      return 'Suspendido'
    default:
      return estado
  }
}

function frecuenciaLabel(frecuencia: string): string {
  switch (frecuencia) {
    case 'mensual':
      return 'Mensual'
    case 'quincenal':
      return 'Quincenal'
    case 'semanal':
      return 'Semanal'
    case 'por_hora':
      return 'Por hora'
    case 'por_evento':
      return 'Por evento'
    default:
      return frecuencia
  }
}

interface PageProps {
  searchParams: Promise<{
    modalidad?: string
    estado?: string
    q?: string
  }>
}

export default async function ContratosPage({ searchParams }: PageProps) {
  const filters = await searchParams

  const contratos = await fetchContratos({
    modalidad: filters.modalidad,
    estado: filters.estado,
    search: filters.q,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Contratos</h1>
        <NuevoContratoDialog />
      </div>

      {/* Filtros */}
      <ContratosFilters />

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {contratos.length} contrato{contratos.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {contratos.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron contratos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Persona</TableHead>
                    <TableHead>Modalidad</TableHead>
                    <TableHead>Frecuencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha inicio</TableHead>
                    <TableHead>Fecha fin</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratos.map((contrato) => {
                    const personaRaw = contrato.persona as unknown
                    const persona = (Array.isArray(personaRaw) ? personaRaw[0] : personaRaw) as {
                      id: string
                      nombre: string
                      apellido: string
                      numero_documento: string
                      foto_perfil_url: string | null
                    } | null

                    return (
                      <TableRow key={contrato.id}>
                        <TableCell>
                          {persona ? (
                            <Link
                              href={`/admin/personas/${persona.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {persona.apellido}, {persona.nombre}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {modalidadLabel(contrato.modalidad)}
                          </Badge>
                        </TableCell>
                        <TableCell>{frecuenciaLabel(contrato.frecuencia)}</TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatMoney(contrato.monto, contrato.moneda)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={estadoBadgeClass(contrato.estado)}>
                            {estadoLabel(contrato.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFecha(contrato.fecha_inicio)}</TableCell>
                        <TableCell>{formatFecha(contrato.fecha_fin)}</TableCell>
                        <TableCell>
                          <ContratoRowActions
                            contratoId={contrato.id}
                            estado={contrato.estado}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
