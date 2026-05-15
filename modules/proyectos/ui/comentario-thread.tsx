'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Send, Trash2, Loader2 } from 'lucide-react'
import { crearComentario, eliminarComentario } from '../lib/actions'
import type { Comentario } from '../lib/tipos'

interface Props {
  proyectoId: string
  tareaId?: string
  comentarios: Comentario[]
}

export function ComentarioThread({ proyectoId, tareaId, comentarios }: Props) {
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!texto.trim()) return
    setSending(true)
    const res = await crearComentario({
      proyecto_id: proyectoId,
      tarea_id: tareaId,
      texto: texto.trim(),
    })
    setSending(false)
    if (res.ok) {
      setTexto('')
    } else {
      toast.error(res.message)
    }
  }

  async function handleDelete(id: string) {
    const res = await eliminarComentario(id, proyectoId)
    if (!res.ok) toast.error(res.message)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comentarios.map(c => (
          <div key={c.id} className="flex gap-3 group">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
              {c.persona ? `${c.persona.nombre[0]}${c.persona.apellido[0]}` : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {c.persona ? `${c.persona.nombre} ${c.persona.apellido}` : 'Desconocido'}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.texto}</p>
            </div>
          </div>
        ))}
        {comentarios.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">Sin comentarios</p>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder="Escribir comentario..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={2}
          className="flex-1"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <Button size="icon" onClick={handleSend} disabled={!texto.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}
