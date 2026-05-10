# PARTE 2 — Modelo de datos

## 2.1 Tablas en schema public (agrupadas por dominio)

> Nota: Los row counts exactos se obtienen de la DB del tenant Hindu (`11111111-1111-1111-1111-111111111111`).
> Las tablas marcadas "no auditado" no pudieron verificarse en esta sesión.

### Personas y relacionados

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `personas` | Transaccional | Sí | En uso | ~900+ filas (importadas via padrones). 106 columnas. `numero_documento` nullable desde Sprint 14c.1.2 |
| `personas_atributos` | Transaccional | Sí | En uso | Asignación de roles/atributos a personas |
| `personas_padrones` | Transaccional | Sí | En uso | Membresía persona↔padrón con estado, tipo socio, etc. |
| `personas_equipos` | Transaccional | Sí | En uso | Asignación persona↔equipo con rol. UNIQUE(tenant,persona,equipo,rol) |
| `personas_vinculos` | Transaccional | Sí | En uso | Vínculos bidireccionales (padre↔hijo, cónyuge, etc.) |
| `personas_datos_medicos` | Transaccional | Sí | En uso | Datos médicos de la persona |
| `personas_documentos_identidad` | Transaccional | Sí | En uso | DNI, pasaporte, etc. |
| `personas_documentos_medicos` | Transaccional | Sí | En uso | Aptos médicos, certificados |
| `personas_lesiones` | Transaccional | Sí | En uso | Historial de lesiones |
| `personas_rehabilitaciones` | Transaccional | Sí | En uso | Seguimiento rehabilitación |
| `personas_vehiculos` | Transaccional | Sí | En uso | Vehículos registrados |
| `personas_obra_social` | Transaccional | Sí | En uso | Obra social/prepaga |
| `personas_eventos_personales` | Transaccional | Sí | En uso | Eventos personales (cumpleaños, etc.) |
| `personas_datos_laborales` | Transaccional | Sí | En uso | 1:1 con persona, datos RRHH |

### Padrones e imports

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `padrones` | Transaccional | Sí | En uso | Padrones del club. ~3 (Global, Jugadores, Suscriptores) |
| `padron_syncs` | Transaccional | Sí | **Legacy** | Sistema viejo de sync. Reemplazado por `import_runs` |
| `padron_sync_diffs` | Transaccional | Sí | **Legacy** | Diffs del sistema viejo. Reemplazado por `import_rows` |
| `import_pipelines` | Maestro | Sí | En uso | Config de pipelines de importación. 2 pipelines (jugadores, suscriptores) |
| `import_runs` | Transaccional | Sí | En uso | Runs de importación. ~5+ runs |
| `import_rows` | Transaccional | Sí | En uso | Filas individuales de cada run. ~1000+ filas |

### Equipos y deportes

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `equipos` | Transaccional | Sí | En uso | Equipos del club. ~50+ (creados via import) |
| `categorias_equipo` | Maestro | Sí | En uso | Categorías (Sub-12, Primera, etc.) |
| `eventos` | Transaccional | Sí | En uso | Tabla central de eventos (Sprint 11.5) |
| `evento_asistencias` | Transaccional | Sí | En uso | Asistencias a eventos |
| `equipos_horarios` | VIEW | — | **Legacy** | VIEW backward-compat sobre `eventos` |
| `partidos_detalle` | Transaccional | Sí | En uso | Satélite 1:1 de eventos tipo partido |
| `scouting_fichas` | Transaccional | Sí | En uso | Fichas de scouting |
| `esquemas_tacticos` | Transaccional | Sí | Creada, sin UI | Esquemas tácticos (UI diferida) |
| `esquema_posiciones` | Transaccional | Sí | Creada, sin UI | Posiciones en esquema |

### Catálogos

