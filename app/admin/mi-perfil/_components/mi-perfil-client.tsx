'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Pencil, Lock, Send, Shield, Users, Car } from 'lucide-react'
import { editarMiPerfil } from '../_actions'
import { SolicitudCambioDialog } from './solicitud-cambio-dialog'

interface MiPerfilClientProps {
  persona: Record<string, unknown>
  equipos: Array<Record<string, unknown>>
  padrones: Array<Record<string, unknown>>
  vinculos: { origen: Array<Record<string, unknown>>; destino: Array<Record<string, unknown>> }
}

// Campos bloqueados después de tener ID asignado
const CAMPOS_BLOQUEADOS = ['numero_documento', 'cuil_cuit', 'nombre_completo_legal'] as const

function tieneDatosIdentidad(persona: Record<string, unknown>): boolean {
  return !!(persona.numero_documento || persona.cuil_cuit)
}

export function MiPerfilClient({ persona, equipos, padrones, vinculos }: MiPerfilClientProps) {
  const bloqueado = tieneDatosIdentidad(persona)
  const [editando, setEditando] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [campoSolicitud, setCampoSolicitud] = useState<{ campo: string; valorActual: string } | null>(null)

  const [form, setForm] = useState({
    nombre: (persona.nombre as string) || '',
    apellido: (persona.apellido as string) || '',
    email_principal: (persona.email_principal as string) || '',
    telefono_principal: (persona.telefono_principal as string) || '',
    whatsapp: (persona.whatsapp as string) || '',
    fecha_nacimiento: (persona.fecha_nacimiento as string) || '',
    genero: (persona.genero as string) || '',
    direccion_calle: (persona.direccion_calle as string) || '',
    direccion_numero: (persona.direccion_numero as string) || '',
    direccion_ciudad: (persona.direccion_ciudad as string) || '',
    direccion_provincia: (persona.direccion_provincia as string) || '',
  })

  function handleChange(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleGuardar() {
    startTransition(async () => {
      const result = await editarMiPerfil(form)
      if (result.ok) {
        toast.success(result.message)
        setEditando(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  function esBloqueado(campo: string): boolean {
    return bloqueado && (CAMPOS_BLOQUEADOS as readonly string[]).includes(campo)
  }

  return (
    <div className="space-y-6">
      {/* Datos personales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Datos personales</CardTitle>
          {!editando ? (
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditando(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleGuardar} disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoTexto
            label="Nombre"
            value={form.nombre}
            editando={editando}
            onChange={(v) => handleChange('nombre', v)}
          />
          <CampoTexto
            label="Apellido"
            value={form.apellido}
            editando={editando}
            onChange={(v) => handleChange('apellido', v)}
          />
          <CampoTexto
            label="Email"
            value={form.email_principal}
            editando={editando}
            onChange={(v) => handleChange('email_principal', v)}
          />
          <CampoTexto
            label="Teléfono"
            value={form.telefono_principal}
            editando={editando}
            onChange={(v) => handleChange('telefono_principal', v)}
          />
          <CampoTexto
            label="WhatsApp"
            value={form.whatsapp}
            editando={editando}
            onChange={(v) => handleChange('whatsapp', v)}
          />
          <CampoTexto
            label="Fecha nacimiento"
            value={form.fecha_nacimiento}
            editando={editando}
            type="date"
            onChange={(v) => handleChange('fecha_nacimiento', v)}
          />
          <CampoTexto
            label="Calle"
            value={form.direccion_calle}
            editando={editando}
            onChange={(v) => handleChange('direccion_calle', v)}
          />
          <CampoTexto
            label="Número"
            value={form.direccion_numero}
            editando={editando}
            onChange={(v) => handleChange('direccion_numero', v)}
          />
        </CardContent>
      </Card>

      {/* Datos de identidad (bloqueables) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Datos de identidad
            {bloqueado && <Badge variant="secondary" className="text-xs">Protegidos</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoBloqueado
            label="Documento"
            value={(persona.numero_documento as string) || '-'}
            bloqueado={bloqueado}
            onSolicitar={() => setCampoSolicitud({ campo: 'numero_documento', valorActual: (persona.numero_documento as string) || '' })}
          />
          <CampoBloqueado
            label="CUIL/CUIT"
            value={(persona.cuil_cuit as string) || '-'}
            bloqueado={bloqueado}
            onSolicitar={() => setCampoSolicitud({ campo: 'cuil_cuit', valorActual: (persona.cuil_cuit as string) || '' })}
          />
        </CardContent>
      </Card>

      {/* Equipos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Mis equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {equipos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No estás asignado a ningún equipo</p>
          ) : (
            <div className="space-y-2">
              {equipos.map((pe) => {
                const equipo = pe.equipo as Record<string, unknown> | null
                return (
                  <div key={pe.id as string} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <span className="font-medium text-sm">{equipo?.nombre as string || 'Equipo'}</span>
                      <span className="text-xs text-muted-foreground ml-2">{pe.rol_equipo_slug as string}</span>
                    </div>
                    {pe.dorsal ? <Badge variant="outline">#{pe.dorsal as number}</Badge> : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Padrones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mis membresías
          </CardTitle>
        </CardHeader>
        <CardContent>
          {padrones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin membresías activas</p>
          ) : (
            <div className="space-y-2">
              {padrones.map((pp) => {
                const padron = pp.padron as Record<string, unknown> | null
                return (
                  <div key={pp.id as string} className="flex items-center justify-between border rounded-md p-3">
                    <span className="font-medium text-sm">{padron?.nombre as string || 'Padrón'}</span>
                    {pp.numero_socio ? <Badge variant="secondary">N° {pp.numero_socio as string}</Badge> : null}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vínculos familiares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vínculos familiares</CardTitle>
        </CardHeader>
        <CardContent>
          {vinculos.origen.length === 0 && vinculos.destino.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin vínculos registrados</p>
          ) : (
            <div className="space-y-2">
              {vinculos.origen.map((v) => {
                const destino = v.destino as Record<string, unknown> | null
                return (
                  <div key={v.id as string} className="border rounded-md p-3 text-sm">
                    <span className="font-medium">{destino?.nombre as string} {destino?.apellido as string}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{v.tipo_vinculo_slug as string}</Badge>
                  </div>
                )
              })}
              {vinculos.destino.map((v) => {
                const origen = v.origen as Record<string, unknown> | null
                return (
                  <div key={v.id as string} className="border rounded-md p-3 text-sm">
                    <span className="font-medium">{origen?.nombre as string} {origen?.apellido as string}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{v.tipo_vinculo_slug as string}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para solicitud de cambio */}
      {campoSolicitud && (
        <SolicitudCambioDialog
          campo={campoSolicitud.campo}
          valorActual={campoSolicitud.valorActual}
          open={!!campoSolicitud}
          onClose={() => setCampoSolicitud(null)}
        />
      )}
    </div>
  )
}

// --- Componentes auxiliares ---

function CampoTexto({ label, value, editando, onChange, type = 'text' }: {
  label: string
  value: string
  editando: boolean
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editando ? (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      ) : (
        <p className="text-sm font-medium">{value || '-'}</p>
      )}
    </div>
  )
}

function CampoBloqueado({ label, value, bloqueado, onSolicitar }: {
  label: string
  value: string
  bloqueado: boolean
  onSolicitar: () => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium flex-1">{value}</p>
        {bloqueado && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSolicitar}>
            <Send className="h-3 w-3 mr-1" />
            Solicitar cambio
          </Button>
        )}
      </div>
    </div>
  )
}
