# ClubCore — Glossary

> Definiciones canónicas de los términos del proyecto. Cuando hay ambigüedad
> entre dos términos parecidos, este documento gana.
>
> Mantenido por el arquitecto.
>
> Última actualización: 13 de mayo de 2026.

---

## 1. Conceptos arquitectónicos

**Capa.** Una de las tres categorías lógicas en las que se clasifica toda
feature del sistema: Troncal, Módulo, Vertical (preset). Ver ADR-031.

**Troncal.** Capa 1 del producto que sirve a cualquier organización (no solo
clubes). Se subdivide en CRM, ERP, PIM, Plataforma. Obligatoria, siempre
activa.

**Módulo.** Capa 2. Capacidad componible, activable por tenant. Todos al
mismo nivel jerárquico. Cada módulo declara su contrato en `module.json`.
Hay 18 módulos built-in. Portables y reemplazables por adapters externos.

**Vertical.** Capa 3. Preset de combinación de módulos. No es código, es
metadata que define qué módulos se activan por default al onboarding de un
tenant de ese tipo. Ej: `club_deportivo` activa 17 módulos.

**Doble lente.** Regla operativa: antes de implementar una feature, decidir si
es genérica (Troncal) o específica de módulo. Ver `ARCHITECTURE.md` §3.

**Manifiesto (module.json).** Archivo declarativo en `modules/<slug>/module.json`
que describe el contrato de un módulo: tablas, catálogos, dependencias,
permisos, eventos, rutas. ADR-031 y ADR-032.

**Anti-patrón.** Patrón conocido que está prohibido en el proyecto. Lista
completa: `ARCHITECTURE.md` §14.

**ADR (Architecture Decision Record).** Entrada en `DECISIONS.md` que documenta
una decisión técnica con contexto, alternativas y justificación.

**Mock-first.** Principio (ADR-035) por el cual todo integrador externo
(Resend, MercadoPago, WhatsApp, AFIP) se desarrolla primero con un adapter
mock que simula la operación sin credenciales reales. El switch a producción
ocurre en FASE 16.

**Foundation.** Nombre informal de los Sprints 15a, 15b y 15c que
establecieron la base arquitectónica modular: manifiestos `module.json`,
migración física a `modules/`, ESLint rules de acoplamiento, E2E tests.

**Adapter pattern.** Patrón de integradores externos: interface tipada +
implementación mock + factory que resuelve el adapter activo por env var.
Referencia: `ComunicacionAdapter` + `MockAdapter` + `resolveAdapter()`.

**Recipe.** Procedimiento paso a paso para una operación recurrente (ej:
agregar un módulo nuevo). Ver `ARCHITECTURE.md` §15.

---

## 2. Conceptos de dominio (CRM)

**Tenant.** Instancia de cliente del sistema. Un tenant es un club (en
ClubCore actual) y en el futuro podrá ser cualquier organización. Aislado
por `tenant_id` y RLS.

**Persona.** Individuo que existe en el ecosistema del tenant. Puede tener
múltiples roles vía atributos: socio, jugador, padre, empleado, cliente,
proveedor. **No se crean tablas paralelas por rol** — todo es persona +
atributo.

**Entidad.** Organización (no individual): proveedor, sponsor, federación,
club asociado. Análoga a persona pero con representantes.

**Representante.** Persona vinculada a una entidad con un rol (director,
contacto comercial, etc.). Vive en `entidades_representantes`.

**Atributo.** Rol o característica transversal de una persona con vigencia
temporal. Ej: `jugador`, `socio`, `admin`, `suscriptor`. Vive en
`personas_atributos` con `activo`, `fecha_alta`, `fecha_baja`.

**Vínculo.** Relación entre dos personas. Ej: padre-hijo, tutor-tutorado,
cónyuges. Vive en `personas_vinculos` con tipo y dirección.

**Pre-inscripción.** Solicitud externa de incorporación a la organización.
Pendiente de aprobación del staff. No es persona aún.

**Solicitud.** Pedido formal de una persona ya registrada (cambio de datos,
ingreso a equipo, baja). Pasa por aprobación.

**Comunicación.** Mensaje 1:1 o segmentado dirigido a personas. Plantilla +
envío + tracking.

**Plantilla.** Template parametrizable de comunicación. Vive en
`com_plantillas`.

**Envío.** Una corrida de plantilla a un segmento de personas. Vive en
`com_envios`.

