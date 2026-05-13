# PROPUESTA ARQUITECTONICA INTEGRAL — ClubCore

**Para:** Claude Code (revision + opinion)
**De:** Direccion Externa — Yair Levy Wald + Claude Chat (auditoria)
**Fecha:** 2026-05-06
**Estado:** decisiones tomadas, abierto a pushback tecnico de Code antes de implementar
**Objetivo:** dejar el proyecto modular, limpio, y listo para escalar SaaS antes de avanzar mas sprints

---

## 0. Por que este documento existe

En los primeros 10 sprints se construyo una base solida pero con **drift de modularidad**: tablas que estan en lugar incorrecto, naming inconsistente, features acopladas que deberian ser modulos, modulos del marketplace declarados pero no implementados con disciplina.

Antes de seguir agregando funcionalidad (Sprint 11+), se reordena la arquitectura completa. Despues de este sprint todo lo nuevo cumple un patron estricto. Lo viejo se migra en paralelo.

**Lo que NO se hace:** rehacer todo. Se mantienen las 84 tablas y sus datos. Se reorganizan, renombran, se ajustan FKs y se establecen reglas obligatorias.

---

## 1. Diagnostico del estado actual

### 1.1 Lo que esta bien estructurado
- 83/84 tablas con RLS
- Sistema de catalogos extensibles (20 catalogos sembrados)
- Sistema de atributos en `personas_atributos`
- Multi-tenant via `get_tenant_actual()` SECURITY DEFINER
- Plan de cuentas + cajas + movimientos contables solidos
- 33 modulos comerciales declarados en `catalogo_modulos`

### 1.2 Lo que esta mal o inconsistente

**A. Tablas mezcladas**
- `equipos_horarios`: hace doble funcion (recurrencia + instancia puntual). Tiene 23 columnas mezcladas. 2 tablas dependen de su `id` (`esquemas_tacticos`, `evento_asistencias`).
- `personas`: 106 columnas en una sola tabla. Funciona pero queries pesadas.
- `productos_servicios`: 36 columnas. Sirve para producto, servicio, cuota, alquiler, locker, expensa, etc. Bien polimorfico, pero falta el "tipo activo" claramente diferenciado para utileria.

**B. Naming inconsistente**
- `equipos_horarios` deberia ser `eventos_deportivos` o absorberse en `eventos`
- `entidades_representantes` esta bien
- `evento_asistencias` (singular `evento`) vs `equipos_horarios` (plural). Mezcla de convenciones.
- Catalogos: la mayoria con `slug` PK (correcto), pero `catalogo_tipos_socio`, `catalogo_estados_padron`, `catalogo_categorias_movimiento` usan `id uuid PK` con `tenant_id` (porque son tenant-scoped). Inconsistencia funcional pero distinguible.
- `personas_eventos_personales` usa `tipo_evento_slug` con catalogo separado `catalogo_tipos_evento_personal`. Si se unifica con `eventos`, este catalogo se absorbe en `catalogo_tipos_evento`.

**C. Modulos sin disciplina arquitectonica**
- 33 modulos en `catalogo_modulos`, ninguno con dependencias declaradas (todos `[]`)
- Tablas no tienen prefijo claro por modulo. `cajas` y `movimientos_caja` deberian ser `fin_cajas` y `fin_movimientos`. Sin prefijo, no se puede saber que tabla pertenece a que modulo
- Las features no estan aisladas: cada nueva tabla fue agregandose donde "calzaba" sin un patron obligatorio

**D. Falta el sistema de eventos de dominio**
- No hay tabla `module_events`
- No hay dispatcher centralizado
- Cada notificacion o webhook tendria que rehacerse desde cero

**E. Capa de servicios mezclada con UI**
- Mucho codigo pone `supabase.from('...')` directo en `page.tsx` o `api/route.ts`
- Sin capa pura, la API REST + MCP + WA Bot tendran que duplicar logica

**F. Drift documental**
- README dice 68 tablas, real 84
- 15 archivos de migration, 10 registradas en `schema_migrations` (pre-fix de hoy)
- 27 tablas no listadas en docs

