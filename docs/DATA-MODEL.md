# DATA MODEL — Modelo de Datos

**Última actualización:** 26-may-2026  
**Métricas actuales:** 169 tablas · 355 políticas RLS · 126 funciones SQL · 97 triggers

Este documento describe la **estructura del modelo de datos** del producto. Es una vista de **arquitectura**, no un schema completo. Para schema literal, ver `supabase/migrations/`.

---

## Visión general

El modelo de datos se organiza en **6 capas**:

```
┌─────────────────────────────────────────────────────────────┐
│  6. Audit & Logs           (immutable trail)                │
├─────────────────────────────────────────────────────────────┤
│  5. UI Metadata            (sidebar config, layout state)   │
├─────────────────────────────────────────────────────────────┤
│  4. Auth & Security        (users, roles, sessions, perms)  │
├─────────────────────────────────────────────────────────────┤
│  3. Tenant Onboarding      (tenant lifecycle, wizards)      │
├─────────────────────────────────────────────────────────────┤
│  2. Vertical: ClubCore     (módulos específicos del bundle) │
├─────────────────────────────────────────────────────────────┤
│  1. Core Multi-tenant      (tenants, organizaciones)        │
└─────────────────────────────────────────────────────────────┘
```

**Total tablas por capa (aproximado):**

| Capa | Tablas | % del total |
|---|---|---|
| 1. Core multi-tenant | ~8 | 5% |
| 2. ClubCore vertical | ~110 | 65% |
| 3. Tenant onboarding | ~12 | 7% |
| 4. Auth & security | ~15 | 9% |
| 5. UI metadata | ~10 | 6% |
| 6. Audit & logs | ~14 | 8% |
| **TOTAL** | **~169** | **100%** |

---

## Capa 1 — Core multi-tenant

**Propósito:** identificar y aislar tenants.

### Tablas principales

| Tabla | Descripción |
|---|---|
| `tenants` | Registro maestro de cada cliente (Hindu, tenants futuros) |
| `tenant_settings` | Configuración específica por tenant (terminología, branding, defaults) |
| `tenant_subscriptions` | Plan contratado por tenant (pendiente: facturación cliente) |
| `organizations` | Sub-divisiones internas del tenant si aplica (ej: sedes Hindu) |

### Patrón clave

Toda tabla productiva tiene columna `tenant_id UUID NOT NULL REFERENCES tenants(id)` con índice y RLS policy `tenant_id = auth.jwt() ->> 'tenant_id'`.

---

## Capa 2 — ClubCore vertical

**Propósito:** módulos de negocio específicos de la vertical clubes deportivos.

Esta capa concentra **~65% de las tablas** porque es donde vive la lógica de negocio.

### Sub-áreas

#### 2.1 Personas (~25 tablas)

| Tabla principal | Tablas relacionadas |
|---|---|
| `personas` | `personas_contactos`, `personas_dependientes`, `personas_documentos`, `personas_autorizados`, `personas_observaciones` |
| `personas_familias` | `personas_familias_miembros`, `personas_familias_titular` |
| `personas_estados` | `personas_estados_historial`, `personas_motivos_baja` |

#### 2.2 Cuotas y cobranza (~20 tablas)

| Tabla principal | Tablas relacionadas |
|---|---|
| `cuotas` | `cuotas_items`, `cuotas_descuentos`, `cuotas_recargos`, `cuotas_pagos_aplicados` |
| `pagos` | `pagos_metodos`, `pagos_estados`, `pagos_conciliaciones` |
| `cobranza_planes` | `cobranza_plan_items`, `cobranza_morosidad` |

#### 2.3 Eventos (~15 tablas)

| Tabla principal | Tablas relacionadas |
|---|---|
| `eventos` | `eventos_categorias`, `eventos_tipos`, `eventos_recurrencia` |
| `eventos_inscripciones` | `eventos_asistencia`, `eventos_cupos`, `eventos_lista_espera` |

#### 2.4 Contabilidad (~15 tablas)

| Tabla principal | Tablas relacionadas |
|---|---|
| `cuentas_contables` | `cuentas_planes`, `cuentas_jerarquia` |
| `asientos` | `asientos_items`, `asientos_estados` |
| `cierres_periodo` | `cierres_validaciones` |

#### 2.5 Comunicación (~10 tablas)

| Tabla principal | Tablas relacionadas |
|---|---|
| `comunicados` | `comunicados_destinatarios`, `comunicados_envios`, `comunicados_estados` |
| `templates_email` | `templates_email_variables` |

#### 2.6 Reportes (~10 tablas)

| Tabla principal | Tablas relacionadas |
|---|---|
| `reportes_definiciones` | `reportes_filtros`, `reportes_programados`, `reportes_ejecuciones` |

#### 2.7 Configuración ClubCore (~15 tablas)

Configuración específica del bundle: categorías de socio, tipos de cuota, calendario académico, deportes, divisiones, etc.

---

## Capa 3 — Tenant onboarding

**Propósito:** lifecycle de creación y configuración inicial de tenants nuevos.

| Tabla | Descripción |
|---|---|
| `tenant_onboarding_steps` | Pasos del wizard de onboarding |
| `tenant_onboarding_state` | Estado de progreso de cada tenant en el wizard |
| `tenant_imports` | Importaciones masivas (CSV de socios, cuotas iniciales) |
| `tenant_imports_errors` | Errores detectados durante importaciones |
| `tenant_defaults` | Templates de configuración inicial por tipo de cliente |
| `tenant_wizard_logs` | Log de acciones durante onboarding |

**Estado:** parcialmente implementado. Wizard completo es parte de Fase D.

---

## Capa 4 — Auth & security

**Propósito:** autenticación, autorización, roles, permisos.

