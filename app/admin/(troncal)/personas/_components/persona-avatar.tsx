import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface PersonaAvatarProps {
  nombre: string
  apellido: string
  className?: string
}

export function PersonaAvatar({ nombre, apellido, className }: PersonaAvatarProps) {
  const initials = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  return (
    <Avatar className={className}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}
