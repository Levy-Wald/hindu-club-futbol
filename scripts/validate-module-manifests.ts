/**
 * validate-module-manifests.ts
 *
 * Validates all modules/<slug>/module.json manifests for:
 * 1. Required fields present
 * 2. No overlapping owns_tables between modules
 * 3. depends_on_modules references only existing slugs
 * 4. Directory structure matches manifest
 */

import * as fs from 'fs'
import * as path from 'path'

const MODULES_DIR = path.resolve(__dirname, '..', 'modules')

interface ModuleManifest {
  slug: string
  name: string
  version: string
  category: string
  portable: boolean
  owner: string
  depends_on_troncal: string[]
  depends_on_modules: string[]
  soft_depends_on_modules: string[]
  owns_tables: string[]
  owns_catalogs: string[]
  permissions_required: string[]
  events_emits: string[]
  events_consumes: string[]
  ui_routes: string[]
  api_endpoints: string[]
  replaceable_by_external: boolean
  [key: string]: unknown
}

const REQUIRED_FIELDS = [
  'slug', 'name', 'version', 'category', 'portable',
  'depends_on_troncal', 'depends_on_modules', 'soft_depends_on_modules',
  'owns_tables', 'owns_catalogs', 'permissions_required',
  'events_emits', 'events_consumes', 'ui_routes', 'api_endpoints',
  'replaceable_by_external',
]

let errors = 0
let warnings = 0

function error(msg: string) {
  console.error(`  ERROR: ${msg}`)
  errors++
}

function warn(msg: string) {
  console.warn(`  WARN: ${msg}`)
  warnings++
}

// Discover all module slugs
const moduleDirs = fs.readdirSync(MODULES_DIR).filter((d) =>
  fs.statSync(path.join(MODULES_DIR, d)).isDirectory()
)

const allSlugs = new Set(moduleDirs)
const manifests: Map<string, ModuleManifest> = new Map()

// Phase 1: Load and validate individual manifests
for (const slug of moduleDirs) {
  const manifestPath = path.join(MODULES_DIR, slug, 'module.json')
  console.log(`\nValidating ${slug}...`)

  if (!fs.existsSync(manifestPath)) {
    error(`Missing module.json`)
    continue
  }

  let manifest: ModuleManifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch (e) {
    error(`Invalid JSON: ${(e as Error).message}`)
    continue
  }

  // Check slug matches directory
  if (manifest.slug !== slug) {
    error(`slug "${manifest.slug}" does not match directory "${slug}"`)
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in manifest)) {
      error(`Missing required field: ${field}`)
    }
  }

  // Check array fields are arrays
  const arrayFields = [
    'depends_on_troncal', 'depends_on_modules', 'soft_depends_on_modules',
    'owns_tables', 'owns_catalogs', 'permissions_required',
    'events_emits', 'events_consumes', 'ui_routes', 'api_endpoints',
  ]
  for (const field of arrayFields) {
    if (field in manifest && !Array.isArray(manifest[field as keyof ModuleManifest])) {
      error(`Field "${field}" must be an array`)
    }
  }

  // Check depends_on_modules references valid slugs
  for (const dep of manifest.depends_on_modules ?? []) {
    if (!allSlugs.has(dep)) {
      error(`depends_on_modules references unknown slug: "${dep}"`)
    }
    if (dep === slug) {
      error(`depends_on_modules references itself`)
    }
  }

  for (const dep of manifest.soft_depends_on_modules ?? []) {
    if (!allSlugs.has(dep)) {
      warn(`soft_depends_on_modules references unknown slug: "${dep}"`)
    }
  }

  manifests.set(slug, manifest)
}

// Phase 2: Check for overlapping owns_tables
const tableOwners = new Map<string, string>()
for (const [slug, manifest] of manifests) {
  for (const table of [...(manifest.owns_tables ?? []), ...(manifest.owns_catalogs ?? [])]) {
    if (tableOwners.has(table)) {
      error(`Table "${table}" claimed by both "${tableOwners.get(table)}" and "${slug}"`)
    } else {
      tableOwners.set(table, slug)
    }
  }
}

// Summary
console.log(`\n${'='.repeat(50)}`)
console.log(`Modules validated: ${moduleDirs.length}`)
console.log(`Errors: ${errors}`)
console.log(`Warnings: ${warnings}`)

if (errors > 0) {
  process.exit(1)
}