---

## 2. Decisiones tomadas — son firmes

Tomadas para destrabar avances. Pueden recibir pushback tecnico de Code, pero requieren razon solida.

| # | Decision | Justificacion |
|---|---|---|
| **D1** | **Tronco vs Modulo claramente separados.** Tronco = lo que TODO tenant tiene. Modulo = activable/desactivable. | Sin esta separacion, el sistema deja de ser SaaS. |
| **D2** | **Cada tabla pertenece a UN modulo.** Identificable por prefijo de nombre. | Permite renombrar, deprecar, deshabilitar tablas en bloque. |
| **D3** | **Capa de servicios pura obligatoria.** `/lib/modulos/{slug}/services.ts` con funciones puras. UI, API, MCP, Bot consumen lo MISMO. | Sin esto, integraciones futuras se rehacen. |
| **D4** | **Tabla `eventos` central + satelites por dominio.** Solo Tipo 1 (agendable). | Calendario unico, dominios independientes. |
| **D5** | **VIEW `v_vencimientos_proximos` para Tipo 2 (vencimientos).** | Una sola fuente para alertas. No contamina calendario. |
| **D6** | **`module_events` tabla central.** Cada accion relevante de cada modulo emite evento aqui. | Dispatcher centralizado para in-app, email, webhook, WA. |
| **D7** | **Atributos namespaced.** `{module_slug}.{rol}`. | Roles aislados por modulo, deshabilitables en bloque. |
| **D8** | **RLS por atributo + modulo activo.** Si el modulo no esta activo en el tenant, sus rutas devuelven 404. | Aislamiento real entre clientes. |
| **D9** | **Tablas tenant-scoped con `tenant_id` siempre.** Excepcion: catalogos globales (slug PK). | Patron ya existente, formalizarlo. |
| **D10** | **Storage paths predecibles.** `{bucket}/{tenant_id}/{module_slug}/{entity_id}/{filename}`. | Permite cleanup por tenant, backup por modulo. |
| **D11** | **API REST y MCP nacen en cada modulo.** No hay modulo "completo" sin endpoint REST + MCP tool. | Disciplina, no opcional. |
| **D12** | **Soft delete (`activo`/`deleted_at`) en TODO.** Excepcion justificada y documentada. | Auditoria total + recuperabilidad. |
| **D13** | **Naming en espanol para dominio, ingles para tecnico.** Tablas/columnas en espanol, conceptos tecnicos (handlers, params, hooks) en ingles. | Mantiene consistencia ya existente. |

---

## 3. Convenciones obligatorias para todo lo nuevo

### 3.1 Naming de tablas

```
Tronco (sin prefijo): tenants, personas, personas_*, eventos, audit_log, module_events,
                     tenant_modulos, user_vistas, sedes, canchas, entidades

Catalogos (prefix `catalogo_`): catalogo_modulos, catalogo_atributos, ...

Por modulo (prefix corto del slug):
  Finanzas:        fin_cajas, fin_movimientos, fin_plan_cuentas, fin_cuotas_*, fin_productos
  Mantenimiento:   mant_ordenes, mant_planes
  Reservas:        res_reservas
  Shop:            shop_pedidos, shop_pedido_items, shop_carrito
  RRHH:            rrhh_contratos, rrhh_liquidaciones, rrhh_liquidacion_items
  Comunicaciones:  com_mensajes, com_plantillas, com_envios
  Inventario:      inv_movimientos
  Mapa:            map_zonas
  Operaciones:     ops_scouting_fichas, ops_esquemas_tacticos, ops_esquema_posiciones
```

**Excepcion retroactiva:** las tablas existentes mantienen su nombre actual para no romper. **Todo nuevo cumple esta convencion**, y se hace una migracion silenciosa via VIEWs (`fin_cajas` AS SELECT * FROM `cajas`) para que el codigo nuevo use la convencion y el viejo siga funcionando hasta refactor.

### 3.2 Naming de columnas

