> 🪞 **ESPEJO read-only — NO editar acá.** Fuente única (un dato, una fuente):
> https://github.com/Levy-Wald/servicios-clevel-os/blob/main/docs/canon/metodologia-ecosistema.md
> Copiado por el orquestador SCL (rollout de canon, 2026-07-31) para que cada nodo lea el canon
> local desde su buzón. Si cambia, cambia en la FUENTE y se re-sincroniza — no lo edites acá.

---

# Metodología del ecosistema — cómo trabaja TODO el árbol SCL

> **Constitución operativa del ecosistema.** Cómo trabaja cada nodo (repo + proyecto Zoho + Drive) y cómo
> se comunican entre sí, en todos los niveles. Es un **mapa fino**: el detalle vive en
> [`DOCTRINA-HOLDING`](../DOCTRINA-HOLDING.md) (gobierno/anti-drift) y [`DOCTRINA-AUTONOMIA`](../DOCTRINA-AUTONOMIA.md)
> (buzón/robots). Acá va el modelo entero en una página. Aceptada 2026-07-29.

## 1. El modelo es FRACTAL

El ecosistema es un **árbol**. Cada "OS" orquesta a sus hijos con el mismo mecanismo, en cada nivel:

```
SCL holding  (servicios-clevel-os)              ← OS del holding · nivel 0
   └── orquesta los 9 BPE + nodos del holding
        └── Agencia Fractional cLevel           ← nodo del holding · Y OS de sus clientes · nivel 1
             └── orquesta repos/proyectos de clientes
                  ├── Cliente A  (repo + Zoho + Drive)   ← nivel 2
                  ├── Cliente B
                  └── Cliente C
```

**La agencia es a sus clientes lo que SCL es al holding**, un escalón más abajo. El patrón se repite hacia abajo
sin límite: cualquier nodo con hijos es el "OS" de ellos.

## 2. Las 4 patas que TODO nodo comparte

Un nodo "está en la metodología" cuando tiene las cuatro:

1. **Superficies finas** — `CLAUDE.md` (boot doc), `ESTADO-ACTUAL.md` (ejecución), `README.md` (humanos). Cada una
   con **un solo trabajo**, apuntando a la fuente única (nunca duplican: `entities`, Zoho, Drive).
2. **Harness estándar** — `.claude/` con cierre §9 (`cerrar-tarea` + `stop-gate`: no puede mentir verde) + el
   **sobre de permisos** (allow git/gh/edit · deny mergear/cerrar/force/destructivo/plata/mensajes afuera). Molde
   clonable en [`harness/kit/`](../../harness/README.md).
3. **Buzón** — [`buzon.yml`](../../.github/workflows/buzon.yml): un issue con label `inbox`/`inbox:urgent` despierta
   al robot al instante. Auth = `ANTHROPIC_API_KEY` (ver DOCTRINA-AUTONOMIA para el porqué y los gotchas).
4. **Comunicación por superficies** — un nodo le deja trabajo a otro con un issue `inbox` (emisión = `cerrar-tarea §4↔`)
   y actualiza sus propias superficies. **Nunca sesión-a-sesión.** Un dato, una fuente.

## 3. Autoridad baja, comunicación sube

Dos direcciones, dos reglas distintas — esto es lo que evita el quilombo sin encorsetar:

- **Hacia ABAJO (ancestro → descendiente): autoridad total y TRANSITIVA.** Un nodo puede **ejecutar** sobre
  cualquier descendiente, sea hijo directo o no. **Puede saltear niveles:** SCL puede entrar directo a un cliente de
  la agencia, por encima de la agencia.
  - **Cortesía obligatoria al saltear:** si ejecutaste sobre un descendiente NO directo (te salteaste un intermedio),
    al terminar **le avisás al/los nivel(es) saltado(s)** (issue `inbox` + superficies) para que su estado no quede
    desactualizado. Saltear y ejecutar está permitido; saltear **sin avisar** = drift (prohibido).
- **Hacia ARRIBA (descendiente → ancestro): leer todo + avisar, NUNCA ejecutar.** Un descendiente **lee todo** lo de
  arriba y puede **mandar mensajes/pedidos** hacia arriba (issues `inbox`), pero **no ejecuta** sobre sus superiores.
  Si necesita algo de arriba, lo pide; el de arriba decide y ejecuta.

