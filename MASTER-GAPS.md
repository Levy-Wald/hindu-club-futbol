# MASTER-GAPS — Estado del proyecto y roadmap

Única fuente de verdad de pendientes y progreso.
Alineado al plan original de 15 sprints → Hindu LIVE.

---

## Estado actual: Sprint 9 COMPLETADO (~90%, pendiente validación visual)

Los primeros 9 sprints del plan original están completos (Sprint 9 pendiente de validación visual por Yair).
Sprint 9 = módulo Finanzas completo: mini-ERP con Cajas, Movimientos, Productos, Cuotas, Plan de Cuentas y Mi Cuenta.

### Ajustes post-validación (después de Sprint 6)
- [x] "Externos" renombrado a "Entidades" en todo el sistema (sidebar, mobile, search, títulos)
- [x] "Dar de baja" reemplazado por "Desactivar/Activar" (toggle simple, baja formal queda para ERP Sprint 9+)
- [x] Vínculos separados en "Familia / Tutores" y "Otros vínculos"
- [x] Menor no puede quitar vínculo padre/madre/tutor (protección en UI)
- [x] Tutores y Bajas removidos del menú principal (son atributos de personas, no módulos)
- [x] Tabla entidades clickeable → detalle con DropdownMenu (patrón UX unificado)

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

### Sprint 5 — Vínculos + Tutores/Padres + Bajas (HECHO)

- [x] Vínculos bidireccionales con labels humanos (Padre de / Hijo/a de)
- [x] Vínculos separados en "Familia / Tutores" y "Otros vínculos"
- [x] Menor no puede quitar vínculo padre/madre/tutor
- [x] Tooltips de notas y fecha inicio en vínculos
- [x] Página /admin/tutores (accesible por URL, no en menú principal)
- [x] Página /admin/bajas (accesible por URL, no en menú principal)
- [x] Toggle Desactivar/Activar en ficha persona (baja formal diferida a ERP)
- [x] Server actions: cambiarEstadoPersona, reactivarPersona
- [x] Spec documentado: docs/MENORES-TUTORES.md (para sprints 7 y 9)

### Sprint 6 — Entidades + Federaciones + Fusiones (HECHO)

- [x] Módulo renombrado de "Externos" a "Entidades" en todo el sistema
- [x] Página detalle de entidad /admin/externos/[id] con tabs (Info, Representantes, Entidades hijas)
- [x] Dirección completa con links a Google Maps y Waze
- [x] Jerarquía de entidades (entidad_padre_id, entidades hijas)
- [x] Migration entidades_representantes (tabla pivote persona-entidad con roles)
- [x] Asignar/quitar representantes con roles (presidente, vice, secretario, tesorero, vocal, contacto, delegado, otro+custom)
- [x] Dirección y entidad padre en forms de crear/editar entidad
- [x] Nombres clickeables en listado → detalle con DropdownMenu
- [x] Labels de fusión en vínculos bidireccionales
- [x] Fusiones operativas documentadas para Sprint 10 (requiere tabla partidos)

---

### Sprint 7 — Mi Perfil + Mi Equipo + Calendario/Eventos (HECHO)

- [x] Página /admin/mi-perfil (datos personales del user logueado, edición limitada)
- [x] Tarjeta jugador con foto, datos deportivos (pie, altura, peso, edad)
- [x] Página /admin/mi-equipo según rol del usuario (jugador, DT, staff)
- [x] Plantel completo con info de contacto, posición, dorsal
- [x] Calendario/Eventos: sistema de eventos con fecha real (no solo día de semana)
- [x] Crear eventos con recurrencia estilo Google Calendar (diario, semanal, quincenal, mensual × N repeticiones o hasta fecha)
- [x] Editar eventos desde admin (Equipos > Calendario) y desde Mi Equipo (DT, capitanes, delegados, preparadores)
- [x] Vista calendario semanal con navegación por semanas
- [x] Vista lista cronológica de próximos eventos
- [x] Descarga ICS para agregar eventos a calendarios externos (Google, iCloud, Outlook, Yahoo)
- [x] Indumentaria: upload de fotos + descripción por tipo
- [x] Foto de equipo: upload y visualización
- [x] Export plantel a PNG (html-to-image)
- [x] Aptos médicos (upload a storage privado)
- [x] Migration `20260505220000_eventos_calendario.sql` aplicada (campos: fecha, titulo, hora_citacion, descripcion)

---

### Sprint 8 — Páginas públicas + Branding + Pre-inscripción (HECHO)

