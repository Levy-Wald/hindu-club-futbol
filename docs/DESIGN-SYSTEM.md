# Design System — Panel Admin

Sistema de diseño para el panel de administración. Para páginas públicas y branding, ver `docs/BRAND-DESIGN-SYSTEM.md`.

## Paleta de colores

Usamos las CSS variables de shadcn/ui (modo claro y oscuro soportados):
- `--background` / `--foreground` — fondo y texto principal
- `--primary` / `--primary-foreground` — acciones principales
- `--secondary` — acciones secundarias
- `--muted` / `--muted-foreground` — texto y fondos atenuados
- `--destructive` — acciones peligrosas (eliminar)
- `--border` — bordes
- `--accent` — fondos de hover

**Regla:** En el admin, usar siempre variables del tema. No usar colores hex hardcodeados.

**Excepción:** Las páginas públicas (`app/(public)/`) usan brand colors hex (`#3A8FC5`, `#F2C531`, `#1E3A5F`) definidos como CSS utilities (`bg-brand-hero`, `text-brand-blue`, etc.) — ver `BRAND-DESIGN-SYSTEM.md`.

## Tipografía

- **Font heading:** Configurable por tenant via `--font-heading` (default: Geist Sans)
- **Font body:** Configurable por tenant via `--font-body` (default: Geist Sans)
- **Font mono:** Geist Mono — `var(--font-geist-mono)`
- Fonts dinámicas cargadas desde Google Fonts según config en `tenant_config_publica`

### Escala

| Elemento | Clase | Uso |
|----------|-------|-----|
| Título de página | `text-xl sm:text-2xl font-semibold` | H1 en cada page |
| Subtítulo sección | `text-base font-semibold` | CardTitle |
| Descripción | `text-sm text-muted-foreground` | CardDescription |
| Texto body | `text-sm` (14px) | Contenido general |
| Texto auxiliar | `text-xs text-muted-foreground` | Labels, metadata |
| Texto micro | `text-[10px] text-muted-foreground` | Counters, tracking |

## Espaciado

- Entre secciones: `space-y-4` o `space-y-6`
- Padding de cards: `p-3` mobile, `p-4` desktop
- Gap en flex/grid: `gap-2` (tight), `gap-3` (normal), `gap-4` (loose)

## Iconos

- Librería: `lucide-react`
- Tamaño estándar: `h-4 w-4`
- En botones: icon + texto en desktop, solo icon en mobile:
  ```tsx
  <Icon className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Texto</span>
  ```

## Badges

| Variante | Uso |
|----------|-----|
| `default` | Activo, estado positivo |
| `secondary` | Inactivo, neutral |
| `outline` | Info/metadata |
| `destructive` | Error, rechazado |
| Custom success (bg-emerald) | Aprobado, completado |
| Custom warning (bg-amber) | Pendiente, atención |

## Tablas

- Desktop: componente `Table` de shadcn con checkboxes de selección
- Mobile: cards con datos relevantes
- Siempre incluir estado vacío con mensaje descriptivo
- Nombres clickeables → link al detalle
- Acciones en `DropdownMenu` (tres puntos), NO botones inline
- Columna de acciones: `<TableHead className="w-10" />`

## Formularios

- Inputs con `Label` arriba
- Select para opciones finitas (< 20 items)
- Combobox para opciones muchas (> 20 items) con búsqueda
- Switch para booleans (ej: activo/inactivo)
- Textarea para texto largo
- Uploads con specs visibles (formato, peso, dimensiones)

## Dialogs y AlertDialogs

- `Dialog` para acciones que requieren input (crear, editar)
- `AlertDialog` para confirmaciones destructivas (eliminar)
- Título claro de la acción
- Botón de submit con texto descriptivo ("Crear equipo", no "Aceptar")
- Cerrar automáticamente al completar con éxito

## Sticky save bar

Para formularios con muchos campos (ej: TenantForm, BrandingForm):
```tsx
<div className={`sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm
  ${isDirty ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
  <p>Cambios sin guardar</p>
  <Button onClick={handleSave}>Guardar cambios</Button>
</div>
```

---

## Auditoría de consistencia (checklist periódico)

| Dimensión | Qué verificar |
|-----------|---------------|
| Color | Variables del tema en admin, brand colors solo en público |
| Tipografía | Jerarquía clara h1 > h2 > h3 > body |
| Espaciado | Scale consistente (space-y-4, gap-2/3/4) |
| Componentes | Mismo patrón tabla/cards en todos los módulos |
| Responsive | Funciona en mobile (320px) y desktop (1280px) |
| Dark mode | Completo en admin y público |
| Estados vacíos | Todos los listados tienen mensaje |
| Loading | Botones deshabilitados durante submit |
| Eliminación | AlertDialog en todos los módulos que lo soportan |
| Uploads | Specs visibles (formato, peso, dimensiones) |
