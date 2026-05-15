# Audit H3 — Backfill de datos demo sinteticos

**Sprint**: H3
**Fecha**: 2026-05-15
**Tag**: `v0.29.3-hardening-h3`

---

## 1. Limpieza previa

### Padron "e"
- **ID**: `3e272eff-744d-4292-b923-1f9b2946e75a`
- **Estado**: Confirmado test contaminado (nombre: "e", slug: "e", 0 miembros)
- **Accion**: `UPDATE padrones SET activo = false` (tabla sin `deleted_at`, usa `activo` boolean)

### Personas sospechosas
- Busqueda: `nombre <= 2 caracteres` o `nombre ~* '^(test|asd|aaa|xxx)$'`
- **Resultado**: 0 personas sospechosas encontradas

### Productos sospechosos
- Busqueda: `nombre <= 2 caracteres` o `nombre ~* '^(test|asd|aaa|xxx|e)$'`
- **Resultado**: 0 productos sospechosos encontrados

---

## 2. Datos demo generados

| Tabla | Filas creadas | Filas totales (post-seed) | Criterio DEMO |
|-------|-------------|--------------------------|---------------|
| `productos` | 7 | 10 | `nombre LIKE 'DEMO_%'` |
| `productos_variantes` | 20 | 29 | `nombre_variante LIKE 'DEMO_%'` |
| `producto_listas_precios` | 2 | 10 | `nombre LIKE 'DEMO Lista%'` |
| `producto_precios` | 20 | 23 | `notas = 'DEMO_precio'` |
| `producto_stock_espacio` | 20 | 22 | `notas LIKE 'DEMO_%'` |
| `producto_movimientos_stock` | 30 | 32 | `notas = 'DEMO_movimiento'` |
| `cotizaciones` | 26 | 27* | `fuente = 'DEMO_seed'` |
| `convenios_pago` | 5 | 5 | `observaciones LIKE 'DEMO_%'` |
| `conciliacion_movimientos_bancarios` | 20 | 20 | `import_batch_id = 'a0000000-...-000000000001'` |
| `espacios` (depositos) | 2 | 5 | `nombre LIKE 'DEMO %'` |

*1 cotizacion pre-existente de seed anterior.

### Detalle por seccion

**Productos DEMO** (7 nuevos):
- DEMO_Remera Entrenamiento (reventa)
- DEMO_Short Deportivo (reventa)
- DEMO_Medias Oficial (reventa)
- DEMO_Campera Abrigo (reventa)
- DEMO_Pelota Entrenamiento (uso_interno_consumible)
- DEMO_Cuota Pileta (servicio)
- DEMO_Alquiler Quincho (servicio)

**Variantes** (5 productos x 4 talles = 20):
- Camiseta Titular: S/M/L/XL
- Camiseta Suplente: S/M/L/XL
- DEMO_Remera Entrenamiento: S/M/L/XL
- DEMO_Short Deportivo: S/M/L/XL
- DEMO_Campera Abrigo: S/M/L/XL

**Listas de precios** (2):
- DEMO Lista ARS 2026 (moneda: ARS)
- DEMO Lista USD 2026 (moneda: USD)
- 10 productos con precio en cada lista = 20 precios

**Depositos** (2):
- DEMO Deposito Principal (Sede Central)
- DEMO Deposito Secundario (Country)
- 10 productos con stock en cada deposito = 20 registros

**Movimientos de stock** (30 total):
- 20 entradas (feb-may 2026)
- 10 salidas (mar-may 2026)
- Distribuidos en ultimos 3 meses

**Cotizaciones USD/ARS** (26 semanales):
- Periodo: nov 2025 a may 2026
- Curva sintetica creciente: 1045/1055 -> 1330/1345
- Fuente: `DEMO_seed`

**Convenios de pago** (5):
- Todos estado `vigente`
- Deudas: $45.000 a $200.000
- Cuotas: 3 a 10
- Vencimientos proximos: jun 2026

**Conciliacion bancaria** (20):
- Caja: Banco CC (`9a80799b`)
- 10 conciliado (1 vinculado a movimiento real)
- 5 pendiente
- 5 discrepancia
- Batch: `a0000000-0000-0000-0000-000000000001`

---

## 3. Restricciones respetadas

- NO se usaron nombres reales de personas/entidades de Hindu Club
- Todos los datos demo usan prefijo `DEMO_` o `DEMO ` en nombres
- IDs generados automaticamente (UUIDs aleatorios, no en rangos especificos)
- Se usaron personas existentes solo para FK de convenios (offset 10, no los primeros)
- NO se crearon personas ni entidades nuevas

---

## 4. Notas tecnicas

- `padrones` no tiene `deleted_at`, usa `activo` boolean
- `cotizaciones` no tiene `deleted_at`
- `convenios_pago` no tiene `deleted_at`, estado CHECK: vigente/completado/incumplido/anulado
- `conciliacion_movimientos_bancarios` estado CHECK: pendiente/conciliado/discrepancia/ignorado
- `productos.tipo_uso` CHECK: reventa/uso_interno_consumible/uso_interno_bien_uso/servicio

---

## 5. Cleanup pre-FASE-C

Script: `scripts/seed-demo-h3-cleanup.sql`

Un solo `BEGIN/COMMIT` que elimina en orden de dependencias FK:
1. conciliacion_movimientos_bancarios (by batch_id)
2. convenios_pago (by observaciones DEMO_%)
3. cotizaciones (by fuente DEMO_seed)
4. producto_movimientos_stock (by notas)
5. producto_stock_espacio (by notas)
6. producto_precios (by notas)
7. productos_variantes (by nombre_variante)
8. producto_listas_precios (by nombre)
9. espacios (by nombre DEMO%)
10. productos (by nombre DEMO_%)
