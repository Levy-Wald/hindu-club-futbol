# H7 — Performance Audit (18-may-2026)

## Resumen ejecutivo

- **BD:** 166 tablas, 34 vistas, 347 indices custom
- **pg_stat_statements:** 501 queries con > 1 call, 946K calls totales, 177s tiempo acumulado
- **Top issues detectados:** 0 criticos
- **Indices agregados en H7:** 0 (no se detectaron problemas reales)
- **Candidatas a materialized view (deuda Tramo 12):** 0 (todas < 2ms)
- **Bundle frontend:** 7.8MB JS total (171 chunks), chunk max 440KB, CSS 196KB
- **Optimizaciones frontend aplicadas:** 0 (no hay lodash/moment, chunks bajo umbral)

## Top 5 queries mas lentas

| # | Query | Calls | Total (ms) | Mean (ms) | % Total |
|---|-------|-------|-----------|-----------|---------|
| 1 | LOCK TABLE realtime.schema_migrations | 121 | 40,268 | 332.8 | 22.8% |
| 2 | SELECT name FROM pg_timezone_names | 386 | 36,004 | 93.3 | 20.4% |
| 3 | DELETE FROM personas (cleanup script) | 7 | 31,800 | 4,543 | 18.0% |
| 4 | PostgREST introspection (pks_fks CTE) | 386 | 8,976 | 23.3 | 5.1% |
| 5 | PostgREST base_types CTE | 386 | 8,307 | 21.5 | 4.7% |

**Analisis:** Las 5 queries mas lentas son todas de infraestructura Supabase (realtime, PostgREST introspection, auth). La query #3 es un script de limpieza manual que se ejecuto 7 veces. **Ninguna query de la aplicacion aparece en el top 20.** Las queries de app (auth sessions, identities, etc.) tienen mean < 0.04ms.

## Indices agregados en este sprint

Ninguno. No se detectaron tablas con `seq_scan >> idx_scan` en tablas con > 500 filas. El resultado del analisis de indices faltantes fue **vacio** — los 347 indices existentes cubren adecuadamente los patrones de acceso actuales.

## Performance de vistas criticas (EXPLAIN ANALYZE)

| Vista | Exec Time | Planning | Candidata MV | Notas |
|-------|----------|----------|-------------|-------|
| v_libro_mayor | 1.16ms | 4.82ms | NO | Hash joins sobre 5 filas movimientos_caja |
| v_balance_cuentas | 0.53ms | 1.78ms | NO | Aggregate sobre plan_cuentas (104 filas) |
| v_estado_cobranzas | 1.39ms | 3.44ms | NO | Merge join + memoize, 102 cuotas |
| v_comparativa_equipos | 1.28ms | 4.41ms | NO | 8 equipos, usa indices existentes |
| v_socios_activos | 1.09ms | 3.34ms | NO | 51 suscripciones activas, index scans |
| v_stats_equipo | 0.92ms | 3.87ms | NO | SubPlans con bitmap index scans |
| v_performance_jugadores | 0.82ms | 4.64ms | NO | Merge right join, 100 filas en < 1ms |

**Conclusion:** Todas las vistas estan sub-2ms de ejecucion. Ninguna es candidata a materializacion con el volumen de datos actual. Esto puede cambiar si Hindu crece a > 10K personas o > 1K eventos.

## RLS overhead detection

Top 10 policies con subqueries (por longitud de qual):

| Tabla | Policy | Largo | Tipo |
|-------|--------|-------|------|
| com_mensajes | com_mensajes_update | 226 | SELECT personas + es_admin_tenant() |
| com_mensajes | com_mensajes_select | 226 | SELECT personas + es_admin_tenant() |
| import_field_conflicts | tenant_read | 214 | EXISTS JOIN import_rows + import_runs |
| import_field_conflicts | tenant_all | 214 | EXISTS JOIN import_rows + import_runs |
| com_envios | com_envios_select | 213 | SELECT personas + es_admin_tenant() |
| import_rows | tenant_read | 151 | EXISTS JOIN import_runs |
| import_rows | tenant_all | 151 | EXISTS JOIN import_runs |
| productos_variantes | via_producto | 150 | IN (SELECT productos) |
| producto_categoria_links | via_producto | 150 | IN (SELECT productos) |
| producto_imagenes | via_producto | 150 | IN (SELECT productos) |

**Analisis:** Las policies mas complejas son de com_mensajes (lookup persona por user_id + check admin). Con < 1.4K envios y < 2.4K personas, el overhead es imperceptible. Registrado como deuda para Tramo 12 T4 si el volumen crece.

## Tablas con mas filas

| Tabla | Filas |
|-------|-------|
| audit_log | 46,664 |
| personas_atributos | 2,583 |
| personas_padrones | 2,561 |
| personas | 2,395 |
| personas_disciplinas | 2,111 |
| com_envios | 1,381 |
| eventos | 280 |
| personas_equipos | 212 |

## Bundle frontend

- **Total JS:** 7.8MB (171 chunks)
- **Total CSS:** 196KB
- **Chunk maximo:** 440KB (bajo umbral de 500KB)
- **Librerias pesadas:** recharts (4 archivos), react-big-calendar (3 archivos)
- **lodash:** NO presente
- **moment:** NO presente (usa date-fns)
- **next/dynamic lazy loading:** 1 uso existente (personas-table)

### Top 5 chunks mas grandes

| Chunk | Tamano |
|-------|--------|
| 0_v-0y2bwy4le.js | 440KB |
| 0_2c3k8zja.0q.js | 404KB |
| 11oxvoj.p8knc.js | 380KB |
| 0nz.7psvn9p41.js | 312KB |
| 034r5-m-ho-nw.js | 312KB |

### Cambios aplicados

Ninguno necesario:
- No hay lodash (nada que reemplazar)
- No hay moment (ya usa date-fns)
- recharts y react-big-calendar son componentes `'use client'` importados en paginas server — Next.js hace code-splitting automatico por ruta
- Ningun chunk individual > 500KB

## Deuda registrada para Tramo 12 T4

1. **Materialized views:** Re-evaluar v_comparativa_equipos y v_performance_jugadores cuando haya > 1K eventos y > 5K personas
2. **RLS optimization:** Policies com_mensajes con double subquery (persona lookup + admin check) — monitorear si com_envios crece > 10K
3. **Load testing:** No realizado. Ejecutar con tráfico simulado post-demo
4. **Bundle analysis profundo:** Considerar `@next/bundle-analyzer` para identificar tree-shaking opportunities en recharts
5. **react-big-calendar lazy loading:** Considerar `next/dynamic` con `ssr: false` para los 3 calendarios si el First Load JS crece
6. **pg_stat_statements refresh:** Re-correr este audit despues de FASE C cuando haya trafico real de Hindu. Los datos actuales son mayormente de desarrollo/testing

## Conclusion

- **Estado actual de performance:** ACEPTABLE
- **Riesgo para FASE C demo Hindu:** BAJO
- **Justificacion:** Todas las queries de app son sub-1ms, todas las vistas criticas sub-2ms, indices existentes cubren todos los patrones de acceso, bundle frontend bajo umbrales, no hay librerias pesadas innecesarias. El unico riesgo potencial es con volumen de datos significativamente mayor, pero para una demo con ~2.4K personas es mas que suficiente.

**Nota:** Este audit tiene data limitada de pg_stat_statements (mayormente trafico de desarrollo, no usuarios reales). Se recomienda re-correr H7 despues de FASE C cuando haya trafico real.
