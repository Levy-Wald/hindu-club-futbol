/**
 * Registry de catálogos editables.
 * Cada entrada define la tabla, su PK pattern, y columnas editables.
 */

export interface CatalogoColumn {
  key: string
  label: string
  type: 'text' | 'boolean' | 'number'
  required?: boolean
  editable?: boolean
}

export interface CatalogoDef {
  slug: string
  label: string
  table: string
  /** 'slug' = PK is slug text, 'uuid' = PK is id uuid + tenant_id */
  pkType: 'slug' | 'uuid'
  description: string
  columns: CatalogoColumn[]
  /** If true, records can be deactivated but not deleted */
  softDeleteOnly?: boolean
}

export const CATALOGOS: CatalogoDef[] = [
  {
    slug: 'disciplinas',
    label: 'Disciplinas',
    table: 'catalogo_disciplinas',
    pkType: 'slug',
    description: 'Disciplinas deportivas disponibles en el club',
    columns: [
      { key: 'slug', label: 'Slug', type: 'text', required: true, editable: false },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'categoria', label: 'Categoría', type: 'text', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    softDeleteOnly: true,
  },
  {
    slug: 'tipos-socio',
    label: 'Tipos de socio',
    table: 'catalogo_tipos_socio',
    pkType: 'uuid',
    description: 'Tipos de socio configurables por tenant',
    columns: [
      { key: 'slug', label: 'Slug', type: 'text', required: true, editable: false },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'descripcion', label: 'Descripción', type: 'text', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
  },
  {
    slug: 'tipos-talle',
    label: 'Tipos de talle',
    table: 'catalogo_tipos_talle',
    pkType: 'slug',
    description: 'Tipos de talle para indumentaria (remera, calzado, etc.)',
    columns: [
      { key: 'slug', label: 'Slug', type: 'text', required: true, editable: false },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'descripcion', label: 'Descripción', type: 'text', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    softDeleteOnly: true,
  },
  {
    slug: 'motivos-baja',
    label: 'Motivos de baja',
    table: 'catalogo_motivos_baja',
    pkType: 'slug',
    description: 'Motivos por los cuales se da de baja a una persona',
    columns: [
      { key: 'slug', label: 'Slug', type: 'text', required: true, editable: false },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'descripcion', label: 'Descripción', type: 'text', editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    softDeleteOnly: true,
  },
  {
    slug: 'tipos-documento',
    label: 'Tipos de documento',
    table: 'catalogo_tipos_documento',
    pkType: 'slug',
    description: 'Tipos de documento de identidad',
    columns: [
      { key: 'slug', label: 'Slug', type: 'text', required: true, editable: false },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    softDeleteOnly: true,
  },
  {
    slug: 'tipos-vinculo',
    label: 'Tipos de vínculo',
    table: 'catalogo_tipos_vinculo',
    pkType: 'slug',
    description: 'Tipos de vínculo entre personas (familiar, legal, etc.)',
    columns: [
      { key: 'slug', label: 'Slug', type: 'text', required: true, editable: false },
      { key: 'nombre', label: 'Nombre', type: 'text', required: true, editable: true },
      { key: 'categoria', label: 'Categoría', type: 'text', required: true, editable: true },
      { key: 'activo', label: 'Activo', type: 'boolean', editable: true },
    ],
    softDeleteOnly: true,
  },
]

export function getCatalogoDef(slug: string): CatalogoDef | undefined {
  return CATALOGOS.find((c) => c.slug === slug)
}
