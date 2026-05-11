# ClubCore — Roadmap Arquitectónico

> Plan maestro de construcción del producto, ordenado por dependencias
> técnicas, sin compromiso de fechas. Las fases siguen un orden lógico:
> cada una requiere lo construido en las anteriores. Dentro de una fase,
> los módulos pueden paralelizarse.
>
> Mantenido por el arquitecto. Cambios estructurales requieren aprobación.
>
> Última actualización: 11 de mayo de 2026.

---

## 0. Cómo leer este documento

### Estados de cada módulo

| Símbolo | Estado |
|---|---|
| ✅ | Operativo con datos en producción |
| 🟢 | Esqueleto operativo (DB + UI + actions, sin datos reales todavía) |
| 🟡 | Modelo en DB pero sin UI dedicada (tab en ficha persona o nada) |
| 🟠 | Catalogado conceptualmente pero sin construir |
| 🔴 | No existe ni siquiera como concepto formal |

### Capas

Cada módulo declara su capa según `MASTER-PROJECT.md` §2:
**Troncal CRM** · **Troncal ERP** · **Troncal PIM** · **Vertical Club** · **Módulo Paralelo** · **Plataforma**

### Dependencias

Cada fase declara qué fases anteriores necesita. La regla es: nunca arrancar
una fase si sus dependencias no están completas. Dentro de una fase, los
módulos pueden correr en paralelo (entornos múltiples).

---

## FASE 0 — Fundación ya construida

Esta fase está **completa o en curso final**. Es la base sobre la que todo
lo demás se apoya.

### Plataforma multi-tenant — ✅

| Módulo | Estado | Notas |
|---|---|---|
| Tenants, sedes, configuración pública | ✅ | 1 tenant (Hindu) con 2 sedes |
| Multi-tenant con RLS (101 tablas, 311 policies) | ✅ | 100% cobertura |
| Catálogo de módulos + activación por tenant | ✅ | 34 módulos catalogados, 17 activados en Hindu |
| Autenticación (Supabase Auth) | ✅ | Email + magic link |
| Audit log | ✅ | 46k+ entradas registrando |
| API REST v1 con scopes | ✅ | 5 endpoints |
| Crons (vencimientos, cleanup) | ✅ | 2 crons configurados, falta CRON_SECRET |

### CRM core — ✅

| Módulo | Estado | Notas |
|---|---|---|
| Personas (CRM) | ✅ | 2,389 personas en Hindu |
| Atributos transversales con vigencia | ✅ | 61 atributos catalogados, 8 en uso |
| Vínculos familiares y de tutoría | ✅ | UI completa |
| Entidades + representantes | ✅ | 3 entidades cargadas |
| Documentos de identidad | 🟡 | Tab existe, 2 docs cargados |
| Fusión manual de personas duplicadas | ✅ | UI side-by-side |
| Ficha de persona con 19 secciones | ✅ | Tabs operativos |

### Vertical Club Deportivo — base operativa — ✅

| Módulo | Estado | Notas |
|---|---|---|
| Equipos + plantel | ✅ | 7 equipos, 211 jugadores |
| Padrones | ✅ | 4 padrones, 2,561 asignaciones |
| Importadores con pipelines declarativos | ✅ | 3 pipelines configurados, match fuzzy |
| Atributo `jugador`, `suscriptor`, `socio` | ✅ | Sistema de roles transversales |

### ERP esqueleto cargado — 🟢

| Módulo | Estado | Notas |
|---|---|---|
| Plan de cuentas | 🟢 | 104 cuentas estructuradas, sin movimientos |
| Tipos de comprobante | 🟢 | 12 cargados |
| Medios de pago | 🟢 | 7 cargados |
| Cajas | 🟢 | 3 cargadas |
| Períodos contables | 🟢 | 1 abierto |
| Config financiera (mora, moneda) | 🟢 | Cargada |
| UI de finanzas (dashboard + 7 pantallas) | 🟢 | Sin operación real todavía |

### Documentación viva y disciplina — ✅

| Módulo | Estado | Notas |
|---|---|---|
| 10 docs vivos en `/docs/` | ✅ | Completos al cierre Sprint 14d.5 |
| Design Tokens System | ✅ | Capa gráfica separada del código |
| Prompt envelope obligatorio | ✅ | R-PE1 a R-PE9 |
| Sistema de ADRs | ✅ | 18 ADRs documentados |
| Pre-mortem en sprints de alto riesgo | ✅ | R-PE9 + Caso D activos |

---

## FASE 1 — Base operativa financiera

**Objetivo.** Hindu Club puede emitir y cobrar cuotas reales del Fondo
Fútbol. Operación financiera básica funcionando con UI usable.

**Depende de.** FASE 0.

**Módulos:**

### 1.1 Modelo de suscripciones — 🔴 (Troncal ERP)

**Por qué viene primero:** sin tabla `suscripciones`, no hay forma de
emitir cuotas a partir del padrón de suscriptores. Es el eslabón faltante
entre el padrón (CRM) y las cuotas (ERP).

**DB:**
- **Crear tabla `suscripciones`** (persona ↔ plan ↔ vigencia, monto acordado, estado, metadata)
- RLS por tenant
- Índices: `(tenant_id, persona_id)`, `(tenant_id, plan_id, activo)`

**UI:**
- Tab "Suscripciones" en ficha de persona
- Listado global de suscripciones activas por plan
- Crear/editar/dar de baja suscripción
- Bulk: dar de baja todas las suscripciones de un plan

**Server actions:**
- `crearSuscripcion`, `editarSuscripcion`, `darDeBajaSuscripcion`
- `listarSuscripcionesPorPlan`, `listarSuscripcionesPorPersona`

