# Próximo Sprint: 5 — Vínculos + Tutores/Padres + Bajas

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — qué hacer ahora

---

## Contexto rápido

**ClubCore** es una plataforma SaaS multi-tenant para clubes deportivos.
El tronco genérico sirve para todos los clientes (Hindu Club, Hacoaj, countries, capitanes amateur).
Los módulos se activan por tenant. La diferencia entre clientes es solo configuración.

**Estado actual:** Sprints 1-4 completos + UX transversal (vistas, export, búsqueda, filtros).
**Próximo:** Sprint 5.

---

## Qué hay que hacer en Sprint 5

### Objetivo
Sistema completo de vínculos persona-persona, vista de tutores/padres, y workflow de bajas.

### Entregables

#### 1. Vista dedicada de Vínculos (en ficha de persona, tab existente)
- Tabla de vínculos con: persona destino, tipo vínculo, estado, fechas
- Agregar vínculo: buscar persona + seleccionar tipo (padre, madre, cónyuge, hermano, etc.)
- Quitar vínculo (soft: activo=false)
- Los vínculos son bidireccionales en display (si A es padre de B, B muestra "hijo/a de A")

#### 2. Vista "Tutores/Padres" (nueva página o filtro en personas)
- Listar personas con atributo `padre_tutor`
- Mostrar sus vínculos con menores (personas con atributo `menor_de_edad`)
- Permitir filtrar por: tiene menor activo, no tiene menor vinculado

#### 3. Workflow de Bajas
- Acción "Dar de baja" en persona → pide motivo + fecha
- Propaga a padrones: cambia estado en `personas_padrones` a "baja"
- Vista "Bajas" que muestre: personas dadas de baja, motivo, fecha, quién las dio de baja
- Acción "Reactivar" (vuelve a activo)

### Tablas que ya existen (NO crear migrations)
- `personas_vinculos` — ya tiene: tipo_vinculo_slug, persona_origen_id, persona_destino_id, activo, fechas
- `personas.estado` — ya soporta: activo, pausado, baja, pendiente_revision
- `personas.motivo_baja`, `personas.fecha_baja` — ya existen
- `catalogo_vinculos` — ya tiene tipos: padre, madre, conyuge, hermano, tutor, etc.

### Patrón de código a seguir
Mirá cómo están hechos los módulos existentes:
```
app/admin/[modulo]/
├── page.tsx              # Server component, fetch + render
├── _lib/queries.ts       # Funciones de lectura (Supabase select)
├── _actions.ts           # Server actions (mutations con revalidatePath)
└── _components/          # Client components para UI interactiva
```

### Archivos relevantes
- `app/admin/personas/[id]/page.tsx` — ficha persona (tiene tab "Vínculos")
- `app/admin/personas/_actions.ts` — server actions de personas
- `app/admin/personas/_lib/queries.ts` — queries existentes
- `supabase/migrations/20260504220000_clubcore_init.sql` — schema completo (buscar "personas_vinculos")

---

## Reglas importantes

1. **NO crear migrations** a menos que sea estrictamente necesario (las tablas ya existen)
2. **shadcn v4 usa `render` prop**, NO `asChild`. Ej: `<DialogTrigger render={<Button />}>`
3. **searchParams en Next.js 16** es `Promise<Record<string, string | undefined>>`
4. **TENANT_ID hardcodeado** = `'11111111-1111-1111-1111-111111111111'` (Hindu Club piloto)
5. **Verificar build** antes de entregar: `pnpm build`
6. **No marcar como HECHO** sin `PENDIENTE_VALIDACION_VISUAL` si no probaste visualmente
7. **Actualizar MASTER-GAPS.md** al terminar

---

## Cuando termines Sprint 5

1. Correr `pnpm build` — debe pasar sin errores
2. Actualizar `MASTER-GAPS.md` marcando Sprint 5 como HECHO
3. Actualizar este archivo (`NEXT-SPRINT.md`) con el contenido del Sprint 6
4. Commit + push
5. Esperar validación visual de Yair antes de seguir con Sprint 6

---

## Sprint 6 (siguiente después de este)

**Externos + Federaciones + Fusiones**
- Vistas: Representantes Federaciones, Equipos Rivales
- Vistas: Jugadores/Staff Fusión
- Asignar representantes a entidades
- Jerarquía de entidades (entidad_padre_id)

(Detalle completo en MASTER-GAPS.md)

---

## Visión global (para no perderse)

```
Sprints 1-4:  ██████████████████ HECHO (datos, personas, padrones, equipos)
Sprint 5:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ← ESTÁS ACÁ (vínculos, bajas)
Sprints 6-8:  ░░░░░░░░░░░░░░░░░░ (externos, mi perfil, landing)
Sprints 9-11: ░░░░░░░░░░░░░░░░░░ (cajas, operaciones, empleados)
Sprints 12-14:░░░░░░░░░░░░░░░░░░ (comunicaciones, API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening → HINDU LIVE)
────────────────────────────────────────────────────────────────
Post-LIVE:    Capitán Oliver, bot WA, más disciplinas, countries
```

---

## Comando para arrancar

```bash
cd ~/hindu-v2
pnpm dev
# Abrir http://localhost:3000/admin/personas/[algún-id] → tab Vínculos
```
