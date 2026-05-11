# ClubCore — UI/UX Standards

> Estándares de diseño de interfaz y experiencia de usuario. Reglas
> ejecutables, no guías estéticas. Cada componente, página o feature debe
> respetarlas.
>
> **Hardware target del proyecto: baja gama Android (4GB RAM, 4G inestable).**
> Cada decisión visual considera ese contexto.
>
> Mantenido por el arquitecto.
>
> Última actualización: 10 de mayo de 2026.

---

## 1. Filosofía

### 1.1 Mobile-first real, no responsive de escritorio reducido

ClubCore se diseña pensando primero el celular baja gama, después tablet,
después desktop. Los empleados de RRHH y proveedores acceden desde mobile
en el 70%+ de los casos. La UI debe sentirse como app, no como página web
encogida.

### 1.2 Información primero, decoración después

Cada pixel debe servir a la operación. Sin animaciones decorativas pesadas,
sin imágenes hero gigantes, sin gradients gratuitos. Densidad alta con
respiración suficiente para legibilidad en pantallas chicas.

### 1.3 Acción inmediata, no confirmación obsesiva

Operaciones reversibles (toggles, cambios menores) se ejecutan sin
modal de confirmación. Operaciones destructivas (eliminar, anular,
fusionar) sí piden confirmación explícita.

### 1.4 Identidad por tenant

Cada tenant tiene su branding (logo, colores primarios, nombre,
membrete). La UI lo refleja consistentemente: topbar, sidebar, login,
documentos generados.

---

## 2. Breakpoints y comportamiento

Breakpoints estándar de Tailwind:

| Breakpoint | Min width | Target | Comportamiento general |
|---|---|---|---|
| (default) | 0 | Mobile portrait | Sidebar drawer, bottom actions, full-width inputs |
| `sm` | 640px | Mobile landscape / mini-tablet | Igual mobile, columnas inline si caben |
| `md` | 768px | Tablet portrait | Sidebar fijo opcional, grids 2 columnas |
| `lg` | 1024px | Tablet landscape / laptop pequeña | Sidebar fijo siempre, grids 3 columnas |
| `xl` | 1280px | Desktop standard | Layout completo, máxima densidad |

**Regla:** todo el contenido debe ser usable en cualquier breakpoint. Si
algo solo funciona en desktop, está mal diseñado.

### 2.1 Layout mobile (default + sm)
┌──────────────────────────────────┐
│  TopBar (56px)                   │ ← Logo tenant, notificaciones, user
├──────────────────────────────────┤
│                                  │
│  Contenido scrolleable           │ ← Padding lateral 16px
│  (full width)                    │   Cards stack vertical
│                                  │
│                                  │
├──────────────────────────────────┤
│  Bottom Nav opcional (56px)      │ ← Solo si la página lo amerita
└──────────────────────────────────┘

Sidebar: drawer que se abre desde botón hamburguesa en topbar. Overlay
semi-transparente.

### 2.2 Layout tablet (md)
┌────────────────────────────────────────────────┐
│  TopBar (56px)                                 │
├────────┬───────────────────────────────────────┤
│        │                                       │
│Sidebar │  Contenido                            │
│ (drawer│  (padding 24px)                       │
│  o     │  Grids 2 col                          │
│  fijo) │                                       │
│        │                                       │
└────────┴───────────────────────────────────────┘

Sidebar puede ser fijo (240px) o drawer según preferencia del usuario.
Default: drawer en md, fijo en lg+.

### 2.3 Layout desktop (lg, xl)

Sidebar fijo (260px). Contenido máximo 1280px centrado en xl+.

---

## 3. Regla absoluta — Botoneras y widgets

### 3.1 Acciones primarias arriba a la derecha

**SIEMPRE.** En cualquier breakpoint. En cualquier página.
┌─────────────────────────────────────────────────┐
│  Título Página              [Crear] [Importar] │ ← Botoneras
├─────────────────────────────────────────────────┤
│  Filtros + búsqueda                             │
├─────────────────────────────────────────────────┤
│  Lista / tabla / contenido principal            │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  Widgets, stats, secciones secundarias          │ ← DEBAJO
└─────────────────────────────────────────────────┘

