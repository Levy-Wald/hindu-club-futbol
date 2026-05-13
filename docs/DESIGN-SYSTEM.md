DESIGN-SYSTEM — Sistema de diseño de la Plataforma SaaS Multimodal  
\=====================================================================

Versión: 2.0 (re-escrito y expandido)  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Supersedes: DESIGN-SYSTEM.md v1 (4.3K, tokens shadcn básicos)  
Path esperado en repo: docs/DESIGN-SYSTEM.md  
Referencias: BRAND-PLATFORM.md, PROMPT-TEMPLATE.md (PARTE 6\)

PROPÓSITO  
\=========

Este documento define el sistema de diseño técnico de la plataforma: tokens, componentes base, patrones por estado, iconografía, animaciones, breakpoints.

Es la fuente única que Code debe consultar en cada sprint (PROMPT-TEMPLATE PARTE 6\) para asegurar consistencia visual.

Si BRAND-PLATFORM define el "qué decir y cómo verse a alto nivel", DESIGN-SYSTEM define el "cómo escribir el código de UI específicamente".

STACK DE UI  
\============

Framework: Next.js 14 (App Router) \+ React 18  
Componentes base: shadcn/ui v4 sobre base-ui (NO Radix)  
Estilado: Tailwind CSS v3  
Tipografía: Inter (Google Fonts)  
Iconos: Lucide React  
Animaciones: Framer Motion  
Tables: TanStack Table v8  
Forms: React Hook Form \+ Zod  
Toast: Sonner

Cambios al stack requieren ADR.

TOKENS DE COLOR  
\================

Implementación: variables CSS en globals.css, mapeadas a Tailwind via tailwind.config.

