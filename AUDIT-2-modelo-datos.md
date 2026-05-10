# PARTE 2 — Modelo de datos

## 2.1 Tablas en schema public (agrupadas por dominio)

> Row counts verificados contra la DB real del tenant Hindu (`11111111-1111-1111-1111-111111111111`).
> **Totales reales: 99 tablas, 311 RLS policies, 100% tablas con RLS habilitado.**

### Personas y relacionados

| Tabla | Tipo | RLS | Rows | Notas |
|-------|------|-----|------|-------|
| `personas` | Transaccional | Sí | **2,389** | 106 columnas. `numero_documento` nullable desde Sprint 14c.1.2 |
| `personas_atributos` | Transaccional | Sí | **2,569** | Asignación de roles/atributos a personas |
| `personas_padrones` | Transaccional | Sí | **2,561** | Membresía persona↔padrón con estado, tipo socio, etc. |
| `personas_equipos` | Transaccional | Sí | **211** | Asignación persona↔equipo con rol. UNIQUE(tenant,persona,equipo,rol) |
| `personas_vinculos` | Transaccional | Sí | — | Vínculos bidireccionales (padre↔hijo, cónyuge, etc.) |
| `personas_datos_medicos` | Transaccional | Sí | — | Datos médicos de la persona |
| `personas_datos_laborales` | Transaccional | Sí | — | 1:1 con persona, datos RRHH |
| `personas_datos_alimentarios` | Transaccional | Sí | — | Datos alimentarios |
| `personas_datos_economicos` | Transaccional | Sí | — | Datos económicos |
| `personas_documentos_identidad` | Transaccional | Sí | — | DNI, pasaporte, etc. |
| `personas_documentos_medicos` | Transaccional | Sí | — | Aptos médicos, certificados |
| `personas_contactos_emergencia` | Transaccional | Sí | — | Contactos de emergencia |
| `personas_credenciales_acceso` | Transaccional | Sí | — | Credenciales de acceso |
| `personas_lesiones` | Transaccional | Sí | — | Historial de lesiones |
| `personas_rehabilitaciones` | Transaccional | Sí | — | Seguimiento rehabilitación |
| `personas_vehiculos` | Transaccional | Sí | — | Vehículos registrados |
| `personas_obra_social` | Transaccional | Sí | — | Obra social/prepaga |
| `personas_eventos_personales` | Transaccional | Sí | — | Eventos personales |
| `personas_autorizaciones` | Transaccional | Sí | — | Autorizaciones |
| `personas_clubes_anteriores` | Transaccional | Sí | — | Clubes anteriores |
| `personas_historial_categoria_deportiva` | Transaccional | Sí | — | Historial categoría |
| `personas_historial_padron` | Transaccional | Sí | — | Historial de padrón |
| `personas_idiomas` | Transaccional | Sí | — | Idiomas |
| `personas_incidentes_internos` | Transaccional | Sí | — | Incidentes internos |
| `personas_media` | Transaccional | Sí | — | Media files |
| `personas_preferencias_comunicacion` | Transaccional | Sí | — | Preferencias comunicación |
| `personas_premios_logros` | Transaccional | Sí | — | Premios y logros |
| `personas_selecciones` | Transaccional | Sí | — | Selecciones nacionales |
| `personas_talles` | Transaccional | Sí | — | Talles de indumentaria |

### Padrones e imports

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `padrones` | Transaccional | Sí | **4** | Padrones del club |
| `padron_syncs` | Transaccional | Sí | — | **Legacy.** Reemplazado por `import_runs` |
| `padron_sync_diffs` | Transaccional | Sí | — | **Legacy.** Reemplazado por `import_rows` |
| `import_pipelines` | Maestro | Sí | **3** | Pipelines: jugadores, padron_socios, suscriptores |
| `import_runs` | Transaccional | Sí | **2** | Ambos en estado `aplicado` |
| `import_rows` | Transaccional | Sí | **268** | **Sin tenant_id** (tabla global) |
| `import_field_conflicts` | Transaccional | Sí | — | Conflictos de campos en import |

### Equipos y deportes

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `equipos` | Transaccional | Sí | **7** | Equipos del club |
| `categorias_equipo` | Maestro | Sí | — | Categorías (Sub-12, Primera, etc.) |
| `equipos_competencias` | Transaccional | Sí | — | Competencias de equipos |
| `eventos` | Transaccional | Sí | **0** | Tabla central de eventos (Sprint 11.5). Sin datos. |
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
| `catalogo_estados_persona` | Maestro/global | Sí | En uso |
| `catalogo_planes_comerciales` | Maestro/global | Sí | En uso |
| `catalogo_tipos_autorizacion` | Maestro/global | Sí | En uso |
| `catalogo_tipos_evento` | Maestro/global | Sí | En uso |
| `catalogo_tipos_talle` | Maestro/global | Sí | En uso |
| `catalogo_modulos` | Maestro/global | Sí | En uso (33 módulos declarados) |

**Nota:** `catalogo_atributos` NO tiene columna `tenant_id` — es tabla global.

### Finanzas

