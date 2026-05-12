# RFC-001 — Sistema de visitantes externos

**Estado:** Implementado (FASE 3 cerrada al 100% el 12-may-2026)
**Fecha de creación:** 12 de mayo de 2026
**Fecha de aprobación:** 12 de mayo de 2026
**Autor:** Arquitecto (Claude Opus)
**Aplica a:** ClubCore v2 (cliente piloto: Hindu Club Fútbol)

## 1. Resumen ejecutivo

Hindu Club necesita gestionar **personas externas** (jugadores
rivales, sponsors, árbitros, padres de visitantes) que entran al
club por motivos puntuales y deben quedar trazadas: registradas
en padrón temporal, invitadas a eventos específicos, validadas
en la entrada por el guardia.

El sistema se construyó en 5 sprints (FASE 3 completa) con
5 piezas modulares:

| ID | Pieza | Capa | Sprint | Estado |
|---|---|---|---|---|
| P1 | Troncal: padrón temporal | 1 (Troncal CRM) | 3.4 | ✅ |
| P2 | Subidor universal con LLM | 2 (Módulo) | 9.x | Postergado |
| P3 | Módulo `nominas_externas` | 2 (Módulo nuevo) | 3.4 | ✅ |
| P4 | Módulo `asistencias` | 2 (Módulo) | 3.1 + 3.2 | ✅ |
| P5 | Módulo `acceso` | 2 (Módulo nuevo) | 3.3 + 3.5 | ✅ |

## 2. Flujo end-to-end implementado

```
Admin Hindu genera link → comparte manualmente
        ↓
Club rival abre link sin auth → carga personas/entidades
        ↓
Admin Hindu recibe nómina pendiente → revisa con matching fuzzy
        ↓
Admin confirma → persona se crea + membresía a padrón temporal
        ↓
Día del evento, guardia escanea DNI en /admin/acceso
        ↓
RPC verificar_acceso_persona consulta socios + invitaciones +
padrón temporal
        ↓
Veredicto VERDE con bloque "Visitante temporal"
```

## 3. Decisiones aprobadas (D1-D14)

Canonizadas el 12-may-2026, vinculantes para mantenimiento futuro:

- **D1** Persona ya socia → NO actualizar, alertar admin
- **D2** Token caduca 24h post-evento
- **D3** Padrón temporal queda histórico (no se borra)
- **D4** Guardia solo lee (no crea ni edita)
- **D5** Asistencia y acceso pueden divergir
- **D6** Input DNI por texto en pantalla guardia (no cámara/QR aún)
- **D7** Atributo `acceso.guardia` separado de admin técnico
- **D8** Invitación a evento de otra fecha → AMARILLO
- **D9** Asistencia con botón opcional (no automática al ingresar)
- **D10** Envío link en 3 fases (F1 manual MVP / F2 email FASE 16 / F3 WhatsApp FASE 10)
- **D11** Campos configurables por evento
- **D12** Link único permite personas + entidades (tabla polimórfica)
- **D13** 5 niveles validación L0-L4 + defaults por tipo_evento
- **D14** Sprint 3.4 grande con TODO (no partido)

## 4. Tablas creadas en FASE 3

- `acceso_logs` — audit trail de lecturas del guardia (Sprint 3.3)
- `nominas_externas` — links generados por admin (Sprint 3.4)
- `nomina_externa_items` — items cargados por rival (polimórfico) (Sprint 3.4)
- `catalogo_niveles_validacion` — L0-L4 (Sprint 3.4)
- `tipos_evento_validacion_default` — defaults por tipo (Sprint 3.4)
- `abuse_blocks` — rate limiting persistente (Sprint 3.4)

Columna extendida:
- `personas_padrones.fecha_vigencia_hasta` (Sprint 3.4)

Catálogo extendido:
- `padrones.tipo` con valor `visitantes_temporales` + CHECK constraint
  actualizado (Sprint 3.4 + fix en 3.5)

RPC extendida:
- `verificar_acceso_persona` con consulta a padrón temporal (Sprint 3.5)

## 5. Roadmap pendiente del RFC-001

Lo que queda de este RFC, postergado para FASES futuras:

| Pieza | Sprint | Disparador |
|---|---|---|
| Email automático al admin cuando llega nómina | FASE 16 | Resend real |
| Envío automático del link por email | FASE 16 | Resend real |
| Envío automático del link por WhatsApp | FASE 10 | Bot WhatsApp |
| Niveles L2-L4 funcionales | FASE 10+16 | Email/WhatsApp/OTP |
| Foto del cargador (L3) | Post-FASE 16 | Storage configurado |
| Subidor universal con LLM (P2) | Sprint 9.x | Infra LLM lista |
