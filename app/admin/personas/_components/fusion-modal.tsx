'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { obtenerDatosParaFusion, fusionarPersonas } from '../_actions'

// Campos visibles para comparar en la fusión
const MERGE_FIELDS: { key: string; label: string }[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'apellido', label: 'Apellido' },
  { key: 'numero_documento', label: 'DNI' },
  { key: 'tipo_documento', label: 'Tipo doc.' },
  { key: 'cuil_cuit', label: 'CUIL/CUIT' },
  { key: 'fecha_nacimiento', label: 'Fecha nac.' },
  { key: 'genero', label: 'Género' },
  { key: 'nacionalidad', label: 'Nacionalidad' },
  { key: 'email_principal', label: 'Email principal' },
  { key: 'email_secundario', label: 'Email secundario' },
  { key: 'telefono_principal', label: 'Teléfono' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'direccion_calle', label: 'Calle' },
  { key: 'direccion_numero', label: 'Número' },
  { key: 'direccion_ciudad', label: 'Ciudad' },
  { key: 'direccion_provincia', label: 'Provincia' },
  { key: 'deporte_principal_slug', label: 'Deporte principal' },
  { key: 'deportes_secundarios', label: 'Deportes sec.' },
  { key: 'fecha_primera_relacion_club', label: 'Fecha relación club' },
  { key: 'notas_internas', label: 'Notas' },
]

function displayVal(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—'
  return String(v)
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false
  if (Array.isArray(v)) return v.length > 0
  return true
}

interface Atributo {
  atributo_slug: string
  activo: boolean
}

interface FusionModalProps {
  idA: string
  idB: string
  onClose: () => void
  onComplete: () => void
}