Por defecto el trabajo fluye **fractal** (cada OS orquesta a sus hijos y no se mete de más), pero un superior puede
bajar directo cuando hace falta — con el aviso. Los hermanos no se cruzan directo (uno no es ancestro del otro):
se hablan subiendo al ancestro común.

## 3.bis Espera no-bloqueante

Cuando un nodo escala una orden/pedido hacia arriba (§3, comunicación sube) **no se queda parado bajo la lluvia**:
marca la tarea *pendiente* y **sigue con todo lo demás que no dependa de esa respuesta**. **Se bloquea la rama, no
el árbol.** Cuando la respuesta baja, retoma donde dejó. Bloquear el nodo entero por un pendiente es el anti-patrón
(el contraste con el mundo militar).

- **Bloqueante total** = bloquea SOLO si el nodo de abajo **no puede avanzar en NADA más** sin esa respuesta. Todo lo
  demás es no-bloqueante: se sigue.
- Las **tareas humanas** que suben (decisión/mano de Yair, terceros) convergen en la **Mesa del CEO** (Zoho, proyecto
  `SCL · Tareas Humanas — Mesa del CEO`, grupo `2651844000000465123`) — el gemelo humano del buzón de máquina. El nodo
  de origen deja un **puntero** y sigue; la Mesa es dueña del estado. Detalle: [`rfc-tareas-humanas-holding.md`](rfc-tareas-humanas-holding.md).

## 4. Autonomía por nivel

| Nivel | Autonomía | Nota |
|---|---|---|
| Holding (nodos de SCL) | **Full** | buzón + robots + auto-merge de **docs** (gate determinista). Código = siempre PR, merge humano. |
| Clientes (nodos de la agencia) | **Full** (mismo sobre) | igual que el holding. "Full" nunca mergea código solo — el sobre lo deniega; solo docs se auto-mergean. |

El **sobre de permisos es idéntico en todos los niveles**: esa uniformidad es lo que hace segura la autonomía full
incluso en repos de clientes.

## 4.bis QA final de producto — se corre en el holding

Caso especial de "comunicación sube" (§3), **load-bearing**: el nodo hace su QA **técnica**; el
holding hace la QA **final de producto**.

- **QA técnica (del nodo):** tests, smoke, build, typecheck — el verde de máquina. Es del nodo y
  no cambia.
- **QA final / aceptación (del holding):** cuando un producto o servicio llega a *"listo para
  probar de verdad"*, el nodo **NO se auto-aprueba**. Escala un pedido de **QA final** hacia
  arriba (issue `qa-final`). El **equipo directivo** (Yair + el orquestador SCL) corre la **prueba
  real de producto desde Empresa** — la validación de aceptación, no el smoke técnico — y **baja
  una devolución**: aprobado / cambios / rechazado.
- Recién con esa devolución el nodo marca el producto **"verde de aceptación"**. Sin ella, *"está
  probado"* es declaración del nodo, no hecho — y el tablero lo trata así: **el `probado` que
  prende verde lo enciende el holding, no el nodo**.

Por qué: la prueba técnica dice *"funciona"*; la de producto dice *"sirve y está listo para un
cliente"* — y ese juicio es del equipo directivo, no de quien lo construyó. Misma lógica que
autoridad-baja/comunicación-sube: el nodo entrega y pide validación; el de arriba valida y decide.

## 5. Propagación — también fractal

- **SCL** manda la alineación a los nodos del holding (incluida la agencia).
- **La agencia** la replica a SUS clientes: rollout del harness (`harness/kit/`) por repo + el mensaje. Es su trabajo
  por defecto (fractal). SCL **puede** bajar directo a un cliente si hace falta (autoridad transitiva) — avisándole
  a la agencia al terminar (§3).
- **Bootstrap:** un repo sin harness todavía no recibe por buzón (no tiene robot). Ese primer rollout es **por-repo,
  con el repo quieto**, y lo dispara el dueño del escalón (o un ancestro, con aviso).

## 6. En una línea

Cada nodo reporta igual (4 patas). La **autoridad baja** (un superior puede todo sobre sus descendientes, salteando
niveles, avisando si saltea); la **comunicación sube** (un inferior lee todo y avisa, pero no ejecuta hacia arriba).
Todo por issues `inbox` con cierre que no puede mentir verde. El patrón se repite en cada escalón. Eso es todo.