- [x] Rutas públicas sin auth: /, /equipos, /equipos/[id], /asociate, /terminos, /privacidad
- [x] Layout público con header (logo, nav, login) + footer (contacto, redes, legal)
- [x] Home page con 7 secciones: Hero, Próximos Eventos, Ligas/Torneos, Capitanes, Staff, Asociate CTA, Contacto
- [x] Listado público de equipos agrupados por disciplina
- [x] Detalle público de equipo con plantel (inicial+apellido), staff, eventos, QR
- [x] Formulario multi-step estilo Typeform: 7 pasos (tipo, datos, contacto, tutor, deporte, info, confirmación)
- [x] Server action para crear pre-inscripción con validación
- [x] Admin: panel Pre-inscripciones con stats, filtros, aprobar/rechazar, crear persona al aprobar (con dedupe DNI)
- [x] Admin: Branding Studio en Configuración > Branding, 6 tabs (Identidad, Contenido, Contacto, Visibilidad, Legal, Galería)
- [x] Upload de logo, logo dark, favicon a Supabase Storage
- [x] Colores configurables por tenant (primario, secundario)
- [x] Switches de visibilidad (plantel, calendario, staff, capitanes, pre-inscripción)
- [x] Términos y condiciones + Política de privacidad (editables desde admin)
- [x] QR auto-generado por equipo
- [x] Dark mode completo en todas las páginas públicas
- [x] Full responsive (mobile, tablet, desktop)
- [x] Brand colors Hindu: Blue #3A8FC5, Gold #F2C531, Navy #1E3A5F
- [x] Migration: tenant_config_publica + pre_inscripciones + RLS + seed
- [x] Design system documentado: docs/BRAND-DESIGN-SYSTEM.md
- [x] Middleware actualizado: solo /admin/* requiere auth
- [x] Sidebar + Mobile nav: Pre-inscripciones agregado, Branding accesible desde Configuración

---

### Sprint 9 — Finanzas: Cajas + Movimientos + Productos + Cuotas + Plan de Cuentas (HECHO — PENDIENTE_VALIDACION_VISUAL)

- [x] Módulo Finanzas como sección colapsable en sidebar (reemplaza "Cajas" standalone)
- [x] Dashboard Finanzas: resumen con tarjetas de saldo, gráficos de ingresos/egresos
- [x] ABM Cajas: crear/editar cajas con tipo, saldo, responsable, cuenta contable
- [x] Detalle caja: movimientos asociados, saldo, metadata
- [x] ABM Movimientos: CRUD con tipo (ingreso/egreso/transferencia), persona, caja, categoría, comprobante
- [x] Filtros avanzados en movimientos: por tipo, caja, categoría, fechas, persona
- [x] ABM Productos full ERP: 30+ campos (SKU, EAN13, EAN14, marca, modelo, color, material, origen, unidad_medida, descripcion_larga, precio venta/compra, IVA venta/compra, stock actual/minimo, peso, cupo, instalacion)
- [x] 13 tipos de producto: producto, servicio, cuota, actividad, alquiler, insumo, activo, gasto, locker, cochera, expensa, multa, consumo
- [x] Import masivo de productos (wizard 4 pasos: archivo/paste → mapeo → confirmar → resultados)
- [x] Cuotas: 3 tabs (Planes, Emisiones, Estado de cuotas) con search/filter/export/selection en cada una
- [x] Plan de Cuentas: ABM con jerarquía (código, nombre, tipo: activo/pasivo/patrimonio/ingreso/egreso)
- [x] Mi Cuenta: vista por persona con saldo, movimientos, cuotas pendientes
- [x] Migrations aplicadas: tablas finanzas (cajas, movimientos, categorias_movimiento, plan_cuentas, cuotas_planes, cuotas_emisiones, cuotas_personas) + producto ERP (18 columnas nuevas + producto_proveedor)
- [x] UX estándar en todas las páginas: búsqueda, filtros, checkboxes, SelectionBar, export multi-formato (CSV, XLSX, PDF simple, PDF membretado)

---

## Sprints PENDIENTES

### Sprint 10 — Operaciones deportivas avanzadas (PRÓXIMO)

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
6. **Trigger updated_at** se llama `trg_set_updated_at()` (NO `set_updated_at()`)
7. **Tutores/Bajas** no son módulos del menú — son atributos/estados de Personas
8. **"Dar de baja"** diferido al ERP (Sprint 9+). Por ahora: Desactivar/Activar simple
9. **UX unificado**: nombres clickeables → detalle, acciones en DropdownMenu, no botones inline
10. **"Externos" renombrado a "Entidades"** en UI (URLs siguen siendo `/admin/externos`)
11. **Calendario/Eventos** reemplaza "Horarios": eventos con fecha real, `dia_semana` auto-computado desde `fecha` para backward compat
12. **Recurrencia estilo Google Calendar**: genera filas individuales por fecha (no regla abstracta)
13. **Edición de eventos por rol**: DT, capitán, subcapitán, delegado, preparador_fisico, ayudante_campo pueden editar desde Mi Equipo
14. **ICS download client-side**: genera archivos .ics para integración con calendarios externos
15. **Páginas públicas** bajo `app/(public)/` con layout propio (header+footer). Solo `/admin/*` requiere auth
16. **Pre-inscripción pública** permite inserción anónima (RLS: INSERT WITH CHECK true)
17. **Brand colors** del tenant en `tenant_config_publica`, aplicados via CSS utilities (bg-brand-hero, text-brand-blue, etc.)
18. **Multi-step form** estilo Typeform con state management en useState, sin dependencias extra
19. **QR por equipo** generado via API externa `api.qrserver.com` (sin dependencia local)
20. **Finanzas como módulo independiente** bajo `/admin/finanzas/` con sub-páginas (dashboard, cajas, movimientos, productos, cuotas, plan-cuentas)
21. **Producto ERP completo**: identidad (SKU, EAN, marca, modelo, color, material, origen) + precios (venta/compra, IVA, moneda) + inventario (stock, peso, cupo) + contabilidad (cuentas, centro costo)
22. **13 tipos de producto** para cubrir clubes y countries: producto, servicio, cuota, actividad, alquiler, insumo, activo, gasto, locker, cochera, expensa, multa, consumo
23. **Proveedores = Entidades** con `es_proveedor = true`. Tabla `producto_proveedor` es many-to-many entre productos y entidades
24. **Dedup en import**: por SKU (unique per tenant) o EAN-13 (unique per tenant). Si existe, se omite
25. **Sidebar collapsible**: Finanzas es sección colapsable con sub-items (no link directo)

---

## Post Hindu LIVE (Sprint 16+)

Una vez que Hindu está en producción, se construyen módulos sobre el mismo tronco:

### Sprint 16-19: Bot WhatsApp + Capitán Oliver
- Módulo `bot_whatsapp_equipo` (WhatsApp Cloud API)
- Producto "Capitán Oliver Fútbol" (tronco + futbol + bot WA + cuotas)
- Producto "Capitán Oliver Pádel" (mismo pero con disciplina_padel)
- Convocatorias, confirmaciones, cobros — todo por WA

### Sprint 20-24: Más disciplinas y verticales
- Hockey, tenis, pádel, golf, rugby, básquet, actividades recreativas
- Módulo `country_deportivo` (propietarios, accesos, invitados)
- Módulo `escuela_deportiva`

### Sprint 25-27: Integraciones avanzadas
- Conectores: ATC Sports, Ondepor, HubSpot, Salesforce
- App móvil propia (módulo premium)
- Módulo `federacion_hub` (cross-club, fixtures, sanciones)

### Futuro sin fecha
- Módulos premium: polo_educativo, inmobiliario, competencias_profesionales
- Multi-torneo, competencia_internacional
- Revista publicación, contabilidad avanzada

---

## Arquitectura modular (referencia)

```
TRONCO (Sprints 1-15)
├── Personas + Atributos + Vínculos
├── Padrones múltiples
├── Equipos + Categorías + Horarios
├── Cajas + Movimientos + Cuotas + Productos
├── Empleados + Contratos
├── Eventos + Comunicaciones
├── Audit log + Auth + Storage + RLS
│
MÓDULOS VENDIBLES (Post-LIVE)
├── Disciplinas: futbol, hockey, tenis, padel, golf, rugby, basquet...
├── Verticales: country, federacion, escuela, inmobiliario
├── Canales: bot_whatsapp, app_movil, api_publica, mcp_server
└── Conectores: zoho, mercadopago, atc_sports, ondepor, stripe, resend...
```

La diferencia entre clientes es CONFIGURACIÓN, no CÓDIGO:
- Hindu: tronco + futbol + conectores = USD 249/mes
- Hacoaj: enterprise + 14 disciplinas + multi-sede = USD 2,099/mes
- Country del Pilar: tronco + country + 3 disciplinas = USD 269/mes
- Capitán Oliver: light + 1 disciplina + bot WA = USD 25/mes

---

## Tiempo estimado restante hasta Hindu LIVE

Sprints 10-15 = 6 sprints pendientes.
Estimado: 40-60 horas agente + 7-12 horas validación Yair.
Calendario: 2-3 semanas a 4-6h/día.

---

**Última actualización:** 2026-05-06
**Próximo sprint:** 10 (Operaciones deportivas avanzadas)
**Instrucciones:** ver `NEXT-SPRINT.md`
**Owner:** Yair Levy Wald
