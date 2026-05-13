SPRINT A6 — Proyectos & Tareas  
\====================================

Version: 1.0  
Fecha: 13 de mayo de 2026  
Path: docs/sprints/A6-proyectos-tareas.md

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO  
═══════════════════════════════════════════════════════════════════

1\. /CLAUDE.md  
2\. /docs/CURRENT-STATE.md (esperado A5 cerrado, tag v0.27.0-fase-a-sprint-5)  
3\. /docs/SPRINT-PLAN.md (A6 cierra FASE A)  
4\. /docs/rfcs/RFC-004 (D2 troncal bloque 8\)  
5\. /docs/DECISIONS.md (ADR-041 troncal mínimo)  
6\. /docs/UI-UX-PATTERNS.md (Patrón D Kanban)  
7\. /docs/ARCHITECTURE.md \+ ARCHITECTURE-ADDENDUM

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA  
═══════════════════════════════════════════════════════════════════

\[x\] CAPA BD: 4 tablas nuevas (proyectos, proyecto\_tareas, proyecto\_miembros, proyecto\_comentarios)  
\[x\] CAPA CÓDIGO: modules/proyectos  
\[x\] CAPA UI: pantallas /admin/proyectos con vistas Kanban / Lista / Calendario  
\[x\] CAPA ESTILOS, GALERÍA: estándar

═══════════════════════════════════════════════════════════════════  
SPRINT A6 — Proyectos & Tareas (cierre FASE A)  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
Al cierre:  
\- Yair puede crear proyectos con responsable, fechas, presupuesto, cliente (persona o entidad)  
\- Cada proyecto tiene tareas asignables a personas, con estado fluido (backlog/en curso/review/hecho)  
\- Vista Kanban funcional con drag and drop  
\- Vista Lista filtrable  
\- Vista Calendario con tareas por fecha límite  
\- Integración con Finanzas (proyecto\_id opcional en fin\_movimientos)  
\- Integración con Personas (tab "Proyectos" en perfil de persona)

ALCANCE

SÍ entra:

1\. Tabla proyectos (nueva)  
   \- id, tenant\_id, nombre, descripcion, codigo (opcional, ej. "PRY-2026-001")  
   \- responsable\_persona\_id (FK personas)  
   \- cliente\_persona\_id (FK personas, nullable)  
   \- cliente\_entidad\_id (FK entidades, nullable, mutuamente excluyente con cliente\_persona\_id)  
   \- fecha\_inicio, fecha\_fin\_estimada, fecha\_fin\_real  
   \- estado (planificado/en\_curso/pausado/completado/cancelado)  
   \- presupuesto\_total, presupuesto\_consumido (calculated)  
   \- moneda (default ARS)  
   \- color (hex, default slate-700)  
   \- activo, deleted\_at, created\_at, updated\_at

2\. Tabla proyecto\_tareas (nueva)  
   \- id, proyecto\_id (FK), titulo, descripcion  
   \- estado\_slug (FK a catalogo\_estados\_tarea: backlog/en\_curso/review/hecho/cancelado)  
   \- asignado\_persona\_id (FK personas, nullable)  
   \- prioridad (baja/media/alta/critica)  
   \- fecha\_limite, fecha\_completada  
   \- posicion\_kanban integer (para ordenar en cada columna)  
   \- parent\_tarea\_id (subtareas, FK self, opcional)  
   \- tiempo\_estimado\_horas numeric  
   \- tiempo\_real\_horas numeric  
   \- tags text\[\] (array de tags simples)  
   \- activo, deleted\_at, created\_at, updated\_at

3\. Tabla proyecto\_miembros (N:M proyecto-personas)  
   \- proyecto\_id, persona\_id (composite PK)  
   \- rol (responsable/miembro/observador)  
   \- fecha\_agregado

4\. Tabla proyecto\_comentarios (timeline del proyecto)  
   \- id, proyecto\_id, tarea\_id (nullable, comentario a nivel proyecto o tarea)  
   \- persona\_id (autor)  
   \- texto, created\_at  
   \- menciones jsonb (array de persona\_ids mencionadas con @)

5\. Catálogo catalogo\_estados\_tarea (seed)  
   \- backlog (Backlog), en\_curso (En curso), review (En revisión), hecho (Hecho), cancelado (Cancelado)

6\. Agregar proyecto\_id en fin\_movimientos (FK, nullable)

