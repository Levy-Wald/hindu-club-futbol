import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MiCuentaClient } from './_components/mi-cuenta-client'

const TENANT_ID = '11111111-1111-1111-1111-111111111111'

export default async function MiCuentaPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: persona } = await supabase
    .from('personas')
    .select('id, nombre, apellido, foto_url, dni, email, telefono, fecha_nacimiento, created_at')
    .eq('user_id', user.id)
    .single()

  if (!persona) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold">Mi cuenta</h1>
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">
            No se encontro tu perfil de persona asociado a tu usuario.
          </p>
        </div>
      </div>
    )
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('nombre, plan_slug, tipo')
    .eq('id', TENANT_ID)
    .single()

  // Fetch padron membership for nro_socio
  const { data: padronMembership } = await supabase
    .from('personas_padrones')
    .select('numero_socio, fecha_alta, padron:padrones(nombre)')
    .eq('persona_id', persona.id)
    .eq('activo', true)
    .order('fecha_alta', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Fetch atributos for roles/status
  const { data: atributos } = await supabase
    .from('personas_atributos')
    .select('atributo_slug, activo')
    .eq('persona_id', persona.id)
    .eq('activo', true)

  // Fetch financial data in parallel
  const [cuentaCorrienteRes, cuotasRes, movimientosRes, conveniosRes] =
    await Promise.all([
      supabase
        .from('cuentas_corrientes')
        .select('saldo, saldo_usd, ultimo_movimiento_at, tipo')
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .eq('tipo', 'socio')
        .maybeSingle(),
      supabase
        .from('cuotas_emitidas')
        .select(
          'id, periodo, monto_original, monto_final, estado, fecha_emision, fecha_vencimiento, moneda'
        )
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .order('fecha_vencimiento', { ascending: false })
        .limit(50),
      supabase
        .from('movimientos_caja')
        .select(
          'id, numero, tipo, monto_neto, moneda, fecha, descripcion, categoria_id, anulado'
        )
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .eq('anulado', false)
        .order('fecha', { ascending: false })
        .limit(50),
      supabase
        .from('convenios_pago')
        .select(
          'id, deuda_original, cantidad_cuotas, monto_cuota, cuotas_pagadas, estado, fecha_inicio, proximo_vencimiento'
        )
        .eq('tenant_id', TENANT_ID)
        .eq('persona_id', persona.id)
        .eq('estado', 'vigente'),
    ])

  // Resolve FK join for padron name
  const padronRaw = padronMembership?.padron
  const padronNombre = Array.isArray(padronRaw)
    ? (padronRaw[0] as { nombre: string } | undefined)?.nombre ?? null
    : padronRaw && typeof padronRaw === 'object'
      ? (padronRaw as { nombre: string }).nombre
      : null

  return (
    <MiCuentaClient
      persona={{
        id: persona.id,
        nombre: persona.nombre,
        apellido: persona.apellido,
        foto_url: persona.foto_url,
        dni: persona.dni,
        email: persona.email,
        telefono: persona.telefono,
        fecha_nacimiento: persona.fecha_nacimiento,
        created_at: persona.created_at,
      }}
      tenant={{
        nombre: tenant?.nombre ?? 'Club',
        plan: tenant?.plan_slug ?? 'free',
        tipo: tenant?.tipo ?? 'club',
      }}
      membresia={{
        numero_socio: padronMembership?.numero_socio ?? null,
        fecha_alta: padronMembership?.fecha_alta ?? persona.created_at,
        padron_nombre: padronNombre,
      }}
      atributos={(atributos ?? []).map((a) => a.atributo_slug)}
      cuentaCorriente={cuentaCorrienteRes.data}
      cuotas={cuotasRes.data ?? []}
      movimientos={movimientosRes.data ?? []}
      convenios={conveniosRes.data ?? []}
    />
  )
}
