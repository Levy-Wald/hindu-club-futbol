// Slug canónico para nombres (entidades, proveedores, etc.): minúsculas, sin
// acentos, separadores → guion, sin guiones colgantes.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