| Tabla | Tipo | RLS | Estado |
|-------|------|-----|--------|
| `catalogo_atributos` | Maestro/tenant | Sí | En uso |
| `catalogo_disciplinas` | Maestro/tenant | Sí | En uso |
| `catalogo_estados_padron` | Maestro/tenant | Sí | En uso |
| `catalogo_tipos_socio` | Maestro/tenant | Sí | En uso |
| `catalogo_roles_equipo` | Maestro/tenant | Sí | En uso |
| `catalogo_motivos_baja` | Maestro/tenant | Sí | En uso |
| `catalogo_tipos_vinculo` | Maestro/global | Sí | En uso |
| `catalogo_niveles_competencia` | Maestro/global | Sí | En uso |
| `catalogo_tipos_documento` | Maestro/global | Sí | En uso |
| `catalogo_tipos_estudio` | Maestro/global | Sí | En uso |
| `catalogo_obras_sociales` | Maestro/tenant | Sí | En uso |
| `catalogo_tipos_vehiculo` | Maestro/global | Sí | En uso |
| `catalogo_companias_seguro` | Maestro/global | Sí | En uso |
| `catalogo_categorias_movimiento` | Maestro/tenant | Sí | En uso |
| `catalogo_tipos_evento_personal` | Maestro/global | Sí | En uso |
| `catalogo_areas_trabajo` | Maestro/tenant | Sí | En uso (10 seeds) |
| `catalogo_puestos` | Maestro/tenant | Sí | En uso (10 seeds) |
| `catalogo_roles_laborales` | Maestro/tenant | Sí | En uso (6 seeds) |
| `catalogo_indumentaria` | Maestro | Sí | En uso |
| `catalogo_modulos` | Maestro/global | Sí | En uso (33 módulos declarados) |

### Finanzas

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `cajas` | Transaccional | Sí | En uso | Cajas de dinero |
| `movimientos_caja` | Transaccional | Sí | En uso | Movimientos financieros |
| `plan_cuentas` | Maestro | Sí | En uso | Plan de cuentas contable jerárquico |
| `productos_servicios` | Transaccional | Sí | En uso | Productos ERP (13 tipos, 30+ campos) |
| `cuotas_planes` | Maestro | Sí | En uso | Planes de cuotas |
| `cuotas_emitidas` | Transaccional | Sí | En uso | Cuotas emitidas |
| `cuotas_generadas` | Transaccional | Sí | En uso | Cuotas por persona |
| `cuotas_bonificaciones` | Transaccional | Sí | En uso | Bonificaciones |
| `emisiones_cuota` | Transaccional | Sí | En uso | Emisiones masivas de cuotas |
| `cuentas_corrientes` | Transaccional | Sí | En uso | Cuentas corrientes |
| `centros_costo` | Maestro | Sí | En uso | Centros de costo |
| `medios_pago` | Maestro | Sí | En uso | Medios de pago |
| `tipos_comprobante` | Maestro | Sí | En uso | Tipos de comprobante |
| `periodos_contables` | Maestro | Sí | En uso | Períodos contables |
| `config_financiera` | Config | Sí | En uso | Config por tenant |
| `convenios_pago` | Transaccional | Sí | En uso | Convenios de pago |
| `cotizaciones` | Transaccional | Sí | En uso | Cotizaciones |

**VIEWs financieras (Sprint 11.7):** `fin_cajas`, `fin_movimientos`, `fin_productos`, `fin_categorias_movimiento`, `fin_plan_cuentas`, `fin_cuotas_planes`, `fin_cuotas_emitidas`, `fin_emisiones_cuota`, `fin_cuotas_bonificaciones`, `fin_producto_proveedor` — todas con SECURITY INVOKER.

### Entidades

| Tabla | Tipo | RLS | Estado |
|-------|------|-----|--------|
| `entidades` | Transaccional | Sí | En uso |
| `entidades_representantes` | Transaccional | Sí | En uso |
| `sedes` | Transaccional | Sí | En uso |
| `canchas` | Transaccional | Sí | En uso |

### RRHH

| Tabla | Tipo | RLS | Estado |
|-------|------|-----|--------|
| `rrhh_contratos` | Transaccional | Sí | En uso |
| `rrhh_liquidaciones` | Transaccional | Sí | En uso |

### Comunicaciones (Sprint 12)