### 3.2 En mobile

Los botones primarios:
- Si son 1-2 botones: arriba a la derecha del título, iconos + texto
  corto. Si no entra, solo icono.
- Si son 3+ botones: el primario arriba derecha, los otros en un menú
  "⋮" (overflow menu).
- **Nunca** debajo de la lista en mobile (excepto bulk actions
  contextuales — ver §3.4).

### 3.3 Botones de exportar / importar

Son botones secundarios, también arriba pero más a la izquierda o dentro
de overflow menu en mobile. Iconos consistentes:
- Importar: ícono `Upload` de Lucide
- Exportar: ícono `Download` de Lucide
- Imprimir: ícono `Printer` de Lucide

### 3.4 Bulk actions (cuando hay selección en tabla)

Cuando el usuario selecciona filas, aparece una **barra de selección**
flotante:
- Desktop/tablet: flotando arriba de la tabla o en la parte superior
  de la pantalla.
- Mobile: barra inferior fija (bottom sheet) con las acciones
  disponibles.

Esa barra contiene las acciones bulk (eliminar seleccionados, exportar
seleccionados, asignar a padrón, etc.) Cierra con ✕ que limpia la
selección.

### 3.5 Anti-patrones prohibidos

- Botón "Guardar" / "Crear" / "Importar" abajo del todo del listado
- FAB (floating action button) que oculta contenido
- Acciones primarias dentro de tabs (deben estar arriba de los tabs)
- Dropdowns infinitos con todas las acciones — preferir varios
  botones visibles

---

## 4. Sistema de exports y membrete

### 4.1 Formatos soportados

| Formato | Extensión | Cuándo usar |
|---|---|---|
| **CSV** | `.csv` | Datos crudos para procesamiento externo |
| **XLSX** | `.xlsx` | Datos para Excel con formato (negritas, columnas) |
| **PDF** | `.pdf` | Documentos finales para imprimir/compartir |
| **JSON** | `.json` | Backups técnicos o integraciones (sólo admin) |

### 4.2 Membrete

Cada export tiene 2 modos:

**Sin membrete (técnico):**
- CSV / XLSX raw, sin logo, sin header de tenant
- Filas exactas como están en DB
- Para: contabilidad externa, backup, análisis

**Con membrete (formal):**
- PDF / XLSX con encabezado del tenant
- Header incluye: logo del tenant, nombre completo, CUIT, dirección,
  fecha de emisión, usuario que emite
- Footer incluye: número de página, pie con datos legales
- Para: enviar a socios, autoridades, archivar formalmente

### 4.3 Configuración del membrete (por tenant)

Vive en `tenant_config_publica`:

logo_url (path en Supabase Storage)
nombre_legal
razon_social
cuit
domicilio_fiscal
email_contacto
telefono_contacto
web
colores_primarios (jsonb)
footer_legal (texto)


Editable desde `/admin/configuracion/branding`.

### 4.4 UI de export

Cuando el usuario presiona "Exportar", abre un dialog con:
┌─────────────────────────────────────────┐
│  Exportar [recurso]                  ✕  │
├─────────────────────────────────────────┤
│  Formato:                               │
│  ( ) CSV  (•) XLSX  ( ) PDF             │
│                                         │
│  ☐ Incluir membrete (logo, datos club) │
│                                         │
│  ☐ Solo seleccionados (N filas)        │
│                                         │
│  Columnas a incluir:                    │
│  ☑ Todas  o  configurar...              │
│                                         │
│         [Cancelar]      [Exportar]      │
└─────────────────────────────────────────┘

Default según contexto:
- Tabla operativa interna → XLSX sin membrete
- Reporte financiero → PDF con membrete
- Comprobante → PDF con membrete (obligatorio)

### 4.5 Componente reusable