**Lote.** Grupo de envíos masivos ejecutados en una sola operación. No es
tabla propia; se agrupa por `metadata.lote_id` (UUID) en `com_envios`.
Un lote tiene plantilla, canal, segmento y N envíos individuales.

**Segmento.** Grupo de personas filtrado por criterios (tipo: todos_activos,
equipo). No es tabla; se construye en query vía `resolverSegmento()`.
Tipos disponibles en `SegmentoConfig` (union type).

**Canal.** Medio por el cual se envía una comunicación: `email`, `inapp`
(notificación in-app). Futuros: `whatsapp`, `sms`. Cada envío tiene un
canal. La preferencia de canal por persona se implementa en FASE 2.5.

**Plantilla sistema.** Las 18 plantillas seed protegidas que vienen
preconfiguradas con el sistema (bienvenida, vencimiento, recibo, etc.).
No se pueden eliminar (`deleted_at` bloqueado en UI). Se pueden editar
pero no cambiar el slug.

---

## 3. Conceptos de dominio (ERP)

**Plan de cuentas.** Árbol contable jerárquico del tenant con 5 tipos
(activo, pasivo, patrimonio, ingreso, egreso) hasta nivel 4. Vive en
`plan_cuentas`.

**Cuenta contable.** Nodo del plan de cuentas. Puede ser imputable
(`acepta_movimientos=true`) o agrupadora.

**Centro de costo.** Agrupación gerencial para imputar movimientos (ej:
"Fútbol", "Hockey", "Administración"). Vive en `centros_costo`.

**Período contable.** Año/mes con estado abierto, cerrado o bloqueado.
Operaciones se imputan al período correspondiente. Vive en
`periodos_contables`.

**Caja.** Cuenta operativa donde se registran movimientos. Puede ser
efectivo, banco, tarjeta, digital. Vive en `cajas`.

**Movimiento de caja.** Operación financiera (ingreso, egreso, transferencia)
con monto, fecha, medio de pago, cuenta contable imputada, opcionalmente
asociada a persona/entidad/cuota. Vive en `movimientos_caja`.

**Medio de pago.** Forma en que se cobra/paga: efectivo, transferencia,
tarjeta crédito/débito, MercadoPago, cheque, débito automático. Vive en
`medios_pago`.

**Tipo de comprobante.** Documento fiscal o interno (factura A/B/C, recibo,
nota de débito/crédito, remito). Vive en `tipos_comprobante`.

**Producto / Servicio.** Ítem económico que se vende o cobra. Hoy modelo
plano en `productos_servicios`. En el futuro será PIM completo.

**Plan de cuotas.** Definición recurrente de cobro (ej: "Cuota Hindu Mensual",
"Fondo Fútbol 2026"). Asocia un producto + periodicidad + monto. Vive en
`cuotas_planes`.

**Suscripción.** Relación persona ↔ plan con vigencia. Indica que una
persona está adherida a un plan en un período. Tabla a crear en Sprint 14e:
`suscripciones`.

**Cuota emitida.** Instancia mensual de un plan para una persona específica.
Tiene monto, período, vencimiento, estado (pendiente, cobrada, vencida,
anulada). Vive en `cuotas_emitidas`.

**Emisión.** Operación masiva que genera cuotas para un período. Vive en
`emisiones_cuota`.

**Cobro.** Acción de marcar una cuota como cobrada, asociada a un
movimiento de caja.

**Bonificación.** Descuento aplicado a una cuota emitida (porcentaje o
monto fijo). Vive en `cuotas_bonificaciones`.

**Convenio de pago.** Plan de financiamiento de deuda en cuotas pactadas.
Vive en `convenios_pago`.

**Cuenta corriente.** Saldo acumulado por persona/entidad: cargos − pagos.
Vive en `cuentas_corrientes`.

**Conciliación.** Proceso de matchear pagos recibidos con cuotas emitidas.

**Cotización.** Tipo de cambio entre dos monedas en una fecha. Vive en
`cotizaciones`.

**Concesionario.** Tercero que opera un punto de venta dentro del club
(kiosko, parrilla, cantina). Tiene su propio MercadoPago. El club cobra
canon mensual. Aislado del plan de cuentas del club (ADR-025). Vive en
`concesionarios`.

**Canon.** Comisión mensual que paga el concesionario al club, calculada
como MAX(porcentaje sobre ventas confirmadas, mínimo mensual). Vive en
`concesion_canones`.

