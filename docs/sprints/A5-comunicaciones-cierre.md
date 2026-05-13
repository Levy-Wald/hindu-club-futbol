SPRINT A5 — Comunicaciones Cierre  
\======================================

Version: 1.0  
Fecha: 13 de mayo de 2026  
Path: docs/sprints/A5-comunicaciones-cierre.md

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO  
═══════════════════════════════════════════════════════════════════

1\. /CLAUDE.md  
2\. /docs/CURRENT-STATE.md (esperado A4 cerrado, tag v0.27.0-fase-a-sprint-4)  
3\. /docs/SPRINT-PLAN.md  
4\. /docs/MASTER-MODEL-CCBP.md (D-comunicaciones)  
5\. /docs/ARCHITECTURE.md \+ ARCHITECTURE-ADDENDUM  
6\. /docs/UI-UX-PATTERNS.md  
7\. modules/comunicaciones/ (módulo existente, plantillas \+ envíos productivos)  
8\. Tablas: com\_plantillas, com\_envios, com\_mensajes, com\_automatizaciones, com\_jobs\_log

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA  
═══════════════════════════════════════════════════════════════════

\[x\] CAPA CÓDIGO: refactor modules/comunicaciones, editor de plantillas, workflow editor  
\[x\] CAPA UI: pantalla detalle plantilla, workflow editor visual, panel automatizaciones  
\[x\] CAPA BD: agregar com\_automatizaciones\_pasos (workflow steps), com\_variables\_disponibles (catalogo)

═══════════════════════════════════════════════════════════════════  
SPRINT A5  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
Al cierre:  
\- /admin/comunicaciones/plantillas/\[id\] tiene UI completa (editor de plantilla, no solo placeholder de A1)  
\- Yair puede crear/editar plantillas con variables del modelo (ej. {{persona.nombre}}, {{cuota.monto}})  
\- Yair puede crear automatizaciones simples: "Si pasa X, enviar plantilla Y a Z"  
\- Workflow editor básico para automatizaciones multi-paso (visual con drag and drop simple)  
\- Test send: probar plantilla con datos reales antes de envío masivo

ALCANCE

SÍ entra:

1\. Editor de plantillas (/admin/comunicaciones/plantillas/\[id\]/editar)  
   \- Form completo con campos: nombre, canal (email/sms/whatsapp/in\_app), subject (si email), body con editor rich text  
   \- Variables disponibles en sidebar derecho (click para insertar): {{persona.nombre}}, {{persona.email}}, {{cuota.monto}}, {{evento.fecha}}, etc.  
   \- Preview con datos sample  
   \- Botón "Test send" envía a una persona seleccionada  
   \- Versionado: cada save genera versión (mantener histórico simple)

2\. Tabla com\_variables\_disponibles (catálogo)  
   \- slug, descripcion, contexto (persona/cuota/evento/equipo/etc.), tipo\_dato  
   \- Seed inicial con \~20 variables comunes

3\. Automatizaciones expandidas  
   \- Tabla com\_automatizaciones (existente, mejorar):  
     \- Agregar campo plantilla\_id (FK), filtro\_personas jsonb, condiciones\_disparo jsonb  
   \- Tabla com\_automatizaciones\_pasos (nueva, para multi-paso):  
     \- automatizacion\_id, orden, plantilla\_id, delay\_horas, condicion\_continuar jsonb

4\. Workflow editor visual (modules/comunicaciones/ui/workflow-editor.tsx)  
   \- Vista de pasos en columnas (similar a Kanban)  
   \- Cada paso: card con plantilla \+ delay \+ condiciones  
   \- Botón \+Agregar paso  
   \- Drag and drop para reordenar (dnd-kit)  
   \- Save genera registros en com\_automatizaciones\_pasos

5\. Pantalla /admin/comunicaciones/automatizaciones  
   \- Listado de automatizaciones con estado (activa/pausa)  
   \- Toggle activa/inactiva  
   \- Click → editor visual de workflow

