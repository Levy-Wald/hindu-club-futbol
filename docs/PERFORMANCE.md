# ClubCore — Performance

> Objetivos numéricos, restricciones técnicas y patrones de optimización.
>
> **Hardware target: Android baja gama (4GB RAM, Snapdragon 4xx o
> equivalente, 4G inestable argentino).** Cada decisión técnica se mide
> contra ese contexto, no contra una MacBook Pro en fibra.
>
> Mantenido por el arquitecto.
>
> Última actualización: 10 de mayo de 2026.

---

## 1. Filosofía

### 1.1 Performance es una feature

No es optimización post-mortem. Es decisión arquitectónica desde el inicio
de cada sprint. Una feature que funciona pero es lenta en Android baja
gama, **no está terminada**.

### 1.2 Contra qué medimos

| Dispositivo de referencia | Ejemplo |
|---|---|
| **Mobile baja gama (primario)** | Moto E o Samsung A1x, 4GB RAM, Chrome Android, 4G slow (4 Mbps, 400ms RTT) |
| **Mobile gama media** | Samsung A3x, iPhone SE 2da gen, 4G normal |
| **Desktop estándar** | Laptop i5 / M1, fibra 50Mbps |

Si pasa en gama baja, pasa en todo. Validar SIEMPRE en baja gama antes de
cerrar feature.

### 1.3 El usuario percibe latencia, no benchmarks

Las decisiones se miden por **experiencia percibida**, no por números
internos. Skeleton inmediato > spinner perfecto. Página que carga "lo
importante" en 2s > página que carga todo en 4s.

---

## 2. Objetivos numéricos

### 2.1 Web Vitals (Lighthouse mobile, throttled 4G)

