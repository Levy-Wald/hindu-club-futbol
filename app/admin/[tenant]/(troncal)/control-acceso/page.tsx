import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldCheck } from 'lucide-react'

export default function ControlAccesoPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Control de Acceso</h1>
          <p className="text-sm text-muted-foreground">Validar entrada a eventos</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
        <p className="text-sm font-medium text-amber-800">Proximamente</p>
        <p className="text-sm text-amber-700">
          Esta funcionalidad estara disponible despues de completar Fase A.
          Los formularios estan visibles como referencia de la estructura final.
        </p>
      </div>

      {/* Skeleton form — all disabled */}
      <div className="max-w-lg space-y-4 opacity-50 cursor-not-allowed">
        <div className="space-y-2">
          <Label>Evento</Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar evento..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">Evento de ejemplo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Documento (DNI / CI)</Label>
          <Input disabled placeholder="Ej: 12345678" />
        </div>

        <div className="space-y-2">
          <Label>Codigo de acceso</Label>
          <Input disabled placeholder="Ej: ABC123" />
        </div>

        <div className="space-y-2">
          <Label>Tipo de acceso</Label>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Invitado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invitado">Invitado</SelectItem>
              <SelectItem value="visitante">Visitante</SelectItem>
              <SelectItem value="padre">Padre / Tutor</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button disabled className="w-full cursor-not-allowed">
          Registrar asistencia
        </Button>

        <div className="flex justify-center pt-2">
          <Badge variant="outline" className="text-xs">Disponible post-Fase A</Badge>
        </div>
      </div>
    </div>
  )
}
