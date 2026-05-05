import { Label } from '@/components/ui/label'
import type { EditarPersonaInput } from '../../../_lib/schemas'

export interface SeccionProps {
  form: EditarPersonaInput
  update: (field: keyof EditarPersonaInput, value: string | number | boolean | null) => void
  s: (field: keyof EditarPersonaInput) => string
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/90">{label}</Label>
      {children}
    </div>
  )
}

export const PAISES = [
  { value: 'AR', label: 'Argentina' }, { value: 'UY', label: 'Uruguay' },
  { value: 'BR', label: 'Brasil' }, { value: 'CL', label: 'Chile' },
  { value: 'PY', label: 'Paraguay' }, { value: 'BO', label: 'Bolivia' },
  { value: 'PE', label: 'Perú' }, { value: 'CO', label: 'Colombia' },
  { value: 'VE', label: 'Venezuela' }, { value: 'EC', label: 'Ecuador' },
  { value: 'MX', label: 'México' }, { value: 'ES', label: 'España' },
  { value: 'IT', label: 'Italia' }, { value: 'US', label: 'Estados Unidos' },
  { value: 'GB', label: 'Reino Unido' }, { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Alemania' }, { value: 'OTRO', label: 'Otro' },
]

export const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
]

export const IDIOMAS = [
  { value: 'es', label: 'Español' }, { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' }, { value: 'fr', label: 'Francés' },
  { value: 'it', label: 'Italiano' }, { value: 'de', label: 'Alemán' },
  { value: 'otro', label: 'Otro' },
]

export const DEPORTES = [
  { value: 'hockey', label: 'Hockey' }, { value: 'rugby', label: 'Rugby' },
  { value: 'futbol', label: 'Fútbol' }, { value: 'tenis', label: 'Tenis' },
  { value: 'padel', label: 'Pádel' }, { value: 'natacion', label: 'Natación' },
  { value: 'golf', label: 'Golf' }, { value: 'squash', label: 'Squash' },
  { value: 'voley', label: 'Vóley' }, { value: 'basket', label: 'Básquet' },
  { value: 'atletismo', label: 'Atletismo' }, { value: 'polo', label: 'Polo' },
  { value: 'cricket', label: 'Cricket' }, { value: 'softbol', label: 'Softbol' },
  { value: 'otro', label: 'Otro' },
]
