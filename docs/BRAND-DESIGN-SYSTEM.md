# Brand & Design System — ClubCore / Hindu Club Fútbol

Sistema de diseño completo para páginas públicas y panel de administración.
Genérico por tenant: cada club configura colores, logo y contenido desde el admin.

---

## Paleta de colores

### Hindu Club (tenant piloto)

Extraída del logo oficial (círculo azul con "CH" dorado):

| Nombre | Hex | OKLCH | Uso |
|--------|-----|-------|-----|
| **Blue 500** (primario) | `#3A8FC5` | `oklch(0.62 0.12 240)` | CTAs principales, links, headers, badges activos |
| **Blue 600** | `#2F73A0` | `oklch(0.54 0.11 240)` | Hover de CTAs, bordes activos |
| **Blue 700** | `#1E3A5F` | `oklch(0.35 0.08 240)` | Fondos dark (hero, footer), navy |
| **Blue 800** | `#152B47` | `oklch(0.28 0.06 240)` | Footer dark mode |
| **Blue 50** | `#E8F4FD` | `oklch(0.96 0.02 240)` | Fondos sutiles light mode |
| **Gold 500** (secundario) | `#F2C531` | `oklch(0.83 0.15 85)` | CTAs secundarios, destacados, badges |
| **Gold 600** | `#D4A818` | `oklch(0.74 0.14 85)` | Hover gold |
| **Gold 400** | `#F5D85B` | `oklch(0.88 0.13 85)` | Gold claro para fondos |
| **Gold 50** | `#FEFBEB` | `oklch(0.99 0.01 85)` | Fondos gold sutiles |

### Colores semánticos

| Variable CSS | Light mode | Dark mode | Uso |
|-------------|-----------|-----------|-----|
| `--background` | `#FFFFFF` | `#0F0F0F` | Fondo principal |
| `--foreground` | `#0F172A` | `#F8FAFC` | Texto principal |
| `--card` | `#FFFFFF` | `#1A1A1A` | Fondo cards |
| `--muted` | `#F1F5F9` | `#262626` | Fondos secundarios |
| `--muted-foreground` | `#64748B` | `#A1A1AA` | Texto secundario |
| `--border` | `#E2E8F0` | `rgba(255,255,255,0.1)` | Bordes |
| `--destructive` | `#EF4444` | `#F87171` | Errores, rechazados |
| `--success` | `#22C55E` | `#4ADE80` | Aprobados, activos |
| `--warning` | `#F59E0B` | `#FBBF24` | Pendientes, atención |

### Colores de estado (pre-inscripciones, badges)

| Estado | Light bg | Light text | Dark bg | Dark text |
|--------|----------|-----------|---------|-----------|
| Pendiente | `#FEF3C7` | `#92400E` | `#78350F` | `#FDE68A` |
| En revisión | `#DBEAFE` | `#1E40AF` | `#1E3A8A` | `#93C5FD` |
| Aprobada | `#DCFCE7` | `#166534` | `#14532D` | `#86EFAC` |
| Rechazada | `#FEE2E2` | `#991B1B` | `#7F1D1D` | `#FCA5A5` |
| Inactivo | `#F1F5F9` | `#475569` | `#334155` | `#94A3B8` |

---

## Tipografía

### Font family
- **Sans (principal):** Geist Sans — `var(--font-geist-sans)`
- **Mono (código):** Geist Mono — `var(--font-geist-mono)`

### Escala tipográfica (mobile → desktop)

| Elemento | Mobile | Tablet (sm) | Desktop (lg) | Weight | Line-height |
|----------|--------|-------------|--------------|--------|-------------|
| **Hero título** | `text-3xl` (30px) | `text-5xl` (48px) | `text-6xl` (60px) | `font-bold` (700) | 1.1 |
| **Sección título** | `text-2xl` (24px) | `text-3xl` (30px) | `text-4xl` (36px) | `font-bold` (700) | 1.2 |
| **Sección subtítulo** | `text-base` (16px) | `text-lg` (18px) | `text-lg` (18px) | `font-normal` (400) | 1.5 |
| **Card título** | `text-lg` (18px) | `text-lg` (18px) | `text-xl` (20px) | `font-semibold` (600) | 1.3 |
| **Página título (admin)** | `text-xl` (20px) | `text-2xl` (24px) | `text-2xl` (24px) | `font-bold` (700) | 1.3 |
| **Body** | `text-sm` (14px) | `text-sm` (14px) | `text-base` (16px) | `font-normal` (400) | 1.6 |
| **Caption/Auxiliar** | `text-xs` (12px) | `text-xs` (12px) | `text-sm` (14px) | `font-normal` (400) | 1.4 |
| **Nav links** | `text-sm` (14px) | `text-sm` (14px) | `text-sm` (14px) | `font-medium` (500) | 1.4 |
| **Badge text** | `text-xs` (12px) | `text-xs` (12px) | `text-xs` (12px) | `font-medium` (500) | 1 |

