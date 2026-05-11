'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Star, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Disciplina {
  id: string
  disciplina_slug: string
  disciplina_nombre: string
  es_principal: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  años_practica: number | null
  nivel_competencia_slug: string | null
  nivel_competencia_nombre: string | null
}

interface Props {
  personaId: string
  tenantId: string
}

const DEPORTES = [
  { value: 'hockey', label: 'Hockey' }, { value: 'rugby', label: 'Rugby' },
  { value: 'futbol', label: 'Fútbol' }, { value: 'tenis', label: 'Tenis' },
  { value: 'padel', label: 'Pádel' }, { value: 'natacion', label: 'Natación' },
  { value: 'golf', label: 'Golf' }, { value: 'squash', label: 'Squash' },
  { value: 'voley', label: 'Vóley' }, { value: 'basket', label: 'Básquet' },
  { value: 'atletismo', label: 'Atletismo' }, { value: 'polo', label: 'Polo' },
  { value: 'cricket', label: 'Cricket' }, { value: 'softbol', label: 'Softbol' },
  { value: 'otro', label: 'Otro' },
]

export function SeccionDisciplinas({ personaId, tenantId }: Props) {
  const supabase = createClient()
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [newDisc, setNewDisc] = useState({ disciplina_slug: '', es_principal: false, años_practica: '', nivel: '' })

  async function fetchDisciplinas() {
    const { data } = await supabase
      .from('v_personas_disciplinas_vigentes')
      .select('id, disciplina_slug, disciplina_nombre, es_principal, fecha_inicio, fecha_fin, años_practica, nivel_competencia_slug, nivel_competencia_nombre')
      .eq('persona_id', personaId)
      .order('es_principal', { ascending: false })
    setDisciplinas((data ?? []) as unknown as Disciplina[])
  }

  useEffect(() => { fetchDisciplinas() }, [personaId])

  function handleAdd() {
    if (!newDisc.disciplina_slug) return
    startTransition(async () => {
      // If marking as principal, unset current principal
      if (newDisc.es_principal) {
        const current = disciplinas.find(d => d.es_principal)
        if (current) {
          await supabase.from('personas_disciplinas')
            .update({ es_principal: false, fecha_fin: new Date().toISOString().slice(0, 10) })
            .eq('id', current.id)
        }
      }
      const { error } = await supabase.from('personas_disciplinas').insert({
        tenant_id: tenantId,
        persona_id: personaId,
        disciplina_slug: newDisc.disciplina_slug,
        es_principal: newDisc.es_principal,
        años_practica: newDisc.años_practica ? Number(newDisc.años_practica) : null,
        nivel_competencia_slug: newDisc.nivel || null,
      })
      if (error) {
        toast.error(error.message.includes('uq_disciplina') ? 'Esta disciplina ya está asignada' : error.message)
        return
      }
      toast.success('Disciplina agregada')
      setOpen(false)
      setNewDisc({ disciplina_slug: '', es_principal: false, años_practica: '', nivel: '' })
      fetchDisciplinas()
    })
  }

  async function handleSetPrincipal(disc: Disciplina) {
    const current = disciplinas.find(d => d.es_principal)
    if (current) {
      await supabase.from('personas_disciplinas')
        .update({ es_principal: false })
        .eq('id', current.id)
    }
    await supabase.from('personas_disciplinas')
      .update({ es_principal: true })
      .eq('id', disc.id)
    toast.success(`${disc.disciplina_nombre} ahora es principal`)
    fetchDisciplinas()
  }

  async function handleRemove(disc: Disciplina) {
    await supabase.from('personas_disciplinas')
      .update({ activo: false, fecha_fin: new Date().toISOString().slice(0, 10) })
      .eq('id', disc.id)
    toast.success('Disciplina removida')
    fetchDisciplinas()
  }

  const principal = disciplinas.find(d => d.es_principal)
  const secundarias = disciplinas.filter(d => !d.es_principal)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Disciplinas deportivas</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar disciplina</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Disciplina</Label>
                <Select value={newDisc.disciplina_slug} onValueChange={(v) => setNewDisc(p => ({ ...p, disciplina_slug: v ?? '' }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {DEPORTES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Años de práctica</Label>
                  <Input type="number" min={0} max={60} value={newDisc.años_practica} onChange={e => setNewDisc(p => ({ ...p, años_practica: e.target.value }))} />
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Select value={newDisc.nivel} onValueChange={(v) => setNewDisc(p => ({ ...p, nivel: v ?? '' }))}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recreativo">Recreativo</SelectItem>
                      <SelectItem value="amateur">Amateur</SelectItem>
                      <SelectItem value="amateur_federado">Amateur federado</SelectItem>
                      <SelectItem value="semi_profesional">Semi profesional</SelectItem>
                      <SelectItem value="profesional">Profesional</SelectItem>
                      <SelectItem value="elite">Elite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newDisc.es_principal} onChange={e => setNewDisc(p => ({ ...p, es_principal: e.target.checked }))} />
                Marcar como disciplina principal
                {newDisc.es_principal && principal && (
                  <span className="text-warning-600 text-xs">(reemplaza a {principal.disciplina_nombre})</span>
                )}
              </label>
              <Button onClick={handleAdd} disabled={isPending} className="w-full">
                {isPending ? 'Guardando...' : 'Agregar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {disciplinas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin disciplinas asignadas</p>
        ) : (
          <div className="space-y-3">
            {principal && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-brand-500 fill-brand-500" />
                  <span className="font-medium">{principal.disciplina_nombre}</span>
                  <Badge variant="secondary" className="text-xs">Principal</Badge>
                  {principal.años_practica != null && (
                    <span className="text-sm text-muted-foreground">{principal.años_practica} años</span>
                  )}
                  {principal.nivel_competencia_nombre && (
                    <Badge variant="outline" className="text-xs">{principal.nivel_competencia_nombre}</Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(principal)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            {secundarias.map(d => (
              <div key={d.id} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{d.disciplina_nombre}</span>
                  {d.años_practica != null && (
                    <span className="text-xs text-muted-foreground">{d.años_practica} años</span>
                  )}
                  {d.nivel_competencia_nombre && (
                    <Badge variant="outline" className="text-xs">{d.nivel_competencia_nombre}</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Hacer principal" onClick={() => handleSetPrincipal(d)}>
                    <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(d)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
