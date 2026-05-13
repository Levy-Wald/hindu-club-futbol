SPRINT A4 — CRM Avanzado (Padrones \+ Importadores \+ Vínculos)  
\===================================================================

Version: 1.0  
Fecha: 13 de mayo de 2026  
Path: docs/sprints/A4-crm-avanzado.md

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO  
═══════════════════════════════════════════════════════════════════

1\. /CLAUDE.md  
2\. /docs/CURRENT-STATE.md (esperado A3 cerrado, tag v0.27.0-fase-a-sprint-3)  
3\. /docs/SPRINT-PLAN.md  
4\. /docs/MASTER-MODEL-CCBP.md (D-personas, D-entidades, D-padrones)  
5\. /docs/ARCHITECTURE.md \+ ARCHITECTURE-ADDENDUM  
6\. modules/personas/, modules/externos/ (renombrar a modules/entidades en A1 ya hecho)  
7\. Tablas: personas, personas\_atributos, personas\_vehiculos, entidades, entidades\_representantes

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA  
═══════════════════════════════════════════════════════════════════

\[x\] CAPA BD: tablas padrones, padron\_items, vinculos\_persona\_entidad ampliada, atributos custom por tenant  
\[x\] CAPA CÓDIGO: modules/padrones, modules/importadores (universal CSV/Excel)  
\[x\] CAPA UI: pantalla /admin/padrones, importer wizard, tab Vínculos en persona/entidad, atributos custom UI  
\[x\] CAPA ESTILOS, GALERÍA: estándar

═══════════════════════════════════════════════════════════════════  
SPRINT A4  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
Al cierre:  
\- Admin puede crear padrones (listas activas filtradas de personas)  
\- Admin puede importar personas o entidades desde CSV/Excel con wizard (preview, validación, dedup)  
\- Admin puede definir atributos custom por tenant (campos extra para personas)  
\- Tab "Vínculos" en personas muestra todas las relaciones (entidad, equipos, padrones)

ALCANCE

SÍ entra:

1\. Tabla padrones (nueva)  
   \- id, tenant\_id, nombre, descripcion, tipo (dinamico/estatico), criterio\_dinamico jsonb, activo, created\_at, updated\_at, deleted\_at

2\. Tabla padron\_items (nueva)  
   \- padron\_id, persona\_id, agregado\_por\_user\_id, fecha\_agregado  
   \- Para padrones dinámicos: refrescable vía función  
   \- Para padrones estáticos: lista manual

3\. Función fn\_refrescar\_padron(padron\_id)   
   Re-ejecuta el criterio\_dinamico y actualiza padron\_items

4\. Tabla atributos\_custom\_definicion (nueva)  
   \- id, tenant\_id, slug, nombre, tipo (text/number/date/select/boolean), opciones jsonb (si tipo=select), entidad\_target (persona/entidad), required, activo

5\. Tabla atributos\_custom\_valores (nueva)  
   \- definicion\_id, entidad\_id (persona o entidad), valor jsonb

6\. Tabla importer\_jobs (nueva, histórico de imports)  
   \- id, tenant\_id, user\_id, entidad\_target (persona/entidad/producto), filename, total\_rows, rows\_imported, rows\_skipped, rows\_failed, status, error\_log jsonb, created\_at

7\. Módulo modules/padrones  
   \- lib/actions.ts: crearPadron, refrescarPadron, agregarManualAPadron, removerDePadron  
   \- lib/queries.ts: listarPadrones, padronPorId, personasEnPadron  
   \- ui/padron-form.tsx, padron-row.tsx

8\. Módulo modules/importadores (universal)  
   \- lib/parser.ts: parsea CSV/Excel  
   \- lib/validator.ts: valida según schema del target  
   \- lib/dedup.ts: detecta duplicados por email/dni/cuit  
   \- lib/actions.ts: procesarImportAction (job async)  
   \- ui/import-wizard.tsx: 4 steps (Upload → Mapeo → Preview → Ejecutar)

9\. Pantallas:  
   \- /admin/padrones (listado)  
   \- /admin/padrones/\[id\] (detalle con personas, criterio, opciones de refresh)  
   \- /admin/configuracion/atributos-custom (admin de atributos)  
   \- Importer accesible desde /admin/personas (botón "Importar"), /admin/entidades (botón "Importar"), /admin/productos (botón "Importar")  
   \- Tab "Vínculos" en /admin/personas/\[id\] y /admin/entidades/\[id\]

NO entra:  
\- Importer de movimientos financieros (futuro)  
\- Padrones cross-tenant (no aplica multi-tenancy actual)  
\- Workflows de aprobación de imports (futuro FASE D)

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM  
═══════════════════════════════════════════════════════════════════