`<ExportButton>` o `<ExportDialog>` en `components/ui/export-*.tsx`. Acepta:
- `data` o `query` (la fuente)
- `defaultFormat`
- `availableFormats`
- `defaultWithLetterhead` (boolean)
- `onExportComplete` (callback)

---

## 5. Patrones por tipo de página

### 5.1 Listado (index) de un recurso

Estructura obligatoria de arriba a abajo:

1. **Header.** Título + descripción corta + botonera primaria arriba derecha.
2. **Cards de stats** (opcional). 3-4 cards con métricas relevantes.
   Mobile: 2 columnas. Tablet+: 4 columnas.
3. **Botonera secundaria** (filtros, búsqueda, vistas, columnas).
4. **Lista / tabla.**
5. **Paginación.**
6. (Nada debajo. Si hace falta más contexto, va en sidebar o un panel
   secundario abajo, pero no acciones).

### 5.2 Detalle (show) de un recurso

Estructura:

1. **Header con breadcrumb.** Link al listado, nombre del recurso, botón
   editar arriba derecha.
2. **Stats / info principal.** Cards o secciones con info de un vistazo.
3. **Tabs** (si hay múltiples vistas: ficha, atributos, historial, etc.).
4. **Contenido del tab activo.**
5. **Acciones destructivas (eliminar, baja).** Al pie, **separadas**,
   en un panel "Zona de peligro" con borde rojo o similar (patrón de
   GitHub).

### 5.3 Formulario (create / edit)

- Full width en mobile, max 800px centrado en desktop.
- Validación inline en blur (sale del campo) — no on every keystroke.
- Errores debajo del campo con icono y mensaje específico.
- Botón submit fijo abajo de la pantalla en mobile (sticky), inline en
  desktop.
- Si el form es largo (>10 campos), agruparlo en secciones colapsables o
  steps.
- **Dirty state:** si el usuario cambia algo y trata de salir sin
  guardar, modal "¿Descartar cambios?".

### 5.4 Wizard (multi-step)

- Stepper visible arriba mostrando paso actual y totales.
- Botones "Anterior" / "Siguiente" en footer fijo abajo.
- Step actual ocupa todo el viewport en mobile.
- Validación al pasar de paso, no al final.
- "Cancelar wizard" pide confirmación.

### 5.5 Dashboard

- Cards de KPIs primero (4 a 8).
- Gráficos / charts después (1-2 por fila en desktop, 1 en mobile).
- Acciones rápidas en cards de tipo "shortcut".
- No mezclar tabla operativa con dashboard. Si hace falta tabla, link a
  la página de listado correspondiente.

---

## 6. Componentes UI

### 6.1 Botones

Variantes:

| Variant | Cuándo |
|---|---|
| `default` (primary) | Acción principal de la página |
| `secondary` | Acciones secundarias (editar, exportar) |
| `outline` | Acciones neutrales (cancelar, cerrar) |
| `ghost` | Botones contextuales dentro de tablas o cards |
| `destructive` | Acciones de eliminación (rojo) |
| `link` | Navegación que parece link |

Tamaños:
- `default` (40px alto)
- `sm` (32px alto, solo en contextos densos como tablas)
- `lg` (48px alto, para CTAs en landing o login)
- `icon` (40x40 cuadrado, solo icono)

**Touch target mínimo 44px en mobile** (extra padding si el botón es
chico). Aplicar a todos los botones, links, checkboxes en mobile.

### 6.2 Inputs

- Altura mínima 44px en mobile.
- Label arriba (no placeholder como label — fail de accesibilidad).
- Placeholder con sugerencia, no obligatorio.
- `autocomplete` correcto siempre (`email`, `tel`, `name`, etc.).
- `inputMode` para mobile (`numeric` para DNI, `email` para email, etc.).

### 6.3 Tablas

- Header sticky en scroll vertical.
- Filas con altura mínima 48px en desktop, 56px en mobile.
- Hover state visible.
- Selección con checkbox a la izquierda + barra de bulk actions (§3.4).
- Sort indicators clicables en headers.
- Filtros: arriba de la tabla, no inline en headers.
- **Tablas con > 50 filas o > 8 columnas:** virtualizar (TanStack
  Virtual o equivalente).