**Punto de venta.** Espacio físico dentro de una sede donde opera un
concesionario. Vive en `concesion_puntos_venta`.

**Cargo de reposición.** Monto que se suma a la próxima cuota mensual de
cada miembro del plantel snapshot cuando la utilería no se devuelve en
plazo de 1 semana. Reversible si el item aparece. Calculado en
`utl_cargos`.

---

## 4. Conceptos de dominio (Módulos deportivos)

**Padrón.** Lista nominal de personas con un propósito específico. Ej:
"Hindu Global" (todos los socios), "Hindu Futbol Jugadores 2026" (planteles
del año), "Hindu Futbol Suscriptores 2026" (aportantes al fondo). Vive en
`padrones`. La pertenencia se modela en `personas_padrones`.

**Padrón global.** Padrón del tenant que incluye a toda la base de socios.
Sirve como source-of-truth de membresías.

**Padrón específico.** Padrón con propósito acotado (un torneo, un fondo,
una categoría). Puede solaparse con el global.

**Equipo.** Conjunto de personas que practica una disciplina con un nivel
y categoría. Vive en `equipos`. Tiene plantel, horarios, indumentaria,
cancha asignada.

**Disciplina.** Deporte que el club practica (fútbol, hockey, tenis, padel,
rugby, básquet, golf). Vive en `catalogo_disciplinas`. Por tenant se activa
vía módulos `disciplina_*`.

**Categoría deportiva.** Subdivisión de un equipo por edad o nivel
(juveniles, primera, senior, +28, +35, etc.). Vive en `categorias_equipo`.

**Federación.** Entidad organizadora de competencias inter-club (FACCMA,
AIF, etc.). Modelada como `entidad` con atributo `federacion`.

**Competencia.** Torneo o liga donde un equipo participa. Vive en
`equipos_competencias`.

**Plantel.** Conjunto de personas pertenecientes a un equipo con rol
específico (jugador, capitán, director técnico, preparador físico). Vive en
`personas_equipos`.

**Plantel snapshot.** Array de `persona_id` capturado al momento de solicitar
utilería. Si algo no vuelve, el cargo se prorratea sobre ESE plantel, no el
actual.

**Cuerpo técnico.** Roles staff de `catalogo_roles_equipo` (DT, asistente DT,
PF, kine, médico equipo, utilero del equipo, manager, scout, delegado,
referente) + capitán y subcapitán como roles de liderazgo deportivo. Operan
a nivel equipo vía `personas_equipos`.

**staff_utileria.** Atributo a NIVEL CLUB (no equipo) del vestuarista o
miembros de comisión. Distinto de `utilero` (rol_equipo_slug a nivel equipo).

**kine_club / medico_club.** Atributos a nivel club (acceso a datos médicos
de cualquier equipo). Distintos de `kine` / `medico_equipo` (roles de equipo
específico).

**Torneo Interno.** Competencia organizada por el propio club (Hindu como
entidad organizadora), distinta de torneos organizados por federaciones
externas. FASE 5 del roadmap.

**Fuente única de verdad de roles.** `personas_equipos.rol_equipo_slug`
(ADR-024). Ningún módulo debe duplicar este dato con atributos paralelos.

**Rol en equipo.** Función de la persona dentro de un equipo. Vive en
`catalogo_roles_equipo`.

**Cancha.** Espacio físico donde se entrena o juega. Vive en `canchas`.
Campos relevantes para reservas: `disponible_para_alquiler` (boolean),
`precio_alquiler_hora` (numeric).

**Reserva de cancha.** Alquiler de una cancha para un horario específico.
Vive en `reservas_canchas` + un `evento` tipo='reserva'. Tarifa calculada
al crear (precio_hora * duración, D51). 5 estados: pendiente, confirmada,
pagada, cancelada, completada. Cliente polimórfico: persona_id, entidad_id,
o cliente_nombre_externo. Sprint FASE 4.6.

**Estado de reserva.** Ciclo de vida: pendiente → confirmada → pagada →
completada. Cancelable desde pendiente o confirmada.

**Esquema táctico.** Formación deportiva (4-4-2, 4-3-3, etc.) con asignación
de jugadores a posiciones (slots). Vive en `esquemas_tacticos` (esquema) +
`esquema_posiciones` (jugador→slot). Visualizado como SVG cancha con slots
por línea (arquero, defensa, mediocampo, ataque). Sprint FASE 4.5.