### Tablas principales

| Tabla | Descripción |
|---|---|
| `auth.users` (Supabase) | Usuarios autenticados |
| `auth.sessions` (Supabase) | Sesiones activas |
| `roles` | Catálogo de roles (admin, operador BO, socio, etc.) |
| `roles_permisos` | Permisos por rol |
| `usuarios_roles` | Asignación usuario ↔ rol (multi-rol soportado) |
| `permisos` | Catálogo granular de permisos |
| `usuarios_tenants` | Multi-tenant: un usuario puede pertenecer a N tenants con roles distintos |
| `password_policies` | Políticas de contraseña por tenant |
| `mfa_settings` | Configuración MFA (pendiente activación) |

### Decisión arquitectónica

**ADR-048:** sistema de roles y permisos multi-tenant — un usuario puede tener roles distintos en tenants distintos. La query de validación de permiso debe incluir siempre `tenant_id`.

---

## Capa 5 — UI metadata

**Propósito:** configuración de UI persistente (sidebar, layouts, preferencias).

| Tabla | Descripción |
|---|---|
| `ui_sidebar_config` | Configuración de los 7 espacios del sidebar BO |
| `ui_sidebar_items` | Items del sidebar (con `area_sidebar_bo`, `sub_area_sidebar_bo`, `nombre_display`, `prioridad_fase_c`, `interfaz_primaria`) |
| `ui_user_preferences` | Preferencias de UI por usuario (tema, idioma, layout) |
| `ui_module_visibility` | Visibilidad de módulos por rol |
| `ui_navigation_history` | Histórico de navegación (analytics interno) |

### Decisión arquitectónica

**ADR-039 + ADR-042 (FORMAL):** Sidebar BO Universal — **7 espacios cross-vertical**:

1. Inicio
2. Personas
3. Operaciones
4. Comunicación
5. Reportes
6. Configuración
7. Auditoría

Cada módulo del catálogo declara su `area_sidebar_bo` (1-7). El B18 refactoriza el sidebar viejo para que renderice según esta configuración.

---

## Capa 6 — Audit & logs

**Propósito:** trail inmutable de operaciones críticas.

| Tabla | Descripción |
|---|---|
| `audit_log` | Log inmutable de operaciones (insert/update/delete) en tablas críticas |
| `audit_log_diff` | Diff antes/después por operación |
| `audit_actores` | Quién hizo qué (usuario, IP, user agent) |
| `audit_categorias` | Clasificación de operaciones (datos personales, financieras, configuración) |
| `system_logs` | Logs técnicos (errores, warnings) |
| `webhook_events` | Eventos de webhooks (entrantes y salientes) |
| `email_logs` | Trail de emails enviados (cuando Resend esté activo) |

### Decisión arquitectónica

**ADR-052:** auditoría inmutable de operaciones críticas — `audit_log` es **append-only**. RLS permite SELECT pero deniega UPDATE/DELETE incluso al superadmin. Triggers automáticos en tablas marcadas como críticas.

---

## Convenciones de modelado

### Naming

- **Tablas:** `snake_case` plural (`personas`, `cuotas_items`, `audit_log`).
- **Columnas:** `snake_case` singular (`tenant_id`, `created_at`, `monto_total`).
- **Foreign keys:** `<tabla_referenciada>_id` (`persona_id`, `cuota_id`).
- **Booleanos:** prefijo `es_` o `tiene_` (`es_activo`, `tiene_dependientes`).
- **Fechas:** sufijo `_at` para timestamps (`created_at`, `updated_at`, `deleted_at` para soft delete).
- **Enum-like:** columna `tipo` con CHECK constraint o tabla relacionada `<entidad>_tipos`.

### Columnas estándar

Toda tabla productiva tiene:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
tenant_id UUID NOT NULL REFERENCES tenants(id)
created_at TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
created_by UUID REFERENCES auth.users(id)
updated_by UUID REFERENCES auth.users(id)
deleted_at TIMESTAMPTZ  -- soft delete
```

### RLS pattern estándar

```sql
ALTER TABLE <tabla> ENABLE ROW LEVEL SECURITY;

CREATE POLICY <tabla>_tenant_isolation ON <tabla>
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

### Índices estándar

Toda tabla productiva tiene índice en `tenant_id` (crítico para performance multi-tenant) + índices en FKs.

---

## Tablas pendientes de RLS

**10 tablas** identificadas en auditoría 26-may-2026 sin RLS habilitada. Tier 1 deuda técnica (~30 min fix).

Listado en `audits/AUDIT-ARQUITECTONICA-2026-05-26.md`.

---

## Migraciones

Ubicación: `supabase/migrations/`

Convenciones:

- Naming: `<timestamp>_<descripcion>.sql` (ej: `20260520120000_add_sidebar_columns.sql`).
- Cada migración es **idempotente** (ejecutar 2 veces no rompe nada).
- Cada migración tiene **DOWN** asociado para rollback.
- **ADR-058:** migraciones SQL versionadas + reversibles.

---

## Snapshot completo

Para snapshot completo y actualizado del schema:

```bash
# Vía Supabase CLI
supabase db dump --schema public > snapshot.sql

# O via MCP Supabase (proyecto KA: xzbrneojmjddrmbuwinc)
# list_tables(schemas=["public"], verbose=true)
```

---

## Para profundizar

- **Modelo conceptual:** `MASTER-PROJECT.md`
- **Catálogo de módulos:** `MODULE-CATALOG.md`
- **Decisiones de datos:** `DECISIONS.md` (buscar ADRs relacionados con datos)
- **RLS audit:** `audits/AUDIT-ARQUITECTONICA-2026-05-26.md` sección RLS coverage
