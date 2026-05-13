SPRINT A2 — PIM Nivel 1 (Catálogo de Productos)  
\====================================================

Version del prompt: 1.0  
Fecha: 13 de mayo de 2026  
Path esperado en repo: docs/sprints/A2-pim-nivel-1.md  
Formato canónico: docs/PROMPT-TEMPLATE.md (18 bloques A-R)

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO — LEER ANTES DE EMPEZAR  
═══════════════════════════════════════════════════════════════════

Leer EN ESTE ORDEN:

1\. /CLAUDE.md (si existe)  
2\. /docs/CURRENT-STATE.md (esperado: Sprint A1 cerrado, tag v0.27.0-fase-a-sprint-1)  
3\. /docs/SPRINT-PLAN.md (A2 es el próximo)  
4\. /docs/rfcs/RFC-004 (D5 PIM 3 niveles)  
5\. /docs/DECISIONS.md (ADR-042 PIM 3 niveles, ADR-046 v\_productos\_catalogo)  
6\. /docs/MODULE-CATALOG.md (PIM N1 troncal, PIM N2 y N3 cross-vertical)  
7\. /docs/ARCHITECTURE.md \+ ARCHITECTURE-ADDENDUM  
8\. /docs/DESIGN-SYSTEM.md \+ /docs/UI-UX-PATTERNS.md  
9\. /docs/PROMPT-TEMPLATE.md  
10\. modules/utileria/ (referencia: schema existente de items que se va a generalizar)  
11\. modules/concesiones/ (referencia: productos POS existentes)

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA  
═══════════════════════════════════════════════════════════════════

\[x\] CAPA BD: tabla productos, productos\_variantes, producto\_categorias, producto\_categoria\_links, vista v\_productos\_catalogo  
\[x\] CAPA CÓDIGO: módulo pim (modules/pim/)  
\[x\] CAPA UI/UX: pantallas /admin/productos, /admin/productos/\[id\], /admin/productos/categorias  
\[x\] CAPA ESTILOS: DESIGN-SYSTEM v2 aplicado  
\[x\] CAPA GALERÍA: screenshots pantallas nuevas

Decisiones técnicas:  
\- ADR-042 PIM 3 niveles: este sprint construye Nivel 1 (catálogo \+ variantes \+ categorías \+ precio base \+ stock simple)  
\- ADR-046 v\_productos\_catalogo: vista puente que une productos del PIM con items de utileria \+ concesion\_productos para query unificado  
\- Sin pricing avanzado (Nivel 2 → Sprint D3)  
\- Sin movimientos de stock (Nivel 3 → Sprint D4)

═══════════════════════════════════════════════════════════════════  
SPRINT A2 — PIM Nivel 1  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
Al cierre, Yair puede:  
\- Crear, editar, borrar productos/servicios (físicos o intangibles)  
\- Asociar variantes a un producto (color, talle, etc.)  
\- Organizar productos en categorías jerárquicas (Padre → Hijos)  
\- Asignar un precio base único por producto  
\- Asignar stock simple inicial (campo numérico, sin movimientos)  
\- Consultar la vista v\_productos\_catalogo que unifica utileria \+ concesion\_productos \+ productos PIM

ALCANCE

SÍ entra:

1\. Tabla productos (nueva)  
   Columnas:  
   \- id, tenant\_id, sku, nombre, descripcion, tipo (enum: producto / servicio)  
   \- precio\_base\_ars, precio\_base\_usd (numeric, nullable)  
   \- stock\_simple (numeric, nullable, solo si tipo=producto)  
   \- unidad\_medida\_slug (FK a catalogo\_unidades\_medida)  
   \- imagen\_url (text, opcional, signed URL de Supabase Storage)  
   \- activo boolean  
   \- metadata jsonb  
   \- created\_at, updated\_at, deleted\_at

2\. Tabla productos\_variantes (nueva)  
   \- id, producto\_id (FK), sku\_variante, nombre\_variante (ej. "Rojo M")  
   \- precio\_diferencial (numeric, nullable; null \= usa precio del producto)  
   \- stock\_simple\_variante (numeric, nullable)  
   \- atributos jsonb (ej. {"color":"rojo","talle":"M"})  
   \- activo, created\_at, updated\_at, deleted\_at

3\. Tabla producto\_categorias (nueva, jerárquica)  
   \- id, tenant\_id, nombre, slug, parent\_id (FK self), orden, descripcion, activo

