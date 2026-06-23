# RFC-007 — Modelo Actor + Roles + Atributos + Capabilities

> Espejo de Drive `_Arquitectura/RFC-007 — Modelo Actor + Roles + Atributos + Capabilities`. Fuente de verdad allí.
> Terminología original ("ClubCore v2 / SaaS Modular Vertical") preservada como mirror; vocabulario vigente F0–F10 (ver ADR-065).

**Estado**: Aprobado (enfoque A) por Yair, pendiente de implementación
**Fecha**: 01-jun-2026
**Autor**: Dirección Externa (Opus)
**Milestone**: F1 (próximo sprint F1.7)
**Relacionado**: RFC-006 (navegación) consume el filtro de capabilities que este RFC define.

## 1. Resumen en una línea

Se formaliza un supertipo **"Actor"** por encima de personas y entidades, y una tabla declarativa de roles (`actor_roles`). Un actor es una persona física o una entidad jurídica; un rol (socio, jugador, empleado, proveedor, concesionario) se le asigna con vigencia y alcance. El dato de la persona vive una sola vez; los roles y los módulos son lentes sobre el mismo registro. **Es aditivo**: no se migra ni se rompe lo construido.

## 2. Problema que resuelve

- **2.1.** Las dos trampas del ERP: (a) reconectar módulos a mano, (b) recargar el mismo dato. Hoy se evitan parcialmente (registro único de personas), pero el concepto "rol" está disperso e implícito.
- **2.2.** El rol de una persona hoy se infiere de tablas distintas: jugador/DT de `personas_equipos`; empleado de `personas_datos_laborales` (`catalogo_roles_laborales`); socio de `personas_padrones`; proveedor de `entidades.tipo='proveedor'` y de `concesionarios`. No hay un lugar único que responda "¿qué es esta persona/entidad y en qué módulos debe aparecer?".
- **2.3.** "Proveedor" disperso HOY (verificado 01-jun): `entidades` con `tipo='proveedor'` (1 registro) y tabla `concesionarios` (`persona_id` + `entidad_id`, 0 registros). Mismo concepto, dos lugares.

## 3. Hallazgo (verificado en Supabase, 01-jun-2026)

- **3.1.** `personas`: 2.739 filas, registro canónico único de persona física (103 columnas + satélites por dominio).
- **3.2.** `entidades`: 4 filas (3 federacion, 1 proveedor). Registro canónico de lo jurídico (`cuit`, `razon_social`, `entidad_padre_id` jerárquico).
- **3.3.** `personas_vinculos`: grafo de relaciones tipadas (es_tutor_legal, puede_retirar_menor, puede_autorizar_actividades, paga_cuotas_de_origen, es_contacto_emergencia) + `catalogo_tipos_vinculo` (23 tipos).
- **3.4.** `catalogo_capabilities`: 115 capabilities granulares (`modulo_slug` + accion + sensible).
- **3.5.** `concesionarios` YA tiene `persona_id` Y `entidad_id`: prueba de que el dominio necesita "esto puede ser persona o empresa". El modelo Actor formaliza ese patrón en vez de repetirlo tabla por tabla.

Conclusión: el 80% del modelo Actor ya existe disperso. Este RFC lo nombra y agrega la pieza faltante (Actor + `actor_roles`), sin migración destructiva.

## 4. Decisión (Enfoque A — elegido por Yair)

Supertipo **"Actor" unificado + roles declarativos**. Se descarta el enfoque B (roles colgando directo de dos tablas separadas) porque arrastra casos borde permanentes. Razón de negocio: en clubes, socio/proveedor/empleado/jugador se cruzan (el socio que provee el buffet, el empleado que también juega). A maneja esos cruces sin excepciones.

## 5. Modelo propuesto (aditivo)

**5.1. `actores`** (nuevo, supertipo): `id, tenant_id, tipo_actor ('persona'|'entidad' check), persona_id (FK, nullable), entidad_id (FK, nullable)`, **CHECK XOR** (exactamente uno no nulo), `created_at, updated_at, deleted_at, metadata`. `personas`/`entidades` no se tocan. Backfill: 1 actor por cada persona y entidad existente (2.739 + 4 = 2.743 actores), idempotente.