**Integración con importadores:**
- Modificar pipeline `suscriptores_por_equipo` para crear suscripción
  además del atributo
- Re-aplicar run del padrón Suscriptores (57 personas)

### 1.2 Productos y planes financieros — 🟢 → ✅ (Troncal PIM + ERP)

**DB:** `productos_servicios` y `cuotas_planes` existen, falta cargar.

**Carga inicial Hindu:**
- Producto "Fondo Fútbol 2026" → plan mensual
- Producto "Cuota Social Hindu" → plan mensual (a futuro)
- Otros conceptos puntuales (sanciones, alquileres, etc.)

**UI:**
- Mejorar UI de productos (filtros, tipos, activo/inactivo)
- UI de planes con asignación a producto

### 1.3 Emisión de cuotas — 🟢 (Troncal ERP)

**Estado:** server action `emitirCuotasMasivas` existe. Falta integrarlo
con suscripciones (1.1).

**Flujo:**
- Seleccionar plan + período + filtros (todos / por equipo / por atributo)
- Vista previa de cuántas cuotas se van a emitir
- Confirmación con totales
- Emisión idempotente (no genera duplicados)

**Integración:**
- Asiento contable automático (deudores de cuotas → ingresos por cobrar)

### 1.4 Cobranza manual — 🟢 (Troncal ERP)

**Estado:** server action `cobrarCuota` existe. Falta UI completa.

**UI:**
- Listado de cuotas por persona / por estado / por período
- Marcar cuota como cobrada: medio de pago, fecha, monto, observaciones
- Genera automático: movimiento de caja + actualización de cuenta corriente

### 1.5 Centros de costo UI — 🟡 (Troncal ERP)

**Estado:** tabla existe (1 centro cargado), sin UI CRUD.

**UI:**
- `/admin/finanzas/centros-costo` con listado, CRUD
- Asignación de centro a movimientos (dropdown en form)

**Importancia:** sin centros, no hay imputación gerencial. Necesario para
reportes financieros (FASE 6).

### 1.6 Vista global de salud y datos sensibles — 🟡 (Módulo Paralelo)

**Estado:** 14 tablas con tab en ficha de persona, sin listado global ni
operación masiva.

**UI nueva:**
- `/admin/salud` con tabs:
  - Lesiones (listado, filtros por estado, persona, fecha)
  - Datos médicos (acceso restringido por permiso)
  - Obra social (renovaciones próximas)
  - Autorizaciones de imagen (vencidas, próximas a vencer)
  - Contactos de emergencia (verificación de contactabilidad)
  - Documentos médicos (aptos vencidos)
- Export con membrete por tenant

### 1.7 Vestuario / Indumentaria — 🔴 (Módulo Paralelo)

**DB nueva:**
- `indumentaria_items` (qué hay: stock, talles, equipo asignado, color, número)
- `indumentaria_asignaciones` (persona ↔ item ↔ fecha entrega ↔ fecha devolución)
- Reusa `personas_talles` (ya existe)
- Reusa `catalogo_tipos_talle` (20 talles cargados)

**UI:**
- `/admin/vestuario` con stock + asignaciones
- Asignación rápida desde ficha de persona
- Devolución / pérdida con justificación

**Catalogar módulo:** agregar `vestuario` a `catalogo_modulos`.

### 1.8 Notificaciones operativas in-app — 🔴 (Plataforma)

**Por qué aquí:** habilita el resto de fases. Sin notificaciones, las
operaciones no avisan al usuario.

**DB nueva:**
- `notificaciones` (tenant_id, destinatario_persona_id, tipo, titulo, mensaje, link_accion, prioridad, leida_at, archivada_at)

**UI:**
- Bell icon en topbar con badge
- Dropdown con últimas 10
- Pantalla `/admin/notificaciones` con filtros y archivo

**Server actions:**
- `crearNotificacion` (interna, llamada por triggers/server actions)
- `marcarComoLeida`, `marcarTodoLeido`, `archivar`

---

## FASE 2 — Comunicación

**Objetivo.** Plataforma envía emails reales (recordatorios, recibos,
comunicados) con membrete por tenant.

**Depende de.** FASE 1 (necesita notificaciones in-app como base + datos
financieros para tener qué comunicar).

**Cuello de botella biológico:** DNS de Resend (3-5 días de propagación).
Arrancar configuración DNS en paralelo al inicio de FASE 1.

**Módulos:**

### 2.1 Resend integrado — 🟠 (Plataforma)

- Configurar `RESEND_API_KEY` en Vercel
- Dominio de envío configurado (SPF, DKIM, DMARC) — DNS biológico
- `lib/comunicaciones/email.ts` deja de ser stub
- Webhook de Resend para tracking (delivered, opened, bounced, complained)

### 2.2 Plantillas operativas — 🟢 (Módulo Paralelo)

**Estado:** tabla `com_plantillas` con 18 plantillas cargadas. UI existe.

**Pendientes:**
- Plantillas críticas: vencimiento cuota, recibo de pago, comunicado
  general, bienvenida nueva persona, baja de socio, recuperación de
  deudor (drip)
- Editor con variables del tenant (membrete inyectado runtime)
- Preview con datos reales

### 2.3 Envíos masivos — 🟡 (Módulo Paralelo)

**Estado:** server actions existen, falta UI completa.

**UI:**
- Wizard envío masivo: seleccionar segmento (atributo / padrón / equipo /
  query custom) → plantilla → preview → enviar
- Confirmación con total de destinatarios
- Tracking en `com_envios` (delivered, opened, bounced)

### 2.4 Cron de vencimientos integrado — 🟡 (Plataforma)

**Estado:** cron `dispatch-vencimientos` existe pero stub.

**Pendiente:**
- Query a `v_vencimientos_proximos` (vista que detecta cuotas a vencer en
  X días)
