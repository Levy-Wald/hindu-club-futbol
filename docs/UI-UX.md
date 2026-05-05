# Estandares UI/UX

## Framework visual

- **Tailwind 4** para estilos utilitarios
- **shadcn/ui v4** para componentes base (usa `render` prop, NO `asChild`)
- **Lucide React** para iconos
- **Sonner** para toasts/notificaciones

## Responsive design

- Mobile-first: disenar para mobile, expandir a desktop.
- Breakpoints clave: `sm:` (640px), `md:` (768px), `lg:` (1024px).
- Patron comun: cards en mobile, table en desktop:
  ```tsx
  <div className="sm:hidden">  {/* Mobile cards */}</div>
  <div className="hidden sm:block">  {/* Desktop table */}</div>
  ```

## Patrones de layout

### Paginas de lista
- Header con titulo + acciones (crear, exportar)
- Tabla/cards con datos
- Filtros inline o en toolbar

### Paginas de detalle
- Header sticky con back button + titulo + badge de estado
- Contenido en tabs agrupadas por dominio logico
- Acciones contextuales en cada seccion

### Formularios
- Inline cuando son simples (edit in place)
- Dialog cuando son modales (crear nuevo item)
- Labels siempre visibles (no solo placeholders)
- Validacion con feedback inmediato

## Componentes shadcn/ui v4

Diferencias clave con versiones anteriores:
- `Select` usa `render` prop en `SelectTrigger`:
  ```tsx
  <SelectTrigger render={<SelectButton />} />
  ```
- `Dialog` usa `render` en `DialogTrigger`:
  ```tsx
  <DialogTrigger render={<Button>Abrir</Button>} />
  ```
- NO usar `asChild` — deprecated en v4.

## Feedback al usuario

- `toast.success()` despues de mutaciones exitosas
- `toast.error()` para errores
- Loading states con `disabled` en botones durante submit
- Texto descriptivo en estados vacios ("No hay miembros activos")

## Accesibilidad minima

- Todos los botones con texto o `aria-label`
- Contraste suficiente (usar variables de shadcn)
- Focus visible en elementos interactivos
- Formularios con `label` asociado a `input`
- Keyboard navigation en dropdowns y modals

## Patrones React aplicables

### Custom hooks utiles
- `useDebounce(value, delay)` — para filtros de busqueda en listas
- `useToggle()` — para estados open/closed de dialogs

### Error Boundary
Wrappear secciones que cargan datos independientes para que un error no rompa toda la pagina.

### Lazy loading
Componentes pesados que no se ven en initial render:
```tsx
const HeavyComponent = dynamic(() => import('./HeavyComponent'))
```

### Memoizacion
- `useMemo` para calculos costosos (sorting, filtering grandes listas)
- `useCallback` para funciones pasadas a child components con `React.memo`
- No memoizar por defecto — solo cuando hay un problema de performance real

### Virtualizacion (Sprint 4+)
Para listas de 200+ items, considerar `@tanstack/react-virtual` en vez de renderizar todo.

## Performance frontend

- Server Components por defecto (no agregan JS al bundle)
- `Promise.all` para queries independientes en paralelo
- No `select('*')` en listas — solo columnas visibles
- `revalidatePath` despues de mutations (no cache manual)
- `next/image` para fotos de perfil y assets
- Preferir funciones nativas (`Intl.DateTimeFormat`) sobre librerias de fecha
- No agregar dependencias grandes sin justificacion

## Idioma UI

- Espanol rioplatense
- Tuteo informal ("Agregar", "Exportar", no "Agregue" o "Exporte")
- Sin jerga tecnica visible al usuario final