| \# | Riesgo | Mitigación |  
| \- | \------ | \---------- |  
| S1 | Import de archivos grandes (\>5000 rows) puede timeout server action | Job async vía Edge Function; UI hace polling de status |  
| S2 | Dedup puede ser ambiguo (mismo email, distinto nombre) | Mostrar al usuario los conflictos para decisión manual en step Preview |  
| S3 | Atributos custom permiten al tenant romper integridad si no se valida | Validación server-side antes de insert. Frontend valida según tipo de atributo. |  
| S4 | Padrones dinámicos con criterio\_jsonb complejo pueden generar queries lentas | Limitar criterios a operadores simples; complejos requieren ADR |  
| S5 | CSV con encodings raros (Windows-1252) falla parser | Detectar encoding automáticamente, fallback a utf-8 con warning |

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación  
═══════════════════════════════════════════════════════════════════

git describe \--tags \--abbrev=0  \-- v0.27.0-fase-a-sprint-3

SELECT count(\*) FROM personas WHERE tenant\_id='11111111-1111-1111-1111-111111111111';  
SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='padrones');  
SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='atributos\_custom\_definicion');

═══════════════════════════════════════════════════════════════════  
PARTE 2 — Migration  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — Padrones  
CREATE TABLE IF NOT EXISTS padrones (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  nombre text NOT NULL,  
  descripcion text,  
  tipo text NOT NULL CHECK (tipo IN ('dinamico','estatico')),  
  criterio\_dinamico jsonb,  
  ultima\_actualizacion timestamptz,  
  activo boolean NOT NULL DEFAULT true,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE INDEX idx\_padrones\_tenant ON padrones(tenant\_id) WHERE deleted\_at IS NULL;  
CREATE TRIGGER trg\_padrones\_updated\_at BEFORE UPDATE ON padrones FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();  
ALTER TABLE padrones ENABLE ROW LEVEL SECURITY;  
CREATE POLICY padrones\_tenant ON padrones FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.2 — Padron items  
CREATE TABLE IF NOT EXISTS padron\_items (  
  padron\_id uuid NOT NULL REFERENCES padrones(id) ON DELETE CASCADE,  
  persona\_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,  
  agregado\_por\_user\_id uuid,  
  fecha\_agregado timestamptz NOT NULL DEFAULT now(),  
  PRIMARY KEY (padron\_id, persona\_id)  
);

ALTER TABLE padron\_items ENABLE ROW LEVEL SECURITY;  
CREATE POLICY padron\_items\_via\_padron ON padron\_items FOR ALL USING (  
  padron\_id IN (SELECT id FROM padrones WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

\-- 2.3 — Atributos custom  
CREATE TABLE IF NOT EXISTS atributos\_custom\_definicion (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  slug text NOT NULL,  
  nombre text NOT NULL,  
  tipo text NOT NULL CHECK (tipo IN ('text','number','date','select','boolean','textarea')),  
  opciones jsonb,  
  entidad\_target text NOT NULL CHECK (entidad\_target IN ('persona','entidad')),  
  required boolean NOT NULL DEFAULT false,  
  activo boolean NOT NULL DEFAULT true,  
  orden integer DEFAULT 0,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE UNIQUE INDEX idx\_atrib\_custom\_slug\_unique ON atributos\_custom\_definicion(tenant\_id, slug, entidad\_target) WHERE deleted\_at IS NULL;  
CREATE TRIGGER trg\_atrib\_custom\_updated\_at BEFORE UPDATE ON atributos\_custom\_definicion FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();  
ALTER TABLE atributos\_custom\_definicion ENABLE ROW LEVEL SECURITY;  
CREATE POLICY atrib\_custom\_tenant ON atributos\_custom\_definicion FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

CREATE TABLE IF NOT EXISTS atributos\_custom\_valores (  
  definicion\_id uuid NOT NULL REFERENCES atributos\_custom\_definicion(id) ON DELETE CASCADE,  
  entidad\_id uuid NOT NULL,  
  valor jsonb,  
  PRIMARY KEY (definicion\_id, entidad\_id)  
);

ALTER TABLE atributos\_custom\_valores ENABLE ROW LEVEL SECURITY;  
CREATE POLICY atrib\_valores\_via\_def ON atributos\_custom\_valores FOR ALL USING (  
  definicion\_id IN (SELECT id FROM atributos\_custom\_definicion WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

\-- 2.4 — Importer jobs  
CREATE TABLE IF NOT EXISTS importer\_jobs (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  user\_id uuid,  
  entidad\_target text NOT NULL,  
  filename text,  
  total\_rows integer,  
  rows\_imported integer DEFAULT 0,  
  rows\_skipped integer DEFAULT 0,  
  rows\_failed integer DEFAULT 0,  
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),  
  error\_log jsonb DEFAULT '\[\]'::jsonb,  
  mapping jsonb,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  completed\_at timestamptz  
);

CREATE INDEX idx\_importer\_jobs\_tenant ON importer\_jobs(tenant\_id, created\_at DESC);  
ALTER TABLE importer\_jobs ENABLE ROW LEVEL SECURITY;  
CREATE POLICY importer\_jobs\_tenant ON importer\_jobs FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.5 — Función fn\_refrescar\_padron (placeholder, lógica dinámica simple)  
CREATE OR REPLACE FUNCTION fn\_refrescar\_padron(p\_padron\_id uuid) RETURNS integer AS $$  
DECLARE  
  v\_criterio jsonb;  
  v\_count integer;  
BEGIN  
  SELECT criterio\_dinamico INTO v\_criterio FROM padrones WHERE id \= p\_padron\_id AND tipo \= 'dinamico';  
  IF v\_criterio IS NULL THEN RETURN 0; END IF;  
    
  DELETE FROM padron\_items WHERE padron\_id \= p\_padron\_id;  
    
  \-- Ejemplo: criterio \= {"equipo\_id": "uuid", "atributo": "socio.activo"}  
  \-- Implementación real depende del criterio. Acá un placeholder.  
  IF v\_criterio ? 'equipo\_id' THEN  
    INSERT INTO padron\_items (padron\_id, persona\_id)  
    SELECT p\_padron\_id, pe.persona\_id FROM personas\_equipos pe  
    WHERE pe.equipo\_id \= (v\_criterio-\>\>'equipo\_id')::uuid AND pe.activo \= true;  
  END IF;  
    
  UPDATE padrones SET ultima\_actualizacion \= now() WHERE id \= p\_padron\_id;  
    
  SELECT COUNT(\*) INTO v\_count FROM padron\_items WHERE padron\_id \= p\_padron\_id;  
  RETURN v\_count;  
END;  
$$ LANGUAGE plpgsql;

COMMIT;

═══════════════════════════════════════════════════════════════════  
PARTE 3 — CAPA CÓDIGO  
═══════════════════════════════════════════════════════════════════

modules/padrones/  
\- lib/actions.ts, queries.ts, permisos.ts  
\- ui/padron-form.tsx, padron-row.tsx, padron-detail.tsx

modules/importadores/  
\- lib/parser.ts (papaparse \+ xlsx)  
\- lib/validator.ts (Zod schema dinámico según target)  
\- lib/dedup.ts  
\- lib/jobs.ts (crear job, polling)  
\- ui/import-wizard.tsx (4 steps con state machine)  
\- ui/import-status.tsx (progreso)

Edge function: /functions/process-import (Supabase Edge), procesa importer\_jobs pending  
Trigger en importer\_jobs: cuando se inserta con status=pending, llama a la edge function

modules/personas/ (extensión):  
\- atributosCustomPersona query  
\- tab Vínculos con queries de equipos, entidades, padrones, asistencias activas

modules/entidades/:  
\- atributosCustomEntidad query  
\- tab Vínculos

═══════════════════════════════════════════════════════════════════  
PARTE 5 — UI  
═══════════════════════════════════════════════════════════════════

5.1 — /admin/padrones (listado)

\+--------------------------------------------------------------+  
| Padrones                                       \[+ Nuevo padrón\]  
| Listas activas de personas                                   |  
\+--------------------------------------------------------------+  
| Tabla: Nombre | Tipo | Personas | Última actualización | Acciones |

5.2 — /admin/padrones/\[id\]

Tabs: Info | Personas | Criterio (si dinamico)

\- Tab Personas: tabla de personas en el padrón  
  \- Si dinamico: solo lectura, botón "Refrescar"  
  \- Si estatico: CRUD manual (agregar persona, remover)  
\- Tab Criterio: editor del criterio dinamico (JSON simple en este sprint)

5.3 — Importer wizard (componente reusable accesible desde múltiples pantallas)

Step 1 — Upload:  
\- Drop zone CSV/Excel  
\- Max 10MB  
\- Validación de extensión

Step 2 — Mapeo de columnas:  
\- Tabla con columnas del archivo a la izquierda, campos del modelo a la derecha  
\- Auto-detect por nombre similar  
\- Permitir saltar columnas

Step 3 — Preview y validación:  
\- Tabla con primeras 10 filas \+ indicador de validación por fila  
\- Filas con error: badge rojo con razón (email duplicado, dni inválido, etc.)  
\- Resumen: N filas válidas, M filas con error  
\- Opciones: skip filas con error / abortar

Step 4 — Ejecutar:  
\- Botón "Importar N filas"  
\- Progress bar  
\- Toast al completar con resumen final  
\- Link a importer\_jobs/\[id\] con detalle

5.4 — /admin/configuracion/atributos-custom

\+--------------------------------------------------------------+  
| Atributos custom                              \[+ Nuevo atributo\]  
\+--------------------------------------------------------------+  
| Filtros: \[Target: Personas / Entidades / Ambos ▼\]            |  
| Tabla: Nombre | Slug | Tipo | Target | Required | Acciones   |

Modal \+Nuevo atributo:  
\- Nombre, slug (auto), tipo (select), target (persona/entidad), required toggle  
\- Si tipo=select: campo de opciones (array de strings)

5.5 — Tab Vínculos en /admin/personas/\[id\]

\+--------------------------------------------------------------+  
| Vínculos de Juan Pérez                                       |  
\+--------------------------------------------------------------+  
| Equipos: \[Badge: Primera\] \[Badge: Sub-15 CT\]                |  
| Entidades: \[Badge: Empresa X (representante)\]                |  
| Padrones: \[Badge: Activos\] \[Badge: Sub-15 Padres\]            |  
| Asistencias activas: 12 eventos próximos                     |  
| Atributos:                                                   |  
|   \- Categoría: Socio Activo                                  |  
|   \- Talla camiseta: M                                        |  
|   \- Notas médicas: \[click para ver\]                          |  
\+--------------------------------------------------------------+

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target \+5)  
═══════════════════════════════════════════════════════════════════

Test 1: Crear padrón estático y agregar personas  
\- Crear 3 personas fixture  
\- Crear padrón "Test Lista"  
\- Agregar 2 personas  
\- Assert: padron\_items tiene 2 filas  
\- Cleanup

Test 2: Padrón dinámico se refresca  
\- Crear equipo \+ 3 personas en él  
\- Crear padrón dinamico con criterio {equipo\_id: X}  
\- Refrescar  
\- Assert: padron\_items tiene 3 filas  
\- Cleanup

Test 3: Importer wizard end-to-end  
\- Generar CSV con 5 personas válidas (fixture)  
\- Subir vía wizard  
\- Mapear columnas  
\- Confirmar  
\- Assert: 5 personas creadas con metadata.fixture=true  
\- Cleanup

Test 4: Atributo custom funciona  
\- Crear atributo "categoria\_socio" tipo select con opciones \['Activo','Vitalicio','Honorario'\]  
\- Crear persona y asignar valor "Activo"  
\- Assert: atributos\_custom\_valores \+1 fila  
\- Cleanup

Test 5: Tab Vínculos muestra info correcta  
\- Persona fixture en 1 equipo y 1 padrón  
\- Navegar a /admin/personas/\[id\], tab Vínculos  
\- Assert: ambos badges visibles  
\- Cleanup

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Cierre  
═══════════════════════════════════════════════════════════════════

10.1 docs vivos:  
\- CURRENT-STATE: \+5 tablas, \+1 función  
\- SPRINT-PLAN: A4 DONE  
\- DATA-MODEL: padrones, padron\_items, atributos\_custom\_\*, importer\_jobs  
\- MODULE-CATALOG: padrones, importadores → Productivo

10.2 commit feat(crm): padrones \+ importadores universales \+ atributos custom (Sprint A4)  
10.3 commit docs  
10.4 tag v0.27.0-fase-a-sprint-4  
10.5 cierre Drive  
10.6 screenshots  
10.7 reporte

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

1\. Pre-mortem reportado  
2\. Verificación PARTE 1 ejecutada  
3\. Migration aplicada  
4\. 5 tablas nuevas \+ 1 función  
5\. Edge function de import deployada  
6\. Módulo padrones funcional  
7\. Módulo importadores universal funcional (papaparse \+ xlsx)  
8\. Pantallas /admin/padrones funcionales  
9\. Wizard de importer integrado en personas, entidades, productos  
10\. Tab Vínculos funcional  
11\. UI de atributos custom funcional  
12\. \+5 E2E pasando  
13\. Tag v0.27.0-fase-a-sprint-4 aplicado

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS  
═══════════════════════════════════════════════════════════════════

1\. Mock-first vigente (jobs procesados localmente o vía edge function mock)  
2\. Soft-delete deleted\_at  
3\. trg\_set\_updated\_at  
4\. NO importar datos productivos en tests  
5\. Validación de archivo: max 10MB, formatos .csv .xlsx .xls  
6\. Si excede 12h Code, parar

COMMIT: feat(crm): padrones \+ importadores universales \+ atributos custom \+ vínculos (Sprint A4)  
TAG: v0.27.0-fase-a-sprint-4

Fin Sprint A4.  