---

## Espaciado

### Secciones públicas
- Padding vertical: `py-16 sm:py-20 lg:py-24`
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Gap entre secciones: `space-y-16 sm:space-y-24`

### Admin
- Padding general: `p-4 sm:p-6`
- Gap entre bloques: `space-y-4` o `space-y-6`
- Card padding: `p-3` (mobile), `p-4` (desktop)
- Grid gap: `gap-2` (tight), `gap-3` (normal), `gap-4` (loose)

---

## Componentes

### Botones

| Variante | Light | Dark | Uso |
|----------|-------|------|-----|
| **Primary** | bg-blue-500 text-white | bg-blue-500 text-white | CTA principal ("Inscribite") |
| **Primary hover** | bg-blue-600 | bg-blue-400 | |
| **Secondary** | bg-gold-500 text-blue-700 | bg-gold-500 text-blue-800 | CTA secundario ("Asociate") |
| **Secondary hover** | bg-gold-600 | bg-gold-400 | |
| **Outline** | border-white text-white | border-white text-white | Sobre fondos oscuros ("Ingresar") |
| **Outline hover** | bg-white/10 | bg-white/10 | |
| **Ghost** | text-muted-foreground | text-muted-foreground | Acciones terciarias |
| **Destructive** | bg-destructive text-white | bg-destructive text-white | Acciones peligrosas |

Tamaños:
- Default: `h-10 px-4 text-sm rounded-md`
- Large (público): `h-12 px-6 text-base rounded-lg`
- Small: `h-8 px-3 text-xs rounded-md`
- Icon: `h-10 w-10 rounded-md`

### Cards

| Contexto | Estilo |
|----------|--------|
| **Admin** | `bg-card border rounded-lg shadow-none` |
| **Público** | `bg-card border rounded-xl shadow-sm hover:shadow-lg transition-shadow` |
| **Público destacada** | `bg-gradient-to-br from-blue-50 to-white border-blue-200 dark:from-blue-950 dark:to-card` |
| **Público sobre color** | `bg-white/10 backdrop-blur border-white/20 text-white` |

### Badges

| Variante | Estilo | Uso |
|----------|--------|-----|
| `default` | bg-blue-500 text-white | Activo, capitán |
| `secondary` | bg-muted text-muted-foreground | Inactivo |
| `outline` | border text-foreground | Info neutral |
| `gold` | bg-gold-500 text-blue-800 | Destacado |
| `destructive` | bg-destructive text-white | Error, rechazado |
| `success` | bg-green-500 text-white | Aprobado |
| `warning` | bg-amber-500 text-white | Pendiente |

### Inputs (público)

```css
/* Form inputs en páginas públicas (más grandes, más cómodos) */
.public-input {
  @apply h-12 text-base rounded-lg border-2 border-border
         focus:border-[#3A8FC5] focus:ring-2 focus:ring-[#3A8FC5]/20
         transition-colors;
}
```

### Inputs (admin)
Usar shadcn defaults: `h-10 text-sm rounded-md`

---

## Layout público

### Header
- Sticky `top-0 z-50`
- `bg-background/95 backdrop-blur border-b`
- Height: `h-16` (mobile), `h-16` (desktop)
- Logo: `h-8 w-auto`
- Nav links: hidden mobile, visible `md:`
- Mobile: hamburger menu → fullscreen overlay
- CTA "Ingresar": outline button top right

### Footer
- Background: `bg-[#1E3A5F]` (light mode), `bg-[#0F172A]` (dark mode)
- Text: white / white/70 para secundario
- 4 columnas en desktop, stack en mobile
- Logo + copyright abajo
- Links: Términos, Privacidad, Contacto

### Secciones alternadas (home)
| Sección | Light bg | Dark bg |
|---------|----------|---------|
| Hero | Gradient blue→navy | Gradient blue→navy |
| Próximos eventos | `bg-background` | `bg-background` |
| Ligas y torneos | `bg-muted` | `bg-muted` |
| Capitanes | `bg-background` | `bg-background` |
| Staff | `bg-muted` | `bg-muted` |
| Asociate CTA | Gradient gold | Gradient gold→amber |
| Contacto | `bg-background` | `bg-background` |

---

## Responsive breakpoints

Tailwind 4 defaults:
| Breakpoint | Min-width | Dispositivo |
|-----------|-----------|-------------|
| (default) | 0px | Mobile portrait |
| `sm:` | 640px | Mobile landscape / Small tablet |
| `md:` | 768px | Tablet portrait |
| `lg:` | 1024px | Tablet landscape / Small desktop |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Large desktop |

### Grids por breakpoint