- Para cada vencimiento: enviar email con plantilla "vencimiento próximo"
- Crear notificación in-app a la persona
- Idempotencia: no enviar 2 veces el mismo recordatorio

### 2.5 Preferencias de comunicación por persona — 🟡 (Troncal CRM)

**Estado:** tabla `personas_preferencias_comunicacion` existe sin UI.

**UI:**
- Sección en ficha persona: canal preferido, opt-out, horarios, idioma
- Respetar opt-out en todos los envíos

---

## FASE 3 — Control de asistencias y acceso

**Objetivo.** Operación diaria del club: tomar asistencia en entrenamientos
y partidos, controlar quién entra al club (validación contra socio activo +
pago al día).

**Depende de.** FASE 2 (alertas por ausencias consecutivas), FASE 1
(validación de pago al día en acceso).

**Módulos:**

### 3.1 Control de asistencias operativo — 🟡 (Vertical Club)

**Estado:** tabla `evento_asistencias` existe.

**UI nueva:**
- Toma de asistencia en mobile (entrenador apunta presentes/ausentes)
- Listado de asistencias por evento, persona, período
- Reporte de presentismo: % asistencia por jugador, por equipo, top N
  ausentes, racha
- Justificativos (médico, autorizado, sin justificar)
- Alerta automática (vía FASE 2): "Tu hijo faltó 3 entrenamientos
  seguidos"

**Server actions:**
- `registrarAsistencia` (bulk: marcar todo el plantel en 1 click)
- `agregarJustificativo`
- `generarReportePresentismo`

### 3.2 Control de acceso al club — 🟡 (Módulo Paralelo)

**Estado:** tabla `personas_credenciales_acceso` con 26 columnas
extremadamente ricas (PIN, biometría facial/huella/iris, sedes y
horarios permitidos, sanciones activas).

**UI nueva:**
- Pantalla portería: input DNI o escaneo → valida en tiempo real
- Vista de credencial de la persona
- Configuración por persona: sedes permitidas, horarios, áreas
- Sanciones de acceso (motivo, fecha fin)
- Logs de entrada/salida (tabla nueva `acceso_logs`)
- Vinculación con `personas_vehiculos` (vehículo del socio puede entrar)

**Server actions:**
- `validarAcceso(documento, sede_id)` → permite/deniega con razón
- `registrarEntrada`, `registrarSalida`
- `aplicarSancionAcceso`, `levantarSancion`

**Integración futura:** lector QR físico, biometría hardware, barrera
electromecánica.

### 3.3 Credenciales digitales — 🔴 (Plataforma)

**DB:** reusa `personas_credenciales_acceso`.

**UI:**
- Generar credencial QR única por persona (rotativa, con expiración)
- Vista mobile: pantalla "carnet digital" descargable o imprimible
- En la app interna del socio (FASE 13): credencial accesible siempre

### 3.4 Autorizaciones digitales — 🟡 (Módulo Paralelo)

**Estado:** tabla `personas_autorizaciones` muy rica (firma digital
con IP + user agent + método).

**UI:**
- Listado de autorizaciones por persona y por tipo
- Crear nueva autorización: tipo + alcance + vencimiento
- Firma digital (cliente firma desde mobile/web)
- Recordatorio de renovación cuando vence (vía FASE 2)
- Archivo firmado guardado en storage
- Catálogo `catalogo_tipos_autorizacion` con 11 tipos cargados

---

## FASE 4 — Planificadores y organizadores

**Objetivo.** Toda la operación deportiva planificada y orquestada desde
la plataforma: entrenamientos, amistosos, torneos, tácticas, reservas.

**Depende de.** FASE 3 (asistencias para entrenamientos), FASE 2
(notificaciones de convocatoria), FASE 1 (cobro de reservas).

**Módulos:**

### 4.1 Planificador mensual — 🟡 (Vertical Club)

**Estado:** tabla `eventos` con 34 columnas (recurrencia, sede, cancha,
instructor, tipo, color, etc.). Sin UI calendario.

**UI nueva:**
- `/admin/agenda/mes` con calendario mensual
- Filtros: equipo, tipo, sede, persona, atributo
- Click en día → ver eventos del día
- Crear evento desde día (form rápido)
- Visualización por color según tipo

### 4.2 Planificador semanal — 🟡 (Vertical Club)

**UI nueva:**
- `/admin/agenda/semana` con grilla 7 días × horas
- Drag & drop para reagendar (validando conflictos de cancha)
- Vista por equipo: la semana del equipo X
- Vista por persona: mis eventos esta semana

### 4.3 Organizador de entrenamientos — 🔴 (Vertical Club)

**DB:** reusa `eventos` + `evento_asistencias`. Sumar:
- `entrenamientos_plan_carga` (carga del día: ejercicios, intensidad, duración)
- Reusa `personas_lesiones` para detectar quién no puede entrenar

**UI:**
- Crear plan de entrenamiento recurrente (lunes/miércoles/viernes 19hs)
- Plantilla de plan de carga
- Tomar asistencia al inicio del entrenamiento (mobile, 1 tap por jugador)
- Registrar carga: ejercicios realizados, intensidad
- Detectar quién no entrenó X veces seguidas

### 4.4 Organizador de partido amistoso — 🔴 (Vertical Club)

**DB:** reusa `eventos` + `partidos_detalle` + `esquemas_tacticos`. Sumar:
- `partidos_logistica` (transporte, vianda, indumentaria, citación)

**UI:**
- Crear amistoso: rival (texto o entidad existente), cancha, hora, condición (local/visitante)
- Logística: transporte (quién lleva), vianda (qué se come), indumentaria
  (qué camiseta lleva el equipo)
