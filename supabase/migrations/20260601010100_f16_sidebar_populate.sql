-- F1.6 (RFC-006): población de ruta_bo / icono / capability_requerida
--
-- Fuente: el sidebar hardcodeado actual (lib/navigation/sidebar-items.ts), que
-- ya apunta a rutas reales y verificadas. Solo se pueblan módulos con página
-- existente; los inciertos quedan en ruta_bo NULL → el render NO los dibuja
-- (se habilitan cuando tengan página). Idempotente vía UPDATE ... FROM (VALUES).
--
-- Las rutas se guardan SIN el segmento de tenant; el render inyecta /admin/{tenant}.

UPDATE catalogo_modulos AS c
SET ruta_bo = v.ruta_bo,
    icono = v.icono,
    capability_requerida = v.capability_requerida
FROM (VALUES
  -- slug, ruta_bo (sin tenant), icono, capability_requerida (NULL = sin gate)
  -- ── inicio ──
  ('notificaciones',        '/admin/notificaciones',                 'Bell',          NULL),
  -- ── personas ──
  ('acceso',                '/admin/acceso',                         'KeyRound',      NULL),
  ('datos_medicos',         '/admin/salud',                          'Heart',         'ccbp.salud.read_basic'),
  ('salud',                 '/admin/salud',                          'Heart',         'ccbp.salud.read_basic'),
  ('nominas_externas',      '/admin/nominas-externas',               'FileSpreadsheet', NULL),
  ('concesiones',           '/admin/concesiones',                    'Store',         NULL),
  ('rrhh',                  '/admin/rrhh',                           'Briefcase',     'rrhh.read'),
  ('rrhh_basico',           '/admin/rrhh',                           'Briefcase',     'rrhh.read'),
  ('solicitudes',           '/admin/solicitudes',                    'Inbox',         NULL),
  ('cuotas_recurrentes',    '/admin/membresias',                     'IdCard',        NULL),
  ('socios',                '/admin/membresias',                     'IdCard',        NULL),
  ('utileria',              '/admin/utileria',                       'Shirt',         NULL),
  -- ── actividad ──
  ('equipos',               '/admin/equipos',                        'Users2',        NULL),
  ('planificadores',        '/admin/planificadores/semanal',         'CalendarRange', NULL),
  ('asistencias',           '/admin/planificadores/semanal',         'ClipboardCheck', NULL),
  ('entrenamientos',        '/admin/planificadores/semanal?tipo=entrenamiento', 'Dumbbell', NULL),
  ('partidos',              '/admin/competencias/partidos',          'Trophy',        NULL),
  ('amistosos',             '/admin/planificadores/semanal?tipo=amistoso', 'Swords',  NULL),
  ('tactica',               '/admin/planificadores/semanal?tipo=partido,amistoso', 'Target', NULL),
  ('competencias',          '/admin/competencias/torneos',           'Award',         NULL),
  ('torneos',               '/admin/competencias/torneos',           'Award',         NULL),
  ('scouting',              '/admin/operaciones/scouting',           'Search',        'ccbp.scouting.read'),
  -- 'disciplinas' / 'disciplina_futbol' sin página propia todavía → ruta_bo NULL (no se renderizan)
  ('eventos_calendario',    '/admin/calendario',                     'Calendar',      NULL),
  -- ── marketing ──
  ('comunicaciones_masivas','/admin/comunicaciones',                 'MessageSquare', NULL),
  ('comunicaciones_web',    '/admin/comunicaciones',                 'MessageSquare', NULL),
  ('pre_inscripciones',     '/admin/pre-inscripciones',              'UserPlus',      NULL),
  -- ── finanzas ──
  ('finanzas',              '/admin/finanzas',                       'TrendingUp',    'finanzas.read'),
  ('caja_multiarea',        '/admin/cajas',                          'Banknote',      'finanzas.read'),
  -- ── recursos ──
  ('pim',                   '/admin/productos',                      'Package',       'pim.read'),
  ('reservas',              '/admin/reservas',                       'LandPlot',      NULL),
  ('espacios_fisicos',      '/admin/configuracion/espacios',         'LayoutGrid',    'setup.tenant'),
  ('diagramacion_club',     '/admin/club/mapa',                      'Map',           'ccbp.mapa.admin'),
  ('proyectos',             '/admin/proyectos',                      'FolderKanban',  'proyectos.read'),
  -- 'proveedores' sin página propia todavía → ruta_bo NULL (no se renderiza)
  -- ── configuracion (integraciones reales) ──
  ('saas_marketplace',      '/admin/marketplace',                    'Boxes',         'setup.modulos')
) AS v(slug, ruta_bo, icono, capability_requerida)
WHERE c.slug = v.slug;

-- Sub-items de Finanzas (el módulo finanzas agrupa varias páginas contables).
-- "Cajas" no va acá: lo cubre el módulo caja_multiarea (/admin/cajas).
UPDATE catalogo_modulos
SET sidebar_subitems = '[
  {"label": "Reportes contables",  "ruta_bo": "/admin/finanzas/reportes/libro-mayor",      "icono": "FileText",     "capability_requerida": "finanzas.read",        "orden": 30},
  {"label": "Conciliación bancaria","ruta_bo": "/admin/finanzas/conciliacion",             "icono": "GitMerge",     "capability_requerida": "finanzas.conciliacion","orden": 40},
  {"label": "Plan de cuentas",     "ruta_bo": "/admin/finanzas/plan-cuentas",              "icono": "BookOpen",     "capability_requerida": "finanzas.admin",       "orden": 50},
  {"label": "Períodos contables",  "ruta_bo": "/admin/finanzas/periodos",                  "icono": "CalendarDays", "capability_requerida": "finanzas.admin",       "orden": 60}
]'::jsonb
WHERE slug = 'finanzas';

-- Sub-items de Productos (PIM).
UPDATE catalogo_modulos
SET sidebar_subitems = '[
  {"label": "Categorías",       "ruta_bo": "/admin/productos/categorias",     "icono": "FolderTree", "capability_requerida": "pim.read", "orden": 20},
  {"label": "Marcas",           "ruta_bo": "/admin/productos/marcas",         "icono": "Bookmark",   "capability_requerida": "pim.read", "orden": 30},
  {"label": "Listas de precios","ruta_bo": "/admin/productos/listas-precios",  "icono": "Tag",        "capability_requerida": "pim.read", "orden": 40}
]'::jsonb
WHERE slug = 'pim';