- **Mobile:** si una tabla tiene > 4 columnas, transformar a cards (cada
  fila es un card) o permitir scroll horizontal con primera columna
  sticky.

### 6.4 Dialogs y sheets

- **Dialog (modal centrado):** acciones cortas (crear, confirmar). Max
  500px desktop, full screen mobile.
- **Sheet (slide-in lateral):** formularios largos. 480px ancho en
  desktop, full screen mobile.
- **AlertDialog:** confirmaciones destructivas. Botón destructivo a la
  derecha (no izquierda — convención iOS/Android).
- **Drawer (bottom sheet):** menús contextuales en mobile, bulk
  actions, pickers.

Cierre:
- ✕ en esquina superior derecha
- ESC en desktop
- Click fuera (solo si el contenido no se perdería)
- Swipe down en mobile (para sheets/drawers)

### 6.5 Tabs

- Tabs horizontales con underline en estado activo.
- En mobile con muchos tabs: scroll horizontal con fade en bordes, no
  wrap.
- Iconos opcionales + label corto.

### 6.6 Toasts

- Esquina superior derecha en desktop, top center en mobile.
- Auto-dismiss en 5 segundos default. Sticky para errores.
- Variantes: `default`, `success`, `error`, `warning`.
- Una acción opcional (`Deshacer`, `Ver detalles`).
- Máximo 3 toasts visibles simultáneamente.

### 6.7 Loading states

Granularidad:

| Tipo | Cuándo |
|---|---|
| **Skeleton** | Carga inicial de página o sección (preferido) |
| **Spinner** | Acción puntual (submit de form, refresh) |
| **Progress bar** | Operación larga con porcentaje conocido (imports, applies) |
| **Indeterminate progress** | Operación larga sin porcentaje |

NO usar spinner pantalla completa que bloquee todo. Siempre permitir
cancelar operaciones largas si es técnicamente posible.

### 6.8 Estados vacíos

Cuando una tabla o lista no tiene datos:
┌─────────────────────────────────────────┐
│                                         │
│         [ Ilustración / icono ]         │
│                                         │
│       Aún no hay [recurso] cargados     │
│                                         │
│   Empezá creando el primero o importá   │
│       desde un archivo Excel.           │
│                                         │
│      [Crear primero]   [Importar]       │
│                                         │
└─────────────────────────────────────────┘

NUNCA tabla vacía sin contexto. NUNCA "No hay datos." pelado.

### 6.9 Estados de error

- Toast para errores temporales (red, validación submit).
- Banner inline para errores persistentes en página.
- Página completa de error para fallas críticas (404, 500), siempre con
  CTA "Volver" + "Reintentar".

---

## 7. Tipografía

### 7.1 Familia

Default: sistema (`-apple-system, BlinkMacSystemFont, ...`). Performance
y legibilidad nativa. Custom fonts solo para branding del tenant en
landings públicas, no en admin.

### 7.2 Escala

| Token | Tamaño | Uso |
|---|---|---|
| `text-xs` | 12px | Captions, labels, metadata |
| `text-sm` | 14px | Body en tablas, formularios densos |
| `text-base` | 16px | Body default |
| `text-lg` | 18px | Subtitulos |
| `text-xl` | 20px | Titulos secundarios |
| `text-2xl` | 24px | Titulos de página |
| `text-3xl` | 30px | Hero / landing |
| `text-4xl` | 36px | Reservado |

Line height: `1.5` para body, `1.2` para titulos.

### 7.3 Peso

- `font-normal` (400): body
- `font-medium` (500): labels, énfasis suave
- `font-semibold` (600): titulos, headers de tabla
- `font-bold` (700): titulos principales, números importantes

No usar 300 (light) en mobile baja gama — se ve borroso en pantallas
chicas.

---

## 8. Color

### 8.1 Design Tokens System (ver ADR-018)

Fuente única: `/styles/tokens.css`. Registrados en `globals.css` vía
`@theme inline`. Escalas disponibles:

