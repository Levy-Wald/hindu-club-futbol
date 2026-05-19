-- B12.3: Agregar 25 modulos del roadmap RFC-005 v2.0 al catalogo_modulos
-- Todos con activo_global = false (proximamente)
-- Aplicado originalmente via MCP Supabase el 2026-05-18

INSERT INTO catalogo_modulos (slug, nombre, descripcion, categoria, capa, activo_global, beta, orden) VALUES
  -- Conectores (capa integracion)
  ('conector_whatsapp', 'Conector WhatsApp Business', 'K2 - WhatsApp Business API', 'conector', 'integracion', false, false, 900),
  ('conector_afip', 'Conector AFIP', 'K4 - Facturación electrónica AR', 'conector', 'integracion', false, false, 901),
  ('conector_stripe', 'Conector Stripe', 'K5 - Cobros internacionales', 'conector', 'integracion', false, false, 902),
  ('conector_gcal', 'Conector Google Calendar', 'K6 - Sync calendars', 'conector', 'integracion', false, false, 903),
  ('conector_tiendanube', 'Conector Tiendanube/Shopify', 'K7', 'conector', 'integracion', false, false, 904),
  ('conector_cloudflare_r2', 'Conector Cloudflare R2', 'K8 - Storage', 'conector', 'integracion', false, false, 905),
  ('conector_document_ai', 'Conector Document AI', 'K9 - OCR', 'conector', 'integracion', false, false, 906),
  ('conector_brevo', 'Conector Brevo', 'K12 - Email alternativo', 'conector', 'integracion', false, false, 907),
  ('conector_telegram', 'Conector Telegram Bot', 'K13', 'conector', 'integracion', false, false, 908),
  -- Verticales (cada uno en su capa)
  ('vertical_country', 'Vertical Country / Barrio Privado', 'E0 - Lotes, expensas, control acceso', 'vertical', 'vertical_country', false, false, 1000),
  ('vertical_arquitectura', 'Vertical Arquitectura', 'E1 - Estudios, obras, subcontratistas', 'vertical', 'vertical_arquitectura', false, false, 1001),
  ('vertical_abogacia', 'Vertical Abogacía', 'E2 - Casos, audiencias, honorarios', 'vertical', 'vertical_abogacia', false, false, 1002),
  ('vertical_publicidad', 'Vertical Publicidad', 'E3 - Cuentas, briefings, campañas', 'vertical', 'vertical_publicidad', false, false, 1003),
  ('vertical_retail', 'Vertical Retail', 'E4 - Sucursales, promos, e-commerce', 'vertical', 'vertical_retail', false, false, 1004),
  -- Plataforma SaaS
  ('saas_marketplace', 'Marketplace de módulos', 'P3 - Activar/desactivar módulos por tenant', 'plataforma', 'plataforma_saas', false, false, 1100),
  ('saas_billing', 'Billing plataforma', 'P4 - Cobros internos plataforma → tenants', 'plataforma', 'plataforma_saas', false, false, 1101),
  ('saas_super_admin', 'Super-admin global', 'P5 - Vista plataforma cross-tenants', 'plataforma', 'plataforma_saas', false, false, 1102),
  ('saas_white_label', 'White-label / Branding tenant', 'P7', 'plataforma', 'plataforma_saas', false, false, 1103),
  -- API + Agent
  ('api_rest_publica', 'API REST pública', 'API2 - Endpoints CRUD', 'integracion', 'integracion', false, false, 1200),
  ('webhooks_salientes', 'Webhooks salientes', 'API3', 'integracion', 'integracion', false, false, 1201),
  ('agent_connector', 'Agent Connector layer', 'AG1 - Memory context para agents', 'integracion', 'integracion', false, false, 1202),
  ('mcp_server_publico', 'MCP Server oficial SaaS', 'AG2', 'integracion', 'integracion', false, false, 1203),
  -- IA nativa
  ('ia_asistente_embebido', 'Asistente IA embebido', 'AI1 - Por vertical + RAG', 'ia', 'ia_nativa', false, false, 1300),
  ('ia_resumen_ejecutivo', 'Resumen ejecutivo IA', 'AI6 - Widget Mi Día', 'ia', 'ia_nativa', false, false, 1301),
  ('ia_acciones_voz_wa', 'Acciones por voz WhatsApp', 'AI7', 'ia', 'ia_nativa', false, false, 1302)
ON CONFLICT (slug) DO NOTHING;