| Métrica | Bueno | Aceptable | Inaceptable | Crítico |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s | Sí |
| **FID / INP** (interactividad) | < 200ms | 200-500ms | > 500ms | Sí |
| **CLS** (Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 | Sí |
| **TTFB** (Time to First Byte) | < 600ms | 600-1500ms | > 1500ms | Medio |
| **FCP** (First Contentful Paint) | < 1.8s | 1.8-3s | > 3s | Medio |

### 2.2 Lighthouse score mínimo aceptable

| Categoría | Mobile | Desktop |
|---|---|---|
| Performance | **80+** | **90+** |
| Accessibility | **95+** | **95+** |
| Best Practices | **95+** | **100** |
| SEO | **90+** | **90+** |

Si baja de esos números en main, se considera regresión y se prioriza.

### 2.3 Operaciones específicas

| Operación | Objetivo (baja gama 4G) |
|---|---|
| Page load fría (HTML + JS crítico) | < 3.5s |
| Page load tibia (caché HTTP) | < 1.5s |
| Navegación entre páginas (RSC) | < 800ms |
| Búsqueda en tabla (200 rows local) | < 200ms |
| Filter aplicado | < 300ms |
| Submit de form | < 1s round-trip |
| Match fuzzy de 200 filas | < 5s (operación batch, no UI block) |
| Apply de run con 200 filas | < 30s con progress bar |
| Generación de export XLSX (500 rows) | < 5s |
| Generación de PDF con membrete | < 8s |

### 2.4 Bundle budget (target baja gama)

| Bundle | Tamaño máx gzipped |
|---|---|
| JS inicial (por página) | **250 KB** |
| CSS inicial | 30 KB |
| JS total cargado en sesión típica | 700 KB |
| Imagen hero | 100 KB |
| Logo del tenant | 50 KB |
| Fonts custom | 0 (usar sistema) |

Auditar con `next build` analyzer cada release crítica.

---

## 3. Frontend — Reglas de performance

### 3.1 Server vs Client components

**Preferir Server Components (RSC) por default.** Solo usar Client
Component (`'use client'`) cuando:
- Necesita estado local (`useState`)
- Necesita efectos (`useEffect`)
- Usa hooks de Next.js cliente (`useRouter`, `usePathname`)
- Tiene interactividad directa (onClick, onChange en formularios)
- Usa librerías que requieren DOM (chart.js, plotly, etc.)

Server Components no envían JS al cliente. Cada client component que se
agrega es overhead permanente.

### 3.2 Code splitting

- Páginas se dividen automáticamente por Next.js.
- **Componentes pesados** (modales, charts, editores): cargar con
  `next/dynamic`:

```tsx
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false  // solo si el componente requiere DOM
});
```

- **Librerías pesadas** (Recharts, ExcelJS, react-pdf): lazy load
  donde se usan, no en el bundle principal.

### 3.3 Imágenes

**Obligatorio:**
- Usar `next/image` siempre. Nunca `<img>` directo.
- `loading="lazy"` por default excepto en LCP.
- Formato WebP automático vía Next.js.
- `srcset` automático por device.

**Para logos de tenants:**
- Subir como PNG con fondo transparente, max 500KB.
- Next.js sirve WebP optimizado.
- Dimensiones máx renderizadas: 256x256 (logo grande), 32x32 (favicon).

**Para fotos de personas:**
- Comprimir al subir, max 1MB original.
- Renderizar a 200x200 max en avatares.
- Placeholder blur mientras carga.

### 3.4 Fuentes

**Default: sistema.** No cargar Google Fonts ni custom fonts para admin.
Performance + privacidad + cero requests externos.

Si un tenant requiere font custom para landing pública:
- Self-hosted en `/public/fonts/`
- `font-display: swap`
- `preload` solo la weight usada en LCP

### 3.5 Iconos

- Solo Lucide React (`lucide-react`).
- **Tree shaking obligatorio.** Importar individual:

```tsx
// CORRECTO
import { Pencil } from 'lucide-react';

// PROHIBIDO (carga el set completo)
import * as Icons from 'lucide-react';
```

### 3.6 CSS

- Tailwind 4 con purge automático.
- **Sin CSS-in-JS runtime** (styled-components, emotion). Genera CSS en
  build, no en runtime.
- Sin animaciones decorativas (§3.7).

### 3.7 Animaciones

- Solo `transform` y `opacity` (compositor-only, no reflow).
- Duración máxima por animación: 300ms.
- Respetar `prefers-reduced-motion: reduce`.
- Sin librerías de animación pesadas (Framer Motion completo). Si hace
  falta, usar primitivas CSS.

### 3.8 Tablas grandes (virtualización)

**Obligatorio virtualizar si:**
- Tabla tiene > 50 filas en pantalla.
- Tabla tiene > 8 columnas.
- Total de items > 200.

Usar `@tanstack/react-virtual` o equivalente. Mantener altura fija por
fila (más rápido).

### 3.9 Skeleton loaders

Mostrar skeleton inmediatamente al cargar página, antes que datos
lleguen. Usuario percibe velocidad aunque el server tarde.

Patrón:
- Skeleton del header → 100ms
- Skeleton del listado → 200ms
- Datos reales → 800-1500ms

Sin spinner pantalla completa.

### 3.10 React performance

- `memo` solo donde haya re-renders medibles (no preventivamente).
- `useMemo` y `useCallback` solo en hot paths.
- Evitar prop drilling profundo (3+ niveles) → usar Context.
- Listas grandes: keys estables (no índices), `memo` en items.

---

## 4. Backend — Reglas de performance

### 4.1 Queries Supabase

**Reglas duras:**

1. **Toda query filtra por `tenant_id`.** Sin excepciones. Índice
   compuesto `(tenant_id, ...)` en todas las tablas grandes.

2. **Limit explícito.** Sin `SELECT *` en tablas grandes sin limit:

```ts
// PROHIBIDO
.from('personas').select('*');

// CORRECTO
.from('personas')
  .select('id, apellido, nombre, numero_documento')
  .eq('tenant_id', tenantId)
  .limit(50);
```

3. **Select solo campos necesarios.** No `select('*')` por default.
   Especificar columnas.

4. **Joins explícitos vía Supabase syntax:**

```ts
.select(`
  id,
  apellido,
  nombre,
  personas_equipos!inner(equipo_id, rol_equipo_slug)
`)
```

### 4.2 Índices

Crear índice si:
- Columna se usa en `WHERE` con frecuencia (especialmente FK).
- Columna se usa en `ORDER BY`.
- Combinación de columnas se usa en `WHERE` (índice compuesto).

**Índices obligatorios en toda tabla de negocio:**
- `(tenant_id, <columna de búsqueda principal>)`
- `(tenant_id, created_at DESC)` para listados ordenados por fecha
- `(tenant_id, activo) WHERE activo = true` para queries de activos

**Auditar con:**
```sql
EXPLAIN ANALYZE SELECT ... FROM ...;
```

Si una query típica tarda > 100ms en EXPLAIN, agregar índice.

### 4.3 N+1 queries

**Detección.** Si en un loop hacés query individual:

```ts
// PROHIBIDO — N+1
for (const persona of personas) {
  const equipos = await supabase
    .from('personas_equipos')
    .select()
    .eq('persona_id', persona.id);
}

// CORRECTO — 1 query
const personaIds = personas.map(p => p.id);
const equipos = await supabase
  .from('personas_equipos')
  .select()
  .in('persona_id', personaIds);
```

O mejor, **JOIN inline** en la primera query.

### 4.4 RLS performance

Las RLS policies se evalúan por fila. Reglas:

- **Subqueries pesadas en RLS = mato performance.** Mantener las
  policies con lookups simples y bien indexados.
- **JWT claims** (cuando se implemente real, Sprint 17b) son más rápidos
  que joins a tablas de permisos.
- Si una RLS hace `EXISTS (SELECT FROM tabla WHERE ...)`, asegurar
  índice en esa tabla.

### 4.5 Funciones SQL custom

Funciones como `match_persona_fuzzy` son hot path. Reglas:

- `LANGUAGE plpgsql` con `STABLE` o `IMMUTABLE` cuando aplique
  (permite cache).
- Evitar cursores. Usar SELECT directo.
- Limit early. No retornar 10k filas que el cliente filtra después.
- `EXPLAIN ANALYZE` periódico de funciones críticas.

### 4.6 Connection pooling

Supabase usa PgBouncer en transaction mode por default. Reglas:

- No abrir conexiones largas en server actions. Cada action abre/cierra.
- Para operaciones batch grandes (imports), considerar session mode si
  hace falta transacciones largas.
- Monitorear "active connections" en dashboard Supabase. Si llega al
  límite, hay query stuck.

### 4.7 Operaciones batch

**Apply de runs de import (200+ filas):**

- Procesar en lotes de 50-100 filas con `await` entre lotes.
- UI actualiza progress después de cada lote.
- Permitir cancelar mid-batch.
- Si una fila falla, registrar error y continuar (no abortar todo).

**Emisión masiva de cuotas:**

- 1 transaction por tenant, no por persona.
- Bulk insert (`.insert([...])` con array), no insert por fila.

### 4.8 Caching de queries

Next.js cache strategies:

- `revalidate: false` (cache permanente) → catálogos globales,
  configuración de tenant.
- `revalidate: 60` (1 min) → listados que cambian poco (equipos, padrones).
- `cache: 'no-store'` → datos del usuario actual, contadores en tiempo
  real.
- `revalidateTag('personas')` → invalidar selectivamente cuando muta.

**Patrón:** después de cada mutación, `revalidateTag` o
`revalidatePath` específico, no `revalidatePath('/')` global.

---

## 5. Red y CDN

### 5.1 Edge runtime vs Node runtime

**Edge** para:
- API routes simples sin libraries pesadas.
- Middleware (auth, redirecciones).
- Páginas SSR estáticas.

**Node** para:
- Server actions con librerías pesadas (PDF generation, Excel).
- Crons con operaciones largas.
- Endpoints que usan Postgres directo con extensiones complejas.

Default: Node (Vercel lo usa por default en App Router).

### 5.2 Caching HTTP

Headers obligatorios:

- **Assets estáticos** (`/public/*`): `Cache-Control: public, max-age=31536000, immutable`
- **HTML páginas SSR**: `Cache-Control: private, no-cache` (siempre revalidar)
- **API responses**: caso por caso, default `Cache-Control: no-store` para datos de usuario

### 5.3 Compresión

Vercel comprime con Brotli automático. Validar que respuestas grandes
(JSON > 10KB) llegan comprimidas.

### 5.4 Sin requests externos en hot path

- Sin Google Analytics directo (usar Vercel Analytics).
- Sin Google Fonts (sistema).
- Sin CDN externo de librerías (todo bundled).
- Sin tracking pixels.

Esto reduce DNS lookups, conexiones y bloqueos.

---

## 6. Operaciones específicas — patrones

### 6.1 Búsqueda en tabla

**Local (cliente) si:**
- < 200 filas en memoria
- Filtros simples (substring match)

**Remoto (server query) si:**
- Conjunto total > 200 filas
- Filtros complejos (fuzzy, multi-campo)

**Debouncing obligatorio** en input de búsqueda remota: 300ms desde
último keystroke antes de disparar query.

### 6.2 Paginación

**Cursor-based** para tablas grandes (personas, audit_log):

```ts
.from('personas')
  .select()
  .eq('tenant_id', t)
  .order('created_at', { ascending: false })
  .gt('created_at', cursor)  // cursor de paginación
  .limit(50)
```

**Offset-based** solo para listas pequeñas y casuales.

### 6.3 Importadores

Ya optimizados desde Sprint 14c. Reglas mantenidas:

- Parser corre en server action, no en browser.
- Match fuzzy en función SQL (más rápido que TS).
- Apply en lotes con progress.
- Resultados se persisten en `import_rows` (no en memoria).

### 6.4 Generación de PDFs con membrete

- Lazy load la librería (`react-pdf` o `@react-pdf/renderer`) en
  endpoint específico.
- Generar en server action, no en cliente.
- Stream el archivo, no acumular en memoria.
- Para reportes > 100 páginas: considerar generación async + email del
  link cuando esté listo.

### 6.5 Exports XLSX

- Generar con ExcelJS en server action.
- Para > 5000 filas: paginar internamente o usar streaming write.
- Si tarda > 10s, mostrar progress bar en UI.

### 6.6 Charts y dashboards

- Datos agregados en server action (no enviar 10k filas al cliente para
  agregar en browser).
- Recharts lazy loaded.
- En mobile, simplificar: gráficos con menos puntos, leyenda colapsable.

---

## 7. Monitoreo

### 7.1 Vercel Analytics

**Activar siempre.** Mide Web Vitals reales de usuarios. Dashboard en
Vercel.

Alertas en degradación de:
- LCP > 4s en > 25% de usuarios
- INP > 500ms en > 25% de usuarios

### 7.2 Supabase logs

Monitorear:
- Queries lentas (>500ms) en dashboard.
- Errores de RLS (filas filtradas inesperadamente).
- Pool de conexiones saturado.

### 7.3 Custom logging

`console.error` con prefijo `[modulo:funcion]`:

```ts
console.error('[finanzas:emitirCuotas]', { error, contexto });
```

Vercel agrupa logs por función. Filtros por prefijo permiten
debug rápido.

### 7.4 Error tracking (futuro)

Sprint 17+: integrar Sentry o equivalente para tracking de errores en
producción. Hoy no es crítico — volúmenes bajos.

### 7.5 Auditoría manual recurrente

Cada cierre de sprint:
- `npm run build` y revisar bundle size.
- Lighthouse mobile + desktop de páginas críticas.
- Revisar queries lentas en Supabase dashboard.

---

## 8. Anti-patrones de performance prohibidos

| # | Anti-patrón | Por qué prohibido |
|---|---|---|
| PERF-A1 | `SELECT *` en tablas grandes sin limit | Tráfico inútil, parsing pesado |
| PERF-A2 | N+1 queries en loops | Multiplica latencia |
| PERF-A3 | Client component cuando RSC alcanza | Bundle JS innecesario |
| PERF-A4 | Importar librería completa en lugar de tree-shake | Bundle bloated |
| PERF-A5 | Imágenes sin `next/image` | Sin WebP, sin srcset |
| PERF-A6 | Fonts custom en admin | TTFB elevado, sin razón |
| PERF-A7 | Animaciones que animan `width`/`height` | Reflow, jank |
| PERF-A8 | Tabla con > 50 filas sin virtualizar | Memory blow en mobile |
| PERF-A9 | Búsqueda sin debounce | N queries por keystroke |
| PERF-A10 | Cache strategy `no-store` por default | Re-fetch innecesario |
| PERF-A11 | Generación de PDF/XLSX en client | Browser muere en gama baja |
| PERF-A12 | Datos del backend agregados en browser | Tráfico + CPU client gratuita |
| PERF-A13 | Charts con > 1000 datapoints | Imposible de renderizar en mobile |
| PERF-A14 | Estado global pesado (Redux con todo el universo) | Re-renders en cascada |
| PERF-A15 | `useEffect` que dispara queries en cada render | Memory leak + race conditions |

---

## 9. Checklist de performance por feature nueva

Antes de cerrar sprint, validar:

**Frontend:**
- [ ] Bundle JS de la página < 250KB gzipped
- [ ] Lighthouse Performance mobile >= 80
- [ ] LCP < 2.5s en throttled 4G
- [ ] INP < 200ms en interacciones primarias
- [ ] Imágenes con `next/image`
- [ ] Skeleton mostrado en carga inicial
- [ ] Sin animaciones que causen reflow
- [ ] Componentes pesados con `dynamic()`
- [ ] Server Components preferidos donde aplique

**Backend:**
- [ ] Todas las queries con `tenant_id` en filtro
- [ ] Limit explícito en queries de listado
- [ ] Sin N+1 (revisar loops)
- [ ] Índices presentes para las queries nuevas
- [ ] EXPLAIN ANALYZE de query crítica < 100ms
- [ ] RLS policies no agregan latency significativa
- [ ] Server actions retornan rápido (< 1s) o usan progress

**Red:**
- [ ] Cache strategy correcta para tipo de dato
- [ ] `revalidateTag` o `revalidatePath` específico tras mutación
- [ ] Sin requests externos en hot path

---

## 10. Optimizaciones futuras (postergadas)

| Optimización | Cuándo |
|---|---|
| Tests de carga automatizados | Sprint 17+ |
| CDN propio para assets críticos | Q4 2026 si demanda lo justifica |
| Edge functions para endpoints de lectura masiva | Q3 2026 |
| Server-side rendering streaming completo | Q3 2026 |
| Optimistic UI en formularios frecuentes | Caso por caso |
| Workers para parsing de archivos en cliente | Si imports lo demandan |
| HTTP/3 forced | Cuando Vercel lo soporte por default |
| Caching agresivo en Redis | Cuando aparezca cuello de botella real |
| Image CDN dedicado | Si Vercel deja de alcanzar |
| Database replicas / read replicas | Cuando > 50 tenants activos |

---

## 11. Cómo se mantiene este documento

Cambios en target hardware o objetivos requieren aprobación del
arquitecto. Code consulta este doc en todos los sprints que tocan:
- Backend con queries nuevas
- Frontend con componentes nuevos
- Operaciones batch o de generación de archivos

Si Code detecta que el target numérico es imposible para una feature
específica, parar y consultar — puede que el target esté mal o que la
feature esté sobre-diseñada.

Auditoría formal de performance cada cierre de sprint mayor (cada 4
sprints).