- Convocatoria: seleccionar plantel + suplentes (esquema_posiciones)
- Citación automática vía FASE 2 + FASE 9 (email + WhatsApp)
- Confirmación de asistencia por cada convocado
- Cierre de convocatoria (`convocatoria_cerrada` en `partidos_detalle`)

### 4.5 Organizador táctico — 🟡 (Vertical Club)

**Estado:** `esquemas_tacticos` + `esquema_posiciones` existen.

**UI:**
- Crear esquema (4-4-2, 4-3-3, 3-5-2, etc.)
- Arrastrar jugadores a posiciones (drag & drop visual sobre cancha)
- Titulares vs suplentes (`es_titular`)
- Variantes pre-partido (esquema A / B según rival)
- Compartir esquema con plantel (vía notificaciones)

### 4.6 Organizador de torneo — 🔴 (Vertical Club)

**Variantes a soportar:**
- Liga regular (round-robin todos contra todos)
- Eliminación directa (brackets)
- Fase de grupos + playoffs (mundialista)
- Suizo (ajedrez/eSports)
- Triangular (3 equipos)
- Cuadrangular (4 equipos)

**DB nueva:**
- `torneos` (tenant_id, nombre, formato, fecha_inicio, fecha_fin, estado, sede_id, organizador_entidad_id)
- `torneo_participantes` (torneo_id, equipo_id_interno o equipo_nombre_externo, grupo)
- `torneo_fixture` (torneo_id, fase, ronda, equipo_local, equipo_visitante, fecha, cancha, marcador)
- `torneo_resultados` (acumulados por equipo: PJ, PG, PE, PP, GF, GC, DIF, PTS)

**UI:**
- Crear torneo con wizard según formato
- Generación automática de fixture
- Tabla de posiciones en tiempo real
- Carga de resultados con validación

**Reusa:** `equipos_competencias` para trackear participación de equipos
de Hindu en torneos externos (FACCMA, AIF).

### 4.7 Reservas de canchas — 🔴 (Vertical Club + Troncal ERP)

**Estado:** tabla `canchas` con `disponible_para_alquiler` y
`precio_alquiler_hora` ya existen.

**DB:**
- Reusa `eventos` con tipo `reserva_cancha`
- O tabla nueva `reservas_canchas` chica (id, cancha_id, persona_o_entidad_id, fecha, hora_inicio, hora_fin, monto, estado, movimiento_id)

**UI:**
- Calendario de canchas (semana / mes por cancha)
- Buscar disponibilidad (qué canchas libres tal día tal hora)
- Crear reserva: tipo (interno club / alquiler externo), monto
- Cobro asociado: link a finanzas (genera cuota o movimiento directo)
- Cancelación con política (refund / no refund)

---

## FASE 5 — Operación deportiva extendida

**Objetivo.** Profundizar la operación deportiva más allá de planificadores.
Stats, scouting, historial.

**Depende de.** FASE 4.

**Módulos:**

### 5.1 Partidos detalle (carga de resultados) — 🟡 (Vertical Club)

**Estado:** `partidos_detalle` existe.

**UI:**
- Pos-partido: cargar resultado, goles (quién + minuto), tarjetas, cambios
- Ficha del partido con plantel real (titulares y minutos)
- Histórico de partidos por equipo

### 5.2 Reportes deportivos — 🔴 (Vertical Club)

**Queries sobre tablas existentes:**
- Stats por jugador: partidos jugados, minutos, goles, tarjetas
- Stats por equipo: rendimiento por torneo, comparativo
- Ranking de asistencias
- Histórico evolutivo

**UI:**
- `/admin/reportes/deportivo` con dashboards configurables
- Export con membrete (FASE 1 ya define el sistema)

### 5.3 Lesiones operativas — 🟡 (Vertical Club / Módulo Paralelo Salud)

**Estado:** `personas_lesiones` existe sin UI.

**UI:**
- Listado global de lesiones activas
- Crear lesión: diagnóstico, fecha inicio, tiempo estimado de baja, rehabilitación
- Vinculación con eventos (jugador no convocable mientras esté lesionado)
- Alta médica con observaciones
- Estadística de lesiones por equipo / disciplina

### 5.4 Scouting operativo — 🟡 (Vertical Club)

**Estado:** `scouting_fichas` existe sin uso.

**UI:**
- Crear ficha de scouting (jugador externo evaluado)
- Comparativo entre fichas
- Conversión: si se incorpora, crear `persona` desde ficha

### 5.5 Historial categorías + selecciones + premios + clubes anteriores — 🟡 (Vertical Club)

**Estado:** 4 tablas existen sin UI propia (solo tab en ficha persona).

**UI nueva:**
- Listado global con filtros: quién ganó qué, quién pasó por dónde
- Útil para honor wall, comunicaciones de logros, scouting interno
- Export con membrete

---

## FASE 6 — Finanzas avanzadas

**Objetivo.** Cobranza automatizada, reportes profesionales, conciliación.

**Depende de.** FASE 1 (base financiera operando), FASE 2 (avisos por
email).

**Módulos:**

### 6.1 MercadoPago integración — 🟠 (Plataforma + Troncal ERP)

**Cuello de botella biológico:** credenciales de MP Empresa para Hindu.
Arrancar gestión en paralelo al inicio de FASE 1.

**Flujo:**
- Generar link de pago por cuota
- Envío del link por email (FASE 2) + WhatsApp (FASE 9 si ya está)
- Webhook entrante MP → actualizar cuota a cobrada + generar movimiento de
  caja + actualizar cuenta corriente
- Manejo de bouncing (link expirado, pago rechazado, devolución)

### 6.2 Cobranza automática — 🔴 (Troncal ERP)