6\. Test send  
   \- Botón "Probar envío" en editor de plantilla  
   \- Modal: seleccionar persona destinataria \+ canal  
   \- Envío real al destinatario seleccionado (mock-first: solo loguea, no envía a Resend real)  
   \- Toast con resultado

NO entra:  
\- Templating avanzado tipo Liquid (Sprint futuro)  
\- A/B testing de plantillas (futuro)  
\- Segmentación avanzada cruzada (cubierto parcialmente vía padrones de A4)  
\- Conector real Resend / BAPI activado (mock-first hasta FASE C)

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM  
═══════════════════════════════════════════════════════════════════

| \# | Riesgo | Mitigación |  
| \- | \------ | \---------- |  
| S1 | Editor rich text genera HTML malo que rompe email | Sanitizar con dompurify antes de guardar. Validar al render. |  
| S2 | Variables no resueltas en runtime envían "{{persona.nombre}}" literal | Templating con fallback: si variable no resuelve, usar valor default o saltear envío con error |  
| S3 | Test send a persona real puede generar registro contaminado en com\_envios | Marcar test sends con metadata.test=true; filtrar de reportes |  
| S4 | Workflow multi-paso con delay 24h+ requiere scheduler | Usar Edge Function con cron (pg\_cron extension). Si no está habilitado, agendar manualmente vía com\_jobs\_log |  
| S5 | Drag and drop puede tener bugs en mobile | Limitar reorder a desktop en este sprint. Mobile lee, no edita orden. |

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación  
═══════════════════════════════════════════════════════════════════

git describe \--tags \--abbrev=0  \-- v0.27.0-fase-a-sprint-4

SELECT count(\*) FROM com\_plantillas WHERE tenant\_id='11111111-1111-1111-1111-111111111111';  
SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='com\_variables\_disponibles');  
SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='com\_automatizaciones\_pasos');

═══════════════════════════════════════════════════════════════════  
PARTE 2 — Migration  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — Variables disponibles  
CREATE TABLE IF NOT EXISTS com\_variables\_disponibles (  
  slug text PRIMARY KEY,  
  descripcion text NOT NULL,  
  contexto text NOT NULL CHECK (contexto IN ('persona','entidad','cuota','evento','equipo','tenant','producto')),  
  tipo\_dato text NOT NULL CHECK (tipo\_dato IN ('text','number','date','currency','boolean')),  
  ejemplo text,  
  activo boolean NOT NULL DEFAULT true  
);

INSERT INTO com\_variables\_disponibles (slug, descripcion, contexto, tipo\_dato, ejemplo) VALUES  
  ('persona.nombre','Nombre de la persona','persona','text','Juan'),  
  ('persona.apellido','Apellido','persona','text','Pérez'),  
  ('persona.nombre\_completo','Nombre completo','persona','text','Juan Pérez'),  
  ('persona.email','Email','persona','text','juan@example.com'),  
  ('persona.dni','DNI','persona','text','12345678'),  
  ('cuota.monto','Monto de la cuota','cuota','currency','$5000'),  
  ('cuota.vencimiento','Fecha de vencimiento','cuota','date','15/06/2026'),  
  ('cuota.concepto','Concepto','cuota','text','Cuota Junio'),  
  ('evento.nombre','Nombre del evento','evento','text','Entrenamiento Primera'),  
  ('evento.fecha','Fecha del evento','evento','date','15/05/2026'),  
  ('evento.hora','Hora','evento','text','17:00'),  
  ('evento.sede','Sede','evento','text','Sede Central'),  
  ('evento.espacio','Espacio','evento','text','Cancha 1'),  
  ('equipo.nombre','Nombre del equipo','equipo','text','Primera'),  
  ('tenant.nombre','Nombre del tenant','tenant','text','Hindu Club Fútbol'),  
  ('tenant.sitio\_web','Sitio web','tenant','text','hinduclub.com.ar')  
ON CONFLICT (slug) DO NOTHING;

