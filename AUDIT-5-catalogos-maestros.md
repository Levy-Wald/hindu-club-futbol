# PARTE 5 — Catálogos y maestros

## 5.1 Catálogo de atributos

Tabla `catalogo_atributos` con atributos namespaced (Sprint 11.6).

### Atributos del tronco (sin namespace)

| Slug | Nombre | Categoría | En uso |
|------|--------|-----------|--------|
| `socio` | Socio | institucional | Sí (asignado via import) |
| `jugador` | Jugador | deportivo | Sí |
| `no_socio` | No socio | institucional | Sí |
| `miembro` | Miembro | institucional | No auditado |
| `contacto` | Contacto | institucional | No auditado |
| `tutor` | Tutor | familiar | No auditado |
| `padre_tutor` | Padre/Tutor | familiar | No auditado |
| `menor_de_edad` | Menor de edad | familiar | No auditado |
| `capitan` | Capitán | deportivo | No auditado |
| `dt` | Director Técnico | deportivo | No auditado |
| `kine` | Kinesiólogo | deportivo | No auditado |
| `suscriptor` | Suscriptor | institucional | Nuevo (Sprint 14c.2), sin personas asignadas aún |

### Atributos namespaced

| Slug | Nombre | Categoría |
|------|--------|-----------|
| `sistema.admin` | Admin Sistema | sistema |
| `sistema.staff` | Staff | sistema |
| `sistema.soporte` | Soporte | sistema |
| `tenant.admin` | Admin Tenant | tenant |
| `tenant.editor` | Editor | tenant |
| `tenant.lectura` | Lectura | tenant |
| `finanzas.admin` | Admin Finanzas | finanzas |
| `finanzas.tesorero` | Tesorero | finanzas |
| `finanzas.consulta` | Consulta Finanzas | finanzas |
| `rrhh.admin` | Admin RRHH | rrhh |
| `rrhh.empleado` | Empleado | rrhh |
| `rrhh.consulta` | Consulta RRHH | rrhh |
| `padron.admin` | Admin Padrón | padron |
| `padron.consulta` | Consulta Padrón | padron |
| `comunicaciones.admin` | Admin Comunicaciones | comunicaciones |
| `api.admin` | Admin API | api |

> Nota: No se pudo verificar el conteo exacto de personas asignadas a cada atributo en esta sesión. El agente de DB no completó a tiempo.

## 5.2 Catálogos auxiliares seedeados

| Catálogo | Tabla | Seedeado | Ejemplo de datos |
|----------|-------|----------|------------------|
| Disciplinas | `catalogo_disciplinas` | Sí | futbol, hockey, padel, tenis, natacion, rugby... |
| Estados padrón | `catalogo_estados_padron` | Sí | activo, inactivo, baja, suspendido |
| Tipos socio | `catalogo_tipos_socio` | Sí | socio_titular, socio_cadete, adherente... |
| Roles equipo | `catalogo_roles_equipo` | Sí | jugador, dt, capitan, staff, kinesiologo... |
| Motivos baja | `catalogo_motivos_baja` | Sí | voluntaria, morosidad, disciplinaria... |
| Tipos vínculo | `catalogo_tipos_vinculo` | Sí | padre, madre, tutor, conyuge, hermano... |
| Niveles competencia | `catalogo_niveles_competencia` | Sí | recreativo, competitivo, alto_rendimiento |
| Tipos documento | `catalogo_tipos_documento` | Sí | dni, pasaporte, cedula, cuil |
| Tipos estudio | `catalogo_tipos_estudio` | Sí | primario, secundario, terciario, universitario |
| Obras sociales | `catalogo_obras_sociales` | Sí | OSDE, Swiss Medical, Galeno... |
| Tipos vehículo | `catalogo_tipos_vehiculo` | Sí | auto, moto, camioneta, bicicleta |
| Compañías seguro | `catalogo_companias_seguro` | Sí | La Caja, Mapfre, Zurich... |
| Categorías movimiento | `catalogo_categorias_movimiento` | Sí | cuota, alquiler, sueldos, compra... |
| Tipos evento personal | `catalogo_tipos_evento_personal` | Sí | cumpleaños, boda, graduacion... |
| Áreas trabajo | `catalogo_areas_trabajo` | Sí (10) | deportes, administracion, mantenimiento... |
| Puestos | `catalogo_puestos` | Sí (10) | coordinador, profesor, administrativo... |
| Roles laborales | `catalogo_roles_laborales` | Sí (6) | empleado, contratista, pasante... |
| Indumentaria | `catalogo_indumentaria` | Sí | remera, camiseta, short, buzo, campera... |
| Módulos | `catalogo_modulos` | Sí (33) | 33 módulos comerciales declarados |

## 5.3 Tenants y configuración

### Tenant actual

Existe **1 solo tenant**: Hindu Club (`11111111-1111-1111-1111-111111111111`).

### Cómo se crea un tenant nuevo

No hay script automatizado de creación de tenants. El proceso sería:
1. INSERT en `tenants` (manual o via admin)
2. INSERT en `tenant_config_publica` (branding)
3. INSERT en `tenant_modulos` (activar módulos)
4. Crear usuario en Supabase Auth + vincular a persona
5. Seedear catálogos tenant-scoped (estados_padron, tipos_socio, etc.)

**No hay onboarding automatizado.** Es un gap conocido para post-Hindu LIVE.

### Módulos activos en Hindu

Según `tenant_modulos`, los módulos activos incluyen:
- `disciplina_futbol`
- `rrhh_basico`
- `api_publica`
- `comunicaciones`
- (otros no auditados en esta sesión)