7\. Módulo modules/proyectos  
   \- lib/actions.ts: CRUD proyectos, tareas, comentarios, miembros  
   \- lib/queries.ts: proyectosDeUser, tareasPorProyecto, tareasDePersona  
   \- lib/permisos.ts: proyectos.admin, proyectos.editor  
   \- ui/proyecto-kanban.tsx (vista kanban con dnd-kit)  
   \- ui/proyecto-lista.tsx (vista tabla)  
   \- ui/proyecto-calendario.tsx (vista calendario, react-big-calendar)  
   \- ui/tarea-card.tsx, tarea-modal.tsx, comentario-thread.tsx

8\. Pantallas:  
   \- /admin/proyectos (listado todos los proyectos)  
   \- /admin/proyectos/\[id\] (detalle con tabs: Tablero / Lista / Calendario / Detalles / Equipo / Comentarios)  
   \- /admin/personas/\[id\] tab Proyectos (lista de proyectos donde la persona es miembro o responsable)

9\. Sidebar: ítem "Proyectos" pasa de placeholder a link activo

NO entra:  
\- Gantt chart (futuro)  
\- Time tracking detallado (esta versión solo manual horas)  
\- Dependencias entre tareas (Sprint futuro)  
\- Integraciones externas (Jira, Linear, etc.)

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM  
═══════════════════════════════════════════════════════════════════

| \# | Riesgo | Mitigación |  
| \- | \------ | \---------- |  
| S1 | Drag and drop kanban con dnd-kit puede tener bugs en safari | Test cross-browser. Fallback: botones de cambio de estado si dnd falla |  
| S2 | Posición kanban (orden dentro de columna) puede causar conflictos concurrentes | Usar fractional indexing (decimales entre items) o reorder server-side al drop |  
| S3 | Mutual exclusion cliente\_persona vs cliente\_entidad puede romperse | Check constraint a nivel DB: (cliente\_persona\_id IS NULL) \!= (cliente\_entidad\_id IS NULL) OR ambos null |  
| S4 | Calendario con muchas tareas se vuelve ilegible | Limitar a 3 tareas visibles por día \+ "+N más" expandible |  
| S5 | Subtareas con parent\_tarea\_id pueden generar ciclos | Trigger anti-ciclo similar al de categorías (Sprint A2) |  
| S6 | proyecto\_id en fin\_movimientos requiere migración no destructiva | ALTER TABLE ADD COLUMN nullable. Movimientos existentes quedan sin proyecto. |

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación  
═══════════════════════════════════════════════════════════════════

git describe \--tags \--abbrev=0  \-- v0.27.0-fase-a-sprint-5

SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='proyectos');  
SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='catalogo\_estados\_tarea');

SELECT count(\*) FROM personas WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

═══════════════════════════════════════════════════════════════════  
PARTE 2 — Migration  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — catalogo\_estados\_tarea  
CREATE TABLE IF NOT EXISTS catalogo\_estados\_tarea (  
  slug text PRIMARY KEY,  
  nombre text NOT NULL,  
  color text,  
  orden integer,  
  es\_finalizado boolean NOT NULL DEFAULT false,  
  activo boolean NOT NULL DEFAULT true  
);

INSERT INTO catalogo\_estados\_tarea (slug, nombre, color, orden, es\_finalizado) VALUES  
  ('backlog','Backlog','\#94A3B8',10,false),  
  ('en\_curso','En curso','\#4F46E5',20,false),  
  ('review','En revisión','\#D97706',30,false),  
  ('hecho','Hecho','\#059669',40,true),  
  ('cancelado','Cancelado','\#DC2626',50,true)  
ON CONFLICT (slug) DO NOTHING;

\-- 2.2 — proyectos  
CREATE TABLE IF NOT EXISTS proyectos (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  nombre text NOT NULL,  
  descripcion text,  
  codigo text,  
  responsable\_persona\_id uuid REFERENCES personas(id),  
  cliente\_persona\_id uuid REFERENCES personas(id),  
  cliente\_entidad\_id uuid REFERENCES entidades(id),  
  fecha\_inicio date,  
  fecha\_fin\_estimada date,  
  fecha\_fin\_real date,  
  estado text NOT NULL DEFAULT 'planificado' CHECK (estado IN ('planificado','en\_curso','pausado','completado','cancelado')),  
  presupuesto\_total numeric,  
  moneda text DEFAULT 'ARS',  
  color text DEFAULT '\#475569',  
  activo boolean NOT NULL DEFAULT true,  
  metadata jsonb DEFAULT '{}'::jsonb,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz,  
    
  CHECK (  
    (cliente\_persona\_id IS NULL OR cliente\_entidad\_id IS NULL)  
  )  
);