\-- 2.2 — Versionado plantillas  
ALTER TABLE com\_plantillas ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;  
ALTER TABLE com\_plantillas ADD COLUMN IF NOT EXISTS body\_html text;

CREATE TABLE IF NOT EXISTS com\_plantilla\_versiones (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  plantilla\_id uuid NOT NULL REFERENCES com\_plantillas(id) ON DELETE CASCADE,  
  version integer NOT NULL,  
  subject text,  
  body\_html text,  
  body\_text text,  
  guardado\_por\_user\_id uuid,  
  created\_at timestamptz NOT NULL DEFAULT now()  
);

CREATE UNIQUE INDEX idx\_plantilla\_version\_unique ON com\_plantilla\_versiones(plantilla\_id, version);  
ALTER TABLE com\_plantilla\_versiones ENABLE ROW LEVEL SECURITY;  
CREATE POLICY plantilla\_versiones\_via\_plantilla ON com\_plantilla\_versiones FOR ALL USING (  
  plantilla\_id IN (SELECT id FROM com\_plantillas WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

\-- 2.3 — Automatizaciones expandidas  
ALTER TABLE com\_automatizaciones ADD COLUMN IF NOT EXISTS plantilla\_id uuid REFERENCES com\_plantillas(id);  
ALTER TABLE com\_automatizaciones ADD COLUMN IF NOT EXISTS filtro\_personas jsonb;  
ALTER TABLE com\_automatizaciones ADD COLUMN IF NOT EXISTS condiciones\_disparo jsonb;

\-- 2.4 — Pasos de automatización (workflow multi-paso)  
CREATE TABLE IF NOT EXISTS com\_automatizaciones\_pasos (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  automatizacion\_id uuid NOT NULL REFERENCES com\_automatizaciones(id) ON DELETE CASCADE,  
  orden integer NOT NULL,  
  plantilla\_id uuid REFERENCES com\_plantillas(id),  
  delay\_horas integer DEFAULT 0,  
  condicion\_continuar jsonb,  
  activo boolean NOT NULL DEFAULT true,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now()  
);

CREATE INDEX idx\_autom\_pasos\_orden ON com\_automatizaciones\_pasos(automatizacion\_id, orden);  
CREATE TRIGGER trg\_autom\_pasos\_updated\_at BEFORE UPDATE ON com\_automatizaciones\_pasos FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();  
ALTER TABLE com\_automatizaciones\_pasos ENABLE ROW LEVEL SECURITY;  
CREATE POLICY autom\_pasos\_via\_autom ON com\_automatizaciones\_pasos FOR ALL USING (  
  automatizacion\_id IN (SELECT id FROM com\_automatizaciones WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
);

COMMIT;

═══════════════════════════════════════════════════════════════════  
PARTE 5 — UI  
═══════════════════════════════════════════════════════════════════

5.1 — /admin/comunicaciones/plantillas/\[id\]/editar

Layout 2 columnas:

Columna izquierda (editor):  
\- Nombre, canal (select), subject (si email)  
\- Editor rich text para body (Tiptap o similar)  
\- Toggle Preview / Edit

Columna derecha (sidebar):  
\- Lista de variables disponibles agrupadas por contexto  
\- Click en variable inserta {{slug}} en cursor  
\- Botones: Guardar, Test send, Cancelar

Test send modal:  
\- Persona destinataria (autocomplete)  
\- Canal (preselected del plantilla)  
\- Preview con datos de la persona  
\- Botón "Enviar" (mock: registra en com\_envios con test=true)

5.2 — /admin/comunicaciones/automatizaciones

\+--------------------------------------------------------------+  
| Automatizaciones                            \[+ Nueva\]        |  
\+--------------------------------------------------------------+  
| Nombre | Disparador | Plantilla | Estado | Acciones          |  
\+--------------------------------------------------------------+

Modal \+Nueva automatización:  
\- Nombre  
\- Disparador (select: cuota\_vencida, evento\_proximo, persona\_creada, etc.)  
\- Filtro de personas (link a padrones o criterio custom)  
\- Plantilla inicial  
\- Botón "Configurar workflow" → workflow editor

5.3 — Workflow editor /admin/comunicaciones/automatizaciones/\[id\]/workflow

\+--------------------------------------------------------------+  
| Workflow: Recordatorio cuota vencida                         |  
\+--------------------------------------------------------------+  
|                                                              |  
| \[Paso 1: Recordatorio amable\]                                |  
|   Plantilla: Recordatorio 1                                  |  
|   Delay: 0 horas (inmediato)                                 |  
|   \[Editar\] \[Eliminar\]                                        |  
|         ↓                                                    |  
| \[Paso 2: Segundo recordatorio\]                              |  
|   Plantilla: Recordatorio 2                                  |  
|   Delay: 72 horas                                            |  
|   Continuar si: cuota.estado \!= 'pagada'                    |  
|   \[Editar\] \[Eliminar\]                                        |  
|         ↓                                                    |  
| \[+ Agregar paso\]                                             |  
|                                                              |  
\+--------------------------------------------------------------+

Drag and drop para reordenar (dnd-kit).

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target \+4)  
═══════════════════════════════════════════════════════════════════

Test 1: Crear plantilla con variable  
\- Crear plantilla email "Test bienvenida"  
\- Insertar variable {{persona.nombre}} en body  
\- Guardar  
\- Assert: com\_plantilla\_versiones \+1 fila  
\- Cleanup

Test 2: Test send funciona  
\- Plantilla fixture \+ persona fixture  
\- Click test send  
\- Assert: com\_envios \+1 fila con metadata.test=true  
\- Cleanup

Test 3: Crear automatización con 2 pasos  
\- Crear automatización "Test"  
\- Agregar paso 1: plantilla A, delay 0  
\- Agregar paso 2: plantilla B, delay 24h  
\- Save  
\- Assert: com\_automatizaciones\_pasos tiene 2 filas  
\- Cleanup

Test 4: Reordenar pasos vía drag and drop (E2E desktop)  
\- Automatización con 3 pasos  
\- Drag paso 3 a posición 1  
\- Assert: orden actualizado en DB

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Cierre  
═══════════════════════════════════════════════════════════════════

10.1 docs vivos:  
\- CURRENT-STATE: \+3 tablas (com\_variables\_disponibles, com\_plantilla\_versiones, com\_automatizaciones\_pasos)  
\- SPRINT-PLAN: A5 DONE  
\- DATA-MODEL: tablas nuevas  
\- MODULE-CATALOG: comunicaciones avanzado → Productivo

10.2 commit feat(comunicaciones): editor plantillas \+ workflow editor \+ test send (Sprint A5)  
10.3 commit docs  
10.4 tag v0.27.0-fase-a-sprint-5  
10.5 cierre Drive  
10.6 screenshots  
10.7 reporte

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

1\. Pre-mortem reportado  
2\. Verificación PARTE 1 ejecutada  
3\. Migration aplicada  
4\. 3 tablas nuevas \+ columnas a com\_plantillas y com\_automatizaciones  
5\. Catálogo com\_variables\_disponibles con 16 variables seed  
6\. Editor de plantillas con rich text \+ variables funcional  
7\. Test send funcional (mock)  
8\. Workflow editor con drag and drop funcional  
9\. \+4 E2E pasando  
10\. Tag v0.27.0-fase-a-sprint-5 aplicado

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS  
═══════════════════════════════════════════════════════════════════

1\. Mock-first vigente: NO activar Resend / BAPI real  
2\. Test sends marcados con metadata.test=true para filtrar  
3\. Sanitizar HTML con dompurify antes de guardar  
4\. trg\_set\_updated\_at  
5\. Soft-delete deleted\_at  
6\. NO smoke tests masivos contra personas reales (regla vigente del proyecto)  
7\. Si excede 7h Code, parar

COMMIT: feat(comunicaciones): editor plantillas \+ workflow editor \+ variables \+ test send (Sprint A5)  
TAG: v0.27.0-fase-a-sprint-5

Fin Sprint A5.  