| Componente | Mobile | sm | md | lg | xl |
|-----------|--------|----|----|----|----|
| Equipos | 1 col | 2 col | 2 col | 3 col | 3 col |
| Capitanes | 2 col | 2 col | 3 col | 4 col | 4 col |
| Staff | 1 col | 2 col | 2 col | 3 col | 4 col |
| Eventos | scroll-x | scroll-x | 2 col | 3 col | 3 col |
| Stats cards | 2 col | 2 col | 4 col | 4 col | 4 col |
| Form steps | 1 col | 1 col | 1 col | 1 col | 1 col |

---

## Dark mode

- Toggle en header (admin) y header (público)
- Usa `next-themes` con `attribute="class"`
- Todas las secciones deben funcionar en ambos modos
- Hero y CTA Asociate mantienen sus gradients en ambos modos (son brand)
- Footer es dark en ambos modos

### Checklist dark mode
- [ ] Textos legibles (contraste mínimo 4.5:1)
- [ ] Bordes visibles pero sutiles (`border-white/10`)
- [ ] Cards diferenciables del fondo
- [ ] Badges con colores ajustados
- [ ] Inputs con bordes visibles
- [ ] Hover states funcionales
- [ ] Imágenes/logos con fondo transparente funcionan
- [ ] Gradients no se "lavan"

---

## Iconos

- Librería: `lucide-react`
- Tamaño estándar: `h-4 w-4` (admin), `h-5 w-5` (público)
- Tamaño hero/CTA: `h-6 w-6`
- En botones: icon + texto en desktop, solo icon en mobile
- Color: `text-muted-foreground` (neutral), `text-[#3A8FC5]` (brand), `text-[#F2C531]` (gold accent)

---

## Animaciones y transiciones

| Elemento | Propiedad | Duración | Easing |
|----------|----------|----------|--------|
| Botones hover | `background-color, border-color` | `150ms` | `ease` |
| Cards hover | `box-shadow, border-color` | `200ms` | `ease-out` |
| Page transitions | `opacity` | `200ms` | `ease-in-out` |
| Form steps | `opacity, transform` | `300ms` | `ease-out` |
| Mobile menu | `opacity` | `150ms` | `ease` |
| Tooltips | `opacity` | `100ms` | `ease` |

---

## Logo

### Versiones requeridas por tenant
| Versión | Uso | Formato | Tamaño mín |
|---------|-----|---------|------------|
| Logo principal | Header, hero, materiales | PNG/SVG | 512×512px |
| Logo dark mode | Header/hero en dark mode | PNG/SVG | 512×512px |
| Favicon | Tab del browser | ICO/PNG | 32×32px |
| OG Image | Compartir en redes | PNG | 1200×630px |
| Logo small | Badges, avatars | PNG/SVG | 64×64px |

### Hindu Club
- Logo: círculo azul #3A8FC5 con letras "CH" en dorado #F2C531
- Ubicación: `/public/hindu-logo.png`
- Funciona en ambos modos (fondo transparente sobre azul sólido)

---

## Performance

### Imágenes
- Usar `next/image` con `priority` para above-the-fold
- Formatos: WebP preferido, PNG fallback
- Lazy loading para below-the-fold
- Sizes attribute para responsive images

### Fonts
- Geist Sans/Mono: preloaded via `next/font/google`
- `display: swap` para evitar FOIT

### CSS
- Tailwind purge automático
- No CSS-in-JS
- CSS custom properties para theming (oklch)

### Bundle
- Dynamic imports para componentes pesados
- Route-based code splitting (automático Next.js)
- No dependencias innecesarias

---

## Seguridad (páginas públicas)

### Forms
- Validación client-side + server-side
- Server actions con sanitización de inputs
- CSRF protection (built-in Next.js server actions)
- Rate limiting (futuro, Sprint 13)
- Honeypot fields para anti-spam (futuro)

### Datos
- RLS en Supabase: lectura pública de config, inserción pública de pre_inscripciones
- No exponer IDs internos en URLs públicas cuando no sea necesario
- Sanitizar HTML en contenido configurable (terminos, privacidad)
- No mostrar datos sensibles (emails completos, teléfonos) en páginas públicas

### Headers
- CSP headers (futuro, Sprint 15)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

---

## SEO

### Metadata por página
| Página | Title | Description |
|--------|-------|-------------|
| Home | `{nombre_display} - {slogan}` | `{descripcion}` |
| Equipos | `Equipos - {nombre_display}` | `Conocé los equipos de {nombre_display}` |
| Equipo detalle | `{equipo.nombre} - {nombre_display}` | `{categoria} - {torneo}` |
| Asociate | `Inscribite - {nombre_display}` | `{asociate_bajada}` |
| Términos | `Términos y condiciones - {nombre_display}` | |
| Privacidad | `Política de privacidad - {nombre_display}` | |

### Open Graph
- `og:type`: website
- `og:image`: OG image del tenant o logo
- `og:locale`: es_AR

### Schema.org
- SportsOrganization en home
- SportsTeam en páginas de equipo

---

**Última actualización:** 2026-05-05
**Versión:** Sprint 8
**Owner:** Yair Levy Wald
