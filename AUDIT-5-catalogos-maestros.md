# PARTE 5 — Catálogos y maestros

## 5.1 Catálogo de atributos

Tabla `catalogo_atributos` — **61 atributos** en 14 categorías. **NO tiene tenant_id** (tabla global).

### Atributos por categoría (61 total)

| Categoría | Slugs |
|-----------|-------|
| **comunicaciones** (2) | `comunicaciones.admin`, `comunicaciones.editor` |
| **country** (3) | `inquilino`, `invitado_familiar`, `propietario` |
| **deportivo** (9) | `asistente_dt`, `capitan`, `dt`, `jugador`, `kine_club`, `medico_club`, `preparador_fisico`, `scout`, `suscriptor` |
| **educativo** (3) | `alumno`, `directivo_escuela`, `docente` |
| **empleado** (5) | `admin_finanzas`, `empleado_administrativo`, `empleado_operativo`, `instructor_externo`, `staff` |
| **externo** (4) | `jugador_rival`, `proveedor`, `representante_federacion`, `sponsor` |
| **familiar** (3) | `conyuge_socio`, `menor_de_edad`, `padre_tutor` |
| **finanzas** (3) | `finanzas.admin`, `finanzas.consulta`, `finanzas.tesorero` |
| **institucional** (6) | `comision_directiva`, `dirigente`, `socio`, `socio_padron`, `tesorero`, `voluntario` |
| **integraciones** (1) | `api.admin` |
| **laboral** (3) | `rrhh.admin`, `rrhh.consulta`, `rrhh.empleado` |
| **operaciones** (2) | `operaciones.coordinador`, `operaciones.scout` |
| **sistema** (8) | `admin_padron`, `admin_sistema`, `admin_tenant`, `editor_contenidos`, `padron.admin`, `padron.consulta`, `sistema.admin`, `sistema.soporte`, `soporte_tecnico` |
| **tenant** (4) | `tenant.admin`, `tenant.admin_padron`, `tenant.editor`, `tenant.staff` |
| **transversal** (4) | `en_mora`, `requiere_revision`, `sancionado`, `vip` |

### Atributos con personas asignadas (activos)

| Atributo | Personas asignadas |
|----------|-------------------|
| `socio_padron` | **2,347** |
| `jugador` | **165** |
| `suscriptor` | **51** |
| `socio` | 2 |
| `tenant.staff` | 1 |
| `tenant.admin_padron` | 1 |
| `sistema.admin` | 1 |
| `tenant.admin` | 1 |

**Solo 8 de 61 atributos están en uso real.** Los slugs viejos (`admin_sistema`, `admin_tenant`) no tienen personas asignadas — solo los namespaced (`sistema.admin`, `tenant.admin`) están activos.

### Duplicación old-style vs namespaced

Existe duplicación visible entre:
- `admin_sistema` ↔ `sistema.admin` (solo `sistema.admin` en uso)
- `admin_tenant` ↔ `tenant.admin` (solo `tenant.admin` en uso)
- `admin_padron` ↔ `padron.admin` (ninguno en uso directo, `tenant.admin_padron` sí)

Los viejos deberían eliminarse en Sprint 16 (hardening).

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

| Campo | Valor |
|-------|-------|
| ID | `11111111-1111-1111-1111-111111111111` |
| Slug | `hindu_club` |
| Nombre | Hindu Club |
| Tipo | `club` |
| Plan | `enterprise` |
| Activo | `true` |
| Timezone | `America/Argentina/Buenos_Aires` |
| Idioma | `es` |
| Email admin | `yair@levywald.com` |
| Configuración | `{}` (vacío) |

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