**Formación.** Distribución táctica de 11 jugadores (e.g. 4-4-2, 4-3-3).
5 formaciones hardcoded en `modules/tactica/lib/formaciones.ts`. Cada
formación define 11 slots con coordenadas x/y para renderizado visual.

**Slot (táctico).** Posición dentro de una formación. Tiene slug único
(e.g. `arquero`, `lateral_derecho`), coordenadas x/y para visualización,
y línea de clasificación (arquero/defensa/mediocampo/ataque).

**Torneo.** Competencia formal, interna (organizada por el club) o externa
(organizada por una federación como FACCMA, AIF). Vive en `torneos`.
6 formatos soportados: liga, eliminacion, grupos_playoff, suizo, triangular,
cuadrangular. 5 estados: planificado, inscripcion, en_curso, finalizado,
cancelado. Sprint FASE 5.1, RFC-002.

**Categoría del torneo.** Subdivisión dentro de un torneo (e.g. Sub-15,
Primera, Open). Vive en `torneo_categorias`. Un equipo puede estar en
distintas categorías del mismo torneo.

**Equipo del torneo.** Inscripción de un equipo (propio o externo) en un
torneo. Vive en `torneo_equipos`. Polimórfico: equipo_id (propio) XOR
equipo_externo_nombre (externo). Sprint FASE 5.1.

**Criterios de desempate.** Orden de prioridad para resolver empates en
tabla de posiciones. Almacenados como jsonb array en `torneos.criterios_desempate`.
Presets: Argentina (puntos > dif goles > goles a favor > enfrentamiento directo),
FIFA (puntos > enfrentamiento directo > dif goles > goles a favor).

**Partido.** Evento competitivo entre dos equipos. Vive en
`partidos_detalle`. Puede estar asociado a un torneo via `torneo_id` (FK
formal) o `torneo_slug` (deprecated, dual-read hasta Sprint 5.7+).

**Inscripción en torneo externo.** Registro formal de un equipo propio en
un torneo organizado por una federación externa. Crea fila en `torneo_equipos`
(asociación al torneo) + `equipos_competencias` (relación formal con
federación, categoría externa, número de afiliación). Sprint FASE 5.2.

**Import CSV.** Carga masiva de fixture y/o resultados desde archivo CSV.
Valida por fila y reporta errores individuales. Crea eventos + partidos_detalle
asociados al torneo. Sprint FASE 5.2.

**Fixture (auto-generador).** Sistema que genera automáticamente los partidos de
un torneo según su formato. 6 algoritmos TS puros en
`modules/torneos/lib/fixture-generators/`: liga (round-robin circle algorithm),
eliminación (bracket con byes), grupos+playoff, suizo, triangular, cuadrangular.
Flujo: preview (sin persistir) → confirmar (crea eventos + partidos_detalle).
Sprint FASE 5.3.

**Fase (de fixture).** Etapa del torneo a la que pertenece un partido: `ida`,
`vuelta`, `grupo_A`, `cuartos`, `semifinal`, `final`, `tercer_puesto`,
`regular`, `ronda_1`, `playoff_*`. Columna `fase` en `partidos_detalle`.

**Fecha (número).** Jornada o ronda del torneo (1-indexed). Columna
`fecha_numero` en `partidos_detalle`. Al confirmar fixture, cada fecha se
programa con 7 días de diferencia a partir de la fecha inicio.

**Tabla de posiciones.** Ranking de equipos en un torneo calculado dinámicamente
por la SQL function `calcular_tabla_posiciones(p_torneo_id, p_categoria_id)`.
Agrega stats de `partidos_detalle` (local + visitante CTEs). Ordena por puntos
DESC, diferencia de goles DESC, goles a favor DESC. Criterios desempate
configurables por torneo (jsonb). UI en `/admin/competencias/torneos/[id]/posiciones`.

**Scouting.** Ficha de evaluación de un jugador (propio o externo). Vive en
`scouting_fichas`.

**Evento.** Cualquier actividad agendada del club: entrenamiento, partido,
reunión, evento social. Vive en `eventos`.

**Asistencia.** Registro de presencia de una persona en un evento. Vive en
`evento_asistencias`. 6 estados: pendiente, presente, ausente, tarde,
justificado, lesionado. Upsert idempotente por (tenant, evento, persona).

