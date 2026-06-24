'use client'

import { useState, useTransition } from 'react'
import { User, Phone, MapPin, Activity, Briefcase, Lock, Check, X, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { actualizarMiFicha, solicitarCambioMiDato } from '../_actions'

type Campo = { k: string; label: string; locked?: boolean; type?: string }

const SECCIONES: { titulo: string; icon: typeof User; campos: Campo[] }[] = [
  {
    titulo: 'Identidad', icon: User, campos: [
      { k: 'nombre', label: 'Nombre', locked: true },
      { k: 'apellido', label: 'Apellido', locked: true },
      { k: 'numero_documento', label: 'DNI', locked: true },
      { k: 'fecha_nacimiento', label: 'Fecha de nacimiento', locked: true, type: 'date' },
      { k: 'genero', label: 'Género' },
      { k: 'nacionalidad', label: 'Nacionalidad' },
      { k: 'estado_civil', label: 'Estado civil' },
    ],
  },
  {
    titulo: 'Contacto', icon: Phone, campos: [
      { k: 'email_principal', label: 'Email principal', locked: true, type: 'email' },
      { k: 'telefono_principal', label: 'Teléfono principal', locked: true, type: 'tel' },
      { k: 'email_secundario', label: 'Email secundario', type: 'email' },
      { k: 'telefono_secundario', label: 'Teléfono secundario', type: 'tel' },
      { k: 'whatsapp', label: 'WhatsApp', type: 'tel' },
    ],
  },
  {
    titulo: 'Dirección', icon: MapPin, campos: [
      { k: 'direccion_calle', label: 'Calle' },
      { k: 'direccion_numero', label: 'Número' },
      { k: 'direccion_piso', label: 'Piso' },
      { k: 'direccion_depto', label: 'Depto' },
      { k: 'direccion_barrio', label: 'Barrio' },
      { k: 'direccion_ciudad', label: 'Ciudad' },
      { k: 'direccion_provincia', label: 'Provincia' },
      { k: 'direccion_codigo_postal', label: 'Código postal' },
      { k: 'direccion_pais', label: 'País' },
    ],
  },
  {
    titulo: 'Datos deportivos', icon: Activity, campos: [
      { k: 'pie_dominante', label: 'Pie dominante' },
      { k: 'lateralidad', label: 'Lateralidad' },
      { k: 'altura_cm', label: 'Altura (cm)', type: 'number' },
      { k: 'peso_kg', label: 'Peso (kg)', type: 'number' },
    ],
  },
  {
    titulo: 'Profesión', icon: Briefcase, campos: [
      { k: 'profesion_ocupacion', label: 'Profesión / Ocupación' },
      { k: 'empresa_actual', label: 'Empresa' },
      { k: 'cargo_actual', label: 'Cargo' },
    ],
  },
]

// Todas las claves editables vía form (libres + candado-que-estaban-vacíos)
function esEditable(c: Campo, valorInicial: string): boolean {
  if (!c.locked) return true
  return valorInicial.trim() === '' // candado: editable solo si estaba vacío
}

export function MiFicha({ persona }: { persona: Record<string, unknown> }) {
  const valor = (k: string) => {
    const v = persona[k]
    return v == null ? '' : String(v)
  }

  // Estado del form: todos los campos editables
  const initial: Record<string, string> = {}
  for (const sec of SECCIONES) {
    for (const c of sec.campos) {
      if (esEditable(c, valor(c.k))) initial[c.k] = valor(c.k)
    }
  }

  const [form, setForm] = useState<Record<string, string>>(initial)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()

  // Solicitar cambio (para campos candado ya cargados)
  const [solicitando, setSolicitando] = useState<string | null>(null)
  const [nuevoValor, setNuevoValor] = useState('')
  const [solMsg, setSolMsg] = useState<string | null>(null)

  function setCampo(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function guardar() {
    setMsg(null)
    start(async () => {
      const r = await actualizarMiFicha(form)
      setMsg({ ok: r.ok, text: r.message })
    })
  }

  function enviarSolicitud(campo: string, valorActual: string) {
    setSolMsg(null)
    start(async () => {
      const r = await solicitarCambioMiDato(campo, valorActual, nuevoValor)
      if (r.ok) {
        setSolicitando(null)
        setNuevoValor('')
      }
      setSolMsg(r.message)
    })
  }

  return (
    <div className="space-y-4">
      {SECCIONES.map((sec) => {
        const Icon = sec.icon
        return (
          <Card key={sec.titulo}>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" /> {sec.titulo}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {sec.campos.map((c) => {
                  const inicial = valor(c.k)
                  const editable = esEditable(c, inicial)
                  const lockedFilled = c.locked && inicial.trim() !== ''

                  if (lockedFilled) {
                    // Campo de identidad ya cargado → read-only + solicitar cambio
                    return (
                      <div key={c.k} className="col-span-2 space-y-1">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3" /> {c.label}
                        </Label>
                        <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                          <span className="text-sm truncate">{inicial}</span>
                          <button
                            type="button"
                            onClick={() => { setSolicitando(c.k); setNuevoValor(''); setSolMsg(null) }}
                            className="text-xs text-primary hover:underline shrink-0 inline-flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" /> Solicitar cambio
                          </button>
                        </div>
                        {solicitando === c.k && (
                          <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Pedí el cambio de <b>{c.label}</b>. Un administrador lo revisa antes de aplicarlo.
                            </p>
                            <Input
                              type={c.type ?? 'text'}
                              value={nuevoValor}
                              onChange={(e) => setNuevoValor(e.target.value)}
                              placeholder={`Nuevo valor de ${c.label.toLowerCase()}`}
                              className="h-9"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button" size="sm" className="h-8"
                                disabled={pending || !nuevoValor.trim()}
                                onClick={() => enviarSolicitud(c.k, inicial)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Enviar solicitud
                              </Button>
                              <Button
                                type="button" size="sm" variant="ghost" className="h-8"
                                onClick={() => { setSolicitando(null); setSolMsg(null) }}
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                              </Button>
                            </div>
                            {solMsg && <p className="text-xs text-muted-foreground">{solMsg}</p>}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Campo editable (libre, o candado que estaba vacío)
                  return (
                    <div key={c.k} className="space-y-1 col-span-2 sm:col-span-1">
                      <Label htmlFor={c.k} className="text-xs text-muted-foreground">
                        {c.label}
                        {c.locked && <span className="ml-1 text-[10px] text-primary">(completar)</span>}
                      </Label>
                      <Input
                        id={c.k}
                        type={c.type ?? 'text'}
                        value={form[c.k] ?? ''}
                        onChange={(e) => setCampo(c.k, e.target.value)}
                        disabled={!editable}
                        className="h-9"
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}

      <div className="sticky bottom-20 z-10 flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur p-3 shadow-sm">
        <Button onClick={guardar} disabled={pending} className="flex-1">
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-green-600' : 'text-destructive'}`}>{msg.text}</span>
        )}
      </div>
    </div>
  )
}
