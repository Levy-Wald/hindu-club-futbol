-- Sprint 15c: Crear persona dedicada para tests E2E
-- Auth user e2e-test@levywald.com creado manualmente en Supabase Studio.
-- Password seteado en .env.local (E2E_USER_PASSWORD) y Vercel env vars.

-- 1. Crear persona E2E vinculada al auth user existente
INSERT INTO personas (
  id, tenant_id, user_id, nombre, apellido, email_principal,
  numero_documento, tipo_documento, fecha_alta_sistema
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  '21c56268-478e-4bce-84a4-72cede088a4b',
  'E2E', 'Test User',
  'e2e-test@levywald.com',
  '99999999', 'dni',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Asignar atributo staff (acceso basico al admin)
INSERT INTO personas_atributos (tenant_id, persona_id, atributo_slug)
SELECT
  '11111111-1111-1111-1111-111111111111',
  '99999999-9999-9999-9999-999999999999',
  slug
FROM unnest(ARRAY['staff']) AS slug
WHERE NOT EXISTS (
  SELECT 1 FROM personas_atributos
  WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
    AND persona_id = '99999999-9999-9999-9999-999999999999'
    AND atributo_slug = slug
    AND activo = true
);
