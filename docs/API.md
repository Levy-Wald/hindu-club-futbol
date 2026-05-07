# API REST v1

## Base URL

```
https://hindu-club.vercel.app/api/v1
```

## Autenticacion

Todas las requests requieren un header `Authorization` con Bearer token:

```
Authorization: Bearer cc_a1b2c3d4e5f6...
```

Las API keys se crean desde `/admin/integraciones`. El key completo se muestra una sola vez al crearlo.

## Rate Limiting

Cada API key tiene un limite configurable de requests por minuto (default: 60).
Si se excede, la API devuelve `429 Too Many Requests`.

## Scopes

Cada API key tiene scopes que limitan que endpoints puede usar:

| Scope | Descripcion |
|-------|-------------|
| `personas:read` | Leer personas |
| `personas:write` | Crear y editar personas |
| `equipos:read` | Leer equipos |
| `equipos:write` | Crear y editar equipos |
| `finanzas:read` | Leer finanzas |
| `finanzas:write` | Crear movimientos y cuotas |
| `eventos:read` | Leer eventos |
| `padrones:read` | Leer padrones |

## Endpoints

### GET /api/v1/personas

Lista personas del tenant.

**Scope:** `personas:read`

**Query params:**
- `q` — buscar por nombre, apellido o DNI
- `limit` — max 100, default 50
- `offset` — paginacion, default 0

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Juan",
      "apellido": "Perez",
      "dni": "12345678",
      "email_principal": "juan@mail.com",
      "telefono": "+5411...",
      "fecha_nacimiento": "1990-01-15",
      "genero": "masculino",
      "estado": "activo",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "total": 150, "limit": 50, "offset": 0 }
}
```

### POST /api/v1/personas

Crea una persona nueva. Deduplica por DNI.

**Scope:** `personas:write`

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Perez",
  "dni": "12345678",
  "email_principal": "juan@mail.com",
  "telefono": "+5411...",
  "fecha_nacimiento": "1990-01-15",
  "genero": "masculino"
}
```

**Responses:**
- `201` — creado exitosamente
- `409` — ya existe persona con ese DNI

### GET /api/v1/personas/:id

Detalle de una persona.

**Scope:** `personas:read`

### PATCH /api/v1/personas/:id

Actualiza campos de una persona.

**Scope:** `personas:write`

**Body:** objeto con los campos a actualizar (nombre, apellido, dni, email_principal, telefono, fecha_nacimiento, genero, estado, nacionalidad, direccion).

### GET /api/v1/equipos

Lista equipos del tenant.

**Scope:** `equipos:read`

**Query params:**
- `q` — buscar por nombre
- `limit` — max 100, default 50
- `offset` — paginacion, default 0

## Errores

Todos los errores devuelven JSON:

```json
{ "error": "Mensaje descriptivo" }
```

| Status | Significado |
|--------|-------------|
| 400 | Datos invalidos |
| 401 | Key faltante o invalida |
| 403 | Scope insuficiente |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: DNI duplicado) |
| 429 | Rate limit excedido |
| 500 | Error interno |

## Logs

Todas las requests se logean en `api_logs`. Se pueden consultar desde `/admin/integraciones` en la tab Logs. Los logs se retienen por 90 dias.
