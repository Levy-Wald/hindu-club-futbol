# ClubCore — Sprint Plan

> Sprint actual + próximos 3 en cola. Sin fechas comprometidas.
> Para el roadmap completo por fases, ver `ROADMAP.md`.
>
> Mantenido por el arquitecto.
>
> Última actualización: 11 de mayo de 2026.

---

## Sprint actual

### Sprint 14e — Suscripciones + plan Fondo Fútbol 2026
**Capa:** Troncal ERP · **Fase:** FASE 1 (Base operativa financiera)

**Objetivo.** Hindu debe poder generar cuotas mensuales del Fondo Fútbol
contra los 57 suscriptores del padrón.

**Alcance.**
- Tabla `suscripciones` (persona ↔ plan ↔ vigencia)
- Producto "Fondo Fútbol 2026" cargado en `productos_servicios`
- Plan en `cuotas_planes` apuntando al producto
- Modificar pipeline `suscriptores_por_equipo` para crear row en `suscripciones`
- Re-aplicar run existente del padrón Suscriptores (genera 57 suscripciones)
- UI mínima: tab "Suscripciones" en ficha de persona
- UI mínima: listado de suscripciones activas por plan

**Dependencias previas.** Sprint 14d.5 aplicado. Padrón Suscriptores con 57
personas.

**Criterios de aceptación.**
- `SELECT COUNT(*) FROM suscripciones WHERE activo=true` → 57
- Tab "Suscripciones" en `/admin/personas/[id]` muestra las activas
- Build + deploy OK

**NO entra.**
- Emisión real de cuotas (Sprint 14f)
- Cobranza
- MercadoPago
- Bonificaciones

---

## Próximos 3 en cola

### Sprint 14f — Emisión + cobranza manual + UX cleanup
**Capa:** Troncal ERP + UI · **Fase:** FASE 1

**Objetivo.** Hindu emite la primera tanda de cuotas del fondo fútbol y
puede registrar cobros manuales.

**Alcance resumido.**
- Emisión masiva de cuotas desde suscripciones
- UI de cobranza manual
- Generación de movimiento_caja al cobrar
- UX cleanup global (botoneras arriba, errores específicos, mobile)

---

### Sprint 15a — Resend + comunicaciones masivas
**Capa:** Módulo paralelo (Comunicaciones) · **Fase:** FASE 2

**Objetivo.** Emails reales saliendo de la plataforma: avisos de
vencimiento, recibos, comunicados.

**Alcance resumido.**
- Configurar Resend
- Plantillas operativas (vencimiento, recibo, comunicado)
- UI de envío masivo
- Cron de vencimientos envía emails reales

**Cuello de botella:** DNS Resend (arrancar configuración al iniciar 14e).

---

### Sprint 15b — Reportes financieros básicos
**Capa:** Troncal ERP · **Fase:** FASE 6

**Objetivo.** Hindu puede ver balance mensual, ingresos/egresos por
categoría, deudores, recaudación por equipo.

**Alcance resumido.**
- 5 reportes con filtros y export
- UI CRUD de centros de costo
- Asignación de centro de costo a movimientos

---

## Sprints completados (cronológico)

Historial referenciado en commits del repo. Listado resumido:

- **Sprints anteriores a 14a** (consolidados): infraestructura base,
  multi-tenant, RLS, módulos, personas, equipos, finanzas esqueleto, UI base.
- **14a.7, 14a.8, 14a.9** — Padrones (cleanup, fusión, errores).
- **14c.0** — Plataforma de imports declarativa (tablas, parsers, match fuzzy).
- **14c.0.1** — Fix matching: tokenización + apóstrofes.
- **14c.1** — Pipeline `jugadores_por_equipo`.
- **14c.1.1** — Bug: DNI nullable.
- **14c.1.2** — Bug: split apellido compuesto.
- **14c.1.3** — Bug B: equipos pendientes en cadena.
- **14c.2** — Pipeline `suscriptores_por_equipo` (setup; E2E pendiente).
- **14d** — Living docs system (12 docs actualizados/creados).
- **14d.5** — Design Tokens System (ADR-018): tokens, refactor ~70 archivos,
  branding runtime, theme test.

---

## Reglas

- Toda solicitud sigue `PROMPT-ENVELOPE.md`.
- Toda implementación respeta `ARCHITECTURE.md`.
- Capa explícita declarada al inicio de cada sprint.
- `CURRENT-STATE.md` actualizado al cerrar.
- Sprints de alto riesgo requieren pre-mortem (R-PE9).
- Code NO modifica este doc. Solo lo consulta.
