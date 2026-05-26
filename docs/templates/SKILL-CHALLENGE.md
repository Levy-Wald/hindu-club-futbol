# /challenge — Pre-Mortem de Plan (adaptado a ClubCore)

Comando: `/challenge <plan o feature>`

Encuentra debilidades en un plan antes de que la realidad lo haga. No para matar el plan — para que sobreviva al contacto con la realidad.

---

## Cuando correr un Challenge

- Antes de arrancar un sprint nuevo
- Antes de agregar una tabla o cambio estructural a la DB
- Cuando un modulo depende de que varios otros esten listos
- Cuando hay presion por avanzar rapido sin validar
- Cuando el plan "suena bien" pero nadie lo cuestiono
- Antes de commitear algo irreversible (migraciones, APIs publicas, integraciones)

---

## Framework

### Paso 1: Extraer supuestos clave

Para cada parte del plan, preguntar:

- Que tiene que ser verdad para que esto funcione?
- Que estamos asumiendo sobre la capacidad de ejecucion?
- Que dependencias externas tiene (APIs, servicios, datos)?
- Que asumimos sobre el modelo de datos actual?
- Que asumimos sobre el comportamiento del usuario final?

**Categorias de supuestos para ClubCore:**

| Categoria | Ejemplos |
|-----------|----------|
| Modelo de datos | La tabla X soporta el caso Y, las FK son suficientes, RLS cubre el escenario |
| Ejecucion | Se puede hacer en 1 sprint, no requiere refactor previo |
| UX/Adopcion | El usuario va a entender la UI, el flujo es intuitivo |
| Multi-tenant | Funciona para Hindu y tambien para otro club futuro |
| Performance | N registros no van a degradar la query, la paginacion no es necesaria aun |
| Dependencias | Supabase soporta X, shadcn tiene componente Y, Next.js permite Z |
| Integracion | WhatsApp API, MercadoPago, federaciones — van a responder como esperamos |

### Paso 2: Calificar cada supuesto

**Confianza** (que tan seguro estas):
- **Alta** — Verificado con datos, probado, o ya funciona en otro modulo
- **Media** — Direccionalmente correcto pero no validado
- **Baja** — Plausible pero no testeado
- **Desconocida** — No sabemos

**Impacto si falla**:
- **Critico** — El plan falla entero, hay que rehacer
- **Alto** — Delay significativo o refactor grande
- **Medio** — Rework parcial
- **Bajo** — Ajuste menor

### Paso 3: Mapa de vulnerabilidades

```
Vulnerabilidad = Baja confianza + Alto impacto
```

Estos son los puntos donde el plan puede romperse. No son problemas a ignorar — son apuestas que estas haciendo. La pregunta es: las estas haciendo conscientemente?

### Paso 4: Cadena de dependencias

- El supuesto B depende de que A sea verdad primero?
- Si lo primero falla, cuantas cosas downstream se rompen?
- Cual es el camino critico? Que no tiene margen?

**Ejemplo ClubCore:**
```
"Exportar externos" → depende de → "Seccion externos implementada"
  → que depende de → "Modelo de datos de externos definido"
    → que depende de → "Decisiones sobre que es un externo vs persona"
```

### Paso 5: Reversibilidad

Para cada vulnerabilidad critica: si este supuesto resulta falso en semana 2, que haces?

- Se puede pivotar sin perder trabajo?
- Ya se corrio una migracion irreversible?
- Hay datos de usuario que dependen de esta estructura?
- Se puede hacer un rollback limpio?

**Regla ClubCore:** Las migraciones son el punto de no retorno mas comun. Validar supuestos ANTES de escribir la migracion.

---

## Formato de salida

```markdown
## Challenge Report: [Nombre del plan/feature]

### SUPUESTOS EXTRAIDOS
1. [Supuesto] — Confianza: [A/M/B/?] — Impacto: [Critico/Alto/Medio/Bajo]
2. ...

### MAPA DE VULNERABILIDADES

**Riesgos criticos (resolver antes de avanzar):**
- [#N] [Supuesto] — POR QUE podria ser falso — QUE se rompe si lo es

**Riesgos altos (validar antes de escalar):**
- ...

### CADENA DE DEPENDENCIAS
[Supuesto A] → habilita → [Supuesto B] → habilita → [Supuesto C]
Eslabon mas debil: [X] — si se rompe, [Y] y [Z] tambien fallan

### REVERSIBILIDAD
- Apuestas reversibles: [lista]
- Compromisos irreversibles: [lista — tratar con extremo cuidado]

### KILL SWITCHES
Que tendria que ser verdad en [1 semana / 1 sprint / 1 mes] para continuar vs pivotar?
- Continuar si: ...
- Pivotar si: ...

### ACCIONES DE HARDENING
1. [Validacion especifica antes de avanzar]
2. [Enfoque alternativo a considerar]
3. [Contingencia a incorporar al plan]
```

---

## Patrones de Challenge por tipo (ClubCore)

### Nueva tabla / migracion
- El modelo cubre TODOS los casos de uso conocidos, o solo el primero?
- Hay FK circulares o dependencias complejas?
- RLS va a funcionar sin recursion? (ver BUG-001)
- Soft delete vs hard delete: que pasa con las FK cuando se borra?
- El nombre de la tabla/columnas es consistente con el resto?

### Nuevo modulo UI
- El patron de modulo existente (queries/actions/components) aplica, o necesita algo nuevo?
- Funciona en mobile? (si no se puede probar, marcar PENDIENTE_VALIDACION_VISUAL)
- Los estados vacios estan manejados?
- La exportacion esta contemplada desde el dia 1?
- Que pasa con 0 registros, 1 registro, 500 registros?

### Integracion externa
- Que pasa si la API externa esta caida?
- Rate limits? Costos por request?
- Donde se guardan las credenciales? (nunca en codigo)
- Hay sandbox/test environment?
- Que pasa si cambian su API sin aviso?

### Feature cross-modulo
- Que modulos tienen que estar listos primero?
- Hay acoplamiento fuerte que dificulte cambios futuros?
- Se puede implementar incrementalmente o es todo-o-nada?
- Quien es responsable de cada parte?

### Sprint planning
- El scope es realista para 1 sprint?
- Hay unknowns que podrian explotar el tiempo estimado?
- Que se puede cortar sin perder valor?
- Hay dependencia de validacion de Yair que podria bloquear?

---

## Las preguntas mas dificiles

Las que la gente se saltea:

- "Cual es el peor caso, no el caso base?"
- "Si este plan lo ejecutara un equipo que no conoce el proyecto, funcionaria?"
- "Que no estamos diciendo en voz alta porque es incomodo?"
- "Estamos construyendo lo que el usuario necesita, o lo que es facil de construir?"
- "Que atacaria primero alguien que quiere que esto falle?"
- "Esto escala de Hindu a 10 clubes sin rehacer?"

---

## Resultado esperado

El output de `/challenge` no es permiso para frenar. Es un mapa de vulnerabilidades. Con eso podes:

1. **Validar** los supuestos riesgosos antes de comprometer recursos
2. **Hedgear** los criticos con contingencias
3. **Aceptar** conscientemente las apuestas que estas haciendo

Riesgos desconocidos son peligrosos. Riesgos conocidos son manejables.