**Sobre FASE 6.1:**
- Cron diario: para cuotas que vencen en X días, generar link MP + email
- Re-envío automático si no pagó al día N (configurable)
- Marcar cuota como vencida después de fecha de vencimiento
- Trigger drip de recuperación (FASE 2)

### 6.3 Conciliación bancaria básica — 🔴 (Troncal ERP)

- Importar extracto bancario (CSV)
- Match automático con movimientos esperados
- Pendientes de conciliar manual
- Diferencias destacadas

### 6.4 Reportes financieros — 🔴 (Troncal ERP)

**Reportes mínimos:**
- Balance del período (ingresos − egresos = resultado)
- Ingresos por concepto (cuotas, alquileres, otros)
- Egresos por categoría
- Cuenta corriente persona (deudor con detalle)
- Deudores ordenados por antigüedad
- Recaudación por centro de costo (equipo, torneo, área)
- Cash flow proyectado (cuotas pendientes próximos 30/60/90 días)
- Comparativos mes vs mes, año vs año

**UI:**
- `/admin/finanzas/reportes` con filtros y export con membrete

### 6.5 Convenios de pago — 🟡 (Troncal ERP)

**Estado:** tabla `convenios_pago` existe.

**UI:**
- Crear convenio: deuda original + cuotas pactadas + monto cuota + interés
- Seguimiento: qué se pagó, qué falta
- Trigger drip si se atrasa

### 6.6 Comprobantes — 🟡 (Troncal ERP)

**Estado:** `tipos_comprobante` cargados (12).

**UI:**
- Generación automática al cobrar (recibo, factura interna)
- PDF con membrete del tenant
- Numeración correlativa por tipo
- Envío al cliente por email

### 6.7 Presupuestos — 🟡 (Troncal ERP)

- Presupuesto anual / mensual por centro de costo
- Ejecutado vs presupuestado
- Alertas de sobre-ejecución

### 6.8 Cuotas recurrentes automatizadas — 🔴 (Troncal ERP)

- Cron mensual emite automáticamente las cuotas del nuevo período
- Aplica bonificaciones vigentes (becas, hermanos, etc.)
- Notifica a la persona con plantilla
- Audita la emisión

### 6.9 Bonificaciones avanzadas / Becas — 🟡 (Troncal ERP)

**Estado:** `cuotas_bonificaciones` existe.

**Reglas:**
- Beca social (descuento por situación)
- Descuento hermanos (X% al segundo, Y% al tercero)
- Descuento múltiples disciplinas
- Descuento pronto pago
- Descuento vitalicio / honorario

---

## FASE 7 — RRHH operativo

**Objetivo.** Hindu puede gestionar sus empleados desde la plataforma:
entrenadores, personal administrativo, mantenimiento.

**Depende de.** FASE 6 (cuentas contables para imputar sueldos).

**Módulos:**

### 7.1 Contratos — 🟢 (Módulo Paralelo)

**Estado:** UI existe (esqueleto), 0 contratos cargados.

**Pendiente:**
- UI completa con vigencia, modalidad, remuneración
- Generación automática del PDF del contrato con membrete
- Renovación / rescisión con motivo
- Alerta de vencimiento próximo

### 7.2 Datos laborales — 🟡 (Módulo Paralelo)

**Estado:** tabla `personas_datos_laborales` existe.

**UI:**
- Tab completo en ficha persona empleada
- CUIT, obra social, sindicato, condición fiscal

### 7.3 Liquidaciones — 🟢 (Módulo Paralelo)

**Estado:** UI esqueleto.

**UI:**
- Generar liquidación mensual por empleado
- Conceptos: sueldo básico, adicionales, descuentos
- Aprobación
- Pago: genera movimiento de caja egreso + asiento contable

### 7.4 Reportes RRHH — 🔴 (Módulo Paralelo)

- Listado de empleados activos
- Costo laboral mensual (totalizado y por área)
- Próximos vencimientos de contratos

---

## FASE 8 — IA aplicada

**Objetivo.** ClubCore se diferencia por aprovechar IA de forma profunda,
no decorativa.

**Depende de.** FASE 0 (modelo de datos sólido para que RAG tenga sustancia).

**Módulos:**

### 8.1 Infraestructura LLM + RAG — 🔴 (Plataforma)

- Selección de provider (Anthropic API, OpenAI, etc.)
- Vector store (pgvector en Supabase, o externo)
- Pipeline de embeddings de datos del club (personas, equipos, eventos,
  movimientos, plantillas)
- Re-indexado incremental
- API gateway interno para llamadas LLM

### 8.2 Asistente conversacional admin — 🔴 (Plataforma)

**UI:** widget chat flotante en `/admin/*`.

**Capacidades:**
- "¿Cuántos socios tenemos al día?"
- "Mostrame los jugadores que faltaron más de 3 veces este mes"
- "Generá un email para los deudores del Fondo Fútbol"
- "¿Qué entrenamientos hay el sábado?"
- Lectura de datos con respeto a permisos del usuario

### 8.3 Autocompletados inteligentes — 🔴 (Plataforma)

- Al crear evento: sugerir título según tipo y equipo
- Al crear persona: detectar duplicados antes de guardar
- Al cargar producto: sugerir cuenta contable según nombre
- Al cargar movimiento: sugerir categoría y centro de costo

### 8.4 Generación de plantillas — 🔴 (Módulo Paralelo)

- Generar plantilla de email a partir de objetivo en lenguaje natural
- Generar post de redes sociales para próximo evento
- Generar reporte ejecutivo a partir de datos del mes

### 8.5 Búsqueda semántica — 🔴 (Plataforma)

- Cmd+K global semántico (no solo por título)
- "Buscar el padre de Juan que vive en Zona Norte" → recupera persona +
  contexto de vínculo

