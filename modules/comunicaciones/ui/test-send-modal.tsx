'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Send } from 'lucide-react'
import { testSendPlantilla } from '@/modules/comunicaciones/lib/actions'

interface TestSendModalProps {
  plantillaId: string
  canal: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestSendModal({ plantillaId, canal, open, onOpenChange }: TestSendModalProps) {
  const [personaQuery, setPersonaQuery] = useState('')
  const [personaId, setPersonaId] = useState<string | null>(null)
  const [personas, setPersonas] = useState<Array<{ id: string; nombre: string; apellido: string }>>([])
  const [isPending, startTransition] = useTransition()
  const [searching, setSearching] = useState(false)

  async function handleSearch() {
    if (!personaQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/v1/personas?q=${encodeURIComponent(personaQuery.trim())}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        setPersonas(data.data ?? [])
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  function handleSend() {
    startTransition(async () => {
      const result = await testSendPlantilla(plantillaId, personaId ?? undefined)
      if (result.ok) {
        toast.success(result.message)
        onOpenChange(false)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Test send</DialogTitle>
          <DialogDescription>
            Envia una prueba de esta plantilla ({canal}). Se registra con metadata.test=true.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Buscar persona destinataria (opcional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre o apellido..."
                value={personaQuery}
                onChange={(e) => setPersonaQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" size="sm" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
          </div>
          {personas.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {personas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    personaId === p.id
                      ? 'bg-brand-100 dark:bg-brand-900 font-medium'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setPersonaId(p.id)}
                >
                  {p.nombre} {p.apellido}
                </button>
              ))}
            </div>
          )}
          {personaId && (
            <p className="text-xs text-muted-foreground">
              Enviando a: {personas.find(p => p.id === personaId)?.nombre} {personas.find(p => p.id === personaId)?.apellido}
            </p>
          )}
          {!personaId && (
            <p className="text-xs text-muted-foreground">
              Sin persona seleccionada: se enviara al usuario actual.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar prueba
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
