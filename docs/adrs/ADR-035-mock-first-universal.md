# ADR-035: Mock-first universal para integradores externos

Status: Accepted
Date: 2026-05-11
Related: ADR-031 (Arquitectura modular), ADR-033 (E2E obligatorios)

## Contexto

El sistema ClubCore v2 requiere integrarse con varios servicios externos a lo largo del roadmap: Resend (email), MercadoPago (pagos), WhatsApp Cloud API (mensajeria), AFIP (facturacion electronica). Estos integradores requieren credenciales, dominios, cuentas fiscales y aprobaciones operativas que no siempre estan disponibles cuando un sprint los necesita.

Construir un sprint contra credenciales reales acopla el desarrollo al ritmo de gestion administrativa externa. Esto bloquea el avance tecnico injustificadamente.

## Decision

Todos los integradores externos del sistema se desarrollan en modo **mock-first universal**. El switch a produccion real es una operacion **centralizada en FASE 16**.

Reglas:

1. Cada integrador externo se modela como `Adapter` pattern: una interface tipada + una implementacion `MockAdapter` que loguea pero no envia/cobra/factura nada real.
2. El default operativo (sin env var explicita) es siempre el adapter mock.
3. Los modulos consumidores importan la API tipada del integrador, no conocen ni pueden conocer el adapter activo.
4. FASE 16 es la unica fase donde se crean adapters reales (`ResendAdapter`, `MercadoPagoAdapter`, `WhatsAppAdapter`, `AFIPAdapter`) y se configura el switch via env var (`<INTEGRADOR>_MODE=mock|sandbox|production`).
5. La demo a Hindu Club (post-FASE 15) puede ejecutarse 100% en modo mock. No requiere credenciales externas. El switch a real ocurre despues, cuando Hindu/Yair coordinan acceso operativo.

## Alcance

Integradores actuales y proyectados sujetos a esta regla:

- Resend (modulo comunicaciones, FASE 2 -> switch en FASE 16)
- MercadoPago (modulo finanzas, FASE 7 -> switch en FASE 16)
- WhatsApp Cloud API (modulo bot, FASE 10 -> switch en FASE 16)
- AFIP (modulo finanzas, FASE 7 -> switch en FASE 16)

Cualquier integrador externo nuevo que se agregue en el futuro debe seguir esta regla por default.

## Consecuencias

- **Sprint FASE 2.2 original (Adapter Resend) se mueve a FASE 16.** FASE 2 queda con 5 sprints en vez de 6.
- El sistema puede operarse, demoearse y vender con cero dependencias externas activas.
- Cada adapter mock debe ser suficientemente fiel para validar el flujo completo (incluyendo error paths: envio fallado, pago rechazado, etc.).
- FASE 16 se expande con la implementacion real de Resend, ya estaba prevista.
- Hindu Club puede recibir el sistema completo en modo mock durante todo el ciclo de desarrollo y solo activar servicios externos cuando coordinen credenciales.

## Implementacion de referencia

Sprint 2.1 (Motor de comunicacion core, mock-first) implemento este patron:
- Interface `ComunicacionAdapter`
- Implementacion `MockAdapter`
- Factory `resolveAdapter()` que lee `COMUNICACIONES_MODE` del env
- API tipada `enviarComunicacion()` consumible por otros modulos

Sirve como template para los demas integradores.
