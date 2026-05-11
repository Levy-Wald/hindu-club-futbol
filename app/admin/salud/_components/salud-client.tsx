'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Loader2, Search, Activity, Stethoscope, HeartPulse, ShieldCheck,
  Phone, Car, AlertTriangle, Download, Lock,
} from 'lucide-react'
import type { PermisosSalud } from '@/lib/permisos/salud'
import { footerConfidencial } from '@/lib/exports/footer-confidencial'
import {
  fetchLesiones,
  fetchDatosMedicos,
  fetchObraSocial,
  fetchAutorizaciones,
  fetchContactosEmergencia,
  fetchVehiculos,
  fetchAlertas,
  fetchEquiposSalud,
} from '../_actions'

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

interface Equipo { id: string; nombre: string }

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------

export function SaludClient({ permisos }: { permisos: PermisosSalud }) {
  const [tab, setTab] = useState('lesiones')
  const [equipos, setEquipos] = useState<Equipo[]>([])

  useEffect(() => {
    fetchEquiposSalud().then(setEquipos)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salud</h1>
          <p className="text-sm text-muted-foreground">
            Vista global de datos sensibles de salud
          </p>
        </div>
        <Badge variant={permisos.nivel === 'completo' ? 'default' : 'secondary'}>
          <Lock className="h-3 w-3 mr-1" />
          Acceso {permisos.nivel}
        </Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {permisos.puede_ver_lesiones && (
            <TabsTrigger value="lesiones" className="gap-1">
              <Activity className="h-3.5 w-3.5" /> Lesiones
            </TabsTrigger>
          )}
          {permisos.puede_ver_datos_medicos && (
            <TabsTrigger value="datos-medicos" className="gap-1">
              <Stethoscope className="h-3.5 w-3.5" /> Datos Medicos
            </TabsTrigger>
          )}
          {permisos.puede_ver_obra_social && (
            <TabsTrigger value="obra-social" className="gap-1">
              <HeartPulse className="h-3.5 w-3.5" /> Obra Social
            </TabsTrigger>
          )}
          {permisos.puede_ver_autorizaciones && (
            <TabsTrigger value="autorizaciones" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Autorizaciones
            </TabsTrigger>
          )}
          {permisos.puede_ver_contactos && (
            <TabsTrigger value="contactos" className="gap-1">
              <Phone className="h-3.5 w-3.5" /> Contactos Emergencia
            </TabsTrigger>
          )}
          {permisos.puede_ver_vehiculos && (
            <TabsTrigger value="vehiculos" className="gap-1">
              <Car className="h-3.5 w-3.5" /> Vehiculos
            </TabsTrigger>
          )}
          {permisos.puede_ver_lesiones && (
            <TabsTrigger value="alertas" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Alertas
            </TabsTrigger>
          )}
        </TabsList>

        {permisos.puede_ver_lesiones && (
          <TabsContent value="lesiones">
            <TabLesiones equipos={equipos} puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
        {permisos.puede_ver_datos_medicos && (
          <TabsContent value="datos-medicos">
            <TabDatosMedicos puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
        {permisos.puede_ver_obra_social && (
          <TabsContent value="obra-social">
            <TabObraSocial puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
        {permisos.puede_ver_autorizaciones && (
          <TabsContent value="autorizaciones">
            <TabAutorizaciones puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
        {permisos.puede_ver_contactos && (
          <TabsContent value="contactos">
            <TabContactos puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
        {permisos.puede_ver_vehiculos && (
          <TabsContent value="vehiculos">
            <TabVehiculos puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
        {permisos.puede_ver_lesiones && (
          <TabsContent value="alertas">
            <TabAlertas puedeExportar={permisos.puede_exportar} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// -------------------------------------------------------------------
// Shared
// -------------------------------------------------------------------

function SearchBar({ value, onChange, placeholder }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder ?? 'Buscar...'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8"
      />
    </div>
  )
}

function ExportFooter({ puedeExportar, onExport }: { puedeExportar: boolean; onExport: () => void }) {
  if (!puedeExportar) return null
  return (
    <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
      <span>{footerConfidencial('Usuario', new Date().toLocaleDateString('es-AR'))}</span>
      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="h-3.5 w-3.5 mr-1" /> Exportar CSV
      </Button>
    </div>
  )
}

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {message}
    </div>
  )
}

// -------------------------------------------------------------------
// Tab: Lesiones
// -------------------------------------------------------------------

function TabLesiones({ equipos, puedeExportar }: { equipos: Equipo[]; puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [equipo, setEquipo] = useState('')
  const [estado, setEstado] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchLesiones({
      busqueda: busqueda || undefined,
      equipo: equipo || undefined,
      estado: estado || undefined,
    })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda, equipo, estado])

  useEffect(() => { cargar() }, [cargar])

  const estadoColor = (e: string) => {
    if (e === 'activa') return 'destructive'
    if (e === 'recuperacion') return 'secondary'
    return 'outline'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" /> Lesiones ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar persona o tipo..." />
          <Select value={equipo} onValueChange={(v) => setEquipo(v ?? '')}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {equipos.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={estado} onValueChange={(v) => setEstado(v ?? '')}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="recuperacion">Recuperacion</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay lesiones registradas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Tipo</th>
                  <th className="py-2 px-2 font-medium">Zona</th>
                  <th className="py-2 px-2 font-medium">Fecha</th>
                  <th className="py-2 px-2 font-medium">Estado</th>
                  <th className="py-2 px-2 font-medium">Equipo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">{r.tipo_lesion as string}</td>
                    <td className="py-2 px-2">{r.zona_cuerpo as string}</td>
                    <td className="py-2 px-2">{r.fecha_lesion as string}</td>
                    <td className="py-2 px-2">
                      <Badge variant={estadoColor(r.estado as string)}>{r.estado as string}</Badge>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{r.equipo_nombre as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('lesiones', ['Persona', 'Tipo', 'Zona', 'Fecha', 'Estado', 'Equipo'],
            data.map(r => [r.nombre_completo as string, r.tipo_lesion as string, r.zona_cuerpo as string, r.fecha_lesion as string, r.estado as string, r.equipo_nombre as string]))
        }} />
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Tab: Datos Medicos
// -------------------------------------------------------------------

function TabDatosMedicos({ puedeExportar }: { puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchDatosMedicos({
      busqueda: busqueda || undefined,
      grupo_sanguineo: grupo || undefined,
    })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda, grupo])

  useEffect(() => { cargar() }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5" /> Datos Medicos ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SearchBar value={busqueda} onChange={setBusqueda} />
          <Select value={grupo} onValueChange={(v) => setGrupo(v ?? '')}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {['A', 'B', 'AB', 'O'].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay datos medicos cargados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Grupo</th>
                  <th className="py-2 px-2 font-medium">RH</th>
                  <th className="py-2 px-2 font-medium">Alergias</th>
                  <th className="py-2 px-2 font-medium">Enf. Cronicas</th>
                  <th className="py-2 px-2 font-medium">Ult. Revision</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">{r.grupo_sanguineo as string || '-'}</td>
                    <td className="py-2 px-2">{r.factor_rh as string || '-'}</td>
                    <td className="py-2 px-2 max-w-[200px] truncate">
                      {((r.alergias_medicamentos as string[]) ?? []).join(', ') || '-'}
                    </td>
                    <td className="py-2 px-2 max-w-[200px] truncate">
                      {((r.enfermedades_cronicas as string[]) ?? []).join(', ') || '-'}
                    </td>
                    <td className="py-2 px-2">{r.fecha_ultima_revision_medica as string || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('datos_medicos', ['Persona', 'Grupo', 'RH', 'Alergias', 'Cronicas', 'Ult Revision'],
            data.map(r => [r.nombre_completo as string, r.grupo_sanguineo as string ?? '', r.factor_rh as string ?? '',
              ((r.alergias_medicamentos as string[]) ?? []).join('; '), ((r.enfermedades_cronicas as string[]) ?? []).join('; '),
              r.fecha_ultima_revision_medica as string ?? '']))
        }} />
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Tab: Obra Social
// -------------------------------------------------------------------

function TabObraSocial({ puedeExportar }: { puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchObraSocial({ busqueda: busqueda || undefined })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartPulse className="h-5 w-5" /> Obra Social ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchBar value={busqueda} onChange={setBusqueda} />

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay datos de obra social cargados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Obra Social</th>
                  <th className="py-2 px-2 font-medium">Nro. Afiliado</th>
                  <th className="py-2 px-2 font-medium">Plan</th>
                  <th className="py-2 px-2 font-medium">Vencimiento</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">{r.obra_social_slug as string}</td>
                    <td className="py-2 px-2">{r.numero_afiliado as string || '-'}</td>
                    <td className="py-2 px-2">{r.plan_obra_social as string || '-'}</td>
                    <td className="py-2 px-2">{r.fecha_vencimiento as string || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('obra_social', ['Persona', 'Obra Social', 'Nro Afiliado', 'Plan', 'Vencimiento'],
            data.map(r => [r.nombre_completo as string, r.obra_social_slug as string ?? '', r.numero_afiliado as string ?? '',
              r.plan_obra_social as string ?? '', r.fecha_vencimiento as string ?? '']))
        }} />
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Tab: Autorizaciones
// -------------------------------------------------------------------

function TabAutorizaciones({ puedeExportar }: { puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchAutorizaciones({
      busqueda: busqueda || undefined,
      estado: estado || undefined,
    })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda, estado])

  useEffect(() => { cargar() }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Autorizaciones ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SearchBar value={busqueda} onChange={setBusqueda} />
          <Select value={estado} onValueChange={(v) => setEstado(v ?? '')}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay autorizaciones registradas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Tipo</th>
                  <th className="py-2 px-2 font-medium">Estado</th>
                  <th className="py-2 px-2 font-medium">Vencimiento</th>
                  <th className="py-2 px-2 font-medium">Otorgado por</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">{r.tipo_autorizacion as string}</td>
                    <td className="py-2 px-2">
                      <Badge variant={r.estado === 'vigente' ? 'default' : r.estado === 'vencida' ? 'destructive' : 'secondary'}>
                        {r.estado as string}
                      </Badge>
                    </td>
                    <td className="py-2 px-2">{r.fecha_vencimiento as string || '-'}</td>
                    <td className="py-2 px-2 text-muted-foreground">{r.otorgado_por as string || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('autorizaciones', ['Persona', 'Tipo', 'Estado', 'Vencimiento', 'Otorgado por'],
            data.map(r => [r.nombre_completo as string, r.tipo_autorizacion as string ?? '', r.estado as string ?? '',
              r.fecha_vencimiento as string ?? '', r.otorgado_por as string ?? '']))
        }} />
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Tab: Contactos Emergencia
// -------------------------------------------------------------------

function TabContactos({ puedeExportar }: { puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchContactosEmergencia({ busqueda: busqueda || undefined })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Phone className="h-5 w-5" /> Contactos de Emergencia ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchBar value={busqueda} onChange={setBusqueda} />

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay contactos de emergencia cargados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Contacto</th>
                  <th className="py-2 px-2 font-medium">Parentesco</th>
                  <th className="py-2 px-2 font-medium">Telefono</th>
                  <th className="py-2 px-2 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">{r.contacto_nombre as string}</td>
                    <td className="py-2 px-2">{r.parentesco as string || '-'}</td>
                    <td className="py-2 px-2">{r.contacto_telefono as string || '-'}</td>
                    <td className="py-2 px-2 text-muted-foreground">{r.contacto_email as string || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('contactos_emergencia', ['Persona', 'Contacto', 'Parentesco', 'Telefono', 'Email'],
            data.map(r => [r.nombre_completo as string, r.contacto_nombre as string ?? '', r.parentesco as string ?? '',
              r.contacto_telefono as string ?? '', r.contacto_email as string ?? '']))
        }} />
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Tab: Vehiculos
// -------------------------------------------------------------------

function TabVehiculos({ puedeExportar }: { puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchVehiculos({ busqueda: busqueda || undefined })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda])

  useEffect(() => { cargar() }, [cargar])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Car className="h-5 w-5" /> Vehiculos ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar persona o patente..." />

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay vehiculos registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Tipo</th>
                  <th className="py-2 px-2 font-medium">Marca/Modelo</th>
                  <th className="py-2 px-2 font-medium">Patente</th>
                  <th className="py-2 px-2 font-medium">Acceso</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">{r.tipo_vehiculo as string || '-'}</td>
                    <td className="py-2 px-2">{r.marca as string} {r.modelo as string}</td>
                    <td className="py-2 px-2 font-mono">{r.patente as string}</td>
                    <td className="py-2 px-2">
                      <Badge variant={r.acceso_autorizado ? 'default' : 'secondary'}>
                        {r.acceso_autorizado ? 'Autorizado' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('vehiculos', ['Persona', 'Tipo', 'Marca', 'Modelo', 'Patente', 'Acceso'],
            data.map(r => [r.nombre_completo as string, r.tipo_vehiculo as string ?? '',
              r.marca as string ?? '', r.modelo as string ?? '', r.patente as string ?? '',
              r.acceso_autorizado ? 'Si' : 'No']))
        }} />
      </CardContent>
    </Card>
  )
}

// -------------------------------------------------------------------
// Tab: Alertas
// -------------------------------------------------------------------

function TabAlertas({ puedeExportar }: { puedeExportar: boolean }) {
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [tipoAlerta, setTipoAlerta] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const res = await fetchAlertas({
      busqueda: busqueda || undefined,
      tipo_alerta: tipoAlerta || undefined,
    })
    if (!res.ok) toast.error(res.error)
    setData(res.data)
    setLoading(false)
  }, [busqueda, tipoAlerta])

  useEffect(() => { cargar() }, [cargar])

  const severidadColor = (t: string) => {
    if (t === 'sin_apto_medico' || t === 'sin_datos_medicos') return 'destructive'
    if (t === 'sin_contacto_emergencia') return 'default'
    return 'secondary'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Alertas de Faltantes ({data.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <SearchBar value={busqueda} onChange={setBusqueda} />
          <Select value={tipoAlerta} onValueChange={(v) => setTipoAlerta(v ?? '')}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo alerta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              <SelectItem value="sin_apto_medico">Sin apto medico</SelectItem>
              <SelectItem value="sin_datos_medicos">Sin datos medicos</SelectItem>
              <SelectItem value="sin_contacto_emergencia">Sin contacto emergencia</SelectItem>
              <SelectItem value="sin_obra_social">Sin obra social</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : data.length === 0 ? (
          <EmptyState message="No hay alertas activas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-2 font-medium">Persona</th>
                  <th className="py-2 px-2 font-medium">Alerta</th>
                  <th className="py-2 px-2 font-medium">Equipo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2">{r.nombre_completo as string}</td>
                    <td className="py-2 px-2">
                      <Badge variant={severidadColor(r.tipo_alerta as string)}>
                        {(r.tipo_alerta as string).replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-muted-foreground">{r.equipo_nombre as string || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ExportFooter puedeExportar={puedeExportar} onExport={() => {
          exportCSV('alertas_salud', ['Persona', 'Alerta', 'Equipo'],
            data.map(r => [r.nombre_completo as string, r.tipo_alerta as string ?? '', r.equipo_nombre as string ?? '']))
        }} />
      </CardContent>
    </Card>
  )
}
