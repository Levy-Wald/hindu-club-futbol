'use strict'

const fs = require('fs')
const path = require('path')

// Cache for parsed module.json manifests: slug -> manifest object (or null if not found)
const manifestCache = new Map()

/**
 * Map from admin route folder names to module slugs.
 * A folder that maps to null or is absent from this map is treated as troncal
 * (not a module) and is skipped entirely.
 *
 * Naming convention: hyphens in folder names become underscores in slugs.
 * Some folders live under sub-paths (e.g. operaciones/equipos) but Next.js
 * flattens them, so we only track the leaf folder name here.
 */
const FOLDER_TO_SLUG = {
  // Modules with matching slug
  acceso: 'acceso',
  comunicaciones: 'comunicaciones',
  competencias: 'competencias',
  concesiones: 'concesiones',
  disciplinas: 'disciplinas',
  equipos: 'equipos',
  eventos: 'eventos_calendario',
  notificaciones: 'notificaciones',
  partidos: 'partidos',
  'pre-inscripciones': 'pre_inscripciones',
  proveedores: 'proveedores',
  rrhh: 'rrhh',
  salud: 'salud',
  scouting: 'scouting',
  socios: 'socios',
  solicitudes: 'solicitudes',
  talles: 'talles',
  utileria: 'utileria',
}

/**
 * Admin folders that are part of the tronco (not modules).
 * Imports from/to these folders are not subject to this rule.
 */
const TRONCAL_FOLDERS = new Set([
  'personas',
  'finanzas',
  'padrones',
  'configuracion',
  'imports',
  'dashboard',
  'operaciones',
  'admin',
])

/**
 * Resolve the repo root directory from this rule file's location.
 * This file lives at <repo-root>/eslint-rules/no-cross-module-imports.js
 */
const REPO_ROOT = path.resolve(__dirname, '..')

/**
 * Load and cache the module.json manifest for a given slug.
 * Returns the parsed object, or null if the file does not exist.
 *
 * @param {string} slug
 * @returns {object|null}
 */
function loadManifest(slug) {
  if (manifestCache.has(slug)) {
    return manifestCache.get(slug)
  }
  const manifestPath = path.join(REPO_ROOT, 'modules', slug, 'module.json')
  let manifest = null
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    } catch (_err) {
      // Malformed JSON — treat as if no manifest
      manifest = null
    }
  }
  manifestCache.set(slug, manifest)
  return manifest
}

/**
 * Given an absolute file path, extract the admin module folder name if the
 * file lives inside /app/admin/<module>/.
 *
 * Returns the first path segment after /app/admin/ (leaf folder name), or
 * null if the file is not inside an admin module directory.
 *
 * @param {string} filePath  Absolute path to the file being linted.
 * @returns {string|null}
 */
function getAdminFolderFromFilePath(filePath) {
  // Normalize separators for cross-platform safety
  const normalized = filePath.split(path.sep).join('/')
  const match = normalized.match(/\/app\/admin\/([^/]+)/)
  if (!match) return null
  return match[1]
}

/**
 * Given an import source string and the directory of the importing file,
 * extract the admin module folder name of the imported target, if any.
 *
 * Supports:
 *   - Relative paths:  '../other-module/...'  '../../other-module/...'
 *   - Alias paths:     '@/app/admin/other-module/...'
 *
 * Returns the leaf admin folder name of the target, or null if the import
 * does not resolve to an admin module path.
 *
 * @param {string} importSource  The raw import source string.
 * @param {string} importerDir   Absolute directory of the importing file.
 * @returns {string|null}
 */
function getTargetAdminFolder(importSource, importerDir) {
  let resolvedPath

  if (importSource.startsWith('@/app/admin/')) {
    // Alias-based import: @/app/admin/<folder>/...
    const rest = importSource.slice('@/app/admin/'.length)
    const firstSegment = rest.split('/')[0]
    return firstSegment || null
  }

  if (importSource.startsWith('.')) {
    // Relative import — resolve it against the importer's directory
    resolvedPath = path.resolve(importerDir, importSource)
    const normalized = resolvedPath.split(path.sep).join('/')
    const match = normalized.match(/\/app\/admin\/([^/]+)/)
    if (!match) return null
    return match[1]
  }

  return null
}

// ---------------------------------------------------------------------------
// ESLint rule definition
// ---------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow cross-module imports not declared in module.json',
      category: 'Best Practices',
    },
    schema: [],
    // severity is advisory — reporters see it as a warning
    messages: {
      undeclaredDependency:
        'Module "{{source}}" imports from module "{{target}}" but does not declare it in depends_on_modules or soft_depends_on_modules of its module.json',
    },
  },

  create(context) {
    const filePath = context.getFilename()

    // 1. Is the file inside /app/admin/<folder>/?
    const sourceFolder = getAdminFolderFromFilePath(filePath)
    if (!sourceFolder) return {}

    // 2. Is the source folder a known module (not troncal)?
    if (TRONCAL_FOLDERS.has(sourceFolder)) return {}

    const sourceSlug = FOLDER_TO_SLUG[sourceFolder]
    if (!sourceSlug) return {}

    // 3. Load the source module's manifest
    const sourceManifest = loadManifest(sourceSlug)

    // 4. Build the set of declared module dependencies
    const declaredDeps = new Set([
      ...(sourceManifest ? sourceManifest.depends_on_modules || [] : []),
      ...(sourceManifest ? sourceManifest.soft_depends_on_modules || [] : []),
    ])

    const importerDir = path.dirname(filePath)

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value
        if (typeof importSource !== 'string') return

        // 5. Determine the target admin folder
        const targetFolder = getTargetAdminFolder(importSource, importerDir)
        if (!targetFolder) return

        // 6. Skip if source and target are the same module
        if (targetFolder === sourceFolder) return

        // 7. Skip if target is troncal
        if (TRONCAL_FOLDERS.has(targetFolder)) return

        // 8. Resolve target slug
        const targetSlug = FOLDER_TO_SLUG[targetFolder]
        if (!targetSlug) return

        // 9. Skip if target is the same module (slug-level check)
        if (targetSlug === sourceSlug) return

        // 10. Check declaration
        if (!declaredDeps.has(targetSlug)) {
          context.report({
            node,
            messageId: 'undeclaredDependency',
            data: {
              source: sourceSlug,
              target: targetSlug,
            },
          })
        }
      },
    }
  },
}