| Tabla | Tipo | RLS | Estado |
|-------|------|-----|--------|
| `com_plantillas` | Maestro | Sí | En uso (18 seeds) |
| `com_mensajes` | Transaccional | Sí | En uso |
| `com_envios` | Transaccional | Sí | En uso |

### API y sistema

| Tabla | Tipo | RLS | Estado |
|-------|------|-----|--------|
| `tenants` | Config | Sí | En uso (1 tenant: Hindu) |
| `tenant_config_publica` | Config | Sí | En uso |
| `tenant_modulos` | Config | Sí | En uso |
| `pre_inscripciones` | Transaccional | Sí | En uso |
| `user_vistas` | Transaccional | Sí | En uso |
| `audit_log` | Transaccional | Sí | En uso |
| `solicitudes` | Transaccional | Sí | En uso (indumentaria) |
| `api_keys` | Config | Sí | En uso |
| `api_logs` | Transaccional | Sí | En uso |

### VIEWs adicionales

| VIEW | Fuente | Estado |
|------|--------|--------|
| `v_vencimientos_proximos` | 9 fuentes (cuotas, aptos, DNI, pasaporte, etc.) | En uso |
| `v_estado_financiero_persona` | Movimientos + cuotas | En uso (SECURITY INVOKER) |
| `v_estado_financiero_entidad` | Movimientos | En uso (SECURITY INVOKER) |
| `equipos_horarios` | VIEW sobre `eventos` | Legacy backward-compat |

## 2.2 Resumen de estados

- **Total tablas estimadas:** ~90+ (incluyendo VIEWs)
- **RLS habilitado:** en todas las tablas
- **Legacy activo:** `padron_syncs`, `padron_sync_diffs` (conviven con `import_runs`/`import_rows`)
- **Sin UI:** `esquemas_tacticos`, `esquema_posiciones`
- **VIEWs fin_*:** 10 VIEWs backward-compat, código aún usa nombres originales

## 2.3 Funciones SQL custom y triggers

### Funciones helper (core)

| Función | Tipo | Propósito |
|---------|------|-----------|
| `get_tenant_actual()` | SECURITY DEFINER | Devuelve tenant_id del usuario logueado |
| `get_persona_actual()` | SECURITY DEFINER | Devuelve persona logueada con atributos |
| `tiene_atributo(slug)` | SECURITY DEFINER | Check si persona tiene atributo |
| `tiene_atributo_namespace(modulo, roles[])` | SECURITY DEFINER | Check con namespace (Sprint 11.6) |
| `modulo_activo(slug)` | SECURITY DEFINER | Check si módulo activo en tenant |
| `dedupe_persona_por_dni(tenant, dni, datos)` | SECURITY DEFINER | Busca/crea persona por DNI |
| `es_menor_de_edad(uuid)` | SECURITY DEFINER | Check si persona es menor |
| `fn_calcular_monto_neto(...)` | Función | Cálculo financiero |
| `puede_operar_comunicaciones()` | SECURITY DEFINER | Check permisos comunicaciones |

### Funciones de importación (Sprint 14c)

| Función | Propósito |
|---------|-----------|
| `normalize_name(text)` | Strip acentos, apóstrofes, lowercase, collapse whitespace |
| `match_persona_fuzzy(tenant, apellido, nombre, dni)` | Matching fuzzy por tokens con scoring |
| `resolver_o_crear_equipo(tenant, nombre, categoría)` | Busca o crea equipo |

### Funciones API (Sprint 13)

| Función | Propósito |
|---------|-----------|
| `fn_validar_api_key(key_hash)` | Valida API key por hash SHA-256 |
| `fn_chequear_rate_limit(key_id, limit)` | Rate limiting por API key |

### Triggers

| Trigger | Tabla(s) | Propósito |
|---------|---------|-----------|
| `trg_set_updated_at` | Todas las core | Auto-actualiza `updated_at` |
| `trg_audit_log` | Tablas core | Registra cambios en `audit_log` |

**Total funciones estimado:** ~66 (según advisor report)

