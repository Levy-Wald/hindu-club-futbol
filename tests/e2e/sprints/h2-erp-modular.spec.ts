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

test.describe('Sprint H2 — ERP Modular Tests', () => {
  test.describe.configure({ mode: 'serial' })

  // =========================================================================
  // Escenario 1 — Listas de precios (A2.5)
  // =========================================================================
  test('Escenario 1: Listas de precios — crear, ver, eliminar', async ({ page }) => {
    const supabase = serviceRole()
    let listaId: string | null = null

    try {
      // Create lista via DB
      const { data: lista } = await supabase
        .from('producto_listas_precios')
        .insert({
          tenant_id: TENANT,
          nombre: 'Lista Test E2E H2',
          slug: 'lista-test-e2e-h2',
          tipo: 'venta',
          moneda: 'ARS',
          activa: true,
          orden: 999,
        })
        .select('id')
        .single()
      listaId = lista?.id ?? null

      // Navigate to listas page
      await page.goto('/admin/productos/listas-precios')
      await page.waitForLoadState('networkidle')

      // Verify page loads
      await expect(page.locator('text=/lista/i').first()).toBeVisible({ timeout: 10000 })

      // Verify our lista appears
      await expect(page.getByText('Lista Test E2E H2')).toBeVisible({ timeout: 10000 })

      // No console errors
      const errors: string[] = []
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
      await page.waitForTimeout(1000)
      // Allow Supabase telemetry errors
      const realErrors = errors.filter(e => !e.includes('telemetry') && !e.includes('analytics'))
      expect(realErrors).toHaveLength(0)
    } finally {
      if (listaId) await supabase.from('producto_listas_precios').delete().eq('id', listaId)
    }
  })

  // =========================================================================
  // Escenario 2 — Stock por deposito (A2.6)
  // =========================================================================
  test('Escenario 2: Stock — pagina de movimientos carga', async ({ page }) => {
    const supabase = serviceRole()
    let espacioId: string | null = null
    let stockId: string | null = null

    try {
      // Get an existing producto
      const { data: productos } = await supabase
        .from('productos')
        .select('id, nombre')
        .eq('tenant_id', TENANT)
        .is('deleted_at', null)
        .limit(1)
      const productoId = productos?.[0]?.id

      if (productoId) {
        // Get or create an espacio
        const { data: espacios } = await supabase
          .from('espacios')
          .select('id')
          .eq('tenant_id', TENANT)
          .limit(1)
        let existingEspacio = espacios?.[0]?.id

        if (!existingEspacio) {
          const { data: sede } = await supabase
            .from('sedes')
            .select('id')
            .eq('tenant_id', TENANT)
            .limit(1)
            .single()

          if (sede) {
            const { data: esp } = await supabase
              .from('espacios')
              .insert({
                tenant_id: TENANT,
                sede_id: sede.id,
                nombre: 'Deposito Test E2E H2',
                tipo_slug: 'deposito',
                metadata: { fixture: true },
              })
              .select('id')
              .single()
            espacioId = esp?.id ?? null
            existingEspacio = espacioId!
          }
        }

        if (existingEspacio) {
          // Create stock record
          const { data: stock } = await supabase
            .from('producto_stock_espacio')
            .insert({
              producto_id: productoId,
              espacio_id: existingEspacio,
              cantidad: 100,
            })
            .select('id')
            .single()
          stockId = stock?.id ?? null
        }
      }

      // Navigate to stock/movimientos page
      await page.goto('/admin/productos/movimientos')
      await page.waitForLoadState('networkidle')

      // Verify page renders without error
      const resp = await page.goto('/admin/productos/movimientos')
      expect(resp?.status()).toBe(200)
      const errorBoundary = page.locator('text=Application error')
      await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
    } finally {
      if (stockId) await supabase.from('producto_stock_espacio').delete().eq('id', stockId)
      if (espacioId) await supabase.from('espacios').delete().eq('id', espacioId)
    }
  })

  // =========================================================================
  // Escenario 3 — Cajas con dimensiones (A3.2)
  // =========================================================================
  test('Escenario 3: Cajas — crear via DB, verificar en listado', async ({ page }) => {
    const supabase = serviceRole()
    let cajaId: string | null = null

    try {
      const { data: caja } = await supabase
        .from('cajas')
        .insert({
          tenant_id: TENANT,
          nombre: 'Caja Test E2E H2',
          tipo: 'efectivo',
          tipo_fiscal: 'blanco',
          moneda: 'ARS',
          activa: true,
          saldo_actual: 0,
        })
        .select('id')
        .single()
      cajaId = caja?.id ?? null

      // Navigate to cajas
      await page.goto('/admin/finanzas/cajas')
      await page.waitForLoadState('networkidle')

      // Verify page loads
      await expect(page.locator('text=/caja/i').first()).toBeVisible({ timeout: 10000 })

      // Verify our caja appears
      await expect(page.getByText('Caja Test E2E H2')).toBeVisible({ timeout: 10000 })

      // Navigate to detail
      if (cajaId) {
        await page.goto(`/admin/finanzas/cajas/${cajaId}`)
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Caja Test E2E H2')).toBeVisible({ timeout: 10000 })
      }
    } finally {
      if (cajaId) {
        await supabase.from('cajas').update({ deleted_at: new Date().toISOString() }).eq('id', cajaId)
      }
    }
  })

  // =========================================================================
  // Escenario 4 — Movimientos financieros (A3.3)
  // =========================================================================
  test('Escenario 4: Movimientos financieros — pagina carga y muestra datos', async ({ page }) => {
    // Navigate to movimientos
    await page.goto('/admin/finanzas/movimientos')
    await page.waitForLoadState('networkidle')

    // Verify page loads
    const resp = await page.goto('/admin/finanzas/movimientos')
    expect(resp?.status()).toBe(200)
    await expect(page.locator('text=/movimiento/i').first()).toBeVisible({ timeout: 10000 })

    // Verify no error boundary
    const errorBoundary = page.locator('text=Application error')
    await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
  })

  // =========================================================================
  // Escenario 5 — Conciliacion bancaria (A3.6)
  // =========================================================================
  test('Escenario 5: Conciliacion — pagina carga', async ({ page }) => {
    // Navigate to conciliacion
    await page.goto('/admin/finanzas/conciliacion')
    await page.waitForLoadState('networkidle')

    // Verify page loads
    const resp = await page.goto('/admin/finanzas/conciliacion')
    expect(resp?.status()).toBe(200)

    // Verify no error boundary
    const errorBoundary = page.locator('text=Application error')
    await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
  })

  // =========================================================================
  // Escenario 6 — Reportes contables (A3.5)
  // =========================================================================
  test('Escenario 6: Reportes — libro mayor, balance, EERR, cobranzas cargan', async ({ page }) => {
    const reportes = [
      { path: '/admin/finanzas/reportes/libro-mayor', label: 'Libro Mayor' },
      { path: '/admin/finanzas/reportes/balance', label: 'Balance' },
      { path: '/admin/finanzas/reportes/estado-resultados', label: 'Estado de Resultados' },
      { path: '/admin/finanzas/reportes/cobranzas', label: 'Cobranzas' },
    ]

    for (const reporte of reportes) {
      const resp = await page.goto(reporte.path)
      expect(resp?.status(), `${reporte.label} debe retornar 200`).toBe(200)

      // No error boundary
      const errorBoundary = page.locator('text=Application error')
      await expect(errorBoundary).not.toBeVisible({ timeout: 3000 })
    }
  })
})
