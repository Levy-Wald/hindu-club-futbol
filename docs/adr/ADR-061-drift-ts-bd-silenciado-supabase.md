# ADR-061: Drift TS-BD silenciado por Supabase client

Fecha: 19 de mayo de 2026
Estado: Accepted
Contexto: B12.5.1 — mi-cuenta query con columnas inexistentes

## Problema

Cuando una query de Supabase JS client selecciona columnas que no
existen en la tabla (ej: `.select('foto_url, dni, email')` cuando las
columnas reales son `foto_perfil_url, numero_documento, email_principal`),
el client **no lanza error ni excepción**. Devuelve `null` (o `{ data: null }`)
silenciosamente.

Esto significa que:
- `pnpm tsc --noEmit` pasa (tipos generados no validan columnas en runtime)
- `pnpm run build` pasa
- Tests unitarios pasan (a menos que haya un test específico contra DB real)
- El bug solo se manifiesta en runtime con datos reales

## Caso real

`app/admin/(troncal)/mi-cuenta/page.tsx` usaba:
```
.select('id, nombre, apellido, foto_url, dni, email, telefono, ...')
```

Las columnas correctas eran:
- foto_url → foto_perfil_url
- dni → numero_documento
- email → email_principal
- telefono → telefono_principal

El resultado era `persona = null`, mostrando "No se encontró tu perfil"
aunque el usuario existía correctamente en la BD.

## Decisión

1. **Verificar queries nuevas contra BD real vía MCP** antes de marcar
   DONE. Al menos ejecutar la query SELECT contra producción y confirmar
   que devuelve datos.

2. **Para páginas críticas (mi-cuenta, mi-perfil, mi-equipo)**, las
   queries deben ser consistentes con el schema real. Usar `*` o
   verificar columnas contra `information_schema.columns`.

3. **No confiar en build/tsc para detectar drift de columnas**. El
   tipado de Supabase JS es genérico cuando se usan strings en `.select()`.

## Consecuencias

- Queries que fallen silenciosamente ahora se detectan antes del tag
- Smoke humano sigue siendo necesario para validar el flujo completo
- Code debe reportar "DONE técnico" (no "DONE") cuando no puede
  verificar visualmente en producción
