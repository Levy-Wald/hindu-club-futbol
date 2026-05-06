# Estándares UI/UX

## Framework visual

- **Tailwind 4** para estilos utilitarios
- **shadcn/ui v4** para componentes base (usa `render` prop, NO `asChild`)
- **Lucide React** para iconos
- **Sonner** para toasts/notificaciones
- **next-themes** para dark mode (attribute="class")

## Responsive design

- Mobile-first: diseñar para mobile, expandir a desktop.
- Breakpoints clave: `sm:` (640px), `md:` (768px), `lg:` (1024px).
- Patrón común: cards en mobile, table en desktop:
  ```tsx
  <div className="sm:hidden">  {/* Mobile cards */}</div>
  <div className="hidden sm:block">  {/* Desktop table */}</div>
  ```

## Patrones de layout

### Páginas de lista
- Header con título + acciones (crear, exportar)
- Barra de búsqueda + filtros
- Tabla/cards con datos + checkboxes de selección
- SelectionBar para export parcial
- Columnas configurables (VistasPanel)

### Páginas de detalle
- Header sticky con back button + título + badge de estado + acciones (editar, eliminar)
- Contenido en tabs agrupadas por dominio lógico
- Acciones contextuales en cada sección
- Botón eliminar con AlertDialog de confirmación

### Formularios
- Inline cuando son simples (edit in place)
- Dialog cuando son modales (crear nuevo item)
- Labels siempre visibles (no solo placeholders)
- Validación con feedback inmediato
- Sticky save bar para forms con muchos campos

### Formularios multi-step (estilo Typeform)
- State management con useState (sin dependencias extra)
- Indicador de progreso (steps/total)
- Navegación Anterior/Siguiente
- Validación por paso antes de avanzar
- Confirmación final antes de submit
- Usado en: pre-inscripción pública (`/asociate`), import de productos (4 pasos)

## Componentes shadcn/ui v4

Diferencias clave con versiones anteriores:
- `DropdownMenuTrigger` usa `render` prop:
  ```tsx
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
    <MoreHorizontal className="h-4 w-4" />
  </DropdownMenuTrigger>
  ```
- `AlertDialogTrigger` usa `render` prop:
  ```tsx
  <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
    <Trash2 className="h-3.5 w-3.5 sm:mr-2" />
    <span className="hidden sm:inline">Eliminar</span>
  </AlertDialogTrigger>
  ```
- `Select` usa `onValueChange` que puede pasar `string | null` → usar `v ?? ''`
- NO usar `asChild` — deprecated en v4.

## Upload de archivos

Todos los uploads en la plataforma deben mostrar las especificaciones del archivo:

```tsx
const FILE_SPECS = {
  logo:    { formats: 'PNG, SVG, WebP', maxSize: '2 MB', dimensions: '400×400 px' },
  favicon: { formats: 'PNG, ICO, SVG',  maxSize: '500 KB', dimensions: '32×32 o 64×64 px' },
  foto:    { formats: 'PNG, JPG, WebP', maxSize: '5 MB', dimensions: 'Libre' },
  documento: { formats: 'PDF, PNG, JPG', maxSize: '10 MB', dimensions: 'Libre' },
}
```

**Reglas de upload:**
- Mostrar formatos aceptados, peso máximo y dimensiones en cada campo
- Validar tipo y tamaño en client-side antes de subir
- Usar `upsert: true` para permitir reemplazo
- Storage bucket: `public-assets` (logos, branding), `private-documentos` (aptos, DNIs), `private-fotos-personales` (avatars)
- Políticas RLS: INSERT + UPDATE + DELETE en el bucket correspondiente

## Eliminación de registros

- Soft-delete con `AlertDialog` de confirmación
- Texto claro: "¿Eliminar {nombre}? Esta acción es permanente."
- Botón destructivo: `bg-destructive text-destructive-foreground`
- Protección financiera: si tiene movimientos, mostrar toast de error sugiriendo desactivar
- Disponible en: dropdown de lista (tres puntos) + botón en detalle

## Exportación

Todos los módulos soportan:
- **Formatos:** CSV, XLSX, PDF simple, PDF membretado
- **Modos:** exportar todo o solo seleccionados (via SelectionBar)
- **PDF membretado:** logo, nombre del club, dirección, email, web, fecha, usuario
- **PNG export:** `html-to-image` (toPng) para tarjeta jugador y plantel
- **ICS download:** archivos .ics generados client-side para eventos de calendario

## Feedback al usuario

- `toast.success()` después de mutaciones exitosas
- `toast.error()` para errores
- Loading states con `disabled` en botones durante submit
- Texto descriptivo en estados vacíos ("No hay miembros activos")
- `useTransition` + `startTransition` para server actions sin bloquear UI

## Accesibilidad mínima

- Todos los botones con texto o `aria-label`
- Contraste suficiente (usar variables de shadcn)
- Focus visible en elementos interactivos
- Formularios con `label` asociado a `input`
- Keyboard navigation en dropdowns y modals

## Patrones React

### Server vs Client Components
- Server Components por defecto (no agregan JS al bundle)
- `'use client'` solo con: useState, useEffect, onClick, onChange, useTransition
- `Promise.all` para queries independientes en paralelo
- No `select('*')` en listas — solo columnas visibles

### Custom hooks
- `useDebounce(value, delay)` — para filtros de búsqueda
- `useVistasColumns(key, defaults)` — columnas configurables por módulo

### Memoización
- `useMemo` solo cuando hay problema de performance real
- No memoizar por defecto

## Performance frontend

- `revalidatePath` después de mutations (no cache manual)
- `next/image` para fotos de perfil y assets
- Funciones nativas (`Intl.DateTimeFormat`) sobre librerías de fecha
- Dynamic imports para componentes pesados
- Route-based code splitting (automático Next.js)

## Idioma UI

- Español rioplatense
- Tuteo informal ("Agregar", "Exportar", no "Agregue")
- Sin jerga técnica visible al usuario final
