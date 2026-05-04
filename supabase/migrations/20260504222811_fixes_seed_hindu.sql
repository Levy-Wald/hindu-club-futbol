-- =============================================================================
-- 0003_fixes_seed_hindu
-- =============================================================================
-- Correcciones al seed Hindu aplicado en 20260504222333_seed_hindu.sql
--
-- Fix 1: agregar atributo admin_padron faltante para Lavagno
--        (Code metió mal un unnest con LIMIT 1 -> solo cargó 'staff')
--
-- Fix 2: corregir tipo de sede Country (residencial -> mixta)
--        Hindu Country tiene cancha de fútbol, piscina y actividades sociales.
--        'residencial' es un barrio cerrado, no aplica. 'mixta' captura
--        deportiva + social.
--
-- Fix 3: BUG ARQUITECTÓNICO en trigger de audit en tabla tenants.
--        La función trg_audit_log_personas referencia NEW.tenant_id, pero
--        la tabla tenants no tiene esa columna (es la tabla DE tenants).
--        Cualquier INSERT/UPDATE/DELETE en tenants fallaba.
--        Solución: función específica trg_audit_log_tenants que usa NEW.id
--        como tenant_id (el tenant es el propio registro).
-- =============================================================================

-- FIX 1: Atributo admin_padron para Lavagno
INSERT INTO personas_atributos (persona_id, atributo_slug, tenant_id, activo)
VALUES (
  '6d5d82df-a720-461a-862a-587d4664433f',
  'admin_padron',
  '11111111-1111-1111-1111-111111111111',
  true
);

-- FIX 2: Sede Country pasa a mixta
UPDATE sedes
SET tipo = 'mixta'
WHERE id = '64a9cfc2-ccc9-4925-a967-e9d8fd227c8f';

-- FIX 3: Función específica de audit para tenants
CREATE OR REPLACE FUNCTION public.trg_audit_log_tenants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_actor_persona_id uuid;
  v_cambios jsonb;
BEGIN
  SELECT get_persona_actual() INTO v_actor_persona_id;

  IF TG_OP = 'INSERT' THEN
    v_cambios := jsonb_build_object('nuevo', to_jsonb(NEW));
    INSERT INTO audit_log (tenant_id, actor_persona_id, actor_user_id, actor_tipo, accion, tabla, registro_id, cambios)
    VALUES (NEW.id, v_actor_persona_id, auth.uid(), 'usuario', 'INSERT', TG_TABLE_NAME, NEW.id, v_cambios);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_cambios := jsonb_build_object('anterior', to_jsonb(OLD), 'nuevo', to_jsonb(NEW));
    INSERT INTO audit_log (tenant_id, actor_persona_id, actor_user_id, actor_tipo, accion, tabla, registro_id, cambios)
    VALUES (NEW.id, v_actor_persona_id, auth.uid(), 'usuario', 'UPDATE', TG_TABLE_NAME, NEW.id, v_cambios);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_cambios := jsonb_build_object('eliminado', to_jsonb(OLD));
    INSERT INTO audit_log (tenant_id, actor_persona_id, actor_user_id, actor_tipo, accion, tabla, registro_id, cambios)
    VALUES (OLD.id, v_actor_persona_id, auth.uid(), 'usuario', 'DELETE', TG_TABLE_NAME, OLD.id, v_cambios);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- Reemplazar trigger en tenants
DROP TRIGGER IF EXISTS tenants_audit ON tenants;
CREATE TRIGGER tenants_audit
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH ROW EXECUTE FUNCTION trg_audit_log_tenants();