export function FusionModal({ idA, idB, onClose, onComplete }: FusionModalProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [personaA, setPersonaA] = useState<Record<string, unknown> | null>(null)
  const [personaB, setPersonaB] = useState<Record<string, unknown> | null>(null)
  const [choices, setChoices] = useState<Record<string, 'A' | 'B'>>({})
  const [masterId, setMasterId] = useState<string>('')
  const [confirmText, setConfirmText] = useState('')

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    let cancelled = false
    obtenerDatosParaFusion(idA, idB)
      .then((result) => {
        if (cancelled) return
        if ('error' in result) {
          toast.error(result.error)
          onCloseRef.current()
          return
        }
        setPersonaA(result.personaA as Record<string, unknown>)
        setPersonaB(result.personaB as Record<string, unknown>)

        // Preselect master: whoever has more non-null fields
        const countA = MERGE_FIELDS.filter((f) => hasValue(result.personaA?.[f.key])).length
        const countB = MERGE_FIELDS.filter((f) => hasValue(result.personaB?.[f.key])).length
        setMasterId(countB >= countA ? idB : idA)

        // Default choices: prefer non-null value, default to master's value
        const defaultChoices: Record<string, 'A' | 'B'> = {}
        for (const f of MERGE_FIELDS) {
          const aHas = hasValue(result.personaA?.[f.key])
          const bHas = hasValue(result.personaB?.[f.key])
          if (aHas && !bHas) defaultChoices[f.key] = 'A'
          else if (!aHas && bHas) defaultChoices[f.key] = 'B'
          else defaultChoices[f.key] = countB >= countA ? 'B' : 'A'
        }
        setChoices(defaultChoices)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(`Error de conexión: ${err?.message ?? 'desconocido'}`)
        onCloseRef.current()
      })
    return () => { cancelled = true }
  }, [idA, idB])

  const atributosA = useMemo(() => {
    if (!personaA) return []
    return ((personaA.personas_atributos ?? []) as Atributo[]).filter((a) => a.activo)
  }, [personaA])

  const atributosB = useMemo(() => {
    if (!personaB) return []
    return ((personaB.personas_atributos ?? []) as Atributo[]).filter((a) => a.activo)
  }, [personaB])

  const mergedId = masterId === idA ? idB : idA

  // For confirmation, use master's apellido
  const masterPersona = masterId === idA ? personaA : personaB
  const requiredConfirm = (masterPersona?.apellido as string || '').toUpperCase()
  const canSubmit = confirmText.toUpperCase() === requiredConfirm && requiredConfirm.length > 0

  // Detect auth conflict
  const aHasAuth = !!personaA?.user_id
  const bHasAuth = !!personaB?.user_id
  const authConflict = aHasAuth && bHasAuth && personaA?.user_id !== personaB?.user_id

  function takeAllFrom(side: 'A' | 'B') {
    const next: Record<string, 'A' | 'B'> = {}
    for (const f of MERGE_FIELDS) next[f.key] = side
    setChoices(next)
  }

  async function handleFusionar() {
    if (!canSubmit) return
    setSubmitting(true)

    // Build field choices relative to master
    // If master=idA: 'A' means keep master, 'B' means take from merged
    // If master=idB: we need to swap — 'A' in UI means the merged persona
    const fieldChoices: Record<string, 'A' | 'B'> = {}
    for (const [field, choice] of Object.entries(choices)) {
      if (masterId === idA) {
        fieldChoices[field] = choice // A=master, B=merged — matches server expectation
      } else {
        fieldChoices[field] = choice === 'A' ? 'B' : 'A' // swap because server sees master=B
      }
    }

    const result = await fusionarPersonas(masterId, mergedId, fieldChoices)
    setSubmitting(false)

    if (result.ok) {
      toast.success(result.message)
      onComplete()
    } else {
      toast.error(result.message)
    }
  }

  if (loading) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!personaA || !personaB) return null

  const nameA = `${personaA.apellido}, ${personaA.nombre}`
  const nameB = `${personaB.apellido}, ${personaB.nombre}`

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fusionar personas</DialogTitle>
        </DialogHeader>

        {authConflict && (
          <div className="flex items-center gap-2 p-3 rounded-md border border-destructive/50 bg-destructive/5 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            Ambas personas tienen login distinto. Eliminá un auth.user antes de fusionar.
          </div>
        )}

        {/* Master selector */}
        <div className="flex items-center gap-4 p-3 rounded-md border bg-muted/30">
          <span className="text-sm font-medium">Master (queda):</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="master" checked={masterId === idA} onChange={() => setMasterId(idA)} />
            <span className="text-sm">{nameA} {aHasAuth && <Badge variant="outline" className="text-[9px] ml-1">auth</Badge>}</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="radio" name="master" checked={masterId === idB} onChange={() => setMasterId(idB)} />
            <span className="text-sm">{nameB} {bHasAuth && <Badge variant="outline" className="text-[9px] ml-1">auth</Badge>}</span>
          </label>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => takeAllFrom('A')}>
            Tomar todo de A
          </Button>
          <Button variant="outline" size="sm" onClick={() => takeAllFrom('B')}>
            Tomar todo de B
          </Button>
        </div>

        {/* Side-by-side field comparison */}
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-0 text-sm">
            {/* Header */}
            <div className="px-3 py-2 bg-muted font-medium border-b">
              A: {nameA}
              {masterId === idA && <Badge className="ml-2 text-[9px]">master</Badge>}
            </div>
            <div className="px-2 py-2 bg-muted border-b border-x font-medium text-center text-xs text-muted-foreground">
              Campo
            </div>
            <div className="px-3 py-2 bg-muted font-medium border-b">
              B: {nameB}
              {masterId === idB && <Badge className="ml-2 text-[9px]">master</Badge>}
            </div>

            {MERGE_FIELDS.map((f) => {
              const valA = displayVal(personaA[f.key])
              const valB = displayVal(personaB[f.key])
              const same = valA === valB
              const choice = choices[f.key]

              return (
                <div key={f.key} className="contents">
                  <button
                    className={cn(
                      'px-3 py-1.5 text-left border-b hover:bg-primary/5 transition-colors',
                      choice === 'A' && 'bg-primary/10 font-medium'
                    )}
                    onClick={() => setChoices((prev) => ({ ...prev, [f.key]: 'A' }))}
                  >
                    {valA}
                  </button>
                  <div className="px-2 py-1.5 border-b border-x text-[11px] text-muted-foreground text-center flex items-center justify-center">
                    {f.label}
                  </div>
                  <button
                    className={cn(
                      'px-3 py-1.5 text-left border-b hover:bg-primary/5 transition-colors',
                      choice === 'B' && 'bg-primary/10 font-medium'
                    )}
                    onClick={() => setChoices((prev) => ({ ...prev, [f.key]: 'B' }))}
                  >
                    {same ? <span className="text-muted-foreground">{valB}</span> : valB}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Atributos (roles) — all get merged, master wins on conflict */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Atributos (se conservan todos, master gana en conflictos)</p>
          <div className="flex flex-wrap gap-1">
            {[...new Set([...atributosA.map((a) => a.atributo_slug), ...atributosB.map((a) => a.atributo_slug)])].map((slug) => {
              const inA = atributosA.some((a) => a.atributo_slug === slug)
              const inB = atributosB.some((a) => a.atributo_slug === slug)
              return (
                <Badge key={slug} variant="secondary" className="text-xs">
                  {slug}
                  <span className="ml-1 text-[9px] opacity-60">
                    {inA && inB ? 'A+B' : inA ? 'A' : 'B'}
                  </span>
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Merge direction summary */}
        <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>{masterId === idA ? nameB : nameA}</strong> será eliminada.
            Todas sus relaciones (equipos, padrones, finanzas, etc.) se transfieren a{' '}
            <strong>{masterId === idA ? nameA : nameB}</strong>.
            {(aHasAuth || bHasAuth) && (
              <> Login {aHasAuth && bHasAuth ? 'de ambos' : `de ${aHasAuth ? 'A' : 'B'}`} se preserva.</>
            )}
          </span>
        </div>

        {/* Confirmation */}
        <div className="space-y-2">
          <Label className="text-sm">
            Escribí <strong>{requiredConfirm}</strong> para confirmar
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={requiredConfirm}
            className="max-w-xs"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleFusionar}
            disabled={!canSubmit || submitting || authConflict}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-1" />}
            Fusionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
