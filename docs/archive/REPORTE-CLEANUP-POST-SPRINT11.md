# REPORTE — Cleanup Post-Sprint 11

**Fecha:** 2026-05-06
**Ejecutor:** Claude Chat (auditoria + cleanup via MCP Supabase)
**Migration aplicada:** `cleanup_post_sprint11`
**Tenant afectado:** Hindu Club (`11111111-1111-1111-1111-111111111111`)

---

## 1. Ejecutado y verificado

### Bloque A — Seguridad

| # | Issue | Accion | Estado |
|---|---|---|---|
| A1 | `v_estado_financiero_entidad` con SECURITY DEFINER (bypassaba RLS) | Recreada con `WITH (security_invoker=true)` | HECHO |
| A2 | `v_estado_financiero_persona` con SECURITY DEFINER | Recreada con `WITH (security_invoker=true)` | HECHO |
| A3 | `fn_calcular_monto_neto` con search_path mutable | `ALTER FUNCTION SET search_path` | HECHO |
| A4 | `es_menor_de_edad(uuid)` con search_path mutable | `ALTER FUNCTION SET search_path` | HECHO |
| A5 | `trg_set_updated_at()` con search_path mutable | `ALTER FUNCTION SET search_path` | HECHO |

**Resultado advisor:** **0 ERRORS** (antes: 2). De ~40 warnings, se eliminaron 5.

### Bloque B — Pendientes Sprint 11

| # | Issue | Accion | Estado |
|---|---|---|---|
| B1 | Modulo `rrhh_basico` no activado en Hindu | INSERT en `tenant_modulos` con `activo=true` | HECHO |
| B2 | Bucket `private-recibos-sueldo` no existia | Bucket creado, 10MB max, mime types pdf/jpg/png/webp + 4 RLS policies | HECHO |

---

## 2. NO ejecutado (intencional — Sprint 16 hardening)

| # | Issue | Por que se difiere |
|---|---|---|
| C1 | 24 funciones `SECURITY DEFINER` ejecutables por anon/authenticated | La mayoria son helpers de RLS que SI deben ser callable. Requiere clasificacion caso por caso. |
| C2 | `pre_inscripciones_insert_anon` con `WITH CHECK (true)` | Intencional para landing publica. Mejora con captcha o rate limiting en Sprint 12. |
| C3 | Extension `citext` en schema `public` | Mover a `extensions` schema requiere recrear columnas. Sprint 16. |
| C4 | `auth_leaked_password_protection` desactivado | Decision de producto. Activable desde Supabase Dashboard. |
| C5 | `public-assets` bucket publico con SELECT broad | Intencional. Sirve logos, branding del tenant. |

---

## 3. Estado actual de la DB

```
Tablas:        86 (84 antes + rrhh_contratos + rrhh_liquidaciones)
Columnas:      1416
Funciones:     66
RLS Policies:  277
FKs:           210
Buckets:       5 (public-assets, private-fotos-personales, private-documentos, private-comprobantes, private-recibos-sueldo)
Migrations:    11 registradas
RLS habilitado en: 86/86 tablas
ERRORS de seguridad: 0
```

---

## 4. Hallazgos de validacion visual de RRHH

Detectados por Yair durante la validacion. Resueltos en Sprint 11.1:

1. **Campo "Persona" sin buscador** → Reemplazado por autocomplete con debounce
2. **Puesto/Area/Rol como texto libre** → Creados 3 catalogos extensibles
3. **CUIL/Legajo en contrato** → Movidos a `personas_datos_laborales` 1:1
4. **Falta dia/rangos horarios** → Diferido (prerequisito control acceso)
5. **Falta import/export** → Parcialmente implementado (export + template download)

---

## 5. Proximos pasos

| Orden | Accion | Responsable | Estado |
|---|---|---|---|
| 1 | Cleanup DB | Chat | HECHO |
| 2 | Sprint 11.1 (fixes RRHH) | Code | HECHO |
| 3 | Fix bugs Sprint 9 (Finanzas) | Code | HECHO |
| 4 | Validacion visual Sprint 9 + 11 | Yair | PENDIENTE |
| 5 | Sprint 11.5 (eventos refactor) | Code | PENDIENTE |
| 6 | Sprint 12 (comunicaciones) | Code | PENDIENTE |
| 7 | Hardening funciones SECURITY DEFINER | Code | Sprint 16 |

---

**Fin del reporte.**
