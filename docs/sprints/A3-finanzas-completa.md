SPRINT A3 — Finanzas Completa  
\==================================

Version del prompt: 1.0  
Fecha: 13 de mayo de 2026  
Path esperado en repo: docs/sprints/A3-finanzas-completa.md  
Formato canónico: docs/PROMPT-TEMPLATE.md

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO  
═══════════════════════════════════════════════════════════════════

Leer:  
1\. /CLAUDE.md  
2\. /docs/CURRENT-STATE.md (esperado A2 cerrado, tag v0.27.0-fase-a-sprint-2)  
3\. /docs/SPRINT-PLAN.md  
4\. /docs/rfcs/RFC-004 (D2 troncal mínimo bloque 3 Finanzas)  
5\. /docs/DECISIONS.md (ADR-041 troncal mínimo)  
6\. /docs/MASTER-MODEL-CCBP.md (D-finanzas reglas vigentes)  
7\. /docs/ARCHITECTURE.md \+ ARCHITECTURE-ADDENDUM  
8\. /docs/UI-UX-PATTERNS.md  
9\. modules/finanzas/ y modules/cuotas/ (módulos existentes con deuda técnica)  
10\. modules/suscripciones/ (existente)  
11\. Tablas: cuotas\_emitidas, fin\_cuotas\_emitidas (duplicación heredada a resolver)

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA  
═══════════════════════════════════════════════════════════════════

\[x\] CAPA BD: consolidar duplicación cuotas\_emitidas / fin\_cuotas\_emitidas, agregar plan\_de\_cuentas, conceptos\_fiscales (si no existen)  
\[x\] CAPA CÓDIGO: refactor modules/finanzas, modules/cuotas  
\[x\] CAPA UI: páginas /admin/finanzas/movimientos/nuevo, /admin/finanzas/transferencias/nueva, /admin/finanzas/cuotas/emitir, /admin/finanzas/plan-de-cuentas; resumen de caja; cuenta corriente por persona  
\[x\] CAPA ESTILOS, GALERÍA: estándar

═══════════════════════════════════════════════════════════════════  
SPRINT A3 — Finanzas Completa  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
Al cierre:  
\- La duplicación cuotas\_emitidas / fin\_cuotas\_emitidas está resuelta (un único modelo vigente)  
\- Los 3 fallidos 404 de A1 ahora tienen UI funcional (no solo page.tsx para que cargue)  
\- Plan de cuentas configurable por tenant  
\- Cuenta corriente por persona accesible desde su perfil  
\- Resumen de caja con saldo en tiempo real

ALCANCE

SÍ entra:

1\. Decisión sobre duplicación cuotas\_\*  
   Decisión canon: la tabla principal es \`fin\_cuotas\_emitidas\`.  
   La tabla \`cuotas\_emitidas\` se transforma en una vista DEPRECATED que apunta a fin\_cuotas\_emitidas para compatibilidad con código existente.  
   Hay que migrar datos de cuotas\_emitidas → fin\_cuotas\_emitidas si difieren, y refactorizar los imports en el código.

2\. Plan de cuentas  
   Tabla \`fin\_plan\_cuentas\` (si no existe):  
   \- id, tenant\_id, codigo (ej. 1.1.01), nombre, parent\_id, tipo (activo/pasivo/ingreso/egreso/patrimonio), activo  
   Pantalla /admin/finanzas/plan-de-cuentas con árbol jerárquico  
   Seed básico para nuevos tenants (cuentas estándar)

3\. Página /admin/finanzas/movimientos/nuevo  
   Form completo:  
   \- Tipo (ingreso / egreso / transferencia)  
   \- Caja origen \+ destino (si transferencia)  
   \- Concepto / cuenta del plan  
   \- Monto (con moneda)  
   \- Persona o entidad asociada (opcional)  
   \- Cuota emitida asociada (opcional, si es pago de cuota)  
   \- Fecha del movimiento  
   \- Comprobante (upload, opcional)  
   \- Descripción

4\. Página /admin/finanzas/transferencias/nueva  
   Form específico para transferencias entre cajas (sin afectar terceros):  
   \- Caja origen, caja destino, monto, fecha, descripción  
   \- Genera 2 movimientos atómicos en fin\_movimientos

5\. Página /admin/finanzas/cuotas/emitir  
   Form de emisión masiva:  
   \- Concepto / categoría de cuota (FK a catalogo)  
   \- Personas destinatarias (selector multi, con filtros por equipo/categoría/atributo)  
   \- Monto base  
   \- Vencimiento  
   \- Descripción  
   \- Preview antes de confirmar (lista de cuotas que se van a generar)  
   \- Confirmar → genera N cuotas en fin\_cuotas\_emitidas

6\. Pantalla "Cuenta corriente de persona"  
   Tab en /admin/personas/\[id\] con:  
   \- Saldo actual (resta de cuotas pendientes vs pagos)  
   \- Listado cronológico de cuotas \+ pagos  
   \- Botones: "Generar cuota individual" / "Registrar pago manual"

7\. Pantalla "Resumen de caja"  
   /admin/finanzas/cajas/\[id\] (si no existe el detalle):  
   \- Saldo actual  
   \- Listado de movimientos del último mes  
   \- Filtros por tipo, fecha, concepto

8\. Refactor consolidación  
   \- Buscar en codebase imports de cuotas\_emitidas y reemplazar por fin\_cuotas\_emitidas  
   \- Verificar que server actions de modules/cuotas usan la tabla canónica  
   \- Si hay funciones SQL que insertan en cuotas\_emitidas, actualizar a fin\_cuotas\_emitidas

NO entra:  
\- Conciliación bancaria automática (futura)  
\- Integración real con MercadoPago / Stripe (mock vigente)  
\- Reportes contables formales (FASE D o futuro)  
\- Facturación electrónica AFIP (mock-first hasta FASE C)

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM  
═══════════════════════════════════════════════════════════════════

| \# | Riesgo | Mitigación |  
| \- | \------ | \---------- |  
| S1 | Migración de cuotas\_emitidas a fin\_cuotas\_emitidas puede tener filas con datos divergentes | Antes de migrar, query comparativo: SELECT count(\*) FROM cuotas\_emitidas WHERE id NOT IN (SELECT id FROM fin\_cuotas\_emitidas). Si \> 0, hacer INSERT INTO fin\_cuotas\_emitidas SELECT \* FROM cuotas\_emitidas WHERE id NOT IN... Si 0, está OK. |  
| S2 | Imports de cuotas\_emitidas dispersos en código que no se detectan en grep | Buscar también en función SQL: SELECT proname FROM pg\_proc WHERE prosrc ILIKE '%cuotas\_emitidas%'. Actualizar todas. |  
| S3 | UI de emisión masiva con \> 100 personas puede ser lenta | Paginar la preview, generar en batch SQL con INSERT INTO... SELECT. Mostrar progress. |  
| S4 | Calcular saldo de persona en tiempo real puede ser query pesado | Cachear vía vista materializada en futuro. En este sprint, query directo con índices apropiados. |  
| S5 | Pago manual de cuota duplica si se hace clic dos veces | Botón disabled durante request. Validar que cuota\_id no esté ya en estado 'pagada' antes de aplicar pago. |

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación  
═══════════════════════════════════════════════════════════════════

git describe \--tags \--abbrev=0  \-- esperado v0.27.0-fase-a-sprint-2

\-- Comparar cuotas duplicadas  
SELECT count(\*) FROM cuotas\_emitidas WHERE tenant\_id='11111111-1111-1111-1111-111111111111';  
SELECT count(\*) FROM fin\_cuotas\_emitidas WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

\-- Verificar plan de cuentas  
SELECT EXISTS(SELECT 1 FROM information\_schema.tables WHERE table\_name='fin\_plan\_cuentas');

\-- Estado fin\_movimientos  
SELECT count(\*) FROM fin\_movimientos WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

\-- Funciones SQL que referencian cuotas\_emitidas  
SELECT proname FROM pg\_proc WHERE prosrc ILIKE '%cuotas\_emitidas%';

═══════════════════════════════════════════════════════════════════  
PARTE 2 — Migration  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — Consolidación cuotas  
\-- Migrar datos divergentes (si hay)  
INSERT INTO fin\_cuotas\_emitidas (id, tenant\_id, persona\_id, concepto, monto, vencimiento, estado, created\_at)  
SELECT c.id, c.tenant\_id, c.persona\_id, c.concepto, c.monto, c.vencimiento, c.estado, c.created\_at  
FROM cuotas\_emitidas c  
WHERE c.id NOT IN (SELECT id FROM fin\_cuotas\_emitidas);

\-- Convertir cuotas\_emitidas en vista (deprecada, lectura)  
DROP TABLE IF EXISTS cuotas\_emitidas CASCADE;  
CREATE VIEW cuotas\_emitidas AS SELECT \* FROM fin\_cuotas\_emitidas;  
COMMENT ON VIEW cuotas\_emitidas IS 'DEPRECATED: usar fin\_cuotas\_emitidas directamente. Esta vista se elimina en FASE D.';

\-- 2.2 — Plan de cuentas  
CREATE TABLE IF NOT EXISTS fin\_plan\_cuentas (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  codigo text NOT NULL,  
  nombre text NOT NULL,  
  parent\_id uuid REFERENCES fin\_plan\_cuentas(id),  
  tipo text NOT NULL CHECK (tipo IN ('activo','pasivo','ingreso','egreso','patrimonio')),  
  activo boolean NOT NULL DEFAULT true,  
  orden integer DEFAULT 0,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE UNIQUE INDEX idx\_plan\_cuentas\_codigo\_unique ON fin\_plan\_cuentas(tenant\_id, codigo) WHERE deleted\_at IS NULL;

CREATE TRIGGER trg\_plan\_cuentas\_updated\_at BEFORE UPDATE ON fin\_plan\_cuentas  
  FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

ALTER TABLE fin\_plan\_cuentas ENABLE ROW LEVEL SECURITY;  
CREATE POLICY plan\_cuentas\_tenant ON fin\_plan\_cuentas  
  FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.3 — Seed básico plan de cuentas para Hindu  
INSERT INTO fin\_plan\_cuentas (tenant\_id, codigo, nombre, tipo, orden) VALUES  
  ('11111111-1111-1111-1111-111111111111', '1', 'Activo', 'activo', 10),  
  ('11111111-1111-1111-1111-111111111111', '1.1', 'Caja y Bancos', 'activo', 20),  
  ('11111111-1111-1111-1111-111111111111', '2', 'Pasivo', 'pasivo', 30),  
  ('11111111-1111-1111-1111-111111111111', '4', 'Ingresos', 'ingreso', 40),  
  ('11111111-1111-1111-1111-111111111111', '4.1', 'Cuotas de socios', 'ingreso', 50),  
  ('11111111-1111-1111-1111-111111111111', '5', 'Egresos', 'egreso', 60),  
  ('11111111-1111-1111-1111-111111111111', '5.1', 'Sueldos cuerpo técnico', 'egreso', 70),  
  ('11111111-1111-1111-1111-111111111111', '5.2', 'Mantenimiento de canchas', 'egreso', 80\)  
ON CONFLICT DO NOTHING;

\-- 2.4 — Agregar plan\_cuenta\_id en fin\_movimientos  
ALTER TABLE fin\_movimientos ADD COLUMN IF NOT EXISTS plan\_cuenta\_id uuid REFERENCES fin\_plan\_cuentas(id);

\-- 2.5 — Función fn\_saldo\_persona  
CREATE OR REPLACE FUNCTION fn\_saldo\_persona(p\_persona\_id uuid)  
RETURNS numeric AS $$  
  SELECT COALESCE(  
    (SELECT SUM(monto) FROM fin\_movimientos m  
      WHERE m.persona\_id \= p\_persona\_id AND m.tipo \= 'ingreso' AND m.deleted\_at IS NULL), 0\)  
   \- COALESCE(  
    (SELECT SUM(monto) FROM fin\_cuotas\_emitidas  
      WHERE persona\_id \= p\_persona\_id AND estado IN ('pendiente','vencida') AND deleted\_at IS NULL), 0);  
$$ LANGUAGE sql STABLE;

COMMIT;

═══════════════════════════════════════════════════════════════════  
PARTE 3 — CAPA CÓDIGO  
═══════════════════════════════════════════════════════════════════

modules/finanzas/ (refactor):  
\- Reemplazar todos los imports de cuotas\_emitidas por fin\_cuotas\_emitidas  
\- Agregar lib/actions.ts: nuevoMovimientoAction, nuevaTransferenciaAction  
\- Agregar lib/queries.ts: saldoPersona, resumenCaja, movimientosPorCaja, planDeCuentas

modules/cuotas/ (refactor \+ ampliación):  
\- emitirCuotasMasivasAction (nueva, con preview)  
\- registrarPagoManualAction

Permission slugs:  
\- finanzas.admin (super)  
\- finanzas.editor (crea/edita movimientos)  
\- finanzas.viewer (solo lectura)

═══════════════════════════════════════════════════════════════════  
PARTE 5 — UI  
═══════════════════════════════════════════════════════════════════

5.1 — /admin/finanzas/movimientos/nuevo

Form completo (no modal, página dedicada porque es complejo):

Sección Tipo:  
\- Radio: Ingreso / Egreso / Transferencia

Sección Caja:  
\- Si Transferencia: Caja origen \+ Caja destino  
\- Si Ingreso/Egreso: Caja origen únicamente

Sección Concepto:  
\- Plan de cuentas (autocomplete sobre fin\_plan\_cuentas)  
\- Descripción (text)

Sección Monto:  
\- Monto (number required)  
\- Moneda (default ARS)

Sección Vinculación (opcional):  
\- Persona (autocomplete) o Entidad (autocomplete)  
\- Cuota emitida (autocomplete, solo si tipo=Ingreso, filtrada por persona si está seleccionada)

Sección Adicionales:  
\- Fecha (default hoy)  
\- Comprobante (upload)  
\- Notas

Submit:  
\- Validación Zod  
\- nuevoMovimientoAction (transacción)  
\- Si era pago de cuota: marcar cuota como pagada  
\- Redirect a /admin/finanzas/movimientos con toast

5.2 — /admin/finanzas/transferencias/nueva  
Form simplificado:  
\- Caja origen, caja destino, monto, fecha, descripción  
\- Submit genera 2 movimientos atómicos (uno egreso en caja origen, uno ingreso en caja destino) con tipo='transferencia' y referencia cruzada

5.3 — /admin/finanzas/cuotas/emitir  
Form con steps:

Step 1: Configurar  
\- Concepto (autocomplete catalogo)  
\- Plan de cuenta (autocomplete fin\_plan\_cuentas, tipo=ingreso)  
\- Monto base  
\- Vencimiento  
\- Descripción

Step 2: Destinatarios  
\- Filtros: equipo, categoría, atributo  
\- Tabla con preview de personas seleccionadas  
\- Botón "Aplicar filtros y mostrar N personas"

Step 3: Preview  
\- Tabla con las cuotas que se van a generar (persona, monto, vencimiento)  
\- Botón "Confirmar emisión"

Step 4: Confirmación  
\- Progress bar mientras genera  
\- Toast success con conteo final  
\- Redirect a /admin/finanzas/cuotas

5.4 — /admin/finanzas/plan-de-cuentas

Árbol jerárquico (similar a categorías de productos en A2):  
\+--------------------------------------------------------------+  
| Plan de cuentas                       \[+ Nueva cuenta\]       |  
\+--------------------------------------------------------------+  
| ▼ 1\. Activo                                                  |  
|   ▼ 1.1 Caja y Bancos                                       |  
|     • 1.1.01 Caja Sede Central                              |  
|     • 1.1.02 Cuenta corriente Banco                         |  
| ▼ 4\. Ingresos                                                |  
|   • 4.1 Cuotas de socios                                    |  
| ▼ 5\. Egresos                                                 |  
|   • 5.1 Sueldos                                              |  
\+--------------------------------------------------------------+

5.5 — Tab "Cuenta corriente" en /admin/personas/\[id\]

Card resumen:  
\+--------------------------------------------------------------+  
| Saldo actual: $25.500 (a favor)                              |  
| Cuotas pendientes: $15.000 (3 cuotas)                        |  
| Última actividad: hace 2 días                                |  
\+--------------------------------------------------------------+

Listado cronológico (combinado cuotas \+ pagos):  
| Fecha | Tipo | Concepto | Monto | Estado |

Botones:  
\- \[+Generar cuota individual\]  
\- \[+Registrar pago manual\]

5.6 — Detalle de caja /admin/finanzas/cajas/\[id\]

\+--------------------------------------------------------------+  
| Caja Sede Central                                            |  
| Saldo: $1.245.300                       \[+Movimiento\]        |  
\+--------------------------------------------------------------+  
| Filtros: \[Fecha ▼\] \[Tipo ▼\] \[Concepto ▼\]                    |  
\+--------------------------------------------------------------+  
| Tabla de movimientos                                         |  
\+--------------------------------------------------------------+

═══════════════════════════════════════════════════════════════════  
PARTE 6, 7, 8 — Estilos, Galería, Sidebar  
═══════════════════════════════════════════════════════════════════

DESIGN-SYSTEM v2.  
Iconos: DollarSign (movimientos), ArrowRightLeft (transferencias), Receipt (cuotas), TreePine (plan cuentas).  
Screenshots de las 5 pantallas nuevas.  
Sidebar: items de finanzas actualizados (todos los sub-items ahora navegan).

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target \+5)  
═══════════════════════════════════════════════════════════════════

Test 1: Movimiento de ingreso vinculado a persona  
\- Crear caja test, persona test, plan\_cuenta test (fixture)  
\- Navegar a /admin/finanzas/movimientos/nuevo  
\- Crear ingreso $1000 vinculado a persona  
\- Assert: fin\_movimientos \+1 fila, persona saldo \+$1000  
\- Cleanup

Test 2: Transferencia entre cajas  
\- Crear caja A (saldo $0) y caja B ($0)  
\- Transferir $500 de A a B  
\- Assert: caja A balance \-$500, caja B balance \+$500  
\- Assert: fin\_movimientos \+2 filas (egreso \+ ingreso) con misma referencia  
\- Cleanup

Test 3: Emisión masiva de cuotas  
\- Crear 5 personas fixture en un equipo  
\- Navegar a /admin/finanzas/cuotas/emitir  
\- Configurar cuota $500 a todo el equipo  
\- Confirmar  
\- Assert: 5 cuotas en fin\_cuotas\_emitidas  
\- Cleanup

Test 4: Pago manual de cuota  
\- Crear cuota pendiente fixture  
\- Navegar a tab cuenta corriente de la persona  
\- Click "Registrar pago manual"  
\- Confirmar  
\- Assert: cuota estado=pagada, fin\_movimientos \+1 (ingreso)  
\- Cleanup

Test 5: Plan de cuentas CRUD  
\- Crear cuenta padre "Test Egresos"  
\- Crear cuenta hija "Test 5.1 Marketing"  
\- Assert: árbol correcto  
\- Intentar borrar padre con hijo → assert error  
\- Cleanup

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Cierre  
═══════════════════════════════════════════════════════════════════

10.1 docs vivos:  
\- CURRENT-STATE: A3 cerrado, \+1 tabla (fin\_plan\_cuentas), 1 vista deprecada  
\- SPRINT-PLAN: A3 DONE  
\- DATA-MODEL: fin\_plan\_cuentas \+ cambio cuotas\_emitidas → vista  
\- DECISIONS: ADR-047 (canon fin\_cuotas\_emitidas, cuotas\_emitidas deprecada)  
\- MODULE-CATALOG: finanzas pasa a Productivo

10.2 commit feat(finanzas): plan de cuentas \+ movimientos/transferencias/cuotas UI \+ consolidación cuotas (Sprint A3)  
10.3 commit docs  
10.4 tag v0.27.0-fase-a-sprint-3  
10.5 cierre Drive  
10.6 screenshots  
10.7 reporte

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

1\. Pre-mortem reportado  
2\. Verificación PARTE 1 ejecutada  
3\. Migration aplicada (consolidación \+ plan de cuentas)  
4\. Tabla cuotas\_emitidas convertida en vista deprecada (sin pérdida de datos)  
5\. Plan de cuentas seedeado  
6\. 3 páginas que daban 404 ahora tienen UI completa (no solo placeholder)  
7\. Tab cuenta corriente funcional en /admin/personas/\[id\]  
8\. Detalle de caja funcional  
9\. Función fn\_saldo\_persona creada  
10\. \+5 E2E pasando  
11\. Tag v0.27.0-fase-a-sprint-3 aplicado  
12\. ADR-047 documentado

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS  
═══════════════════════════════════════════════════════════════════

1\. CERO pérdida de datos en migración cuotas  
2\. trg\_set\_updated\_at (no set\_updated\_at)  
3\. Soft-delete vía deleted\_at  
4\. Mock-first vigente (no pasarela de pago real)  
5\. Si excede 11h Code, parar y escalar

COMMIT: feat(finanzas): plan de cuentas \+ páginas críticas \+ consolidación cuotas (Sprint A3)  
TAG: v0.27.0-fase-a-sprint-3

Fin Sprint A3.  