### 8.6 Predicciones — 🔴 (Plataforma)

- Riesgo de baja de socio (basado en asistencias + comunicaciones + pagos)
- Riesgo de lesión (basado en carga de entrenamiento + historial)
- Probabilidad de cobranza de un deudor en próximos 30 días

### 8.7 Análisis de imágenes — 🔴 (Plataforma)

- Subir foto de DNI → extraer datos automáticamente
- Subir foto de carnet → mismo
- Detección de cara para foto de perfil

### 8.8 Voice-to-text para staff — 🔴 (Plataforma)

- Coach toma nota dictando: "Marcos jugó muy bien, pelea por el puesto
  del 9" → se guarda en scouting o en notas del partido
- Procesamiento de audio post-evento

---

## FASE 9 — Bot WhatsApp como producto

**Objetivo.** Acceso de socios y staff por WhatsApp sin app, sin login.
Diferenciador clave para mercado argentino donde la mayoría no instala
apps.

**Depende de.** FASE 1 (datos para responder), FASE 2 (sistema de
comunicaciones), FASE 8 (idealmente IA conversacional).

**Módulos:**

### 9.1 Infraestructura WA Business API — 🟠 (Plataforma)

- Setup con Meta Cloud API o Twilio
- Verificación de número del club (Hindu tiene número propio)
- Webhook entrante configurado
- Plantillas aprobadas por WhatsApp para envíos proactivos

### 9.2 Identificación usuario por teléfono — 🔴 (Plataforma)

- Match del número entrante con `personas.telefono_principal`
- Sesión contextual (qué persona soy)
- Fallback: si no se identifica, solicitar DNI o vincular cuenta

### 9.3 Bot framework (intents + sesiones) — 🔴 (Plataforma)

- DB de comandos / intents
- Estados de sesión (esperando confirmación, esperando datos)
- Respuestas con botones interactivos

### 9.4 Comandos básicos — 🔴 (Plataforma)

- `/mis-cuotas` → estado de cobranza
- `/pagar` → link de pago MP directo
- `/mi-equipo` → próximos eventos del equipo
- `/asistencia` → confirmar/cancelar próxima convocatoria
- `/credencial` → credencial digital del club (link)
- `/contacto` → conectar con admin del club

### 9.5 Notificaciones push reales por WA — 🔴 (Plataforma)

- Vencimiento próximo de cuota
- Convocatoria al partido
- Cambio en entrenamiento (cancelado, reagendado)
- Comunicado masivo segmentado

### 9.6 Comandos avanzados — 🔴 (Plataforma)

- Para padres: `/mis-hijos` → info de cada hijo
- Para coach: `/mi-plantel`, `/asistencia-hoy`, `/convocar`
- Para admin: `/cuentas-corrientes`, `/buscar`

### 9.7 Integración con IA conversacional — 🔴 (Plataforma)

- Pregunta en lenguaje natural → respuesta personalizada
- Fallback de bot estructurado a IA cuando no entiende
- Respeto a permisos: cada persona solo accede a sus datos

---

## FASE 10 — Plataforma e integraciones

**Objetivo.** Convertir ClubCore en una plataforma abierta con conectores
a otros sistemas.

**Depende de.** FASE 0 (API REST), demás fases para tener qué integrar.

**Módulos:**

### 10.1 Marketplace de conectores — 🟠 (Plataforma)

**UI nueva:** `/admin/integraciones` mejorada como marketplace:
- Vista de TODOS los conectores disponibles (cards con logo, descripción)
- Estado: instalado / no instalado / con error
- Click → instalar / configurar credenciales
- Categorías: pagos, email, CRM, contabilidad externa, etc.
- Búsqueda y filtros
- A futuro: terceros pueden publicar conectores

### 10.2 MCP Server — 🟠 (Plataforma)

**Objetivo.** Acceso a ClubCore como contexto de modelos de IA externos
(Claude, ChatGPT, etc).

- Implementación del protocolo MCP
- Endpoints: leer datos del club con respeto a permisos
- Catalogado como módulo activable por tenant

### 10.3 Webhooks salientes — 🔴 (Plataforma)

- Tabla `webhook_subscriptions` (tenant, evento, url, secret, activo)
- Tabla `webhook_deliveries` (intentos, response, retry policy)
- Eventos disparados desde la app (persona creada, cuota pagada, evento
  agendado)
- Retry exponencial, dead letter queue

### 10.4 Conector Zoho CRM — 🟠 (Plataforma)

**Catalogado:** `conector_zoho_crm`.

- Sincronización bidireccional de personas
- Mapping de campos configurable por tenant
- Polling + webhooks
- A futuro: trigger desde Zoho hacia ClubCore y viceversa

### 10.5 Otros conectores futuros — 🟠 (Plataforma)

- Conector Stripe / dLocal (alternativos a MercadoPago)
- Conector AFIP (facturación electrónica)
- Conector Tango (contabilidad externa argentina)
- Conector Bsale, ContaPyme, otros sistemas argentinos

### 10.6 API REST v2 — 🟢 → 🔴 (Plataforma)

- Extender los 5 endpoints actuales
- Agregar: equipos, padrones, finanzas, eventos, comunicaciones
- Documentación OpenAPI
- Versionado (`/api/v1/`, `/api/v2/`)

### 10.7 SDKs cliente — 🔴 (Plataforma)

- SDK JavaScript / TypeScript publicado en npm
- SDK Python publicado en PyPI
- Documentación con ejemplos
- Para que terceros construyan sobre ClubCore

---

## FASE 11 — Onboarding tenant + branding

**Objetivo.** Crear un tenant nuevo en menos de 1 hora con catálogos
base, plan de cuentas template y branding configurado. Listo para vender
a Hacoaj, Nordelta, Boca, etc.

