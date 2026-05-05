# MASTER-GAPS — Estado del proyecto y roadmap

Única fuente de verdad de pendientes y progreso.
Alineado al plan original de 15 sprints → Hindu LIVE.

---

## Estado actual: Sprint 4 COMPLETADO + UX transversal

Los primeros 4 sprints del plan original están completos.
Adicionalmente se implementó un bloque de UX transversal (no planificado originalmente) que mejora la experiencia en todos los módulos existentes.

---

## Sprints COMPLETADOS

### Sprint 1 — Foundation (HECHO)

- [x] Bootstrap Next.js 16 + Tailwind 4 + shadcn/ui v4
- [x] Conexión Supabase
- [x] Migration clubcore_init: tablas core (tenants, personas, atributos, vínculos, entidades, sedes, canchas, equipos, categorias, competencias, horarios, personas_equipos, padrones, personas_padrones, audit_log, catálogos, tenant_modulos)
- [x] Auth magic link
- [x] Seed: tenant Hindu, federaciones (FACCMA, AIF, APDCC), persona Yair admin
- [x] Layout: sidebar + topbar + dark mode
- [x] RLS básica (get_tenant_actual SECURITY DEFINER)
- [x] Deploy Vercel funcionando

### Sprint 2 — ABM Personas + Vista Global (HECHO)

- [x] CRUD personas con todos los campos
- [x] Ficha persona en tabs: Personal, Deportivo, Salud, Profesional, Club, Documentos, Roles, Vínculos, Padrones, Ficha total
- [x] Asignar atributos y vínculos manualmente
- [x] Estados de persona
- [x] Multi-deporte por persona
- [x] Categoría sugerida por edad
- [x] Lesiones y rehabilitaciones (tablas + UI)
- [x] Vehículos (CRUD completo con seguro)

### Sprint 3 — Padrones + Importación masiva (HECHO)

- [x] ABM padrones, personas_padrones
- [x] Importación bulk CSV con validación + dedupe por DNI
- [x] Comparador de padrones (diferencias entre dos)
- [x] Importación en todos los módulos (personas, equipos, padrones, externos)

### Sprint 4 — Equipos + Categorías + Horarios + Asignaciones (HECHO)

- [x] ABM equipos con categoría, disciplina, modalidad, colores
- [x] Categorías con edad_min/edad_max
- [x] Horarios con recurrencia (semanal/quincenal/mensual × N repeticiones)
- [x] Vista calendario semanal (desktop 7 columnas + mobile día a día)
- [x] Asignar personas a equipos con rol (plantel + staff)
- [x] Detalle equipo: composición (DT, capitán, delegados, cuerpo técnico)
- [x] Plantel/Staff con tabla, búsqueda, filtros, selección, export

### UX Transversal (HECHO — no era sprint original)

Aplicado a personas, padrones, equipos, externos:
- [x] Columnas configurables por módulo (VistasPanel)
- [x] Guardar/cargar/eliminar vistas con nombre por usuario (tabla user_vistas)
- [x] Exportación multi-formato: CSV, XLSX, PDF simple, PDF membretado
- [x] PDF membretado con logo, nombre, dirección, email, web, fecha, usuario
- [x] Templates descargables en CSV + XLSX
- [x] Selección con checkboxes en todas las tablas + SelectionBar
- [x] Buscador + filtros en cada módulo
- [x] Búsqueda global Cmd+K con resultados agrupados
- [x] Vista mobile (cards) + desktop (tabla) responsive

---

## Sprints PENDIENTES

### Sprint 5 — Vínculos + Tutores/Padres + Bajas

- [ ] ABM completo de vínculos persona-persona (UI dedicada)
- [ ] Vista "Tutores/Padres" — personas con atributo padre_tutor y sus vínculos
- [ ] Vista "Bajas" con casuística (motivo, fecha, reactivación)
- [ ] Workflow de baja: marcar persona, registrar motivo, propagar a padrones

### Sprint 6 — Externos + Federaciones + Fusiones

Estado: CRUD externos hecho. Falta:
- [ ] Vistas: Representantes Federaciones, Equipos Rivales
- [ ] Vistas: Jugadores/Staff Fusión (atributo jugador_fusion, staff_fusion)
- [ ] Asignar representantes a entidades
- [ ] Jerarquía de entidades (entidad_padre_id)

### Sprint 7 — Mi Perfil + Mi Equipo (vista jugador)

- [ ] Página /mi-perfil (datos personales del user logueado)
- [ ] Documentos médicos (upload a storage privado)
- [ ] Página /mi-equipo según rol del usuario
- [ ] Widgets: próxima actividad, referentes del equipo

