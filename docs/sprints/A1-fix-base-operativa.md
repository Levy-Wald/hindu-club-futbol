SPRINT A1 — Fix Base Operativa \+ Espacios Genéricos  
\========================================================

Version del prompt: 1.0  
Fecha: 13 de mayo de 2026  
Path esperado en repo: docs/sprints/A1-fix-base-operativa.md  
Formato canónico: docs/PROMPT-TEMPLATE.md (18 bloques A-R)

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO — LEER ANTES DE EMPEZAR  
═══════════════════════════════════════════════════════════════════

Antes de tocar código, leé EN ESTE ORDEN:

1\. /CLAUDE.md (si existe)  
2\. /docs/CURRENT-STATE.md (estado pre-FASE-A esperado)  
3\. /docs/ROADMAP.md (plan A→B→C→D→E)  
4\. /docs/SPRINT-PLAN.md (Sprint A1 es el próximo a ejecutar)  
5\. /docs/rfcs/RFC-004-arquitectura-multi-vertical.md (decisiones D1-D11)  
6\. /docs/PROMPT-TEMPLATE.md (formato canónico que debe respetarse)  
7\. /docs/RUNBOOK.md \+ RUNBOOK-ADDENDUM (AP-001 a AP-006 \+ protocolo cierre)  
8\. /docs/DECISIONS.md (ADR-035 mock-first, ADR-036 dot-notation, ADR-037 columnas nativas, ADR-038 E2E con fixture, ADR-039 reportar vía MCP, ADR-040 4 capas, ADR-041 troncal mínimo, ADR-046 v\_productos\_catalogo)  
9\. /docs/MODULE-CATALOG.md (estado actual de módulos, en particular \`configuracion\`, \`eventos\`, \`reservas\`)  
10\. /docs/DESIGN-SYSTEM.md \+ /docs/UI-UX.md \+ /docs/UI-UX-PATTERNS.md (capas 6 y 5 del template)  
11\. modules/eventos/ (módulo actual de eventos)  
12\. modules/planificadores/ (planificador semanal actual, roto)  
13\. modules/reservas/ (reservas\_canchas actual)  
14\. components/layout/sidebar.tsx (estructura actual del sidebar)

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA — RESPONDÉ ANTES DE EMPEZAR  
═══════════════════════════════════════════════════════════════════

CAPAS que toca este sprint:  
\[x\] CAPA BD: nueva tabla \`espacios\`, columnas opcionales en \`eventos\` y \`reservas\_canchas\`, ajustes en \`catalogo\_modulos\`  
\[x\] CAPA CÓDIGO: módulo espacios nuevo, refactor menor en eventos/planificadores/reservas, sidebar  
\[x\] CAPA UI/UX: sidebar reorganizado, hub de eventos, CRUD de sedes/espacios, fix planificador, fix 8 bugs 404  
\[x\] CAPA ESTILOS: aplicar DESIGN-SYSTEM v2 a las pantallas nuevas  
\[x\] CAPA GALERÍA: screenshots de pantallas nuevas vía Playwright

CONTEXTO:  
Sprint A1 abre FASE A (Cerrar troncal mínimo). Es el sprint de "fix base operativa": deja el sistema actual sin bugs visibles, sin 404s, con espacios físicos genéricos en lugar de canchas hardcodeadas, y con el sidebar reflejando la taxonomía de 4 capas del RFC-004.

Sin este sprint cerrado, ningún otro sprint de FASE A puede ejecutarse sin riesgo.

Decisiones técnicas referenciadas:  
\- ADR-040: taxonomía de 4 capas  
\- ADR-041: troncal mínimo de 9 bloques (Configuración es bloque 1\)  
\- D2 (RFC-004): definición de troncal  
\- D7 (RFC-004): 5 verticales reales  
\- ADR-045: reclasificación módulos deportivos a cross-vertical (renombre físico DIFERIDO a FASE D, en este sprint solo se reclasifica conceptualmente vía catalogo\_modulos.capa)

═══════════════════════════════════════════════════════════════════  
SPRINT A1 — Fix Base Operativa \+ Espacios Genéricos  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
Al cierre del sprint, Yair puede:  
\- Navegar el sidebar reorganizado por capas (Troncal / Cross-vertical / Vertical CCBP / Marketplace)  
\- Crear eventos desde el planificador semanal haciendo click en una celda vacía  
\- Ver el hub de un evento (/admin/operaciones/eventos/\[id\]) con tabs (Info / CT / Asistencia / Plan / Táctica / Amistoso)  
\- Crear, editar y borrar Sedes y Espacios físicos genéricos  
\- Asignar un Espacio a un evento o una reserva (selector Sede → Espacio)  
\- Navegar a todas las páginas que antes daban 404 (8 bugs identificados)  
\- Ver que "Scouting" no aparece en el sidebar (oculto hasta Sprint B3)

ALCANCE

SÍ entra:

1\. Sidebar reorganizado por capas (componente layout)  
   \- Sección Troncal: Configuración, Personas, Entidades, Productos (placeholder), Finanzas, Cobranza, Comunicaciones, Calendario, Proyectos (placeholder), Auditoría  
   \- Sección Cross-vertical: Asistencias, Reservas, POS (mantener nombre Concesiones físico), Inventario (mantener nombre Utilería físico), Acceso, Pre-inscripciones  
   \- Sección Vertical CCBP (Club Deportivo): Equipos, Planificadores, Entrenamientos, Táctica, Amistosos, Competencias, Salud (visible cuando B1 cierre), Federaciones  
   \- Sección Marketplace: link a /admin/marketplace  
   \- Sección Configuración (footer): Settings, Usuarios, Auditoría  
   \- Items disabled (módulos no contratados, ver punto 8\) con candado Lock \+ tooltip  
   \- "Scouting" se OCULTA en este sprint (se activa en Sprint B3)

2\. Tabla \`espacios\` (nueva, troncal)  
   Columnas:  
   \- id uuid PRIMARY KEY default gen\_random\_uuid()  
   \- tenant\_id uuid NOT NULL REFERENCES tenants(id)  
   \- sede\_id uuid NOT NULL REFERENCES sedes(id)  
   \- nombre text NOT NULL  
   \- tipo\_slug text NOT NULL (FK a catalogo\_tipos\_espacio)  
   \- descripcion text  
   \- capacidad\_personas integer  
   \- dimensiones\_m2 numeric  
   \- activo boolean NOT NULL DEFAULT true  
   \- metadata jsonb DEFAULT '{}'::jsonb  
   \- created\_at timestamptz NOT NULL DEFAULT now()  
   \- updated\_at timestamptz NOT NULL DEFAULT now()  
   \- deleted\_at timestamptz (soft-delete, ADR-030)  
     
   Constraint: UNIQUE (tenant\_id, sede\_id, nombre) WHERE deleted\_at IS NULL  
     
   RLS: filtrar por current\_setting('app.current\_tenant\_id')

3\. Catálogo \`catalogo\_tipos\_espacio\` (nuevo, seed inicial)  
   Seed inicial:  
   \- cancha\_futbol (Cancha de fútbol)  
   \- cancha\_tenis (Cancha de tenis)  
   \- cancha\_padel (Cancha de pádel)  
   \- vestuario (Vestuario)  
   \- bar (Bar / Buffet)  
   \- kiosko (Kiosko)  
   \- sala\_reunion (Sala de reuniones)  
   \- oficina (Oficina)  
   \- aula (Aula)  
   \- gimnasio (Gimnasio)  
   \- piscina (Piscina)  
   \- vidriera (Vidriera / Local comercial)  
   \- deposito (Depósito)  
   \- otro (Otro)

4\. Migración de \`canchas\` a \`espacios\`  
   \- Migrar las filas de la tabla \`canchas\` (si las hay; Hindu tiene 0 hoy) a \`espacios\` con tipo\_slug='cancha\_futbol'  
   \- Mantener \`canchas\` como vista deprecada que apunta a \`espacios\` (solo lectura), para compatibilidad con código existente  
   \- Marcar la tabla original como deprecated en comentario PG

5\. UI CRUD Sedes (/admin/configuracion/sedes)  
   \- Listado de sedes del tenant  
   \- Modal "+Nueva sede": nombre, dirección, tipo (FK a catalogo\_tipos\_sede si existe)  
   \- Acciones por row: ver detalle, editar, eliminar (soft)  
   \- Click en sede → /admin/configuracion/sedes/\[id\] con tab Info \+ tab Espacios

6\. UI CRUD Espacios (/admin/configuracion/espacios)  
   \- Listado de TODOS los espacios del tenant con filtros por sede \+ tipo  
   \- Modal "+Nuevo espacio": sede (select), nombre, tipo (select), capacidad, dimensiones  
   \- Acciones por row: editar, eliminar (soft)  
   \- Tab dentro de la pantalla de sede: lista filtrada de espacios de esa sede

7\. Selector "Sede → Espacio" en eventos y reservas  
   \- En modal de crear/editar evento: agregar campos sede\_id (select) \+ espacio\_id (select dependiente de sede)  
   \- En modal de crear/editar reserva: idem  
   \- Columnas nuevas en \`eventos\` (sede\_id nullable, espacio\_id nullable, ambas FK)  
   \- Columna nueva en \`reservas\_canchas\` (espacio\_id nullable, FK a espacios)

8\. Catálogo de módulos en marketplace (apagados visibles, ADR-043)  
   \- Tabla nueva: \`catalogo\_modulos\_pricing\` con columnas (modulo\_slug, precio\_mensual\_ars, descripcion\_comercial, beneficios jsonb)  
   \- Seed con datos de los \~30 módulos del MODULE-CATALOG (placeholder pricing, ajustable después)  
   \- Componente \<ModuloGuard slug="X"\> que envuelve pantallas de módulos  
   \- Pantalla /admin/marketplace que lista todos los módulos del catálogo con su estado (Activo / Disponible / Próximamente)

9\. Fix del Planificador semanal  
   Archivo: modules/planificadores/ui/calendario-semanal.tsx  
   \- Agregar selectable={true} al BigCalendar (o equivalente)  
   \- Agregar handler onSelectSlot que abre modal "+Nuevo evento" con fecha/hora pre-rellenada  
   \- Agregar botón "+ Nuevo evento" arriba del calendario  
   \- Modal "+Nuevo evento" reusable: nombre, tipo (select catalogo\_tipos\_evento), fecha/hora desde/hasta, sede \+ espacio, descripción, equipo (opcional)

10\. Hub de evento (/admin/operaciones/eventos/\[id\]/page.tsx)  
    \- Crear page.tsx (no existe, da 404\)  
    \- Tabs:  
      \- Info (default): datos del evento, sede, espacio, equipo, responsable  
      \- Asistencia (si tipo aplica): link a /admin/operaciones/eventos/\[id\]/asistencia (ya existe)  
      \- Plan (si tipo entrenamiento): link a sub-página  
      \- Táctica (si tipo aplica): link a sub-página  
      \- Amistoso (si tipo aplica): link a sub-página  
      \- CT (cuerpo técnico, vista de quién está asignado): nuevo tab, query personas\_equipos  
    \- Botones: Editar, Eliminar (soft), Volver al calendario

11\. Reparar 8 bugs 404 identificados  
    a. /admin/operaciones/eventos/\[id\]/page.tsx → crear hub (punto 10\)  
    b. /admin/competencias/partidos/\[id\]/page.tsx → crear hub con tabs (Info, Resultado existente, Stats, Plantel)  
    c. /admin/comunicaciones/plantillas/\[id\]/page.tsx → crear hub (ver detalle, link a /editar existente)  
    d. /admin/concesiones/\[id\]/punto-venta/\[pdv\]/page.tsx → crear hub (ver detalle, link a /vender existente)  
    e. /admin/entidades → link existe pero ruta real es /externos. CAMBIAR el link del sidebar a /admin/entidades, NO crear /externos.  
       Renombrar carpeta app/admin/externos a app/admin/entidades (rename físico \+ actualizar imports)  
    f. /admin/finanzas/cuotas/emitir → crear page.tsx con form de emisión masiva (cubre el modal que vive sólo)  
    g. /admin/finanzas/movimientos/nuevo → crear page.tsx con form de nuevo movimiento  
    h. /admin/finanzas/transferencias/nueva → crear page.tsx con form de nueva transferencia entre cajas

12\. Ocultar Scouting del sidebar (se activa en Sprint B3)  
    \- Comentar o feature-flag la entrada de Scouting en sidebar  
    \- Mantener la ruta /admin/scouting si existe (no romper si alguien la accede directo)

NO entra:

\- Construcción del módulo PIM (Sprint A2)  
\- Resolver duplicación cuotas\_\* vs fin\_cuotas\_\* (Sprint A3)  
\- Construcción del módulo proyectos (Sprint A6)  
\- Construcción del módulo salud / lesiones (Sprint B1)  
\- Renombre físico de modules/utileria → modules/inventario (Sprint D5)  
\- Renombre físico de modules/concesiones → modules/pos (Sprint D5)  
\- Renombre físico de tabla reservas\_canchas → reservas\_espacios (Sprint D5)  
\- Mapa visual de espacios / diagramación del club (Sprint B6 versión CCBP, D6 versión cross-vertical)  
\- Pricing real del marketplace (mock placeholders OK; pricing real es H2 post FASE C)

DEPENDENCIAS

\- FASE 5 cerrada (vigente, tag v0.25.0-fase5-sprint6)  
\- RFC-004 commiteado en repo (commit 42dd557)  
\- Re-documentación commiteada (commits 19cc5dd \+ el que se haga al cierre de la Tanda 3-4)  
\- Sin sprints de FASE A previos (A1 es el primero)

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM (R-PE9 OBLIGATORIO)  
═══════════════════════════════════════════════════════════════════

Antes de codear, declarar mínimo 5 riesgos en la siguiente tabla. Si durante el sprint se materializa uno, marcar y revisar. Si Code identifica un Sn+1, agregar y avisar.

| \# | Riesgo | Probabilidad | Impacto | Mitigación |  
| \- | \------ | \------------ | \------- | \---------- |  
| S1 | Renombrar app/admin/externos a app/admin/entidades rompe imports/links existentes | Alta | Alto | Buscar todos los \`from '@/app/admin/externos'\` y links \`/admin/externos\` en el codebase ANTES del rename. Actualizar todos. Test E2E que entra a /admin/entidades y verifica que renderiza listado correctamente. |  
| S2 | Migración de canchas a espacios pierde datos si hay filas con FKs externas | Media | Crítico | Hindu tiene 0 canchas hoy (verificar en PARTE 1). Si hay 0, el riesgo es nulo. Si hay \>0, hacer migración INSERT INTO espacios SELECT... FROM canchas con tenant\_id, sede\_id, nombre, tipo\_slug='cancha\_futbol'. NO borrar tabla canchas en este sprint, dejarla como vista deprecada. |  
| S3 | El planificador roto puede tener dependencias no documentadas (otros componentes que importan de él) | Media | Medio | Antes de modificar calendario-semanal.tsx, grep \-r "calendario-semanal" en el codebase. Si hay imports, validar que el cambio (agregar selectable \+ onSelectSlot \+ botón) no rompe la API del componente. |  
| S4 | El sidebar reorganizado puede dejar items inaccesibles si se mueve incorrectamente | Alta | Medio | Mantener TODOS los items existentes en alguna sección (no eliminar ninguno por error). Solo reagrupar. Test E2E que verifica que cada item del sidebar lleva a una ruta válida (no 404). |  
| S5 | El componente ModuloGuard puede bloquear visualmente cosas que ya están activas para Hindu | Alta | Alto | Antes de envolver pantallas con ModuloGuard, verificar tenant\_modulos de Hindu para confirmar qué módulos están activos. ModuloGuard debe rendererizar normalmente si el módulo está activo. Test E2E con Hindu (tenant productivo) que verifica que NO aparece candado en módulos activos. |  
| S6 | Los 8 bugs 404 pueden tener causas no triviales (no solo falta page.tsx, también puede faltar layout o lógica de routing) | Media | Medio | Verificar uno por uno con MCP de Supabase \+ grep en repo antes de codear. Si alguno requiere más trabajo del esperado, escalar. |

Reportar PARTE 0 ANTES de codear PARTE 2\.

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación inicial vía MCP (R-PE10)  
═══════════════════════════════════════════════════════════════════

git fetch \--tags  
git describe \--tags \--abbrev=0  \# esperado: v0.25.0-fase5-sprint6 o tag de re-documentación posterior  
git log \-1 \--oneline

\-- Estado de tabla canchas (esperado: existe, 0 filas en Hindu)  
SELECT COUNT(\*) FROM canchas WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

\-- Estado de tabla sedes (esperado: 2 sedes en Hindu)  
SELECT id, nombre, tipo FROM sedes WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

\-- Estado de tabla espacios (esperado: NO existe todavía)  
SELECT EXISTS(  
  SELECT 1 FROM information\_schema.tables   
  WHERE table\_schema='public' AND table\_name='espacios'  
) AS existe\_espacios;

\-- Catálogo de módulos  
SELECT slug, capa FROM catalogo\_modulos LIMIT 30;

\-- Hindu tiene activado qué módulos  
SELECT modulo\_slug, activo FROM tenant\_modulos   
WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

\-- Eventos sin espacio\_id (todos, dado que la columna no existe)  
SELECT COUNT(\*) FROM eventos WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

\-- Persona E2E activa  
SELECT id, nombre FROM personas   
WHERE id='99999999-9999-9999-9999-999999999999';

\-- Vercel deploy actual READY  
\-- (vía Vercel MCP, listar deployments y confirmar el último en estado READY)

Reportar TODOS los resultados antes de avanzar a PARTE 2\.

═══════════════════════════════════════════════════════════════════  
PARTE 2 — CAPA BD: Migration (con BEGIN/COMMIT explícito)  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — Catálogo de tipos de espacio  
CREATE TABLE IF NOT EXISTS catalogo\_tipos\_espacio (  
  slug text PRIMARY KEY,  
  nombre text NOT NULL,  
  descripcion text,  
  activo boolean NOT NULL DEFAULT true,  
  orden integer,  
  created\_at timestamptz NOT NULL DEFAULT now()  
);

INSERT INTO catalogo\_tipos\_espacio (slug, nombre, orden) VALUES  
  ('cancha\_futbol', 'Cancha de fútbol', 10),  
  ('cancha\_tenis', 'Cancha de tenis', 20),  
  ('cancha\_padel', 'Cancha de pádel', 30),  
  ('vestuario', 'Vestuario', 40),  
  ('bar', 'Bar / Buffet', 50),  
  ('kiosko', 'Kiosko', 60),  
  ('sala\_reunion', 'Sala de reuniones', 70),  
  ('oficina', 'Oficina', 80),  
  ('aula', 'Aula', 90),  
  ('gimnasio', 'Gimnasio', 100),  
  ('piscina', 'Piscina', 110),  
  ('vidriera', 'Vidriera / Local comercial', 120),  
  ('deposito', 'Depósito', 130),  
  ('otro', 'Otro', 999\)  
ON CONFLICT (slug) DO NOTHING;

\-- 2.2 — Tabla espacios (genérica, troncal)  
CREATE TABLE IF NOT EXISTS espacios (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,  
  sede\_id uuid NOT NULL REFERENCES sedes(id) ON DELETE RESTRICT,  
  nombre text NOT NULL,  
  tipo\_slug text NOT NULL REFERENCES catalogo\_tipos\_espacio(slug),  
  descripcion text,  
  capacidad\_personas integer CHECK (capacidad\_personas IS NULL OR capacidad\_personas \> 0),  
  dimensiones\_m2 numeric CHECK (dimensiones\_m2 IS NULL OR dimensiones\_m2 \> 0),  
  activo boolean NOT NULL DEFAULT true,  
  metadata jsonb DEFAULT '{}'::jsonb,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE UNIQUE INDEX IF NOT EXISTS idx\_espacios\_nombre\_sede\_unique  
  ON espacios(tenant\_id, sede\_id, nombre) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_espacios\_tenant\_activo  
  ON espacios(tenant\_id, activo) WHERE deleted\_at IS NULL;

\-- Trigger para updated\_at (usar fn existente trg\_set\_updated\_at, no set\_updated\_at)  
CREATE TRIGGER trg\_espacios\_updated\_at  
  BEFORE UPDATE ON espacios  
  FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

\-- RLS  
ALTER TABLE espacios ENABLE ROW LEVEL SECURITY;  
CREATE POLICY espacios\_tenant\_isolation ON espacios  
  FOR ALL  
  USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.3 — Migración de canchas a espacios (si hay datos)  
INSERT INTO espacios (id, tenant\_id, sede\_id, nombre, tipo\_slug, capacidad\_personas, activo, created\_at)  
SELECT   
  COALESCE(c.id, gen\_random\_uuid()),  
  c.tenant\_id,  
  c.sede\_id,  
  c.nombre,  
  'cancha\_futbol',  
  NULL,  
  COALESCE(c.activo, true),  
  COALESCE(c.created\_at, now())  
FROM canchas c  
WHERE NOT EXISTS (  
  SELECT 1 FROM espacios e WHERE e.id \= c.id  
);

\-- 2.4 — Columnas espacio\_id en eventos y reservas\_canchas  
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS sede\_id uuid REFERENCES sedes(id);  
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS espacio\_id uuid REFERENCES espacios(id);  
CREATE INDEX IF NOT EXISTS idx\_eventos\_espacio ON eventos(espacio\_id) WHERE espacio\_id IS NOT NULL;

ALTER TABLE reservas\_canchas ADD COLUMN IF NOT EXISTS espacio\_id uuid REFERENCES espacios(id);  
CREATE INDEX IF NOT EXISTS idx\_reservas\_espacio ON reservas\_canchas(espacio\_id) WHERE espacio\_id IS NOT NULL;

\-- 2.5 — catalogo\_modulos: agregar columna capa  
ALTER TABLE catalogo\_modulos ADD COLUMN IF NOT EXISTS capa text;  
ALTER TABLE catalogo\_modulos ADD CONSTRAINT catalogo\_modulos\_capa\_check   
  CHECK (capa IS NULL OR capa IN ('troncal', 'cross\_vertical', 'vertical\_ccbp', 'vertical\_arq', 'vertical\_abog', 'vertical\_pub', 'vertical\_retail', 'integracion'));

\-- Actualizar capa de módulos existentes según MODULE-CATALOG  
UPDATE catalogo\_modulos SET capa='troncal' WHERE slug IN (  
  'configuracion', 'personas', 'entidades', 'finanzas', 'pim', 'cobranza',   
  'comunicaciones', 'eventos', 'proyectos', 'auditoria'  
);  
UPDATE catalogo\_modulos SET capa='cross\_vertical' WHERE slug IN (  
  'asistencias', 'reservas', 'pos', 'concesiones', 'inventario', 'utileria',  
  'acceso', 'pre\_inscripciones', 'suscripciones\_membresia', 'socios',  
  'rrhh', 'documentos\_firma', 'tickets', 'pricing\_avanzado',   
  'stock\_movimientos', 'espacios\_fisicos'  
);  
UPDATE catalogo\_modulos SET capa='vertical\_ccbp' WHERE slug IN (  
  'equipos', 'planificadores', 'entrenamientos', 'tactica', 'amistosos',  
  'competencias', 'salud', 'historial\_trayectoria', 'scouting',   
  'reportes\_deportivos', 'federaciones', 'diagramacion\_club',  
  'cuerpo\_tecnico', 'disciplinas'  
);

\-- 2.6 — catalogo\_modulos\_pricing (apagados visibles, ADR-043)  
CREATE TABLE IF NOT EXISTS catalogo\_modulos\_pricing (  
  modulo\_slug text PRIMARY KEY REFERENCES catalogo\_modulos(slug),  
  precio\_mensual\_ars numeric,  
  precio\_mensual\_usd numeric,  
  descripcion\_comercial text,  
  beneficios jsonb DEFAULT '\[\]'::jsonb,  
  estado text NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'proximamente', 'beta')),  
  fecha\_disponible\_estimada date,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now()  
);

\-- Seed inicial con placeholder pricing (ajustable en H2 post FASE C)  
INSERT INTO catalogo\_modulos\_pricing (modulo\_slug, precio\_mensual\_ars, descripcion\_comercial, estado) VALUES  
  ('rrhh', 5000, 'Gestión de empleados con contratos y liquidaciones', 'disponible'),  
  ('documentos\_firma', 8000, 'Documentos con firma digital legalmente válida', 'proximamente'),  
  ('tickets', 3000, 'Gestión de tickets de soporte y solicitudes internas', 'proximamente'),  
  ('pricing\_avanzado', 6000, 'Listas de precios múltiples por canal, fecha y segmento', 'proximamente'),  
  ('stock\_movimientos', 7000, 'Stock por ubicación con histórico de movimientos', 'proximamente'),  
  ('salud', 4000, 'Lesiones, datos médicos, autorizaciones, notificación automática al CT', 'disponible'),  
  ('scouting', 5000, 'Fichas de scouting con 11 dimensiones de evaluación', 'proximamente'),  
  ('diagramacion\_club', 3000, 'Mapa visual del club con canchas, vestuarios y accesos', 'proximamente')  
ON CONFLICT (modulo\_slug) DO NOTHING;

COMMIT;

Aplicar vía apply\_migration de Supabase MCP. Reportar resultado.

═══════════════════════════════════════════════════════════════════  
PARTE 3 — CAPA CÓDIGO: Estructura del módulo Espacios  
═══════════════════════════════════════════════════════════════════

Crear modules/espacios/:

modules/espacios/  
├── module.json                ← declara capabilities: \['ver\_espacios','crear\_espacios','editar\_espacios','borrar\_espacios'\]  
├── lib/  
│   ├── actions.ts             ← crearEspacioAction, editarEspacioAction, eliminarEspacioAction  
│   ├── queries.ts             ← listarEspacios, espacioPorId, espaciosPorSede  
│   ├── permisos.ts            ← checkEspaciosAdmin  
│   └── tipos.ts               ← Espacio, EspacioInput, TipoEspacioSlug  
└── ui/  
    ├── espacio-form.tsx       ← form de carga/edición  
    ├── espacio-row.tsx        ← row del listado  
    └── selector-sede-espacio.tsx ← componente reusable Sede \+ Espacio cascading

Reglas:  
\- Server actions, NO endpoints REST  
\- Permission slugs: configuracion.admin (super) y espacios.admin (granular)  
\- Soft-delete vía deleted\_at  
\- Validación con Zod en cada action

Refactor menor en módulos existentes:  
\- modules/eventos/lib/actions.ts: aceptar opcionalmente sede\_id y espacio\_id en createEventoAction y updateEventoAction  
\- modules/planificadores/ui/calendario-semanal.tsx: agregar selectable={true}, onSelectSlot, botón "+Nuevo evento"  
\- modules/reservas/lib/actions.ts: aceptar opcionalmente espacio\_id

Componente \<ModuloGuard slug="X"\>:  
\- Path: components/modulo-guard.tsx  
\- Server component que recibe slug y children  
\- Lee tenant\_modulos para el tenant actual; si el módulo está activo: render children. Si no: render UI de candado (ver PARTE 5.8).

Sidebar:  
\- Path: components/layout/sidebar.tsx (refactor)  
\- Reorganizar items por sección (Troncal / Cross-vertical / Vertical CCBP / Marketplace / Configuración)  
\- Items con permission slug en su prop. Si el usuario no tiene el permiso, ocultar item.  
\- Items con módulo no activo: render con icono Lock y tooltip.

═══════════════════════════════════════════════════════════════════  
PARTE 4 — Integración con módulos existentes  
═══════════════════════════════════════════════════════════════════

Módulo eventos:  
\- Importar SelectorSedeEspacio de modules/espacios/ui/ en el modal de crear/editar evento  
\- NO modificar lógica de evento\_invitados / evento\_asistencias  
\- Migrar opcionalmente: si un evento ya tiene una cancha (via metadata), sugerir el espacio equivalente

Módulo reservas:  
\- Idem: importar SelectorSedeEspacio en el modal de reserva  
\- NO modificar lógica de cobro o de slots

Módulo planificadores:  
\- modules/planificadores/ui/calendario-semanal.tsx: agregar el handler onSelectSlot que abre el modal "+Nuevo evento" de eventos  
\- Reusar el modal de eventos, no duplicar

Módulo asistencias:  
\- Sin cambios en este sprint (FASE A no toca asistencias salvo bug fixes)

═══════════════════════════════════════════════════════════════════  
PARTE 5 — CAPA UI/UX: Pantallas, componentes, layouts  
═══════════════════════════════════════════════════════════════════

5.1 — Pantalla /admin/configuracion/sedes

Wireframe ASCII:

\+--------------------------------------------------------------+  
| Sedes                                          \[+ Nueva sede\]|  
| Lugares físicos del tenant                                   |  
\+--------------------------------------------------------------+  
| Toolbar: \[Buscar...\]                                         |  
\+--------------------------------------------------------------+  
| Tabla:                                                       |  
|   Nombre        | Dirección      | Espacios | Acciones      |  
|   \--------      | \--------       | \--------- | \-------       |  
|   Sede Central  | Av. Cabildo... | 8 espacios | \[Ver\] \[...\]  |  
|   Sede Norte    | San Isidro...  | 3 espacios | \[Ver\] \[...\]  |  
\+--------------------------------------------------------------+

Componentes:  
\- DataTable de shadcn  
\- Modal "+Nueva sede" con form (nombre, dirección, tipo, capacidad)  
\- Click row → /admin/configuracion/sedes/\[id\]

5.2 — Pantalla /admin/configuracion/sedes/\[id\]

\+--------------------------------------------------------------+  
| \[← Volver\]                                                   |  
| Sede Central                                  \[Editar\] \[...\] |  
| Av. Cabildo 1234, CABA                                       |  
\+--------------------------------------------------------------+  
| Tabs: Info | Espacios                                        |  
\+--------------------------------------------------------------+  
| Tab Info:  detalles                                          |  
| Tab Espacios: tabla filtrada de espacios de esta sede        |  
|              \+ botón "\[+Nuevo espacio en esta sede\]"         |  
\+--------------------------------------------------------------+

5.3 — Pantalla /admin/configuracion/espacios

\+--------------------------------------------------------------+  
| Espacios                                       \[+ Nuevo espacio\]  
| Lugares físicos asignables a eventos y reservas              |  
\+--------------------------------------------------------------+  
| Toolbar: \[Buscar...\] \[Sede: Todas ▼\] \[Tipo: Todos ▼\]        |  
\+--------------------------------------------------------------+  
| Tabla:                                                       |  
|   Nombre       | Sede       | Tipo         | Capacidad | Acciones |  
|   \--------     | \--------   | \--------     | \--------- | \-------  |  
|   Cancha 1     | Central    | Cancha fútbol| 22        | \[...\]    |  
|   Vestuario A  | Central    | Vestuario    | 15        | \[...\]    |  
\+--------------------------------------------------------------+

5.4 — Modal "+Nuevo espacio"

Campos:  
\- Sede (select required, autocomplete si hay \> 5 sedes)  
\- Nombre (text required, máx 100\)  
\- Tipo (select required, FK a catalogo\_tipos\_espacio)  
\- Capacidad de personas (number opcional, integer \> 0\)  
\- Dimensiones m² (number opcional, \> 0\)  
\- Descripción (textarea opcional)  
\- Activo (toggle, default true)

Submit:  
\- Validación Zod  
\- crearEspacioAction  
\- Toast success  
\- Cerrar modal y refrescar listado

5.5 — Componente SelectorSedeEspacio (reusable)

Importable en modales de eventos y reservas.

Props:  
\- value: { sede\_id, espacio\_id }  
\- onChange: ({ sede\_id, espacio\_id }) \=\> void  
\- required: boolean

Render:  
\- Select Sede (autocomplete)  
\- Select Espacio (disabled hasta tener sede, opciones filtradas por sede seleccionada)  
\- Si solo hay 1 sede: pre-seleccionarla  
\- Si solo hay 1 espacio en la sede: pre-seleccionarlo

5.6 — Fix Planificador semanal (modules/planificadores/ui/calendario-semanal.tsx)

Cambios:  
\- Agregar prop selectable={true} al BigCalendar  
\- Agregar handler onSelectSlot:  
  \`\`\`tsx  
  onSelectSlot={(slotInfo) \=\> {  
    setModalState({  
      open: true,  
      fechaInicio: slotInfo.start,  
      fechaFin: slotInfo.end,  
      // sede/espacio: vacíos para que el usuario los complete  
    })  
  }}  
  \`\`\`  
\- Agregar botón "+ Nuevo evento" arriba del calendario que abre el mismo modal con fechas pre-seleccionadas (hoy \+ 1h)  
\- El modal usa el componente NuevoEventoModal (en modules/eventos/ui/) que ya debería existir o crearse si no

5.7 — Hub de evento /admin/operaciones/eventos/\[id\]/page.tsx

Wireframe:

\+--------------------------------------------------------------+  
| \[← Volver al calendario\]                                     |  
| Entrenamiento Primera \- Martes 15/05/2026 17:00 \- 19:00     |  
| Sede Central · Cancha 1                                     |  
| \[Badge: Entrenamiento\] \[Badge: Sub-15\]                       |  
\+--------------------------------------------------------------+  
| Tabs: Info | CT | Asistencia | Plan | Táctica | Amistoso    |  
| (tabs aplicables según tipo de evento; ocultar las que no   |  
| apliquen, ej. "Amistoso" solo si tipo='amistoso')           |  
\+--------------------------------------------------------------+  
| Contenido del tab activo                                     |  
\+--------------------------------------------------------------+

Tabs:  
\- Info (default): datos del evento (tipo, fecha, sede, espacio, equipo, responsable, descripción), botones Editar / Eliminar  
\- CT: lista de personas del equipo con rol\_equipo\_slug IN ('dt','asistente','preparador\_fisico','medico\_equipo','delegado')  
\- Asistencia: link a /admin/operaciones/eventos/\[id\]/asistencia (ya existe)  
\- Plan: link a /admin/operaciones/eventos/\[id\]/plan (ya existe, solo si tipo=entrenamiento)  
\- Táctica: link a /admin/operaciones/eventos/\[id\]/tactica (ya existe, solo si tipo aplica)  
\- Amistoso: link a /admin/operaciones/eventos/\[id\]/amistoso (ya existe, solo si tipo=amistoso)

5.8 — Pantalla /admin/marketplace

\+--------------------------------------------------------------+  
| Marketplace de módulos                                       |  
| Activá los módulos que tu negocio necesita                   |  
\+--------------------------------------------------------------+  
| Filtros: \[Capa ▼\] \[Estado ▼\]                                 |  
\+--------------------------------------------------------------+  
| Sección Troncal (siempre activos)                            |  
|   \[Card Configuración ✓\]  \[Card Personas ✓\]  \[Card CRM ✓\]   |  
|   \[...\]                                                       |  
|                                                              |  
| Sección Cross-vertical                                       |  
|   \[Card RRHH 🔒 Activar\]  \[Card Documentos 🔒 Próx\]         |  
|   \[Card Tickets 🔒 Próx\]  \[...\]                              |  
|                                                              |  
| Sección Tu vertical (CCBP)                                   |  
|   \[Card Equipos ✓\]  \[Card Competencias ✓\]  \[Card Salud 🔒\]  |  
\+--------------------------------------------------------------+

Cards:  
\- Activos: bg white, border slate-200, ícono ✓  
\- Disponibles no contratados: bg slate-50, border slate-200, ícono Lock arriba derecha, badge "Activar" abajo  
\- Próximamente: bg slate-50, badge "Próximamente Q3 2026"  
\- Click en activo: navega al módulo  
\- Click en disponible: modal con descripción \+ beneficios \+ precio \+ CTA "Activar ahora"  
\- Click en próximamente: modal informativo

5.9 — Fix 8 bugs 404 (paths nuevos o renombrados)

a. app/admin/operaciones/eventos/\[id\]/page.tsx → ya cubierto en 5.7  
b. app/admin/competencias/partidos/\[id\]/page.tsx → hub similar a 5.7 con tabs (Info, Resultado existente, Stats existente, Plantel nuevo)  
c. app/admin/comunicaciones/plantillas/\[id\]/page.tsx → hub con tabs (Detalle, Editar link, Envíos relacionados)  
d. app/admin/concesiones/\[id\]/punto-venta/\[pdv\]/page.tsx → hub con detalle del PDV y link a /vender  
e. Renombrar app/admin/externos/ → app/admin/entidades/ (con buscar/reemplazar imports y links)  
f. app/admin/finanzas/cuotas/emitir/page.tsx → form de emisión masiva (referencia el modal existente)  
g. app/admin/finanzas/movimientos/nuevo/page.tsx → form de nuevo movimiento  
h. app/admin/finanzas/transferencias/nueva/page.tsx → form de nueva transferencia

5.10 — Sidebar reorganizado (components/layout/sidebar.tsx)

Estructura final:

\`\`\`  
\[Logo / "Plataforma"\]                  (header sidebar)  
────────────────────────────────────────  
\[Inicio\]                               (dashboard)

────  TRONCAL  ────  
\[Configuración ▼\]  
  \[Sedes\]  
  \[Espacios\]  
  \[Marketplace\]  
  \[Settings\]  
\[Personas\]  
\[Entidades\]  
\[Productos\]            (placeholder, da 404 hasta A2 \- linkear a /admin/productos con empty state si la ruta no existe)  
\[Finanzas ▼\]  
  \[Cajas\]  
  \[Movimientos\]  
  \[Cuotas\]  
  \[Transferencias\]  
  \[Plan de cuentas\]  
\[Comunicaciones ▼\]  
  \[Plantillas\]  
  \[Envíos\]  
  \[Automatizaciones\]  
\[Calendario\]  
\[Proyectos\]            (placeholder hasta A6)  
\[Auditoría\]

────  CROSS-VERTICAL  ────  (solo módulos activos)  
\[Asistencias\]  
\[Reservas\]  
\[POS\]                  (modules/concesiones físico)  
\[Inventario\]           (modules/utileria físico)  
\[Acceso\]  
\[Pre-inscripciones\]  
\[RRHH\]                 (con Lock si no contratado)  
\[Documentos\]           (Lock \+ "Próximamente")  
\[Tickets\]              (Lock \+ "Próximamente")

────  CLUB DEPORTIVO (CCBP)  ────  
\[Equipos\]  
\[Planificador\]  
\[Entrenamientos\]  
\[Táctica\]  
\[Amistosos\]  
\[Competencias\]  
\[Salud\]                (Lock hasta B1 cierre)  
\[Federaciones\]  
(Scouting OCULTO en este sprint)  
\`\`\`

5.11 — data-testids requeridos para E2E

\- sidebar-section-troncal, sidebar-section-cross-vertical, sidebar-section-ccbp, sidebar-section-marketplace  
\- sidebar-item-sedes, sidebar-item-espacios, sidebar-item-marketplace  
\- pantalla-sedes, pantalla-espacios, pantalla-marketplace  
\- btn-nueva-sede, btn-nuevo-espacio  
\- modal-espacio, input-sede, input-nombre-espacio, input-tipo-espacio, btn-submit-espacio  
\- selector-sede, selector-espacio  
\- planificador-calendario, btn-nuevo-evento-planificador  
\- hub-evento, tab-evento-info, tab-evento-ct, tab-evento-asistencia  
\- marketplace-card-rrhh, marketplace-card-documentos, marketplace-modal-activar  
\- modulo-guard-locked

═══════════════════════════════════════════════════════════════════  
PARTE 6 — CAPA ESTILOS: Design tokens  
═══════════════════════════════════════════════════════════════════

Referencia obligatoria: /docs/DESIGN-SYSTEM.md (v2)

Tokens a usar:  
\- Botones primarios: variant default (bg slate-900)  
\- Botones de marketplace "Activar": variant accent (bg indigo-600)  
\- Cards de módulos: shadow-sm, rounded-lg, border slate-200, padding p-6  
\- Cards de módulos no contratados: bg slate-50, ícono Lock h-5 w-5 slate-400  
\- Badges: variant según contexto (success activo, secondary próximamente)  
\- Tipografía: text-lg semibold para card titles, text-sm para descripciones

Iconos Lucide:  
\- Lock (módulo no contratado)  
\- Calendar (próximamente)  
\- Building2 (Sede)  
\- LayoutDashboard (Espacio genérico)  
\- DoorOpen (Vestuario)  
\- Coffee (Bar)  
\- Settings (Configuración)  
\- ShoppingBag (Marketplace)

═══════════════════════════════════════════════════════════════════  
PARTE 7 — CAPA GALERÍA: Mockups y referencias visuales  
═══════════════════════════════════════════════════════════════════

Mockups: no hay Figma todavía. Los wireframes ASCII de PARTE 5 son la referencia.

Al cierre del sprint, Code captura screenshots vía Playwright de:  
\- /admin/configuracion/sedes (estados: empty \+ con data)  
\- /admin/configuracion/espacios (estados: empty \+ con data)  
\- /admin/configuracion/sedes/\[id\] (con tab Espacios activo)  
\- Modal "+Nuevo espacio"  
\- /admin/operaciones/planificador (con eventos creables desde celda)  
\- Modal "+Nuevo evento" desde planificador  
\- /admin/operaciones/eventos/\[id\] (hub con tabs)  
\- /admin/marketplace (con módulos en distintos estados)  
\- Sidebar reorganizado

Sube screenshots a Drive \`\_Cierre Ejecutivo/sprint-a1/screenshots/\`.  
Actualiza VISUAL-GALLERY.md con paths.

═══════════════════════════════════════════════════════════════════  
PARTE 8 — Sidebar y navegación  
═══════════════════════════════════════════════════════════════════

Ya cubierto en 5.10. 

Reglas adicionales:  
\- Items con permission slug: si el usuario no tiene el permiso, ocultar (no mostrar disabled).  
\- Items con módulo no contratado: mostrar con Lock \+ tooltip "Activá \[módulo\] desde el Marketplace".  
\- Items "Próximamente": mostrar con ícono Calendar \+ badge "Próximamente".  
\- Mobile: sidebar colapsa a drawer (hamburger en header).

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target \+6 specs)  
═══════════════════════════════════════════════════════════════════

Crear tests/e2e/sprints/a1-fix-base-operativa.spec.ts con mínimo 6 tests:

TENANT \= '11111111-1111-1111-1111-111111111111'  
PERSONA\_E2E \= '99999999-9999-9999-9999-999999999999'

Test 1: Admin crea Sede y Espacio  
\- Navegar a /admin/configuracion/sedes  
\- Crear sede "Sede Test E2E" con dirección  
\- Click en la sede, ir a tab Espacios  
\- Crear espacio "Cancha Test" tipo cancha\_futbol con capacidad 22  
\- Assert: sede y espacio aparecen en listados  
\- Assert DB: ambos existen con tenant\_id correcto  
\- Cleanup: borrar espacio \+ sede

Test 2: Crear evento desde celda del planificador  
\- Navegar a /admin/operaciones/planificador  
\- Click en celda del jueves a las 18:00  
\- Assert: modal "+Nuevo evento" se abre con fecha pre-rellenada al jueves 18:00  
\- Completar nombre "Entrenamiento Test" \+ tipo \+ sede \+ espacio  
\- Submit  
\- Assert: evento aparece en el calendario  
\- Cleanup: borrar evento

Test 3: Botón "+Nuevo evento" del planificador funciona  
\- Navegar al planificador  
\- Click en botón "+Nuevo evento"  
\- Assert: modal se abre (con fechas default: hoy \+ 1h)  
\- Cerrar sin submit

Test 4: Hub de evento muestra tabs correctos según tipo  
\- Crear evento tipo "entrenamiento" via fixture  
\- Navegar a /admin/operaciones/eventos/\[id\]  
\- Assert: tabs visibles son Info, CT, Asistencia, Plan (NO Táctica ni Amistoso por tipo entrenamiento)  
\- Click en tab CT  
\- Assert: muestra personas del equipo con roles CT  
\- Cleanup: borrar evento

Test 5: Marketplace muestra módulos en sus estados correctos  
\- Navegar a /admin/marketplace  
\- Assert: módulo Personas aparece como Activo  
\- Assert: módulo RRHH aparece con Lock (no contratado para Hindu)  
\- Click en módulo RRHH  
\- Assert: modal con descripción \+ precio \+ CTA "Activar ahora" se muestra  
\- Cerrar modal

Test 6: Las 8 rutas que daban 404 ahora retornan 200  
\- Para cada una de las 8 rutas:  
  \- /admin/operaciones/eventos/\[fixture\_id\]  
  \- /admin/competencias/partidos/\[fixture\_id\]  
  \- /admin/comunicaciones/plantillas/\[fixture\_id\]  
  \- /admin/concesiones/\[fixture\_id\]/punto-venta/\[fixture\_pdv\_id\]  
  \- /admin/entidades  
  \- /admin/finanzas/cuotas/emitir  
  \- /admin/finanzas/movimientos/nuevo  
  \- /admin/finanzas/transferencias/nueva  
\- Assert: cada ruta retorna 200 y renderiza algún contenido (no error boundary)  
\- Cleanup: limpiar fixtures creados

Cada test envuelto en try/finally con cleanup garantizado (ADR-038).  
Fixtures con metadata.fixture=true.

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Protocolo de cierre del sprint  
═══════════════════════════════════════════════════════════════════

Al cerrar este sprint, ejecutar EN ESTE ORDEN (ref RUNBOOK-ADDENDUM):

10.1 — Actualizar docs vivos del repo:  
\- /docs/CURRENT-STATE.md → Sprint A1 cerrado, métricas DB actualizadas, \+1 tabla (espacios), \+1 catálogo (catalogo\_tipos\_espacio), \+1 tabla pricing (catalogo\_modulos\_pricing)  
\- /docs/SPRINT-PLAN.md → A1 DONE, próximo A2  
\- /docs/GLOSSARY.md → si hay términos nuevos (poco probable, ya cubierto en addendum)  
\- /docs/ROADMAP.md → A1 en estado DONE  
\- /docs/DATA-MODEL.md → agregar espacios, catalogo\_tipos\_espacio, catalogo\_modulos\_pricing  
\- /docs/MODULE-CATALOG.md → estado de espacios pasa a Productivo, módulo configuracion pasa a Productivo  
\- /docs/VISUAL-GALLERY.md → screenshots de pantallas nuevas con paths a Drive

10.2 — Commit principal del feature:  
git commit \-m "feat(configuracion): espacios genéricos \+ sidebar reorganizado \+ fix 8 bugs 404 (Sprint A1)"

10.3 — Commit separado de docs:  
git commit \-m "docs: update CURRENT-STATE, SPRINT-PLAN, DATA-MODEL, MODULE-CATALOG, VISUAL-GALLERY for Sprint A1"

10.4 — Tag:  
git tag v0.27.0-fase-a-sprint-1  
git push origin main \--tags

10.5 — Cierre ejecutivo en Drive:  
\- Crear documento "CIERRE-SPRINT-A1" en Drive \`\_Cierre Ejecutivo/\`  
\- Contenido: métricas (tablas creadas, tests agregados, 404s arreglados), decisiones tomadas, deuda generada (si hay), links a commits y deploy

10.6 — Screenshots según PARTE 7

10.7 — Reporte al arquitecto con formato fijo (ver RUNBOOK-ADDENDUM)

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

1\. ✅ Pre-mortem PARTE 0 reportado (mínimo 6 riesgos \+ mitigaciones).  
2\. ✅ Verificación inicial PARTE 1 ejecutada y reportada.  
3\. ✅ Migration aplicada sin romper constraints existentes.  
4\. ✅ Tabla espacios creada con RLS, índices y trigger updated\_at.  
5\. ✅ Catálogo catalogo\_tipos\_espacio seedeado con 14 valores.  
6\. ✅ Columnas sede\_id y espacio\_id agregadas a eventos.  
7\. ✅ Columna espacio\_id agregada a reservas\_canchas.  
8\. ✅ Columna capa agregada a catalogo\_modulos con check constraint y datos poblados.  
9\. ✅ Tabla catalogo\_modulos\_pricing creada con seed.  
10\. ✅ Módulo espacios creado con lib/ y ui/ completos.  
11\. ✅ Pantallas /admin/configuracion/sedes y /admin/configuracion/espacios funcionales.  
12\. ✅ SelectorSedeEspacio integrado en eventos y reservas.  
13\. ✅ Planificador permite crear eventos haciendo click en celda vacía.  
14\. ✅ Botón "+Nuevo evento" del planificador funcional.  
15\. ✅ Hub /admin/operaciones/eventos/\[id\] funcional con tabs según tipo.  
16\. ✅ Las 8 rutas que daban 404 ahora retornan 200\.  
17\. ✅ Sidebar reorganizado por capas (Troncal / Cross-vertical / CCBP / Marketplace / Configuración).  
18\. ✅ Scouting oculto del sidebar.  
19\. ✅ Pantalla /admin/marketplace funcional con módulos en distintos estados.  
20\. ✅ ModuloGuard funcional (Lock en módulos no contratados).  
21\. ✅ Carpeta app/admin/externos renombrada a app/admin/entidades sin romper imports.  
22\. ✅ \+6 E2E tests pasando (target previo \+ 6).  
23\. ✅ Cleanup garantizado en todos los tests con try/finally (ADR-038).  
24\. ✅ Vercel deploy READY.  
25\. ✅ Tag v0.27.0-fase-a-sprint-1 APLICADO y pusheado.  
26\. ✅ AP-001 a AP-006 vigentes durante todo el sprint.  
27\. ✅ Docs vivos actualizados (PARTE 10.1).  
28\. ✅ Cierre ejecutivo en Drive (PARTE 10.5).  
29\. ✅ Screenshots en Drive (PARTE 10.6).  
30\. ✅ Reporte al arquitecto con formato fijo (PARTE 10.7).

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS (NO negociables)  
═══════════════════════════════════════════════════════════════════

1\. PARTE 0 (pre-mortem) y PARTE 1 (verificación) son obligatorias antes de codear.  
2\. NO renombrar físicamente modules/utileria, modules/concesiones, ni reservas\_canchas en este sprint (FASE D).  
3\. NO borrar la tabla canchas en este sprint (dejarla como vista deprecada).  
4\. Permission slugs SIEMPRE en dot-notation (ADR-036).  
5\. Mock-first universal vigente (ADR-035). El marketplace de módulos NO debe llamar a pasarela de pago real.  
6\. Soft-delete vía deleted\_at (ADR-030).  
7\. Cleanup en E2E con try/finally garantizado (ADR-038).  
8\. NO romper tests previos. Target N → N+6.  
9\. Server actions únicamente, NO endpoints REST.  
10\. APLICAR TAG explícitamente al cerrar.  
11\. Reportar vía MCP de Supabase, GitHub, Vercel (ADR-039). NO CLI local para reportes.  
12\. Si el sprint excede 16h Code, parar y avisar.  
13\. Si se descubre que un bug 404 tiene causa no trivial (más allá de page.tsx faltante), escalar y NO improvisar.  
14\. Trigger para updated\_at debe usar la fn existente trg\_set\_updated\_at (NO set\_updated\_at, que NO existe en este schema).

═══════════════════════════════════════════════════════════════════  
NO ESTÁ EN ESTE SPRINT  
═══════════════════════════════════════════════════════════════════

\- Construcción del módulo PIM (Sprint A2)  
\- Resolver duplicación cuotas\_\* vs fin\_cuotas\_\* (Sprint A3)  
\- UI completa de padrones e importadores (Sprint A4)  
\- Click en plantilla de comunicaciones (Sprint A5; en A1 solo se crea el page.tsx para que no de 404\)  
\- Construcción del módulo proyectos (Sprint A6)  
\- Construcción del módulo salud / lesiones (Sprint B1)  
\- Construcción del módulo scouting (Sprint B3)  
\- Mapa visual de espacios / diagramación del club (Sprint B6 \+ D6)  
\- Renombre físico de tablas/carpetas (Sprint D5)  
\- Pricing real del marketplace (decisión H2 post FASE C)

═══════════════════════════════════════════════════════════════════  
CIERRE DE SPRINT — AL TERMINAR  
═══════════════════════════════════════════════════════════════════

COMMIT FEATURE:  
\- feat(configuracion): espacios genéricos \+ sidebar reorganizado \+ fix 8 bugs 404 (Sprint A1)

COMMIT DOCS (separado):  
\- docs: update CURRENT-STATE, SPRINT-PLAN, DATA-MODEL, MODULE-CATALOG, VISUAL-GALLERY for Sprint A1

TAG:  
\- v0.27.0-fase-a-sprint-1

CIERRE EN DRIVE:  
\- CIERRE-SPRINT-A1 en \`\_Cierre Ejecutivo/\`

REPORTE AL ARQUITECTO (formato PARTE 10.7):  
\- Hashes de feat \+ docs commits \+ tag  
\- Deploy ID de Vercel  
\- Pre-mortem outcome (riesgos materializados, nuevos identificados)  
\- Verificación PARTE 1 resumen  
\- Test counts (target N → N+6)  
\- Migration changes (lista de tablas/columnas/triggers/RLS creados)  
\- Desviaciones de scope (con justificación si las hay)  
\- Próximo sprint: A2 (PIM Nivel 1\)

Fin del Sprint A1.  