**Depende de.** Idealmente FASE 1-10 con módulos estables (lo que se
onboardee tiene que funcionar).

**Módulos:**

### 11.1 Wizard creación tenant — 🔴 (Plataforma)

- 6 pasos: identidad → módulos → catálogos base → plan de cuentas →
  admin inicial → branding
- Validaciones en cada paso
- Preview de cómo va a verse el tenant
- Cero código manual por tenant nuevo

### 11.2 Templates de plan de cuentas — 🔴 (Plataforma)

- Template 1: Club deportivo argentino estándar
- Template 2: Club deportivo + escuela (futuro)
- Template 3: Country deportivo (futuro)
- Importable desde el wizard

### 11.3 Selección de módulos con preview — 🔴 (Plataforma)

- Listado de módulos del catálogo
- Click → toggle activar
- Dependencias resueltas (si activa RRHH, recomienda finanzas)
- Preview del sidebar que vería el tenant

### 11.4 Branding por tenant runtime — 🟢 (Plataforma)

**Estado:** Design Tokens System listo (Sprint 14d.5). Falta:
- Editor visual de branding mejorado
- Subir logo, favicon, colores con preview en vivo
- Validación de contraste WCAG
- Dominios custom (subdominios o dominio propio)

### 11.5 Multi-sede operativo — 🟡 (Plataforma)

**Estado:** tabla `sedes` existe (Hindu tiene 2).

**Pendiente:**
- Asignación de eventos / canchas / equipos a sedes
- Reportes por sede
- Permisos de staff limitados a sede

---

## FASE 12 — Módulos complementarios

**Objetivo.** Completar el alcance con módulos que enriquecen la
operación.

**Depende de.** FASE 1-7.

**Módulos:**

### 12.1 Sponsors / contratos comerciales — 🔴 (Módulo Paralelo)

- Tabla `sponsors_contratos` (entidad_id ↔ tenant, fecha_inicio, fin, monto, beneficios)
- Atributo `sponsor` sobre entidades
- Visualización en perfil de equipo (sponsor de la temporada)
- Renovaciones próximas

### 12.2 Inventario físico — 🔴 (Módulo Paralelo)

- Tabla `inventario_fisico_items` (qué tiene el club: balones, redes,
  arcos, etc.)
- Asignación a sede / cancha / equipo
- Stock con bajas (perdido, roto)

### 12.3 Mantenimiento de instalaciones — 🔴 (Módulo Paralelo)

- Tickets de mantenimiento (problema, prioridad, asignado a, estado)
- Recurrentes (limpieza diaria, mantenimiento mensual)
- Histórico por instalación

### 12.4 Documentos del tenant — 🔴 (Plataforma)

- Estatutos, reglamentos, actas
- Versionado, firma digital
- Visibilidad por rol

### 12.5 Galería multimedia — 🔴 (Vertical Club + Plataforma)

- Álbumes por evento, partido, temporada
- Subida masiva por staff
- Reusa `personas_media` (existe) para fotos por persona
- Acceso público (con permisos) o solo socios

### 12.6 Calendario académico — 🔴 (Vertical Club)

- Para clubes con escuela deportiva
- Ciclos lectivos, vacaciones
- Reusa `eventos` con tipo `academico`

---

## FASE 13 — Frontends públicos

**Objetivo.** Caras públicas del tenant. Lo que ven socios, aspirantes,
visitantes.

**Depende de.** FASE 1-12.

**Módulos:**

### 13.1 Pre-inscripciones públicas — 🟡 (Vertical Club + Plataforma)

**Estado:** `pre_inscripciones` existe + página `/asociate` existe.

**Pendiente:**
- Landing personalizable por tenant
- Pasos del wizard de inscripción
- Notificación a staff al recibir nueva
- Aprobación con conversión a persona + asignación a equipo

### 13.2 Páginas públicas del tenant — 🔴 (Plataforma)

- `/[tenant-slug]/equipos` → vista pública de equipos
- `/[tenant-slug]/eventos` → calendario público
- `/[tenant-slug]/socios` → directorio (con privacidad respetada)
- `/[tenant-slug]/contacto` → form de contacto
- Todo con branding del tenant

### 13.3 Member portal — 🔴 (Plataforma)

- Cada socio tiene su panel `/mi-cuenta`
- Estado de cuotas, próximos eventos, su credencial digital
- Comunicaciones recibidas
- Solicitudes (cambio de datos, baja, etc.)

### 13.4 PWA instalable — 🔴 (Plataforma)

- Manifest + service worker
- Instalable desde mobile como app
- Offline mínimo (credencial, próximos eventos cacheados)
- Notificaciones push web

---

## FASE 14 — Calidad, seguridad, performance

**Objetivo.** Endurecer la plataforma para producción a escala.

**Depende de.** Producto razonablemente estable (FASE 1-11 mínimo).

**Módulos:**

### 14.1 Tests automatizados — 🔴 (Plataforma)

- Suite de tests unitarios (vitest)
- Tests de integración para flows críticos (imports, emisión cuotas,
  cobranza, control de acceso)
- Tests de RLS (que tenants no se filtren entre sí)
- CI/CD con tests obligatorios pre-merge

### 14.2 Auditoría de seguridad — 🔴 (Plataforma)

- Revisión de cada policy RLS
- Revisión de cada server action (validación, permisos)
- Revisión de manejo de secrets
- Revisión de exposición de PII
- Auditoría manual de headers, CORS, CSP

### 14.3 Performance tuning — 🔴 (Plataforma)

- EXPLAIN ANALYZE de queries críticas
- Índices adicionales según patrones reales
- Optimización de bundle JS
- Auditoría Lighthouse en cada página principal
- Compresión, caching, edge