**Invitado a evento.** Registro en `evento_invitados` que vincula una persona,
entidad o equipo con un evento. Polymorphic con CHECK exactly_one_not_null.
Origen: `auto_plantel` (auto-poblado desde personas_equipos), `manual`
(agregado por admin), `evento_rol` (rol especial en el evento).

**Plantel del evento.** Conjunto de invitados auto-poblados lazy al visitar la
pantalla de asistencia de un evento con equipo asignado. Se carga desde
`personas_equipos` activos del equipo. Idempotente (no duplica si ya existen).

**Veredicto (acceso).** Resultado de la verificación de acceso al club:
`verde` (socio activo, visitante temporal vigente, o invitado a evento hoy),
`amarillo` (invitado a evento cercano pero no hoy), `rojo` (sin membresía,
sin vigencia ni invitaciones). Se determina por RPC `verificar_acceso_persona`
y se registra en `acceso_logs`.

**Visitante temporal.** Persona registrada en un padrón de tipo
`visitantes_temporales` con `fecha_vigencia_hasta` vigente. Creada
por el módulo de nóminas externas al confirmar items. La RPC
`verificar_acceso_persona` les otorga veredicto `verde` si la vigencia
no expiró.

**Acceso log.** Registro de cada consulta de DNI en la pantalla de guardia.
Audit trail con veredicto, motivos, persona encontrada, guardia que consultó.
Vive en `acceso_logs`.

**Guardia (acceso).** Persona con atributo `acceso.guardia` que opera la
pantalla de control de acceso. Puede buscar por DNI y marcar presente en
eventos.

**Planificador mensual.** Vista de calendario mensual de eventos del club con
drag-and-drop para reprogramar. Usa react-big-calendar con localización en
español. Sprint 4.1.

**Mover ocurrencia vs serie.** Al arrastrar un evento recurrente en el
planificador, el usuario elige si mueve solo esa fecha (crea evento huérfano
hijo, no modifica el padre) o toda la serie (actualiza el evento padre y
recalcula recurrencia).

**Planificador semanal.** Vista de calendario con grilla horaria de 6 AM a
11 PM, drag-and-drop para mover eventos entre días y resize para cambiar
duración arrastrando bordes. Sprint 4.2.

**Resize de evento.** Arrastrar borde superior o inferior de un evento en la
vista semanal para cambiar su hora de inicio o fin sin moverlo de día.
Reutiliza `moverEventoAction` (misma action que para mover).

**Amistoso.** Partido contra club externo no vinculado a torneo oficial.
Tipo de evento (`tipo_evento_slug='amistoso'`) con organizador integrado
que incluye logística, nómina del rival y plantel propio. Sprint 4.4.

**Logística del amistoso.** Datos operativos del amistoso guardados en
`eventos.metadata.logistica_amistoso` (jsonb): colores de camiseta,
contacto del rival, observaciones. No tabla propia.

**Plan de entrenamiento.** Planificación de un entrenamiento con objetivo,
intensidad general y bloques ordenados de ejercicios. 1:1 con un evento de
tipo `entrenamiento`. Vive en `entrenamiento_planes` con UNIQUE(evento_id).

**Bloque de entrenamiento.** Unidad dentro de un plan: un ejercicio del
catálogo o un bloque libre con nombre personalizado. Tiene orden, duración,
repeticiones, series, intensidad override y notas. Vive en
`entrenamiento_plan_bloques`. CHECK: debe tener `ejercicio_id` O
`nombre_personalizado`.

**Ejercicio (catálogo).** Actividad deportiva catalogada con categoría
(calentamiento, técnica, físico, táctico, mental, enfriamiento), duración
sugerida e intensidad. Vive en `catalogo_ejercicios`. `tenant_id` NULL =
global (seed), non-null = personalizado del tenant.

**Suscriptor.** Persona (jugador o no) que aporta económicamente a un fondo
específico (ej: Fondo Fútbol). Modelado como atributo `suscriptor` +
suscripción al plan correspondiente.

**Jugador.** Persona con atributo `jugador` y membresía activa en al menos
un equipo. Concepto Vertical (no aplica a no-clubes).

**Socio.** Persona con membresía activa al club. Modelado como atributo
`socio` + pertenencia a padrón global del tenant.

**Tipo de socio.** Categoría de socio según el tenant (cadete, pleno,
adherente, vitalicio, honorario). Vive en `catalogo_tipos_socio`.

---

## 5. Conceptos de dominio (Módulos transversales)