```
- snake_case
- {entidad}_id para FKs (persona_id, equipo_id, no personaId ni id_persona)
- _slug para FKs a catalogos (tipo_documento_slug, atributo_slug)
- _at para timestamptz (created_at, updated_at, validado_at)
- fecha_* para date (fecha_nacimiento, fecha_vencimiento)
- es_* para booleans (es_recurrente, es_titular, es_socio)
- _url para storage (foto_url, comprobante_url)
- metadata jsonb DEFAULT '{}' para extensibilidad
```

### 3.3 Naming de slugs en catalogos

```
- snake_case
- Verbo o sustantivo concreto, no descripcion
- Estables (no cambiar despues de seedear)
- Unicos por catalogo (PRIMARY KEY)

Ejemplos correctos:
  socio, jugador, entrenador_principal
  partido, entrenamiento, mantenimiento_preventivo

Incorrectos:
  Socio (no mayuscula), entrenador-principal (no guion),
  el_socio_titular (articulo), MANT_PREV (abreviacion)
```

### 3.4 Atributos namespaced

```
Tronco (sin namespace):
  socio, jugador, no_socio, miembro, contacto, tutor, padre_tutor

Sistema (namespace `sistema.`):
  sistema.admin, sistema.staff, sistema.soporte

Tenant (namespace `tenant.`):
  tenant.admin, tenant.editor, tenant.lectura

Por modulo (namespace `{slug}.`):
  finanzas.admin, finanzas.tesorero, finanzas.consulta
  mantenimiento.responsable, mantenimiento.supervisor
  shop.operador, shop.admin
  rrhh.admin, rrhh.consulta
  reservas.recepcion
  operaciones.coordinador
  comunicaciones.editor
```

Esto reemplaza el actual mix de `admin_sistema`, `admin_tenant`, `admin_padron`, `staff` que esta sin patron claro.

### 3.5 Patron obligatorio de un modulo

Cada modulo del marketplace tiene esta estructura. SIN excepciones para los nuevos:

```
catalogo_modulos
  - entry con slug, precio, dependencias, incompatibilidades

DB:
  - Tablas con prefijo {slug}_*
  - Catalogos extensibles con prefijo catalogo_{cosa} si los necesita
  - Atributos namespaced {slug}.{rol} en catalogo_atributos
  - RLS estandar en cada tabla (tenant_id + atributo_check)

Repo:
  app/admin/{ruta}/                    # UI admin
  app/(public)/{ruta}/                 # UI publica si aplica
  app/api/v1/{slug}/                   # endpoints REST
  lib/modulos/{slug}/
    |- services.ts                     # logica pura, NO usa Next ni Supabase RLS bypass
    |- queries.ts                      # SELECTs tipicos
    |- mutations.ts                    # INSERTs/UPDATEs/DELETEs
    |- events.ts                       # emision de module_events
    |- permissions.ts                  # que atributo puede que
    |- types.ts                        # tipos TS
    |- mcp.ts                          # MCP tools del modulo
  components/{slug}/                   # componentes React especificos del modulo

Storage (si necesita):
  - bucket nuevo o reusar existente
  - paths {bucket}/{tenant_id}/{slug}/{entity_id}/{filename}

Documentacion:
  docs/modulos/{slug}.md               # spec corto del modulo
```

### 3.6 Sistema de eventos de dominio

Cada accion relevante de cada modulo **emite** un evento en `module_events`.
El dispatcher (Sprint 12) toma eventos sin entregar y los publica en los canales que correspondan.

### 3.7 Capa de servicios pura

Regla **inquebrantable**: **NINGUN page.tsx, NINGUN api/route.ts, NINGUN client component llama directo a Supabase**. Todos consumen `services.ts` del modulo.

### 3.8 RLS estandar de cada tabla

Patron unico, copiable:

