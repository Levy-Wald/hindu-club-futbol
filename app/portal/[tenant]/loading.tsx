import { LoadingSkeleton } from '@/components/loaders/loading-skeleton'

// El layout del portal (PortalShell: header + bottom-nav) se mantiene; solo el
// contenido muestra el skeleton mientras carga la página (mejor percepción en
// Android gama baja, target del proyecto).
export default function PortalLoading() {
  return <LoadingSkeleton variant="cards" />
}