CREATE INDEX idx\_proyectos\_tenant\_estado ON proyectos(tenant\_id, estado) WHERE deleted\_at IS NULL;  
CREATE INDEX idx\_proyectos\_responsable ON proyectos(responsable\_persona\_id) WHERE responsable\_persona\_id IS NOT NULL;  
CREATE UNIQUE INDEX idx\_proyectos\_codigo\_unique ON proyectos(tenant\_id, codigo) WHERE codigo IS NOT NULL AND deleted\_at IS NULL;

CREATE TRIGGER trg\_proyectos\_updated\_at BEFORE UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;  
CREATE POLICY proyectos\_tenant ON proyectos FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.3 — proyecto\_tareas  
CREATE TABLE IF NOT EXISTS proyecto\_tareas (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  proyecto\_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,  
  titulo text NOT NULL,  
  descripcion text,  
  estado\_slug text NOT NULL DEFAULT 'backlog' REFERENCES catalogo\_estados\_tarea(slug),  
  asignado\_persona\_id uuid REFERENCES personas(id),  
  prioridad text NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja','media','alta','critica')),  
  fecha\_limite date,  
  fecha\_completada timestamptz,  
  posicion\_kanban numeric DEFAULT 0,  
  parent\_tarea\_id uuid REFERENCES proyecto\_tareas(id),  
  tiempo\_estimado\_horas numeric,  
  tiempo\_real\_horas numeric,  
  tags text\[\] DEFAULT '{}',  
  activo boolean NOT NULL DEFAULT true,  
  metadata jsonb DEFAULT '{}'::jsonb,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE INDEX idx\_tareas\_proyecto\_estado ON proyecto\_tareas(proyecto\_id, estado\_slug, posicion\_kanban);  
CREATE INDEX idx\_tareas\_asignado ON proyecto\_tareas(asignado\_persona\_id) WHERE asignado\_persona\_id IS NOT NULL;  
CREATE INDEX idx\_tareas\_fecha\_limite ON proyecto\_tareas(fecha\_limite) WHERE fecha\_limite IS NOT NULL AND deleted\_at IS NULL;

CREATE TRIGGER trg\_tareas\_updated\_at BEFORE UPDATE ON proyecto\_tareas FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

\-- Trigger anti-ciclo en subtareas  
CREATE OR REPLACE FUNCTION trg\_tareas\_no\_ciclo() RETURNS trigger AS $$  
DECLARE  
  current\_id uuid := NEW.parent\_tarea\_id;  
  depth integer := 0;  
BEGIN  
  IF NEW.parent\_tarea\_id IS NULL THEN RETURN NEW; END IF;  
  IF NEW.parent\_tarea\_id \= NEW.id THEN RAISE EXCEPTION 'Tarea no puede ser su propio padre'; END IF;  
  WHILE current\_id IS NOT NULL AND depth \< 50 LOOP  
    IF current\_id \= NEW.id THEN RAISE EXCEPTION 'Ciclo detectado en subtareas'; END IF;  
    SELECT parent\_tarea\_id INTO current\_id FROM proyecto\_tareas WHERE id \= current\_id;  
    depth := depth \+ 1;  
  END LOOP;  
  RETURN NEW;  
END;  
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg\_tareas\_no\_ciclo\_check  
  BEFORE INSERT OR UPDATE ON proyecto\_tareas  
  FOR EACH ROW EXECUTE FUNCTION trg\_tareas\_no\_ciclo();

ALTER TABLE proyecto\_tareas ENABLE ROW LEVEL SECURITY;  
CREATE POLICY tareas\_via\_proyecto ON proyecto\_tareas FOR ALL USING (  
  proyecto\_id IN (SELECT id FROM proyectos WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

\-- 2.4 — proyecto\_miembros  
CREATE TABLE IF NOT EXISTS proyecto\_miembros (  
  proyecto\_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,  
  persona\_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,  
  rol text NOT NULL DEFAULT 'miembro' CHECK (rol IN ('responsable','miembro','observador')),  
  fecha\_agregado timestamptz NOT NULL DEFAULT now(),  
  PRIMARY KEY (proyecto\_id, persona\_id)  
);

ALTER TABLE proyecto\_miembros ENABLE ROW LEVEL SECURITY;  
CREATE POLICY miembros\_via\_proyecto ON proyecto\_miembros FOR ALL USING (  
  proyecto\_id IN (SELECT id FROM proyectos WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

\-- 2.5 — proyecto\_comentarios  
CREATE TABLE IF NOT EXISTS proyecto\_comentarios (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  proyecto\_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,  
  tarea\_id uuid REFERENCES proyecto\_tareas(id) ON DELETE CASCADE,  
  persona\_id uuid NOT NULL REFERENCES personas(id),  
  texto text NOT NULL,  
  menciones jsonb DEFAULT '\[\]'::jsonb,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE INDEX idx\_comentarios\_proyecto ON proyecto\_comentarios(proyecto\_id, created\_at DESC) WHERE deleted\_at IS NULL;  
CREATE INDEX idx\_comentarios\_tarea ON proyecto\_comentarios(tarea\_id) WHERE tarea\_id IS NOT NULL AND deleted\_at IS NULL;

ALTER TABLE proyecto\_comentarios ENABLE ROW LEVEL SECURITY;  
CREATE POLICY comentarios\_via\_proyecto ON proyecto\_comentarios FOR ALL USING (  
  proyecto\_id IN (SELECT id FROM proyectos WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

\-- 2.6 — Vincular fin\_movimientos con proyectos  
ALTER TABLE fin\_movimientos ADD COLUMN IF NOT EXISTS proyecto\_id uuid REFERENCES proyectos(id);  
CREATE INDEX IF NOT EXISTS idx\_fin\_movimientos\_proyecto ON fin\_movimientos(proyecto\_id) WHERE proyecto\_id IS NOT NULL;

\-- 2.7 — Función de presupuesto consumido  
CREATE OR REPLACE FUNCTION fn\_presupuesto\_consumido(p\_proyecto\_id uuid) RETURNS numeric AS $$  
  SELECT COALESCE(SUM(monto), 0\) FROM fin\_movimientos  
  WHERE proyecto\_id \= p\_proyecto\_id AND tipo \= 'egreso' AND deleted\_at IS NULL;  
$$ LANGUAGE sql STABLE;

\-- 2.8 — Estado del módulo  
UPDATE catalogo\_modulos SET capa='troncal' WHERE slug='proyectos';

COMMIT;

═══════════════════════════════════════════════════════════════════  
PARTE 3 — CAPA CÓDIGO  
═══════════════════════════════════════════════════════════════════

modules/proyectos/  
├── module.json  
├── lib/  
│   ├── actions.ts        \-- crear/editar proyecto, tarea, comentario, miembro  
│   ├── queries.ts        \-- proyectosPorUser, tareasPorProyecto, tareasPorEstado, calendarTareas  
│   ├── permisos.ts       \-- proyectos.admin, proyectos.editor, proyectos.viewer  
│   └── tipos.ts  
└── ui/  
    ├── proyecto-card.tsx  
    ├── proyecto-form.tsx  
    ├── tarea-card.tsx  
    ├── tarea-modal.tsx  
    ├── kanban-board.tsx       \-- dnd-kit board  
    ├── kanban-column.tsx  
    ├── lista-tareas.tsx  
    ├── calendario-proyecto.tsx \-- react-big-calendar  
    ├── comentario-thread.tsx  
    └── miembros-list.tsx

dnd-kit: @dnd-kit/core \+ @dnd-kit/sortable  
react-big-calendar: ya en uso en planificador

═══════════════════════════════════════════════════════════════════  
PARTE 5 — UI  
═══════════════════════════════════════════════════════════════════

5.1 — /admin/proyectos (listado)

\+--------------------------------------------------------------+  
| Proyectos                                  \[+ Nuevo proyecto\]|  
\+--------------------------------------------------------------+  
| Toolbar: \[Buscar...\] \[Estado ▼\] \[Responsable ▼\] \[Cliente ▼\]  |  
\+--------------------------------------------------------------+  
| Vista: \[Cards\] \[Tabla\]                                       |  
\+--------------------------------------------------------------+  
| Cards grid:                                                  |  
|   \[Card Proyecto 1\]   \[Card Proyecto 2\]   \[Card Proyecto 3\]  |  
|   Color sidebar \+ nombre \+ responsable \+ progreso \+ estado   |  
\+--------------------------------------------------------------+

5.2 — /admin/proyectos/\[id\]

Header:  
\+--------------------------------------------------------------+  
| \[← Volver\]                                                   |  
| Proyecto: Renovación de canchas       \[Estado: En curso\] \[...\]|  
| Responsable: Juan Pérez                                      |  
| Cliente: Empresa X                                           |  
| Presupuesto: $250.000 (consumido $120.000)                  |  
\+--------------------------------------------------------------+  
| Tabs: Tablero | Lista | Calendario | Detalles | Equipo | Comentarios |  
\+--------------------------------------------------------------+

5.3 — Tab Tablero (vista Kanban)

\+--------------------------------------------------------------+  
| \[+ Nueva tarea\]                              \[Filtros ▼\]     |  
\+--------------------------------------------------------------+  
| Backlog (5)    En curso (3)    Review (1)    Hecho (8)      |  
| \--------       \--------        \--------       \--------       |  
| \[Tarea\]        \[Tarea\]         \[Tarea\]        \[Tarea\]        |  
| \[Tarea\]        \[Tarea\]                        \[Tarea\]        |  
| \[Tarea\]        \[Tarea\]                        ...            |  
| \[Tarea\]                                                       |  
| \[Tarea\]                                                       |  
| \[+ Nueva\]      \[+ Nueva\]       \[+ Nueva\]      \[+ Nueva\]      |  
\+--------------------------------------------------------------+

Card de tarea:  
\- Título (semibold)  
\- Asignado (avatar)  
\- Fecha límite (con icono Calendar, rojo si vencida)  
\- Prioridad (badge color)  
\- Tags (chips)

Drag and drop:  
\- Drag tarea entre columnas → updateEstadoTareaAction  
\- Drag dentro de la columna para reorder → updatePosicionKanbanAction  
\- Optimistic UI con rollback en error

5.4 — Tab Lista (vista tabla)

Tabla con filtros avanzados.  
Columnas: Título | Estado | Asignado | Prioridad | Fecha límite | Acciones

5.5 — Tab Calendario

react-big-calendar con eventos \= tareas con fecha\_limite.  
Color del evento \= color del proyecto.  
Click en evento → modal de tarea.

5.6 — Modal de tarea (crear o editar)

Campos:  
\- Título (required)  
\- Descripción (textarea)  
\- Estado (select)  
\- Asignado (autocomplete personas, miembros del proyecto preferentes)  
\- Prioridad (radio)  
\- Fecha límite (date picker)  
\- Tiempo estimado (number, opcional)  
\- Tags (chip input)  
\- Subtareas (lista expandible para crear/ver)  
\- Parent tarea (autocomplete, opcional)

Sección comentarios:  
\- Thread de comentarios sobre esta tarea  
\- Input para nuevo comentario con @ mentions

5.7 — Tab Equipo

Listado de miembros del proyecto con su rol.  
Botón "+Agregar miembro" (autocomplete de personas del tenant).

5.8 — Tab Comentarios (proyecto-level)

Thread de comentarios a nivel proyecto (no asociados a tareas específicas).

5.9 — /admin/personas/\[id\] tab Proyectos

Listado de proyectos donde la persona es responsable o miembro.  
Card mini con link al proyecto.

═══════════════════════════════════════════════════════════════════  
PARTE 6, 7, 8 — Estilos, Galería, Sidebar  
═══════════════════════════════════════════════════════════════════

DESIGN-SYSTEM v2.  
Iconos: FolderKanban (proyecto), CheckSquare (tarea), Flag (prioridad), Clock (fecha límite), MessageCircle (comentario), Users (equipo).  
Screenshots de las vistas Kanban / Lista / Calendario.  
Sidebar: "Proyectos" pasa de placeholder a activo.

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target \+6)  
═══════════════════════════════════════════════════════════════════

Test 1: Crear proyecto con responsable  
\- Crear persona fixture (responsable)  
\- Crear proyecto "Test PRY-1" con responsable  
\- Assert: proyectos \+1 fila, proyecto\_miembros \+1 fila (responsable como rol=responsable)  
\- Cleanup

Test 2: Crear tarea y asignar  
\- Crear proyecto \+ persona fixture  
\- Crear tarea "Test tarea" asignada a la persona  
\- Assert: proyecto\_tareas \+1, asignado\_persona\_id correcto  
\- Cleanup

Test 3: Mover tarea entre columnas Kanban  
\- Crear proyecto con 1 tarea en backlog  
\- Drag tarea a columna "En curso"  
\- Assert: estado\_slug \= en\_curso en DB  
\- Cleanup

Test 4: Crear subtarea  
\- Crear proyecto \+ tarea padre  
\- Crear subtarea con parent\_tarea\_id  
\- Intentar crear ciclo (asignar tarea padre como subtarea de la hija)  
\- Assert: error  
\- Cleanup

Test 5: Vincular movimiento financiero a proyecto  
\- Crear proyecto con presupuesto $100.000  
\- Crear fin\_movimiento tipo egreso $30.000 con proyecto\_id  
\- Assert: fn\_presupuesto\_consumido(proyecto\_id) \= 30000  
\- Cleanup

Test 6: Tab Proyectos en persona muestra correctamente  
\- Persona fixture en 2 proyectos como miembro  
\- Navegar a /admin/personas/\[id\] tab Proyectos  
\- Assert: 2 proyectos listados  
\- Cleanup

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Cierre  
═══════════════════════════════════════════════════════════════════

10.1 docs vivos:  
\- CURRENT-STATE: A6 cerrado, FASE A COMPLETA. \+5 tablas, \+1 catalogo, \+1 columna en fin\_movimientos, \+1 función  
\- SPRINT-PLAN: A6 DONE, FASE A DONE  
\- ROADMAP: FASE A en estado COMPLETED, próximo es FASE B  
\- DATA-MODEL: proyectos, proyecto\_tareas, proyecto\_miembros, proyecto\_comentarios, catalogo\_estados\_tarea  
\- MODULE-CATALOG: proyectos → Productivo

10.2 commit feat(proyectos): kanban \+ lista \+ calendario \+ comentarios \+ integración finanzas (Sprint A6)  
10.3 commit docs  
10.4 tag v0.27.0-fase-a-sprint-6  
10.5 cierre Drive: CIERRE-SPRINT-A6 y CIERRE-FASE-A (cierre de fase completa)  
10.6 screenshots  
10.7 reporte

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

1\. Pre-mortem reportado  
2\. Verificación PARTE 1 ejecutada  
3\. Migration aplicada (5 tablas \+ 1 catalogo \+ 1 columna \+ 1 función \+ 2 triggers)  
4\. Catálogo catalogo\_estados\_tarea seedeado  
5\. Mutual exclusion cliente\_persona vs cliente\_entidad respetada  
6\. Trigger anti-ciclo en subtareas funcional  
7\. Módulo proyectos creado completo  
8\. Vista Kanban con drag and drop funcional  
9\. Vista Lista funcional  
10\. Vista Calendario funcional  
11\. Comentarios thread funcional  
12\. Integración con fin\_movimientos  
13\. Tab Proyectos en persona funcional  
14\. Sidebar Proyectos activo (no placeholder)  
15\. \+6 E2E pasando  
16\. Tag v0.27.0-fase-a-sprint-6 aplicado  
17\. Cierre de fase A documentado en Drive  
18\. ROADMAP marca FASE A como COMPLETED

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS  
═══════════════════════════════════════════════════════════════════

1\. Mock-first vigente  
2\. trg\_set\_updated\_at en TODAS las tablas con updated\_at  
3\. Soft-delete deleted\_at  
4\. dnd-kit con optimistic UI \+ rollback  
5\. NO timing tracking automático (solo manual)  
6\. NO Gantt en este sprint  
7\. Si excede 16h Code, parar y escalar

COMMIT: feat(proyectos): proyectos \+ tareas \+ kanban \+ lista \+ calendario \+ comentarios \+ integración finanzas (Sprint A6)  
TAG: v0.27.0-fase-a-sprint-6

CIERRE DE FASE A:  
\- Tag adicional: v0.28.0-fase-a-completa  
\- Cierre ejecutivo CIERRE-FASE-A en Drive con métricas agregadas  
\- ROADMAP actualizado, próxima: FASE B (Cerrar vertical CCBP)

Fin Sprint A6. Fin FASE A.  