**Semánticos shadcn:** --background, --foreground, --primary, --secondary,
--muted, --accent, --destructive, --border, --input, --ring, --card,
--popover (y sus `-foreground`).

**Escalas de color (Tailwind classes):**
- `brand-{50-950}` — color primario del tenant
- `gold-{50-900}` — color secundario/accent
- `neutral-{50-950}` — grises
- `success-{50-900}` — estados positivos
- `warning-{50-900}` — alertas
- `error-{50-900}` — errores
- `info-{50-900}` — informativo

**Reglas:**
- NUNCA hex codes en className. Usar tokens: `bg-brand-500`, `text-error-600`.
- NUNCA nombres de color raw (`green-600`, `red-100`). Usar semánticos.
- Excepciones: color pickers (branding), colores dinámicos de equipo,
  libs externas (toPng).

### 8.2 Branding por tenant

`tenant_config_publica.color_primario` y `color_secundario` se inyectan
como CSS variables en el root layout:
- `color_primario` → `--primary-500`
- `color_secundario` → `--accent-gold-500`

Todos los componentes que usan `brand-500` y `gold-500` se adaptan
automáticamente sin tocar código.

El resto del sistema se mantiene neutral para no romper accesibilidad.

### 8.3 Modo claro / oscuro

Soportar ambos. Toggle en topbar. Persistir en localStorage. Default
según preferencia del sistema (`prefers-color-scheme`).

### 8.4 Contraste

Mínimo WCAG AA: 4.5:1 para body, 3:1 para titulos grandes. Validar al
introducir un color de tenant — si rompe contraste, mostrar warning al
admin.

---

## 9. Espaciado y density

### 9.1 Escala de spacing

Tailwind default (0.25rem = 4px). Espaciado consistente:

| Token | px | Uso típico |
|---|---|---|
| 1 | 4 | Entre iconos y texto |
| 2 | 8 | Entre elementos relacionados |
| 3 | 12 | Padding de inputs pequeños |
| 4 | 16 | Padding de cards en mobile, gap entre items |
| 6 | 24 | Padding de cards en desktop, separación secciones |
| 8 | 32 | Margen entre secciones |
| 12 | 48 | Separación grande |
| 16 | 64 | Margen top de página |

### 9.2 Density modes (futuro)

Tres modos posibles:
- `compact`: menos padding, tablas con filas de 40px
- `comfortable` (default): padding moderado
- `spacious`: más aire

Configurable por usuario en `/admin/mi-perfil`. Hoy default `comfortable`.

---

## 10. Iconografía

Librería única: **Lucide React** (`lucide-react`).

- Tamaño default: 20px en body, 16px en tablas densas, 24px en titulos.
- Color heredado del texto (`currentColor`).
- Stroke width 2 (default).
- NUNCA mezclar Lucide con otra librería (Heroicons, FontAwesome).

### Iconos canónicos por acción

| Acción | Icono Lucide |
|---|---|
| Crear / Agregar | `Plus` |
| Editar | `Pencil` |
| Eliminar | `Trash2` |
| Buscar | `Search` |
| Filtrar | `Filter` |
| Importar | `Upload` |
| Exportar | `Download` |
| Imprimir | `Printer` |
| Más opciones | `MoreVertical` o `MoreHorizontal` |
| Cerrar | `X` |
| Confirmar | `Check` |
| Información | `Info` |
| Advertencia | `AlertTriangle` |
| Error | `AlertCircle` |
| Éxito | `CheckCircle2` |
| Usuario | `User` |
| Configuración | `Settings` |
| Notificaciones | `Bell` |
| Calendario | `Calendar` |
| Documentos | `FileText` |
| Adjuntar | `Paperclip` |

---

## 11. Animaciones y transiciones

### 11.1 Reglas

- **Solo transiciones funcionales:** hover, focus, open/close, route
  change.
- **Duración:** 150ms para micro-interacciones, 250-300ms para
  transiciones de panel.