**5.2. `catalogo_roles_actor`** (nuevo): `slug, nombre, categoria ('deportivo'|'institucional'|'comercial'|'laboral'|'externo'), aplica_a_tipo ('persona'|'entidad'|'ambos'), sensible (bool), activo, orden, metadata`. Seed inicial: socio, jugador, dt, entrenador, arbitro, empleado, proveedor, concesionario, federacion, sponsor, tutor, alumno, prospecto…

**5.3. `actor_roles`** (nuevo, asignación declarativa — el corazón): `id, tenant_id, actor_id (FK), rol_slug (FK catalogo_roles_actor)`, vigencia (`fecha_inicio, fecha_fin` null=vigente), alcance/scope (`disciplina_slug, equipo_id, sede_id` nullables), `activo, notas, created_at, updated_at, metadata`. **Única fuente de verdad de "qué es cada quién".** Reemplaza la inferencia dispersa.

**5.4.** Los satélites existentes (`datos_laborales`, `padrones`, `equipos`…) NO se borran: pasan a colgar conceptualmente del rol. Migración de **lectura**, no de datos: las queries que infieren rol pasan a leer `actor_roles`, incremental, módulo por módulo, sin big-bang.

**5.5.** Lo que no cambia y ya está: `personas`, `entidades`, `personas_vinculos`, atributos (`personas_atributos` + `catalogo_atributos` + EAV), capabilities.

## 6. Cómo resuelve las dos trampas

- **No reconectar a mano**: `personas_vinculos` + `actor_roles` ya conectan. Un actor con rol socio + rol proveedor es una persona, no dos registros enlazados a mano.
- **No recargar**: el dato vive una vez en `personas`; el rol se agrega, no duplica la ficha. Cada módulo = vista filtrada por rol sobre el mismo actor.

## 7. Conexión con RFC-006 (navegación)

El pipeline del sidebar era: catálogo → módulos del tenant → capabilities del usuario. Este RFC define la capa que alimenta ese tercer filtro: el rol del actor (`actor_roles`) determina qué capabilities tiene, y por ende qué ve en el menú. Sin este RFC el filtro funciona a medias (todo o nada); con este, fino por rol.

## 8. Casos de prueba (deben pasar tras implementar)

- Persona socio Y proveedor del buffet: un actor, dos filas en `actor_roles`, una ficha.
- Empleado que también juega: un actor, rol empleado (laboral) + rol jugador (deportivo con scope disciplina).
- Proveedor empresa: actor tipo entidad, rol proveedor. Proveedor monotributista: actor tipo persona, rol proveedor. Mismo rol, distinto tipo de actor, sin caso borde.
- Baja de rol con vigencia: `fecha_fin` marcada, el actor deja de aparecer en ese módulo sin perder el resto.

## 9. Fuera de scope / diferido

- No se migran ni reescriben los satélites en este sprint. Solo se crean `actores` + `catalogo_roles_actor` + `actor_roles` y el backfill 1:1.
- Migración de lectura módulo-por-módulo: incremental, sprints posteriores, con smoke por módulo.
- Portal del socio (F3), Agent Connector (su propio ADR), permisos finos por capability (afinado posterior).

## 10. Reparto de actores

- **Opus**: dueño del modelo de datos. Define DDL final, seed de `catalogo_roles_actor`, casos de prueba. Canoniza como ADR al cierre. Verifica backfill por MCP.
- **Code**: migración (actores + catalogo_roles_actor + actor_roles + backfill idempotente), RLS, triggers de soft-delete, tipos TS. Backend; backfill se verifica por conteo.
- **Supabase**: 3 tablas nuevas + backfill. `personas`/`entidades` intactas.
- **Yair**: decide el seed de roles si quiere ajustarlo; valida visualmente cuando un módulo empiece a leer `actor_roles`.

## 11. Criterios de cierre (primera migración)

- Existen `actores` (XOR persona/entidad), `catalogo_roles_actor` (seed), `actor_roles`.
- Backfill: `count(actores) = count(personas vivas) + count(entidades vivas)`. Verificado por Opus vía MCP.
- RLS + soft-delete + `tenant_id` en las 3 tablas nuevas (auditoría pre-tag).
- tsc + build OK. Sin cambios de UI en este sprint.
- `personas` y `entidades` sin alteración de esquema.
