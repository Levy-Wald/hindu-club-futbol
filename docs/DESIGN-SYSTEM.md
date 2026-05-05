# Design System

## Paleta de colores

Usamos las CSS variables de shadcn/ui (modo claro y oscuro soportados):
- `--background` / `--foreground` — fondo y texto principal
- `--primary` / `--primary-foreground` — acciones principales
- `--secondary` — acciones secundarias
- `--muted` / `--muted-foreground` — texto y fondos atenuados
- `--destructive` — acciones peligrosas (eliminar)
- `--border` — bordes

No usar colores hex hardcodeados. Siempre usar variables del tema.

## Tipografia

- Font: system font stack (via Tailwind)
- Titulos de pagina: `text-xl sm:text-2xl font-bold`
- Subtitulos de seccion: `text-lg font-semibold`
- Texto body: `text-sm` (14px)
- Texto auxiliar: `text-xs text-muted-foreground`

## Espaciado

- Entre secciones: `space-y-4` o `space-y-6`
- Padding de cards: `p-3` mobile, `p-4` desktop
- Gap en flex/grid: `gap-2` (tight), `gap-3` (normal), `gap-4` (loose)

## Iconos

- Libreria: `lucide-react`
- Tamano estandar: `h-4 w-4`
- En botones: icon + texto en desktop, solo icon en mobile:
  ```tsx
  <Icon className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Texto</span>
  ```

## Badges

- Estado activo: `<Badge variant="default">`
- Estado inactivo: `<Badge variant="secondary">`
- Info/metadata: `<Badge variant="outline">`

## Tablas

- Desktop: componente `Table` de shadcn
- Mobile: cards con datos relevantes
- Siempre incluir estado vacio con mensaje descriptivo

## Formularios

- Inputs con `Label` arriba
- Select para opciones finitas (< 20 items)
- Combobox para opciones muchas (> 20 items) con busqueda
- Switch para booleans
- Textarea para texto largo

## Dialogs

- Usar para acciones que requieren input (crear, editar)
- Titulo claro de la accion
- Boton de submit con texto descriptivo ("Crear equipo", no "Aceptar")
- Cerrar automaticamente al completar con exito

---

## Auditoria de consistencia (checklist periodico)

Usar para revisar la UI cuando se acumulan varios sprints:

| Dimension | Que verificar |
|-----------|---------------|
| Color | Estamos usando variables del tema o hay hex sueltos? |
| Tipografia | Jerarquia clara h1 > h2 > h3 > body? |
| Espaciado | Scale consistente (space-y-4, gap-2/3/4) o valores arbitrarios? |
| Componentes | Elementos similares se ven igual en todos los modulos? |
| Responsive | Funciona en mobile (320px) y desktop (1280px)? |
| Dark mode | Completo o hay partes rotas? |
| Estados vacios | Todos los listados tienen mensaje cuando no hay datos? |
| Loading | Botones deshabilitados durante submit? |
| Hover/Focus | Todos los interactivos tienen feedback visual? |
| Consistencia | Mismo patron de tabla/cards en personas, equipos, padrones? |

Cada dimension se puede puntuar 0-10. Objetivo: >7 en todas.
