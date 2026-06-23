# ADR-066 — Arquitectura de Información del menú (mundo-del-club)

> Espejo de Drive `_Decisiones/ADR-066 — Arquitectura de Información del menú (mundo-del-club)`. Fuente de verdad allí.
> Terminología original del autor ("ClubCore v2 / SaaS Modular Vertical", siglas CRM/ERP/PIM/WMS) preservada como mirror; el vocabulario canónico vigente es F0–F10 + "SaaS Empresarial / Plataforma SaaS Multimodal" (ver ADR-065, GLOSSARY).

**Estado**: Aprobado (filosofía) por Yair; árbol pendiente de validación visual
**Fecha**: 01-jun-2026
**Autor**: Dirección Externa (Opus)
**Milestone**: F1
**Habilitado por**: RFC-006 (navegación data-driven). Este ADR define QUÉ árbol; RFC-006 definió CÓMO se renderiza (desde `catalogo_modulos`).

## 1. Contexto y decisión

Yair propuso reorganizar el menú como CRM / ERP / PIM / WMS / Mi Club (por tipo de dato). Tras benchmark (Salesforce, HubSpot, Odoo, Shopify) se decide: el menú de usuario se organiza **por mundo-del-club** (lo que el usuario hace), y las siglas CRM/ERP/PIM/WMS quedan como **capa de arquitectura/facturación** (columna `capa` del catálogo), **no** como labels de navegación.

Razón (benchmark): ningún líder muestra al usuario final las siglas CRM/ERP/PIM/WMS. Odoo (el más análogo) navega por apps de función de negocio; Shopify por tarea (Pedidos, Productos, Clientes). Las siglas son cómo se vende y cómo está construido, no cómo se navega. El dirigente del club piensa "voy a Productos", no "voy al PIM".

Beneficio operativo clave: como RFC-006 dejó el menú saliendo de `catalogo_modulos`, aplicar este árbol **no es trabajo de Code** — es reasignar `area_sidebar_bo` / `sub_area_sidebar_bo` por MCP (lane de Opus). Reversible, sin migración de código, visible al instante en producción.

## 2. Problema que resuelve (el miedo de Yair)

Las dos trampas del ERP: (a) obligar a reconectar módulos, (b) obligar a recargar dato. Y la duplicación visual: Personas/Proveedores/Productos aparecían repetidos en la propuesta CRM/ERP. Solución: cada cosa vive en **una** área del menú; el acceso desde otros contextos es vista filtrada sobre el registro único (apoyado en el modelo Actor, RFC-007). El menú no duplica: proyecta.

## 3. Árbol decidido — primer nivel (back office del club)

Orden canónico:

1. Inicio
2. Personas
3. Actividad
4. Comercial — renombre conceptual de "Recursos" en su parte de venta/producto
5. Operaciones — espacios, reservas, inventario, mapa, proyectos
6. Finanzas
7. Comunicación — renombre de "Marketing": campañas, leads, comunicaciones, landings
8. Configuración

(Admin SCL: NO es área del club; vista de holding, fuera del BO del tenant — gate por rol.)

> El árbol vigente en datos usa 8 áreas (inicio, personas, actividad, recursos, marketing, finanzas, configuracion, admin_scl). Este ADR propone renombres/reagrupamientos sobre esa base. Los renombres son de **etiqueta y de asignación**, no de módulo.

## 4. Mapeo área → módulos (contra el catálogo real, verificado 01-jun)