## 2.4 Migrations

**Total archivos:** 36 archivos SQL en `supabase/migrations/`
**Total líneas:** 6,343 líneas de SQL
**Init consolidado:** `20260504220000_clubcore_init.sql` (el más grande)
**Última migration:** `20260510_sprint14c2_suscriptores_pipeline.sql`

### Lista completa de migrations

| Archivo | Sprint | Contenido |
|---------|--------|-----------|
| `20260504220000_clubcore_init.sql` | 1 | Schema completo inicial (todas las tablas core) |
| `20260504222811_fixes_seed_hindu.sql` | 1 | Fixes al seed |
| `20260504230000_seed_hindu.sql` | 1 | Seed datos Hindu |
| `20260505010000_lesiones_rehabilitaciones.sql` | 2 | Lesiones y rehabilitaciones |
| `20260505020000_user_vistas.sql` | UX | Vistas guardadas por usuario |
| `20260505100000_entidades_representantes.sql` | 6 | Entidades y representantes |
| `20260505200000_sprint7_solicitudes_indumentaria.sql` | 7 | Solicitudes de indumentaria |
| `20260505210000_equipo_torneo.sql` | 7 | Equipo-torneo |
| `20260505220000_eventos_calendario.sql` | 7 | Eventos y calendario |
| `20260505_sprint8_public_pages.sql` | 8 | Páginas públicas |
| `20260506_modulo_finanzas.sql` | 9 | Módulo finanzas (tablas core) |
| `20260506_modulo_finanzas_seed.sql` | 9 | Seed finanzas |
| `20260506_modulo_finanzas_tipos_producto.sql` | 9 | Tipos de producto |
| `20260506_modulo_finanzas_producto_erp.sql` | 9 | Producto ERP expandido |
| `20260506_branding_campos_extra.sql` | 9 | Campos branding |
| `20260506_fix_rls_producto_proveedor.sql` | 9 | Fix RLS producto-proveedor |
| `20260506_sprint10_operaciones.sql` | 10 | Operaciones deportivas |
| `20260506_sprint11_rrhh.sql` | 11 | RRHH contratos y liquidaciones |
| `20260506_sprint11_1_datos_laborales.sql` | 11.1 | Datos laborales |
| `20260506_plan_cuentas_expansion.sql` | 9+ | Plan de cuentas expandido |
| `20260507_sprint115_refactor_eventos.sql` | 11.5 | Refactor eventos centrales |
| `20260507_sprint116_atributos_namespacing.sql` | 11.6 | Atributos namespaced |
| `20260507_sprint117_finanzas_views.sql` | 11.7 | VIEWs fin_* |
| `20260507_sprint12_comunicaciones.sql` | 12 | Comunicaciones |
| `20260507_sprint13_api_keys.sql` | 13 | API keys y logs |
| `20260507_sprint14a_padron_sync.sql` | 14a | Sync de padrones (legacy) |
| `20260507_sprint14a5_review_columns.sql` | 14a.5 | Columnas de revisión |
| `20260508_sprint14a6_nombre_confianza.sql` | 14a.6 | Nombre confianza |
| `20260508_sprint14a9_fusion_personas.sql` | 14a.9 | Fusión de personas |
| `20260508_sprint14c0_import_platform.sql` | 14c.0 | Plataforma de ingestión genérica |
| `20260508_sprint14c01_match_fuzzy_tokens.sql` | 14c.0.1 | Match fuzzy por tokens |
| `20260509_sprint14c1_equipos_import.sql` | 14c.1 | Import equipos/jugadores |
| `20260510_sprint14c11_imports_padrones_integration.sql` | 14c.1.1 | Integración imports↔padrones |
| `20260509_fix_normalize_name_apostrophes.sql` | 14c.1.1 | Fix apóstrofes en normalize_name |
| `20260510_fix_personas_numero_documento_nullable.sql` | 14c.1.2 | numero_documento nullable |
| `20260510_sprint14c2_suscriptores_pipeline.sql` | 14c.2 | Pipeline suscriptores + padrón |
