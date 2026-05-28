# ADR-063 — Modelo invitados, notificaciones, control de acceso y asistencias de eventos

**Estado**: Accepted
**Fecha**: 28-may-2026
**Fuente de verdad**: Drive `_Arquitectura/ADR-063-modelo-invitados-notificaciones-control-acceso-asistencias-eventos`

## Contexto

El módulo de eventos necesitaba un modelo completo para invitaciones (persona/equipo/entidad/email externo), notificaciones asociadas, control de acceso con códigos y tokens, y registro de asistencia.

## Decisión

- Invitados polimórficos: `evento_invitados` con `invitado_tipo` (persona/equipo/entidad/email_externo) y expansión de equipo a personas individuales.
- Tokens de respuesta con expiración para aceptar/rechazar sin autenticación.
- Códigos de acceso por evento (manual o auto-generado) en tabla `evento_codigos_acceso`.
- Links de registro públicos en `evento_link_registro`.
- Notificaciones automáticas al invitar, aceptar y rechazar vía `modules/notificaciones`.
- Registro de asistencia en `evento_acceso_registro` (skeleton, activación post-F3).

## Consecuencias

- Cada invitación genera notificación in-app.
- Los equipos se expanden a sus personas activas al crear invitaciones.
- El modelo soporta tanto invitados internos (persona del tenant) como externos (email).

## Referencias

- Implementado en sprints A4.1 y A4.2
- Ver `modules/eventos/lib/actions.ts` para la implementación