### 14.4 Rate limiting + WAF — 🔴 (Plataforma)

- Upstash Redis para rate limiting
- Reglas por endpoint y por IP
- Bloqueo automático de IPs maliciosas
- Cloudflare WAF si volumen lo justifica

### 14.5 Disaster recovery + Backups — 🔴 (Plataforma)

- Validación periódica de backups Supabase
- PITR habilitado
- Drill de restore (simulacro)
- Documentación de procedimientos

### 14.6 Penetration testing externo — 🔴 (Plataforma)

- Cuando ClubCore tenga >$50k USD/mes facturación
- Empresa especializada
- Remediación de hallazgos

---

## FASE 15 — Verticales y troncal universal

**Objetivo.** Expandir ClubCore más allá del vertical Club Deportivo.
Cumplir la visión a 2+ años.

**Depende de.** ClubCore estable con 3+ clientes pagos.

**Módulos:**

### 15.1 Vertical Country deportivo — 🟠 (Vertical)

**Catalogado:** `country_deportivo`.

- Adaptar el motor para countries con múltiples disciplinas + amenities
- Reservas de canchas centrales
- Sistema de invitados

### 15.2 Vertical Federación Hub — 🟠 (Vertical)

**Catalogado:** `federacion_hub`.

- Una federación opera múltiples clubes desde un hub
- Padrón consolidado inter-club
- Torneos federativos

### 15.3 Vertical Polo educativo — 🟠 (Vertical)

**Catalogado:** `polo_educativo`.

- Adaptar para escuelas con deporte como complemento educativo
- Ciclo lectivo
- Reportes académicos + deportivos

### 15.4 Vertical eCommerce — 🟠 (Vertical)

**Catalogado:** `ecommerce_shop` + `inventario_productos`.

- Tienda del tenant (merchandising, equipamiento)
- Carrito, checkout, envíos
- Conexión a MercadoPago / Stripe

### 15.5 Separación física troncal (refactor 2027) — 🔴 (Plataforma)

**Según ADR-014.**

- Reorganización de paths físicos
- Renombrado de tablas verticales con prefijo
- PIM completo (atributos, variantes, combos, canales)
- Sistema de empaquetado de verticales

---

## Mapa de dependencias

```
FASE 0 (Fundación) ────► FASE 1 (Base operativa Hindu)
│
├──► FASE 2 (Comunicación)
│         │
│         └──► FASE 3 (Asistencias + Acceso)
│                   │
│                   └──► FASE 4 (Planificadores)
│                             │
│                             └──► FASE 5 (Op. deportiva ext.)
│
└──► FASE 6 (Finanzas avanzadas)
          │
          └──► FASE 7 (RRHH)

FASE 0 ────► FASE 8 (IA aplicada)
│
└──► FASE 9 (Bot WhatsApp como producto)
     (necesita FASE 2 + FASE 8)

FASE 0 ────► FASE 10 (Plataforma + integraciones)
│
└──► FASE 11 (Onboarding tenant)
     (necesita FASE 1-10 estables)

FASE 1-7 ──► FASE 12 (Módulos complementarios)
FASE 1-12 ─► FASE 13 (Frontends públicos)
FASE 1-13 ─► FASE 14 (Calidad / seguridad / performance)
FASE 14 ──► FASE 15 (Verticales y troncal universal)
```

---

## Reglas operativas del roadmap

### Cómo se ejecuta una fase

1. Antes de arrancar fase X, validar que las fases dependientes estén
   completas.
2. Dentro de una fase, módulos pueden correr en paralelo en entornos
   distintos.
3. Cada módulo arranca con su propio sprint según `PROMPT-ENVELOPE.md`.
4. Sprints de alto riesgo (R-PE9) requieren pre-mortem.
5. Cada módulo cerrado actualiza `CURRENT-STATE.md`.

### Cómo se sube de fase

Una fase se considera **cerrada** cuando:
- Todos los módulos críticos están en estado ✅ o 🟢.
- Validación operativa real (Hindu o tenant de prueba usa el módulo).
- No hay regresiones detectadas.
- `CURRENT-STATE.md` refleja el estado real.

Una fase **NO se cierra a medias.** Si un módulo queda en 🟡 dentro de una
fase, se documenta como deuda explícita y la fase queda "cerrada con
deuda" — el siguiente sprint apropiado la levanta.

### Cómo se agregan módulos nuevos

Cuando aparece un módulo nuevo (no está en este roadmap):

1. Identificar en qué fase encaja según dependencias.
2. ADR en `DECISIONS.md` justificando.
3. Agregar entrada al roadmap en la fase correspondiente.
4. Si rompe la lógica de fases, re-evaluar.

### Cuello de botella biológico

Items que no aceleran con paralelización deben arrancarse con anticipación:

| Item | Fase | Cuándo arrancar |
|---|---|---|
| DNS Resend (SPF/DKIM/DMARC) | FASE 2 | Al iniciar FASE 1 |
| Credenciales MercadoPago empresa | FASE 6 | Al iniciar FASE 1 |
| Aprobación WhatsApp Business API | FASE 9 | Al iniciar FASE 7 |
| Verificación de dominio de tenant | FASE 11 | Caso por caso |

---

## Convenciones de mantenimiento

- Este documento se actualiza al cerrar cada fase o al introducir cambios
  estructurales.
- Estados de módulos (✅ 🟢 🟡 🟠 🔴) se actualizan en cada sprint relevante.
- Cambios al orden de fases requieren ADR.
- `SPRINT-PLAN.md` deja de tener fechas: solo refleja sprint actual +
  próximos 3 en cola.
- `MASTER-PROJECT.md` §7 (Roadmap macro) apunta a este documento.