**Contrato laboral.** Relación de empleo entre el tenant y una persona.
Vive en `rrhh_contratos`. Tiene puesto, área, modalidad, fecha alta/baja,
remuneración.

**Liquidación.** Cálculo mensual del pago a un empleado. Vive en
`rrhh_liquidaciones`. Genera movimiento de caja al pagarse.

**Datos médicos.** Información de salud relevante para la práctica deportiva:
grupo sanguíneo, alergias, enfermedades, medicación. Vive en
`personas_datos_medicos`. Acceso restringido por RLS y permisos.

**Obra social.** Cobertura médica de la persona. Vive en `personas_obra_social`.

**Autorización.** Permiso firmado por persona o tutor (uso de imagen,
salidas, tratamientos médicos). Vive en `personas_autorizaciones`.

**Contacto de emergencia.** Persona contactable en caso de emergencia. Vive
en `personas_contactos_emergencia`.

---

## 6. Conceptos técnicos (Plataforma)

**Multi-tenant.** Arquitectura donde un único sistema sirve a múltiples
clientes aislados entre sí por `tenant_id` y políticas RLS.

**RLS (Row Level Security).** Mecanismo de Postgres que filtra filas por
política a nivel base de datos. Reglas en `MASTER-PROJECT.md` D1 y
`ARCHITECTURE.md` R-MT2.

**Módulo (de tenant).** Capacidad activable o desactivable por cliente.
Catálogo global en `catalogo_modulos`, activación en `tenant_modulos`.

**Importador / Import Pipeline.** Receta declarativa para procesar archivos
de datos (Excel, CSV) e insertarlos en el sistema con matching contra
datos existentes. Vive en `import_pipelines`.

**Pipeline slug.** Identificador único del pipeline (ej:
`jugadores_por_equipo`, `suscriptores_por_equipo`).

**Run de import.** Una corrida de un pipeline sobre un archivo específico.
Vive en `import_runs`.

**Row de import.** Cada fila procesada del archivo. Vive en `import_rows`
con su raw_data, parsed_data, match_status, apply_status.

**Parser.** Función que toma un Excel/CSV y devuelve filas parseadas
estructuradas. Ej: `agrupado_por_grupo.ts`.

**Apply rule.** Acción declarativa que un pipeline ejecuta al aplicar
(`enriquecer_persona`, `agregar_atributo`, `crear_persona_nueva`, etc.).

**Match fuzzy.** Algoritmo de comparación de strings tolerante a errores.
Para personas, implementado vía función SQL `match_persona_fuzzy` que
tokeniza, normaliza y compara con similitud trigram.

**Match status.** Estado de matching de un row: `exacto`, `auto_fuzzy`,
`manual_review`, `sin_match`, `conflict`, `discarded`.

**Match score.** Puntaje 0-1 que indica grado de similitud entre fila del
archivo y persona existente.

**Threshold high / low.** Umbrales del match: arriba de `high` se auto-aplica,
abajo de `low` se descarta, entre los dos requiere revisión humana.

**Apply (aplicar run).** Operación final que ejecuta las apply_rules sobre
las filas resueltas de un run.

**Idempotencia.** Propiedad de una operación que puede repetirse sin
generar duplicados ni cambios indeseados.

**Vista (user_vista).** Configuración personalizada de columnas/filtros
para una tabla, guardada por usuario. Vive en `user_vistas`.

**Audit log.** Bitácora de cambios sensibles del sistema. Vive en
`audit_log` con tabla, registro_id, acción, usuario, timestamp.

**Server action.** Función TypeScript en Next.js marcada con `'use server'`
que ejecuta una mutación en backend desde una llamada de cliente.

**RSC (React Server Component).** Componente que renderiza en servidor y
puede llamar a queries directamente.

**Migration.** Cambio versionado a la estructura o datos de la DB. Aplicado
vía Supabase MCP.

**Seed.** Datos iniciales que un tenant nuevo necesita para funcionar
(catálogos base, plan de cuentas template).

---

## 7. Nombres propios

**ClubCore.** Producto SaaS multi-cliente para clubes deportivos. Primer
vertical del troncal a construir.

**Hindu Club.** Primer cliente y caso piloto de ClubCore. No paga. Sirve
como caso de marketing.

**Levy Wald CMO SRL.** Empresa de Yair que provee dirección externa de
marketing a PyMEs. Estructura societaria 80/20 con Kate.

