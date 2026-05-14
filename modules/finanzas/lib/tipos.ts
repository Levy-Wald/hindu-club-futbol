export type TipoCaja = 'efectivo' | 'banco' | 'digital' | 'mercadopago' | 'cripto' | 'tarjeta' | 'otro' | 'otros'
export type TipoFiscalCaja = 'blanco' | 'negro' | 'mixto'

export const TIPOS_CAJA: { value: TipoCaja; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'banco', label: 'Banco' },
  { value: 'mercadopago', label: 'MercadoPago' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otros', label: 'Otros' },
]

export const TIPOS_FISCAL: { value: TipoFiscalCaja; label: string; color: string }[] = [
  { value: 'blanco', label: 'Blanco', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: 'negro', label: 'Negro', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'mixto', label: 'Mixto', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
]

export const MONEDAS = ['ARS', 'USD', 'EUR', 'BRL', 'UYU', 'CLP'] as const