- **Easing:** `ease-in-out` default, `ease-out` para entradas, `ease-in`
  para salidas.
- **Reduced motion:** respetar `prefers-reduced-motion: reduce`.
  Deshabilitar animaciones no esenciales.
- **No animaciones decorativas:** sin parallax, sin elements flotando,
  sin scroll-triggered animations heavy.

### 11.2 Performance

Animar solo `transform` y `opacity` (compositor-only). Evitar animar
`width`, `height`, `top/left` (reflow).

---

## 12. Accesibilidad

### 12.1 Mínimos no negociables

- Contraste WCAG AA mínimo.
- Todos los inputs tienen `<label>` asociado.
- Botones con solo icono tienen `aria-label`.
- Estados de focus visibles (no `outline: none` sin reemplazo).
- Navegación completa por teclado (Tab, Enter, Esc, flechas).
- Imágenes con `alt`.
- Mensajes de error y validación leídos por screen readers.
- Tablas con `<th>` y `scope` correctos.
- Skip-link "Saltar a contenido" en topbar.

### 12.2 Verificación

Lighthouse Accessibility score objetivo: **95+** en todas las páginas
principales. Auditar antes de cada deploy de feature crítica.

---

## 13. Notificaciones in-app

Sistema dual:

- **Toasts**: feedback inmediato a acciones del usuario (§6.6).
- **Notificaciones persistentes**: alertas que requieren atención
  posterior. Bell icon en topbar con badge contador. Vive en tabla
  `notificaciones` (a crear si no existe).

Reglas:
- Notificación tiene `tipo`, `titulo`, `mensaje`, `link_accion`,
  `leida_at`, `prioridad`.
- Auto-marcar leídas al verlas (no requiere click manual).
- Filtros: todas / no leídas / por tipo.

---

## 14. Mobile-specific patterns

### 14.1 Bottom navigation (opcional por página)

Para páginas con navegación frecuente entre 3-5 vistas (ej: mi-cuenta,
mi-equipo, mi-perfil). NO usar bottom nav como sidebar global.

### 14.2 Pull-to-refresh

Solo en listados que se benefician de actualización (notificaciones,
dashboard, mensajes). NO en formularios ni en detalles estáticos.

### 14.3 Swipe gestures

- Swipe en filas de listas: revelar acciones rápidas (archivar, marcar
  leído, eliminar). Solo si la acción es de uso frecuente.
- Swipe en sheets/drawers: cerrar.
- NO usar swipes para acciones críticas (eliminar permanente).

### 14.4 Safe areas

Respetar safe areas iOS (notch) y Android (nav bar). Usar `env(safe-area-inset-*)`
en padding de top/bottom.

### 14.5 Teclado virtual

- Inputs hacen scroll hacia arriba para no quedar ocultos.
- Botón submit accesible sin cerrar teclado.
- `inputmode` correcto para minimizar errores.

---

## 15. Membrete y branding por tenant — detalle

### 15.1 Componentes UI afectados

| Componente | Cómo aplica branding |
|---|---|
| TopBar | Logo del tenant a la izquierda, color primario en accents |
| Sidebar | Logo en header, color primario en estado activo |
| Login del tenant | Logo, color primario, fondo neutral |
| Páginas públicas (asociate, equipos) | Branding completo |
| Documentos generados (PDF) | Membrete completo (header + footer) |
| Emails (cuando Resend) | Header con logo, footer con datos |

### 15.2 Configuración

`/admin/configuracion/branding` con:
- Subir logo (PNG/SVG, max 500KB, 256x256 mínimo)
- Subir favicon (ICO/PNG)
- Selector de color primario (color picker con preview)
- Datos del tenant (razón social, CUIT, etc.)
- Footer legal personalizable
- Preview en vivo de cómo se ve la plataforma con el branding

### 15.3 Storage

Logos y favicons en bucket Supabase Storage:
- `tenant-branding/{tenant_id}/logo.{ext}`
- `tenant-branding/{tenant_id}/favicon.{ext}`

Reglas: solo admin del tenant puede subir, lectura pública.

