UI-UX-PATTERNS — Patrones canónicos de UI/UX  
\================================================

Versión: 1.0  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Path esperado en repo: docs/UI-UX-PATTERNS.md  
Referencias: DESIGN-SYSTEM.md (componentes base), BRAND-PLATFORM.md (tono), UI-UX.md (layouts generales, vigente, no se reemplaza)

PROPÓSITO  
\=========

Este documento define los patrones específicos de pantalla, navegación, feedback y formularios que Code aplica en cada sprint (PROMPT-TEMPLATE PARTE 5).

Si DESIGN-SYSTEM dice "qué componentes usar y cómo se ven", UI-UX-PATTERNS dice "cómo armar pantallas completas usando esos componentes". Si UI-UX.md define los layouts globales y mobile-first, este doc detalla los PATRONES REUSABLES dentro de esos layouts.

PATRONES DE PÁGINA  
\====================

PATRÓN A — LISTADO CON FILTROS  
───────────────────────────────

Cuándo: pantallas que muestran una colección de entidades (personas, productos, eventos, proyectos, tareas, etc.).

Layout:

\`\`\`  
\+--------------------------------------------------------------+  
| Page Title                              \[+ Nuevo\] (primary)  |  
| Descripción breve (opcional, text-secondary)                 |  
\+--------------------------------------------------------------+  
| Toolbar (sticky en scroll):                                  |  
|   \[Buscar...\]  \[Filtro1 ▼\]  \[Filtro2 ▼\]    \[Acciones ▼\]    |  
\+--------------------------------------------------------------+  
| Tabla DataTable:                                             |  
|   Col1   | Col2   | Col3   | Col4   | Acciones              |  
|   data   | data   | data   | data   | \[...\]                 |  
|   data   | data   | data   | data   | \[...\]                 |  
\+--------------------------------------------------------------+  
|                              \[\< 1 2 3 ... 10 \>\] paginación   |  
\+--------------------------------------------------------------+  
\`\`\`

Estados:  
\- Loading: skeleton de la tabla  
\- Empty (sin filtros): EmptyState con CTA "+Crear primero"  
\- Empty (con filtros activos): "No hay resultados. Probá ajustar los filtros." \+ botón "Limpiar filtros"  
\- Error: Alert destructive \+ botón "Reintentar"

Acciones por row:  
\- Click row → navega a /detalle/\[id\]  
\- Botón "..." abre dropdown con: Ver, Editar, Borrar (destructive separator arriba)  
\- Acciones masivas (si aplica): checkbox por row \+ botón "Acciones (N)" cuando hay seleccionados

Mobile:   
\- Toolbar colapsa a \[Filtros ▼\] \+ \[+Nuevo\]  
\- Tabla se convierte en lista de cards con info principal

PATRÓN B — DETALLE CON TABS  
────────────────────────────

Cuándo: pantallas que muestran info detallada de UNA entidad con múltiples aspectos (persona, producto, equipo, evento, proyecto).

Layout:

\`\`\`  
\+--------------------------------------------------------------+  
| \[← Volver\]                                                   |  
|                                                              |  
| Avatar/Icon  |  Title (h1)                  \[Editar\] \[...\]  |  
|              |  Subtitle / metadata                          |  
|              |  \[Badge\] \[Badge\] \[Badge\]                      |  
\+--------------------------------------------------------------+  
| Tabs: Info | Relacionados | Histórico | Documentos          |  
\+--------------------------------------------------------------+  
| Contenido del tab activo                                     |  
\+--------------------------------------------------------------+  
\`\`\`

Tab por defecto: el más usado ("Info" o "General").  
Tabs alternativas: máximo 6, después overflow con "Más ▼".

Mobile:  
\- Tabs se vuelven select dropdown  
\- Avatar/Icon abajo del título

PATRÓN C — FORM EN MODAL/DRAWER  
────────────────────────────────

Cuándo: crear o editar entidad, sin abandonar el contexto.

Estructura:

\`\`\`  
\+--------------------------------------------------------------+  
| Modal Title                                            \[X\]   |  
\+--------------------------------------------------------------+  
| Body:                                                        |  
|   Sección "Identificación"                                  |  
|     \[Label\]                                                 |  
|     \[Input completo\]                                        |  
|     \[helper text\]                                           |  
|                                                              |  
|     \[Label\]                                                 |  
|     \[Input completo\]                                        |  
|                                                              |  
|   Sección "Detalles" (collapsible si es largo)             |  
|     \[Más campos...\]                                         |  
\+--------------------------------------------------------------+  
| Footer:                          \[Cancelar\] \[Guardar primary\]|  
\+--------------------------------------------------------------+  
\`\`\`

Decisión modal vs drawer:  
\- Modal (centrado): forms cortos, 1 sección, \< 6 campos  
\- Drawer (right o bottom): forms largos, multi-sección, \> 6 campos

Validación:  
\- Inline al perder foco del campo  
\- Error abajo del input en text-sm text-red-600  
\- Botón Submit deshabilitado mientras hay errores

Mobile: drawer bottom siempre (full-width, drag to dismiss).

PATRÓN D — VISTA KANBAN  
────────────────────────

Cuándo: gestión de tareas, items con estado fluido (Proyectos & Tareas, leads de pre-inscripciones, scouting).

Layout:

\`\`\`  
\+--------------------------------------------------------------+  
| \[Filtros\] \[Vista: Kanban / Lista / Calendario\] \[+Nuevo\]    |  
\+--------------------------------------------------------------+  
| Columna1   Columna2   Columna3   Columna4   Columna5        |  
| (5 items) (3 items)  (8 items)  (2 items)  (12 items)      |  
|                                                              |  
| \[Card\]    \[Card\]     \[Card\]     \[Card\]     \[Card\]           |  
| \[Card\]    \[Card\]     \[Card\]                \[Card\]           |  
| \[Card\]               \[Card\]                \[Card\]           |  
|                      \[Card\]                \[Card\]           |  
|                                                              |  
| \[+Card\]   \[+Card\]    \[+Card\]    \[+Card\]    \[+Card\]          |  
\+--------------------------------------------------------------+  
\`\`\`

Cards:  
\- Title (semibold)  
\- Subtitle (text-sm secondary)  
\- Badges (estado, prioridad, asignado)  
\- Drag handle implícito (toda la card)

Drag and drop con dnd-kit:  
\- Drag: scale 1.05, shadow-lg  
\- Drop zone activa: bg slate-100, border dashed  
\- Drop animation: 200ms spring suave

Mobile: lista vertical de columnas, scroll horizontal para columnas, vertical para cards.

PATRÓN E — VISTA CALENDARIO  
────────────────────────────

Cuándo: eventos, entrenamientos, partidos, reservas, fechas límite de proyectos.

Layout:

\`\`\`  
\+--------------------------------------------------------------+  
| \[\< Hoy \>\]  \[Mes ▼\]  \[Semana\] \[Día\]      \[+Evento\] (primary) |  
\+--------------------------------------------------------------+  
| Lun  | Mar  | Mié  | Jue  | Vie  | Sáb  | Dom               |  
|  1   |  2   |  3   |  4   |  5   |  6   |  7                |  
| evt  |      | evt  | evt  |      |      | evt               |  
|  8   |  9   | 10   | 11   | 12   | 13   | 14                |  
|      | evt  |      | evt  | evt  |      |                   |  
\+--------------------------------------------------------------+  
\`\`\`

Click en celda vacía → crear nuevo evento ese día  
Click en evento → modal con detalle \+ acciones (Ver detalle, Editar, Eliminar)  
Drag de evento → mover de día (con confirmación)  
Resize del bottom de un evento → cambiar duración

Vistas: Mes (default), Semana, Día.

PATRÓN F — DASHBOARD  
─────────────────────

Cuándo: pantallas resumen con métricas \+ listados rápidos (admin home, vertical home, reportes).

Layout (grid responsive):

\`\`\`  
\+--------------+--------------+--------------+--------------+  
| Métrica 1    | Métrica 2    | Métrica 3    | Métrica 4    |  
| BIG number   | BIG number   | BIG number   | BIG number   |  
| Trend ↑/↓    | Trend ↑/↓    | Trend ↑/↓    | Trend ↑/↓    |  
\+--------------+--------------+--------------+--------------+

\+----------------------------------+---------------------+  
| Gráfico principal                | Lista lateral       |  
| (chart recharts)                 | \- Item 1            |  
|                                  | \- Item 2            |  
|                                  | \- Item 3            |  
|                                  | \[Ver todo →\]        |  
\+----------------------------------+---------------------+

\+--------------------------------------------------------------+  
| Tabla secundaria con últimos N items                        |  
\+--------------------------------------------------------------+  
\`\`\`

Cards métricas:  
\- Title text-sm text-secondary  
\- Number text-3xl font-semibold  
\- Trend con icon (ArrowUp/Down) \+ porcentaje text-sm

Mobile: grid se vuelve stack vertical.

PATRONES DE NAVEGACIÓN  
\=======================

SIDEBAR  
\--------

Estructura jerárquica por capa (siguiendo MODULE-CATALOG):

\`\`\`  
\[Logo / Nombre\]                       (header, fijo)  
────────────────────────────────────  
\[Inicio\]                              (dashboard admin)

TRONCAL                                (label section)  
  \[Personas\]  
  \[Entidades\]  
  \[Productos\]                          (PIM)  
  \[Finanzas ▼\]  
    \[Cajas\]  
    \[Movimientos\]  
    \[Cuotas\]  
    \[Transferencias\]  
  \[Comunicaciones\]  
  \[Calendario\]  
  \[Proyectos\]

CROSS-VERTICAL                         (solo módulos activos)  
  \[Asistencias\]  
  \[Reservas\]  
  \[Documentos\]                          (si activo)  
  \[Tickets\]                             (si activo)

CLUB DEPORTIVO                         (vertical, label section)  
  \[Equipos\]  
  \[Planificadores\]  
  \[Competencias\]  
  \[Salud\]  
  \[Scouting\]

CONFIGURACIÓN                          (footer del sidebar)  
  \[Marketplace\]  
  \[Settings\]  
  \[Usuarios\]  
\`\`\`

Items:  
\- Icon (Lucide) \+ label  
\- Active: bg slate-900 text white  
\- Hover: bg slate-100  
\- Items disabled (módulo no contratado): icon Lock \+ text slate-400, click abre marketplace

Mobile: sidebar colapsa a drawer accesible por hamburger en header.

BREADCRUMBS  
\------------

Cuándo: pantallas anidadas a profundidad \>= 2 niveles.

Formato:  
\`\`\`  
Inicio \> Personas \> Juan Pérez \> Lesiones  
\`\`\`

Cada item clickable lleva a la pantalla correspondiente, último item disabled (página actual).

Mobile: solo muestra el último item con \[← Volver\] explícito.

TABS DE ENTIDAD  
\----------------

(Ya cubiertos en Patrón B Detalle.)

Convenciones:  
\- Tab "General" o "Info" siempre primero  
\- Tabs ordenadas por frecuencia de uso  
\- Tab "Histórico" o "Auditoría" al final

PATRONES DE FEEDBACK  
\=====================

CONFIRMACIÓN DESTRUCTIVA  
─────────────────────────

Cuándo: borrar, eliminar, cancelar suscripción, transferir propiedad.

Modal:  
\- Title: "¿\[Acción\] \[entidad\]?"  
\- Description: detalle de lo que va a pasar \+ advertencia clara  
\- Botones footer:  
  \- \[Cancelar\] (ghost)  
  \- \[Sí, \[acción\]\] (destructive)

NO usar texto pasivo tipo "¿Estás seguro?". Usar texto activo: "¿Borrar el proyecto 'Casa González'?".

TOAST DE ACCIÓN  
────────────────

Después de una acción exitosa o fallida, toast en bottom-right:

Success:  
\- Icon CheckCircle2 verde  
\- Texto corto: "\[Entidad\] creada", "Cambios guardados", "Email enviado"  
\- Auto-dismiss 4s

Error:  
\- Icon XCircle rojo  
\- Texto: "Error: \[razón corta\]. Reintentá."  
\- Botón "Reintentar" si aplica  
\- Permanece hasta dismiss manual o nuevo toast

NO usar toast para info general (usar Alert o tooltip).

CONFIRMACIÓN NO DESTRUCTIVA  
────────────────────────────

Cuándo: confirmar antes de operación costosa o reversible (publicar, enviar masivo, aprobar).

Modal:  
\- Title: "¿\[Acción\]?"  
\- Description: lo que va a pasar  
\- Botones footer:  
  \- \[Cancelar\] (ghost)  
  \- \[Sí, \[acción\]\] (primary)

PATRONES DE FORMULARIO  
\=======================

CAMPOS BÁSICOS  
───────────────

Estructura por campo:

\`\`\`  
\[Label\]                     (text-sm font-medium text-slate-700)  
\[Input completo\]            (h-10 px-3 border slate-300)  
\[Helper text\]               (text-xs text-slate-500, opcional)  
\[Error message\]             (text-sm text-red-600, solo si hay error)  
\`\`\`

Spacing entre campos: gap-4 (16px).  
Spacing entre secciones: gap-6 (24px).

CAMPOS REQUERIDOS  
──────────────────

Indicador: asterisco rojo después del label.  
\`\`\`  
Nombre \*  
\[Input\]  
\`\`\`

NO mostrar "Requerido" en helper text (redundante con asterisco).

SELECT / COMBOBOX  
──────────────────

Para listas de opciones:  
\- \< 5 opciones: RadioGroup o Select simple  
\- 5-15 opciones: Select dropdown  
\- \> 15 opciones o necesita búsqueda: Combobox con búsqueda inline

Default value:  
\- Sin default si es campo crítico (forzar elección consciente)  
\- Con default si hay opción más común (ej. moneda ARS para Argentina)

CAMPOS DEPENDIENTES  
────────────────────

Cuándo: un campo se completa o filtra según otro (ej. seleccionar Equipo → cargar lista de Personas de ese equipo).

Behavior:  
\- Campo dependiente disabled hasta que el padre tenga valor  
\- Loading state mientras se cargan opciones  
\- Helper text: "Seleccioná primero \[campo padre\]"

ARCHIVOS / UPLOADS  
───────────────────

Patrón estándar:  
\- Drop zone con icono \+ texto "Arrastrá o hacé click para subir"  
\- Aceptados claros: "PDF, JPG, PNG. Max 5MB."  
\- Progress bar durante upload  
\- Lista de archivos subidos con \[X\] para eliminar  
\- Validación cliente antes de enviar al server

Para Sprint A1 en adelante, usar Supabase Storage según ADR existente.

VALIDACIÓN  
───────────

Validation rules en Zod schema, ejecutadas:  
\- Onblur del campo (inline)  
\- Onsubmit del form (final check)

Mensajes en español, accionables:  
\- "Email inválido. Ejemplo: nombre@empresa.com"  
\- "Mínimo 8 caracteres"  
\- "Este SKU ya existe. Elegí otro."

NO usar:  
\- "Required field"  
\- "Invalid input"  
\- "Please enter a valid email"

SUBMIT  
───────

Botón Submit:  
\- Primary variant  
\- Texto verbo de acción: "Crear", "Guardar cambios", "Enviar", "Publicar"  
\- Disabled si form inválido  
\- Loading state durante request: spinner inline \+ texto "Creando...", "Guardando..."  
\- Cancel/Cerrar disponible durante loading (cancela la operación)

SHORTCUTS DE FORM  
──────────────────

Atajos canónicos:  
\- Esc: cerrar modal (con confirmación si hay cambios sin guardar)  
\- Cmd/Ctrl \+ Enter: submit del form  
\- Tab: navegación normal entre campos

PATRONES DE BÚSQUEDA Y FILTROS  
\================================

BÚSQUEDA SIMPLE  
────────────────

Input con icono Search a la izquierda, placeholder específico ("Buscar productos por nombre o SKU...").

Behavior:  
\- Debounce 300ms (no search por cada tecla)  
\- Limpiar resultados visibles mientras se tipea (loading state)  
\- "X" para limpiar el input visible cuando hay texto  
\- Sin botón "Buscar" explícito (search live)

FILTROS DROPDOWN  
─────────────────

Pattern: Select dropdown con label que indica el filtro.

Ejemplo:  
\`\`\`  
\[Estado: Todos ▼\]  
\`\`\`

Al elegir valor, se actualiza el label:  
\`\`\`  
\[Estado: Activos\]   \[X clear\]  
\`\`\`

Multiple values: chip list con \[X\] por chip.

FILTROS AVANZADOS (PANEL)  
──────────────────────────

Cuándo: \> 4 filtros disponibles, casos complejos (reportes, segmentación).

Drawer lateral con todos los filtros agrupados.  
Botón "Aplicar filtros" abajo, badge con cantidad activos.

COMMAND PALETTE  
────────────────

Atajo Cmd/Ctrl \+ K abre command palette global con:  
\- Búsqueda fuzzy de pantallas  
\- Búsqueda de entidades por nombre  
\- Comandos rápidos ("Crear persona", "Ir a Finanzas")

(Implementación post-Sprint A2.)

PATRONES DE TABLAS  
\====================

Ya cubierto en Patrón A. Detalles adicionales:

ORDENAMIENTO  
─────────────

Headers sortable:  
\- Icon flecha arriba/abajo según orden  
\- Click: ciclo asc → desc → sin orden  
\- Solo 1 columna ordenada a la vez (por simplicidad)

PAGINACIÓN  
───────────

Bottom de la tabla:  
\`\`\`  
Mostrando 1-25 de 247          \[\< 1 2 3 ... 10 \>\]  
\`\`\`

Default page size: 25\.  
Selector de page size: 10 / 25 / 50 / 100\.

SELECCIÓN MASIVA  
─────────────────

Checkbox header selecciona toda la página.  
Banner aparece cuando hay seleccionados:  
\`\`\`  
3 items seleccionados   \[Acción ▼\] \[Cancelar\]  
\`\`\`

EXPANSIÓN DE ROW  
─────────────────

Cuándo: detalle inline sin navegar a otra pantalla.

Click en row abre/cierra contenido extendido debajo de la row.  
Icon flecha derecha rota a abajo cuando expanded.

PATRONES MOBILE  
\================

DRAWER VS MODAL  
────────────────

\- Modal centrado: forms cortos, alertas, confirmaciones  
\- Drawer bottom: forms largos, opciones expandidas, multi-acción

Drawer bottom siempre tiene drag handle visible en top (línea horizontal).

BOTTOM NAVIGATION  
──────────────────

Cuándo: 3-5 pantallas top-level frecuentes.

Tab bar fija en bottom con icon \+ label.  
NO usar bottom nav si hay más de 5 secciones (usar drawer hamburger).

TOUCH GESTURES  
───────────────

\- Swipe horizontal en tabs para cambiar (opcional, complementa click)  
\- Swipe vertical down en modal/drawer para dismiss  
\- Long press en row para acciones rápidas (mobile only)  
\- Pull to refresh en listados (opcional)

CUÁNDO SE ACTUALIZA  
\====================

\- Al cierre de Sprint A1 (validación práctica de patrones)  
\- Cuando un sprint introduce un patrón NUEVO no cubierto acá  
\- Cuando se descubre una mejora a un patrón existente

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 1.0.  
Próxima revisión: al cierre de Sprint A1.  
