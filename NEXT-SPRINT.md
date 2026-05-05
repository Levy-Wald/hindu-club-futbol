# Proximo Sprint: 6 — Externos + Federaciones + Fusiones

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — que hacer ahora

---

## Contexto rapido

**ClubCore** es una plataforma SaaS multi-tenant para clubes deportivos.
El tronco generico sirve para todos los clientes (Hindu Club, Hacoaj, countries, capitanes amateur).
Los modulos se activan por tenant. La diferencia entre clientes es solo configuracion.

**Estado actual:** Sprints 1-5 completos + UX transversal.
**Proximo:** Sprint 6.

---

## Que hay que hacer en Sprint 6

### Objetivo
Completar el modulo de entidades externas con vistas especializadas, representantes, y jerarquia.

### Entregables

#### 1. Vista "Representantes Federaciones"
- Filtrar entidades externas de tipo `federacion`
- Para cada federacion, mostrar sus representantes (personas vinculadas)
- Permitir asignar persona como representante de una entidad
- Tabla: Federacion, Representante, Telefono, Email, Estado

#### 2. Vista "Equipos Rivales"
- Filtrar entidades de tipo `club_externo`
- Mostrar datos de contacto, sede, disciplinas
- Permitir vincular con competencias (futuro)

#### 3. Vista "Jugadores/Staff Fusion"
- Personas con atributo `jugador_fusion` o `staff_fusion`
- Mostrar a que club externo estan vinculados
- Filtros por atributo, club externo

#### 4. Asignar representantes a entidades
- En detalle de entidad: seccion "Representantes"
- Buscar persona + asignar como representante
- Tabla `entidades_representantes` o usar `personas_atributos` + vinculo

#### 5. Jerarquia de entidades
- Campo `entidad_padre_id` en tabla `entidades`
- UI: mostrar entidad padre, entidades hijas
- Ejemplo: AFA → Liga Regional → Club local

### Tablas que ya existen
- `entidades` — nombre, tipo, cuit, telefono, email, sitio_web, direccion, etc.
- `catalogo_atributos` — tiene `jugador_fusion`, `staff_fusion`, `representante_federacion`, `representante_club_externo`
- `personas_atributos` — para marcar personas con estos atributos

### Tablas que PODRIAN necesitar migration
- `entidades.entidad_padre_id` — verificar si ya existe en el schema
- `entidades_representantes` — tabla pivote persona-entidad con rol, o usar personas_atributos

### Patron de codigo a seguir
Mira como estan hechos los modulos existentes:
```
app/admin/[modulo]/
├── page.tsx              # Server component, fetch + render
├── _lib/queries.ts       # Funciones de lectura (Supabase select)
├── _actions.ts           # Server actions (mutations con revalidatePath)
└── _components/          # Client components para UI interactiva
```

Todas las paginas nuevas deben tener: busqueda, filtros, vistas configurables, export multi-formato, mobile cards, checkboxes + SelectionBar.

### Archivos relevantes
- `app/admin/externos/page.tsx` — CRUD entidades ya hecho
- `app/admin/externos/_lib/queries.ts` — queries existentes
- `app/admin/externos/_actions.ts` — server actions
- `supabase/migrations/20260504220000_clubcore_init.sql` — schema (buscar "entidades")

---

## Reglas importantes

1. **Verificar schema** antes de crear migrations — las tablas pueden ya existir
2. **shadcn v4 usa `render` prop**, NO `asChild`. Ej: `<DialogTrigger render={<Button />}>`
3. **searchParams en Next.js 16** es `Promise<Record<string, string | undefined>>`
4. **TENANT_ID hardcodeado** = `'11111111-1111-1111-1111-111111111111'` (Hindu Club piloto)
5. **Verificar build** antes de entregar: `pnpm build`
6. **No marcar como HECHO** sin `PENDIENTE_VALIDACION_VISUAL` si no probaste visualmente
7. **Actualizar MASTER-GAPS.md** al terminar

---

## Cuando termines Sprint 6

1. Correr `pnpm build` — debe pasar sin errores
2. Actualizar `MASTER-GAPS.md` marcando Sprint 6 como HECHO
3. Actualizar este archivo (`NEXT-SPRINT.md`) con el contenido del Sprint 7
4. Commit + push
5. Esperar validacion visual de Yair antes de seguir con Sprint 7

---

## Sprint 7 (siguiente despues de este)

**Mi Perfil + Mi Equipo (vista jugador)**
- Pagina /mi-perfil (datos personales del user logueado)
- Documentos medicos (upload a storage privado)
- Pagina /mi-equipo segun rol del usuario
- Widgets: proxima actividad, referentes del equipo
- Vista de hijos para tutores (ver docs/MENORES-TUTORES.md)
- Vehiculos heredados por vinculo padre→hijo

(Detalle completo en MASTER-GAPS.md)

---

## Vision global (para no perderse)

```
Sprints 1-5:  ██████████████████████████ HECHO (datos, personas, padrones, equipos, vinculos, bajas)
Sprint 6:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ← ESTAS ACA (externos, federaciones, fusiones)
Sprints 7-8:  ░░░░░░░░░░░░░░░░░░ (mi perfil, landing)
Sprints 9-11: ░░░░░░░░░░░░░░░░░░ (cajas, operaciones, empleados)
Sprints 12-14:░░░░░░░░░░░░░░░░░░ (comunicaciones, API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening → HINDU LIVE)
────────────────────────────────────────────────────────────────
Post-LIVE:    Capitan Oliver, bot WA, mas disciplinas, countries
```

---

## Comando para arrancar

```bash
cd ~/hindu-v2
pnpm dev
# Abrir http://localhost:3000/admin/externos
```
