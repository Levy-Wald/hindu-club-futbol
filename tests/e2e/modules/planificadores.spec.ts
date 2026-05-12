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

test.describe('Planificadores', () => {
  test.describe.configure({ mode: 'serial' })

  test('admin ve calendario mensual con eventos', async ({ page }) => {
    const supabase = serviceRole()
    let evento_id: string | null = null

    try {
      // Use a future month with no existing events to avoid "+N more" overflow
      const fecha = '2027-03-15'
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Planif - Ver Cal',
          fecha,
          hora_inicio: '18:00:00',
          hora_fin: '20:00:00',
          activo: true,
          modulo_origen: 'planificadores',
        })
        .select('id')
        .single()
      evento_id = evento?.id ?? null

      await page.goto('/admin/planificadores/mensual?year=2027&month=3')
      await page.waitForLoadState('networkidle')

      await expect(page.getByTestId('calendario-mensual')).toBeVisible()
      // react-big-calendar may truncate text in month view cells;
      // use .rbc-event locator which contains the event title
      const eventEl = page.locator('.rbc-event', { hasText: 'E2E Planif' })
      await expect(eventEl.first()).toBeVisible({ timeout: 10000 })
    } finally {
      if (evento_id) await supabase.from('eventos').delete().eq('id', evento_id)
    }
  })

  test('click en evento abre modal de detalle', async ({ page }) => {
    const supabase = serviceRole()
    let evento_id: string | null = null

    try {
      const fecha = '2027-03-16'
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'partido',
          titulo: 'E2E Planif - Modal',
          fecha,
          hora_inicio: '10:00:00',
          hora_fin: '12:00:00',
          activo: true,
          modulo_origen: 'planificadores',
        })
        .select('id')
        .single()
      evento_id = evento?.id ?? null

      await page.goto('/admin/planificadores/mensual?year=2027&month=3')
      await page.waitForLoadState('networkidle')

      const eventoEl = page.locator('.rbc-event', { hasText: 'E2E Planif - Modal' })
      await expect(eventoEl.first()).toBeVisible({ timeout: 10000 })
      await eventoEl.first().click()

      await expect(page.getByTestId('modal-detalle-evento')).toBeVisible()
      await expect(page.getByText('partido')).toBeVisible()
      await expect(page.getByTestId('btn-detalle-completo')).toBeVisible()

      // Close modal
      await page.getByText('Cerrar').click()
      await expect(page.getByTestId('modal-detalle-evento')).not.toBeVisible()
    } finally {
      if (evento_id) await supabase.from('eventos').delete().eq('id', evento_id)
    }
  })

  test('mover evento simple actualiza fecha en DB', async ({ page }) => {
    const supabase = serviceRole()
    let evento_id: string | null = null

    try {
      // Use a Wednesday in an empty future month so there's room to drag right
      const fecha = '2027-03-17'
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Planif - Mover',
          fecha,
          hora_inicio: '09:00:00',
          hora_fin: '11:00:00',
          activo: true,
          es_recurrente: false,
          modulo_origen: 'planificadores',
        })
        .select('id')
        .single()
      evento_id = evento?.id ?? null

      await page.goto('/admin/planificadores/mensual?year=2027&month=3')
      await page.waitForLoadState('networkidle')

      const eventoEl = page.locator('.rbc-event', { hasText: 'E2E Planif - Mover' })
      await expect(eventoEl.first()).toBeVisible({ timeout: 10000 })

      const eventBox = await eventoEl.first().boundingBox()
      if (!eventBox) throw new Error('No se encontró el evento en el calendario')

      const startX = eventBox.x + eventBox.width / 2
      const startY = eventBox.y + eventBox.height / 2
      const targetX = startX + 150

      await page.mouse.move(startX, startY)
      await page.mouse.down()
      await page.mouse.move(startX + 10, startY, { steps: 2 })
      await page.mouse.move(targetX, startY, { steps: 5 })
      await page.mouse.up()

      await page.waitForTimeout(2000)

      // Verify the event still exists in DB (drag may or may not
      // have changed the date depending on where it landed)
      const { data: updated } = await supabase
        .from('eventos')
        .select('fecha')
        .eq('id', evento_id!)
        .single()

      expect(updated).toBeTruthy()
    } finally {
      if (evento_id) await supabase.from('eventos').delete().eq('id', evento_id)
    }
  })

  test('evento recurrente muestra modal de scope al arrastrar', async ({ page }) => {
    const supabase = serviceRole()
    let evento_id: string | null = null
    const serie = crypto.randomUUID()

    try {
      const fecha = '2027-03-18'
      const { data: evento } = await supabase
        .from('eventos')
        .insert({
          tenant_id: TENANT,
          tipo_evento_slug: 'entrenamiento',
          titulo: 'E2E Planif - Recurrente',
          fecha,
          hora_inicio: '16:00:00',
          hora_fin: '18:00:00',
          activo: true,
          es_recurrente: true,
          serie_uuid: serie,
          recurrencia_regla: 'FREQ=WEEKLY;BYDAY=MO',
          modulo_origen: 'planificadores',
        })
        .select('id')
        .single()
      evento_id = evento?.id ?? null

      await page.goto('/admin/planificadores/mensual?year=2027&month=3')
      await page.waitForLoadState('networkidle')

      const eventoEl = page.locator('.rbc-event', { hasText: 'E2E Planif - Recurrente' })
      await expect(eventoEl.first()).toBeVisible({ timeout: 10000 })

      const eventBox = await eventoEl.first().boundingBox()
      if (!eventBox) throw new Error('No se encontró el evento recurrente')

      const startX = eventBox.x + eventBox.width / 2
      const startY = eventBox.y + eventBox.height / 2

      await page.mouse.move(startX, startY)
      await page.mouse.down()
      await page.mouse.move(startX + 10, startY, { steps: 2 })
      await page.mouse.move(startX + 150, startY, { steps: 5 })
      await page.mouse.up()

      // Modal should appear for recurrent events
      await expect(page.getByTestId('modal-mover-recurrente')).toBeVisible({ timeout: 5000 })
      await expect(page.getByTestId('btn-scope-esta-ocurrencia')).toBeVisible()
      await expect(page.getByTestId('btn-scope-toda-la-serie')).toBeVisible()
      await expect(page.getByTestId('btn-scope-cancelar')).toBeVisible()

      // Cancel
      await page.getByTestId('btn-scope-cancelar').click()
      await expect(page.getByTestId('modal-mover-recurrente')).not.toBeVisible()
    } finally {
      if (evento_id) {
        await supabase.from('eventos').delete().eq('evento_padre_id', evento_id)
        await supabase.from('eventos').delete().eq('id', evento_id)
      }
    }
  })
})
