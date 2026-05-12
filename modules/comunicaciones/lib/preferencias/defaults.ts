import type { CategoriaContenido } from './tipos'

export const PREFERENCIAS_DEFAULT = {
  idioma_preferido: 'es-AR',
  canal_preferido: 'whatsapp',
  canal_emergencia: null as string | null,
  horario_preferido_inicio: '09:00:00',
  horario_preferido_fin: '21:00:00',
  dias_no_contactar: [] as string[],
  opt_in_marketing: false,
  opt_in_eventos_club: true,
  opt_in_partners: false,
  opt_in_torneos: true,
  frecuencia_resumen: 'semanal',
  recibe_factura_papel: false,
  recibe_revista_papel: false,
}

export const CATEGORIA_TO_OPTIN: Record<CategoriaContenido, string | null> = {
  transaccional: null,
  eventos_club: 'opt_in_eventos_club',
  marketing: 'opt_in_marketing',
  partners: 'opt_in_partners',
  torneos: 'opt_in_torneos',
}

export const TZ_ARGENTINA = 'America/Argentina/Buenos_Aires'
// TODO FASE 12: timezone por tenant
