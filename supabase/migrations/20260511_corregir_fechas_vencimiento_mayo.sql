-- Corrección operativa: fecha de vencimiento del plan Fondo Fútbol 2026
-- estaba en día 10 (placeholder), se actualizó a día 3 según definición de Yair.
-- Las 51 cuotas ya emitidas se actualizaron a fecha_vencimiento = 2026-05-03.

UPDATE cuotas_emitidas
SET fecha_vencimiento = '2026-05-03',
    estado = CASE WHEN estado = 'pendiente' THEN 'vencida' ELSE estado END,
    updated_at = now()
WHERE tenant_id='11111111-1111-1111-1111-111111111111'
  AND periodo='2026-05'
  AND estado IN ('pendiente', 'vencida');
