'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Loader2, RotateCcw, Save } from 'lucide-react'
import { toast } from 'sonner'
import { guardarPreferenciasPersona, restablecerDefaultsPreferenciasPersona } from '@/modules/comunicaciones/lib/preferencias/actions'
import type { PreferenciasPersona } from '@/modules/comunicaciones/lib/preferencias/tipos'
import { PREFERENCIAS_DEFAULT } from '@/modules/comunicaciones/lib/preferencias/defaults'

const CANALES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'in_app', label: 'In-App' },
  { value: 'llamada', label: 'Llamada' },
  { value: 'multi', label: 'Multi-canal' },
]

const FRECUENCIAS = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'nunca', label: 'Nunca' },
]

const DIAS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miercoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sabado' },
  { value: 'domingo', label: 'Domingo' },
]

interface PreferenciasFormProps {
  personaId: string
  preferencias: PreferenciasPersona | null
}

export function PreferenciasForm({ personaId, preferencias }: PreferenciasFormProps) {
  const defaults = PREFERENCIAS_DEFAULT
  const [isPending, startTransition] = useTransition()

  const [canalPreferido, setCanalPreferido] = useState(preferencias?.canal_preferido ?? defaults.canal_preferido)
  const [horarioInicio, setHorarioInicio] = useState(preferencias?.horario_preferido_inicio?.slice(0, 5) ?? defaults.horario_preferido_inicio.slice(0, 5))
  const [horarioFin, setHorarioFin] = useState(preferencias?.horario_preferido_fin?.slice(0, 5) ?? defaults.horario_preferido_fin.slice(0, 5))
  const [diasNo, setDiasNo] = useState<string[]>(preferencias?.dias_no_contactar ?? defaults.dias_no_contactar)
  const [optMarketing, setOptMarketing] = useState(preferencias?.opt_in_marketing ?? defaults.opt_in_marketing)
  const [optEventos, setOptEventos] = useState(preferencias?.opt_in_eventos_club ?? defaults.opt_in_eventos_club)
  const [optPartners, setOptPartners] = useState(preferencias?.opt_in_partners ?? defaults.opt_in_partners)
  const [optTorneos, setOptTorneos] = useState(preferencias?.opt_in_torneos ?? defaults.opt_in_torneos)
  const [frecuencia, setFrecuencia] = useState(preferencias?.frecuencia_resumen ?? defaults.frecuencia_resumen)
  const [facturaPapel, setFacturaPapel] = useState(preferencias?.recibe_factura_papel ?? defaults.recibe_factura_papel)
  const [revistaPapel, setRevistaPapel] = useState(preferencias?.recibe_revista_papel ?? defaults.recibe_revista_papel)

  function toggleDia(dia: string) {
    setDiasNo(prev => prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia])
  }

  function handleGuardar() {
    startTransition(async () => {
      const result = await guardarPreferenciasPersona(personaId, {
        canal_preferido: canalPreferido,
        horario_preferido_inicio: horarioInicio + ':00',
        horario_preferido_fin: horarioFin + ':00',
        dias_no_contactar: diasNo,
        opt_in_marketing: optMarketing,
        opt_in_eventos_club: optEventos,
        opt_in_partners: optPartners,
        opt_in_torneos: optTorneos,
        frecuencia_resumen: frecuencia,
        recibe_factura_papel: facturaPapel,
        recibe_revista_papel: revistaPapel,
      })
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  function handleRestablecer() {
    if (!confirm('Restablecer todas las preferencias a los valores por defecto?')) return
    startTransition(async () => {
      const result = await restablecerDefaultsPreferenciasPersona(personaId)
      if (result.ok) {
        toast.success(result.message)
        setCanalPreferido(defaults.canal_preferido)
        setHorarioInicio(defaults.horario_preferido_inicio.slice(0, 5))
        setHorarioFin(defaults.horario_preferido_fin.slice(0, 5))
        setDiasNo(defaults.dias_no_contactar)
        setOptMarketing(defaults.opt_in_marketing)
        setOptEventos(defaults.opt_in_eventos_club)
        setOptPartners(defaults.opt_in_partners)
        setOptTorneos(defaults.opt_in_torneos)
        setFrecuencia(defaults.frecuencia_resumen)
        setFacturaPapel(defaults.recibe_factura_papel)
        setRevistaPapel(defaults.recibe_revista_papel)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="space-y-4" data-testid="preferencias-comunicacion-form">
      <div className="flex gap-2">
        <Button onClick={handleGuardar} disabled={isPending} data-testid="pref-btn-guardar">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
        <Button variant="outline" onClick={handleRestablecer} disabled={isPending} data-testid="pref-btn-defaults">
          <RotateCcw className="h-4 w-4" />
          Restablecer defaults
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Canal preferido */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Canal preferido</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={canalPreferido} onValueChange={v => setCanalPreferido(v ?? canalPreferido)} data-testid="pref-canal-preferido">
              <SelectTrigger data-testid="pref-canal-preferido">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANALES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Solo descriptivo por ahora. Routing automatico en FASE 10.</p>
          </CardContent>
        </Card>

        {/* Categorias de contenido */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Categorias de contenido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Marketing</Label>
              <Switch checked={optMarketing} onCheckedChange={setOptMarketing} data-testid="pref-opt-marketing" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Eventos del club</Label>
              <Switch checked={optEventos} onCheckedChange={setOptEventos} data-testid="pref-opt-eventos" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Partners</Label>
              <Switch checked={optPartners} onCheckedChange={setOptPartners} data-testid="pref-opt-partners" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Torneos</Label>
              <Switch checked={optTorneos} onCheckedChange={setOptTorneos} data-testid="pref-opt-torneos" />
            </div>
            <p className="text-xs text-muted-foreground">Las comunicaciones transaccionales (cuotas, aptos, contratos) se envian siempre.</p>
          </CardContent>
        </Card>

        {/* Horario */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Horario de contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde</Label>
                <input
                  type="time"
                  value={horarioInicio}
                  onChange={e => setHorarioInicio(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  data-testid="pref-horario-inicio"
                />
              </div>
              <div>
                <Label>Hasta</Label>
                <input
                  type="time"
                  value={horarioFin}
                  onChange={e => setHorarioFin(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  data-testid="pref-horario-fin"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Hora Argentina (Buenos Aires)</p>
          </CardContent>
        </Card>

        {/* Dias no contactar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Dias sin contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2" data-testid="pref-dias-no-contactar">
              {DIAS.map(d => (
                <Badge
                  key={d.value}
                  variant={diasNo.includes(d.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleDia(d.value)}
                >
                  {d.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Frecuencia resumen */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Frecuencia de resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={frecuencia} onValueChange={v => setFrecuencia(v ?? frecuencia)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRECUENCIAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Implementacion en FASE 10.</p>
          </CardContent>
        </Card>

        {/* Suscripciones fisicas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Suscripciones fisicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Factura en papel</Label>
              <Switch checked={facturaPapel} onCheckedChange={setFacturaPapel} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Revista en papel</Label>
              <Switch checked={revistaPapel} onCheckedChange={setRevistaPapel} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