4\. Tabla producto\_categoria\_links (N:M)  
   \- producto\_id, categoria\_id (composite PK)

5\. Catálogo catalogo\_unidades\_medida (si no existe)  
   Seed: unidad, kg, g, l, ml, m, m2, m3, hora, dia, mes, sesion, clase, etc.

6\. Vista v\_productos\_catalogo (ADR-046)  
   Une productos (PIM N1) \+ utileria\_items \+ concesion\_productos para query unificado vía esquema común.

7\. Módulo modules/pim/  
   \- lib/actions.ts: CRUD productos, variantes, categorías  
   \- lib/queries.ts: listarProductos con filtros, productoPorId, listarCategoriasJerarquicas  
   \- lib/permisos.ts: dot-notation pim.admin  
   \- lib/tipos.ts  
   \- ui/producto-form.tsx, producto-row.tsx, variante-form.tsx, categoria-tree.tsx

8\. Pantallas:  
   \- /admin/productos (listado con filtros por categoría, tipo, activo)  
   \- /admin/productos/\[id\] (detalle con tabs: Info / Variantes / Categorías / Imágenes)  
   \- /admin/productos/categorias (vista de árbol de categorías)  
   \- Modal "+Nuevo producto"  
   \- Modal "+Nueva variante"  
   \- Modal "+Nueva categoría" con parent selector  
   \- Upload de imagen vía Supabase Storage

9\. Sidebar: ítem "Productos" en sección Troncal (placeholder del A1 ahora apunta a pantalla real)

NO entra:  
\- Pricing avanzado (Sprint D3)  
\- Stock por ubicación, movimientos, lotes, series (Sprint D4)  
\- Importador de productos vía CSV (Sprint A4 hace importadores universales)  
\- POS / venta de productos (módulo existente, NO se toca acá)  
\- Inventario / utilería avanzada (módulos existentes; ADR-046 los une via vista)

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM  
═══════════════════════════════════════════════════════════════════

Mínimo 5 riesgos:

| \# | Riesgo | Mitigación |  
| \- | \------ | \---------- |  
| S1 | SKU único colisiona con SKUs existentes de utileria/concesiones | Verificar UNIQUE solo dentro de productos (no global). v\_productos\_catalogo gestiona los duplicados con prefijo de origen. |  
| S2 | Stock\_simple puede confundirse con stock de utileria (que ya existe) | El campo es opcional. La vista v\_productos\_catalogo deja claro qué fuente tiene autoridad. Doc en GLOSSARY: "stock\_simple es snapshot, no movimientos". |  
| S3 | Imágenes pueden alcanzar el límite de 5MB del bucket | Validación cliente antes de upload. Si supera, mensaje claro. |  
| S4 | Categorías jerárquicas pueden crear ciclos si no se valida parent\_id | Trigger PG que valida que parent\_id \!= id y que el nuevo parent\_id no esté en la cadena de descendientes. |  
| S5 | Variantes con atributos jsonb pueden hacer queries lentas | Índice GIN en atributos. Solo si en el futuro se necesita filtrar por atributos, se evalúa promover a columnas. |

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación inicial  
═══════════════════════════════════════════════════════════════════

git describe \--tags \--abbrev=0  \-- esperado: v0.27.0-fase-a-sprint-1

\-- Verificar que A1 cerró bien  
SELECT COUNT(\*) FROM espacios;  \-- debería ser \>= 1 (E2E creó al menos uno)  
SELECT capa FROM catalogo\_modulos WHERE slug='pim';  \-- esperado: troncal

\-- Verificar que productos NO existe  
SELECT EXISTS(  
  SELECT 1 FROM information\_schema.tables   
  WHERE table\_schema='public' AND table\_name='productos'  
);

\-- Estado de utileria y concesion\_productos (no se tocan, pero se referencian en la vista)  
SELECT COUNT(\*) FROM utileria\_items WHERE tenant\_id='11111111-1111-1111-1111-111111111111';  
SELECT COUNT(\*) FROM concesion\_productos WHERE tenant\_id='11111111-1111-1111-1111-111111111111';

Reportar.

═══════════════════════════════════════════════════════════════════  
PARTE 2 — Migration  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — catalogo\_unidades\_medida  
CREATE TABLE IF NOT EXISTS catalogo\_unidades\_medida (  
  slug text PRIMARY KEY,  
  nombre text NOT NULL,  
  abreviatura text,  
  tipo text NOT NULL CHECK (tipo IN ('cantidad','peso','volumen','longitud','superficie','volumen3d','tiempo','servicio')),  
  activo boolean NOT NULL DEFAULT true,  
  orden integer  
);