Backgrounds:  
\- bg-primary: white (slate-0)  
\- bg-secondary: slate-50 (\#F8FAFC)  
\- bg-tertiary: slate-100 (\#F1F5F9)  
\- bg-elevated: white (cards, modales)

Texto:  
\- text-primary: slate-900 (\#0F172A)  
\- text-secondary: slate-600 (\#475569)  
\- text-tertiary: slate-400 (\#94A3B8)  
\- text-inverse: white (sobre fondos oscuros)

Bordes:  
\- border-subtle: slate-200 (\#E2E8F0)  
\- border-default: slate-300 (\#CBD5E1)  
\- border-strong: slate-400 (\#94A3B8)

Acciones:  
\- action-primary: slate-900 (botones primarios, hover slate-800)  
\- action-secondary: slate-100 (botones secundarios, hover slate-200)  
\- action-accent: indigo-600 (\#4F46E5) para CTAs comerciales (marketplace, upselling)  
\- action-accent-hover: indigo-500 (\#6366F1)

Estados:  
\- success: emerald-600 action, emerald-100 bg, emerald-800 text  
\- warning: amber-600 action, amber-100 bg, amber-800 text  
\- error: red-600 action, red-100 bg, red-800 text  
\- info: sky-600 action, sky-100 bg, sky-800 text

Regla de uso:  
\- Solo usar tokens, NUNCA hex hardcodeado en componentes  
\- Colores de estado SOLO cuando hay un estado real, nunca decorativos  
\- Focus visible: outline 2px del color de acción, offset 2px

TIPOGRAFÍA  
\===========

Familia: Inter (fallback: system-ui).

Escala:  
\- xs: 12/16 (badges, tags, helper text)  
\- sm: 14/20 (body secundario, labels)  
\- base: 16/24 (body default)  
\- lg: 18/28 (card title estándar)  
\- xl: 20/28 (subsection title)  
\- 2xl: 24/32 (modal title, card destacado)  
\- 3xl: 30/36 (section title de página)  
\- 4xl: 36/40 (page title principal)

Pesos:  
\- 400 regular: body, captions  
\- 500 medium: labels, subtítulos  
\- 600 semibold: títulos, énfasis  
\- 700 bold: solo h1-h2 raros

Datos tabulares: font-variant-numeric: tabular-nums.

Máximo 3 pesos distintos por pantalla.

SPACING  
\========

Sistema base 4px:  
\- space-1: 4px (icono+texto inline)  
\- space-2: 8px (botones inline)  
\- space-3: 12px (padding inputs)  
\- space-4: 16px (padding cards default, gap listas)  
\- space-6: 24px (separación secciones modal)  
\- space-8: 32px (separación secciones página)  
\- space-12: 48px (separación bloques mayores)  
\- space-16: 64px (margins página)

BORDES Y RADIOS  
\================

Ancho:  
\- 1px default  
\- 2px en focus rings, énfasis

Radios:  
\- 4px (badges, tags)  
\- 6px (botones, inputs)  
\- 8px (cards, modales)  
\- 9999px (avatares, pills)

SOMBRAS Y ELEVACIÓN  
\====================

4 niveles, cada uno \= "más cerca del usuario":  
\- shadow-none: sin sombra (en línea con superficie)  
\- shadow-sm: cards de fondo  
\- shadow-md: cards elevadas, dropdowns  
\- shadow-lg: modales, drawers  
\- shadow-xl: toasts, popovers críticos

NO usar shadows para decoración.

BREAKPOINTS  
\============

\- sm: 640px (mobile landscape)  
\- md: 768px (tablet)  
\- lg: 1024px (laptop)  
\- xl: 1280px (desktop)  
\- 2xl: 1536px (desktop grande)

Containers:  
\- max-w-7xl (1280px): containers principales  
\- max-w-5xl (1024px): forms y readables  
\- max-w-3xl (768px): contenido editorial  
\- max-w-md (448px): modales centrados

Estructura admin:  
\- Sidebar: 240px (collapsible a 64px en mobile)  
\- Header: 56px alto fijo  
\- Main: max-w-7xl, padding lateral px-4 mobile / px-6 desktop

COMPONENTES BASE  
\=================

BUTTON  
\- default: bg slate-900, text white, hover slate-800  
\- secondary: bg slate-100, text slate-900, hover slate-200  
\- outline: border slate-300, text slate-900, hover bg slate-50  
\- ghost: sin bg, text slate-900, hover bg slate-100  
\- destructive: bg red-600, text white, hover red-700  
\- accent: bg indigo-600, text white, hover indigo-700 (CTAs comerciales)

Sizes:  
\- sm: h-8 px-3 text-sm  
\- default: h-10 px-4 text-sm  
\- lg: h-11 px-6 text-base  
\- icon: h-10 w-10

Loading state: spinner inline \+ texto opaco. Disabled durante loading.

INPUT / TEXTAREA / SELECT  
Default: border slate-300, bg white, text slate-900, placeholder slate-400  
Focus: outline ring-2 ring-slate-400 ring-offset-2  
Error: border red-500, focus ring red-500, mensaje text-sm text-red-600 debajo

Sizes:  
\- sm: h-8 px-2 text-sm  
\- default: h-10 px-3 text-sm  
\- lg: h-11 px-4 text-base

CARD  
\- bg white, border slate-200, rounded-lg, shadow-sm, padding p-6

Variants:  
\- default: como arriba  
\- elevated: shadow-md  
\- ghost: sin border, sin shadow, solo padding  
\- highlight: border indigo-200, bg indigo-50

BADGE  
\- h-5, px-2, text-xs, font-medium, rounded-full  
\- default: bg slate-100, text slate-700  
\- success/warning/destructive/info/accent: usar paleta de estado correspondiente

DIALOG / MODAL  
\- Overlay: bg slate-900/50  
\- Container: bg white, max-w-md a max-w-2xl, rounded-lg, shadow-xl  
\- Header: p-6 pb-4, title text-xl font-semibold  
\- Body: px-6 py-4  
\- Footer: p-6 pt-4, botones justify-end gap-2  
\- Close arriba derecha icon-sized

Animación: fade-in 200ms \+ scale 95→100

DRAWER / SHEET  
\- Como dialog pero ancla a un lado (right default, bottom en mobile)  
\- Width max-w-md (lateral) o full (bottom)  
\- shadow-xl  
\- Slide-in 250ms ease-out

TABLE (TanStack Table v8 \+ shadcn)  
\- thead: bg slate-50, text-sm font-medium text-slate-700, border-b  
\- tbody rows: border-b slate-100, hover bg slate-50  
\- Cell padding: px-4 py-3  
\- Sortable headers: cursor-pointer \+ flecha  
\- DataTable wrapper: toolbar arriba con filtros \+ búsqueda \+ "+Nuevo", paginación abajo

TABS  
\- Underline style (no pill)  
\- Activo: border-b-2 border-slate-900, text slate-900 font-semibold  
\- Inactivo: text slate-600, hover text slate-900  
\- Gap entre tabs: gap-6

TOAST (sonner)  
\- Position: bottom-right (default)  
\- Duración: 4s default  
\- Variants: default, success, error, warning, info  
\- Texto: max 100 caracteres

ALERT (inline, no toast)  
\- Padding p-4  
\- border-l-4 del color del estado  
\- icono a la izquierda  
\- title font-semibold \+ descripción text-sm

COMMAND PALETTE (cmdk)  
\- Atajo Cmd/Ctrl+K  
\- Input grande arriba \+ lista de resultados agrupada  
\- Iconos lucide a la izquierda

PATRONES POR ESTADO  
\====================

LOADING:  
\- Skeleton (NUNCA spinner full page)  
\- Color bg slate-200, shimmer 1.5s  
\- Si supera 3s, agregar texto "Cargando..."  
\- Excepción: botones en loading muestran spinner inline (Loader2 rotando)

EMPTY:  
\- Container centrado  
\- Icon h-12 w-12 en slate-400  
\- Title text-lg font-semibold  
\- Description text-sm text-slate-600 (max 2 líneas)  
\- Button accent o default con "+Crear primero"

ERROR:  
\- Alert variant destructive  
\- Icon AlertCircle  
\- Title "Error al cargar X"  
\- Description: qué pasó \+ cómo resolverlo  
\- Botón "Reintentar" si aplica  
\- Errores críticos: error boundary dedicado

SUCCESS TRANSITORIO:  
\- Toast variant success, auto-dismiss 3-5s  
\- NO usar success persistente

MÓDULO NO CONTRATADO (ADR-043):  
\- Card disabled: bg slate-50, border slate-200, text slate-500  
\- Icono Lock arriba derecha en slate-400  
\- Badge "Activar" abajo derecha en accent  
\- Click abre modal con descripción \+ precio \+ beneficios \+ CTA accent

MÓDULO PRÓXIMAMENTE:  
\- Card disabled con badge "Próximamente Q3 2026" variant secondary  
\- Icono Calendar  
\- Click muestra modal informativo

ICONOGRAFÍA  
\============

Familia única: Lucide React.

Tamaños:  
\- Inline: h-4 w-4  
\- Botones: h-4 w-4 (con texto), h-5 w-5 (solo icon)  
\- Headers: h-5 w-5 o h-6 w-6  
\- Empty states: h-12 w-12  
\- Sidebar: h-5 w-5

NO permitido:  
\- Emojis como iconos funcionales  
\- Material Icons, Heroicons, Feather, Font Awesome  
\- SVG custom (excepto logos)

Mapeo standard:  
\- Plus (Crear), Pencil (Editar), Trash2 (Borrar)  
\- Search (Buscar), Filter (Filtrar), Settings (Configurar)  
\- X (Cerrar), ArrowLeft (Volver), ArrowRight (Siguiente)  
\- MoreHorizontal / MoreVertical (Más opciones)  
\- Info, AlertCircle, XCircle, CheckCircle2, Loader2  
\- Calendar, Users, User, UsersRound  
\- DollarSign, CircleDollarSign, CreditCard  
\- Bell (Notificaciones), Mail (Email)  
\- FileText, File, Folder  
\- Lock (no contratado), Unlock (contratado), KeyRound (acceso)  
\- Heart / Activity (salud), Package (inventario)  
\- CalendarCheck (reservas), BarChart3 (reporte)

ANIMACIONES (Framer Motion)  
\============================

Duraciones:  
\- Micro (hover, color): 150ms  
\- Standard (modales): 250ms  
\- Larger (slide secciones): 400ms

Easings:  
\- ease-out (entradas, default)  
\- ease-in (salidas)  
\- ease-in-out (transiciones complejas)

Permitidas:  
\- Fade in/out  
\- Scale 95→100 (modales)  
\- Slide in/out (drawers)  
\- Skeleton shimmer (loading)  
\- Toast slide-in  
\- Hover lift translateY \-1px (cards interactivas)

PROHIBIDAS:  
\- Bounce  
\- Spring exagerado  
\- Animaciones decorativas sin propósito  
\- Auto-scroll sin acción del usuario  
\- Confeti, celebración, fireworks

MODO OSCURO  
\============

Status: planificado post FASE C.  
Estrategia: variables CSS con light-dark(), toggle en settings persistente en localStorage, default según prefers-color-scheme.  
Hasta entonces: solo modo claro.

ACCESIBILIDAD  
\==============

Requisitos mínimos:  
\- WCAG 2.1 AA contrast (4.5:1 texto, 3:1 UI elements)  
\- Focus visible siempre (outline-2 offset-2)  
\- Navegación por teclado completa (Tab, Enter, Esc, flechas)  
\- ARIA labels en botones icon-only  
\- aria-describedby para errores de form  
\- role="alert" para mensajes críticos

Testing:  
\- Lighthouse Accessibility \> 90 obligatorio  
\- Axe DevTools 0 violations críticas

MOBILE-FIRST  
\=============

\- Diseñar mobile primero, expandir a desktop  
\- Sidebar admin colapsa a drawer en mobile  
\- Tablas con scroll horizontal en mobile (NUNCA reflow caótico)  
\- Touch targets mínimo 44x44px  
\- Padding lateral mobile 16px / desktop 24px+  
\- Botones primary full-width mobile (max-w-md), auto desktop

ARCHIVOS DEL SISTEMA EN EL REPO  
\=================================

\- app/globals.css → variables CSS, base layer  
\- tailwind.config.ts → extensión de tokens  
\- components/ui/ → componentes shadcn base  
\- components/empty-state.tsx → empty custom  
\- components/error-boundary.tsx → boundary errores  
\- lib/utils.ts → cn() helper

NO modificar components/ui/\* directamente sin documentar acá.

CUÁNDO SE ACTUALIZA  
\====================

\- Token nuevo (color, espacio, tipografía)  
\- Componente base nuevo en components/ui/  
\- Decisión visual canónica modificada  
\- Diseñador contratado aporta refinamientos  
\- Al cierre de Sprint A1 (validación práctica)

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 2.0.  
Próxima revisión: al cierre de Sprint A1.  
