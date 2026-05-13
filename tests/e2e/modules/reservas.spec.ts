import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TENANT = '11111111-1111-1111-1111-111111111111'

function serviceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

test.describe('Reservas', () => {
  test.describe.configure({ mode: 'serial' })

  let canchaId: string | null = null
  let sedeId: string | null = null
  let reservaId: string | null = null
  let eventoIds: string[] = []

  test.afterAll(async () => {
    const supabase = serviceRole()
    // Clean reservas
    if (canchaId) {
      const { data: reservas } = await supabase
        .from('reservas_canchas')
        .select('id, evento_id')
        .eq('cancha_id', canchaId)
      for (const r of reservas ?? []) {
        await supabase.from('reservas_canchas').delete().eq('id', r.id)
        await supabase.from('eventos').delete().eq('id', r.evento_id)
      }
    }
    // Clean any remaining eventos
    for (const id of eventoIds) {
      await supabase.from('reservas_canchas').delete().eq('evento_id', id)
      await supabase.from('eventos').delete().eq('id', id)
    }
    if (canchaId) await supabase.from('canchas').delete().eq('id', canchaId)
    if (sedeId) await supabase.from('sedes').delete().eq('id', sedeId)
  })

  test('admin ve pantalla reservas con tabla vacia', async ({ page }) => {
    await page.goto('/admin/reservas')
    await page.waitForLoadState('networkidle')

    await expect(page.getByTestId('pantalla-reservas')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('btn-nueva-reserva')).toBeVisible()
    await expect(page.getByTestId('tabla-reservas')).toBeVisible()
  })

  test('crear reserva con cliente externo calcula tarifa', async ({ page }) => {
    const supabase = serviceRole()

    // Fixture: sede + cancha con precio
    const sedeSlug = `e2e-reservas-${Date.now()}`
    const { data: sede, error: errSede } = await supabase
      .from('sedes')
      .insert({
        tenant_id: TENANT,
        slug: sedeSlug,
        nombre: 'Sede E2E Reservas',
        direccion: { calle: 'Test', numero: '123' },
        activa: true,
      })
      .select('id')
      .single()
    if (errSede) throw new Error(`Sede insert failed: ${errSede.message}`)
    sedeId = sede!.id

    const { data: cancha } = await supabase
      .from('canchas')
      .insert({
        tenant_id: TENANT,
        sede_id: sedeId,
        nombre: 'Cancha E2E Test',
        tipo: 'futbol_11',
        disponible_para_alquiler: true,
        precio_alquiler_hora: 2500,
        activa: true,
      })
      .select('id')
      .single()
    canchaId = cancha!.id

    await page.goto('/admin/reservas')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-reservas')).toBeVisible({ timeout: 15000 })

    // Open modal
    await page.getByTestId('btn-nueva-reserva').click()
    await expect(page.getByTestId('modal-nueva-reserva')).toBeVisible({ timeout: 5000 })

    // Fill form
    await page.getByTestId('select-cancha').click()
    await page.getByRole('option', { name: /Cancha E2E Test/ }).click()

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    await page.getByTestId('input-fecha').fill(tomorrow)
    await page.getByTestId('input-hora-inicio').fill('18:00')
    await page.getByTestId('input-hora-fin').fill('20:00')
    await page.getByTestId('input-cliente-nombre').fill('Cliente Test E2E')
    await page.getByTestId('input-cliente-telefono').fill('+541112345678')

    // Submit
    await page.getByTestId('btn-crear-reserva').click()

    // Modal should close
    await expect(page.getByTestId('modal-nueva-reserva')).not.toBeVisible({ timeout: 10000 })

    // Verify in DB
    const { data: reservas } = await supabase
      .from('reservas_canchas')
      .select('id, tarifa_total, tarifa_hora, duracion_horas, estado, persona_id, cliente_nombre_externo, evento_id')
      .eq('cancha_id', canchaId!)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(reservas).toHaveLength(1)
    const r = reservas![0]
    expect(Number(r.tarifa_total)).toBe(5000) // 2500 * 2h
    expect(Number(r.tarifa_hora)).toBe(2500)
    expect(Number(r.duracion_horas)).toBe(2)
    expect(r.estado).toBe('pendiente')
    expect(r.persona_id).toBeNull()
    expect(r.cliente_nombre_externo).toBe('Cliente Test E2E')
    reservaId = r.id
    eventoIds.push(r.evento_id)
  })

  test('marcar reserva como pagada', async ({ page }) => {
    const supabase = serviceRole()

    // First confirm the reservation
    await supabase
      .from('reservas_canchas')
      .update({ estado: 'confirmada' })
      .eq('id', reservaId!)

    await page.goto('/admin/reservas')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('pantalla-reservas')).toBeVisible({ timeout: 15000 })

    // Click on the reservation row
    await page.getByTestId(`fila-reserva-${reservaId}`).click()
    await expect(page.getByTestId('modal-detalle-reserva')).toBeVisible({ timeout: 5000 })

    // Select payment method
    await page.getByTestId('select-metodo-pago').click()
    await page.getByRole('option', { name: 'Efectivo' }).click()

    // Click "Marcar pagada"
    await page.getByTestId('btn-marcar-pagada').click()

    // Modal should close
    await expect(page.getByTestId('modal-detalle-reserva')).not.toBeVisible({ timeout: 10000 })

    // Verify in DB
    const { data: reserva } = await supabase
      .from('reservas_canchas')
      .select('estado, fecha_pago, metodo_pago')
      .eq('id', reservaId!)
      .single()

    expect(reserva!.estado).toBe('pagada')
    expect(reserva!.fecha_pago).not.toBeNull()
    expect(reserva!.metodo_pago).toBe('efectivo')
  })
})