```sql
ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;

CREATE POLICY {tabla}_select ON {tabla}
  FOR SELECT USING (
    tenant_id = (SELECT get_tenant_actual())
    AND modulo_activo('{slug}')
  );

CREATE POLICY {tabla}_modify ON {tabla}
  FOR INSERT WITH CHECK (
    tenant_id = (SELECT get_tenant_actual())
    AND modulo_activo('{slug}')
    AND tiene_atributo_namespace('{slug}', ARRAY['admin','operador'])
  );
```

### 3.9 Migration files

```
{YYYYMMDDHHMMSS}_{descripcion_corta}.sql

Cada migration:
- es idempotente (IF NOT EXISTS, ON CONFLICT)
- tiene comentario header con que hace y por que
- tiene rollback documentado en el comentario (NO ejecutable)
```

### 3.10 Storage paths

```
{bucket}/{tenant_id}/{module_slug}/{entity_id}/{filename}

Buckets actuales:
- public-assets
- private-fotos-personales
- private-documentos
- private-comprobantes
- private-recibos-sueldo (nuevo, Sprint 11)
```

---

## 4. Mapa modular definitivo

Ver seccion completa en el documento original. Resumen:

- **Tronco** (10 tablas sin prefijo): tenants, personas, personas_atributos, personas_vinculos, sedes, canchas, entidades, audit_log, tenant_modulos, user_vistas
- **Finanzas** (fin_*): cajas, movimientos, plan_cuentas, cuotas, productos, etc.
- **RRHH** (rrhh_*): contratos, liquidaciones, personas_datos_laborales
- **Operaciones** (ops_*): scouting_fichas, esquemas_tacticos
- **Comunicaciones** (com_*): mensajes, plantillas, envios
- **Mantenimiento** (mant_*): ordenes, planes
- **Reservas** (res_*): reservas, reglas
- **Shop** (shop_*): pedidos, carrito, envios
- **Inventario** (inv_*): movimientos
- **Mapa** (map_*): zonas

---

## 5. Plan de migracion (orden de sprints)

| Sprint | Contenido |
|---|---|
| **11** | RRHH + module_events + capa servicios pura |
| **11.5** | Refactor calendar (eventos + satelites) |
| **11.6** | Atributos namespacing |
| **11.7** | Renombres de finanzas (fin_*) con VIEW |
| **12** | Comunicaciones + dispatcher de module_events |
| **13** | API REST v1 + MCP + Webhooks |
| **14** | Mantenimiento + Mapa + Inventario + Reservas |
| **15** | Shop completo |
| **16** | Hardening + Tests E2E + Hindu LIVE |

---

## 6. Tabla resumen de decisiones

| # | Decision | Resumen |
|---|---|---|
| D1 | Tronco vs Modulo separados | Tronco siempre activo. Modulo activable/desactivable. |
| D2 | Una tabla = un modulo | Identificable por prefijo. Excepcion retroactiva con VIEW. |
| D3 | Capa de servicios pura | `/lib/modulos/{slug}/services.ts`. Inquebrantable desde Sprint 11. |
| D4 | Tabla `eventos` central | Tipo 1 (agendable). Satelites por dominio 1:1. |
| D5 | VIEW `v_vencimientos_proximos` | Tipo 2 (alertas). No contamina calendario. |
| D6 | Tabla `module_events` | Eventos de dominio. Dispatcher centralizado en Sprint 12. |
| D7 | Atributos namespaced | `{slug}.{rol}`. Migrar existentes con aliases. |
| D8 | RLS por atributo + modulo activo | Dos funciones helper. |
| D9 | `tenant_id` siempre | Excepcion: catalogos globales con slug PK. |
| D10 | Storage paths predecibles | `{bucket}/{tenant_id}/{module_slug}/{entity_id}/{filename}`. |
| D11 | API REST + MCP en cada modulo | Disciplina, no opcional. |
| D12 | Soft delete en TODO | Excepciones documentadas. |
| D13 | Naming es/en | Dominio en espanol, tecnico en ingles. |

---

**Owner:** Yair Levy Wald — yair@levywald.com
**Auditor externo:** Claude Chat (sesion 2026-05-06)
**Implementador:** Claude Code
**Ultima actualizacion:** 2026-05-06