INSERT INTO catalogo\_unidades\_medida (slug, nombre, abreviatura, tipo) VALUES  
  ('unidad','Unidad','u','cantidad'),  
  ('kg','Kilogramo','kg','peso'),  
  ('g','Gramo','g','peso'),  
  ('l','Litro','l','volumen'),  
  ('ml','Mililitro','ml','volumen'),  
  ('m','Metro','m','longitud'),  
  ('m2','Metro cuadrado','m²','superficie'),  
  ('m3','Metro cúbico','m³','volumen3d'),  
  ('hora','Hora','h','tiempo'),  
  ('dia','Día','d','tiempo'),  
  ('mes','Mes','mes','tiempo'),  
  ('sesion','Sesión','sesión','servicio'),  
  ('clase','Clase','clase','servicio'),  
  ('paquete','Paquete','pq','cantidad'),  
  ('caja','Caja','caja','cantidad')  
ON CONFLICT (slug) DO NOTHING;

\-- 2.2 — productos  
CREATE TABLE IF NOT EXISTS productos (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  sku text,  
  nombre text NOT NULL,  
  descripcion text,  
  tipo text NOT NULL DEFAULT 'producto' CHECK (tipo IN ('producto','servicio')),  
  precio\_base\_ars numeric CHECK (precio\_base\_ars IS NULL OR precio\_base\_ars \>= 0),  
  precio\_base\_usd numeric CHECK (precio\_base\_usd IS NULL OR precio\_base\_usd \>= 0),  
  stock\_simple numeric CHECK (stock\_simple IS NULL OR stock\_simple \>= 0),  
  unidad\_medida\_slug text REFERENCES catalogo\_unidades\_medida(slug),  
  imagen\_url text,  
  activo boolean NOT NULL DEFAULT true,  
  metadata jsonb DEFAULT '{}'::jsonb,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE UNIQUE INDEX idx\_productos\_sku\_unique ON productos(tenant\_id, sku) WHERE sku IS NOT NULL AND deleted\_at IS NULL;  
CREATE INDEX idx\_productos\_tenant\_activo ON productos(tenant\_id, activo) WHERE deleted\_at IS NULL;  
CREATE INDEX idx\_productos\_tipo ON productos(tenant\_id, tipo) WHERE deleted\_at IS NULL;

CREATE TRIGGER trg\_productos\_updated\_at BEFORE UPDATE ON productos  
  FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;  
CREATE POLICY productos\_tenant\_isolation ON productos  
  FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.3 — productos\_variantes  
CREATE TABLE IF NOT EXISTS productos\_variantes (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  producto\_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,  
  sku\_variante text,  
  nombre\_variante text NOT NULL,  
  precio\_diferencial\_ars numeric,  
  precio\_diferencial\_usd numeric,  
  stock\_simple\_variante numeric CHECK (stock\_simple\_variante IS NULL OR stock\_simple\_variante \>= 0),  
  atributos jsonb DEFAULT '{}'::jsonb,  
  imagen\_url text,  
  activo boolean NOT NULL DEFAULT true,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE UNIQUE INDEX idx\_variantes\_sku\_unique ON productos\_variantes(producto\_id, sku\_variante) WHERE sku\_variante IS NOT NULL AND deleted\_at IS NULL;  
CREATE INDEX idx\_variantes\_atributos\_gin ON productos\_variantes USING gin(atributos);

CREATE TRIGGER trg\_variantes\_updated\_at BEFORE UPDATE ON productos\_variantes  
  FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

ALTER TABLE productos\_variantes ENABLE ROW LEVEL SECURITY;  
CREATE POLICY variantes\_via\_producto ON productos\_variantes  
  FOR ALL USING (  
    producto\_id IN (SELECT id FROM productos WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
  );

\-- 2.4 — producto\_categorias  
CREATE TABLE IF NOT EXISTS producto\_categorias (  
  id uuid PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  tenant\_id uuid NOT NULL REFERENCES tenants(id),  
  nombre text NOT NULL,  
  slug text NOT NULL,  
  parent\_id uuid REFERENCES producto\_categorias(id),  
  orden integer DEFAULT 0,  
  descripcion text,  
  activo boolean NOT NULL DEFAULT true,  
  created\_at timestamptz NOT NULL DEFAULT now(),  
  updated\_at timestamptz NOT NULL DEFAULT now(),  
  deleted\_at timestamptz  
);

CREATE UNIQUE INDEX idx\_categorias\_slug\_unique ON producto\_categorias(tenant\_id, slug) WHERE deleted\_at IS NULL;  
CREATE INDEX idx\_categorias\_parent ON producto\_categorias(parent\_id) WHERE parent\_id IS NOT NULL;

CREATE TRIGGER trg\_categorias\_updated\_at BEFORE UPDATE ON producto\_categorias  
  FOR EACH ROW EXECUTE FUNCTION trg\_set\_updated\_at();

\-- Trigger anti-ciclo  
CREATE OR REPLACE FUNCTION trg\_categorias\_no\_ciclo() RETURNS trigger AS $$  
DECLARE  
  current\_id uuid := NEW.parent\_id;  
  depth integer := 0;  
BEGIN  
  IF NEW.parent\_id IS NULL THEN RETURN NEW; END IF;  
  IF NEW.parent\_id \= NEW.id THEN  
    RAISE EXCEPTION 'Una categoría no puede ser su propio padre';  
  END IF;  
  WHILE current\_id IS NOT NULL AND depth \< 50 LOOP  
    IF current\_id \= NEW.id THEN  
      RAISE EXCEPTION 'Se detectó un ciclo en la jerarquía de categorías';  
    END IF;  
    SELECT parent\_id INTO current\_id FROM producto\_categorias WHERE id \= current\_id;  
    depth := depth \+ 1;  
  END LOOP;  
  RETURN NEW;  
END;  
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg\_categorias\_no\_ciclo\_check  
  BEFORE INSERT OR UPDATE ON producto\_categorias  
  FOR EACH ROW EXECUTE FUNCTION trg\_categorias\_no\_ciclo();

ALTER TABLE producto\_categorias ENABLE ROW LEVEL SECURITY;  
CREATE POLICY categorias\_tenant\_isolation ON producto\_categorias  
  FOR ALL USING (tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid);

\-- 2.5 — producto\_categoria\_links  
CREATE TABLE IF NOT EXISTS producto\_categoria\_links (  
  producto\_id uuid NOT NULL REFERENCES productos(id) ON DELETE CASCADE,  
  categoria\_id uuid NOT NULL REFERENCES producto\_categorias(id) ON DELETE CASCADE,  
  PRIMARY KEY (producto\_id, categoria\_id)  
);

ALTER TABLE producto\_categoria\_links ENABLE ROW LEVEL SECURITY;  
CREATE POLICY links\_via\_producto ON producto\_categoria\_links  
  FOR ALL USING (  
    producto\_id IN (SELECT id FROM productos WHERE tenant\_id \= current\_setting('app.current\_tenant\_id', true)::uuid)  
  );

\-- 2.6 — Vista v\_productos\_catalogo (ADR-046, puente)  
CREATE OR REPLACE VIEW v\_productos\_catalogo AS  
SELECT   
  'pim'::text AS origen,  
  p.id AS id\_origen,  
  p.tenant\_id,  
  p.sku,  
  p.nombre,  
  p.descripcion,  
  p.tipo,  
  p.precio\_base\_ars AS precio\_ars,  
  p.stock\_simple AS stock,  
  p.unidad\_medida\_slug,  
  p.imagen\_url,  
  p.activo,  
  p.created\_at  
FROM productos p  
WHERE p.deleted\_at IS NULL

UNION ALL

SELECT   
  'utileria'::text,  
  u.id,  
  u.tenant\_id,  
  u.codigo AS sku,  
  u.nombre,  
  u.descripcion,  
  'producto'::text AS tipo,  
  NULL::numeric AS precio\_ars,  
  u.stock\_actual::numeric AS stock,  
  'unidad'::text AS unidad\_medida\_slug,  
  NULL::text AS imagen\_url,  
  u.activo,  
  u.created\_at  
FROM utileria\_items u  
WHERE u.deleted\_at IS NULL

UNION ALL

SELECT   
  'concesion'::text,  
  c.id,  
  c.tenant\_id,  
  c.codigo AS sku,  
  c.nombre,  
  c.descripcion,  
  'producto'::text AS tipo,  
  c.precio\_venta\_ars AS precio\_ars,  
  c.stock\_actual::numeric AS stock,  
  'unidad'::text AS unidad\_medida\_slug,  
  NULL::text AS imagen\_url,  
  c.activo,  
  c.created\_at  
FROM concesion\_productos c  
WHERE c.deleted\_at IS NULL;

\-- 2.7 — Estado del módulo pim  
UPDATE catalogo\_modulos SET capa='troncal' WHERE slug='pim';

COMMIT;

═══════════════════════════════════════════════════════════════════  
PARTE 3 — CAPA CÓDIGO: Módulo pim  
═══════════════════════════════════════════════════════════════════

modules/pim/  
├── module.json  
├── lib/  
│   ├── actions.ts              \-- crear/editar/eliminar productos, variantes, categorías  
│   ├── queries.ts              \-- listarProductos, productoPorId, categoriaJerarquia  
│   ├── permisos.ts             \-- pim.admin, pim.editor, pim.viewer  
│   └── tipos.ts  
└── ui/  
    ├── producto-form.tsx  
    ├── producto-row.tsx  
    ├── variante-form.tsx  
    ├── variante-row.tsx  
    ├── categoria-tree.tsx  
    ├── categoria-form.tsx  
    └── upload-imagen-producto.tsx

Reglas:  
\- Server actions, no endpoints  
\- Validación Zod (ej. precio \>= 0, sku format)  
\- Soft-delete vía deleted\_at

═══════════════════════════════════════════════════════════════════  
PARTE 4 — Integraciones  
═══════════════════════════════════════════════════════════════════

\- Supabase Storage para imágenes: bucket existente private-fotos-personales NO, crear nuevo private-productos-imagenes (5MB max).  
\- No tocar utileria ni concesiones en este sprint, solo se referencian vía la vista.

═══════════════════════════════════════════════════════════════════  
PARTE 5 — UI/UX  
═══════════════════════════════════════════════════════════════════

5.1 — /admin/productos (listado)

\+--------------------------------------------------------------+  
| Productos                              \[+ Nuevo producto\]    |  
\+--------------------------------------------------------------+  
| Toolbar: \[Buscar...\] \[Categoría ▼\] \[Tipo: Todos ▼\] \[Activos ▼\] |  
\+--------------------------------------------------------------+  
| Tabla:                                                       |  
|  \[img\] | SKU    | Nombre        | Tipo     | Precio | Stock | Acciones |  
\+--------------------------------------------------------------+

Modal \+Nuevo producto:  
\- SKU (text, opcional)  
\- Nombre (required)  
\- Tipo (radio: Producto / Servicio)  
\- Precio ARS (number)  
\- Precio USD (number)  
\- Stock inicial (solo si tipo=Producto, number)  
\- Unidad de medida (select)  
\- Categorías (multiselect)  
\- Imagen (upload)  
\- Descripción (textarea)

5.2 — /admin/productos/\[id\] (detalle)

Tabs: Info | Variantes | Categorías | Imágenes

\- Tab Info: campos editables, botones Guardar / Eliminar  
\- Tab Variantes: tabla de variantes con CRUD inline o modal  
\- Tab Categorías: multiselect con jerarquía visible (indentada)  
\- Tab Imágenes: galería con upload \+ reorder

5.3 — /admin/productos/categorias (árbol)

\+--------------------------------------------------------------+  
| Categorías de productos               \[+ Nueva categoría\]    |  
\+--------------------------------------------------------------+  
| ▼ Indumentaria                                  \[Editar\] \[...\]|  
|   ▼ Remeras                                    \[Editar\] \[...\]|  
|     • Equipo titular                           \[Editar\] \[...\]|  
|     • Equipo suplente                          \[Editar\] \[...\]|  
|   ▼ Pantalones                                 \[Editar\] \[...\]|  
| ▼ Servicios                                    \[Editar\] \[...\]|  
|   • Clase particular                           \[Editar\] \[...\]|  
\+--------------------------------------------------------------+

Modal \+Nueva categoría:  
\- Nombre (required)  
\- Parent (select de categorías existentes, opcional → si vacío es raíz)  
\- Slug (auto-generado del nombre, editable)  
\- Descripción

5.4 — data-testids

\- pantalla-productos, btn-nuevo-producto, btn-nueva-categoria  
\- producto-row-{sku}, modal-producto, input-sku, input-nombre-producto  
\- tab-info, tab-variantes, tab-categorias, tab-imagenes  
\- categoria-tree-node-{slug}

═══════════════════════════════════════════════════════════════════  
PARTE 6 — Estilos  
═══════════════════════════════════════════════════════════════════

DESIGN-SYSTEM v2 estándar.  
Iconos: Package (producto), Tag (categoría), Layers (variantes), Image (imágenes).

═══════════════════════════════════════════════════════════════════  
PARTE 7 — Gallery  
═══════════════════════════════════════════════════════════════════

Screenshots:  
\- /admin/productos (empty \+ con data)  
\- /admin/productos/\[id\] (cada tab)  
\- /admin/productos/categorias (árbol expandido)  
\- Modal \+Nuevo producto  
\- Modal \+Nueva variante

Subir a \`\_Cierre Ejecutivo/sprint-a2/screenshots/\`. Actualizar VISUAL-GALLERY.

═══════════════════════════════════════════════════════════════════  
PARTE 8 — Sidebar  
═══════════════════════════════════════════════════════════════════

Item "Productos" en sección Troncal del sidebar pasa de placeholder a link activo a /admin/productos.

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target \+5)  
═══════════════════════════════════════════════════════════════════

Test 1: Crear producto con variantes  
\- Crear producto "Camiseta Test"  
\- Agregar 3 variantes (Rojo M, Rojo L, Azul M)  
\- Assert: 3 variantes en DB  
\- Cleanup

Test 2: Crear categoría jerárquica  
\- Crear categoría "Indumentaria"  
\- Crear subcategoría "Remeras" con parent=Indumentaria  
\- Assert: árbol correcto  
\- Intentar crear ciclo (Indumentaria parent=Remeras) → assert error  
\- Cleanup

Test 3: Asignar categoría a producto  
\- Crear producto y categoría  
\- Asignar producto a categoría via multiselect  
\- Assert: link en producto\_categoria\_links  
\- Cleanup

Test 4: Upload de imagen  
\- Crear producto  
\- Upload imagen 1MB  
\- Assert: imagen\_url poblada, archivo en storage  
\- Cleanup (borrar archivo del storage)

Test 5: Vista v\_productos\_catalogo unifica fuentes  
\- Crear 1 producto en productos, ya hay items en utileria\_items (verificar query base)  
\- Query SELECT origen, count(\*) FROM v\_productos\_catalogo WHERE tenant\_id=... GROUP BY origen  
\- Assert: al menos 'pim' aparece

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Cierre  
═══════════════════════════════════════════════════════════════════

10.1 — Docs vivos:  
\- CURRENT-STATE: A2 cerrado, métricas DB \+5 tablas, 1 vista, 1 catálogo  
\- SPRINT-PLAN: A2 DONE  
\- DATA-MODEL: agregar productos, productos\_variantes, producto\_categorias, producto\_categoria\_links, catalogo\_unidades\_medida, v\_productos\_catalogo  
\- MODULE-CATALOG: pim pasa a Productivo  
\- VISUAL-GALLERY: paths nuevos

10.2 commit feat(pim): catalogo productos \+ variantes \+ categorías (Sprint A2)  
10.3 commit docs  
10.4 tag v0.27.0-fase-a-sprint-2  
10.5 cierre en Drive  
10.6 screenshots  
10.7 reporte

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

1\. ✅ Pre-mortem reportado  
2\. ✅ Verificación PARTE 1 ejecutada  
3\. ✅ Migration aplicada  
4\. ✅ 5 tablas nuevas \+ 1 vista creadas con RLS  
5\. ✅ Trigger anti-ciclo en categorías funcional  
6\. ✅ Bucket private-productos-imagenes creado  
7\. ✅ Módulo pim creado  
8\. ✅ 3 pantallas funcionales  
9\. ✅ \+5 E2E pasando  
10\. ✅ Tag aplicado  
11\. ✅ Docs actualizados  
12\. ✅ Cierre ejecutivo  
13\. ✅ Reporte al arquitecto

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS  
═══════════════════════════════════════════════════════════════════

1\. Mock-first vigente  
2\. Soft-delete deleted\_at  
3\. trg\_set\_updated\_at (no set\_updated\_at)  
4\. Vista v\_productos\_catalogo NO se materializa en este sprint (solo vista virtual)  
5\. NO tocar tablas utileria\_items ni concesion\_productos (solo referencia vía vista)  
6\. NO construir pricing avanzado (Sprint D3)  
7\. NO construir movimientos de stock (Sprint D4)  
8\. Si excede 9h Code, parar y escalar

COMMIT: feat(pim): catalogo productos \+ variantes \+ categorías \+ vista puente (Sprint A2)  
TAG: v0.27.0-fase-a-sprint-2

Fin Sprint A2.  