### Sprint 8 — Páginas públicas + Branding + Pre-inscripción

- [ ] Páginas públicas /equipos/[id] (lectura sin auth)
- [ ] Branding Studio (logo, colores, nombre del tenant)
- [ ] Form pre-inscripción pública + flujo revisión admin
- [ ] Tabla pre_inscripciones con estados

### Sprint 9 — Cajas + Movimientos + Productos

- [ ] ABM cajas (operativa, shop, eventos, sede)
- [ ] ABM categorias_movimiento
- [ ] ABM productos_servicios (catálogo unificado compra/venta)
- [ ] CRUD movimientos_caja (ingresos, egresos, transferencias)
- [ ] ABM cuotas_planes + emisiones
- [ ] Vista "Mi cuenta" con saldo por persona

### Sprint 10 — Operaciones deportivas avanzadas

- [ ] Eventos (entrenamientos, partidos, viajes) con calendario
- [ ] Confirmaciones de asistencia por persona
- [ ] Esquemas tácticos / pelotas paradas (disciplina_futbol)
- [ ] Operaciones semanales (qué pasa esta semana en el club)
- [ ] Scouting básico

### Sprint 11 — Empleados + Contratos + Liquidaciones

- [ ] ABM empleados (persona con vínculo laboral)
- [ ] Modalidades: relación dependencia, monotributo, honorarios, negro
- [ ] ABM contratos_laborales (monto, frecuencia, vigencia)
- [ ] Liquidaciones mensuales → genera movimiento_caja
- [ ] Vinculos empleado-actividad (kine en varios equipos)

### Sprint 12 — Comunicaciones

- [ ] Mensajería intra-club (notificaciones in-app)
- [ ] Bell icon en topbar con notificaciones
- [ ] Plantillas de comunicación
- [ ] Conector Resend para emails transaccionales (opcional)
- [ ] Envíos masivos por padrón/equipo

### Sprint 13 — API + Webhooks + MCP

- [ ] API REST v1 documentada (OpenAPI 3.1)
- [ ] Endpoints: personas, equipos, padrones, vistas, importar
- [ ] API keys gestionadas desde admin
- [ ] Rate limiting
- [ ] Webhooks salientes en eventos (persona creada, cuota pagada, etc.)
- [ ] MCP server con tools: buscar_persona, crear_persona, listar_equipos, asignar_equipo

### Sprint 14 — Conectores + Padrón consolidación

- [ ] Conector Zoho CRM (sync bidireccional)
- [ ] Conector MercadoPago (cobros)
- [ ] Sync mensual con padrón global del Hindu Club
- [ ] Scrapping federaciones (opcional)
- [ ] Tabla padron_consolidaciones

### Sprint 15 — Auditoría + Hardening + Hindu LIVE

- [ ] Audit log consultable en UI (quién hizo qué, cuándo)
- [ ] Tests E2E en flujos críticos (Playwright)
- [ ] Performance audit (queries pesadas, lazy loading)
- [ ] Permisos granulares (quién exporta, quién ve qué)
- [ ] Onboarding masivo del padrón Hindu
- [ ] Hindu Club V2 LIVE

---

## Bugs conocidos y resueltos

### BUG-001: get_tenant_actual() recursión infinita en RLS
- **Sprint:** 1
- **Causa:** SECURITY INVOKER en función usada por RLS que consultaba tabla con RLS → loop.
- **Fix:** SECURITY DEFINER + `SET search_path = public, pg_temp` + revocar anon/public.
- **Lección:** Funciones helper usadas en RLS DEBEN ser SECURITY DEFINER.

---

## Decisiones técnicas tomadas

1. **shadcn v4 usa `render` prop**, no `asChild` (base-ui bajo el capó)
2. **searchParams en Next.js 16** es `Promise<Record<string, string | undefined>>`
3. **Exports usan dynamic import** para mantener bundle chico (`lib/export/formats.ts`)
4. **Vistas se guardan en DB** (tabla `user_vistas`) para persistir entre dispositivos
5. **Columnas de tabla** se sincronizan via localStorage + custom events para reactividad

---

## Tiempo estimado restante

Sprints 5-15 = 11 sprints pendientes.
Estimado: 90-120 horas agente + 15-20 horas validación Yair.
Calendario: 6-8 semanas a 4-6h/día.

---

**Última actualización:** 2026-05-05
**Próximo sprint:** 5 (Vínculos + Tutores/Padres + Bajas)
**Owner:** Yair Levy Wald