**Kontrol.ar.** Producto futuro de la agencia Levy Wald CMO. Hub de
marketing/CRM que se integrará con el troncal de ClubCore eventualmente.

**Code (Claude Code).** Implementador del proyecto. Genera código, ejecuta
sprints según spec del arquitecto.

**Arquitecto.** Rol que ejecuta planning, diseño y aprobación. En este
proyecto: Claude Opus (chat web).

**FACCMA, AIF.** Federaciones de fútbol amateur de las que participan los
equipos de Hindu.

---

## 8. Abreviaciones

| Sigla | Significado |
|---|---|
| ADR | Architecture Decision Record |
| AFIP | Administración Federal de Ingresos Públicos (Argentina) |
| API | Application Programming Interface |
| CRM | Customer Relationship Management |
| DDL | Data Definition Language (SQL: CREATE, ALTER, DROP) |
| DML | Data Manipulation Language (SQL: INSERT, UPDATE, DELETE) |
| DNI | Documento Nacional de Identidad (Argentina) |
| ERP | Enterprise Resource Planning |
| FK | Foreign Key |
| HOC | Higher-Order Component (React) |
| JWT | JSON Web Token |
| MCP | Model Context Protocol |
| MP | MercadoPago |
| MVP | Minimum Viable Product |
| PIM | Product Information Management |
| PK | Primary Key |
| PWA | Progressive Web Application |
| RLS | Row Level Security |
| ROI | Return On Investment |
| RRHH | Recursos Humanos |
| RSC | React Server Component |
| SaaS | Software as a Service |
| SQL | Structured Query Language |
| SSO | Single Sign-On |
| SSR | Server-Side Rendering |
| TS | TypeScript |
| UI | User Interface |
| UUID | Universally Unique Identifier |
| UX | User Experience |

---

## 9. Convenciones de terminología

### Persona vs Usuario

- **Persona:** registro en `personas`. Existe sin necesidad de poder
  loguearse.
- **Usuario:** registro en `auth.users` (Supabase Auth). Una persona puede
  o no tener usuario asociado.

Una persona puede ser jugador sin nunca loguearse. Un usuario siempre debe
estar asociado a una persona.

### Cliente vs Persona con atributo cliente

NO existe tabla "clientes". Existe `personas` (o `entidades`) con atributo
`cliente`. Misma regla para "proveedores", "empleados", "socios".

### Producto vs Servicio

Conceptualmente distintos en el comercio, pero modelados ambos en
`productos_servicios` con campo `tipo` que diferencia. Las cuotas, fondos,
sueldos, ventas — todos pasan por esta tabla.

### Cuota vs Pago

- **Cuota emitida:** obligación de pago (lo que se le debe al club).
- **Movimiento de caja:** pago efectivo (lo que entró/salió de una caja).
- **Cobro de cuota:** acción que asocia una cuota emitida con un movimiento
  de caja, marcando la cuota como cobrada.

### Tenant vs Cliente

- **Tenant:** instancia técnica del sistema.
- **Cliente:** persona o entidad con atributo `cliente` que compra al
  tenant.

NUNCA confundirlos. "Crear un cliente" = INSERT en `personas` con atributo.
"Crear un tenant" = onboarding de un nuevo club al SaaS (acción de
sistema).

---

## 10. Términos prohibidos

Estos términos NO se usan en código, docs ni UI por ambigüedad o
inconsistencia con el modelo:

- **"usuario"** referido a persona del club (usar **persona**)
- **"miembro"** sin contexto (usar **socio**, **jugador**, **suscriptor**
  según corresponda)
- **"cliente"** como tabla (usar **persona con atributo cliente**)
- **"facturación"** indiscriminado (usar **emisión de cuotas**, **cobranza**
  o **comprobante** según contexto)
- **"datos personales"** sin especificar (usar el módulo concreto: salud,
  laboral, documentos, etc.)
- **"app"** sin clarificar (es web SaaS hoy; app móvil = futuro)
- **"reportes"** genérico (usar el reporte específico: balance, ingresos,
  deudores, etc.)

---

## 11. Cómo proponer un término nuevo

Si durante el desarrollo aparece un concepto que requiere nombre, el
arquitecto:

1. Verifica que no exista término similar en este glosario
2. Define la palabra y su contraste con conceptos cercanos
3. Agrega entrada en este documento
4. Lo difunde en el próximo `PROMPT-ENVELOPE` de Code

Code NO crea términos nuevos. Si necesita uno, para y consulta.