### 15.4 Templates de exports con membrete

Componente `<DocumentLetterhead>` que renderiza el header del documento:
┌────────────────────────────────────────────────┐
│  [Logo]  CLUB HINDU                            │
│          CUIT: 30-12345678-9                   │
│          Av. Libertador 1234, CABA             │
│                                                │
│  ──────────────────────────────────────────    │
│                                                │
│  REPORTE: [Título del reporte]                 │
│  Período: [...]                                │
│  Generado: 10/05/2026 14:30 por Juan Pérez     │
│                                                │
│  [Contenido del documento]                     │
│                                                │
│  ──────────────────────────────────────────    │
│  Página 1 de 3 · ClubCore · contacto@hindu.com │
└────────────────────────────────────────────────┘

Implementación: react-pdf o @react-pdf/renderer para PDF, ExcelJS para
XLSX con header.

---

## 16. Performance UI (referencia rápida)

Detalle completo en `PERFORMANCE.md`. Reglas UI-específicas:

- **Bundle JS por página**: < 250KB gzipped inicial (target baja gama).
- **Imágenes**: WebP + srcset, lazy loading con `loading="lazy"`.
- **Iconos**: tree-shaking Lucide (no importar todo el set).
- **Componentes pesados**: lazy load via `dynamic()` de Next.js.
- **Tablas grandes**: virtualizar.
- **Animaciones**: solo `transform` y `opacity`.
- **Fuentes**: preload críticas, `font-display: swap`.
- **Charts**: lazy load de la libreria (Recharts/Chart.js) solo en
  páginas que las usan.

---

## 17. Anti-patrones UI prohibidos (resumen)

| # | Anti-patrón |
|---|---|
| UI-A1 | Botones primarios debajo de listas |
| UI-A2 | Tabla vacía sin estado vacío explicativo |
| UI-A3 | Placeholder como label de input |
| UI-A4 | Spinner pantalla completa que bloquea todo |
| UI-A5 | `outline: none` sin reemplazo de focus visible |
| UI-A6 | Animaciones decorativas (parallax, etc.) |
| UI-A7 | Mezclar librerías de iconos |
| UI-A8 | Hardcodear colores hex sin token |
| UI-A9 | Touch targets < 44px en mobile |
| UI-A10 | Modales obligatorios para acciones no destructivas |
| UI-A11 | Tablas con > 4 columnas en mobile sin transformar a cards |
| UI-A12 | Footer fixed que oculta contenido sin compensar padding |
| UI-A13 | Forms sin dirty state (pierden cambios silenciosamente) |
| UI-A14 | Modal abierto sin foco automático en primer input |

---

## 18. Checklist de revisión de UI por feature nueva

Al implementar cualquier pantalla o componente, validar:

- [ ] Funciona en mobile portrait (320px-640px)
- [ ] Funciona en tablet (768px)
- [ ] Funciona en desktop (1024px+)
- [ ] Botones primarios arriba a la derecha
- [ ] Widgets secundarios debajo del contenido principal
- [ ] Touch targets >= 44px en mobile
- [ ] Estados: loading, empty, error definidos
- [ ] Validación de form con mensajes específicos
- [ ] Dirty state si aplica
- [ ] Iconos consistentes con §10
- [ ] Tipografía y colores via tokens, no hex
- [ ] Branding del tenant aplicado donde corresponde
- [ ] Export con / sin membrete si aplica
- [ ] Lighthouse Accessibility 95+
- [ ] Lighthouse Performance 80+ en mobile
- [ ] No animaciones decorativas
- [ ] Keyboard navigation completa
- [ ] `aria-label` en botones de solo icono
- [ ] Modo oscuro funciona

---

## 19. Cómo se mantiene este documento

Cambios requieren aprobación del arquitecto. Code consulta este doc en
todos los sprints que tocan capa UI (cualquier `/app/admin/*` o
`/components/*`).

Si Code detecta que un patrón existente del repo contradice este doc,
parar y consultar — puede que el patrón esté mal o que este doc esté
incompleto.