| Tabla | Tipo | RLS | Estado | Notas |
|-------|------|-----|--------|-------|
| `cajas` | Transaccional | Sí | **3** | Cajas de dinero |
| `movimientos_caja` | Transaccional | Sí | **0** | Movimientos financieros — **vacío** |
| `plan_cuentas` | Maestro | Sí | **104** | Plan de cuentas contable jerárquico |
| `productos_servicios` | Transaccional | Sí | **0** | Productos ERP (13 tipos, 30+ campos) — **vacío** |
| `producto_proveedor` | Transaccional | Sí | **0** | Relación producto↔proveedor |
| `cuotas_planes` | Maestro | Sí | En uso | Planes de cuotas |
| `cuotas_emitidas` | Transaccional | Sí | **0** | Cuotas emitidas — **vacío** |
| `cuotas_generadas` | Transaccional | Sí | **0** | Cuotas por persona — **vacío** |
| `cuotas_bonificaciones` | Transaccional | Sí | En uso | Bonificaciones |
| `emisiones_cuota` | Transaccional | Sí | En uso | Emisiones masivas de cuotas |
| `cuentas_corrientes` | Transaccional | Sí | En uso | Cuentas corrientes |
| `centros_costo` | Maestro | Sí | En uso | Centros de costo |
| `medios_pago` | Maestro | Sí | **7** | Medios de pago (seedeados) |
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

- **Total tablas:** 99 (verificado contra DB)
- **Total RLS policies:** 311
- **RLS habilitado:** 99/99 tablas (100%)
- **Personas Hindu:** 2,389 — con 2,347 con atributo `socio_padron`
- **Legacy activo:** `padron_syncs`, `padron_sync_diffs` (conviven con `import_runs`/`import_rows`)
- **Sin UI:** `esquemas_tacticos`, `esquema_posiciones`
- **Sin datos operativos:** `eventos` (0), `movimientos_caja` (0), `productos_servicios` (0), `cuotas_emitidas` (0)
- **VIEWs fin_*:** 10 VIEWs backward-compat, código aún usa nombres originales
- **Tablas globales (sin tenant_id):** `catalogo_atributos`, `import_rows`

## 2.3 Funciones SQL custom y triggers

### Funciones helper (core)

| Función | Tipo | Propósito |
|---------|------|-----------|
| `get_tenant_actual()` | SECURITY DEFINER | Devuelve tenant_id del usuario logueado |
| `get_persona_actual()` | SECURITY DEFINER | Devuelve persona logueada con atributos |
| `get_persona_fk_references()` | Función | FK references de persona (para protección financiera) |
| `tiene_atributo(slug)` | SECURITY DEFINER | Check si persona tiene atributo |
| `tiene_atributo_namespace(modulo, roles[])` | SECURITY DEFINER | Check con namespace (Sprint 11.6) |
| `modulo_activo(slug)` | SECURITY DEFINER | Check si módulo activo en tenant |
| `dedupe_persona_por_dni(tenant, dni, datos)` | SECURITY DEFINER | Busca/crea persona por DNI |
| `es_menor_de_edad(uuid)` | SECURITY DEFINER | Check si persona es menor |
| `es_admin_sistema()` | SECURITY DEFINER | Check si es admin sistema |
| `es_admin_tenant()` | SECURITY DEFINER | Check si es admin tenant |
| `puede_operar_comunicaciones()` | SECURITY DEFINER | Check permisos comunicaciones |
| `puede_operar_finanzas()` | SECURITY DEFINER | Check permisos finanzas |
| `puede_operar_rrhh()` | SECURITY DEFINER | Check permisos RRHH |

### Funciones financieras (triggers)

| Función | Tipo | Propósito |
|---------|------|-----------|
| `fn_calcular_monto_neto()` | Trigger | Calcula monto neto en movimientos |
| `fn_actualizar_saldo_caja()` | Trigger | Actualiza saldo de caja tras movimiento |
| `fn_actualizar_cuenta_corriente()` | Trigger | Actualiza cuenta corriente |
| `fn_numerar_movimiento()` | Trigger | Auto-numera movimientos |
| `fn_aplicar_mora()` | Función | Aplica mora a cuotas vencidas |
| `fn_vencer_cuotas()` | Función | Marca cuotas como vencidas |

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

### Extensiones cargadas

- `citext` — case-insensitive text (en schema public, debería estar en extensions — Sprint 16)
- `pg_trgm` — trigram matching (para búsqueda fuzzy)
- `unaccent` — strip acentos

### Triggers

~80 trigger registrations. Patrones principales:

| Trigger | Tabla(s) | Propósito |
|---------|---------|-----------|
| `*_set_updated_at` | Casi todas (BEFORE UPDATE) | Auto-actualiza `updated_at` |
| `personas_audit` | `personas` (AFTER INSERT/UPDATE/DELETE) | Audit log |
| `tenants_audit` | `tenants` | Audit log |
| `personas_atributos_audit` | `personas_atributos` | Audit log |
| `trg_actualizar_cuenta_corriente` | `movimientos_caja` (AFTER INSERT/UPDATE) | Actualiza cuenta corriente |
| `trg_actualizar_saldo_caja` | `movimientos_caja` (AFTER INSERT/UPDATE) | Actualiza saldo caja |
| `trg_calcular_monto_neto` | `movimientos_caja` (BEFORE INSERT/UPDATE) | Calcula monto neto |
| `trg_numerar_movimiento` | `movimientos_caja` (BEFORE INSERT) | Auto-numera |

**Total funciones:** 27 funciones custom

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
