# ADR-068 — Frontera entre atributos (permisos/estados) y actor_roles (roles de negocio)

> Origen: repo (canonizado por Code en cobertura de Opus, 23-jun-2026). Espejado a Drive `_Decisiones/` el 23-jun-2026.

**Estado**: Accepted
**Fecha**: 23-jun-2026
**Decidido por**: Yair (opción B)
**Relacionado**: ADR-005 (atributos como sistema de roles), ADR-036 (permission slugs dot-notation), RFC-007 (modelo Actor)
**Milestone**: F1 (habilita F1.7 incremental)

## Contexto

`actor_roles` (RFC-007, creado en F1.7) se **superpone** con el sistema de atributos preexistente (`personas_atributos` + `catalogo_atributos`), que por ADR-005 ya se usaba como sistema de roles. Verificación en prod (23-jun): el sistema de atributos **ya está fuertemente en uso como roles** — `socio_padron`=2347, `jugador`=165, `suscriptor`=51, etc. Sin una frontera clara, "qué es cada quién" quedaría duplicado en dos lugares.

## Decisión (opción B — coexistencia con división de dominio)

Los dos sistemas **coexisten**, cada uno dueño de un dominio:

- **`personas_atributos` (atributos)** → **permisos de sistema y estados/flags**:
  - **Permisos**: slugs en **dot-notation** `modulo.accion` (ya mandado por ADR-036): `tenant.admin`, `finanzas.admin`, `torneos.cargador`, `reservas.gestor`, `padron.consulta`, `sistema.admin`, etc.
  - **Flags/estados transversales**: `en_mora`, `vip`, `sancionado`, `requiere_revision`.
  - Son persona-only y alimentan el filtro de capabilities/permisos.

- **`actor_roles` (RFC-007)** → **roles de negocio** ("qué ES el actor"):
  - Sustantivos: `socio`, `jugador`, `dt`, `entrenador`, `proveedor`, `concesionario`, `sponsor`, `federacion`, `empleado`, `alumno`, `tutor`, etc.
  - Pueden aplicar a **persona O entidad** (lo que atributos no puede): un proveedor-empresa, un sponsor, una federación viven acá; un proveedor-persona también.
  - Con vigencia (`fecha_inicio/fin`) y scope (disciplina/equipo/sede).

**Regla operativa para clasificar un atributo existente:** ¿tiene punto (`x.y`) o es flag de estado? → permiso/estado, queda en atributos. ¿Es un sustantivo que describe qué es la persona/entidad en el negocio? → rol, va a `actor_roles`.

## Valor único de actor_roles (lo que atributos no resuelve)

- **Roles sobre entidades**: `entidades.tipo='proveedor'`, sponsors, federaciones no pueden ser `personas_atributos`. `actor_roles` les da un home.
- **Fuente única** para "¿qué es X y en qué módulos aparece?" persona+entidad juntas, en vez de unir 4 tablas (`entidades.tipo` + atributo + `producto_proveedores` + `concesionarios`).

## Migración (incremental, F1.7 §9 — sprints siguientes, con smoke por rol)

Por cada rol de negocio: espejar las filas de `personas_atributos` (rol-atributo) a `actor_roles` (persona-actors) + sumar las fuentes de entidad, y que las queries del módulo pasen a leer `actor_roles`. Volumen real conocido: `socio_padron` 2347, `jugador` 165, `suscriptor` 51 (el resto, poco/cero). Piloto arranca por un rol acotado.

## Casos a resolver durante la migración (no bloquean esta decisión)

- Duplicación `socio` (1) vs `socio_padron` (2347): unificar a un rol `socio` con scope/padron.
- Ambiguos a clasificar caso por caso: `staff`, `admin_concesiones`, `comision_directiva`, `dirigente`, `voluntario`, `instructor_externo` (¿rol de negocio o permiso operativo?).
- Atributos `dt`/`jugador`/`alumno`/`sponsor`/`proveedor` coexisten como slug en `catalogo_atributos` Y en `catalogo_roles_actor`: el de negocio gana en `actor_roles`; el atributo se deprecia o queda como permiso si aplica.

## Resoluciones (decisiones de Yair, 23-jun-2026)

- **`socio`**: unificado — `socio_padron` (2347) + `socio` (1) → rol `socio` (2348), scope global. (tag v0.41.2)
- **Clasificación de ambiguos (principio: ¿qué *es* → rol; qué *puede/accede* → permiso):**
  - **Oficios → rol** (migrados a `actor_roles`): `staff_medico` → rol `medico`; `staff_utileria` → rol `utilero`.
  - **Accesos/admin → permiso** (quedan como atributo): `admin_concesiones`, `staff_acceso_total_salud`, y todos los dot-notation (`x.y`).
  - **`staff` genérico**: queda como atributo (demasiado vago para rol de negocio).
  - Otros roles institucionales con uso ya migrados como roles: `dirigente`, `comision_directiva`, `representante_federacion`, `suscriptor`, `capitan`. (tag v0.41.3)
- **`jugador` — scope (decisión B: ambos):** se mantiene el rol `jugador` **global** (165, del atributo) Y se agregan los **scoped** por `equipo_id`+`disciplina_slug` desde `personas_equipos` (202, roster real). Contar jugadores = `count(DISTINCT actor_id)` (166: 165 atributo + 1 roster-only). (tag v0.41.4)
- **`socio` — scope (decisión B: ambos):** se agregó la dimensión de scope **`padron_id`** a `actor_roles` (columna FK nullable, como disciplina/equipo/sede). Se mantiene el `socio` **global** (2.348, del atributo) Y se agregan los **scoped** por `padron_id` desde `personas_padrones` (3.054 membresías activas). `count(DISTINCT actor_id socio)` = 2.731 (reconcilia al padrón real: suma ~383 que estaban en padrón sin el atributo `socio_padron`). (tag v0.41.8)
- **Read-swaps en `/admin/personas` (consumo de `actor_roles` desde UI):** filtro "por Rol" (v0.41.5) + columna que muestra roles lindos y excluye los slugs-rol de "Atributo" (v0.41.6/v0.41.7). El listado filtra y muestra desde `v_actores_roles`.

## Consecuencias

- ADR-036 (dot-notation = permiso) sigue vigente y ahora es también el criterio de frontera.
- F1.7 incremental tiene regla clara de qué migrar y qué dejar.
- El audit de roles consulta `actor_roles`; el de permisos, `personas_atributos`.

## Referencias

- ADR-005, ADR-036, RFC-007, ADR-067 (Finanzas trunk, misma tanda de decisiones 23-jun).