- **INICIO**: Notificaciones, Resumen IA (+ links core: Inicio, Calendario, Mi calendario, Mis tareas).
- **PERSONAS**: (core: Personas, Entidades, Padrones) + Membresías, Cuotas y planes, Control de acceso (Control de acceso, Vehículos y acceso), Datos médicos (Salud, Datos médicos), Datos personales (Contactos emergencia, Talles), Documentación legal (Documentos firma, Autorizaciones), Equipo/RRHH (RRHH), Operadores externos (Concesiones), Padrón externo (Nóminas externas), Solicitudes.
- **ACTIVIDAD**: Equipos, Eventos (Eventos y calendario, Asistencias), Entrenamientos, Partidos (Partidos, Amistosos, Táctica), Competencias (Competencias, Torneos), Planificación (Planificadores), Scouting, Disciplinas (8 `disciplina_*`), Educación (Polo educativo).
- **COMERCIAL**: Productos (PIM: Productos + subitems Categorías/Marcas/Listas de precios), Proveedores, Ecommerce. [Pricing puede vivir acá o en Finanzas — decidir en validación.]
- **OPERACIONES**: Espacios y reservas (Reservas, Espacios físicos), Inventario (Stock, Inventario), Inventario asignable (Utilería), Mapa del predio (Mapa del club), Proyectos internos (Proyectos).
- **FINANZAS**: Contabilidad (Finanzas + subitems Reportes/Conciliación/Plan de cuentas/Períodos), Cajas (Caja), Pricing [si no va en Comercial].
- **COMUNICACIÓN**: Campañas masivas, Captura de leads, Comunicaciones transaccionales (Mensajería in-app), Landings y formularios.
- **CONFIGURACIÓN**: Branding, Sedes (Multi-sede), Módulos del tenant, Soporte, IA (Asistente IA, Acciones por voz, Resumen IA setup), Integraciones (21 conectores), Vertical (7 verticales).
- **ADMIN SCL** (fuera del BO del club, gate por rol): Billing, Tenants (Super-admin), MCP Server.

## 5. Decisiones abiertas (a resolver en validación visual)

- **5.1.** ¿"Comercial" vs mantener "Recursos"? Default propuesto: **Comercial**.
- **5.2.** ¿"Operaciones" como área separada o subsumir? Default: **área propia**.
- **5.3.** Pricing: ¿Comercial o Finanzas? Default propuesto: Comercial (con lectura desde Finanzas). **Resuelto en F1.8: queda en Finanzas (decisión Yair).**
- **5.4.** ¿"Comunicación" vs "Marketing"? Default: **Comunicación**.
- **5.5.** Disciplinas (8) y Educación: hoy los `disciplina_*` no tienen página propia (`ruta_bo` NULL en RFC-006) → no se renderizan hasta tener page. El árbol los contempla; el render los omite hasta que existan.

## 6. Cómo se aplica (sin Code)

Opus, por MCP sobre `catalogo_modulos`:
- `UPDATE area_sidebar_bo` / `sub_area_sidebar_bo` según el mapeo de sección 4.
- Ajustar `nombre_display` (ya 91/91) para las etiquetas nuevas.
- El render de RFC-006 toma el cambio automáticamente; Yair lo ve en producción tras refresh.

No toca repo, no migración de código, reversible (es data). Riesgo bajo. Smoke visual de Yair confirma el árbol.

## 7. Relación con otros docs

- **RFC-006** (navegación data-driven): el motor que hace esto posible.
- **RFC-007** (Actor + Roles): provee el "quién ve qué" (capabilities por rol). El árbol define la estructura; los roles definen la visibilidad por usuario.
- El rediseño NO se toca en código hasta que el árbol esté validado visualmente por Yair (este ES el ADR que lo habilita).

## 8. Fuera de scope

- Portal del socio (`area_sidebar_pc`): F3.
- Reconciliación de slugs/dirs (I-005).
- Override de menú por tenant: futuro.

## 9. Criterios de cierre

- Árbol de sección 3–4 validado visualmente por Yair en producción.
- `catalogo_modulos.area_sidebar_bo` / `sub_area_sidebar_bo` reflejan el árbol (Opus por MCP).
- Decisiones abiertas (5.1–5.5) resueltas por Yair.
- Canonizar este ADR (índice ADR) al cierre.
