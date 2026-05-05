'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, X, Search } from 'lucide-react'
import { asignarRepresentante, quitarRepresentante } from '../../_actions'
import { createClient } from '@/lib/supabase/client'

const ROLES_REPRESENTANTE = [
  { value: 'presidente', label: 'Presidente' },
  { value: 'vicepresidente', label: 'Vicepresidente' },
  { value: 'secretario', label: 'Secretario' },
  { value: 'tesorero', label: 'Tesorero' },
  { value: 'vocal', label: 'Vocal' },
  { value: 'contacto', label: 'Contacto' },
  { value: 'delegado', label: 'Delegado' },
  { value: 'otro', label: 'Otro' },
]

interface PersonaRef {
  id: string
  nombre: string
  apellido: string
  email_principal: string | null
  telefono_principal: string | null
}

interface Representante {
  id: string
  rol: string
  rol_custom: string | null
  fecha_inicio: string | null
  activo: boolean
  persona: PersonaRef
}

interface EntidadRepresentantesProps {
  entidadId: string
  representantes: Representante[]
}

export function EntidadRepresentantes({ entidadId, representantes }: EntidadRepresentantesProps) {
  const [rol, setRol] = useState('contacto')
  const [rolCustom, setRolCustom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PersonaRef[]>([])
  const [selectedPersona, setSelectedPersona] = useState<PersonaRef | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from('personas')
        .select('id, nombre, apellido, email_principal, telefono_principal')
        .is('deleted_at', null)
        .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,numero_documento.ilike.%${searchQuery}%`)
        .limit(10)
      setSearchResults(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  async function handleAsignar() {
    if (!selectedPersona) return
    if (rol === 'otro' && !rolCustom.trim()) {
      toast.error('Especifica el nombre del rol')
      return
    }
    setLoading(true)
    const result = await asignarRepresentante({
      entidad_id: entidadId,
      persona_id: selectedPersona.id,
      rol,
      rol_custom: rol === 'otro' ? rolCustom : undefined,
    })
    setLoading(false)
    if (result.ok) {
      toast.success(result.message)
      setSelectedPersona(null)
      setSearchQuery('')
      setRol('contacto')
      setRolCustom('')
    } else {
      toast.error(result.message)
    }
  }

  async function handleQuitar(representanteId: string) {
    const result = await quitarRepresentante(representanteId, entidadId)
    if (result.ok) toast.success(result.message)
    else toast.error(result.message)
  }

  function getRolLabel(r: Representante): string {
    if (r.rol === 'otro' && r.rol_custom) return r.rol_custom
    return ROLES_REPRESENTANTE.find((x) => x.value === r.rol)?.label ?? r.rol
  }

  return (
    <div className="space-y-4">
      {/* Agregar representante */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agregar representante</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={rol} onValueChange={(v) => setRol(v ?? 'contacto')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_REPRESENTANTE.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {rol === 'otro' && (
                <Input
                  placeholder="Nombre del rol..."
                  value={rolCustom}
                  onChange={(e) => setRolCustom(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Persona</Label>
              {selectedPersona ? (
                <div className="flex items-center gap-2 border rounded-md px-3 py-2 text-sm">
                  <span className="flex-1">
                    {selectedPersona.apellido}, {selectedPersona.nombre}
                  </span>
                  <button onClick={() => { setSelectedPersona(null); setSearchQuery('') }}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar persona..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => { setSelectedPersona(p); setSearchResults([]) }}
                        >
                          {p.apellido}, {p.nombre}
                          {p.email_principal && (
                            <span className="text-xs text-muted-foreground ml-2">{p.email_principal}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleAsignar} disabled={!selectedPersona || loading}>
            <Plus className="mr-1 h-4 w-4" />
            Agregar representante
          </Button>
        </CardContent>
      </Card>

      {/* Lista de representantes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Representantes activos ({representantes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {representantes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin representantes registrados.</p>
          ) : (
            <div className="space-y-2">
              {representantes.map((r) => (
                <div key={r.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline">{getRolLabel(r)}</Badge>
                    <Link
                      href={`/admin/personas/${r.persona.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {r.persona.apellido}, {r.persona.nombre}
                    </Link>
                    {r.persona.email_principal && (
                      <span className="text-xs text-muted-foreground">{r.persona.email_principal}</span>
                    )}
                    {r.persona.telefono_principal && (
                      <span className="text-xs text-muted-foreground">{r.persona.telefono_principal}</span>
                    )}
                    {r.fecha_inicio && (
                      <span className="text-xs text-muted-foreground">
                        Desde {new Date(r.fecha_inicio).toLocaleDateString('es-AR')}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleQuitar(r.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
