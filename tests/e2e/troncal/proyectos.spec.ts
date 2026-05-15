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

test.describe('Sprint A6 — Proyectos & Tareas', () => {
  test.describe.configure({ mode: 'serial' })

  // =========================================================================
  // Escenario 1 — Crear proyecto y verificar en listado
  // =========================================================================
  test('Escenario 1: Crear proyecto via DB, verificar en listado y detalle', async ({ page }) => {
    const supabase = serviceRole()
    let proyectoId: string | null = null

    try {
      const { data: proyecto } = await supabase
        .from('proyectos')
        .insert({
          tenant_id: TENANT,
          nombre: 'Proyecto Test E2E A6',
          descripcion: 'Proyecto de prueba automatizado',
          estado: 'planificado',
          moneda: 'ARS',
          color: '#4F46E5',
        })
        .select('id')
        .single()
      proyectoId = proyecto?.id ?? null

      // Navigate to proyectos list
      await page.goto('/admin/proyectos')
      await page.waitForLoadState('networkidle')

      // Verify page loads
      await expect(page.locator('text=/proyecto/i').first()).toBeVisible({ timeout: 10000 })

      // Verify our project appears
      await expect(page.getByText('Proyecto Test E2E A6')).toBeVisible({ timeout: 10000 })

      // Navigate to detail
      if (proyectoId) {
        await page.goto(`/admin/proyectos/${proyectoId}`)
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Proyecto Test E2E A6')).toBeVisible({ timeout: 10000 })

        // Verify tabs exist
        await expect(page.getByRole('tab', { name: /tablero/i })).toBeVisible()
        await expect(page.getByRole('tab', { name: /lista/i })).toBeVisible()
      }
    } finally {
      if (proyectoId) {
        await supabase.from('proyectos').update({ deleted_at: new Date().toISOString() }).eq('id', proyectoId)
      }
    }
  })

  // =========================================================================
  // Escenario 2 — Crear tarea y verificar en Kanban
  // =========================================================================
  test('Escenario 2: Crear tarea via DB, verificar en tablero Kanban', async ({ page }) => {
    const supabase = serviceRole()
    let proyectoId: string | null = null
    let tareaId: string | null = null

    try {
      // Create project
      const { data: proyecto } = await supabase
        .from('proyectos')
        .insert({
          tenant_id: TENANT,
          nombre: 'Proyecto Kanban E2E A6',
          estado: 'en_curso',
          moneda: 'ARS',
          color: '#059669',
        })
        .select('id')
        .single()
      proyectoId = proyecto?.id ?? null

      // Create task
      if (proyectoId) {
        const { data: tarea } = await supabase
          .from('proyecto_tareas')
          .insert({
            proyecto_id: proyectoId,
            titulo: 'Tarea Kanban E2E A6',
            estado_slug: 'backlog',
            prioridad: 'alta',
            posicion_kanban: 1000,
            tags: [],
          })
          .select('id')
          .single()
        tareaId = tarea?.id ?? null

        // Navigate to project detail (Tablero tab is default)
        await page.goto(`/admin/proyectos/${proyectoId}`)
        await page.waitForLoadState('networkidle')

        // Verify task card appears in kanban
        await expect(page.getByText('Tarea Kanban E2E A6')).toBeVisible({ timeout: 10000 })
      }
    } finally {
      if (tareaId) await supabase.from('proyecto_tareas').delete().eq('id', tareaId)
      if (proyectoId) await supabase.from('proyectos').delete().eq('id', proyectoId)
    }
  })

  // =========================================================================
  // Escenario 3 — Lista view carga y muestra tareas
  // =========================================================================
  test('Escenario 3: Vista lista muestra tareas con filtros', async ({ page }) => {
    const supabase = serviceRole()
    let proyectoId: string | null = null
    let tareaId: string | null = null

    try {
      const { data: proyecto } = await supabase
        .from('proyectos')
        .insert({
          tenant_id: TENANT,
          nombre: 'Proyecto Lista E2E A6',
          estado: 'en_curso',
          moneda: 'ARS',
          color: '#3B82F6',
        })
        .select('id')
        .single()
      proyectoId = proyecto?.id ?? null

      if (proyectoId) {
        const { data: tarea } = await supabase
          .from('proyecto_tareas')
          .insert({
            proyecto_id: proyectoId,
            titulo: 'Tarea Lista E2E A6',
            estado_slug: 'en_curso',
            prioridad: 'critica',
            posicion_kanban: 1000,
            tags: [],
          })
          .select('id')
          .single()
        tareaId = tarea?.id ?? null

        // Navigate to Lista tab
        await page.goto(`/admin/proyectos/${proyectoId}`)
        await page.waitForLoadState('networkidle')

        // Click Lista tab
        await page.getByRole('tab', { name: /lista/i }).click()
        await page.waitForTimeout(500)

        // Verify task appears in list
        await expect(page.getByText('Tarea Lista E2E A6')).toBeVisible({ timeout: 10000 })
      }
    } finally {
      if (tareaId) await supabase.from('proyecto_tareas').delete().eq('id', tareaId)
      if (proyectoId) await supabase.from('proyectos').delete().eq('id', proyectoId)
    }
  })

  // =========================================================================
  // Escenario 4 — Subtarea + anti-ciclo (trigger trg_tareas_no_ciclo)
  // =========================================================================
  test('Escenario 4: Subtarea se crea OK, ciclo es rechazado por trigger', async () => {
    const supabase = serviceRole()
    let proyectoId: string | null = null
    let parentId: string | null = null
    let childId: string | null = null

    try {
      const { data: proyecto } = await supabase
        .from('proyectos')
        .insert({
          tenant_id: TENANT,
          nombre: 'Proyecto Ciclo E2E A6',
          estado: 'en_curso',
          moneda: 'ARS',
          color: '#EF4444',
        })
        .select('id')
        .single()
      proyectoId = proyecto?.id ?? null

      if (proyectoId) {
        // Create parent task
        const { data: parent } = await supabase
          .from('proyecto_tareas')
          .insert({
            proyecto_id: proyectoId,
            titulo: 'Padre E2E',
            estado_slug: 'backlog',
            prioridad: 'media',
            posicion_kanban: 1000,
            tags: [],
          })
          .select('id')
          .single()
        parentId = parent?.id ?? null

        // Create child task (should succeed)
        const { data: child } = await supabase
          .from('proyecto_tareas')
          .insert({
            proyecto_id: proyectoId,
            titulo: 'Hijo E2E',
            estado_slug: 'backlog',
            prioridad: 'media',
            posicion_kanban: 2000,
            parent_tarea_id: parentId,
            tags: [],
          })
          .select('id')
          .single()
        childId = child?.id ?? null

        expect(childId).not.toBeNull()

        // Try to create cycle: set parent's parent_tarea_id to child → should fail
        const { error: cycleError } = await supabase
          .from('proyecto_tareas')
          .update({ parent_tarea_id: childId })
          .eq('id', parentId!)

        expect(cycleError).not.toBeNull()
        expect(cycleError?.message?.toLowerCase()).toContain('ciclo')
      }
    } finally {
      if (childId) await supabase.from('proyecto_tareas').delete().eq('id', childId)
      if (parentId) await supabase.from('proyecto_tareas').delete().eq('id', parentId)
      if (proyectoId) await supabase.from('proyectos').delete().eq('id', proyectoId)
    }
  })

  // =========================================================================
  // Escenario 5 — Presupuesto consumido via fn_presupuesto_consumido
  // =========================================================================
  test('Escenario 5: fn_presupuesto_consumido calcula correctamente', async () => {
    const supabase = serviceRole()
    let proyectoId: string | null = null
    let movId: string | null = null

    try {
      // Create project with budget
      const { data: proyecto } = await supabase
        .from('proyectos')
        .insert({
          tenant_id: TENANT,
          nombre: 'Proyecto Presupuesto E2E A6',
          estado: 'en_curso',
          presupuesto_total: 100000,
          moneda: 'ARS',
          color: '#D97706',
        })
        .select('id')
        .single()
      proyectoId = proyecto?.id ?? null

      if (proyectoId) {
        // Get a caja to create movimiento
        const { data: cajas } = await supabase
          .from('cajas')
          .select('id')
          .eq('tenant_id', TENANT)
          .is('deleted_at', null)
          .limit(1)

        if (cajas && cajas.length > 0) {
          // Create movimiento linked to project
          const { data: mov, error: movError } = await supabase
            .from('movimientos_caja')
            .insert({
              tenant_id: TENANT,
              caja_id: cajas[0].id,
              tipo: 'egreso',
              monto_neto: 25000,
              monto_bruto: 25000,
              descripcion: 'Gasto test E2E A6',
              proyecto_id: proyectoId,
              fecha: new Date().toISOString().slice(0, 10),
            })
            .select('id')
            .single()
          movId = mov?.id ?? null

          expect(movError).toBeNull()

          // Call RPC
          const { data: consumido } = await supabase
            .rpc('fn_presupuesto_consumido', { p_proyecto_id: proyectoId })

          expect(consumido).toBe(25000)
        }
      }
    } finally {
      if (movId) await supabase.from('movimientos_caja').delete().eq('id', movId)
      if (proyectoId) await supabase.from('proyectos').delete().eq('id', proyectoId)
    }
  })

  // =========================================================================
  // Escenario 6 — Tab Proyectos en ficha de persona
  // =========================================================================
  test('Escenario 6: Tab Proyectos aparece en ficha de persona', async ({ page }) => {
    const supabase = serviceRole()
    let proyectoId: string | null = null

    try {
      // Get Yair's persona
      const personaId = '3d2d5902-9c10-4154-8086-316b0fbe081e'

      // Create project with Yair as responsable
      const { data: proyecto } = await supabase
        .from('proyectos')
        .insert({
          tenant_id: TENANT,
          nombre: 'Proyecto Persona E2E A6',
          estado: 'en_curso',
          responsable_persona_id: personaId,
          moneda: 'ARS',
          color: '#8B5CF6',
        })
        .select('id')
        .single()
      proyectoId = proyecto?.id ?? null

      if (proyectoId) {
        // Add as member too
        await supabase.from('proyecto_miembros').upsert({
          proyecto_id: proyectoId,
          persona_id: personaId,
          rol: 'responsable',
        })

        // Navigate to persona detail
        await page.goto(`/admin/personas/${personaId}`)
        await page.waitForLoadState('networkidle')

        // Look for Proyectos tab
        const proyectosTab = page.getByRole('tab', { name: /proyecto/i })
        await expect(proyectosTab).toBeVisible({ timeout: 10000 })

        // Click it
        await proyectosTab.click()
        await page.waitForTimeout(500)

        // Verify project appears
        await expect(page.getByText('Proyecto Persona E2E A6')).toBeVisible({ timeout: 10000 })
      }
    } finally {
      if (proyectoId) {
        await supabase.from('proyecto_miembros').delete().eq('proyecto_id', proyectoId)
        await supabase.from('proyectos').delete().eq('id', proyectoId)
      }
    }
  })
})
