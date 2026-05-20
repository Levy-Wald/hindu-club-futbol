'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { solicitarIngresoEquipo } from '../../mi-perfil/_actions'

interface SinEquipoProps {
  equipos: Array<{ id: string; nombre: string; disciplina_slug: string | null }>
  titulo?: string
}

export function SinEquipo({ equipos, titulo }: SinEquipoProps) {
  const [equipoId, setEquipoId] = useState('')
  const [rol, setRol] = useState('jugador')
  const [mensaje, setMensaje] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSolicitar() {
    if (!equipoId) {
      toast.error('Seleccioná un equipo')
      return
    }
    startTransition(async () => {
      const result = await solicitarIngresoEquipo(equipoId, rol, mensaje)
      if (result.ok) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {titulo || 'Solicitar ingreso a un equipo'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Equipo</Label>
          <Select value={equipoId} onValueChange={(v) => setEquipoId(v ?? '')}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un equipo" />
            </SelectTrigger>
            <SelectContent>
              {equipos.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombre} {e.disciplina_slug ? `(${e.disciplina_slug})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Rol</Label>
          <Select value={rol} onValueChange={(v) => setRol(v ?? 'jugador')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jugador">Jugador</SelectItem>
              <SelectItem value="arquero">Arquero</SelectItem>
              <SelectItem value="dt">Director Técnico</SelectItem>
              <SelectItem value="preparador_fisico">Preparador Físico</SelectItem>
              <SelectItem value="kinesiologo">Kinesiólogo</SelectItem>
              <SelectItem value="delegado">Delegado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Mensaje (opcional)</Label>
          <Textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Comentario adicional para el admin..."
            rows={3}
          />
        </div>
        <Button onClick={handleSolicitar} disabled={isPending} className="w-full">
          {isPending ? 'Enviando...' : 'Enviar solicitud de ingreso'}
        </Button>
      </CardContent>
    </Card>
  )
}
